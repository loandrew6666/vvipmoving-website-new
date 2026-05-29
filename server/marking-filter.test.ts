import { describe, it, expect } from "vitest";

/**
 * 塗鴉標記過濾邏輯測試
 * ✓ 打勾、○ 圓圈 → 預設搬運
 * ✗ 打叉 → 預設不搬，與文字比對排除查重
 */

type DetectedItem = {
  name: string;
  count: number;
  truckUnit: number;
  room: string;
  markingType: "checkmark" | "circle" | "cross" | "none";
};

function filterCrossMarkedItems(items: DetectedItem[]): DetectedItem[] {
  const crossMarkedItems = items.filter((item) => item.markingType === "cross");
  if (crossMarkedItems.length === 0) return items;

  const crossMarkedKeywords = new Set(
    crossMarkedItems.map((item) => item.name.toLowerCase())
  );

  return items.filter((item) => {
    const itemName = item.name.toLowerCase();
    const isCrossMarked = item.markingType === "cross";

    if (isCrossMarked) return false;

    const matchesCrossMarked = Array.from(crossMarkedKeywords).some(
      (keyword: string) => {
        return itemName.includes(keyword) || keyword.includes(itemName);
      }
    );

    return !matchesCrossMarked;
  });
}

describe("塗鴉標記過濾 — 打叉標記物品排除", () => {
  it("無塗鴉標記：所有物品保留", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "none" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(2);
  });

  it("打勾標記：物品保留", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "checkmark" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("床墊");
  });

  it("圓圈標記：物品保留", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "circle" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(2);
  });

  it("打叉標記：物品排除", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("衣櫃");
  });

  it("打叉標記與相符物品排除（查重）", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "雙人床墊", count: 1, truckUnit: 0.35, room: "臥室", markingType: "none" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    // 應排除：「床墊」(打叉) + 「雙人床墊」(包含「床墊」，查重)
    // 保留：「衣櫃」
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("衣櫃");
  });

  it("多個打叉標記物品排除", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "枕頭", count: 2, truckUnit: 0.1, room: "臥室", markingType: "cross" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
      { name: "沙發", count: 1, truckUnit: 0.3, room: "客廳", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual(["衣櫃", "沙發"]);
  });

  it("打叉標記物品與不搬文字清單聯合排除", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "床架", count: 1, truckUnit: 0.3, room: "臥室", markingType: "none" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    
    // 先過濾打叉標記
    let filtered = filterCrossMarkedItems(items);
    expect(filtered).toHaveLength(2);
    
    // 再過濾不搬物品（床架）
    const notMovingKeywords = ["床架"];
    filtered = filtered.filter((item) => {
      const itemName = item.name.toLowerCase();
      return !notMovingKeywords.some(
        (keyword) => itemName.includes(keyword) || keyword.includes(itemName)
      );
    });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("衣櫃");
  });

  it("打叉標記物品名稱大小寫不敏感", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "雙人床墊", count: 1, truckUnit: 0.35, room: "臥室", markingType: "none" },
      { name: "KING SIZE 床墊", count: 1, truckUnit: 0.4, room: "臥室", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    // 所有包含「床墊」的物品都應被排除
    expect(result).toHaveLength(0);
  });

  it("打叉標記與打勾標記混合", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "衣櫃", count: 1, truckUnit: 0.4, room: "臥室", markingType: "checkmark" },
      { name: "沙發", count: 1, truckUnit: 0.3, room: "客廳", markingType: "circle" },
      { name: "椅子", count: 2, truckUnit: 0.1, room: "客廳", markingType: "none" },
    ];
    const result = filterCrossMarkedItems(items);
    // 保留：衣櫃(✓)、沙發(○)、椅子(無標記)
    // 排除：床墊(✗)
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.name)).toEqual(["衣櫃", "沙發", "椅子"]);
  });

  it("空物品清單", () => {
    const items: DetectedItem[] = [];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(0);
  });

  it("只有打叉標記物品", () => {
    const items: DetectedItem[] = [
      { name: "床墊", count: 1, truckUnit: 0.3, room: "臥室", markingType: "cross" },
      { name: "枕頭", count: 2, truckUnit: 0.1, room: "臥室", markingType: "cross" },
    ];
    const result = filterCrossMarkedItems(items);
    expect(result).toHaveLength(0);
  });
});
