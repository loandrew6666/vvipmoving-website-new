/**
 * 照片去重邏輯：
 * 1. 相同照片檢測 — 使用圖片哈希避免重複
 * 2. 重疊空間檢測 — 同房間高度重疊的照片只計算一次
 */

import crypto from "crypto";

/**
 * 計算圖片的簡單哈希值（用於相同照片檢測）
 * 實際應用中可使用 perceptual hashing（感知哈希）更精確
 */
export async function getImageHash(imageUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const hash = crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
    return hash;
  } catch (error) {
    console.error(`[Image Dedup] 無法計算 ${imageUrl} 的哈希:`, error);
    // 失敗時使用 URL 本身作為備用
    return crypto.createHash("sha256").update(imageUrl).digest("hex");
  }
}

/**
 * 去重照片陣列：移除相同的照片
 * @param imageUrls 照片 URL 陣列
 * @returns 去重後的 URL 陣列
 */
export async function deduplicateImages(imageUrls: string[]): Promise<string[]> {
  if (imageUrls.length <= 1) return imageUrls;

  const seen = new Set<string>();
  const deduplicated: string[] = [];

  for (const url of imageUrls) {
    const hash = await getImageHash(url);
    if (!seen.has(hash)) {
      seen.add(hash);
      deduplicated.push(url);
    } else {
      console.log(`[Image Dedup] 移除重複照片: ${url}`);
    }
  }

  return deduplicated;
}

/**
 * 檢測重疊空間：同房間多張照片的內容相似度
 * 基於 LLM 的房間標籤和物件重複率判斷
 */
export interface ImageRoomMapping {
  url: string;
  room: string; // 房間名稱（客廳、臥室等）
  detectedItems: string[]; // 該照片中辨識到的物件
}

/**
 * 去重重疊空間的物件
 * 同一房間的多張照片中，如果物件重複率 > 70%，則視為重疊空間
 * @param roomMappings 照片與房間的對應關係
 * @returns 去重後的房間物件對應
 */
export function deduplicateRoomObjects(
  roomMappings: ImageRoomMapping[]
): ImageRoomMapping[] {
  if (roomMappings.length <= 1) return roomMappings;

  // 按房間分組
  const roomGroups = new Map<string, ImageRoomMapping[]>();
  for (const mapping of roomMappings) {
    if (!roomGroups.has(mapping.room)) {
      roomGroups.set(mapping.room, []);
    }
    roomGroups.get(mapping.room)!.push(mapping);
  }

  const result: ImageRoomMapping[] = [];
  const processedUrls = new Set<string>();

  // 處理每個房間的照片
  for (const [room, mappings] of roomGroups) {
    if (mappings.length === 1) {
      // 單張照片，直接保留
      result.push(mappings[0]!);
      processedUrls.add(mappings[0]!.url);
      continue;
    }

    // 多張照片：檢測重疊
    const kept: ImageRoomMapping[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < mappings.length; i++) {
      const current = mappings[i]!;
      if (processedUrls.has(current.url)) continue;

      // 與已保留的照片比較重疊度
      let isOverlapping = false;
      for (const keptMapping of kept) {
        const overlapRatio = calculateItemOverlap(
          current.detectedItems,
          keptMapping.detectedItems
        );
        if (overlapRatio > 0.7) {
          // 重疊度 > 70%，視為重疊空間
          isOverlapping = true;
          skipped.push(current.url);
          console.log(
            `[Image Dedup] 房間 "${room}" 中的照片 ${current.url} 與 ${keptMapping.url} 重疊 (${(overlapRatio * 100).toFixed(0)}%)，已跳過`
          );
          break;
        }
      }

      if (!isOverlapping) {
        kept.push(current);
        processedUrls.add(current.url);
      }
    }

    result.push(...kept);
  }

  return result;
}

/**
 * 計算兩個物件列表的重疊率
 * @param items1 物件列表 1
 * @param items2 物件列表 2
 * @returns 重疊率 (0-1)
 */
function calculateItemOverlap(items1: string[], items2: string[]): number {
  if (items1.length === 0 || items2.length === 0) return 0;

  const set1 = new Set(items1.map((i) => i.toLowerCase()));
  const set2 = new Set(items2.map((i) => i.toLowerCase()));

  const intersection = Array.from(set1).filter((item) => set2.has(item)).length;
  const union = new Set([...set1, ...set2]).size;

  return intersection / union;
}

/**
 * 合併重疊空間的物件計數
 * 當同一房間的多張照片被判定為重疊時，只計算一次物件
 */
export interface DetectedItemWithRoom {
  name: string;
  count: number;
  truckUnit: number;
  room: string;
  sourceUrl: string; // 物件來自哪張照片
  markingType: string; // 塗鴉標記類別: checkmark, circle, cross, none
}

export function mergeOverlappingRoomItems(
  items: DetectedItemWithRoom[]
): DetectedItemWithRoom[] {
  if (items.length === 0) return items;

  // 按 "房間+物件名" 分組，只保留第一次出現的
  const seen = new Map<string, DetectedItemWithRoom>();

  for (const item of items) {
    const key = `${item.room}|${item.name}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    } else {
      console.log(
        `[Item Dedup] 房間 "${item.room}" 中的物件 "${item.name}" 已在 ${seen.get(key)!.sourceUrl} 中計算，跳過 ${item.sourceUrl}`
      );
    }
  }

  return Array.from(seen.values());
}
