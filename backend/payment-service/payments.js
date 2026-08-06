import { randomUUID } from "node:crypto";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  TransactWriteCommand
} from "@aws-sdk/lib-dynamodb";


import {
  buildResponse,
  createErrorResponse,
  extractUserContext,
  getDbClient,
  getPathParam,
  parseJsonBody,
  PAYMENT_STATUS,
  createAuditFields,
} from "./shared.js";

import {
    SNSClient,
    PublishCommand
} from "@aws-sdk/client-sns";

// ==========================================
// BUSINESS LOGIC & PERMISSION DOMAINS
// ==========================================
const canReadPayments = (user) => user.isAdmin || user.isBusiness || user.isCustomer;
const canManagePayments = (user) => user.isAdmin || user.isCustomer ;

const canAccessPayment = (user, payment) => {
  if (!payment) return false;
  if (user.isAdmin) return true;
  if (user.isBusiness && user.businessId) return payment.businessId === user.businessId;
  return payment.ownerId === user.userId;
};

const buildPaymentResponse = (payment) => ({
  ...payment,
  amount: Number(payment.amount || 0),
});

const validatePaymentBody = (body) => {
  const errors = [];
  const amount = Number(body.amount ?? body.totalAmount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) errors.push("amount must be a positive number");
  if (!body.orderId && !body.order_id) errors.push("orderId is required");
  if (typeof body.currency !== "string" || !body.currency.trim()) errors.push("currency is required");
  return errors;
};

const sns = new SNSClient({
    region: process.env.AWS_REGION
});

// ==========================================
// MAIN AWS LAMBDA HANDLER
// ==========================================

const processOrderCreatedEvent = async (message) => {

  console.log("Processing Order Event...");

  const {
      docClient,
      paymentTable,
      orderTable
  } = getDbClient();

  // Read Order
  const orderResult = await docClient.send(
      new GetCommand({
          TableName: orderTable,
          Key: {
              PK: `ORDER#${message.orderId}`,
              SK: "METADATA"
          }
      })
  );

  if (!orderResult.Item) {
      console.log("Order not found");
      return;
  }

  const order = orderResult.Item;

  console.log("Order Found:", order.orderId);
  const paymentId = randomUUID();

  const paymentItem = {
    PK: `PAYMENT#${paymentId}`,
    SK: "PAYMENT",

    paymentId,

    orderId: order.orderId,

    ownerId: order.ownerId,

    businessId: order.businessId || null,

    amount: order.totalAmount,

    currency: "USD",

    paymentMethod: "CARD",

    paymentStatus: "PAID",

    transactionReference: `AUTO-${paymentId}`,

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    isDeleted: false
};

await docClient.send(
    new PutCommand({
        TableName: paymentTable,
        Item: paymentItem
    })
);

console.log("Payment Created:", paymentId);

await docClient.send(
  new UpdateCommand({
      TableName: orderTable,
      Key: {
          PK: `ORDER#${order.orderId}`,
          SK: "METADATA"
      },
      UpdateExpression:
          "SET paymentStatus = :paymentStatus, orderStatus = :orderStatus, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
          ":paymentStatus": "PAID",
          ":orderStatus": "CONFIRMED",
          ":updatedAt": new Date().toISOString()
      }
  })
);


console.log("Order Updated:", order.orderId);
};

