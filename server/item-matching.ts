/**
 * 物品匹配邏輯：將 AI 辨識的物品名稱映射到標準對照表
 * 
 * 匹配優先級：
 * 1. 精確匹配（item.name === 對照表鍵值）
 * 2. 別名匹配（item.name 在 ITEM_ALIASES 中）
 * 3. 部分匹配（包含關係）
 * 4. 降級處理（使用 LLM 估算值，限制在合理範圍）
 */

// 別名對照表：將 AI 辨識的各種名稱映射到標準名稱
export const ITEM_ALIASES: Record<string, string> = {
  // 衣櫃別名
  "滑門衣櫃": "衣櫃（3門）",
  "推門衣櫃": "衣櫃（3門）",
  "衣櫃組": "衣櫃（3門）",
  "衣櫥": "衣櫃（3門）",
  "衣架": "衣櫃（2門）",
  
  // 冰箱別名
  "法式冰箱": "對開冰箱",
  "對開門冰箱": "對開冰箱",
  
  // 沙發別名
  "雙人座沙發": "雙人沙發",
  "沙發椅": "單人沙發",
  "躺椅": "單人沙發",
  
  // 床別名
  "床墊": "雙人床墊",
  "床板": "雙人床架",
  "床組": "雙人床架",
  
  // 電視別名
  "電視櫃": "電視",
  
  // 書架別名
  "書架": "書櫃",
  "層架": "書櫃",
  "層板": "書櫃",
  "置物架": "書櫃",
  
  // 其他別名
  "冷凍櫃": "直立冷凍櫃",
  "冷藏櫃": "直立冷凍櫃",
  "微波爐": "微波爐",
  "烤箱": "烤箱",
  "瓦斯爐": "瓦斯爐",
  "電磁爐": "電磁爐",
  "抽油煙機": "抽油煙機",
  "排油煙機": "抽油煙機",
  "冷氣": "冷氣機",
  "空調": "冷氣機",
  "暖氣": "暖風機",
  "電扇": "電風扇",
  "風扇": "電風扇",
  "除濕機": "除濕機",
  "加濕機": "加濕機",
  "空氣清淨機": "空氣清淨機",
  "吸塵器": "吸塵器",
  "掃地機": "掃地機器人",
  "拖地機": "拖地機",
  "投影機": "投影機",
  "投影儀": "投影機",
  "音響": "音響",
  "喇叭": "音響",
  "麥克風": "麥克風",
  "吉他": "樂器",
  "鋼琴": "樂器",
  "電子琴": "樂器",
  "鼓": "樂器",
  "健身器材": "健身器材",
  "跑步機": "健身器材",
  "健身車": "健身器材",
  "啞鈴": "健身器材",
  "瑜伽墊": "瑜伽墊",
};

export interface ItemMatchResult {
  itemName: string;
  matchedKey: string;
  unitTruck: number;
  matchType: "exact" | "alias" | "partial" | "fallback";
}

/**
 * 匹配物品名稱到對照表
 */
export function matchItemToTruckMap(
  itemName: string,
  itemTruckMap: Record<string, number>,
  itemTruckUnit: number = 0
): ItemMatchResult {
  let unitTruck = 0;
  let matchedKey = "";
  let matchType: "exact" | "alias" | "partial" | "fallback" = "fallback";

  // 1. 精確匹配
  const exactKey = Object.keys(itemTruckMap).find(k => itemName === k);
  if (exactKey) {
    unitTruck = itemTruckMap[exactKey]!;
    matchedKey = exactKey;
    matchType = "exact";
  } else {
    // 2. 別名匹配
    const aliasTarget = ITEM_ALIASES[itemName];
    if (aliasTarget && itemTruckMap[aliasTarget]) {
      unitTruck = itemTruckMap[aliasTarget]!;
      matchedKey = aliasTarget;
      matchType = "alias";
    } else {
      // 3. 部分匹配（包含關係）
      const partialKey = Object.keys(itemTruckMap).find(
        k => itemName.includes(k) || k.includes(itemName)
      );
      if (partialKey) {
        unitTruck = itemTruckMap[partialKey]!;
        matchedKey = partialKey;
        matchType = "partial";
      } else {
        // 4. 降級處理：使用 LLM 提供的值（限制在合理範圍）
        unitTruck = Math.min(Math.max(itemTruckUnit, 0.005), 1.0);
        matchedKey = "(LLM估算)";
        matchType = "fallback";
      }
    }
  }

  return {
    itemName,
    matchedKey,
    unitTruck,
    matchType,
  };
}
