import { randomUUID } from "node:crypto";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getDbClient,
  getPathParam,
  parseJsonBody,
  createAuditFields,
} from "./shared.js";

const normalizeQuantity = (v) => {
  const parsed = Number(v ?? 0);
  return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
};

const DEFAULT_INITIAL_INVENTORY_QUANTITY = 10;

// ==========================================
// BUSINESS LOGIC & PERMISSION DOMAINS
// ==========================================
const canManageInventory = (user) => user.isAdmin;
const canReserveInventory = (user) => user.isAdmin || user.isBusiness;
const canReadInventory = (user) => user.isAdmin || user.isBusiness || user.isCustomer;

const buildInventoryResponse = (item) => ({
  ...item,
  availableQuantity: Number(item?.availableQuantity ?? 0),
  reservedQuantity: Number(item?.reservedQuantity ?? 0),
  damagedQuantity: Number(item?.damagedQuantity ?? 0),
  reorderThreshold: Number(item?.reorderThreshold ?? 0),
});

// Helper to push a discrete audit log line item
const appendAuditRecord = async (docClient, tableName, productId, action, qty, userId, reason) => {
  const now = new Date().toISOString();
  const auditItem = {
    PK: `INVENTORY#${productId}`,
    SK: `AUDIT#${now}#${randomUUID().substring(0, 8)}`,
    action,
    quantity: qty,
    performedBy: userId,
    timestamp: now,
    reason: reason || "Manual Inventory Operation Update"
  };
  await docClient.send(new PutCommand({ TableName: tableName, Item: auditItem }));
};

