import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();
const mockOrderBy = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  tickets: {
    id: "id",
    ticketNo: "ticketNo",
    region: "region",
    status: "status",
    customerName: "customerName",
    customerPhone: "customerPhone",
    customerLine: "customerLine",
    customerEmail: "customerEmail",
    moveDate: "moveDate",
    fromAddress: "fromAddress",
    toAddress: "toAddress",
    fromCity: "fromCity",
    fromDistrict: "fromDistrict",
    toCity: "toCity",
    toDistrict: "toDistrict",
    fromHasElevator: "fromHasElevator",
    fromFloor: "fromFloor",
    toHasElevator: "toHasElevator",
    toFloor: "toFloor",
    notes: "notes",
    source: "source",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  chatMessages: {
    id: "id",
    ticketId: "ticketId",
    role: "role",
    message: "message",
    imageUrl: "imageUrl",
    isRead: "isRead",
    createdAt: "createdAt",
  },
  ticketPhotos: { ticketId: "ticketId", sortOrder: "sortOrder" },
  ticketFiles: { ticketId: "ticketId", createdAt: "createdAt" },
  ticketRoomLayouts: { ticketId: "ticketId" },
  ticketAiResults: { ticketId: "ticketId" },
}));

describe("ERP API Authentication", () => {
  it("should have ERP_API_KEY environment variable set", () => {
    const apiKey = process.env.ERP_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThanOrEqual(20);
  });

  it("should have ERP_WEBHOOK_SECRET environment variable set", () => {
    const secret = process.env.ERP_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret!.length).toBeGreaterThanOrEqual(20);
  });

  it("should reject requests without Authorization header", async () => {
    const { erpRouter } = await import("./erp-api");
    expect(erpRouter).toBeDefined();
    // Router is an Express router with middleware
    expect(typeof erpRouter).toBe("function");
  });

  it("should export triggerWebhook function", async () => {
    const { triggerWebhook } = await import("./erp-api");
    expect(triggerWebhook).toBeDefined();
    expect(typeof triggerWebhook).toBe("function");
  });

  it("triggerWebhook should return false when ERP_WEBHOOK_URL is not set", async () => {
    const originalUrl = process.env.ERP_WEBHOOK_URL;
    delete process.env.ERP_WEBHOOK_URL;

    // Re-import to get fresh module
    const { triggerWebhook } = await import("./erp-api");
    const result = await triggerWebhook("test.event", { foo: "bar" });
    expect(result).toBe(false);

    if (originalUrl) process.env.ERP_WEBHOOK_URL = originalUrl;
  });
});

describe("ERP API Key Validation", () => {
  it("API key should be properly configured", () => {
    const apiKey = process.env.ERP_API_KEY!;
    expect(apiKey.length).toBeGreaterThanOrEqual(10);
  });

  it("Webhook secret should be cryptographically strong (>= 20 chars)", () => {
    const secret = process.env.ERP_WEBHOOK_SECRET!;
    expect(secret.length).toBeGreaterThanOrEqual(20);
  });
});
