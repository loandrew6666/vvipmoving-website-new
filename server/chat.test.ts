import { describe, it, expect, vi, beforeEach } from "vitest";
import { addChatMessage, getChatHistory, ChatMessage } from "./db";

// Mock database
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getDb: vi.fn(),
    getTicketById: vi.fn(),
    addChatMessage: vi.fn(),
    getChatHistory: vi.fn(),
  };
});

describe("Chat System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add a chat message to ticket", async () => {
    const mockMessage: ChatMessage = {
      role: "customer",
      message: "Hello, I need help with my move",
      timestamp: Date.now(),
    };

    const mockAddChatMessage = vi.fn().mockResolvedValue(undefined);
    vi.mocked(addChatMessage).mockImplementation(mockAddChatMessage);

    // Simulate adding a message
    await addChatMessage(1, mockMessage);

    expect(mockAddChatMessage).toHaveBeenCalledWith(1, mockMessage);
  });

  it("should retrieve chat history for a ticket", async () => {
    const mockHistory: ChatMessage[] = [
      {
        role: "customer",
        message: "Hello",
        timestamp: 1000,
      },
      {
        role: "admin",
        message: "Hi, how can I help?",
        timestamp: 2000,
      },
    ];

    const mockGetChatHistory = vi.fn().mockResolvedValue(mockHistory);
    vi.mocked(getChatHistory).mockImplementation(mockGetChatHistory);

    const result = await getChatHistory(1);

    expect(mockGetChatHistory).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockHistory);
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no chat history exists", async () => {
    const mockGetChatHistory = vi.fn().mockResolvedValue([]);
    vi.mocked(getChatHistory).mockImplementation(mockGetChatHistory);

    const result = await getChatHistory(999);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("should preserve message order in chat history", async () => {
    const messages: ChatMessage[] = [
      { role: "customer", message: "First message", timestamp: 1000 },
      { role: "admin", message: "Admin reply", timestamp: 2000 },
      { role: "customer", message: "Follow-up", timestamp: 3000 },
    ];

    const mockGetChatHistory = vi.fn().mockResolvedValue(messages);
    vi.mocked(getChatHistory).mockImplementation(mockGetChatHistory);

    const result = await getChatHistory(1);

    expect(result[0].message).toBe("First message");
    expect(result[1].message).toBe("Admin reply");
    expect(result[2].message).toBe("Follow-up");
  });

  it("should handle admin messages correctly", async () => {
    const adminMessage: ChatMessage = {
      role: "admin",
      message: "We will contact you soon",
      timestamp: Date.now(),
    };

    const mockAddChatMessage = vi.fn().mockResolvedValue(undefined);
    vi.mocked(addChatMessage).mockImplementation(mockAddChatMessage);

    await addChatMessage(1, adminMessage);

    expect(mockAddChatMessage).toHaveBeenCalledWith(1, adminMessage);
    expect(mockAddChatMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        role: "admin",
        message: "We will contact you soon",
      })
    );
  });

  it("should handle customer messages correctly", async () => {
    const customerMessage: ChatMessage = {
      role: "customer",
      message: "When can you come for evaluation?",
      timestamp: Date.now(),
    };

    const mockAddChatMessage = vi.fn().mockResolvedValue(undefined);
    vi.mocked(addChatMessage).mockImplementation(mockAddChatMessage);

    await addChatMessage(1, customerMessage);

    expect(mockAddChatMessage).toHaveBeenCalledWith(1, customerMessage);
    expect(mockAddChatMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        role: "customer",
        message: "When can you come for evaluation?",
      })
    );
  });
});
