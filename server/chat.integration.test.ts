import { describe, it, expect, beforeAll } from "vitest";
import { createTicket, addChatMessage, getChatHistory, getTicketByNo } from "./db";

describe("Chat System Integration", () => {
  let ticketNo: string;
  let ticketId: number;

  beforeAll(async () => {
    // 創建測試案件
    const ticket = await createTicket({
      region: "taipei",
      customerName: "測試客戶",
      customerPhone: "0912345678",
      customerEmail: "test@example.com",
      source: "contact_form",
    });
    ticketNo = ticket.ticketNo;
    ticketId = ticket.id;
    console.log(`Created test ticket: ${ticketNo} (ID: ${ticketId})`);
  });

  it("should query ticket by ticketNo", async () => {
    const ticket = await getTicketByNo(ticketNo);
    expect(ticket).toBeDefined();
    expect(ticket?.ticketNo).toBe(ticketNo);
    console.log(`✓ Query ticket by ticketNo: ${ticketNo}`);
  });

  it("should add customer message", async () => {
    const message = {
      role: "customer" as const,
      message: "您好，我想詢問搬家服務的價格",
      timestamp: Date.now(),
    };
    await addChatMessage(ticketId, message);
    console.log(`✓ Customer sent message: "${message.message}"`);
  });

  it("should retrieve chat history with customer message", async () => {
    const history = await getChatHistory(ticketId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].role).toBe("customer");
    expect(history[0].message).toContain("搬家服務");
    console.log(`✓ Retrieved chat history: ${history.length} message(s)`);
  });

  it("should add admin reply", async () => {
    const message = {
      role: "admin" as const,
      message: "感謝您的詢問，我們很樂意為您服務。請問您需要搬家的日期和地點是？",
      timestamp: Date.now(),
    };
    await addChatMessage(ticketId, message);
    console.log(`✓ Admin sent reply: "${message.message}"`);
  });

  it("should retrieve full chat history", async () => {
    const history = await getChatHistory(ticketId);
    expect(history.length).toBe(2);
    expect(history[0].role).toBe("customer");
    expect(history[1].role).toBe("admin");
    console.log(`✓ Full chat history retrieved:`);
    history.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${msg.role.toUpperCase()}] ${msg.message}`);
    });
  });

  it("should add customer follow-up message", async () => {
    const message = {
      role: "customer" as const,
      message: "我需要在下個月底前搬家，從台北市中山區搬到信義區",
      timestamp: Date.now(),
    };
    await addChatMessage(ticketId, message);
    console.log(`✓ Customer sent follow-up: "${message.message}"`);
  });

  it("should add admin final reply", async () => {
    const message = {
      role: "admin" as const,
      message: "明白了，我會為您安排上門勘查，請問您方便的時間是？",
      timestamp: Date.now(),
    };
    await addChatMessage(ticketId, message);
    console.log(`✓ Admin sent final reply: "${message.message}"`);
  });

  it("should verify complete conversation", async () => {
    const history = await getChatHistory(ticketId);
    expect(history.length).toBe(4);
    
    // 驗證對話順序
    const roles = history.map(m => m.role);
    expect(roles).toEqual(["customer", "admin", "customer", "admin"]);
    
    console.log(`✓ Complete conversation verified:`);
    console.log(`  Total messages: ${history.length}`);
    console.log(`  Conversation flow: ${roles.join(" → ")}`);
  });
});
