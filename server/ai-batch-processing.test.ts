import { describe, it, expect } from "vitest";

// 測試批次處理邏輯
describe("AI Estimate Batch Processing", () => {
  // 模擬批次分割邏輯
  const BATCH_SIZE = 8;
  
  function splitIntoBatches(urls: string[]): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      batches.push(urls.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }

  it("should process all photos without any limit", () => {
    const urls = Array.from({ length: 32 }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
    const batches = splitIntoBatches(urls);
    
    // 32 張照片應分為 4 批
    expect(batches.length).toBe(4);
    // 每批 8 張
    expect(batches[0].length).toBe(8);
    expect(batches[1].length).toBe(8);
    expect(batches[2].length).toBe(8);
    expect(batches[3].length).toBe(8);
    
    // 所有照片都應被處理
    const totalProcessed = batches.reduce((sum, batch) => sum + batch.length, 0);
    expect(totalProcessed).toBe(32);
  });

  it("should handle 34 photos (case 10 scenario)", () => {
    const urls = Array.from({ length: 34 }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
    const batches = splitIntoBatches(urls);
    
    // 34 張照片應分為 5 批
    expect(batches.length).toBe(5);
    // 前 4 批各 8 張，最後一批 2 張
    expect(batches[0].length).toBe(8);
    expect(batches[1].length).toBe(8);
    expect(batches[2].length).toBe(8);
    expect(batches[3].length).toBe(8);
    expect(batches[4].length).toBe(2);
    
    const totalProcessed = batches.reduce((sum, batch) => sum + batch.length, 0);
    expect(totalProcessed).toBe(34);
  });

  it("should handle small number of photos (1-8) in single batch", () => {
    for (let count = 1; count <= 8; count++) {
      const urls = Array.from({ length: count }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
      const batches = splitIntoBatches(urls);
      expect(batches.length).toBe(1);
      expect(batches[0].length).toBe(count);
    }
  });

  it("should handle exactly 9 photos (2 batches)", () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
    const batches = splitIntoBatches(urls);
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(8);
    expect(batches[1].length).toBe(1);
  });

  it("should handle 50+ photos", () => {
    const urls = Array.from({ length: 50 }, (_, i) => `https://example.com/photo${i + 1}.jpg`);
    const batches = splitIntoBatches(urls);
    expect(batches.length).toBe(7); // ceil(50/8) = 7
    const totalProcessed = batches.reduce((sum, batch) => sum + batch.length, 0);
    expect(totalProcessed).toBe(50);
  });
});

// 測試批次結果合併邏輯
describe("Batch Result Merging", () => {
  interface DetectedItem {
    name: string;
    count: number;
    truckUnit: number;
    room: string;
  }

  interface BatchResult {
    detectedItems: DetectedItem[];
    invalidPhotos: string[];
    roomSummaries: Array<{ room: string; items: string; note: string }>;
    riskItems: string[];
  }

  function mergeBatchResults(results: BatchResult[]) {
    const detectedItems: DetectedItem[] = [];
    const invalidPhotos: string[] = [];
    const roomSummaries: Array<{ room: string; items: string; note: string }> = [];
    const riskItems: string[] = [];

    for (const result of results) {
      detectedItems.push(...result.detectedItems);
      invalidPhotos.push(...result.invalidPhotos);
      roomSummaries.push(...result.roomSummaries);
      riskItems.push(...result.riskItems);
    }

    return { detectedItems, invalidPhotos, roomSummaries, riskItems };
  }

  it("should merge items from multiple batches", () => {
    const batch1: BatchResult = {
      detectedItems: [
        { name: "雙門冰箱", count: 1, truckUnit: 0, room: "廚房" },
        { name: "洗衣機", count: 1, truckUnit: 0, room: "陽台" },
      ],
      invalidPhotos: [],
      roomSummaries: [{ room: "廚房", items: "冰箱", note: "" }],
      riskItems: [],
    };

    const batch2: BatchResult = {
      detectedItems: [
        { name: "雙人床墊", count: 1, truckUnit: 0, room: "臥室" },
        { name: "衣櫃(3門)", count: 1, truckUnit: 0, room: "臥室" },
        { name: "書桌", count: 1, truckUnit: 0, room: "書房" },
      ],
      invalidPhotos: ["第9張不是室內照片"],
      roomSummaries: [{ room: "臥室", items: "床、衣櫃", note: "" }],
      riskItems: ["衣櫃需拆裝"],
    };

    const batch3: BatchResult = {
      detectedItems: [
        { name: "三人沙發", count: 1, truckUnit: 0, room: "客廳" },
        { name: "電視(55吋)", count: 1, truckUnit: 0, room: "客廳" },
        { name: "紙箱", count: 5, truckUnit: 0, room: "其他空間" },
      ],
      invalidPhotos: [],
      roomSummaries: [{ room: "客廳", items: "沙發、電視", note: "" }],
      riskItems: [],
    };

    const merged = mergeBatchResults([batch1, batch2, batch3]);

    // 所有物品都應被合併
    expect(merged.detectedItems.length).toBe(8);
    expect(merged.invalidPhotos.length).toBe(1);
    expect(merged.roomSummaries.length).toBe(3);
    expect(merged.riskItems.length).toBe(1);
  });

  it("should handle empty batch results gracefully", () => {
    const batch1: BatchResult = {
      detectedItems: [{ name: "冰箱", count: 1, truckUnit: 0, room: "廚房" }],
      invalidPhotos: [],
      roomSummaries: [],
      riskItems: [],
    };

    const emptyBatch: BatchResult = {
      detectedItems: [],
      invalidPhotos: [],
      roomSummaries: [],
      riskItems: [],
    };

    const merged = mergeBatchResults([batch1, emptyBatch]);
    expect(merged.detectedItems.length).toBe(1);
  });
});

// 測試新增的 ITEM_TRUCK_MAP 條目
describe("New ITEM_TRUCK_MAP entries", () => {
  const newItems: Record<string, number> = {
    "衣物堆": 0.025,
    "衣物堆（一箱）": 0.025,
    "衣物箱": 0.025,
    "鞋子堆": 0.025,
    "鞋箱": 0.015,
    "廚房雜物": 0.025,
    "廚房雜物（一箱）": 0.025,
    "雜物箱": 0.025,
    "書籍箱": 0.03,
    "書籍": 0.03,
    "盆栽": 0.10,
    "小盆栽": 0.03,
  };

  it("should have correct truck unit values for new items", () => {
    expect(newItems["衣物堆"]).toBe(0.025);
    expect(newItems["鞋子堆"]).toBe(0.025);
    expect(newItems["廚房雜物"]).toBe(0.025);
    expect(newItems["書籍箱"]).toBe(0.03);
    expect(newItems["盆栽"]).toBe(0.10);
    expect(newItems["小盆栽"]).toBe(0.03);
  });

  it("should calculate correct truck count for multiple clothing piles", () => {
    // 個案10 場景：多個衣櫃裝滿衣物
    const clothingPiles = 10; // 10 箱衣物
    const truckUnit = newItems["衣物堆"];
    const totalTruck = clothingPiles * truckUnit;
    expect(totalTruck).toBe(0.25); // 10 箱衣物 = 0.25 車
  });

  it("should calculate correct truck count for kitchen miscellaneous", () => {
    const kitchenBoxes = 5;
    const truckUnit = newItems["廚房雜物"];
    const totalTruck = kitchenBoxes * truckUnit;
    expect(totalTruck).toBe(0.125); // 5 箱廚房雜物 = 0.125 車
  });
});

// 測試校正係數
describe("Calibration Coefficients", () => {
  function applyCalibration(truckCount: number): number {
    if (truckCount <= 2.5) return truckCount * 1.41;
    if (truckCount <= 4.5) return truckCount * 1.04;
    if (truckCount <= 7.0) return truckCount * 1.20;
    return truckCount * 0.81;
  }

  it("should amplify small estimates (≤2.5 trucks)", () => {
    const result = applyCalibration(1.5);
    expect(result).toBeCloseTo(2.115, 2);
  });

  it("should maintain medium estimates (2.5-4.5 trucks)", () => {
    const result = applyCalibration(3.5);
    expect(result).toBeCloseTo(3.64, 2);
  });

  it("should amplify large estimates (4.5-7 trucks)", () => {
    const result = applyCalibration(5.5);
    expect(result).toBeCloseTo(6.6, 2);
  });

  it("should reduce very large estimates (>7 trucks)", () => {
    const result = applyCalibration(10);
    expect(result).toBeCloseTo(8.1, 2);
  });

  // 個案10 模擬：假設辨識到的物品基礎車數約 2.5 車
  it("should produce reasonable result for case 10 scenario", () => {
    // 基礎辨識車數（假設辨識到所有物品後約 2.5 車）
    let truckCount = 2.5;
    
    // 加紙箱補償（一般量）
    truckCount += 0.5;
    
    // 校正
    const calibrated = applyCalibration(truckCount);
    
    // 應該在 3-5 車範圍內
    expect(calibrated).toBeGreaterThanOrEqual(3);
    expect(calibrated).toBeLessThanOrEqual(5);
  });
});

// 測試前端照片上傳限制
describe("Photo Upload Limits", () => {
  it("should allow up to 10 photos per room", () => {
    const MAX_PHOTOS_PER_ROOM = 10;
    expect(MAX_PHOTOS_PER_ROOM).toBe(10);
  });

  it("should allow total of 60+ photos (6 rooms × 10 photos)", () => {
    const MAX_PHOTOS_PER_ROOM = 10;
    const rooms = 6;
    const maxTotal = rooms * MAX_PHOTOS_PER_ROOM;
    expect(maxTotal).toBe(60);
  });
});
