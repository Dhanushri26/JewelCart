import { randomUUID } from "node:crypto";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

// ==========================================
// CONSTANTS
// ==========================================

export const ROLES = Object.freeze({
  ADMIN: "Admin",
  BUSINESS: "Business",
  CUSTOMER: "Customer",
});

export const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_MANAGEMENT_APPROVAL: "PENDING_MANAGEMENT_APPROVAL",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
});

export const ORDER_SOURCES = Object.freeze({
  B2B: "B2B",
  B2C: "B2C",
});

// ==========================================
// DYNAMODB CLIENT
// ==========================================

let docClient = null;

export const getDbClient = () => {

  if (!docClient) {

    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });

    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

  }

  return {

    docClient,

    // Backward compatibility (used by idempotency helpers)
    tableName: process.env.DYNAMODB_TABLE_NAME,

    // Orders service tables
    orderTable: process.env.ORDER_TABLE,
    cartTable: process.env.CART_TABLE,
    productTable: process.env.PRODUCT_TABLE,

  };

};
// ==========================================
// HTTP RESPONSE HELPERS
// ==========================================

export const buildResponse = (statusCode, body = {}) => {

  return {
    statusCode,

    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },

    body: JSON.stringify(body),
  };

};

export const createErrorResponse = (
  statusCode,
  message,
  details = null
) => {

  return buildResponse(statusCode, {
    success: false,
    message,
    details,
  });

};


// ==========================================
// REQUEST HELPERS
// ==========================================

export const parseJsonBody = (event) => {
  if (!event?.body) return {};

  try {
    return typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;
  } catch {
    throw new Error("Invalid JSON body");
  }
};

export const getPathParam = (event, index) => {
  const rawPath =
    event?.rawPath ||
    event?.path ||
    "";

  const parts = rawPath
    .split("/")
    .filter(Boolean);

  return parts[index] || null;
};

export const parseIdempotencyKey = (event) => {

  const headers = event?.headers || {};

  return (
    headers["Idempotency-Key"] ||
    headers["idempotency-key"] ||
    headers["IDEMPOTENCY-KEY"] ||
    null
  );

};

// ==========================================
// USER CONTEXT
// ==========================================

export const extractUserContext = (event) => {
  const headers = event?.headers || {};

  // JWT claims injected by API Gateway JWT Authorizer
  const claims =
    event?.requestContext?.authorizer?.jwt?.claims ||
    event?.requestContext?.authorizer?.claims ||
    {};

  // User ID
  const userId =
    claims.sub ||
    headers["x-user-id"] ||
    headers["X-User-Id"] ||
    "anonymous";

  // Role
  let role =
    headers["x-user-role"] ||
    headers["X-User-Role"] ||
    "Customer";

// If Cognito groups exist, use them
const groups = claims["cognito:groups"];

if (groups) {
  const groupList = Array.isArray(groups)
    ? groups
    : String(groups)
        .replace(/[\[\]]/g, "") // remove [ ]
        .split(",")
        .map((g) => g.trim());

  if (groupList.includes("Admin")) {
    role = "Admin";
  } else if (groupList.includes("Business")) {
    role = "Business";
  } else {
    role = "Customer";
  }
}

  // Business ID
  const businessId =
    claims["custom:businessId"] ||
    headers["x-business-id"] ||
    headers["X-Business-Id"] ||
    null;

  return {
    isAuthenticated: userId !== "anonymous",

    userId,

    businessId,

    role,

    creditLimit: Number(headers["x-credit-limit"] || 0),

    taxExempt:
      String(headers["x-tax-exempt"] || "false").toLowerCase() === "true",

    isAdmin: role === ROLES.ADMIN,

    isBusiness: role === ROLES.BUSINESS,

    isCustomer: role === ROLES.CUSTOMER,
  };
};


// ==========================================
// AUDIT HELPERS
// ==========================================

export const createAuditFields = (userId = "system") => {

  const now = new Date().toISOString();

  return {
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  };

};

export const updateAuditFields = (userId = "system") => {

  return {
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

};


// ==========================================
// IDEMPOTENCY HELPERS
// ==========================================

export const checkOrAcquireLock = async (idempotencyKey, context = {}) => {

  if (!idempotencyKey) {
    return {
      acquired: true,
      existing: null,
    };
  }

  const { docClient, tableName } = getDbClient();

  const ttl = Math.floor((Date.now() + (5 * 60 * 1000)) / 1000);

  try {

    await docClient.send(
      new PutCommand({

        TableName: tableName,

        Item: {

          PK: `IDEMPOTENCY#${idempotencyKey}`,
          SK: "LOCK",

          status: "PROCESSING",

          ownerId: context.userId || "anonymous",

          ttl,

          createdAt: new Date().toISOString(),

        },

        ConditionExpression:
          "attribute_not_exists(PK) AND attribute_not_exists(SK)",

      })
    );

    return {
      acquired: true,
      existing: null,
    };

  } catch (err) {

    if (err.name === "ConditionalCheckFailedException") {

      const existing = await docClient.send(
        new GetCommand({

          TableName: tableName,

          Key: {
            PK: `IDEMPOTENCY#${idempotencyKey}`,
            SK: "LOCK",
          },

        })
      );

      return {
        acquired: false,
        existing: existing.Item || null,
      };

    }

    throw err;

  }

};

export const releaseOrResolveLock = async (
  idempotencyKey,
  responsePayload
) => {

  if (!idempotencyKey) return;

  const { docClient, tableName } = getDbClient();

  const ttl = Math.floor((Date.now() + (5 * 60 * 1000)) / 1000);

  await docClient.send(

    new UpdateCommand({

      TableName: tableName,

      Key: {

        PK: `IDEMPOTENCY#${idempotencyKey}`,

        SK: "LOCK",

      },

      UpdateExpression:
        "SET #status=:status,responseBody=:body,#ttl=:ttl,updatedAt=:updated",

      ExpressionAttributeNames: {

        "#status": "status",

        "#ttl": "ttl",

      },

      ExpressionAttributeValues: {

        ":status": "COMPLETED",

        ":body": responsePayload,

        ":ttl": ttl,

        ":updated": new Date().toISOString(),

      },

    })

  );

};