export const handler = async (event) => {
  try {
    const method = event?.httpMethod || event?.requestContext?.httpMethod || event?.requestContext?.http?.method;
    const path = event?.rawPath || event?.path || "";
    const userContext = extractUserContext(event);
    const {
      docClient,
      paymentTable,
      orderTable
  } = getDbClient();

  if (event.Records && event.Records[0].eventSource === "aws:sqs") {

    console.log("SQS Event Received");

    const message = JSON.parse(event.Records[0].body);

    await processOrderCreatedEvent(message);

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            message: "Payment event processed"
        })
    };
}
    // ------------------------------------------
    // POST /payments (Initiate Transaction)
    // ------------------------------------------
    if (method === "POST" && path === "/payments") {
      if (!userContext.isAuthenticated) return createErrorResponse(403, "Authentication required");

      const body = parseJsonBody(event);
      const validationErrors = validatePaymentBody(body);
      if (validationErrors.length > 0) return createErrorResponse(422, "Validation failed", { errors: validationErrors });

      const orderId = body.orderId || body.order_id;
      const paymentId = body.paymentId || randomUUID();
      const now = new Date().toISOString();

      const paymentDoc = {
        PK: `PAYMENT#${paymentId}`,
        SK: "PAYMENT",
        paymentId,
        orderId,
        amount: Number(body.amount ?? body.totalAmount ?? 0),
        currency: body.currency,
        paymentMethod: body.paymentMethod || "UNKNOWN",
        paymentStatus: PAYMENT_STATUS.PENDING,
        transactionReference: body.transactionReference || null,
        ownerId: userContext.userId,
        businessId: userContext.businessId || null,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...createAuditFields(userContext.userId),
      };

      await docClient.send(new PutCommand({ TableName: paymentTable, Item: paymentDoc }));
      return buildResponse(201, buildPaymentResponse(paymentDoc));
    }

    // ------------------------------------------
    // GET /payments (Query Transaction History)
    // ------------------------------------------
    if (method === "GET" && (path === "/payments" || path === "/payments/")) {
      if (!canReadPayments(userContext)) return createErrorResponse(403, "Access denied");

      let payments = [];
      if (userContext.isAdmin) {
       const result = await docClient.send(
  new ScanCommand({
    TableName: paymentTable,
   FilterExpression:
"SK = :sk AND isDeleted = :deleted",
ExpressionAttributeValues: {
    ":sk": "PAYMENT",
    ":deleted": false
}
  })
);
        payments = result.Items || [];
      } else {
        // Fallback to Scan with filter if secondary indexes are local (safeguarded pattern)

        const result = await docClient.send(
  new ScanCommand({
    TableName: paymentTable,
   FilterExpression:
"SK = :sk AND isDeleted = :deleted",
ExpressionAttributeValues: {
    ":sk": "PAYMENT",
    ":deleted": false
}
  })
);
        payments = result.Items || [];
      }

      return buildResponse(200, { payments: payments.map(buildPaymentResponse) });
    }

    // ------------------------------------------
    // GET /payments/{id} (Inspect Transaction)
    // ------------------------------------------
    if (method === "GET" && path.startsWith("/payments/")) {
      const paymentId = getPathParam(event, 1);
      if (!paymentId) return createErrorResponse(400, "Payment id is required");

      const res = await docClient.send(new GetCommand({
        TableName: paymentTable,
        Key: { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }
      }));

      const payment = res.Item;
      if (!payment || payment.isDeleted) return createErrorResponse(404, "Payment record not found");
      if (!canAccessPayment(userContext, payment)) return createErrorResponse(403, "Access denied");

      return buildResponse(200, buildPaymentResponse(payment));
    }

    // ------------------------------------------
    // PUT /payments/{id} (Update and Cascade Status)
    // ------------------------------------------
    if (method === "PUT" && path.startsWith("/payments/")) {
      const paymentId = getPathParam(event, 1);
      if (!paymentId) return createErrorResponse(400, "Payment id is required");

      const body = parseJsonBody(event);
      const existing = await docClient.send(new GetCommand({
        TableName: paymentTable,
        Key: { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }
      }));
      if (!existing.Item || existing.Item.isDeleted) return createErrorResponse(404, "Payment record not found");

      if (
        !userContext.isAdmin &&
        existing.Item.ownerId !== userContext.userId
    ) {
        return createErrorResponse(403, "Access denied");
    }

      const payment = existing.Item;
      const now = new Date().toISOString();
      const updates = [];
      const exprValues = { ":now": now, ":uid": userContext.userId };

      if (body.paymentStatus !== undefined) {
        updates.push("paymentStatus = :status");
        exprValues[":status"] = body.paymentStatus;
      }
      if (body.transactionReference !== undefined) {
        updates.push("transactionReference = :ref");
        exprValues[":ref"] = body.transactionReference;
      }

      if (updates.length === 0) return createErrorResponse(400, "No updatable fields provided");
      const exprString = `SET ${updates.join(", ")}, updatedAt = :now, updatedBy = :uid`;

      if (body.paymentStatus === PAYMENT_STATUS.PAID) {

        await docClient.send(
            new TransactWriteCommand({
    
                TransactItems: [
                    {
                        Update: {
                            TableName: paymentTable,
                            Key: {
                                PK: `PAYMENT#${paymentId}`,
                                SK: "PAYMENT"
                            },
                            UpdateExpression: exprString,
                            ExpressionAttributeValues: exprValues
                        }
                    },
                    {
                        Update: {
                            TableName: orderTable,
                            Key: {
                                PK: `ORDER#${payment.orderId}`,
                                SK: "METADATA"
                            },
                            UpdateExpression:
                                "SET paymentStatus = :status, updatedAt = :now",
                            ExpressionAttributeValues: {
                                ":status": PAYMENT_STATUS.PAID,
                                ":now": now
                            }
                        }
                    }
                ]
    
            })
        );
    
        console.log("=== BEFORE SNS ===");
    
        await sns.send(
            new PublishCommand({
    
                TopicArn: process.env.PAYMENT_TOPIC_ARN,
    
                Subject: "ORDER_CONFIRMED",
    
                Message: JSON.stringify({
    
                    eventType: "ORDER_CONFIRMED",
    
                    orderId: payment.orderId,
    
                    paymentId: payment.paymentId,
    
                    customerId: payment.ownerId,
    
                    paymentStatus: PAYMENT_STATUS.PAID
    
                })
    
            })
        );
    
        console.log("=== AFTER SNS ===");
    
    }else {
        await docClient.send(new UpdateCommand({
          TableName: paymentTable,
          Key: { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" },
          UpdateExpression: exprString,
          ExpressionAttributeValues: exprValues
        }));
      }

      return buildResponse(200, { message: "Payment status processed successfully" });
    }

    // ------------------------------------------
    // POST /payments/intent (Create Checkout Intent)
    // ------------------------------------------
    if (method === "POST" && path === "/payments/intent") {
      if (!userContext.isAuthenticated) return createErrorResponse(403, "Authentication required");

      const body = parseJsonBody(event);
      const orderId = body.orderId || body.order_id;
      if (!orderId) return createErrorResponse(422, "orderId is required");

      const orderRes = await docClient.send(new GetCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
      }));
      if (!orderRes.Item || orderRes.Item.isDeleted) return createErrorResponse(404, "Target checkout order missing");

      const paymentId = randomUUID();

