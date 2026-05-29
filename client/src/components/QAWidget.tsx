import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  Package,
  Home,
  Warehouse,
  Shield,
  Receipt,
  CalendarClock,
  Building2,
  Truck,
  Wrench,
  Sparkles,
  Star,
  Tv,
  Leaf,
  ClipboardList,
  HelpCircle,
  MessageSquareText,
  X,
  Search,
  RotateCcw,
} from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "費用與報價",
  packing: "打包與包材",
  organizing: "歸位與整理",
  storage: "倉儲服務",
  insurance: "保險與理賠",
  payment: "付款與發票",
  booking: "預約與改期",
  floor: "樓層與電梯",
  truck: "車輛與材積",
  assembly: "拆裝服務",
  cleaning: "清潔與清運",
  special: "特殊物品",
  appliance: "家電搬運",
  living: "植物與寵物",
  service: "服務流程",
  general: "其他問題",
};

type LucideIcon = React.ComponentType<{ size?: number }>;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  pricing: DollarSign,
  packing: Package,
  organizing: Home,
  storage: Warehouse,
  insurance: Shield,
  payment: Receipt,
  booking: CalendarClock,
  floor: Building2,
  truck: Truck,
  assembly: Wrench,
  cleaning: Sparkles,
  special: Star,
  appliance: Tv,
  living: Leaf,
  service: ClipboardList,
  general: HelpCircle,
};

// 品牌色常數
const C = {
  primary: "#EBB751",
  dark: "#8B6914",
  light: "#FFDEB0",
  bg: "#FDF8EE",
  text: "#3D2B00",
  subtitle: "#9A8468",
  border: "#F0D898",
};

interface QAItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  imageUrl?: string | null;
}

interface ChatMessage {
  type: "user" | "bot" | "category" | "faq-list";
  text: string;
  imageUrl?: string | null;
  faqs?: QAItem[];
  category?: string;
  matchType?: "exact" | "category" | "similarity";
}

