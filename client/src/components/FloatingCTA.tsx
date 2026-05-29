import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bot, Search, Phone, MessageCircle, X } from "lucide-react";
import { BRAND } from "@/lib/brandData";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function FloatingCTA() {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();

  // 路由切換時自動關閉菜單
  useEffect(() => {
    setShowAiMenu(false);
  }, [location]);

  const aiActions = [
    {
      icon: Bot,
      label: "AI 智能估價",
      desc: "快速獲得搬家估價",
      href: "/ai-estimate",
      isMain: true,
    },
    {
      icon: Search,
      label: "案件查詢",
      desc: "查詢您的案件進度",
      href: "/track",
    },
    {
      icon: Phone,
      label: "撥打電話",
      desc: BRAND.phone,
      href: `tel:${BRAND.phone}`,
      external: true,
    },
  ];

  const handleOpenChat = () => {
    if ((window as any).__openChat) {
      (window as any).__openChat();
    }
  };

  // ===== 按鈕尺寸 =====
  // 桌面版：3.5rem（56px）
  // 手機版：3rem（48px）
  const btnSize = isMobile ? "3rem" : "3.5rem";
  const iconSize = isMobile ? "1.25rem" : "1.5rem";

  // ===== 按鈕位置 =====
  // 桌面版：bottom: 1.5rem（容器底部，AI估價按鈕底部）
  // 手機版：AI估價按鈕 bottom: 4.5rem（底部導航 3.5rem + 0.5rem 間距 + 0.5rem 餘量）
  //         客服按鈕 bottom: 4.5rem + 3rem + 0.5rem = 8rem
  const aiBottom = isMobile ? "4.5rem" : "1.5rem";
  const chatBottom = isMobile ? "8rem" : "1.5rem"; // 手機版客服在AI估價上方

  // 展開菜單位置：在 AI 估價按鈕上方
  const menuBottom = isMobile ? "7.75rem" : "5.25rem";

  return (
    <>
      {/* ===== 桌面版：右下角按鈕組（客服上、AI 估價下，垂直排列） ===== */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1rem",
            zIndex: 9990,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* 客服按鈕 - 綠色（上） */}
          <button
            onClick={handleOpenChat}
            style={{
              width: btnSize,
              height: btnSize,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="聯絡客服"
            title="聯絡客服"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#16a34a";
              (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#22c55e";
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            <MessageCircle style={{ width: iconSize, height: iconSize }} />
          </button>

          {/* AI 估價按鈕 - 橙色（下） */}
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            style={{
              width: btnSize,
              height: btnSize,
              borderRadius: "50%",
              backgroundColor: showAiMenu ? "#333" : "#ea580c",
              color: "white",
              border: "none",
              boxShadow: showAiMenu
                ? "0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 12px rgba(234,88,12,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="AI 智能估價"
            title="AI 智能估價"
            onMouseEnter={(e) => {
              if (!showAiMenu) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#c2410c";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showAiMenu) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#ea580c";
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }
            }}
          >
            {showAiMenu ? (
              <X style={{ width: iconSize, height: iconSize }} />
            ) : (
              <Bot style={{ width: iconSize, height: iconSize }} />
            )}
          </button>
        </div>
      )}

      {/* ===== 手機版：右下角獨立按鈕（客服上、AI 估價下） ===== */}
      {isMobile && (
        <>
          {/* 客服按鈕 - 綠色（上方） */}
          <button
            onClick={handleOpenChat}
            style={{
              position: "fixed",
              bottom: chatBottom,
              right: "1rem",
              zIndex: 9990,
              width: btnSize,
              height: btnSize,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              color: "white",
              border: "none",
              boxShadow: "0 4px 12px rgba(34,197,94,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="聯絡客服"
            title="聯絡客服"
          >
            <MessageCircle style={{ width: iconSize, height: iconSize, pointerEvents: "none" }} />
          </button>

          {/* AI 估價按鈕 - 橙色（下方，底部導航上方） */}
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            style={{
              position: "fixed",
              bottom: aiBottom,
              right: "1rem",
              zIndex: 9990,
              width: btnSize,
              height: btnSize,
              borderRadius: "50%",
              backgroundColor: showAiMenu ? "#333" : "#ea580c",
              color: "white",
              border: "none",
              boxShadow: showAiMenu
                ? "0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 12px rgba(234,88,12,0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="AI 智能估價"
            title="AI 智能估價"
          >
            {showAiMenu ? (
              <X style={{ width: iconSize, height: iconSize, pointerEvents: "none" }} />
            ) : (
              <Bot style={{ width: iconSize, height: iconSize, pointerEvents: "none" }} />
            )}
          </button>
        </>
      )}

      {/* ===== AI 估價菜單 ===== */}
      {showAiMenu && (
        <>
          {/* 背景遮罩 */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9988,
              backgroundColor: "transparent",
            }}
            onClick={() => setShowAiMenu(false)}
          />
          <div
            style={{
              position: "fixed",
              bottom: menuBottom,
              right: "1rem",
              zIndex: 9991,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              width: "14rem",
            }}
          >
            {aiActions.map((action) => {
              const Icon = action.icon;
              const content = (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: action.isMain ? "#ea580c" : "white",
                    color: action.isMain ? "white" : "#333",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    border: action.isMain ? "none" : "1px solid #e5e7eb",
                    transition: "background-color 0.15s",
                  }}
                >
                  <Icon
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        lineHeight: "1.25",
                      }}
                    >
                      {action.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.8,
                        lineHeight: "1.25",
                      }}
                    >
                      {action.desc}
                    </div>
                  </div>
                </div>
              );

              if (action.external) {
                return (
                  <a
                    key={action.label}
                    href={action.href}
                    onClick={() => setShowAiMenu(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => setShowAiMenu(false)}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
