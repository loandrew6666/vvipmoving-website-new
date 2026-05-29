import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────── CDN Assets ─────────────── */
const A = {
  logo: "https://static.wixstatic.com/media/605461_4fe727db252b4929ae47ffeec2565398~mv2.png/v1/fill/w_130,h_129,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/%E5%89%B5%E5%8B%9D-14.png",
  truckHero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/truck-3d-hero-nHcXths4FiRqkSTZbqsNXr.webp",
  truckFront: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/truck-front-view-aujzL7uTfBDdEyBgn5cmR4.webp",
  truckArriving: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/truck-arriving-VMGvAFS475pztM2iXC5HU2.webp",
  truckLadderUp: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/truck-ladder-up-close-HUB33BjLvznEip69KGqtEo.webp",
  packing: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/scene-packing-E8TWfAvqR53zEwtm3gLuRQ.webp",
  delivery: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/scene-delivery-563wVAZ2AuCcfAgpGdj6Nc.webp",
  settling: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/scene-settling-MLcxzhfYyvUo7sWL3fqwAD.webp",
  happyHome: "https://d2xsxph8kpxj0f.cloudfront.net/310519663363342819/UpdR9BzkEvi6rSYbxgmsWm/scene-happy-home-AHd3odFRMCYuEaTU8UXr5X.webp",
};

/* ─────────────── Scene definitions ─────────────── */
const NAV_ITEMS = [
  { id: "intro", label: "品牌" },
  { id: "truck", label: "萬獸號" },
  { id: "packing", label: "打包" },
  { id: "delivery", label: "搬運" },
  { id: "settling", label: "歸位" },
  { id: "happy", label: "幸福" },
];

