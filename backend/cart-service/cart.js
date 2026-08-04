import { 
  QueryCommand, 
  PutCommand, 
  GetCommand, 
  UpdateCommand,
  BatchWriteCommand 
} from "@aws-sdk/lib-dynamodb";
import {
  buildResponse,
  createErrorResponse,
  createAuditFields,
  extractUserContext,
  getDbClient,
  getPathParam,
  parseJsonBody,
  updateAuditFields,
} from "./shared.js";

// ==========================================
// BUSINESS LOGIC & PERMISSION DOMAINS
// ==========================================
const getCartPartition = (user) => {
  if (user.isBusiness && user.businessId) {
    return `CART#${user.businessId}`;
  }
  return `CART#${user.userId}`;
};

const normalizeQuantity = (v) => {
  const parsed = Number(v ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

const canAccessItem = (user, item) => {
  if (!item) return false;
  if (user.isAdmin) return true;
  if (user.isBusiness && user.businessId) return item.businessId === user.businessId;
  return item.ownerId === user.userId;
};

const calculateCartTotals = (items, user) => {
  const itemCount = items.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
  const subtotal = items.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  const estimatedTax = user.taxExempt ? 0 : subtotal * 0.08;
  return {
    itemCount,
    subtotal,
    estimatedTax,
    grandTotal: subtotal + estimatedTax,
  };
};

// ==========================================
// DECOUPLED DECENTRALIZED DATA RESOLVERS
// ==========================================
// NOTE: In strict microservice separation, these fetch metrics from 
// respective tables, or via high-speed external endpoints. 
// For now, they read securely from your single-table backend layout.
const fetchProductDetails = async (
    docClient,
    productTable,
    productId
) => {

    const res = await docClient.send(
        new GetCommand({

            TableName: productTable,

            Key: {

                PK: `PRODUCT#${productId}`,

                SK: "METADATA",

            },

        })
    );

    return res.Item && !res.Item.isDeleted
        ? res.Item
        : null;
};

const fetchInventoryDetails = async (
    docClient,
    inventoryTable,
    productId
) => {

    const res = await docClient.send(
        new GetCommand({

            TableName: inventoryTable,

            Key: {

                PK: `INVENTORY#${productId}`,

                SK: "STOCK",

            },

        })
    );

    return res.Item && !res.Item.isDeleted
        ? res.Item
        : null;
};

const resolveUnitPrice = (product, user) => {
  if (!product) return 0;
  const price = product.b2bPrice ?? product.businessPrice ?? product.customPrice ?? product.price ?? product.msrp ?? 0;
  return Number(price);
};

// ==========================================
// MAIN AWS LAMBDA HANDLER
// ==========================================
export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod || event?.requestContext?.http?.method;
    const path = event?.rawPath || event?.path || "";

    if (method === "OPTIONS") {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,x-user-id,x-user-role",
    },
    body: "",
  };
}
    const userContext = extractUserContext(event);
