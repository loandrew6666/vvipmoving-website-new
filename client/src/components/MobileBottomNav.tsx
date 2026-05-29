import { Link, useLocation } from "wouter";
import { Home, Bot, Phone, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brandData";
import { useState, useEffect } from "react";

const tabs = [
  { icon: Home, label: "首頁", href: "/" },
  { icon: Bot, label: "AI估價", href: "/ai-estimate", highlight: true },
  { icon: Phone, label: "立即撥打", href: `tel:${BRAND.phone}`, external: true },
  { icon: Search, label: "案件查詢", href: "/track" },
  { icon: Menu, label: "更多", href: "#more" },
];

const moreLinks = [
  { label: "服務項目", href: "/services" },
  { label: "包材介紹", href: "/packaging" },
  { label: "案例回顧", href: "/case" },
  { label: "常見問題", href: "/faq" },
  { label: "關於創勝", href: "/about" },
  { label: "聯絡我們", href: "/contact" },
  { label: "加入 LINE", href: BRAND.lineUrl, external: true },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const [showMore, setShowMore] = useState(false);

  // 路由切換時自動關閉更多菜單
  useEffect(() => {
    setShowMore(false);
  }, [location]);

  return (
    <>
      {/* 更多選單遮罩 */}
      {showMore && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden pointer-events-auto"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* 更多選單抽屜（從底部彈出） */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 z-[100] bg-white rounded-t-2xl shadow-2xl transition-all duration-300 md:hidden",
          showMore ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* 把手 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        <div className="px-4 pb-6 pt-2">
          <p className="text-xs text-muted-foreground font-medium mb-3 px-1">快速導覽</p>
          <div className="grid grid-cols-3 gap-2">
            {moreLinks.map((link) => {
              const content = (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-center transition-colors",
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-xs font-medium leading-tight">{link.label}</span>
                </div>
              );

              if (link.external) {
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMore(false)}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setShowMore(false)}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          {/* 快速聯絡列 */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={`tel:${BRAND.phone}`}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm"
            >
              <Phone className="w-4 h-4" />
              立即撥打
            </a>
            <a
              href={BRAND.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm"
              onClick={() => setShowMore(false)}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              加入 LINE
            </a>
          </div>
        </div>
      </div>

      {/* 底部 Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location === tab.href;
            const isMore = tab.href === "#more";
            const isPhone = tab.external && tab.href.startsWith("tel:");

            if (isMore) {
              return (
                <button
                  key={tab.label}
                  onClick={() => setShowMore(!showMore)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                    showMore ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }

            if (tab.highlight) {
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setShowMore(false)}
                >
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            }

            if (isPhone) {
              return (
                <a
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                    "text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </a>
              );
            }

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => setShowMore(false)}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </>
  );
}
