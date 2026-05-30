import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone, MessageCircle, Star, Shield, Truck, Package, ChevronRight,
  Play, ArrowRight, CheckCircle, Award, Clock, MapPin, Bot
} from "lucide-react";
import { BRAND, IMAGES, VIDEOS, NEWS_ITEMS, SERVICES } from "@/lib/brandData";

export default function HomePage() {
  const [activeRegion, setActiveRegion] = useState<"taipei" | "kaohsiung">("taipei");

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-white">
        {/* 菱形紋理底層 */}
        <div className="absolute inset-0 hero-texture opacity-60" />
        {/* 光暈裝飾層 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 右上角金色光束 */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand/8 rounded-full blur-[80px]" />
          {/* 左下角暖光 */}
          <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-brand-light/15 rounded-full blur-[60px]" />
          {/* 中央微光 */}
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand/5 rounded-full blur-[50px] -translate-y-1/2" />
          {/* 右上角對角線光條 */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-brand/20 via-brand/5 to-transparent" />
        </div>

        {/* 手機版 Hero（全螢幕圖片背景） */}
        <div className="block lg:hidden relative">
          <div className="relative h-[60vw] min-h-[240px] max-h-[340px] overflow-hidden">
            <img
              src={IMAGES.heroBannerMobile}
              srcSet={`${IMAGES.heroBannerMobile} 720w, ${IMAGES.heroBanner} 1265w`}
              sizes="(max-width: 1024px) 100vw, 1265px"
              alt="創勝包裝精緻搬家服務"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-brand text-white px-2.5 py-0.5 text-xs font-medium">台灣高端精緻搬家</Badge>
                <Badge className="bg-white/90 border border-brand text-brand px-2.5 py-0.5 text-xs">150萬物品責任險</Badge>
              </div>
              <h1 className="text-3xl font-black text-white leading-tight drop-shadow-lg">
                <span className="text-brand-light">創勝包裝</span>
                <br />
                <span className="text-2xl font-bold">豈止於服務</span>
              </h1>
            </div>
          </div>

          {/* 手機版 CTA 區 */}
          <div className="px-4 py-5 space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              不只是搬家，更幫你把未來搬過來了。全程免動手，從打包、搬運到歸位，一次到位。
            </p>

            {/* 主要 CTA - 強化 AI 估價 */}
            <div className="space-y-3">
              <Link href="/ai-estimate" className="w-full block">
                <Button size="lg" className="btn-gold-glow bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl w-full h-14 text-base">
                  <Bot className="h-5 w-5 mr-2" />
                  AI 智能估價
                </Button>
              </Link>
              <p className="text-xs text-gray-500 text-center">快速獲得精準估價，無需等待</p>
            </div>

            {/* 信任指標 */}
            <div className="flex items-center justify-around py-3 bg-white rounded-2xl shadow-sm border border-border">
              <div className="text-center">
                <div className="text-brand font-black text-lg">5.0★</div>
                <div className="text-xs text-gray-500">Google評價</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-brand font-black text-lg">150萬</div>
                <div className="text-xs text-gray-500">物品責任險</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-brand font-black text-lg">10+年</div>
                <div className="text-xs text-gray-500">搬家經驗</div>
              </div>
            </div>
          </div>
        </div>

        {/* 桌面版 Hero（原版） */}
        <div className="hidden lg:block container relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-brand text-white px-3 py-1 text-sm font-medium">
                  台灣高端精緻搬家
                </Badge>
                <Badge className="bg-white border border-brand text-brand px-3 py-1 text-sm">
                  150萬物品責任險
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="text-brand">創勝包裝</span>
                <br />
                <span className="text-3xl md:text-4xl text-gray-700">豈止於服務</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                不只是搬家，更幫你把未來搬過來了
                <br />
                <span className="text-brand font-semibold">看見你要的家 Open Moving</span>
              </p>

              <p className="text-gray-500 text-base leading-relaxed">
                沒有做不到，只有想不到。最困難的事創勝幫您扛起來了。
                全程免動手，從打包、搬運到歸位，一次到位。
              </p>

              {/* CTA Buttons - 強化 AI 估價 */}
              <div className="flex flex-col gap-4">
                <Link href="/ai-estimate">
                  <Button size="lg" className="btn-gold-glow bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 text-lg rounded-full w-full">
                    <Bot className="mr-2 h-5 w-5" />
                    AI 智能估價
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-center text-sm text-gray-600">或撥打 <a href={`tel:${BRAND.phone}`} className="text-brand font-semibold hover:underline">{BRAND.phone}</a> 直接諮詢</p>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: Shield, text: "150萬物品責任險" },
                  { icon: Award, text: "法律顧問保障" },
                  { icon: Star, text: "網紅指定搬家" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Icon className="h-4 w-4 text-brand" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="relative">
              {/* 金色光暈圈 */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-brand/20 via-brand-light/10 to-transparent blur-xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-brand/20">
                <img
                  src={IMAGES.heroBanner}
                  srcSet={`${IMAGES.heroBannerMobile} 720w, ${IMAGES.heroBanner} 1265w`}
                  sizes="(max-width: 1024px) 100vw, 1265px"
                  alt="創勝包裝精編搦家服務"
                  className="w-full h-[420px] object-cover"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/30 via-transparent to-transparent" />
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-brand fill-brand" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">5.0 ★★★★★</div>
                    <div className="text-sm text-gray-500">Google 評價</div>
                  </div>
                </div>
              </div>

              {/* Floating phone card */}
              <div className="absolute -top-4 -right-4 bg-brand text-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <div>
                    <div className="text-xs opacity-80">立即撥打</div>
                    <div className="font-bold">{BRAND.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REGION BOOKING SECTION ===== */}
      <section className="bg-brand py-4 md:py-6">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-white font-semibold text-base md:text-lg">立即預約搬家服務：</span>
            <div className="flex gap-3 w-full sm:w-auto">
              <a href={BRAND.bookingUrls.taipei} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                <Button size="lg" className="btn-gold-outline bg-white text-brand hover:bg-secondary font-bold px-4 md:px-8 rounded-full shadow-md w-full text-sm md:text-base gap-2">
                  <MapPin className="h-4 w-4" />台北預約
                </Button>
              </a>
              <a href={BRAND.bookingUrls.kaohsiung} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                <Button size="lg" className="btn-gold-outline bg-brand-dark/80 text-white hover:bg-brand-dark font-bold px-4 md:px-8 rounded-full shadow-md border-2 border-white/40 w-full text-sm md:text-base gap-2">
                  <MapPin className="h-4 w-4" />高雄預約
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES OVERVIEW ===== */}
      <section className="py-10 md:py-20 bg-white">
        <div className="container">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">服務項目</h2>
            <p className="text-gray-500 text-sm md:text-lg max-w-2xl mx-auto">
              像八爪章魚一樣樣樣精通，提供您最全面的搬家解決方案
            </p>
          </div>

          {/* 手機版：橫向滑動卡片 */}
          <div className="md:hidden -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none" style={{scrollbarWidth:'none'}}>
              {SERVICES.map((service) => (
                <div key={service.id} className="flex-none w-[72vw] snap-start">
                  <Card className="overflow-hidden border-border h-full">
                    <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          const parent = el.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#f5ede0]"><svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg></div>`;
                          }
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Truck className="w-5 h-5 text-brand flex-shrink-0" />
                        <div>
                          <h3 className="text-base font-bold text-gray-900">{service.title}</h3>
                          <p className="text-brand text-xs font-medium">{service.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{service.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            {/* 滑動提示 */}
            <p className="text-center text-xs text-gray-400 mt-1">← 左右滑動查看更多 →</p>
          </div>

          {/* 桌面版：格狀卡片 */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-border hover:border-brand/40 overflow-hidden">
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      const parent = el.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[#f5ede0]"><svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="#8B6914" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg></div>`;
                      }
                    }}
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-6 h-6 text-brand flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                      <p className="text-brand text-xs font-medium">{service.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{service.description}</p>
                  <ul className="space-y-1">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-brand flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-6 md:mt-10">
            <Link href="/services">
              <Button size="lg" className="bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-full px-8 transition-all">
                查看所有服務項目
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-20 bg-gradient-to-br from-secondary to-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">為什麼選擇創勝？</h2>
            <p className="text-gray-500 text-lg">業界唯一愛馬仕等級的搬家體驗</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "150萬物品責任險",
                desc: "每車均提供新台幣150萬物品責任險，由保險公司及第三方公正單位作賠償",
              },
              {
                icon: Award,
                title: "法律顧問保障",
                desc: "聘請大恆國際法律事務所林柏裕律師擔任法律顧問，提供預防性、保障性、即時性三大保障",
              },
              {
                icon: Star,
                title: "網紅指定搬家",
                desc: "木曜4超玩、波特王、黃阿瑪、這群人等眾多知名YouTuber指定合作",
              },
              {
                icon: Package,
                title: "全程免動手",
                desc: "從打包、搬運到歸位一條龍服務，您只需動嘴，不用動手",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-white border-0 shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-brand" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING PREVIEW ===== */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">透明計價方式</h2>
            <p className="text-gray-500 text-lg">費用皆採實報實銷，以實際現場執行為主</p>
          </div>

          {/* Region tabs - 重新設計，未選中的也清楚可見 */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setActiveRegion("taipei")}
              className={`rounded-full px-8 py-3 font-bold text-base transition-all border-2 ${
                activeRegion === "taipei"
                  ? "bg-brand text-white border-brand shadow-lg"
                  : "bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand"
              }`}
            >
  台北地區
            </button>
            <button
              onClick={() => setActiveRegion("kaohsiung")}
              className={`rounded-full px-8 py-3 font-bold text-base transition-all border-2 ${
                activeRegion === "kaohsiung"
                  ? "bg-brand text-white border-brand shadow-lg"
                  : "bg-white text-gray-700 border-gray-300 hover:border-brand hover:text-brand"
              }`}
            >
              高雄地區
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-brand/20 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <p className="text-brand font-bold text-lg">服務總價計算方式</p>
                  <p className="text-gray-700 text-xl font-semibold mt-2">
                    ❶ 搬運費 ＋ ❷ 打包費 ＋ ❸ 歸位費用 ＋ ❹ 包裝耗材費用
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      label: "❶ 搬運費",
                      price: activeRegion === "taipei" ? "$3,000起/車" : "$4,000起/車",
                      note: activeRegion === "taipei" ? "台北市內（電梯對電梯）" : "高雄市區內（電梯對電梯）",
                    },
                    { label: "❷ 打包費", price: "+$4,000/車", note: "含標籤貼、分類打包、包材" },
                    { label: "❸ 歸位費", price: "+$4,000/車", note: "含廢棄包材清走、整理" },
                  ].map(({ label, price, note }) => (
                    <div key={label} className="bg-secondary rounded-xl p-4 text-center">
                      <div className="text-brand font-bold text-sm mb-1">{label}</div>
                      <div className="text-2xl font-bold text-gray-900">{price}</div>
                      <div className="text-gray-500 text-xs mt-1">{note}</div>
                    </div>
                  ))}
                </div>

                {/* 樓層費用說明 */}
                <div className="bg-secondary border border-border rounded-xl p-4 mb-4">
                  <h4 className="font-bold text-foreground mb-2">非電梯搬運（樓層費）</h4>
                  <p className="text-muted-foreground text-sm mb-2">新舊家分開計算，每車趟另計：</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {activeRegion === "taipei" ? (
                      <>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">2樓</div>
                          <div className="text-brand font-semibold">+$500/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">3樓</div>
                          <div className="text-brand font-semibold">+$700/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">4樓</div>
                          <div className="text-brand font-semibold">+$900/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">5樓以上</div>
                          <div className="text-brand font-semibold">+$200/樓/車趟</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">2樓</div>
                          <div className="text-brand font-semibold">+$600/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">3樓</div>
                          <div className="text-brand font-semibold">+$800/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">4樓</div>
                          <div className="text-brand font-semibold">+$1,000/車趟</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <div className="font-bold text-gray-800">5樓以上</div>
                          <div className="text-brand font-semibold">+$200/樓/車趟</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 行政區說明 */}
                {activeRegion === "taipei" ? (
                  <div className="bg-secondary border border-border rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-foreground mb-2">台北行政區計費說明</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-brand mb-1">一般區域（$3,000起/車）</p>
                        <p className="text-gray-600">台北市、新北市（板橋、中和、永和、新莊、三重、蘊洲、土城、汐止等）</p>
                      </div>
                      <div>
                        <p className="font-semibold text-brand-dark mb-1">偏遠區域（另計費用）</p>
                        <p className="text-muted-foreground">新北市（淡水、三芝、石門、金山、萬里、平溪、雙溪、貢寮）、基隆、桃園等需另計</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary border border-border rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-foreground mb-2">高雄行政區計費說明</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-brand mb-1">一般區域（$4,000起/車）</p>
                        <p className="text-gray-600">高雄市區（三民、苓雅、前鎮、鼓山、楷仔、左營、鳳山、仁武、大社等）</p>
                      </div>
                      <div>
                        <p className="font-semibold text-brand-dark mb-1">偏遠區域（另計費用）</p>
                        <p className="text-muted-foreground">旗山、美濃、六龜、茂林、桃源、那瑪夏、甲仙等山區需另計</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-secondary rounded-xl p-4 mb-4">
                  <p className="text-muted-foreground text-sm text-center">
                    <Shield className="inline h-4 w-4 mr-1" />
                    每車均提供新台幣 <strong>$150萬物品責任險</strong>，以車計價每車3.49噸（200材）
                  </p>
                </div>

                <div className="text-center">
                  <Link href={activeRegion === "taipei" ? "/pricing-taipei" : "/pricing-kaohsiung"}>
                    <Button className="bg-brand hover:bg-brand-dark text-white rounded-full px-8">
                      查看完整計價說明（含加價項目）
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== FEATURED VIDEOS ===== */}
      <section className="py-10 md:py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">影音專區</h2>
            <p className="text-gray-500 text-sm md:text-lg">眾多知名 YouTuber 親身體驗創勝搬家服務</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {VIDEOS.slice(0, 4).map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-video bg-gray-200">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-white fill-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-brand font-medium mb-1">{video.channel}</p>
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{video.title}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/video">
              <Button size="lg" className="bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-full px-8 transition-all">
                查看更多影片（{VIDEOS.length}支）
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== LATEST NEWS ===== */}
      <section className="py-10 md:py-20 bg-white">
        <div className="container">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">最新消息</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {NEWS_ITEMS.slice(0, 4).map((news) => (
              <Card key={news.id} className="overflow-hidden hover:shadow-md transition-all group">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80";
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-brand/10 text-brand border-0 text-xs">{news.category}</Badge>
                    <span className="text-xs text-gray-400">{news.date}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2">{news.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/news">
              <Button size="lg" className="bg-white border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-full px-8 transition-all">
                查看所有最新消息
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== AI ESTIMATE CTA ===== */}
      <section className="py-10 md:py-20 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-4 md:mb-6">
              <Bot className="w-12 h-12 md:w-16 md:h-16 text-white/90" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">AI 智能估價</h2>
            <p className="text-base md:text-xl text-white/80 mb-6 md:mb-8">
              上傳各空間照片，AI 立即分析物品量，快速獲得初步估價
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link href="/ai-estimate">
                <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold px-8 md:px-10 py-4 text-base md:text-lg rounded-full shadow-lg w-full sm:w-auto">
                  立即 AI 估價
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/evaluate">
                <Button size="lg" className="bg-white/20 border-2 border-white text-white hover:bg-white/30 font-bold px-8 md:px-10 py-4 text-base md:text-lg rounded-full w-full sm:w-auto">
                  了解到府估價 SOP
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">聯絡我們</h2>
            <p className="text-gray-500 text-lg">隨時為您服務，歡迎透過以下方式聯繫</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Phone,
                title: "電話諮詢",
                content: BRAND.phone,
                sub: "週一至週日 09:00–21:00",
                action: `tel:${BRAND.phone}`,
                actionText: "立即撥打",
              },
              {
                icon: MessageCircle,
                title: "LINE 官方帳號",
                content: BRAND.line,
                sub: "一對一快速回覆，不囉嗦",
                action: BRAND.lineUrl,
                actionText: "加入 LINE",
              },
              {
                icon: MapPin,
                title: "服務據點",
                content: "台北 / 高雄",
                sub: "台中以北 / 彰化以南",
                action: "/contact",
                actionText: "查看地址",
              },
            ].map(({ icon: Icon, title, content, sub, action, actionText }) => (
              <Card key={title} className="bg-white border-0 shadow-md hover:shadow-lg transition-all text-center">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-brand" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-brand font-semibold mb-1">{content}</p>
                  <p className="text-gray-400 text-sm mb-4">{sub}</p>
                  <a href={action} target={action.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    <Button size="sm" className="bg-brand hover:bg-brand-dark text-white rounded-full px-6">
                      {actionText}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
