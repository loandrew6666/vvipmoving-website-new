/**
 * 更新 FAQ 圖片對應腳本
 * 根據圖片內容，將圖片 URL 對應到相關的 FAQ 問題
 * 並新增缺少的 FAQ 問題
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const CDN_BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm';

const IMAGES = {
  // 包材價目表（環保包材區 + 一般包材）
  packaging: `${CDN_BASE}/包材價目表本v4(2025.09更新）_0_e4ab8121.jpg`,
  // KEYWAY 收納品價目表
  storage_keyway: `${CDN_BASE}/收納品價目表(2025.9.15更新)_0_56e99fbc.jpg`,
  // 無印良品收納品價目表
  storage_muji: `${CDN_BASE}/無印良品收納品價目表_d902dde9.jpg`,
  // 垃圾清運服務說明
  cleaning: `${CDN_BASE}/創勝包裝_客服_垃圾清運_0_360c7564.png`,
  // 搬家事前通知（需告知事項 + 隨身物品）
  pre_notice: `${CDN_BASE}/創勝包裝_客服_搬家事前通知_0_b4480c00.png`,
  // 收納品代購（收納需求自評表）
  organizing_need: `${CDN_BASE}/創勝包裝_客服_收納品代購_0_7addac5a.png`,
  // 倉儲服務說明
  warehouse: `${CDN_BASE}/創勝包裝_客服_倉儲服務_0_f335c12e.png`,
  // 整理收納服務說明
  organizing_service: `${CDN_BASE}/創勝包裝_客服_整理服務_0_40608774.png`,
  // 搬家前說明（為何不接受自行打包 + 家具歸位說明）
  pre_explain: `${CDN_BASE}/創勝包裝_客服_搬家事前說明_0_83e639a5.png`,
  // 拍照精選範例
  photo_guide: `${CDN_BASE}/創勝包裝_客服_拍照精選範例_0_74e3d7e3.png`,
  // 貨車與車數介紹
  truck: `${CDN_BASE}/創勝包裝_客服_貨車＆車數介紹_0_ecca47e8.png`,
};

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('連接資料庫成功');
    
    // 1. 查詢所有現有 FAQ
    const [rows] = await conn.execute('SELECT id, category, question FROM faqs ORDER BY id');
    console.log(`找到 ${rows.length} 個 FAQ`);
    
    // 2. 定義圖片對應規則（關鍵字 -> 圖片）
    const imageMapping = [
      // 包材相關
      { keywords: ['包材', '包裝材料', '紙箱', '氣泡紙', '膠帶', '床墊套', '衣箱', '鞋箱', '電視箱', '保冷箱', '瓦楞紙', '土報紙', '膠膜', '保麗龍', '氣泡袋', '夾鏈袋', '包材費用', '包材價格', '包材種類'], category: 'packing', image: IMAGES.packaging },
      // 貨車相關
      { keywords: ['貨車', '車型', '車數', '材積', '幾車', '多少車', '小貨車', '大貨車', '幾噸', '才數', '材數', '車次'], category: 'truck', image: IMAGES.truck },
      // 垃圾清運
      { keywords: ['垃圾', '清運', '廢棄物', '丟棄', '廢物', '清除'], category: 'cleaning', image: IMAGES.cleaning },
      // 倉儲
      { keywords: ['倉儲', '倉庫', '儲存', '存放', '寄放', '入倉'], category: 'storage', image: IMAGES.warehouse },
      // 整理收納服務
      { keywords: ['整理師', '整理服務', '收納服務', '歸位', '整理收納'], category: 'organizing', image: IMAGES.organizing_service },
      // 收納品代購
      { keywords: ['收納品', '收納盒', '收納箱', '代購', '收納需求', '需要收納品嗎'], category: 'organizing', image: IMAGES.organizing_need },
      // 搬家前注意事項
      { keywords: ['搬家前', '注意事項', '事前', '事先', '準備', '需要告知', '告知事項', '隨身攜帶'], category: 'service', image: IMAGES.pre_notice },
      // 自行打包說明
      { keywords: ['自行打包', '自己打包', '自備包材', '自備箱子'], category: 'packing', image: IMAGES.pre_explain },
      // 拍照說明
      { keywords: ['拍照', '照片', '提供照片', '估價照片', '照片範例', '拍什麼'], category: 'service', image: IMAGES.photo_guide },
    ];
    
    // 3. 更新現有 FAQ 的圖片
    let updatedCount = 0;
    for (const faq of rows) {
      const q = faq.question.toLowerCase();
      for (const rule of imageMapping) {
        const matchCategory = !rule.category || faq.category === rule.category;
        const matchKeyword = rule.keywords.some(kw => q.includes(kw.toLowerCase()));
        if (matchCategory && matchKeyword) {
          await conn.execute('UPDATE faqs SET imageUrl = ? WHERE id = ?', [rule.image, faq.id]);
          console.log(`✅ 更新 FAQ #${faq.id} [${faq.category}]: ${faq.question.slice(0, 40)} -> 圖片`);
          updatedCount++;
          break;
        }
      }
    }
    console.log(`\n共更新 ${updatedCount} 個 FAQ 的圖片`);
    
    // 4. 新增缺少的 FAQ（如果沒有對應的問題）
    const newFaqs = [
      {
        category: 'packing',
        question: '包材有哪些種類？費用如何計算？',
        answer: '創勝提供完整的包材服務，包含環保包材區（防水床墊套、環保型塑鋼箱、五層厚紙箱、掛衣箱、鞋箱、電視箱、保冷箱）以及一般包材（各式內襯、氣泡紙、瓦楞紙、土報紙、膠膜、保麗龍球、各種膠帶、氣泡袋、夾鏈袋）。詳細價格請參考下方圖表，或聯繫客服詢問。',
        imageUrl: IMAGES.packaging,
        sortOrder: 1,
      },
      {
        category: 'truck',
        question: '貨車有哪些車型？材積如何換算？',
        answer: '創勝提供小貨車（5噸=2.5車）和大貨車（6.5噸=4.5車）。常見車型換算：3.49噸=1車=200才；5噸=2.5車=500才；6.5噸=4.5車=900才。特殊車型：8噸=7車=1400才；11噸=9車=1800才；17噸=12車=2400才。基本換算：1車=8板=40白箱=200才。',
        imageUrl: IMAGES.truck,
        sortOrder: 1,
      },
      {
        category: 'cleaning',
        question: '垃圾清運服務費用是多少？',
        answer: '垃圾清運費用 NT 7,000 元起/車（車次計算方式，歡迎向客服詢問），最低消費一車。部分廢棄物無法直接進垃圾場銷毀，會產生額外處理費用，如重物（100公斤以上）、花盆、泥土、木材、石頭、橡膠，以及建材（如板材、貼皮木材、磁磚、矽酸鈣板等）。預約流程：填寫預約單 → 提供照片估價 → 預約執行日期 → 垃圾清運。',
        imageUrl: IMAGES.cleaning,
        sortOrder: 1,
      },
      {
        category: 'storage',
        question: '倉儲服務費用和流程是什麼？',
        answer: '倉儲費用 NT 4,000 元/車/月（200才/3.49噸/車）。優惠：季繳95折、半年繳（含）以上9折。倉庫特色：24小時專人管理、門禁森嚴、中央除溼調節系統、貨物責任險最高達150萬、倉儲公共意外責任險、入倉前專人包裝、入倉建檔專業化管理。預約流程：填寫預約單 → 提供照片估價 → 預約執行日期 → 打包入倉 → 預繳倉儲費 → 查收入倉明細造冊。',
        imageUrl: IMAGES.warehouse,
        sortOrder: 1,
      },
      {
        category: 'organizing',
        question: '整理收納服務費用是多少？',
        answer: '整理收納服務費用 NT 900 元起/人/小時（依縣市、屋況而定）。低消：雙北+桃園地區3萬元；其他地區6萬元（含材料、收納、垃圾清運）。創勝也提供收納品代購服務（代購費用=代購商品×0.2），可依個人需求或與整理師討論需求與款式（素色、透明等）。預約流程：填寫自評表 → 提供照片估價 → 預約執行日期 → 到府整理。',
        imageUrl: IMAGES.organizing_service,
        sortOrder: 2,
      },
      {
        category: 'organizing',
        question: '我需要購買收納品嗎？有哪些款式？',
        answer: '創勝提供收納品代購服務，可依個人需求或與整理師討論。不需要收納品的情況：家中傢俱不足尚未採買、物品已被完整裝箱、多是大型盒裝物、東西很少可直接展示擺放。使用收納品可解決：櫃子又深又大無法充分利用、小物品細碎複雜、物品類別不統一、視覺效果不一致。創勝的收納術：整齊美觀（素色、透明收納品）、實用好拿（抽屜式、無蓋式）、功能齊全（一般衣架、褲夾衣架）。',
        imageUrl: IMAGES.organizing_need,
        sortOrder: 3,
      },
      {
        category: 'packing',
        question: '收納品有哪些品牌和規格可以選擇？',
        answer: '創勝提供多種收納品代購，包含 KEYWAY 系列（你可系列、Fine系列、DT系列、抽屜籃系列、衣蝶系列、布盒系列、衣架等）以及無印良品（MUJI）系列（聚丙烯檔案盒、聚乙烯收納盒、PP系列收納箱等）。詳細規格與價格請參考下方圖表，或聯繫客服詢問。',
        imageUrl: IMAGES.storage_keyway,
        sortOrder: 10,
      },
      {
        category: 'service',
        question: '搬家前需要注意哪些事項？',
        answer: '搬家前請注意以下事項：\n\n【需事先告知創勝的情況】\n• 新家裝潢尚未完成\n• 新家尚未完成細清\n• 搬家當天可能有其他工班\n• 新舊家電梯使用有使用、休息時間\n• 新舊家是否能從1樓上下貨，車道限高\n\n【重要物品，隨身攜帶】\n• 外出衣物（外套、鞋...）\n• 盥洗用品（牙刷、牙膏、毛巾...）\n• 個人藥品（感冒藥、胃藥...）\n• 生活必需品（嬰兒用品、隱眼...）\n• 貴重物品（證件、信用卡、鑰匙等）\n\n【建議提前做好物品分類】\n• 將各空間內物品分類（新家、原地不動、丟棄）\n• 垃圾可先自行丟棄，或集中由創勝丟棄',
        imageUrl: IMAGES.pre_notice,
        sortOrder: 1,
      },
      {
        category: 'service',
        question: '估價需要提供什麼照片？怎麼拍才正確？',
        answer: '提供照片的建議：\n\n• 兩房一廳至少有3張全景照（客廳、主臥、次臥）\n• 各空間對應櫃體的細部照（客廳櫃體、主臥衣櫥、次臥櫃體）\n• 玄關、廚房、廁所等其他空間照至少1張\n• 精品、收藏品、保險箱等完整拍攝\n\n照片越詳細，估價越準確！',
        imageUrl: IMAGES.photo_guide,
        sortOrder: 2,
      },
      {
        category: 'packing',
        question: '為什麼創勝不接受客戶自行打包？',
        answer: '創勝不承接客戶自行打包的案子，因為擔心箱子太薄或是緩衝材不夠，無法確保運送過程中的安全性。由創勝打包，責任也由創勝承擔。\n\n此外，大型傢俱、家電、公仔、藝術品等易損壞與破裂之物品，在運送過程中的搖晃與擦撞，容易導致功能異常、擦傷。創勝在搬遷至新家後，皆會拆箱、測試，確保外觀＆功能的正常。',
        imageUrl: IMAGES.pre_explain,
        sortOrder: 5,
      },
    ];
    
    // 5. 插入新 FAQ（避免重複）
    let insertedCount = 0;
    for (const faq of newFaqs) {
      // 檢查是否已有類似問題
      const [existing] = await conn.execute(
        'SELECT id FROM faqs WHERE category = ? AND question LIKE ?',
        [faq.category, `%${faq.question.slice(0, 15)}%`]
      );
      if (existing.length === 0) {
        await conn.execute(
          'INSERT INTO faqs (category, question, answer, imageUrl, sortOrder, isPublished) VALUES (?, ?, ?, ?, ?, 1)',
          [faq.category, faq.question, faq.answer, faq.imageUrl, faq.sortOrder]
        );
        console.log(`✅ 新增 FAQ [${faq.category}]: ${faq.question.slice(0, 40)}`);
        insertedCount++;
      } else {
        // 更新現有問題的圖片
        await conn.execute('UPDATE faqs SET imageUrl = ? WHERE id = ?', [faq.imageUrl, existing[0].id]);
        console.log(`🔄 更新現有 FAQ #${existing[0].id} 的圖片`);
      }
    }
    console.log(`\n共新增 ${insertedCount} 個新 FAQ`);
    
    // 6. 驗證結果
    const [result] = await conn.execute('SELECT COUNT(*) as total, SUM(imageUrl IS NOT NULL) as withImage FROM faqs');
    console.log(`\n最終統計：共 ${result[0].total} 個 FAQ，其中 ${result[0].withImage} 個有圖片`);
    
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
