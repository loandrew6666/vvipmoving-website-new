import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu, Phone, ChevronDown, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND, IMAGES } from "@/lib/brandData";

const navItems = [
  { label: "最新消息", href: "/news" },
  {
    label: "關於創勝",
    href: "/about",
    children: [
      { label: "公司介紹", href: "/about", desc: "了解創勝的故事與理念" },
      { label: "到府估價 SOP", href: "/evaluate", desc: "透明化的估價流程說明" },
    ],
  },
  {
    label: "服務項目",
    href: "/services",
    children: [
      { label: "服務總覽", href: "/services", desc: "家庭、企業、特殊搬運" },
      { label: "包材介紹", href: "/packaging", desc: "專業包材保護您的物品" },
      { label: "常見問題", href: "/faq", desc: "搬家前必看的問題解答" },
    ],
  },
  { label: "案例回顧", href: "/case" },
  { label: "影音專區", href: "/video" },
  { label: "聯絡我們", href: "/contact" },
];

// 桌面版下拉選單項目
function DesktopNavItem({
  item,
  isActive,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  const handleClick = () => {
    setOpen(false);
  };

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary",
          isActive ? "text-primary" : "text-foreground/80"
        )}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary cursor-pointer",
          isActive ? "text-primary" : "text-foreground/80"
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open ? "rotate-180 text-primary" : ""
          )}
        />
      </Link>

      {/* 下拉選單 */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {item.children.map((child) => (
            <Link
              key={child.label}
              href={child.href}
              onClick={handleClick}
              className="block px-4 py-3 hover:bg-secondary transition-colors group"
            >
              <div className="text-sm font-medium text-gray-900 group-hover:text-primary">
                {child.label}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{child.desc}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 路由變更時關閉手機選單
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/90 backdrop-blur-sm"
      )}
    >
      {/* 頂部聯絡資訊欄 */}
      <div className="bg-primary text-primary-foreground py-1.5 px-4 text-sm hidden md:block">
        <div className="container flex justify-center items-center gap-6">
          <span className="font-medium">{BRAND.name}｜{BRAND.tagline}</span>
          <a
            href={`tel:${BRAND.phone}`}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            聯繫電話：{BRAND.phone}
          </a>
        </div>
      </div>

      {/* 主導覽列 */}
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          {logoError ? (
            <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              V
            </div>
          ) : (
            <img
              src={IMAGES.logo}
              alt="創勝包裝 VVIP Moving"
              className="w-10 h-10 object-contain flex-shrink-0"
              onError={() => setLogoError(true)}
            />
          )}
          <div className="leading-tight flex flex-col items-center justify-center">
            <div className="text-brand font-black text-base tracking-wide text-center">VVIP Moving</div>
            <div className="text-foreground/70 text-[10px] font-medium tracking-widest text-center">創勝包裝</div>
          </div>
        </Link>

        {/* 桌面導覽 */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.label}
              item={item}
              isActive={location === item.href}
            />
          ))}
        </nav>

        {/* 右側 CTA 按鈕 */}
        <div className="hidden lg:flex items-center gap-2">
          <Link href="/pricing-taipei">
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
              台北預約
            </Button>
          </Link>
          <Link href="/pricing-kaohsiung">
            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
              高雄預約
            </Button>
          </Link>
          <Link href="/ai-estimate">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1.5">
              <Bot className="w-4 h-4" />
              AI 估價
            </Button>
          </Link>
        </div>

        {/* 手機選單 */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 pt-12">
            <VisuallyHidden><SheetTitle>導覽選單</SheetTitle></VisuallyHidden>
            <div className="flex flex-col gap-1">
              {/* 手機 CTA */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Link href="/pricing-taipei" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary text-white text-sm">台北預約</Button>
                </Link>
                <Link href="/pricing-kaohsiung" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-primary text-white text-sm">高雄預約</Button>
                </Link>
              </div>
              <Link href="/ai-estimate" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-primary/10 text-primary border border-primary/20 mb-4 gap-2">
                  <Bot className="w-4 h-4" />
                  AI 智能估價
                </Button>
              </Link>

              {/* 手機導覽連結 */}
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="pl-4 border-l-2 border-primary/20 ml-3 mb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* 聯絡資訊 */}
              <div className="mt-4 pt-4 border-t border-border">
                <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2 px-3 py-2 text-sm text-primary font-semibold">
                  <Phone className="w-4 h-4" />
                  {BRAND.phone}
                </a>
                <a
                  href={BRAND.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 font-medium"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.630 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINE: @vvipmoving
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
