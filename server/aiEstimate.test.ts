import { describe, it, expect } from "vitest";

// 測試物件車數對照表的計算邏輯
const ITEM_TRUCK_MAP: Record<string, number> = {
  "紙箱": 0.025, "行李箱": 0.02,
  "雙門冰箱": 0.34, "洗衣機": 0.10,
  "床墊": 0.30, "床架": 0.30, "衣櫃": 0.40,
  "雙人沙發": 0.20, "三人沙發": 0.30, "L型沙發": 0.80,
  "直立式鋼琴": 0.50, "三角鋼琴": 0.75,
};

function calcTruckCount(items: Array<{ name: string; count: number; truckUnit: number }>) {
  let total = 0;
  for (const item of items) {
    const mapKey = Object.keys(ITEM_TRUCK_MAP).find(k => item.name.includes(k));
    const unit = mapKey ? ITEM_TRUCK_MAP[mapKey]! : item.truckUnit;
    total += unit * item.count;
  }
  return Math.round(total * 10) / 10;
}

describe("AI 估價 - 物件車數計算", () => {
  it("單一物件計算正確", () => {
    const result = calcTruckCount([{ name: "雙門冰箱", count: 1, truckUnit: 0.34 }]);
    expect(result).toBe(0.3); // 0.34 rounded to 0.3
  });

  it("多物件累加計算", () => {
    const result = calcTruckCount([
      { name: "床墊", count: 1, truckUnit: 0.30 },
      { name: "衣櫃", count: 2, truckUnit: 0.40 },
      { name: "洗衣機", count: 1, truckUnit: 0.10 },
    ]);
    // 0.30 + 0.80 + 0.10 = 1.20
    expect(result).toBe(1.2);
  });

  it("L型沙發計算正確", () => {
    const result = calcTruckCount([{ name: "L型沙發", count: 1, truckUnit: 0.80 }]);
    expect(result).toBe(0.8);
  });

  it("鋼琴計算正確", () => {
    const result = calcTruckCount([{ name: "直立式鋼琴", count: 1, truckUnit: 0.50 }]);
    expect(result).toBe(0.5);
  });

  it("未知物件使用 LLM 提供的 truckUnit", () => {
    const result = calcTruckCount([{ name: "特殊大型機器", count: 1, truckUnit: 0.60 }]);
    expect(result).toBe(0.6);
  });
});

describe("AI 估價 - 新版估價範圍計算（每車 12,000，-5000 ~ +15,000）", () => {
  const PRICE_PER_TRUCK = 12000;
  const PRICE_RANGE_LOW_OFFSET = 5000;
  const PRICE_RANGE_HIGH_OFFSET = 15000;

  function calcPriceRange(truckCount: number) {
    const effectiveTrucks = Math.max(truckCount, 1);
    const basePrice = Math.round(effectiveTrucks * PRICE_PER_TRUCK / 1000) * 1000;
    return {
      min: Math.max(basePrice - PRICE_RANGE_LOW_OFFSET, PRICE_PER_TRUCK),
      max: basePrice + PRICE_RANGE_HIGH_OFFSET,
    };
  }

  it("1 車估價範圍：12,000 ~ 27,000", () => {
    const range = calcPriceRange(1);
    expect(range.min).toBe(12000);
    expect(range.max).toBe(27000);
  });

  it("2 車估價範圍：19,000 ~ 39,000", () => {
    const range = calcPriceRange(2);
    expect(range.min).toBe(19000);
    expect(range.max).toBe(39000);
  });

  it("4 車估價範圍：43,000 ~ 63,000（涵蓋個案 8 實際 46,000）", () => {
    const range = calcPriceRange(4);
    expect(range.min).toBe(43000);
    expect(range.max).toBe(63000);
    expect(range.min).toBeLessThanOrEqual(46000);
    expect(range.max).toBeGreaterThanOrEqual(46000);
  });

  it("車數為 0 時最少以 1 車計算", () => {
    const range = calcPriceRange(0);
    expect(range.min).toBe(12000);
    expect(range.max).toBe(27000);
  });
});
