import { describe, it, expect } from "vitest";

/**
 * 測試「物品過濾模式」功能：
 * 1. itemFilterMode: "exclude" — 排除不搬物品（原有功能）
 * 2. itemFilterMode: "only" — 只搬指定物品（新功能）
 *
 * 此處複製後端的過濾邏輯進行單元測試，確保邏輯正確。
 */

// 模擬 detectedItems 結構
interface DetectedItem {
  name: string;
  count: number;
  truckUnit: number;
  room: string;
}

// === 複製後端的「不搬物品」排除邏輯 ===
function filterExcludeMode(
  detectedItems: DetectedItem[],
  notMovingItems: string
): DetectedItem[] {
  if (!notMovingItems || !notMovingItems.trim()) return detectedItems;

  const notMovingText = notMovingItems.trim().toLowerCase();
  const notMovingKeywords = notMovingText
    .split(/[,，、;；\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (notMovingKeywords.length === 0) return detectedItems;

  return detectedItems.filter((item) => {
    const itemName = item.name.toLowerCase();
    const shouldExclude = notMovingKeywords.some((keyword) => {
      return itemName.includes(keyword) || keyword.includes(itemName);
    });
    return !shouldExclude;
  });
}

// === 複製後端的「只搬這些」正向過濾邏輯 ===
function filterOnlyMode(
  detectedItems: DetectedItem[],
  onlyMovingItems: string
): DetectedItem[] {
  if (!onlyMovingItems || !onlyMovingItems.trim()) return detectedItems;

  const onlyMovingText = onlyMovingItems.trim().toLowerCase();
  const onlyMovingKeywords = onlyMovingText
    .split(/[,，、;；\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (onlyMovingKeywords.length === 0) return detectedItems;

  return detectedItems.filter((item) => {
    const itemName = item.name.toLowerCase();
    const shouldKeep = onlyMovingKeywords.some((keyword) => {
      return itemName.includes(keyword) || keyword.includes(itemName);
    });
    return shouldKeep;
  });
}

// 模擬 Case 20 的場景：照片中有很多物品，但客戶只想搬麻將桌和 Dyson
const case20Items: DetectedItem[] = [
  { name: "雙人沙發", count: 1, truckUnit: 0.15, room: "客廳" },
  { name: "電視", count: 1, truckUnit: 0.05, room: "客廳" },
  { name: "電視櫃", count: 1, truckUnit: 0.1, room: "客廳" },
  { name: "茶几", count: 1, truckUnit: 0.08, room: "客廳" },
  { name: "麻將桌", count: 1, truckUnit: 0.1, room: "客廳" },
  { name: "書櫃", count: 2, truckUnit: 0.12, room: "書房" },
  { name: "辦公椅", count: 1, truckUnit: 0.05, room: "書房" },
  { name: "Dyson 空氣清淨機", count: 1, truckUnit: 0.03, room: "臥室" },
  { name: "雙人床架", count: 1, truckUnit: 0.2, room: "臥室" },
  { name: "雙人床墊", count: 1, truckUnit: 0.15, room: "臥室" },
  { name: "衣櫃（3門）", count: 1, truckUnit: 0.25, room: "臥室" },
  { name: "梳妝台", count: 1, truckUnit: 0.08, room: "臥室" },
  { name: "冰箱", count: 1, truckUnit: 0.12, room: "廚房" },
  { name: "微波爐", count: 1, truckUnit: 0.02, room: "廚房" },
];

describe("物品過濾模式 — 「只搬這些」(only mode)", () => {
  it("Case 20 場景：只搬麻將桌和 Dyson，應只保留 2 件物品", () => {
    const result = filterOnlyMode(case20Items, "麻將桌,Dyson");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain("麻將桌");
    expect(result.map((i) => i.name)).toContain("Dyson 空氣清淨機");
  });

  it("部分關鍵字匹配：'dyson' 應匹配 'Dyson 空氣清淨機'（不區分大小寫）", () => {
    const result = filterOnlyMode(case20Items, "dyson");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Dyson 空氣清淨機");
  });

  it("部分關鍵字匹配：'空氣清淨機' 應匹配 'Dyson 空氣清淨機'", () => {
    const result = filterOnlyMode(case20Items, "空氣清淨機");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Dyson 空氣清淨機");
  });

  it("使用頓號分隔：'麻將桌、Dyson' 應正確解析", () => {
    const result = filterOnlyMode(case20Items, "麻將桌、Dyson");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain("麻將桌");
    expect(result.map((i) => i.name)).toContain("Dyson 空氣清淨機");
  });

  it("使用中文逗號分隔：'麻將桌，Dyson' 應正確解析", () => {
    const result = filterOnlyMode(case20Items, "麻將桌，Dyson");
    expect(result).toHaveLength(2);
  });

  it("使用分號分隔：'麻將桌；Dyson' 應正確解析", () => {
    const result = filterOnlyMode(case20Items, "麻將桌；Dyson");
    expect(result).toHaveLength(2);
  });

  it("使用換行分隔：多行輸入應正確解析", () => {
    const result = filterOnlyMode(case20Items, "麻將桌\nDyson");
    expect(result).toHaveLength(2);
  });

  it("空白 onlyMovingItems：應回傳所有物品（不過濾）", () => {
    const result = filterOnlyMode(case20Items, "");
    expect(result).toHaveLength(case20Items.length);
  });

  it("純空白字串 onlyMovingItems：應回傳所有物品（不過濾）", () => {
    const result = filterOnlyMode(case20Items, "   ");
    expect(result).toHaveLength(case20Items.length);
  });

  it("只搬一件物品：'冰箱' 應只保留冰箱", () => {
    const result = filterOnlyMode(case20Items, "冰箱");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("冰箱");
  });

  it("指定不存在的物品：應回傳空陣列", () => {
    const result = filterOnlyMode(case20Items, "鋼琴,保險箱");
    expect(result).toHaveLength(0);
  });

  it("反向匹配：關鍵字 '電視' 應匹配 '電視' 和 '電視櫃'", () => {
    const result = filterOnlyMode(case20Items, "電視");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain("電視");
    expect(result.map((i) => i.name)).toContain("電視櫃");
  });

  it("混合存在與不存在的物品：只保留存在的", () => {
    const result = filterOnlyMode(case20Items, "麻將桌,鋼琴,Dyson,保險箱");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain("麻將桌");
    expect(result.map((i) => i.name)).toContain("Dyson 空氣清淨機");
  });
});

describe("物品過濾模式 — 「排除不搬」(exclude mode)", () => {
  it("排除電視：應移除 '電視' 和 '電視櫃'", () => {
    const result = filterExcludeMode(case20Items, "電視");
    expect(result).toHaveLength(case20Items.length - 2);
    expect(result.map((i) => i.name)).not.toContain("電視");
    expect(result.map((i) => i.name)).not.toContain("電視櫃");
  });

  it("排除多項物品：'電視,冰箱,書櫃' 應移除對應物品", () => {
    const result = filterExcludeMode(case20Items, "電視,冰箱,書櫃");
    expect(result.map((i) => i.name)).not.toContain("電視");
    expect(result.map((i) => i.name)).not.toContain("電視櫃");
    expect(result.map((i) => i.name)).not.toContain("冰箱");
    expect(result.map((i) => i.name)).not.toContain("書櫃");
    // 應保留其他物品
    expect(result.map((i) => i.name)).toContain("麻將桌");
    expect(result.map((i) => i.name)).toContain("Dyson 空氣清淨機");
  });

  it("排除 Dyson：應移除 'Dyson 空氣清淨機'", () => {
    const result = filterExcludeMode(case20Items, "Dyson");
    expect(result.map((i) => i.name)).not.toContain("Dyson 空氣清淨機");
    expect(result).toHaveLength(case20Items.length - 1);
  });

  it("空白 notMovingItems：應回傳所有物品（不過濾）", () => {
    const result = filterExcludeMode(case20Items, "");
    expect(result).toHaveLength(case20Items.length);
  });

  it("排除不存在的物品：應回傳所有物品", () => {
    const result = filterExcludeMode(case20Items, "鋼琴,保險箱");
    expect(result).toHaveLength(case20Items.length);
  });

  it("使用頓號分隔：'電視、冰箱' 應正確排除", () => {
    const result = filterExcludeMode(case20Items, "電視、冰箱");
    expect(result.map((i) => i.name)).not.toContain("電視");
    expect(result.map((i) => i.name)).not.toContain("電視櫃");
    expect(result.map((i) => i.name)).not.toContain("冰箱");
  });
});

describe("物品過濾模式 — 邊界情況", () => {
  it("only mode 搭配空陣列 detectedItems：應回傳空陣列", () => {
    const result = filterOnlyMode([], "麻將桌");
    expect(result).toHaveLength(0);
  });

  it("exclude mode 搭配空陣列 detectedItems：應回傳空陣列", () => {
    const result = filterExcludeMode([], "電視");
    expect(result).toHaveLength(0);
  });

  it("only mode 關鍵字包含多餘空白：應正確 trim", () => {
    const result = filterOnlyMode(case20Items, "  麻將桌  ,  Dyson  ");
    expect(result).toHaveLength(2);
  });

  it("exclude mode 關鍵字包含多餘空白：應正確 trim", () => {
    const result = filterExcludeMode(case20Items, "  電視  ,  冰箱  ");
    expect(result.map((i) => i.name)).not.toContain("電視");
    expect(result.map((i) => i.name)).not.toContain("冰箱");
  });

  it("only mode 大小寫不敏感：'DYSON' 應匹配 'Dyson 空氣清淨機'", () => {
    const result = filterOnlyMode(case20Items, "DYSON");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Dyson 空氣清淨機");
  });

  it("exclude mode 大小寫不敏感：'dyson' 應排除 'Dyson 空氣清淨機'", () => {
    const result = filterExcludeMode(case20Items, "dyson");
    expect(result.map((i) => i.name)).not.toContain("Dyson 空氣清淨機");
  });

  it("only mode 雙向匹配：關鍵字 '床' 應匹配 '雙人床架' 和 '雙人床墊'", () => {
    const result = filterOnlyMode(case20Items, "床");
    expect(result.map((i) => i.name)).toContain("雙人床架");
    expect(result.map((i) => i.name)).toContain("雙人床墊");
  });

  it("only mode 雙向匹配：關鍵字 '雙人床架和床墊' 包含 '雙人床架' 但不包含 '雙人床墊'", () => {
    // 關鍵字 "雙人床架和床墊" 包含子字串 "雙人床架" → 匹配
    // 但 "雙人床墊" 不是 "雙人床架和床墊" 的子字串 → 不匹配
    // 這是當前過濾邏輯的預期行為（簡單字串包含比對）
    const result = filterOnlyMode(case20Items, "雙人床架和床墊");
    expect(result.map((i) => i.name)).toContain("雙人床架");
    // "雙人床墊" 不在 "雙人床架和床墊" 中（因為字串是 "雙人床架和床墊"，不包含完整的 "雙人床墊"）
    // 實際上 "雙人床架和床墊".includes("雙人床墊") → 讓我們驗證
    const keywordContainsBedMattress = "雙人床架和床墊".includes("雙人床墊");
    if (keywordContainsBedMattress) {
      expect(result.map((i) => i.name)).toContain("雙人床墊");
    } else {
      expect(result.map((i) => i.name)).not.toContain("雙人床墊");
    }
  });
});

// === 複製後端的「只搬這些」補充邏輯：文字指定但照片未辨識到的物品自動加入 ===
// 簡化版的 matchItemToTruckMap 用於測試
const TEST_ITEM_TRUCK_MAP: Record<string, number> = {
  "床墊": 0.30,
  "雙人床墊": 0.30,
  "單人床墊": 0.20,
  "床架": 0.30,
  "雙人床架": 0.30,
  "單人床架": 0.20,
  "水波爐": 0.10,
  "微波爐/水波爐": 0.10,
  "麻將桌": 0.10,
  "冰箱": 0.34,
  "電視": 0.05,
  "Dyson 空氣清淨機": 0.03,
};

function testMatchItemToTruckMap(
  itemName: string,
  itemTruckMap: Record<string, number>,
  fallbackUnit: number = 0.1
): { matchedKey: string; unitTruck: number; matchType: string } {
  // 1. 精確匹配
  const exactKey = Object.keys(itemTruckMap).find(k => itemName === k);
  if (exactKey) {
    return { matchedKey: exactKey, unitTruck: itemTruckMap[exactKey]!, matchType: "exact" };
  }
  // 2. 部分匹配（包含關係）
  const partialKey = Object.keys(itemTruckMap).find(
    k => itemName.includes(k) || k.includes(itemName)
  );
  if (partialKey) {
    return { matchedKey: partialKey, unitTruck: itemTruckMap[partialKey]!, matchType: "partial" };
  }
  // 3. 降級處理
  return { matchedKey: "(LLM估算)", unitTruck: Math.min(Math.max(fallbackUnit, 0.005), 1.0), matchType: "fallback" };
}

/**
 * 補充未辨識物品邏輯：
 * 在「只搬這些」模式下，如果客戶文字指定了物品但照片中沒辨識到，
 * 自動將這些物品加入 detectedItems 並計算車數。
 */
function supplementUndetectedItems(
  detectedItems: DetectedItem[],
  onlyMovingItems: string,
  itemTruckMap: Record<string, number>
): DetectedItem[] {
  if (!onlyMovingItems || !onlyMovingItems.trim()) return detectedItems;

  const onlyMovingText = onlyMovingItems.trim().toLowerCase();
  const onlyKeywords = onlyMovingText
    .split(/[,，、;；\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const result = [...detectedItems];

  for (const keyword of onlyKeywords) {
    const alreadyDetected = result.some((item) => {
      const itemName = item.name.toLowerCase();
      return itemName.includes(keyword) || keyword.includes(itemName);
    });

    if (!alreadyDetected) {
      const matchResult = testMatchItemToTruckMap(keyword, itemTruckMap, 0.1);
      const unitTruck = matchResult.unitTruck;
      result.push({
        name: matchResult.matchType !== "fallback" ? matchResult.matchedKey : keyword,
        count: 1,
        truckUnit: unitTruck,
        room: "客戶指定",
      });
    }
  }

  return result;
}

describe("物品過濾模式 — 補充未辨識物品 (only mode supplement)", () => {
  it("截圖案例：指定 '床墊,床架,水波爐' 但只辨識到水波爐，應補充床墊和床架", () => {
    const detected: DetectedItem[] = [
      { name: "水波爐", count: 1, truckUnit: 0.10, room: "廚房" },
    ];
    const result = supplementUndetectedItems(detected, "床墊,床架,水波爐", TEST_ITEM_TRUCK_MAP);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.name)).toContain("水波爐");
    expect(result.map((i) => i.name)).toContain("床墊");
    expect(result.map((i) => i.name)).toContain("床架");
  });

  it("補充的物品應有正確的車數（從 ITEM_TRUCK_MAP 查找）", () => {
    const detected: DetectedItem[] = [
      { name: "水波爐", count: 1, truckUnit: 0.10, room: "廚房" },
    ];
    const result = supplementUndetectedItems(detected, "床墊,床架,水波爐", TEST_ITEM_TRUCK_MAP);
    const bedMattress = result.find((i) => i.name === "床墊");
    const bedFrame = result.find((i) => i.name === "床架");
    expect(bedMattress?.truckUnit).toBe(0.30);
    expect(bedFrame?.truckUnit).toBe(0.30);
  });

  it("補充的物品 room 應為 '客戶指定'", () => {
    const detected: DetectedItem[] = [];
    const result = supplementUndetectedItems(detected, "麻將桌", TEST_ITEM_TRUCK_MAP);
    expect(result[0]!.room).toBe("客戶指定");
  });

  it("已辨識到的物品不應重複補充", () => {
    const detected: DetectedItem[] = [
      { name: "水波爐", count: 1, truckUnit: 0.10, room: "廚房" },
      { name: "床墊", count: 1, truckUnit: 0.30, room: "臥室" },
    ];
    const result = supplementUndetectedItems(detected, "床墊,水波爐,床架", TEST_ITEM_TRUCK_MAP);
    // 只有床架需要補充
    expect(result).toHaveLength(3);
    const bedFrames = result.filter((i) => i.name === "床架");
    expect(bedFrames).toHaveLength(1);
  });

  it("部分匹配也算已辨識：'Dyson' 匹配 'Dyson 空氣清淨機' 不應重複補充", () => {
    const detected: DetectedItem[] = [
      { name: "Dyson 空氣清淨機", count: 1, truckUnit: 0.03, room: "臥室" },
    ];
    const result = supplementUndetectedItems(detected, "Dyson,床墊", TEST_ITEM_TRUCK_MAP);
    // Dyson 已存在不補充，只補充床墊
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toContain("Dyson 空氣清淨機");
    expect(result.map((i) => i.name)).toContain("床墊");
  });

  it("空白 onlyMovingItems：不應補充任何物品", () => {
    const detected: DetectedItem[] = [
      { name: "水波爐", count: 1, truckUnit: 0.10, room: "廚房" },
    ];
    const result = supplementUndetectedItems(detected, "", TEST_ITEM_TRUCK_MAP);
    expect(result).toHaveLength(1);
  });

  it("所有物品都未辨識到：全部從文字補充", () => {
    const detected: DetectedItem[] = [];
    const result = supplementUndetectedItems(detected, "床墊,床架,冰箱", TEST_ITEM_TRUCK_MAP);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.name)).toContain("床墊");
    expect(result.map((i) => i.name)).toContain("床架");
    expect(result.map((i) => i.name)).toContain("冰箱");
  });

  it("不在對照表中的物品：使用 fallback 值 0.1 車", () => {
    const detected: DetectedItem[] = [];
    const result = supplementUndetectedItems(detected, "古董花瓶", TEST_ITEM_TRUCK_MAP);
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("古董花瓶"); // fallback 保留原始名稱
    expect(result[0]!.truckUnit).toBe(0.1);
  });

  it("車數總計應包含補充物品：床墊(0.3)+床架(0.3)+水波爐(0.1) = 0.7 車", () => {
    const detected: DetectedItem[] = [
      { name: "水波爐", count: 1, truckUnit: 0.10, room: "廚房" },
    ];
    const result = supplementUndetectedItems(detected, "床墊,床架,水波爐", TEST_ITEM_TRUCK_MAP);
    const totalTrucks = result.reduce((sum, item) => sum + item.truckUnit * item.count, 0);
    expect(totalTrucks).toBeCloseTo(0.7, 2);
  });

  it("大小寫不敏感匹配：'dyson' 應匹配已辨識的 'Dyson 空氣清淨機'", () => {
    const detected: DetectedItem[] = [
      { name: "Dyson 空氣清淨機", count: 1, truckUnit: 0.03, room: "臥室" },
    ];
    const result = supplementUndetectedItems(detected, "dyson", TEST_ITEM_TRUCK_MAP);
    // dyson 已存在（部分匹配），不應補充
    expect(result).toHaveLength(1);
  });
});
