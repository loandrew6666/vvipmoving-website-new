import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const qaData = JSON.parse(readFileSync("./qa_data.json", "utf-8"));

// Categorize QA items based on keywords
function categorize(question) {
  const q = question.toLowerCase();
  if (q.includes("估價") || q.includes("報價") || q.includes("計價") || q.includes("費用") || q.includes("價格") || q.includes("多少錢") || q.includes("怎麼算") || q.includes("收費") || q.includes("低消") || q.includes("單價") || q.includes("加價") || q.includes("優惠") || q.includes("打折")) return "pricing";
  if (q.includes("打包") || q.includes("包材") || q.includes("紙箱") || q.includes("包裝")) return "packing";
  if (q.includes("歸位") || q.includes("整理") || q.includes("收納") || q.includes("斷捨離")) return "organizing";
  if (q.includes("倉儲") || q.includes("倉庫") || q.includes("寄放")) return "storage";
  if (q.includes("保險") || q.includes("損壞") || q.includes("遺失") || q.includes("賠償")) return "insurance";
  if (q.includes("付款") || q.includes("信用卡") || q.includes("發票") || q.includes("收據")) return "payment";
  if (q.includes("預約") || q.includes("改期") || q.includes("取消") || q.includes("訂金") || q.includes("候補")) return "booking";
  if (q.includes("樓層") || q.includes("電梯") || q.includes("樓梯")) return "floor";
  if (q.includes("車") || q.includes("噸") || q.includes("材積")) return "truck";
  if (q.includes("拆裝") || q.includes("拆卸") || q.includes("安裝") || q.includes("壁掛")) return "assembly";
  if (q.includes("清潔") || q.includes("清掃") || q.includes("垃圾") || q.includes("清運")) return "cleaning";
  if (q.includes("特殊") || q.includes("鋼琴") || q.includes("藝術品") || q.includes("保險箱") || q.includes("魚缸")) return "special";
  if (q.includes("冰箱") || q.includes("冷氣") || q.includes("洗衣機") || q.includes("家電") || q.includes("飲水機") || q.includes("濾水機") || q.includes("馬桶")) return "appliance";
  if (q.includes("寵物") || q.includes("植物") || q.includes("盆栽")) return "living";
  if (q.includes("服務") || q.includes("流程") || q.includes("準備") || q.includes("當天") || q.includes("時間")) return "service";
  return "general";
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log(`Seeding ${qaData.length} QA items...`);

  // Clear existing FAQs
  await connection.execute("DELETE FROM faqs");

  // Insert QA items
  for (let i = 0; i < qaData.length; i++) {
    const item = qaData[i];
    const category = categorize(item.question);
    await connection.execute(
      "INSERT INTO faqs (category, question, answer, sortOrder, isPublished) VALUES (?, ?, ?, ?, ?)",
      [category, item.question, item.answer, i + 1, true]
    );
  }

  console.log(`✅ Seeded ${qaData.length} QA items successfully`);

  // Show category distribution
  const [rows] = await connection.execute(
    "SELECT category, COUNT(*) as cnt FROM faqs GROUP BY category ORDER BY cnt DESC"
  );
  console.log("\nCategory distribution:");
  for (const row of rows) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }

  await connection.end();
}

seed().catch(console.error);
