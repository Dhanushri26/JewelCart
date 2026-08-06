import { vi } from "vitest";

// ── DynamoDB Client ──────────────────────────────────────────────────────────
export const mockSend = vi.fn();

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({ send: mockSend })),
  },
  GetCommand: vi.fn((input) => ({ input })),
  PutCommand: vi.fn((input) => ({ input })),
  UpdateCommand: vi.fn((input) => ({ input })),
  DeleteCommand: vi.fn((input) => ({ input })),
  QueryCommand: vi.fn((input) => ({ input })),
  ScanCommand: vi.fn((input) => ({ input })),
  TransactWriteCommand: vi.fn((input) => ({ input })),
}));

// ── SQS ──────────────────────────────────────────────────────────────────────
export const mockSqsSend = vi.fn();

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn(() => ({ send: mockSqsSend })),
  SendMessageCommand: vi.fn((input) => ({ input })),
}));

// ── SNS ──────────────────────────────────────────────────────────────────────
export const mockSnsSend = vi.fn();

vi.mock("@aws-sdk/client-sns", () => ({
  SNSClient: vi.fn(() => ({ send: mockSnsSend })),
  PublishCommand: vi.fn((input) => ({ input })),
}));

// ── SES ──────────────────────────────────────────────────────────────────────
export const mockSesSend = vi.fn();

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: vi.fn(() => ({ send: mockSesSend })),
  SendEmailCommand: vi.fn((input) => ({ input })),
}));
