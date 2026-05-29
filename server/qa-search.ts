import { invokeLLM } from "./_core/llm";

export interface Faq {
  id: number;
  category: string;
  question: string;
  answer: string;
  imageUrl?: string | null;
}

/**
 * 計算兩個字符串的相似度（Levenshtein 距離）
 * 返回 0-1 之間的相似度分數，1 表示完全相同
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // 簡單的相似度計算：共同字符比例
  const s1Chars = new Set(s1);
  const s2Chars = new Set(s2);
  const intersection = new Set([...s1Chars].filter((x) => s2Chars.has(x)));
  const union = new Set([...s1Chars, ...s2Chars]);

  return intersection.size / union.size;
}

/**
 * 使用 LLM 自動分類用戶問題到最相關的專業類別
 */
export async function classifyUserQuestion(
  userQuestion: string,
  categories: string[]
): Promise<string> {
  const categoryList = categories.join("、");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一個搬家服務的客服分類助手。用戶會提出各種關於搬家服務的問題。
你的任務是根據用戶的問題，將其分類到最相關的專業類別。

可用的類別有：${categoryList}

請只返回一個類別名稱，不要有其他文字。`,
      },
      {
        role: "user",
        content: `用戶問題：${userQuestion}

請分類到最相關的類別。`,
      },
    ],
  });

  const classified = (typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "general").trim();
  // 確保返回的類別在有效的類別列表中
  return categories.includes(classified) ? classified : "general";
}

/**
 * 搜尋最相關的 FAQ
 * 策略：
 * 1. 完全匹配（關鍵字搜尋）
 * 2. 類別匹配（同類別的相似度最高的答案）
 * 3. 全庫相似度匹配（所有 FAQ 中相似度最高的答案）
 */
export async function searchFaq(
  userQuestion: string,
  faqs: Faq[]
): Promise<{ faq: Faq; matchType: "exact" | "category" | "similarity" } | null> {
  if (faqs.length === 0) return null;

  const lowerQuestion = userQuestion.toLowerCase();

  // 策略 1：完全匹配（關鍵字搜尋）
  const exactMatches = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuestion) ||
      faq.answer.toLowerCase().includes(lowerQuestion)
  );

  if (exactMatches.length > 0) {
    // 返回最相關的（按相似度排序）
    const best = exactMatches.reduce((prev, curr) => {
      const prevSim = calculateSimilarity(userQuestion, prev.question);
      const currSim = calculateSimilarity(userQuestion, curr.question);
      return currSim > prevSim ? curr : prev;
    });
    return { faq: best, matchType: "exact" };
  }

  // 策略 2：自動分類到專業類別，然後在該類別中搜尋
  const categories = [...new Set(faqs.map((f) => f.category))];
  const classifiedCategory = await classifyUserQuestion(userQuestion, categories);

  const categoryFaqs = faqs.filter((f) => f.category === classifiedCategory);

  if (categoryFaqs.length > 0) {
    // 在該類別中找相似度最高的
    const best = categoryFaqs.reduce((prev, curr) => {
      const prevSim = calculateSimilarity(userQuestion, prev.question);
      const currSim = calculateSimilarity(userQuestion, curr.question);
      return currSim > prevSim ? curr : prev;
    });
    return { faq: best, matchType: "category" };
  }

  // 策略 3：全庫相似度匹配
  const best = faqs.reduce((prev, curr) => {
    const prevSim = calculateSimilarity(userQuestion, prev.question);
    const currSim = calculateSimilarity(userQuestion, curr.question);
    return currSim > prevSim ? curr : prev;
  });

  return { faq: best, matchType: "similarity" };
}

/**
 * 獲取同類別的其他相關 FAQ（用於提供額外建議）
 */
export function getRelatedFaqs(
  targetFaq: Faq,
  allFaqs: Faq[],
  limit: number = 3
): Faq[] {
  return allFaqs
    .filter((f) => f.category === targetFaq.category && f.id !== targetFaq.id)
    .slice(0, limit);
}