// ==========================================
// MAIN AWS LAMBDA HANDLER
// ==========================================
export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod || event?.requestContext?.http?.method;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);
    const {
      docClient,
      inventoryTable,
      productTable
  } = getDbClient();

    if (!canReadInventory(userContext)) {
      return createErrorResponse(403, "Access unauthorized");
    }

    // ------------------------------------------
    // GET /inventory (List Stock Profiles)
    // ------------------------------------------
    if (method === "GET" && (path === "/inventory" || path === "/inventory/")) {
     const result = await docClient.send(
  new ScanCommand({
    TableName: inventoryTable,
   FilterExpression:
"begins_with(PK,:pk) AND SK=:sk AND isDeleted=:deleted",
ExpressionAttributeValues:{
    ":pk":"INVENTORY#",
    ":sk":"STOCK",
    ":deleted":false
}
  })
);

      const items = result.Items || [];
      return buildResponse(200, {
        totalProducts: items.length,
        items: items.map(buildInventoryResponse),
      });
    }

    // ------------------------------------------
    // GET /inventory/{productId} (Inspect Details)
    // ------------------------------------------
    if (method === "GET" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product specification parameter missing");

      const res = await docClient.send(new GetCommand({
        TableName: inventoryTable,
        Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" }
      }));

      const inventory = res.Item;
      if (!inventory || inventory.isDeleted) return createErrorResponse(404, "Stock profile not found");

      return buildResponse(200, buildInventoryResponse(inventory));
    }

    // ------------------------------------------
    // POST /inventory (Initialize Inventory Node)
    // ------------------------------------------
    if (method === "POST" && path === "/inventory") {
      if (!canManageInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      const body = parseJsonBody(event);
      const productId = typeof body.productId === "string" ? body.productId.trim() : null;
      if (!productId) return createErrorResponse(422, "Valid productId missing from body payload");

      // Verify Product reference entity existence directly inside the catalog domain prefix
      const prodRes = await docClient.send(new GetCommand({
        TableName: productTable,
        Key: { PK: `PRODUCT#${productId}`, SK: "METADATA" }
      }));
      if (!prodRes.Item || prodRes.Item.isDeleted) return createErrorResponse(404, "Base product reference mapping missing");

      // Verify uniqueness of the stock record
      const existRes = await docClient.send(new GetCommand({
        TableName: inventoryTable,
        Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" }
      }));
      if (existRes.Item && !existRes.Item.isDeleted) return createErrorResponse(409, "Inventory record context collision");

      const availableQuantity = normalizeQuantity(body.availableQuantity ?? body.initialInventoryQuantity ?? DEFAULT_INITIAL_INVENTORY_QUANTITY);
      const now = new Date().toISOString();

      const inventoryDoc = {
        PK: `INVENTORY#${productId}`,
        SK: "STOCK",
        inventoryId: body.inventoryId || randomUUID(),
        productId,
        availableQuantity,
        reservedQuantity: normalizeQuantity(body.reservedQuantity),
        damagedQuantity: normalizeQuantity(body.damagedQuantity),
        reorderThreshold: normalizeQuantity(body.reorderThreshold),
        warehouseId: body.warehouseId || null,
        inventoryStatus: body.inventoryStatus || (availableQuantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...createAuditFields(userContext.userId || "system")
      };

      await docClient.send(new PutCommand({ TableName: inventoryTable, Item: inventoryDoc }));
      return buildResponse(201, buildInventoryResponse(inventoryDoc));
    }

    // ------------------------------------------
    // PUT /inventory/{productId} (Update Fields)
    // ------------------------------------------
    if (method === "PUT" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product specification missing");
      if (!canManageInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      const body = parseJsonBody(event);
      const updateExpressions = [];
      const expressionAttributeValues = {
  ":now": new Date().toISOString(),
};

      if (body.availableQuantity !== undefined) {
        updateExpressions.push("availableQuantity = :aq");
        expressionAttributeValues[":aq"] = normalizeQuantity(body.availableQuantity);
      }
      if (body.reservedQuantity !== undefined) {
        updateExpressions.push("reservedQuantity = :rq");
        expressionAttributeValues[":rq"] = normalizeQuantity(body.reservedQuantity);
      }
      if (body.damagedQuantity !== undefined) {
        updateExpressions.push("damagedQuantity = :dq");
        expressionAttributeValues[":dq"] = normalizeQuantity(body.damagedQuantity);
      }

      if (updateExpressions.length === 0) return createErrorResponse(400, "Updatable parameters missing");

      const expressionString = `SET ${updateExpressions.join(", ")}, updatedAt = :now`;

      const result = await docClient.send(new UpdateCommand({
        TableName: inventoryTable,
        Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" },
        UpdateExpression: expressionString,
        ConditionExpression:"attribute_exists(PK)",
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      }));

      return buildResponse(200, buildInventoryResponse(result.Attributes));
    }

    // ------------------------------------------
    // PATCH /inventory/reserve (Allocate Hold)
    // ------------------------------------------
    if (method === "PATCH" && path === "/inventory/reserve") {
      if (!canReserveInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      const body = parseJsonBody(event);
      const requestedQuantity = normalizeQuantity(body.requestedQuantity);
      const productId = body.productId || body.product_id;

      if (!productId || requestedQuantity <= 0) {
        return createErrorResponse(422, "Valid positive integer requestedQuantity and productId parameters required");
      }

      const now = new Date().toISOString();
      const ttlOffset = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: inventoryTable,
          Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" },
          UpdateExpression: "SET availableQuantity = availableQuantity - :req, reservedQuantity = reservedQuantity + :req, reservationStatus = :resStatus, reservationTTL = :ttl, reservedBy = :uid, reservedAt = :now, updatedAt = :now",
ConditionExpression:
"attribute_exists(PK) AND availableQuantity >= :req",
          ExpressionAttributeValues: {
            ":req": requestedQuantity,
            ":resStatus": "RESERVED",
            ":ttl": ttlOffset,
            ":uid": userContext.userId,
            ":now": now
          },
          ReturnValues: "ALL_NEW"
        }));

        await appendAuditRecord(docClient, inventoryTable, productId, "RESERVE", requestedQuantity, userContext.userId, body.reason);
        return buildResponse(200, buildInventoryResponse(result.Attributes));
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return createErrorResponse(409, "Allocation failure: Insufficient available stock inventory");
        }
        throw err;
      }
    }

    // ------------------------------------------
    // PATCH /inventory/release (Revert Reservation)
    // ------------------------------------------
    if (method === "PATCH" && path === "/inventory/release") {
      if (!canReserveInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      const body = parseJsonBody(event);
      const requestedQuantity = normalizeQuantity(body.requestedQuantity);
      const productId = body.productId || body.product_id;

      if (!productId || requestedQuantity <= 0) return createErrorResponse(422, "Invalid parameter constraints mapping");

      const now = new Date().toISOString();

      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: inventoryTable,
          Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" },
          UpdateExpression: "SET availableQuantity = availableQuantity + :req, reservedQuantity = reservedQuantity - :req, reservationStatus = :status, reservationTTL = :nullVal, updatedAt = :now",
          ConditionExpression:"attribute_exists(PK) AND reservedQuantity >= :req",
          ExpressionAttributeValues: {
            ":req": requestedQuantity,
            ":status": "AVAILABLE",
            ":nullVal": null,
            ":now": now
          },
          ReturnValues: "ALL_NEW"
        }));

        await appendAuditRecord(docClient, inventoryTable, productId, "RELEASE", requestedQuantity, userContext.userId, body.reason);
        return buildResponse(200, buildInventoryResponse(result.Attributes));
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return createErrorResponse(409, "Reversion error: Requested release size exceeds current reserved quantities");
        }
        throw err;
      }
    }

    // ------------------------------------------
    // PATCH /inventory/commit (Deduct Stock)
    // ------------------------------------------
    if (method === "PATCH" && path === "/inventory/commit") {
      if (!canReserveInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      const body = parseJsonBody(event);
      const requestedQuantity = normalizeQuantity(body.requestedQuantity);
      const productId = body.productId || body.product_id;

      if (!productId || requestedQuantity <= 0) return createErrorResponse(422, "Invalid parameters constraints mapping");

      const now = new Date().toISOString();

      try {
        const result = await docClient.send(new UpdateCommand({
          TableName: inventoryTable,
          Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" },
          UpdateExpression: "SET reservedQuantity = reservedQuantity - :req, reservationStatus = :status, updatedAt = :now",
          ConditionExpression:"attribute_exists(PK) AND reservedQuantity >= :req",
          ExpressionAttributeValues: {
            ":req": requestedQuantity,
            ":status": "COMMITTED",
            ":now": now
          },
          ReturnValues: "ALL_NEW"
        }));

        await appendAuditRecord(docClient, inventoryTable, productId, "COMMIT", requestedQuantity, userContext.userId, body.reason);
        return buildResponse(200, buildInventoryResponse(result.Attributes));
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return createErrorResponse(409, "Commit balance error: Target stock reservation parameters missing or insufficient");
        }
        throw err;
      }
    }

    // ------------------------------------------
    // DELETE /inventory/{productId} (Soft-Delete)
    // ------------------------------------------
    if (method === "DELETE" && path.startsWith("/inventory/")) {
      const productId = getPathParam(event, 1);
      if (!productId) return createErrorResponse(400, "Product specification missing");
      if (!canManageInventory(userContext)) return createErrorResponse(403, "Access unauthorized");

      await docClient.send(new UpdateCommand({
        TableName: inventoryTable,
        Key: { PK: `INVENTORY#${productId}`, SK: "STOCK" },
        UpdateExpression: "SET isDeleted = :t, deletedAt = :now, deletedBy = :uid, updatedAt = :now",
        ExpressionAttributeValues: { ":t": true, ":now": new Date().toISOString(), ":uid": userContext.userId }
      }));

      return buildResponse(200, { message: "Inventory stock profile soft-deleted successfully" });
    }

    return createErrorResponse(404, "Routing match point unresolvable");
  } catch (error) {
    console.error("[Inventory Service Error]", error);
    return createErrorResponse(500, "Downstream serverless inventory execution fault", error.message);
  }
};