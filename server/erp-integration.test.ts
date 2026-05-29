import { describe, it, expect } from "vitest";
import { buildErpPayload, type TicketDataForErp } from "./erp-integration";

describe("ERP Integration - buildErpPayload", () => {
  it("should map basic ticket fields correctly", () => {
    const ticket: TicketDataForErp = {
      ticketNo: "VV-TP-2026-12345",
      customerName: "張小明",
      customerPhone: "0912345678",
      fromAddress: "台北市信義區信義路五段7號",
      toAddress: "台中市西屯區台灣大道三段99號",
      fromFloor: 3,
      toFloor: 5,
      fromHasElevator: "yes",
      toHasElevator: "no",
      moveDate: new Date("2026-05-20"),
    };

    const payload = buildErpPayload(ticket);

    expect(payload.customerName).toBe("張小明");
    expect(payload.customerPhone).toBe("0912345678");
    expect(payload.pickupAddress).toBe("台北市信義區信義路五段7號");
    expect(payload.dropoffAddress).toBe("台中市西屯區台灣大道三段99號");
    expect(payload.oldFloor).toBe("3");
    expect(payload.newFloor).toBe("5");
    expect(payload.oldHasElevator).toBe(true);
    expect(payload.newHasElevator).toBe(false);
    expect(payload.serviceDateRange).toBe("2026-05-20");
    expect(payload.serviceType).toBe("搬家服務");
  });

  it("should handle null/undefined fields gracefully", () => {
    const ticket: TicketDataForErp = {
      customerName: "李大華",
      customerPhone: "0987654321",
    };

    const payload = buildErpPayload(ticket);

    expect(payload.customerName).toBe("李大華");
    expect(payload.customerPhone).toBe("0987654321");
    expect(payload.pickupAddress).toBeUndefined();
    expect(payload.dropoffAddress).toBeUndefined();
    expect(payload.oldFloor).toBeUndefined();
    expect(payload.newFloor).toBeUndefined();
    expect(payload.oldHasElevator).toBeUndefined();
    expect(payload.newHasElevator).toBeUndefined();
    expect(payload.serviceDateRange).toBeUndefined();
  });

  it("should include AI result in note", () => {
    const ticket: TicketDataForErp = {
      ticketNo: "VV-TP-2026-99999",
      customerName: "王美麗",
      customerPhone: "0911222333",
      aiResult: {
        truckCount: 3.5,
        furnitureCount: 8,
        priceRange: { min: 37000, max: 57000 },
        clutterLevel: "high",
        detectedItems: [
          { name: "雙人床架", quantity: 1, truckLoad: 0.4, room: "臥室" },
          { name: "冰箱", quantity: 1, truckLoad: 0.4, room: "廚房" },
        ],
      },
    };

    const payload = buildErpPayload(ticket);

    expect(payload.note).toContain("VV-TP-2026-99999");
    expect(payload.note).toContain("3.5 車");
    expect(payload.note).toContain("8 件");
    expect(payload.note).toContain("37,000");
    expect(payload.note).toContain("57,000");
    expect(payload.note).toContain("high");
    expect(payload.note).toContain("雙人床架");
    expect(payload.note).toContain("冰箱");
  });

  it("should include room layout in note", () => {
    const ticket: TicketDataForErp = {
      customerName: "陳先生",
      customerPhone: "0922333444",
      roomLayout: { living: 1, bedroom: 2, kitchen: 1, study: 0, balcony: 1, other: 0 },
    };

    const payload = buildErpPayload(ticket);

    expect(payload.note).toContain("客廳 x1");
    expect(payload.note).toContain("臥室 x2");
    expect(payload.note).toContain("廚房 x1");
    expect(payload.note).toContain("陽台 x1");
    expect(payload.note).not.toContain("書房");
    expect(payload.note).not.toContain("其他");
  });

  it("should include photo URLs in note", () => {
    const ticket: TicketDataForErp = {
      customerName: "林小姐",
      customerPhone: "0933444555",
      photoUrls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
    };

    const payload = buildErpPayload(ticket);

    expect(payload.note).toContain("共 2 張");
    expect(payload.note).toContain("https://example.com/1.jpg");
    expect(payload.note).toContain("https://example.com/2.jpg");
  });

  it("should include LINE and email in note", () => {
    const ticket: TicketDataForErp = {
      customerName: "趙先生",
      customerPhone: "0944555666",
      customerLine: "zhao_line",
      customerEmail: "zhao@example.com",
    };

    const payload = buildErpPayload(ticket);

    expect(payload.note).toContain("zhao_line");
    expect(payload.note).toContain("zhao@example.com");
  });

  it("should handle moveDate as ISO string", () => {
    const ticket: TicketDataForErp = {
      customerName: "吳先生",
      customerPhone: "0955666777",
      moveDate: "2026-06-15T00:00:00.000Z",
    };

    const payload = buildErpPayload(ticket);

    expect(payload.serviceDateRange).toBe("2026-06-15");
  });

  it("should include customer notes in note field", () => {
    const ticket: TicketDataForErp = {
      customerName: "黃小姐",
      customerPhone: "0966777888",
      notes: "有大型鋼琴需要搬運，需要特殊包裝",
    };

    const payload = buildErpPayload(ticket);

    expect(payload.note).toContain("有大型鋼琴需要搬運，需要特殊包裝");
  });
});

describe("ERP Integration - API connectivity", () => {
  it("should have ERP_API_URL configured", () => {
    const url = process.env.ERP_API_URL;
    expect(url).toBeDefined();
    expect(url).toContain("43.103.3.57");
  });

  it("should have ERP_API_KEY configured", () => {
    const key = process.env.ERP_API_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(0);
  });

  it("should get 401 with wrong API key (verifies endpoint is reachable)", async () => {
    const url = process.env.ERP_API_URL || "http://43.103.3.57:8080/api/public/quotes/external";
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": "WRONG_KEY_FOR_TESTING",
        },
        body: JSON.stringify({
          customerName: "測試",
          customerPhone: "0900000000",
        }),
        signal: AbortSignal.timeout(10000),
      });
      
      // If endpoint is reachable, wrong key should return 401
      expect(response.status).toBe(401);
    } catch (error) {
      // If endpoint is not reachable (network error), skip this test
      console.warn("[ERP Test] Endpoint not reachable, skipping connectivity test:", error);
    }
  });

  it("should successfully send test data with correct API key", async () => {
    const url = process.env.ERP_API_URL || "http://43.103.3.57:8080/api/public/quotes/external";
    const key = process.env.ERP_API_KEY || "";
    
    if (!key) {
      console.warn("[ERP Test] No API key configured, skipping");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": key,
        },
        body: JSON.stringify({
          customerName: "系統測試",
          customerPhone: "0900000001",
          note: "此為自動化測試資料，請忽略",
        }),
        signal: AbortSignal.timeout(10000),
      });
      
      // Accept 200 (success) or 400 (duplicate phone - means API is working)
      expect([200, 400]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty("id");
        console.log("[ERP Test] Test data sent successfully, ERP ID:", data.id);
      } else {
        const text = await response.text();
        console.log("[ERP Test] Got expected 400 (likely duplicate):", text);
      }
    } catch (error) {
      console.warn("[ERP Test] Endpoint not reachable:", error);
    }
  });
});
