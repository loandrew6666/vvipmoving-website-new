import { describe, it, expect } from "vitest";

/**
 * 測試「雜物密度校正」邏輯：
 * 1. LLM 判斷的 clutterLevel 與客戶自選的 boxEstimation 取較高值
 * 2. 客戶低估雜物時（選 few 但照片顯示 high/extreme），以照片為準
 * 3. 各種組合的補償車數正確
 */

// 客戶自選的雜物等級對應補償車數
const customerClutterCompensation: Record<string, number> = {
  few: 0, normal: 0.5, many: 1.25, extreme: 2.25,
};

// LLM 照片判斷的雜物等級對應補償車數
const llmClutterCompensation: Record<string, number> = {
  none: 0, low: 0.25, medium: 0.75, high: 1.5, extreme: 2.5,
};

// 雜物密度聚合：取所有批次中最高的雜物等級
const clutterRank: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, extreme: 4 };

function aggregateClutterLevel(batchLevels: string[]): string {
  return batchLevels.reduce((max, level) => {
    return (clutterRank[level] ?? 0) > (clutterRank[max] ?? 0) ? level : max;
  }, "none");
}

function calculateClutterCompensation(
  boxEstimation: string | undefined,
  llmClutterLevel: string
): { compensation: number; customerComp: number; llmComp: number } {
  const customerComp = customerClutterCompensation[boxEstimation ?? "normal"] ?? 0.5;
  const llmComp = llmClutterCompensation[llmClutterLevel] ?? 0.25;
  const compensation = Math.max(customerComp, llmComp);
  return { compensation, customerComp, llmComp };
}

describe("雜物密度校正 — clutterLevel 聚合", () => {
  it("多批次取最高等級：[low, high, medium] → high", () => {
    expect(aggregateClutterLevel(["low", "high", "medium"])).toBe("high");
  });

  it("所有批次都是 none → none", () => {
    expect(aggregateClutterLevel(["none", "none", "none"])).toBe("none");
  });

  it("包含 extreme → extreme", () => {
    expect(aggregateClutterLevel(["low", "extreme", "medium"])).toBe("extreme");
  });

  it("單批次 → 直接使用該值", () => {
    expect(aggregateClutterLevel(["high"])).toBe("high");
  });

  it("空陣列 → none", () => {
    expect(aggregateClutterLevel([])).toBe("none");
  });
});

describe("雜物密度校正 — 補償計算", () => {
  it("客戶選 few + LLM 判斷 high：以 LLM 為準 (1.5 車)", () => {
    const result = calculateClutterCompensation("few", "high");
    expect(result.compensation).toBe(1.5);
    expect(result.customerComp).toBe(0);
    expect(result.llmComp).toBe(1.5);
  });

  it("客戶選 few + LLM 判斷 extreme：以 LLM 為準 (2.5 車)", () => {
    const result = calculateClutterCompensation("few", "extreme");
    expect(result.compensation).toBe(2.5);
  });

  it("客戶選 extreme + LLM 判斷 low：以客戶為準 (2.25 車)", () => {
    const result = calculateClutterCompensation("extreme", "low");
    expect(result.compensation).toBe(2.25);
    expect(result.customerComp).toBe(2.25);
    expect(result.llmComp).toBe(0.25);
  });

  it("客戶選 many + LLM 判斷 medium：以客戶為準 (1.25 車)", () => {
    const result = calculateClutterCompensation("many", "medium");
    expect(result.compensation).toBe(1.25);
  });

  it("客戶選 normal + LLM 判斷 high：以 LLM 為準 (1.5 車)", () => {
    const result = calculateClutterCompensation("normal", "high");
    expect(result.compensation).toBe(1.5);
  });

  it("客戶未選 + LLM 判斷 high：以 LLM 為準 (1.5 車)", () => {
    const result = calculateClutterCompensation(undefined, "high");
    expect(result.compensation).toBe(1.5);
    // 未選時預設 normal = 0.5
    expect(result.customerComp).toBe(0.5);
  });

  it("客戶選 few + LLM 判斷 none：兩者都是 0", () => {
    const result = calculateClutterCompensation("few", "none");
    expect(result.compensation).toBe(0);
  });

  it("客戶選 normal + LLM 判斷 low：LLM 0.25 < 客戶 0.5，以客戶為準", () => {
    const result = calculateClutterCompensation("normal", "low");
    expect(result.compensation).toBe(0.5);
  });
});

