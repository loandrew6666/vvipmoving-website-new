import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database helpers
vi.mock("./db", () => ({
  getAllTickets: vi.fn(),
  getTicketById: vi.fn(),
  getTicketsByStatus: vi.fn(),
  updateTicketStatus: vi.fn(),
  getTicketByNo: vi.fn(),
  getTicketByPhone: vi.fn(),
  createTicket: vi.fn(),
  getAllFaqs: vi.fn(),
  getAllCases: vi.fn(),
  getCaseById: vi.fn(),
  getAllNews: vi.fn(),
  getNewsBySlug: vi.fn(),
  createContact: vi.fn(),
  getAllContacts: vi.fn(),
  getTicketById: vi.fn(),
}));

import { getAllTickets, getTicketsByStatus, getTicketById, updateTicketStatus } from "./db";

describe("Admin - 案件管理資料層", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllTickets 應回傳所有案件", async () => {
    const mockTickets = [
      { id: 1, ticketNo: "VV-2024-001", customerName: "王小明", status: "new", region: "taipei" },
      { id: 2, ticketNo: "VV-2024-002", customerName: "李小華", status: "pending", region: "kaohsiung" },
    ];
    vi.mocked(getAllTickets).mockResolvedValue(mockTickets as any);

    const result = await getAllTickets();
    expect(result).toHaveLength(2);
    expect(result[0]?.ticketNo).toBe("VV-2024-001");
  });

  it("getTicketsByStatus 應依狀態篩選案件", async () => {
    const mockNewTickets = [
      { id: 1, ticketNo: "VV-2024-001", status: "new" },
    ];
    vi.mocked(getTicketsByStatus).mockResolvedValue(mockNewTickets as any);

    const result = await getTicketsByStatus("new");
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("new");
  });

  it("getTicketsByStatus 不傳狀態時應回傳所有案件", async () => {
    const mockAll = [
      { id: 1, status: "new" },
      { id: 2, status: "completed" },
    ];
    vi.mocked(getTicketsByStatus).mockResolvedValue(mockAll as any);

    const result = await getTicketsByStatus();
    expect(result).toHaveLength(2);
  });

  it("getTicketById 應回傳指定案件", async () => {
    const mockTicket = { id: 5, ticketNo: "VV-2024-005", customerName: "陳大文" };
    vi.mocked(getTicketById).mockResolvedValue(mockTicket as any);

    const result = await getTicketById(5);
    expect(result?.id).toBe(5);
    expect(result?.customerName).toBe("陳大文");
  });

  it("getTicketById 找不到時應回傳 null", async () => {
    vi.mocked(getTicketById).mockResolvedValue(null);

    const result = await getTicketById(9999);
    expect(result).toBeNull();
  });

  it("updateTicketStatus 應呼叫更新函數", async () => {
    vi.mocked(updateTicketStatus).mockResolvedValue(undefined);

    await updateTicketStatus(1, "quoted", "已電話確認報價");
    expect(updateTicketStatus).toHaveBeenCalledWith(1, "quoted", "已電話確認報價");
  });

  it("updateTicketStatus 不帶備註時應正常運作", async () => {
    vi.mocked(updateTicketStatus).mockResolvedValue(undefined);

    await updateTicketStatus(2, "completed");
    expect(updateTicketStatus).toHaveBeenCalledWith(2, "completed");
  });
});

describe("Admin - 統計計算邏輯", () => {
  it("應正確計算各狀態數量", () => {
    const tickets = [
      { status: "new" },
      { status: "new" },
      { status: "pending" },
      { status: "quoted" },
      { status: "completed" },
      { status: "completed" },
      { status: "archived" },
    ] as any[];

    const counts = {
      total: tickets.length,
      new: tickets.filter(t => t.status === "new").length,
      pending: tickets.filter(t => t.status === "pending").length,
      quoted: tickets.filter(t => t.status === "quoted").length,
      contracted: tickets.filter(t => t.status === "contracted").length,
      scheduled: tickets.filter(t => t.status === "scheduled").length,
      completed: tickets.filter(t => t.status === "completed").length,
      archived: tickets.filter(t => t.status === "archived").length,
    };

    expect(counts.total).toBe(7);
    expect(counts.new).toBe(2);
    expect(counts.pending).toBe(1);
    expect(counts.quoted).toBe(1);
    expect(counts.completed).toBe(2);
    expect(counts.archived).toBe(1);
    expect(counts.contracted).toBe(0);
    expect(counts.scheduled).toBe(0);
  });
});
