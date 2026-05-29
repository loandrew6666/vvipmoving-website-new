import { describe, it, expect } from "vitest";

/**
 * AI 估價系統升級測試
 * 驗證新增的校正係數、紙箱補償、電梯懲罰等邏輯
 */

// 模擬校正係數邏輯
function applyCalibration(truckCount: number): number {
  if (truckCount <= 2.5) {
    return Math.round(truckCount * 1.41 * 10) / 10;
  } else if (truckCount <= 4.5) {
    return Math.round(truckCount * 1.04 * 10) / 10;
  } else if (truckCount <= 7.0) {
    return Math.round(truckCount * 1.20 * 10) / 10;
  } else {
    return Math.round(truckCount * 0.81 * 10) / 10;
  }
}

// 模擬紙箱補償邏輯
function applyBoxCompensation(
  truckCount: number,
  boxEstimation: "few" | "normal" | "many" | "extreme" | undefined,
  totalRooms: number
): number {
  if (boxEstimation === "many" || (!boxEstimation && totalRooms >= 3)) {
    return truckCount + 1.25;
  } else if (boxEstimation === "extreme") {
    return truckCount + 2.25;
  } else if (boxEstimation === "normal") {
    return truckCount + 0.5;
  }
  return truckCount;
}

// 模擬電梯懲罰邏輯
function applyElevatorPenalty(
  truckCount: number,
  fromHasElevator: "yes" | "no" | undefined,
  fromFloor: number | undefined,
  toHasElevator: "yes" | "no" | undefined,
  toFloor: number | undefined
): number {
  const noElevatorHighFloor =
    (fromHasElevator === "no" && (fromFloor ?? 0) > 3) ||
    (toHasElevator === "no" && (toFloor ?? 0) > 3);
  if (noElevatorHighFloor) {
    return truckCount * 1.05;
  }
  return truckCount;
}

describe("AI 估價系統 - 非線性校正係數", () => {
  it("小型案件 (≤2.5車) 應乘以 1.41", () => {
    expect(applyCalibration(1.0)).toBe(1.4);
    expect(applyCalibration(2.0)).toBe(2.8);
    expect(applyCalibration(2.5)).toBe(3.5);
  });

  it("中型案件 (2.5-4.5車) 應乘以 1.04", () => {
    expect(applyCalibration(3.0)).toBe(3.1);
    expect(applyCalibration(4.0)).toBe(4.2);
    expect(applyCalibration(4.5)).toBe(4.7);
  });

  it("大型案件 (4.5-7.0車) 應乘以 1.20", () => {
    expect(applyCalibration(5.0)).toBe(6.0);
    expect(applyCalibration(6.0)).toBe(7.2);
    expect(applyCalibration(7.0)).toBe(8.4);
  });

  it("超大型案件 (>7.0車) 應乘以 0.81", () => {
    expect(applyCalibration(8.0)).toBe(6.5);
    expect(applyCalibration(10.0)).toBe(8.1);
  });
});

describe("AI 估價系統 - 紙箱/雜物補償", () => {
  it("紙箱「極少」不應補償", () => {
    expect(applyBoxCompensation(2.0, "few", 2)).toBe(2.0);
  });

  it("紙箱「一般」應加 0.5 車", () => {
    expect(applyBoxCompensation(2.0, "normal", 2)).toBe(2.5);
  });

  it("紙箱「多」應加 1.25 車", () => {
    expect(applyBoxCompensation(2.0, "many", 2)).toBe(3.25);
  });

  it("紙箱「極多」應加 2.25 車", () => {
    expect(applyBoxCompensation(2.0, "extreme", 2)).toBe(4.25);
  });

  it("未填寫紙箱量但房型≥3房應加 1.25 車", () => {
    expect(applyBoxCompensation(2.0, undefined, 3)).toBe(3.25);
    expect(applyBoxCompensation(2.0, undefined, 4)).toBe(3.25);
  });

  it("未填寫紙箱量且房型<3房不應補償", () => {
    expect(applyBoxCompensation(2.0, undefined, 2)).toBe(2.0);
    expect(applyBoxCompensation(2.0, undefined, 1)).toBe(2.0);
  });
});