describe("雜物密度校正 — 個案 8 模擬（杜小姐案例）", () => {
  it("個案 8：客戶選 few 但照片大量雜物(LLM: high)，應補償 1.5 車", () => {
    // 客戶選了「少雜物」但照片中有非常多雜物
    const result = calculateClutterCompensation("few", "high");
    expect(result.compensation).toBe(1.5);
    // 確認是以 LLM 判斷為準，不是客戶的 0
    expect(result.compensation).toBeGreaterThan(result.customerComp);
  });

  it("個案 8 車數模擬：基礎物品 1.3 車 + 雜物補償 1.5 車 + 校正", () => {
    // 模擬：基礎辨識物品 1.3 車（水波爐 + 床墊 + 其他雜物箱）
    let truckCount = 1.3;
    
    // 加上雜物補償（客戶選 few=0, LLM 判斷 high=1.5，取較高值）
    const clutterComp = Math.max(
      customerClutterCompensation["few"]!,
      llmClutterCompensation["high"]!
    );
    truckCount += clutterComp; // 1.3 + 1.5 = 2.8
    
    // 非線性校正（2.5-4.5 車區間 ×1.04）
    truckCount = truckCount * 1.04; // 2.8 * 1.04 = 2.912
    truckCount = Math.round(truckCount * 10) / 10; // 2.9
    
    // 最終應在 2.5-4 車之間（合理範圍）
    expect(truckCount).toBeGreaterThanOrEqual(2.5);
    expect(truckCount).toBeLessThanOrEqual(4.0);
  });

  it("個案 8 理想情境：如果 LLM 正確辨識出雜物箱，基礎就該更高", () => {
    // 理想情境：LLM 辨識出大量雜物箱（假設 20 箱雜物 × 0.025 = 0.5 車）
    // + 其他物品 1.3 車 = 1.8 車基礎
    let truckCount = 1.8;
    
    // 加上雜物補償（LLM extreme = 2.5）
    const clutterComp = Math.max(
      customerClutterCompensation["few"]!,
      llmClutterCompensation["extreme"]!
    );
    truckCount += clutterComp; // 1.8 + 2.5 = 4.3
    
    // 非線性校正（2.5-4.5 車區間 ×1.04）
    truckCount = truckCount * 1.04; // 4.3 * 1.04 = 4.472
    truckCount = Math.round(truckCount * 10) / 10; // 4.5
    
    // 接近實際的 4 車
    expect(truckCount).toBeGreaterThanOrEqual(3.5);
    expect(truckCount).toBeLessThanOrEqual(5.0);
  });
});

describe("雜物密度校正 — 邊界情況", () => {
  it("所有等級的 customerClutterCompensation 值正確", () => {
    expect(customerClutterCompensation["few"]).toBe(0);
    expect(customerClutterCompensation["normal"]).toBe(0.5);
    expect(customerClutterCompensation["many"]).toBe(1.25);
    expect(customerClutterCompensation["extreme"]).toBe(2.25);
  });

  it("所有等級的 llmClutterCompensation 值正確", () => {
    expect(llmClutterCompensation["none"]).toBe(0);
    expect(llmClutterCompensation["low"]).toBe(0.25);
    expect(llmClutterCompensation["medium"]).toBe(0.75);
    expect(llmClutterCompensation["high"]).toBe(1.5);
    expect(llmClutterCompensation["extreme"]).toBe(2.5);
  });

  it("未知等級使用預設值", () => {
    const result = calculateClutterCompensation("unknown" as string, "unknown" as string);
    // 未知 boxEstimation → 預設 0.5 (normal fallback)
    // 未知 llmClutterLevel → 預設 0.25 (low fallback)
    expect(result.customerComp).toBe(0.5);
    expect(result.llmComp).toBe(0.25);
    expect(result.compensation).toBe(0.5);
  });
});