const paymentItem = {
    PK: `PAYMENT#${paymentId}`,
    SK: "PAYMENT",

    paymentId,

    orderId,

    ownerId: userContext.userId,

    businessId: userContext.businessId || null,

    amount: orderRes.Item.totalAmount,

    currency: "USD",

    paymentMethod: "CARD",

    paymentStatus: PAYMENT_STATUS.PENDING,

    transactionReference: null,

    isDeleted: false,

    ...createAuditFields(userContext.userId)
};

await docClient.send(
    new PutCommand({
        TableName: paymentTable,
        Item: paymentItem
    })
);

return buildResponse(201, {
    paymentId,
    orderId,

    amount: paymentItem.amount,

    currency: paymentItem.currency,

    paymentStatus: PAYMENT_STATUS.PENDING,

    clientSecret: `pi_test_${orderId}_secret`
});
    }

    // ------------------------------------------
    // POST /payments/refund (Issue Balance Refund)
    // ------------------------------------------
    if (method === "POST" && path === "/payments/refund") {
      if (!canManagePayments(userContext)) return createErrorResponse(403, "Access denied");

      const body = parseJsonBody(event);
      const paymentId = body.paymentId || body.payment_id;
      const refundAmount = Number(body.refundAmount ?? 0);

      if (!paymentId || refundAmount <= 0) return createErrorResponse(422, "Valid paymentId and positive refundAmount are required");

      const paymentRes = await docClient.send(new GetCommand({
        TableName: paymentTable,
        Key: { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" }
      }));
      if (!paymentRes.Item || paymentRes.Item.isDeleted) return createErrorResponse(404, "Payment mapping record not found");

      const payment = paymentRes.Item;
      const now = new Date().toISOString();

      await docClient.send(new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: paymentTable,
              Key: { PK: `PAYMENT#${paymentId}`, SK: "PAYMENT" },
              UpdateExpression: "SET paymentStatus = :ps, refundAmount = :ra, refundedAt = :now, refundedBy = :uid, updatedAt = :now, updatedBy = :uid",
              ExpressionAttributeValues: { ":ps": PAYMENT_STATUS.REFUNDED, ":ra": refundAmount, ":now": now, ":uid": userContext.userId }
            }
          },
          {
            Update: {
              TableName: orderTable,
              Key: { PK: `ORDER#${payment.orderId}`, SK: "METADATA" },
              UpdateExpression: "SET paymentStatus = :ps, updatedAt = :now",
              ExpressionAttributeValues: { ":ps": PAYMENT_STATUS.REFUNDED, ":now": now }
            }
          }
        ]
      }));

      return buildResponse(200, { paymentId, paymentStatus: PAYMENT_STATUS.REFUNDED, refundAmount });
    }

    // ------------------------------------------
    // POST /payments/po-verify (Purchase Order Authorization)
    // ------------------------------------------
    if (method === "POST" && path === "/payments/po-verify") {
      if (!userContext.isBusiness && !userContext.isAdmin) {
        return createErrorResponse(403, "Only business accounts or admins can verify purchase orders");
      }

      const body = parseJsonBody(event);
      const orderId = body.orderId || body.order_id;
      if (!orderId) return createErrorResponse(422, "orderId parameter required");

      const orderRes = await docClient.send(new GetCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" }
      }));
      if (!orderRes.Item || orderRes.Item.isDeleted) return createErrorResponse(404, "Associated purchase order missing");

      const order = orderRes.Item;
      const safetyMargin = Number(body.creditSafetyMargin || 0.1);
      const creditLimit = Number(userContext.creditLimit || 0);
      const outstanding = Number(body.outstandingInvoices || 0);
      const utilization = Number(body.creditUtilization || 0);

      const withinCreditEnvelope = Number(order.totalAmount) <= (creditLimit * (1 - safetyMargin)) - outstanding - utilization;
      if (!withinCreditEnvelope) {
        return createErrorResponse(422, "Purchase order exceeds approved corporate credit limits");
      }

      const now = new Date().toISOString();
      await docClient.send(new UpdateCommand({
        TableName: orderTable,
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" },
        UpdateExpression: "SET paymentStatus = :ps, updatedAt = :now",
        ExpressionAttributeValues: { ":ps": PAYMENT_STATUS.PAID, ":now": now }
      }));

      return buildResponse(200, { orderId, paymentStatus: PAYMENT_STATUS.PAID });
    }

    return createErrorResponse(404, "Routing path destination matching unresolvable");
  } catch (error) {
    console.error("[Payments Service Fatal Exception]", error);
    return createErrorResponse(500, "Internal downstream payment service routing execution exception", error.message);
  }
};