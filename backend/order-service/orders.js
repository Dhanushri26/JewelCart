import { randomUUID } from "node:crypto";
import {
  GetCommand,
  QueryCommand,
  UpdateCommand
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
  ORDER_STATUS,
  ORDER_SOURCES,
  PAYMENT_STATUS,
  createAuditFields,
  updateAuditFields,
} from "./shared.js";

import {
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";

import {
    SQSClient,
    SendMessageCommand
} from "@aws-sdk/client-sqs";

// ==========================================
// BUSINESS LOGIC & COMPLIANCE FILTERS
// ==========================================
const getCartPartition = (user) => {
  return user.isBusiness && user.businessId ? `CART#${user.businessId}` : `CART#${user.userId}`;
};

const isCancellableStatus = (status) =>
  [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PENDING_MANAGEMENT_APPROVAL].includes(status);

const canAccessOrder = (user, order) => {
  if (!order) return false;
  if (user.isAdmin) return true;
  if (user.isBusiness && user.businessId) return order.businessId === user.businessId;
  return order.userId === user.userId || order.ownerId === user.userId;
};

const buildOrderResponse = (order) => ({
  ...order,
  totalAmount: Number(order.totalAmount || 0),
});

const sqs = new SQSClient({
    region: process.env.AWS_REGION,
});

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
      orderTable,
      cartTable,
      productTable
    } = getDbClient();

    if (!userContext.isAuthenticated) {
      return createErrorResponse(403, "Authentication required");
    }

    // ------------------------------------------
    // GET /orders (List History)
    // ------------------------------------------
    if (method === "GET" && path === "/orders") {
      let orders = [];

      if (userContext.isAdmin) {
        // Admin scan fallback or secondary index lookup
        const result = await docClient.send(new QueryCommand({
          TableName: orderTable,
          KeyConditionExpression: "begins_with(PK, :orderPrefix)",
          FilterExpression: "SK = :meta AND attribute_not_exists(isDeleted)",
          ExpressionAttributeValues: { ":orderPrefix": "ORDER#", ":meta": "METADATA" }
        }));
        orders = result.Items || [];
      } else {
        const partitionKey = userContext.isBusiness && userContext.businessId
          ? `BUSINESS#${userContext.businessId}`
          : `USER#${userContext.userId}`;

        // Fetch user or business inverted routing indices
        const trackingIndex = await docClient.send(new QueryCommand({
          TableName: orderTable,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          FilterExpression: "attribute_not_exists(isDeleted)",
          ExpressionAttributeValues: { ":pk": partitionKey, ":skPrefix": "ORDER#" }
        }));

        // Hydrate full orders metadata using isolated reads
        for (const indexDoc of trackingIndex.Items || []) {
          const orderRes = await docClient.send(new GetCommand({
            TableName: orderTable,
            Key: { PK: `ORDER#${indexDoc.orderId}`, SK: "METADATA" }
          }));
          if (orderRes.Item && !orderRes.Item.isDeleted) {
            orders.push(orderRes.Item);
          }
        }
      }

      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return buildResponse(200, { orders: orders.map(buildOrderResponse) });
    }

    // ------------------------------------------
    // GET /orders/{id} (Inspect Variant)
    // ------------------------------------------
    if (method === "GET" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      if (!orderId) return createErrorResponse(400, "Order identification sequence parameter required");

      const res = await docClient.send(new GetCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
      }));

      const order = res.Item;
      if (!order || order.isDeleted) return createErrorResponse(404, "Target order record missing");
      if (!canAccessOrder(userContext, order)) return createErrorResponse(403, "Access unauthorized");

      return buildResponse(200, buildOrderResponse(order));
    }

    // ------------------------------------------
    // POST /orders (Checkout Order Pipeline)
    // ------------------------------------------
    if (method === "POST" && path === "/orders") {
      const idempotencyKey = parseIdempotencyKey(event);
      const lockResult = await checkOrAcquireLock(idempotencyKey, userContext);
      if (!lockResult.acquired) {
        if (lockResult.existing?.responseBody) return buildResponse(200, lockResult.existing.responseBody);
        return createErrorResponse(409, "Active execution key in lock-state. Retry shortly.");
      }

      try {
        const body = parseJsonBody(event);
        const cartPartition = getCartPartition(userContext);

        console.log("========== ORDER DEBUG ==========");
        console.log("User Context:", JSON.stringify(userContext, null, 2));
        console.log("Cart Partition:", cartPartition);

        // Fetch active cart items across the partition
        const cartResult = await docClient.send(new QueryCommand({
          TableName: cartTable,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          FilterExpression: "attribute_not_exists(isDeleted)",
          ExpressionAttributeValues: { ":pk": cartPartition, ":skPrefix": "ITEM#" }
        }));

        console.log(
          "Cart Items Found:",
          JSON.stringify(cartResult.Items, null, 2)
      );
      console.log("Cart Result:", JSON.stringify(cartResult, null, 2));
        const cartItems = cartResult.Items || [];
        if (cartItems.length === 0) return createErrorResponse(422, "Transaction halted: Cart is empty");

        const resolvedItems = [];
        for (const cartItem of cartItems) {
          const qty = Number(cartItem.quantity || 0);
          
          // Read item configuration directly from shared document structure
          const prodRes = await docClient.send(new GetCommand({
            TableName: productTable,
            Key: { PK: `PRODUCT#${cartItem.productId}`, SK: "METADATA" }
          }));

          const product = prodRes.Item;
          if (!product) return createErrorResponse(404, `Product missing or delisted: ${cartItem.productId}`);

          const unitPrice = Number(product.price ?? product.msrp ?? cartItem.unitPrice ?? 0);
          resolvedItems.push({
            productId: cartItem.productId,
            title: product.title || cartItem.productTitle || "",
            quantity: qty,
            unitPrice,
            lineTotal: Number((qty * unitPrice).toFixed(2)),
          });
        }

        const totalAmount = Number(resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
        if (totalAmount <= 0) return createErrorResponse(422, "Calculated total values must scale above zero");

        const orderId = typeof body.orderId === "string" && body.orderId.trim() ? body.orderId.trim() : randomUUID();
        
        // Assert order uniqueness
        const uniqueCheck = await docClient.send(new GetCommand({
          TableName: orderTable,
          Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
        }));
        if (uniqueCheck.Item) return createErrorResponse(409, "Order record collision identified");

        const approvalRequired = Boolean(body.approvalRequired) || 
          (userContext.isBusiness && Number(userContext.creditLimit || 0) > 0 && totalAmount > Number(userContext.creditLimit || 0));
        
        const orderStatus = approvalRequired ? ORDER_STATUS.PENDING_MANAGEMENT_APPROVAL : ORDER_STATUS.PENDING_PAYMENT;
        const now = new Date().toISOString();

        const orderDoc = {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
          orderId,
          userId: userContext.userId,
          ownerId: userContext.userId,
          businessId: userContext.businessId || null,
          items: resolvedItems,
          totalAmount,
          orderStatus,
          paymentStatus: PAYMENT_STATUS.PENDING,
          orderSource: userContext.isBusiness ? ORDER_SOURCES.B2B : ORDER_SOURCES.B2C,
          notes: typeof body.notes === "string" ? body.notes : "",
          createdAt: now,
          updatedAt: now,
          ...createAuditFields(userContext.userId),
        };

        const userIndex = {
          PK: `USER#${userContext.userId}`,
          SK: `ORDER#${orderId}`,
          orderId,
          totalAmount,
          orderStatus,
          createdAt: now
        };

        // Construct DynamoDB Transaction payload array
        const transactItems = [
          { Put: { TableName: orderTable, Item: orderDoc } },
          { Put: { TableName: orderTable, Item: userIndex } }
        ];

        if (userContext.isBusiness && userContext.businessId) {
          transactItems.push({
            Put: {
              TableName: orderTable,
              Item: {
                PK: `BUSINESS#${userContext.businessId}`,
                SK: `ORDER#${orderId}`,
                orderId,
                totalAmount,
                orderStatus,
                createdAt: now
              }
            }
          });
        }

        // Add soft-delete or actual cleanup directives for existing cart lines
        for (const item of cartItems) {
          transactItems.push({
            Delete: { TableName: cartTable, Key: { PK: cartPartition, SK: item.SK } }
          });
        }

       await docClient.send(
    new TransactWriteCommand({
        TransactItems: transactItems
    })
);
      await sqs.send(
    new SendMessageCommand({
        QueueUrl: process.env.ORDER_QUEUE_URL,
        MessageBody: JSON.stringify({
            eventType: "ORDER_CREATED",
            orderId: orderId,
            userId: userContext.userId,
            totalAmount: orderDoc.totalAmount,
            createdAt: new Date().toISOString()
        })
    })
);
        const responsePayload = { order: buildOrderResponse(orderDoc) };
        await releaseOrResolveLock(idempotencyKey, responsePayload);
        return buildResponse(201, responsePayload);

      } catch (innerErr) {
        await releaseOrResolveLock(idempotencyKey, { error: innerErr.message });
        throw innerErr;
      }
    }

    // ------------------------------------------
    // PUT /orders/{id} (Update Order Context)
    // ------------------------------------------
    if (method === "PUT" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      const isCancelRoute = path.endsWith("/cancel");

      if (!orderId) return createErrorResponse(400, "Target orderId placeholder parameter required");

      const existingRes = await docClient.send(new GetCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
      }));

      const order = existingRes.Item;
      if (!order || order.isDeleted) return createErrorResponse(404, "Target order metadata record missing");
      if (!canAccessOrder(userContext, order)) return createErrorResponse(403, "Access unauthorized");

      const now = new Date().toISOString();

      // Cancel Logic Path Block
      if (isCancelRoute) {
        if (!isCancellableStatus(order.orderStatus)) {
          return createErrorResponse(409, "State conflict: Current processing progress rejects instant cancellation cascades");
        }

        const targetStatus = ORDER_STATUS.CANCELLED;
        const targetPayment = order.paymentStatus === PAYMENT_STATUS.PAID ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PENDING;

        const transactUpdates = [
          {
            Update: {
              TableName: orderTable,
              Key: { PK: `ORDER#${orderId}`, SK: "METADATA" },
              UpdateExpression: "SET orderStatus = :os, paymentStatus = :ps, updatedAt = :now, updatedBy = :uid",
              ExpressionAttributeValues: { ":os": targetStatus, ":ps": targetPayment, ":now": now, ":uid": userContext.userId }
            }
          },
          {
            Update: {
              TableName: orderTable,
              Key: { PK: `USER#${order.userId}`, SK: `ORDER#${orderId}` },
              UpdateExpression: "SET orderStatus = :os, updatedAt = :now",
              ExpressionAttributeValues: { ":os": targetStatus, ":now": now }
            }
          }
        ];

        if (order.businessId) {
          transactUpdates.push({
            Update: {
              TableName: orderTable,
              Key: { PK: `BUSINESS#${order.businessId}`, SK: `ORDER#${orderId}` },
              UpdateExpression: "SET orderStatus = :os, updatedAt = :now",
              ExpressionAttributeValues: { ":os": targetStatus, ":now": now }
            }
          });
        }

        await docClient.send(
    new TransactWriteCommand({
        TransactItems: transactUpdates
    })
);
        return buildResponse(200, { message: "Order cancellation processing successfully performed" });
      }

      // Context Field Attribute Patch Flow
      const body = parseJsonBody(event);
      if (!body || Object.keys(body).length === 0) return createErrorResponse(400, "Updatable data parameters missing");

      const updateExpressions = [];
      const expressionAttributeValues = { ":now": now, ":uid": userContext.userId };

      if (body.notes !== undefined) {
        updateExpressions.push("notes = :notes");
        expressionAttributeValues[":notes"] = String(body.notes);
      }
      if (body.orderStatus !== undefined) {
        if (!userContext.isAdmin) return createErrorResponse(403, "Privilege violation: Only administration keys alter system status metrics");
        updateExpressions.push("orderStatus = :orderStatus");
        expressionAttributeValues[":orderStatus"] = body.orderStatus;
      }

      if (updateExpressions.length === 0) return createErrorResponse(400, "No applicable delta operations resolved");

      const expressionString = `SET ${updateExpressions.join(", ")}, updatedAt = :now, updatedBy = :uid`;

      await docClient.send(new UpdateCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" },
        UpdateExpression: expressionString,
        ExpressionAttributeValues: expressionAttributeValues
      }));

      return buildResponse(200, { message: "Order metrics modified successfully" });
    }

    // ------------------------------------------
    // DELETE /orders/{id} (Soft-Delete Order Record)
    // ------------------------------------------
    if (method === "DELETE" && path.startsWith("/orders/")) {
      const orderId = getPathParam(event, 1);
      if (!orderId) return createErrorResponse(400, "Order missing identification key placeholder");

      const existingRes = await docClient.send(new GetCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
      }));

      const order = existingRes.Item;
      if (!order || order.isDeleted) return createErrorResponse(404, "Target order documentation record missing");
      if (!canAccessOrder(userContext, order)) return createErrorResponse(403, "Access unauthorized");

      const now = new Date().toISOString();
      const transactDeletes = [
        {
          Update: {
            TableName: orderTable,
            Key: { PK: `ORDER#${orderId}`, SK: "METADATA" },
            UpdateExpression: "SET isDeleted = :t, deletedAt = :now, deletedBy = :uid",
            ExpressionAttributeValues: { ":t": true, ":now": now, ":uid": userContext.userId }
          }
        },
        {
          Update: {
            TableName: orderTable,
            Key: { PK: `USER#${order.userId}`, SK: `ORDER#${orderId}` },
            UpdateExpression: "SET isDeleted = :t",
            ExpressionAttributeValues: { ":t": true }
          }
        }
      ];

      if (order.businessId) {
        transactDeletes.push({
          Update: {
            TableName: orderTable,
            Key: { PK: `BUSINESS#${order.businessId}`, SK: `ORDER#${orderId}` },
            UpdateExpression: "SET isDeleted = :t",
            ExpressionAttributeValues: { ":t": true }
          }
        });
      }

      await docClient.send(
    new TransactWriteCommand({
        TransactItems: transactDeletes
    })
);
      return buildResponse(200, { message: "Order trace elements successfully purged" });
    }

    return createErrorResponse(404, "Routing path destination matching unresolvable");
  } catch (error) {
    console.error("[Orders Service Execution Error]", error);
    return createErrorResponse(500, "Fatal downstream microservice order runtime execution exception", error.message);
  }
};