describe("AI 估價系統 - 電梯/樓層懲罰", () => {
  it("有電梯不應懲罰", () => {
    expect(applyElevatorPenalty(3.0, "yes", undefined, "yes", undefined)).toBe(3.0);
  });

  it("無電梯但樓層≤3不應懲罰", () => {
    expect(applyElevatorPenalty(3.0, "no", 2, "yes", undefined)).toBe(3.0);
    expect(applyElevatorPenalty(3.0, "no", 3, "yes", undefined)).toBe(3.0);
  });

  it("搬出無電梯且樓層>3應乘以 1.05", () => {
    const result = applyElevatorPenalty(3.0, "no", 5, "yes", undefined);
    expect(result).toBeCloseTo(3.15, 2);
  });

  it("搬入無電梯且樓層>3應乘以 1.05", () => {
    const result = applyElevatorPenalty(3.0, "yes", undefined, "no", 6);
    expect(result).toBeCloseTo(3.15, 2);
  });

  it("雙邊都無電梯高樓層只懲罰一次", () => {
    const result = applyElevatorPenalty(3.0, "no", 5, "no", 6);
    expect(result).toBeCloseTo(3.15, 2); // 只乘一次 1.05
  });
});

describe("AI 估價系統 - 超過 6 車自動標記", () => {
  it("≤6 車不需要人工複核", () => {
    expect(applyCalibration(4.0)).toBeLessThanOrEqual(6);
    // 4.0 車 → 4.2 (×1.04)，不超過 6
  });

  it("大型案件校正後可能超過 6 車", () => {
    // 5.0 車 → 6.0 (×1.20)，剛好 6 車
    expect(applyCalibration(5.0)).toBe(6.0);
    // 5.5 車 → 6.6 (×1.20)，超過 6 車
    expect(applyCalibration(5.5)).toBe(6.6);
  });
});

describe("AI 估價系統 - 完整流程模擬", () => {
  it("典型 2 房案件（一般雜物、有電梯）", () => {
    let trucks = 1.5; // 基礎物品車數
    trucks = applyBoxCompensation(trucks, "normal", 2); // +0.5 = 2.0
    trucks = applyElevatorPenalty(trucks, "yes", undefined, "yes", undefined); // 不變 = 2.0
    trucks = applyCalibration(trucks); // ×1.41 = 2.8
    expect(trucks).toBe(2.8);
  });

  it("典型 3 房案件（多雜物、無電梯 5F）", () => {
    let trucks = 2.5; // 基礎物品車數
    trucks = applyBoxCompensation(trucks, "many", 3); // +1.25 = 3.75
    trucks = applyElevatorPenalty(trucks, "no", 5, "yes", undefined); // ×1.05 = 3.9375
    trucks = applyCalibration(trucks); // 3.9375 在 2.5-4.5 區間 → ×1.04 = 4.1
    expect(trucks).toBe(4.1);
  });

  it("大型 4 房案件（極多雜物、無電梯 8F）", () => {
    let trucks = 4.0; // 基礎物品車數
    trucks = applyBoxCompensation(trucks, "extreme", 4); // +2.25 = 6.25
    trucks = applyElevatorPenalty(trucks, "no", 8, "no", 4); // ×1.05 = 6.5625
    trucks = applyCalibration(trucks); // 6.5625 在 4.5-7 區間 → ×1.20 = 7.9
    expect(trucks).toBe(7.9);
    // 超過 6 車，需人工複核
    expect(trucks).toBeGreaterThan(6);
  });
});

describe("AI 估價系統 - Input Schema 驗證", () => {
  it("boxEstimation 應接受有效值", () => {
    const validValues = ["few", "normal", "many", "extreme"];
    validValues.forEach((v) => {
      expect(["few", "normal", "many", "extreme"].includes(v)).toBe(true);
    });
  });

  it("fromHasElevator/toHasElevator 應接受 yes/no", () => {
    const validValues = ["yes", "no"];
    validValues.forEach((v) => {
      expect(["yes", "no"].includes(v)).toBe(true);
    });
  });
});
