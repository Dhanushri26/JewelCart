import { randomUUID } from "node:crypto";
import { 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  QueryCommand 
} from "@aws-sdk/lib-dynamodb";
import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getDbClient,
  getPathParam,
  parseJsonBody,
  parseIdempotencyKey,
  checkOrAcquireLock,
  releaseOrResolveLock,
} from "./shared.js";

// Note: Decoupled direct inventory imports. Stock initialization should 
// be handled asynchronously via EventBridge / SNS when a product is created.

const MAX_TITLE_LENGTH = 200;
const MAX_PRODUCT_ID_LENGTH = 128;
const VALID_TRACK_TYPES = new Set(["UNIQUE", "BULK"]);

// ==========================================
// BUSINESS LOGIC & PERMISSION HELPERS
// ==========================================
const normalizeTitle = (title) => title.trim().toLowerCase();
const canViewB2bProducts = (user) => user.isAdmin || user.isBusiness;
const canModifyProduct = (user) => user.isAdmin || user.isBusiness;

const ownsProduct = (user, product) => {
  if (user.isAdmin) return true;
  if (!user.isBusiness || !user.businessId) return false;
  return product.businessId === user.businessId;
};

// ==========================================
// VALIDATION ENGINE
// ==========================================
const validateTitle = (t, { required = false } = {}) => {
  if (t === undefined || t === null) return required ? "title is required" : null;
  if (typeof t !== "string") return "title must be a string";
  if (!t.trim()) return "title cannot be empty";
  if (t.trim().length > MAX_TITLE_LENGTH) return `title must be at most ${MAX_TITLE_LENGTH} characters`;
  return null;
};

const validateMsrp = (m, { required = false } = {}) => {
  if (m === undefined || m === null) return required ? "msrp is required" : null;
  if (typeof m !== "number" || !Number.isFinite(m)) return "msrp must be a finite number";
  if (m <= 0) return "msrp must be greater than 0";
  return null;
};

const validateTrackType = (tt, { required = false } = {}) => {
  if (tt === undefined || tt === null) return required ? "track_type is required" : null;
  if (typeof tt !== "string" || !VALID_TRACK_TYPES.has(tt)) {
    return `track_type must be one of: ${[...VALID_TRACK_TYPES].join(", ")}`;
  }
  return null;
};

const validateProductId = (id) => {
  if (id === undefined || id === null) return null;
  if (typeof id !== "string" || !id.trim()) return "id must be a non-empty string";
  if (id.length > MAX_PRODUCT_ID_LENGTH) return `id must be at most ${MAX_PRODUCT_ID_LENGTH} characters`;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return "id may only contain letters, numbers, underscores, and hyphens";
  return null;
};

const validateTiers = (tiers) => {
  if (tiers === undefined) return null;
  if (!Array.isArray(tiers)) return "tiers must be an array";
  
  const seenRatings = new Set();
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (!tier || typeof tier !== "object") return `tiers[${i}] must be an object`;
    if (!tier.org_rating?.trim()) return `tiers[${i}].org_rating is required and non-empty`;
    if (seenRatings.has(tier.org_rating)) return `tiers[${i}].org_rating must be unique`;
    seenRatings.add(tier.org_rating);

    const minQty = Number(tier.min_qty);
    if (!Number.isInteger(minQty) || minQty <= 0) return `tiers[${i}].min_qty must be a positive integer`;
    const price = Number(tier.custom_price);
    if (!Number.isFinite(price) || price <= 0) return `tiers[${i}].custom_price must be a positive number`;
  }
  return null;
};

const validateCreateBody = (body) => [
  validateTitle(body.title, { required: true }),
  validateMsrp(body.msrp, { required: true }),
  validateTrackType(body.track_type),
  validateProductId(body.id),
  validateTiers(body.tiers)
].filter(Boolean);

// ==========================================
// DYNAMODB DUPLICATE CHECK INDEX
// ==========================================
// Crucial: Assumes a Global Secondary Index (GSI) named "titleNormalized-index" 
// with partition key "titleNormalized" exists to ensure global uniqueness.
const checkTitleDuplicate = async (docClient, tableName, titleNormalized, excludeId) => {
  const result = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: "titleNormalized-index",
    KeyConditionExpression: "titleNormalized = :tn",
    ExpressionAttributeValues: { ":tn": titleNormalized }
  }));
  
  const match = result.Items?.find(item => item.id !== excludeId && item.isDeleted !== true);
  return match ? { field: "title", value: match.title } : null;
};