const {
    docClient,
    cartTable,
    productTable,
    inventoryTable
} = getDbClient();

    if (!userContext.isAuthenticated) {
      return createErrorResponse(401, "Authentication credentials required");
    }

    const cartPartition = getCartPartition(userContext);

    // ------------------------------------------
    // GET /cart (List Items)
    // ------------------------------------------
    if (method === "GET" && path === "/cart") {
      const result = await docClient.send(new QueryCommand({
        TableName: cartTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        FilterExpression: "attribute_not_exists(isDeleted)",
        ExpressionAttributeValues: { ":pk": cartPartition, ":sk": "ITEM#" }
      }));

      return buildResponse(200, { cartId: cartPartition, items: result.Items || [] });
    }

    // ------------------------------------------
    // GET /cart/summary (Aggregations)
    // ------------------------------------------
    if (method === "GET" && path === "/cart/summary") {
      const result = await docClient.send(new QueryCommand({
        TableName: cartTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        FilterExpression: "attribute_not_exists(isDeleted)",
        ExpressionAttributeValues: { ":pk": cartPartition, ":sk": "ITEM#" }
      }));

      const totals = calculateCartTotals(result.Items || [], userContext);
      return buildResponse(200, { cartId: cartPartition, ...totals });
    }

    // ------------------------------------------
    // POST /cart/items (Add Item)
    // ------------------------------------------
    if (method === "POST" && path === "/cart/items") {
      const body = parseJsonBody(event);
      const productId = body.productId || body.product_id;
      const quantity = normalizeQuantity(body.quantity ?? body.qty ?? 1);

      if (!productId || quantity <= 0) {
        return createErrorResponse(422, "Valid productId and positive integer quantity parameters required");
      }

      // Inter-domain lookups adapted via table clients
      const product =
await fetchProductDetails(
docClient,
productTable,
productId
);
      if (!product) return createErrorResponse(404, "Product domain record not found");
      if (userContext.isCustomer && product.is_b2b_only) {
        return createErrorResponse(403, "B2B catalog access restriction");
      }

      const inventory =
await fetchInventoryDetails(
docClient,
inventoryTable,
productId
);
      const stockAvailable = Number(inventory?.availableQuantity ?? inventory?.available_quantity ?? 0);
      
      // Fetch existing cart row to compile aggregate volumes
      const currentItemRes = await docClient.send(new GetCommand({
        TableName: cartTable,
        Key: { PK: cartPartition, SK: `ITEM#${productId}` }
      }));
      
      const existingItem = currentItemRes.Item && !currentItemRes.Item.isDeleted ? currentItemRes.Item : null;
      const finalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      if (stockAvailable < finalQuantity) {
        return createErrorResponse(409, "Requested item volume exceeds current available stock parameters", { stockAvailable });
      }

      const unitPrice = resolveUnitPrice(product, userContext);
      const now = new Date().toISOString();
      const itemPayload = {
        PK: cartPartition,
        SK: `ITEM#${productId}`,
        cartId: cartPartition,
        productId,
        productTitle: product.title || null,
        quantity: finalQuantity,
        unitPrice,
        subtotal: unitPrice * finalQuantity,
        ownerId: userContext.userId,
        businessId: userContext.businessId || null,
        pricingSource: userContext.isBusiness ? "business" : "standard",
        createdAt: existingItem?.createdAt || now,
        updatedAt: now,
        ...createAuditFields(userContext.userId)
      };

      await docClient.send(new PutCommand({ TableName: cartTable, Item: itemPayload }));
      return buildResponse(201, itemPayload);
    }

    // ------------------------------------------
    // PUT /cart/items/{id} (Update Quantity)
    // ------------------------------------------
    if (method === "PUT" && path.startsWith("/cart/items/")) {
      const productId = getPathParam(event, 2);
      const body = parseJsonBody(event);
      const quantity = normalizeQuantity(body.quantity ?? body.qty ?? 0);

      if (!productId || quantity <= 0) return createErrorResponse(422, "Positive integer quantity required");

      const targetKey = { PK: cartPartition, SK: `ITEM#${productId}` };
      const currentRes = await docClient.send(new GetCommand({ TableName: cartTable, Key: targetKey }));
      const item = currentRes.Item;

      if (!item || item.isDeleted === true) return createErrorResponse(404, "Cart item line variant not found");
      if (!canAccessItem(userContext, item)) return createErrorResponse(403, "Access unauthorized");

      const inventory =
await fetchInventoryDetails(
docClient,
inventoryTable,
productId
);
      if (!inventory || Number(inventory.availableQuantity || 0) < quantity) {
        return createErrorResponse(409, "Insufficient warehouse allocations for update quantity bounds");
      }

      const product =
await fetchProductDetails(
docClient,
productTable,
productId
);
      const unitPrice = resolveUnitPrice(product, userContext);

      const updatedFields = {
        ...item,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        updatedAt: new Date().toISOString(),
        ...updateAuditFields(userContext.userId)
      };

      await docClient.send(new PutCommand({ TableName: cartTable, Item: updatedFields }));
      return buildResponse(200, updatedFields);
    }

    // ------------------------------------------
    // DELETE /cart/items/{id} (Remove Item)
    // ------------------------------------------
    if (method === "DELETE" && path.startsWith("/cart/items/")) {
      const productId = getPathParam(event, 2);
      if (!productId) return createErrorResponse(400, "productId target parameter required");

      const targetKey = { PK: cartPartition, SK: `ITEM#${productId}` };
      const currentRes = await docClient.send(new GetCommand({ TableName: cartTable, Key: targetKey }));
      if (!currentRes.Item || currentRes.Item.isDeleted === true) return createErrorResponse(404, "Targeted item not found");
      if (!canAccessItem(userContext, currentRes.Item)) return createErrorResponse(403, "Access unauthorized");

      // Soft delete updates
      await docClient.send(new UpdateCommand({
        TableName: cartTable,
        Key: targetKey,
        UpdateExpression: "SET isDeleted = :d, deletedAt = :now, deletedBy = :uid, updatedAt = :now",
        ExpressionAttributeValues: { ":d": true, ":now": new Date().toISOString(), ":uid": userContext.userId }
      }));

      return buildResponse(200, { message: "Cart item removed successfully" });
    }

    // ------------------------------------------
    // DELETE /cart/clear (Empty Cart)
    // ------------------------------------------
    if (method === "DELETE" && path === "/cart/clear") {
      const result = await docClient.send(new QueryCommand({
        TableName: cartTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        FilterExpression: "attribute_not_exists(isDeleted)",
        ExpressionAttributeValues: { ":pk": cartPartition, ":sk": "ITEM#" }
      }));

      const activeItems = result.Items || [];
      const now = new Date().toISOString();

      for (const item of activeItems) {
        await docClient.send(new UpdateCommand({
          TableName: cartTable,
          Key: { PK: cartPartition, SK: item.SK },
          UpdateExpression: "SET isDeleted = :d, deletedAt = :now, deletedBy = :uid, updatedAt = :now",
          ExpressionAttributeValues: { ":d": true, ":now": now, ":uid": userContext.userId }
        }));
      }

      return buildResponse(200, { message: "Cart cleared completely" });
    }

    // ------------------------------------------
    // POST /cart/bulk-import (B2B Bulk Intake)
    // ------------------------------------------
    if (method === "POST" && path === "/cart/bulk-import") {
      if (!userContext.isBusiness && !userContext.isAdmin) {
        return createErrorResponse(403, "Bulk operation limits apply strictly to commercial accounts");
      }

      const body = parseJsonBody(event);
      const requestItems = Array.isArray(body.items) ? body.items : [];
      if (requestItems.length === 0) return createErrorResponse(422, "Valid structured non-empty items array required");

      let importedCount = 0;
      const now = new Date().toISOString();

      for (const rawItem of requestItems) {
        const productId = rawItem.productId || rawItem.product_id;
        const quantity = normalizeQuantity(rawItem.quantity ?? rawItem.qty ?? 1);

        if (!productId || quantity <= 0) continue;

        const product = await fetchProductDetails(
          docClient,
          productTable,
          productId
      );        if (!product || (userContext.isCustomer && product.is_b2b_only)) continue;

      const inventory = await fetchInventoryDetails(
        docClient,
        inventoryTable,
        productId
    );        if (!inventory || Number(inventory.availableQuantity || 0) < quantity) continue;

        const currentItemRes = await docClient.send(new GetCommand({
          TableName: cartTable,
          Key: { PK: cartPartition, SK: `ITEM#${productId}` }
        }));
        
        const existing = currentItemRes.Item && !currentItemRes.Item.isDeleted ? currentItemRes.Item : null;
        const finalQuantity = existing ? existing.quantity + quantity : quantity;
        const unitPrice = resolveUnitPrice(product, userContext);

        const payload = {
          PK: cartPartition,
          SK: `ITEM#${productId}`,
          cartId: cartPartition,
          productId,
          productTitle: product.title || null,
          quantity: finalQuantity,
          unitPrice,
          subtotal: unitPrice * finalQuantity,
          ownerId: userContext.userId,
          businessId: userContext.businessId || null,
          pricingSource: "business",
          createdAt: existing?.createdAt || now,
          updatedAt: now,
          ...createAuditFields(userContext.userId)
        };

        await docClient.send(new PutCommand({ TableName: cartTable, Item: payload }));
        importedCount++;
      }

      return buildResponse(201, { imported: importedCount, cartId: cartPartition });
    }

    return createErrorResponse(404, "Route path matching failed");
  } catch (error) {
    console.error("[Cart Exception]", error);
    return createErrorResponse(500, "Unexpected serverless cart execution failure", error.message);
  }
};