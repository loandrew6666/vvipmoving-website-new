import { describe, it, expect } from "vitest";

// 複製後端的新價格計算邏輯進行單元測試
// 每車 12,000 元（完整打包、搬運、歸位），下限 -5000，上限 +15,000
const PRICE_PER_TRUCK = 12000;
const PRICE_RANGE_LOW_OFFSET = 5000;
const PRICE_RANGE_HIGH_OFFSET = 15000;

function calculatePriceRange(truckCount: number) {
  const effectiveTrucks = Math.max(truckCount, 1);
  const basePrice = Math.round(effectiveTrucks * PRICE_PER_TRUCK / 1000) * 1000;
  return {
    min: Math.max(basePrice - PRICE_RANGE_LOW_OFFSET, PRICE_PER_TRUCK),
    max: basePrice + PRICE_RANGE_HIGH_OFFSET,
  };
}

describe("價格範圍計算 — 每車 12,000，下限 -5000，上限 +15,000", () => {
  it("1 車：基準 12,000 → 範圍 12,000 ~ 27,000", () => {
    const range = calculatePriceRange(1);
    // basePrice = round(1 * 12000 / 1000) * 1000 = 12000
    // min = max(12000 - 5000, 12000) = 12000（保底 12000）
    expect(range.min).toBe(12000);
    expect(range.max).toBe(27000); // 12000 + 15000
  });

  it("2 車：基準 24,000 → 範圍 19,000 ~ 39,000", () => {
    const range = calculatePriceRange(2);
    // basePrice = round(2 * 12000 / 1000) * 1000 = 24000
    expect(range.min).toBe(19000); // 24000 - 5000
    expect(range.max).toBe(39000); // 24000 + 15000
  });

  it("3 車：基準 36,000 → 範圍 31,000 ~ 51,000", () => {
    const range = calculatePriceRange(3);
    // basePrice = round(3 * 12000 / 1000) * 1000 = 36000
    expect(range.min).toBe(31000); // 36000 - 5000
    expect(range.max).toBe(51000); // 36000 + 15000
  });

  it("4 車：基準 48,000 → 範圍 43,000 ~ 63,000", () => {
    const range = calculatePriceRange(4);
    // basePrice = round(4 * 12000 / 1000) * 1000 = 48000
    expect(range.min).toBe(43000); // 48000 - 5000
    expect(range.max).toBe(63000); // 48000 + 15000
  });

  it("5 車：基準 60,000 → 範圍 55,000 ~ 75,000", () => {
    const range = calculatePriceRange(5);
    expect(range.min).toBe(55000);
    expect(range.max).toBe(75000);
  });

  it("0.5 車（不足 1 車）：以 1 車計算，範圍 12,000 ~ 27,000", () => {
    const range = calculatePriceRange(0.5);
    // effectiveTrucks = max(0.5, 1) = 1
    expect(range.min).toBe(12000);
    expect(range.max).toBe(27000);
  });

  it("1.5 車：基準 18,000 → 範圍 13,000 ~ 33,000", () => {
    const range = calculatePriceRange(1.5);
    // basePrice = round(1.5 * 12000 / 1000) * 1000 = 18000
    expect(range.min).toBe(13000); // 18000 - 5000
    expect(range.max).toBe(33000); // 18000 + 15000
  });

  it("6.9 車：基準 83,000 → 範圍 78,000 ~ 98,000", () => {
    const range = calculatePriceRange(6.9);
    // basePrice = round(6.9 * 12000 / 1000) * 1000 = round(82.8) * 1000 = 83000
    expect(range.min).toBe(78000); // 83000 - 5000
    expect(range.max).toBe(98000); // 83000 + 15000
  });

  it("10 車：基準 120,000 → 範圍 115,000 ~ 135,000", () => {
    const range = calculatePriceRange(10);
    expect(range.min).toBe(115000);
    expect(range.max).toBe(135000);
  });

  it("範圍差距永遠是 20,000（除了 1 車保底情況）", () => {
    // 2 車以上：max - min = (base + 15000) - (base - 5000) = 20000
    for (const trucks of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const range = calculatePriceRange(trucks);
      expect(range.max - range.min).toBe(20000);
    }
  });

  it("1 車保底：min 不低於 12,000", () => {
    const range = calculatePriceRange(1);
    expect(range.min).toBeGreaterThanOrEqual(PRICE_PER_TRUCK);
    // 1 車時 basePrice=12000, 12000-5000=7000 < 12000，所以保底 12000
    // max - min = 27000 - 12000 = 15000（比 20000 小）
    expect(range.max - range.min).toBe(15000);
  });

  it("個案 8 模擬（4 車）：基準 48,000 → 範圍 43,000 ~ 63,000，涵蓋實際 46,000", () => {
    const range = calculatePriceRange(4);
    const actualPrice = 46000;
    expect(range.min).toBeLessThanOrEqual(actualPrice);
    expect(range.max).toBeGreaterThanOrEqual(actualPrice);
  });
});