// ==========================================
// MAIN AWS LAMBDA HANDLER
// ==========================================
export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod || event?.requestContext?.http?.method;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);
    const { docClient, tableName } = getDbClient();

    // ------------------------------------------
    // GET /products (List Catalogue)
    // ------------------------------------------
    if (method === "GET" && path === "/products") {
      // For clean single table operations, it is optimal to search using a GSI 
      // or filter using a clean scan expression for the "METADATA" SK rows.
      const scanParams = {
        TableName: tableName,
        FilterExpression: "SK = :sk AND attribute_not_exists(isDeleted)",
        ExpressionAttributeValues: { ":sk": "METADATA" }
      };

      if (!canViewB2bProducts(userContext)) {
        scanParams.FilterExpression += " AND is_b2b_only = :b2b";
        scanParams.ExpressionAttributeValues[":b2b"] = false;
      }

      let data;

try {

    data = await docClient.send(
        new QueryCommand({

            TableName: tableName,

            IndexName: "SK-index",

            KeyConditionExpression: "SK = :sk",

            FilterExpression:
                "attribute_not_exists(isDeleted)" +
                (!canViewB2bProducts(userContext)
                    ? " AND is_b2b_only = :b2b"
                    : ""),

            ExpressionAttributeValues: {

                ":sk": "METADATA",

                ...(!canViewB2bProducts(userContext)
                    ? { ":b2b": false }
                    : {}),

            },

        })
    );

} catch {

    // Fallback if the index is unavailable

    data = {
        Items: [],
    };

}

      return buildResponse(200, { items: data.Items || [] });
    }

    // ------------------------------------------
    // GET /products/{id} (Retrieve Item Details)
    // ------------------------------------------
    if (method === "GET" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product id is required");

      // Fetch metadata and tiers concurrently using a Query on the primary PK partitioning
      const result = await docClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `PRODUCT#${productId}` }
      }));

      const items = result.Items || [];
      const metadata = items.find(i => i.SK === "METADATA");

      if (!metadata || metadata.isDeleted === true) {
        return createErrorResponse(404, "Product not found");
      }

      if (!canViewB2bProducts(userContext) && metadata.is_b2b_only) {
        return createErrorResponse(404, "Product not found");
      }

      const responsePayload = { ...metadata };
      if (canViewB2bProducts(userContext)) {
        responsePayload.b2b_tiers = items.filter(i => i.SK.startsWith("TIER#"));
      }

      return buildResponse(200, responsePayload);
    }

    // ------------------------------------------
    // POST /products (Create Item)
    // ------------------------------------------
    if (method === "POST" && path === "/products") {
      if (!userContext.isAdmin) return createErrorResponse(403, "Only admins can create products");

      const idempotencyKey = parseIdempotencyKey(event);
      const lockResult = await checkOrAcquireLock(idempotencyKey, userContext);

      if (!lockResult.acquired) {
        if (lockResult.existing?.responseBody) return buildResponse(200, lockResult.existing.responseBody);
        return createErrorResponse(409, "Idempotency lock already in progress");
      }

      try {
        const body = parseJsonBody(event);
        const validationErrors = validateCreateBody(body);
        if (validationErrors.length > 0) return createErrorResponse(422, "Validation failed", { errors: validationErrors });

        const productId = body.id?.trim() || randomUUID();
        const titleNormalized = normalizeTitle(body.title);

        // Enforce uniqueness constraints via GSI queries safely
        const duplicate = await checkTitleDuplicate(docClient, tableName, titleNormalized, productId);
        if (duplicate) return createErrorResponse(409, "A product with this title already exists");

        const now = new Date().toISOString();
        const metadataItem = {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
          id: productId,
          title: body.title.trim(),
          titleNormalized,
          msrp: body.msrp,
          is_b2b_only: Boolean(body.is_b2b_only),
          track_type: body.track_type || "UNIQUE",
          createdAt: now,
          updatedAt: now,
          ownerId: userContext.userId,
          businessId: body.businessId?.trim() || (userContext.isBusiness ? userContext.businessId : null),
          createdBy: userContext.userId,
          updatedBy: userContext.userId,
        };

        // Put primary transaction item
        await docClient.send(new PutCommand({
          TableName: tableName,
          Item: metadataItem,
          ConditionExpression: "attribute_not_exists(PK)"
        }));

        // Write pricing tiers sequentially if present
        if (body.tiers && Array.isArray(body.tiers)) {
          for (const tier of body.tiers) {
            await docClient.send(new PutCommand({
              TableName: tableName,
              Item: {
                PK: `PRODUCT#${productId}`,
                SK: `TIER#${tier.org_rating.trim()}`,
                min_qty: Number(tier.min_qty),
                custom_price: Number(tier.custom_price),
              }
            }));
          }
        }

        // DESIGN RECOMMENDATION: Emit a service notification to populate inventory instead of querying cross-modules
        // await sns.publish({ Message: JSON.stringify({ productId, initialQty: 10 }) });

        const responsePayload = { productId, metadata: metadataItem };
        await releaseOrResolveLock(idempotencyKey, responsePayload);

        return buildResponse(201, responsePayload);
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
          return createErrorResponse(409, "A product with this identifier already exists");
        }
        await releaseOrResolveLock(idempotencyKey, { error: error.message });
        throw error;
      }
    }

    // ------------------------------------------
    // PUT /products/{id} (Update Item)
    // ------------------------------------------
    if (method === "PUT" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product id is required");
      if (!canModifyProduct(userContext)) return createErrorResponse(403, "Unauthorized access profile");

      const body = parseJsonBody(event);
      const pk = `PRODUCT#${productId}`;
      const sk = "METADATA";

      // Verify asset exists and validate ownership bounds safely
      const checkRes = await docClient.send(new GetCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }));
      const existing = checkRes.Item;
      if (!existing || existing.isDeleted === true) return createErrorResponse(404, "Product variant not found");
      if (!ownsProduct(userContext, existing)) return createErrorResponse(403, "Permission mismatch on operation target");

      // Dynamic patch tracking arrays
      let updateExp = "SET updatedAt = :u, updatedBy = :ub";
      const expValues = { ":u": new Date().toISOString(), ":ub": userContext.userId };

      if (body.title !== undefined) {
        const tn = normalizeTitle(body.title);
        const duplicate = await checkTitleDuplicate(docClient, tableName, tn, productId);
        if (duplicate) return createErrorResponse(409, "A product with this title already exists");

        updateExp += ", title = :t, titleNormalized = :tn";
        expValues[":t"] = body.title.trim();
        expValues[":tn"] = tn;
      }
      if (body.msrp !== undefined) {
        updateExp += ", msrp = :m";
        expValues[":m"] = body.msrp;
      }
      if (body.is_b2b_only !== undefined) {
        updateExp += ", is_b2b_only = :b2b";
        expValues[":b2b"] = Boolean(body.is_b2b_only);
      }

      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: updateExp,
        ExpressionAttributeValues: expValues,
        ReturnValues: "ALL_NEW"
      }));

      return buildResponse(200, { message: "Product updated successfully" });
    }

    // ------------------------------------------
    // DELETE /products/{id} (Soft Remove Item)
    // ------------------------------------------
    if (method === "DELETE" && path.startsWith("/products/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product id is required");
      if (!canModifyProduct(userContext)) return createErrorResponse(403, "Unauthorized");

      const pk = `PRODUCT#${productId}`;
      const sk = "METADATA";

      const checkRes = await docClient.send(new GetCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }));
      const existing = checkRes.Item;
      if (!existing || existing.isDeleted === true) return createErrorResponse(404, "Product target not found");
      if (!ownsProduct(userContext, existing)) return createErrorResponse(403, "Permission mismatch on operation target");

      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: "SET isDeleted = :d, deletedAt = :now, deletedBy = :uid, updatedAt = :now, updatedBy = :uid",
        ExpressionAttributeValues: {
          ":d": true,
          ":now": new Date().toISOString(),
          ":uid": userContext.userId
        }
      }));

      return buildResponse(200, { message: "Product deleted successfully", productId });
    }

    return createErrorResponse(404, "Route path matching failed");
  } catch (error) {
    console.error("[Product Exception]", error);
    return createErrorResponse(500, "Unexpected product service failure", error.message);
  }
};