/**
 * 資料遷移腳本：將 tickets 表中的 JSON 欄位遷移到獨立子表
 * 
 * 遷移項目：
 * 1. chatHistory (JSON) → chat_messages 表
 * 2. photoUrls (JSON) → ticket_photos 表
 * 3. uploadedFiles (JSON) → ticket_files 表
 * 4. roomLayout (JSON) → ticket_room_layouts 表
 * 5. aiResult (JSON) → ticket_ai_results 表
 * 
 * 使用方式：node scripts/migrate-json-to-tables.mjs
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  console.log("🔄 開始資料遷移：JSON 欄位 → 獨立表...\n");

  const conn = await mysql.createConnection(DATABASE_URL);

  try {
    // 取得所有 tickets
    const [tickets] = await conn.execute("SELECT * FROM tickets ORDER BY id ASC");
    console.log(`📋 共 ${tickets.length} 筆案件需要遷移\n`);

    let chatCount = 0;
    let photoCount = 0;
    let fileCount = 0;
    let roomCount = 0;
    let aiCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      const ticketId = ticket.id;

      try {
        // 1. 遷移 chatHistory → chat_messages
        const chatHistory = parseJson(ticket.chatHistory);
        if (Array.isArray(chatHistory) && chatHistory.length > 0) {
          // 先檢查是否已遷移
          const [existing] = await conn.execute(
            "SELECT COUNT(*) as cnt FROM chat_messages WHERE ticketId = ?",
            [ticketId]
          );
          if (existing[0].cnt === 0) {
            for (const msg of chatHistory) {
              await conn.execute(
                `INSERT INTO chat_messages (ticketId, role, message, imageUrl, isRead, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  ticketId,
                  msg.role || "customer",
                  msg.message || "",
                  msg.imageUrl || null,
                  msg.isRead ? 1 : 0,
                  msg.timestamp ? new Date(msg.timestamp) : new Date(),
                ]
              );
              chatCount++;
            }
          }
        }

        // 2. 遷移 photoUrls → ticket_photos
        const photoUrls = parseJson(ticket.photoUrls);
        if (Array.isArray(photoUrls) && photoUrls.length > 0) {
          const [existing] = await conn.execute(
            "SELECT COUNT(*) as cnt FROM ticket_photos WHERE ticketId = ?",
            [ticketId]
          );
          if (existing[0].cnt === 0) {
            for (let i = 0; i < photoUrls.length; i++) {
              await conn.execute(
                `INSERT INTO ticket_photos (ticketId, url, room, sortOrder, createdAt)
                 VALUES (?, ?, NULL, ?, ?)`,
                [ticketId, photoUrls[i], i, ticket.createdAt || new Date()]
              );
              photoCount++;
            }
          }
        }

        // 3. 遷移 uploadedFiles → ticket_files
        const uploadedFiles = parseJson(ticket.uploadedFiles);
        if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
          const [existing] = await conn.execute(
            "SELECT COUNT(*) as cnt FROM ticket_files WHERE ticketId = ?",
            [ticketId]
          );
          if (existing[0].cnt === 0) {
            for (const f of uploadedFiles) {
              await conn.execute(
                `INSERT INTO ticket_files (ticketId, fileName, fileType, url, fileSize, extractedFiles, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  ticketId,
                  f.name || "unknown",
                  f.type || "unknown",
                  f.url || "",
                  f.size || 0,
                  f.extractedFiles ? JSON.stringify(f.extractedFiles) : null,
                  ticket.createdAt || new Date(),
                ]
              );
              fileCount++;
            }
          }
        }

        // 4. 遷移 roomLayout → ticket_room_layouts
        const roomLayout = parseJson(ticket.roomLayout);
        if (roomLayout && typeof roomLayout === "object" && !Array.isArray(roomLayout)) {
          const [existing] = await conn.execute(
            "SELECT COUNT(*) as cnt FROM ticket_room_layouts WHERE ticketId = ?",
            [ticketId]
          );
          if (existing[0].cnt === 0) {
            for (const [roomType, cnt] of Object.entries(roomLayout)) {
              if (typeof cnt === "number" && cnt > 0) {
                await conn.execute(
                  `INSERT INTO ticket_room_layouts (ticketId, roomType, \`count\`)
                   VALUES (?, ?, ?)`,
                  [ticketId, roomType, cnt]
                );
                roomCount++;
              }
            }
          }
        }

        // 5. 遷移 aiResult → ticket_ai_results
        const aiResult = parseJson(ticket.aiResult);
        if (aiResult && typeof aiResult === "object") {
          const [existing] = await conn.execute(
            "SELECT COUNT(*) as cnt FROM ticket_ai_results WHERE ticketId = ?",
            [ticketId]
          );
          if (existing[0].cnt === 0) {
            await conn.execute(
              `INSERT INTO ticket_ai_results (ticketId, photoCount, furnitureCount, truckCount, priceMin, priceMax, estimateNote, detectedItems, roomSummaries, riskItems, invalidPhotos)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                ticketId,
                aiResult.photoCount ?? 0,
                aiResult.furnitureCount ?? 0,
                aiResult.truckCount ?? 0,
                aiResult.priceRange?.min ?? aiResult.priceMin ?? 0,
                aiResult.priceRange?.max ?? aiResult.priceMax ?? 0,
                aiResult.estimateNote ?? "",
                JSON.stringify(aiResult.detectedItems ?? []),
                JSON.stringify(aiResult.roomSummaries ?? []),
                JSON.stringify(aiResult.riskItems ?? []),
                JSON.stringify(aiResult.invalidPhotos ?? []),
              ]
            );
            aiCount++;
          }
        }
      } catch (err) {
        console.error(`  ❌ 案件 #${ticketId} 遷移失敗:`, err.message);
        errorCount++;
      }
    }

    console.log("\n✅ 遷移完成！統計：");
    console.log(`  📨 聊天訊息: ${chatCount} 筆`);
    console.log(`  📷 照片記錄: ${photoCount} 筆`);
    console.log(`  📁 檔案記錄: ${fileCount} 筆`);
    console.log(`  🏠 房型格局: ${roomCount} 筆`);
    console.log(`  🤖 AI 分析:  ${aiCount} 筆`);
    if (errorCount > 0) {
      console.log(`  ⚠️ 錯誤: ${errorCount} 筆`);
    }
  } finally {
    await conn.end();
  }
}

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

main().catch((err) => {
  console.error("❌ 遷移腳本執行失敗:", err);
  process.exit(1);
});