export default function LadderTruckDemo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  /* ── Preload images ── */
  useEffect(() => {
    const srcs = Object.values(A);
    let done = 0;
    srcs.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        done++;
        setLoadPct(Math.round((done / srcs.length) * 100));
        if (done >= srcs.length) {
          setTimeout(() => setLoaded(true), 600);
        }
      };
      img.src = src;
    });
  }, []);

  /* ── Intro sequence (logo reveal) ── */
  useEffect(() => {
    if (!loaded) return;
    const tl = gsap.timeline({
      onComplete: () => setShowIntro(false),
    });
    tl.to(".intro-logo", { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.4)" })
      .to(".intro-tagline", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
      .to(".intro-sub", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .to(".intro-overlay", { opacity: 0, duration: 0.8, ease: "power2.inOut" }, "+=1.2")
      .set(".intro-overlay", { display: "none" });
    return () => { tl.kill(); };
  }, [loaded]);

  /* ── GSAP ScrollTrigger master timeline ── */
  useEffect(() => {
    if (!loaded || !wrapRef.current) return;

    const ctx = gsap.context(() => {
      /* --- Section pinning & active tracking --- */
      sectionRefs.current.forEach((el, i) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveIdx(i),
          onEnterBack: () => setActiveIdx(i),
        });
      });

      /* --- Scene 0: Intro text reveal --- */
      gsap.utils.toArray<HTMLElement>(".reveal-line").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 60, clipPath: "inset(0 0 100% 0)" },
          {
            opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
            duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", end: "top 55%", scrub: 1 },
          }
        );
      });

      /* --- Scene 1: Truck parallax entrance --- */
      const truckImg = document.querySelector(".truck-hero-img");
      if (truckImg) {
        gsap.fromTo(truckImg,
          { x: "60%", opacity: 0, scale: 0.85 },
          {
            x: "0%", opacity: 1, scale: 1,
            scrollTrigger: {
              trigger: sectionRefs.current[1],
              start: "top 90%",
              end: "top 20%",
              scrub: 1.5,
            },
          }
        );
      }

      /* --- Scene 1: Truck specs counter --- */
      gsap.utils.toArray<HTMLElement>(".spec-num").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            scrollTrigger: { trigger: el, start: "top 85%", end: "top 65%", scrub: 1 },
          }
        );
      });

      /* --- Scene 2: Packing split reveal --- */
      const packLeft = document.querySelector(".pack-img");
      const packRight = document.querySelector(".pack-text");
      if (packLeft) {
        gsap.fromTo(packLeft,
          { x: "-40%", opacity: 0, rotateY: 8 },
          {
            x: "0%", opacity: 1, rotateY: 0,
            scrollTrigger: { trigger: sectionRefs.current[2], start: "top 80%", end: "top 30%", scrub: 1.2 },
          }
        );
      }
      if (packRight) {
        gsap.fromTo(packRight,
          { x: "40%", opacity: 0 },
          {
            x: "0%", opacity: 1,
            scrollTrigger: { trigger: sectionRefs.current[2], start: "top 75%", end: "top 30%", scrub: 1.2 },
          }
        );
      }

      /* --- Scene 3: Delivery immersive zoom --- */
      const delivBg = document.querySelector(".deliv-bg");
      if (delivBg) {
        gsap.fromTo(delivBg,
          { scale: 1.3, opacity: 0.4 },
          {
            scale: 1, opacity: 1,
            scrollTrigger: { trigger: sectionRefs.current[3], start: "top 90%", end: "top 10%", scrub: 1 },
          }
        );
      }

      /* --- Scene 3: Ladder up close parallax --- */
      const ladderUp = document.querySelector(".ladder-up-img");
      if (ladderUp) {
        gsap.fromTo(ladderUp,
          { y: "30%", opacity: 0 },
          {
            y: "0%", opacity: 1,
            scrollTrigger: { trigger: sectionRefs.current[3], start: "top 60%", end: "center center", scrub: 1 },
          }
        );
      }

      /* --- Scene 4: Settling gentle slide --- */
      const settleImg = document.querySelector(".settle-img");
      if (settleImg) {
        gsap.fromTo(settleImg,
          { x: "30%", opacity: 0, scale: 0.92 },
          {
            x: "0%", opacity: 1, scale: 1,
            scrollTrigger: { trigger: sectionRefs.current[4], start: "top 80%", end: "top 25%", scrub: 1.2 },
          }
        );
      }

      /* --- Scene 5: Happy home fade in --- */
      const happyBg = document.querySelector(".happy-bg");
      if (happyBg) {
        gsap.fromTo(happyBg,
          { scale: 1.15, opacity: 0.3 },
          {
            scale: 1, opacity: 1,
            scrollTrigger: { trigger: sectionRefs.current[5], start: "top 80%", end: "top 10%", scrub: 1 },
          }
        );
      }

      /* --- General fade-up elements --- */
      gsap.utils.toArray<HTMLElement>(".fade-up").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            duration: 1,
            scrollTrigger: { trigger: el, start: "top 85%", end: "top 55%", scrub: 1 },
          }
        );
      });

    }, wrapRef);

    return () => ctx.revert();
  }, [loaded]);

  /* ── Nav scroll-to ── */
  const scrollTo = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ═══════════════ LOADING SCREEN ═══════════════ */
  if (!loaded) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a150d]">
        <img src={A.logo} alt="" className="w-16 h-16 mb-6 opacity-60" />
        <div className="w-48 h-[2px] bg-[#3a2a10] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C8973A] to-[#E8C97A] rounded-full transition-all duration-300"
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <span className="mt-3 text-[#7A6348] text-xs tracking-widest">{loadPct}%</span>
      </div>
    );
  }

  /* ═══════════════ MAIN RENDER ═══════════════ */
  return (
    <div ref={wrapRef} className="relative bg-[#FDFAF5]">

      {/* ── Intro overlay (logo reveal) ── */}
      {showIntro && (
        <div className="intro-overlay fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#1a150d]">
          <img src={A.logo} alt="創勝" className="intro-logo w-24 h-24 opacity-0 scale-75" />
          <h1 className="intro-tagline mt-6 text-3xl md:text-5xl font-black text-[#E8C97A] opacity-0 translate-y-4 tracking-wider">
            創勝包裝
          </h1>
          <p className="intro-sub mt-3 text-[#C8973A]/60 text-sm md:text-base opacity-0 translate-y-4 tracking-[0.3em]">
            豈止於服務
          </p>
        </div>
      )}

      {/* ── Fixed top nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 py-3 bg-[#FDFAF5]/80 backdrop-blur-md border-b border-[#E2D0B0]/40">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={A.logo} alt="創勝" className="w-9 h-9" />
          <span className="text-[#2C1F0E] font-bold text-base tracking-wider hidden sm:block">VVIP MOVING</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => scrollTo(i)}
              className={`px-3 py-1.5 text-xs tracking-wider rounded-full transition-all duration-300 ${
                activeIdx === i
                  ? "bg-[#C8973A] text-white font-bold"
                  : "text-[#7A6348] hover:text-[#2C1F0E] hover:bg-[#F5EDD8]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="tel:02-55740033" className="hidden sm:flex items-center gap-1.5 text-[#7A6348] text-xs hover:text-[#C8973A] transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            02-5574-0033
          </a>
          <Link href="/ai-estimate">
            <Button className="bg-[#C8973A] hover:bg-[#A67A28] text-white font-bold text-xs px-5 py-2 rounded-full shadow-md">
              AI 智能估價
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Fixed bottom CTA (mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-[#FDFAF5]/90 backdrop-blur-md border-t border-[#E2D0B0]/40">
        <Link href="/ai-estimate" className="block">
          <Button className="w-full bg-[#C8973A] hover:bg-[#A67A28] text-white font-bold py-3 rounded-full shadow-lg">
            立即 AI 智能估價
          </Button>
        </Link>
      </div>

      {/* ── Right progress dots ── */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3">
        {NAV_ITEMS.map((item, i) => (
          <button key={item.id} onClick={() => scrollTo(i)} className="group relative flex items-center">
            <span className={`absolute right-7 whitespace-nowrap text-[10px] font-medium px-2 py-0.5 rounded transition-all duration-300 pointer-events-none ${
              activeIdx === i ? "opacity-100 translate-x-0 bg-[#C8973A] text-white" : "opacity-0 translate-x-2 bg-[#2C1F0E]/70 text-[#E8C97A]"
            } group-hover:opacity-100 group-hover:translate-x-0`}>
              {item.label}
            </span>
            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
              activeIdx === i
                ? "bg-[#C8973A] border-[#C8973A] scale-125 shadow-[0_0_10px_rgba(200,151,58,0.5)]"
                : "bg-transparent border-[#C8973A]/30 hover:border-[#C8973A]"
            }`} />
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          SCENE 0 — Brand Intro (warm ivory bg)
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
      >
        {/* Subtle warm gradient orb */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C8973A]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="reveal-line mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#C8973A]/8 border border-[#C8973A]/15 text-[#C8973A] text-xs tracking-[0.25em] uppercase font-medium">
              Since 2015 · 搬家界的愛馬仕
            </span>
          </div>

          <h1 className="reveal-line text-5xl md:text-7xl lg:text-8xl font-black text-[#2C1F0E] leading-[1.1] mb-6">
            雲梯車
          </h1>
          <h2 className="reveal-line text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-8">
            <span className="text-[#C8973A]">把愛送到家</span>
          </h2>

          <p className="reveal-line text-[#7A6348] text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            從打包的那一刻起，我們就在守護你的每一份回憶。<br className="hidden md:block" />
            搬的不只是物品，是你對新生活的期待。
          </p>

          {/* Scroll hint */}
          <div className="reveal-line flex flex-col items-center gap-2 mt-4">
            <span className="text-[#C8973A]/40 text-[10px] tracking-[0.4em] uppercase">Scroll to Explore</span>
            <div className="w-5 h-9 border-2 border-[#C8973A]/25 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-1 bg-[#C8973A]/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCENE 1 — 萬獸號 (The Beast)
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="relative min-h-[120vh] flex items-center overflow-hidden bg-gradient-to-b from-[#FDFAF5] via-[#F5EDD8] to-[#FDFAF5]"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-4">
          {/* Left: Text */}
          <div className="flex-1 max-w-xl z-10">
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8973A]/8 border border-[#C8973A]/15 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C8973A]" />
              <span className="text-[#C8973A] text-[10px] tracking-[0.25em] uppercase font-medium">Our Fleet</span>
            </div>
            <h2 className="fade-up text-4xl md:text-6xl font-black text-[#2C1F0E] leading-tight mb-2">
              萬獸號
            </h2>
            <p className="fade-up text-lg md:text-xl text-[#C8973A] font-bold mb-6">
              全台唯一韓國雲梯車
            </p>
            <p className="fade-up text-[#7A6348] text-sm md:text-base leading-relaxed mb-10">
              韓國原裝進口，搬家界的愛馬仕。一次到位直達高樓，讓搬家不再是破壞性的過程，而是一場精密的轉移工程。載物籃沿升降臂軌道平穩爬升，藍色緩衝滾輪輕靠陽台，物品安全送達。
            </p>

            {/* Specs */}
            <div className="fade-up grid grid-cols-3 gap-4">
              {[
                { val: "15F", label: "最高可達" },
                { val: "4-5x", label: "搬運容量" },
                { val: "100%", label: "安全送達" },
              ].map((s) => (
                <div key={s.label} className="spec-num text-center p-4 rounded-2xl bg-white/60 border border-[#E2D0B0]/40 shadow-sm">
                  <div className="text-2xl md:text-3xl font-black text-[#C8973A]">{s.val}</div>
                  <div className="text-[#7A6348] text-[10px] mt-1 tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Truck image */}
          <div className="flex-1 relative">
            <img
              src={A.truckHero}
              alt="萬獸號雲梯車"
              className="truck-hero-img w-full h-auto rounded-2xl shadow-2xl shadow-[#C8973A]/10"
            />
            {/* Glow under truck */}
            <div className="absolute -bottom-6 left-[10%] right-[10%] h-16 bg-[#C8973A]/8 rounded-full blur-2xl" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCENE 2 — 打包專業
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: Image */}
          <div className="pack-img flex-1 max-w-2xl" style={{ perspective: "1200px" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#C8973A]/10 border border-[#E2D0B0]/30">
              <img src={A.packing} alt="打包專業" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1F0E]/30 via-transparent to-transparent" />
            </div>
          </div>

          {/* Right: Text */}
          <div className="pack-text flex-1 max-w-lg text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8973A]/8 border border-[#C8973A]/15 mb-6">
              <span className="text-[#C8973A] text-[10px] tracking-[0.25em] uppercase font-medium">Step 01 · Packing</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#2C1F0E] mb-2 leading-tight">
              打包<span className="text-[#C8973A]">專業</span>
            </h2>
            <p className="text-[#C8973A]/70 text-sm font-bold mb-4 tracking-wider">
              每一件物品都值得被珍惜對待
            </p>
            <p className="text-[#7A6348] text-sm md:text-base leading-relaxed mb-8">
              自研 10 種以上專用包材，從電視保護箱到衣架分類箱。日式包裝工法，氣泡布層層包覆，確保每一件物品在運送過程中零損傷。
            </p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {["電視專用箱", "衣箱掛架", "鞋包帽箱", "廚房分隔箱", "日式包裝工法", "氣泡布保護"].map((t) => (
                <span key={t} className="px-3 py-1.5 text-[11px] text-[#C8973A] bg-[#C8973A]/6 border border-[#C8973A]/12 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCENE 3 — 搬運穩健 (immersive full-bleed)
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="relative min-h-[130vh] flex items-center overflow-hidden"
      >
        {/* Full bleed background */}
        <div className="absolute inset-0">
          <img src={A.delivery} alt="" className="deliv-bg w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a150d] via-[#1a150d]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a150d]/70 via-transparent to-[#1a150d]/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-10">
          {/* Left: Text overlay */}
          <div className="flex-1 max-w-xl">
            <div className="fade-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-6">
              <span className="text-[#E8C97A] text-[10px] tracking-[0.25em] uppercase font-medium">Step 02 · Delivery</span>
            </div>
            <h2 className="fade-up text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4">
              搬運<span className="text-[#E8C97A]">穩健</span>
            </h2>
            <p className="fade-up text-white/50 text-sm md:text-base leading-relaxed mb-8">
              雲端直送，安全無虞。韓國雲梯車直達高樓，一次到位。載物籃沿黑色升降臂軌道向上爬升，抵達目標樓層後，藍色滾輪靠上欄杆，陽台工人將物品水平拉進室內。
            </p>

            {/* Stats */}
            <div className="fade-up flex gap-6 md:gap-10">
              {[
                { val: "15", unit: "樓", label: "最高可達樓層" },
                { val: "3", unit: "分鐘", label: "單趟運送時間" },
                { val: "500", unit: "kg", label: "單次最大載重" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-[#E8C97A]">{s.val}</span>
                    <span className="text-[#E8C97A]/60 text-sm">{s.unit}</span>
                  </div>
                  <div className="text-white/30 text-[10px] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Ladder close-up */}
          <div className="flex-1 flex justify-center">
            <img
              src={A.truckLadderUp}
              alt="升降臂特寫"
              className="ladder-up-img w-full max-w-xs md:max-w-sm rounded-2xl shadow-2xl shadow-black/30 border border-white/5"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCENE 4 — 歸位細心
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[4] = el; }}
        className="relative min-h-screen flex items-center overflow-hidden bg-[#FDFAF5]"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left: Text */}
          <div className="fade-up flex-1 max-w-lg text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8973A]/8 border border-[#C8973A]/15 mb-6">
              <span className="text-[#C8973A] text-[10px] tracking-[0.25em] uppercase font-medium">Step 03 · Settling</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#2C1F0E] mb-2 leading-tight">
              歸位<span className="text-[#C8973A]">細心</span>
            </h2>
            <p className="text-[#C8973A]/70 text-sm font-bold mb-4 tracking-wider">
              不只搬家，更幫你把家搬好
            </p>
            <p className="text-[#7A6348] text-sm md:text-base leading-relaxed mb-8">
              女力收納師進駐新家，每一本書、每一件衣物都歸回它該在的位置。從衣櫃整理到廚房歸位，讓你到新家的第一天就能安心入住。
            </p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {["女力收納師", "新家歸位", "衣物整理", "書籍分類", "廚房歸位"].map((t) => (
                <span key={t} className="px-3 py-1.5 text-[11px] text-[#C8973A] bg-[#C8973A]/6 border border-[#C8973A]/12 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <div className="settle-img flex-1 max-w-2xl">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#C8973A]/10 border border-[#E2D0B0]/30">
              <img src={A.settling} alt="歸位細心" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1F0E]/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCENE 5 — 幸福到家 + CTA
          ═══════════════════════════════════════════ */}
      <section
        ref={(el) => { sectionRefs.current[5] = el; }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Full bleed warm background */}
        <div className="absolute inset-0">
          <img src={A.happyHome} alt="" className="happy-bg w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a150d] via-[#1a150d]/60 to-[#1a150d]/30" />
        </div>

        {/* Floating hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-heart"
              style={{
                left: `${10 + Math.random() * 80}%`,
                bottom: `-10%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${7 + Math.random() * 6}s`,
                opacity: 0.12 + Math.random() * 0.15,
                fontSize: `${12 + Math.random() * 18}px`,
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#E8C97A]" style={{ width: "1em", height: "1em" }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          ))}
        </div>

        {/* CTA content */}
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#E8C97A]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-[#E8C97A] text-[10px] tracking-[0.3em] uppercase font-medium">Delivering Happiness</span>
          </div>

          <h2 className="fade-up text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-4">
            幸福到家
          </h2>
          <p className="fade-up text-[#E8C97A]/70 text-lg md:text-xl mb-3 tracking-wider">
            因為愛 · 創勝在
          </p>
          <p className="fade-up text-white/40 text-sm md:text-base max-w-xl mx-auto mb-12 leading-relaxed">
            從打包的那一刻起，我們就在守護你的每一份回憶。<br />
            搬的不只是物品，是你對新生活的期待。
          </p>

          <div className="fade-up flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/ai-estimate">
              <Button className="bg-[#C8973A] hover:bg-[#A67A28] text-white font-bold text-base md:text-lg px-10 py-5 rounded-full shadow-xl shadow-[#C8973A]/30 transition-all duration-300 hover:scale-105">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 mr-2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 智能估價
              </Button>
            </Link>
            <a href="tel:02-55740033">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold text-base md:text-lg px-10 py-5 rounded-full transition-all duration-300 hover:scale-105 bg-transparent">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                02-5574-0033
              </Button>
            </a>
          </div>

          {/* Brand tagline */}
          <div className="fade-up mt-14 flex items-center justify-center gap-5 text-white/20 text-xs tracking-[0.15em]">
            <span>打包專業</span>
            <span className="w-1 h-1 rounded-full bg-[#E8C97A]/30" />
            <span>搬運穩健</span>
            <span className="w-1 h-1 rounded-full bg-[#E8C97A]/30" />
            <span>歸位細心</span>
          </div>
        </div>
      </section>

      {/* ── Footer spacer for mobile CTA ── */}
      <div className="h-16 md:h-0 bg-[#FDFAF5]" />

      {/* ── Global CSS animations ── */}
      <style>{`
        @keyframes float-heart {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0; }
          10% { opacity: 0.25; }
          50% { transform: translateY(-50vh) translateX(15px) rotate(12deg) scale(1.05); opacity: 0.15; }
          100% { transform: translateY(-100vh) translateX(-8px) rotate(-8deg) scale(0.85); opacity: 0; }
        }
        .animate-float-heart { animation: float-heart linear infinite; }

        html { scrollbar-width: thin; scrollbar-color: rgba(200,151,58,0.25) transparent; }
        html::-webkit-scrollbar { width: 4px; }
        html::-webkit-scrollbar-track { background: transparent; }
        html::-webkit-scrollbar-thumb { background: rgba(200,151,58,0.25); border-radius: 2px; }
      `}</style>
    </div>
  );
}