export function QAWidget() {
  const isMobile = useIsMobile();
  const fabBottom = isMobile ? "4.5rem" : "1.5rem";
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showCategories, setShowCategories] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allFaqs = [] } = trpc.faq.list.useQuery();
  const faqSearchMutation = trpc.faq.search.useMutation();

  const categorizedFaqs = useMemo(() => {
    const grouped: Record<string, QAItem[]> = {};
    for (const faq of allFaqs) {
      if (!grouped[faq.category]) grouped[faq.category] = [];
      grouped[faq.category].push(faq);
    }
    return grouped;
  }, [allFaqs]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return allFaqs
      .filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, allFaqs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSendQuestion = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setMessages((prev) => [...prev, { type: "user", text: query }]);
    setShowCategories(false);
    setIsSearching(true);
    try {
      const result = await faqSearchMutation.mutateAsync({ question: query });
      if (result.found && result.faq) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: `${result.message}\n\n${result.faq.answer}`, matchType: result.matchType, imageUrl: result.faq.imageUrl },
        ]);
        if (result.relatedFaqs?.length) {
          setMessages((prev) => [...prev, { type: "faq-list", text: "您可能也想了解：", faqs: result.relatedFaqs }]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "抱歉，目前沒有找到相關問題。建議直接聯繫客服！\n\n電話：02-55740033\n或點擊右下角客服按鈕" },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { type: "bot", text: "搜尋時出現問題，請稍後再試。\n\n電話：02-55740033" }]);
    } finally {
      setIsSearching(false);
    }
    setSearchQuery("");
  };

  const handleCategoryClick = (category: string) => {
    const faqs = categorizedFaqs[category] || [];
    setShowCategories(false);
    setMessages((prev) => [
      ...prev,
      { type: "category", text: CATEGORY_LABELS[category] || category, category },
      { type: "faq-list", text: `以下是「${CATEGORY_LABELS[category]}」的常見問題：`, faqs },
    ]);
  };

  const handleFaqClick = (faq: QAItem) => {
    setMessages((prev) => [...prev, { type: "user", text: faq.question }, { type: "bot", text: faq.answer, imageUrl: faq.imageUrl }]);
  };

  const handleReset = () => {
    setMessages([]);
    setShowCategories(true);
    setSearchQuery("");
  };

  return (
    <>
      {/* 懸浮按鈕 */}
      {!isOpen && (
        <div
          id="qa-fab"
          style={{ position: "fixed", left: "1rem", bottom: fabBottom, zIndex: 9999, cursor: "pointer" }}
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="常見問題 QA"
          onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
        >
          <div
            style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
              color: C.text,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(235,183,81,0.5)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(235,183,81,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(235,183,81,0.5)";
            }}
          >
            <MessageSquareText size={22} />
          </div>
          <span style={{
            position: "absolute", top: "-0.25rem", right: "-0.25rem",
            background: C.dark, color: "#fff",
            fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.02em",
            borderRadius: "50%", width: "1.25rem", height: "1.25rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            QA
          </span>
        </div>
      )}

      {/* 對話框 */}
      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998, backgroundColor: "rgba(0,0,0,0.25)" }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "fixed", zIndex: 9999,
              left: "1rem", bottom: "5.5rem",
              width: "calc(100% - 2rem)", maxWidth: "24rem",
              backgroundColor: "white",
              borderRadius: "0.875rem",
              boxShadow: `0 20px 40px -8px rgba(139,105,20,0.2), 0 8px 16px -4px rgba(0,0,0,0.08)`,
              border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", overflow: "hidden",
              maxHeight: "min(65vh, 520px)", height: "min(65vh, 520px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`,
              color: C.text,
              padding: "0.75rem 1rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MessageSquareText size={18} />
                <span style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.02em" }}>常見問題 QA</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "0.25rem", borderRadius: "50%",
                  background: "transparent", border: "none",
                  color: C.text, cursor: "pointer", opacity: 0.7,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", backgroundColor: C.bg }}>
              {messages.length === 0 && showCategories ? (
                <div>
                  <p style={{ fontSize: "0.75rem", color: C.subtitle, marginBottom: "0.625rem", fontWeight: 500 }}>
                    選擇分類或搜尋問題：
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                      const Icon = CATEGORY_ICONS[key] || HelpCircle;
                      return (
                        <button
                          key={key}
                          onClick={() => handleCategoryClick(key)}
                          style={{
                            textAlign: "left", padding: "0.5rem 0.625rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "white", border: `1px solid ${C.border}`,
                            fontSize: "0.75rem", cursor: "pointer",
                            transition: "all 0.18s",
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            color: C.text,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = C.light;
                            (e.currentTarget as HTMLElement).style.borderColor = C.primary;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = "white";
                            (e.currentTarget as HTMLElement).style.borderColor = C.border;
                          }}
                        >
                          <span style={{ color: C.dark, opacity: 0.8, display: "flex", flexShrink: 0 }}>
                            <Icon size={13} />
                          </span>
                          <span style={{ lineHeight: 1.3 }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {messages.map((msg, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start" }}>
                      {msg.type === "user" ? (
                        <div style={{
                          background: `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                          color: C.text,
                          borderRadius: "0.75rem 0.75rem 0.125rem 0.75rem",
                          padding: "0.625rem 0.875rem",
                          maxWidth: "80%", fontSize: "0.875rem", wordWrap: "break-word", fontWeight: 500,
                        }}>
                          {msg.text}
                        </div>
                      ) : msg.type === "bot" ? (
                        <div style={{
                          backgroundColor: "white", color: "#2D1F00",
                          borderRadius: "0.75rem 0.75rem 0.75rem 0.125rem",
                          padding: "0.625rem 0.875rem",
                          maxWidth: "90%", fontSize: "0.875rem",
                          whiteSpace: "pre-wrap", wordWrap: "break-word",
                          border: `1px solid ${C.border}`,
                          boxShadow: "0 1px 4px rgba(139,105,20,0.08)",
                        }}>
                          {msg.text}
                          {msg.imageUrl && (
                            <div style={{ marginTop: "0.625rem" }}>
                              <img
                                src={msg.imageUrl}
                                alt="相關說明圖片"
                                style={{
                                  width: "100%", borderRadius: "0.5rem",
                                  border: `1px solid ${C.border}`,
                                  cursor: "pointer",
                                }}
                                onClick={() => window.open(msg.imageUrl!, "_blank")}
                                title="點擊放大查看"
                              />
                              <p style={{ fontSize: "0.65rem", color: C.subtitle, marginTop: "0.25rem", textAlign: "center" }}>點擊圖片放大查看</p>
                            </div>
                          )}
                        </div>
                      ) : msg.type === "category" ? (
                        <div style={{
                          backgroundColor: C.light, color: C.dark,
                          borderRadius: "0.5rem",
                          padding: "0.5rem 0.875rem",
                          maxWidth: "80%", fontSize: "0.8125rem", fontWeight: 700,
                          border: `1px solid ${C.primary}`,
                          display: "flex", alignItems: "center", gap: "0.375rem",
                        }}>
                          {(() => { const Icon = CATEGORY_ICONS[msg.category || ""] || HelpCircle; return <Icon size={13} />; })()}
                          {msg.text}
                        </div>
                      ) : msg.type === "faq-list" ? (
                        <div style={{ width: "100%" }}>
                          <p style={{ fontSize: "0.6875rem", color: C.subtitle, paddingLeft: "0.25rem", marginBottom: "0.25rem", fontWeight: 500 }}>
                            {msg.text}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {msg.faqs?.map((faq) => (
                              <button
                                key={faq.id}
                                onClick={() => handleFaqClick(faq)}
                                style={{
                                  width: "100%", textAlign: "left",
                                  padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                                  backgroundColor: "white", border: `1px solid ${C.border}`,
                                  fontSize: "0.75rem", cursor: "pointer",
                                  transition: "all 0.18s", color: "#2D1F00",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = C.light;
                                  (e.currentTarget as HTMLElement).style.borderColor = C.primary;
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = "white";
                                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                                }}
                              >
                                <p style={{
                                  fontWeight: 500, color: "#2D1F00",
                                  display: "-webkit-box", WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical", overflow: "hidden",
                                }}>
                                  {faq.question}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ borderTop: `1px solid ${C.border}`, backgroundColor: "white", padding: "0.625rem", flexShrink: 0 }}>
              {searchResults.length > 0 && searchQuery && (
                <div style={{ maxHeight: "6rem", overflowY: "auto", marginBottom: "0.5rem" }}>
                  {searchResults.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => { setSearchQuery(faq.question); inputRef.current?.focus(); }}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "0.5rem 0.75rem", borderRadius: "0.375rem",
                        backgroundColor: "white", border: `1px solid ${C.border}`,
                        fontSize: "0.75rem", cursor: "pointer", marginBottom: "0.25rem",
                        transition: "all 0.18s", color: "#2D1F00",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.light; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "white"; }}
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.375rem" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendQuestion(); }}
                  placeholder="輸入問題..."
                  style={{
                    flex: 1, padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem", border: `1px solid ${C.border}`,
                    fontSize: "0.875rem", outline: "none",
                    transition: "border-color 0.2s",
                    backgroundColor: C.bg, color: "#2D1F00",
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.primary; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                />
                <button
                  onClick={handleSendQuestion}
                  disabled={isSearching || !searchQuery.trim()}
                  style={{
                    padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
                    background: isSearching || !searchQuery.trim()
                      ? "#e5e7eb"
                      : `linear-gradient(135deg, ${C.primary}, ${C.dark})`,
                    color: isSearching || !searchQuery.trim() ? "#9ca3af" : C.text,
                    border: "none", fontSize: "0.875rem",
                    cursor: isSearching || !searchQuery.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "0.25rem",
                  }}
                >
                  <Search size={14} />
                  {isSearching ? "搜尋中" : "搜尋"}
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  style={{
                    width: "100%", marginTop: "0.375rem", padding: "0.375rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "transparent", border: `1px solid ${C.border}`,
                    fontSize: "0.75rem", cursor: "pointer", color: C.subtitle,
                    transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = C.light;
                    (e.currentTarget as HTMLElement).style.color = C.dark;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = C.subtitle;
                  }}
                >
                  <RotateCcw size={12} />
                  重新開始
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
