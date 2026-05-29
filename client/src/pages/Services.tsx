import React, { useState } from "react";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, MessageCircle, ChevronDown, ChevronUp, HelpCircle, Truck, ClipboardList, Package, Warehouse, Box, Calculator } from "lucide-react";
import { BRAND, SERVICE_TYPES, IMAGES } from "@/lib/brandData";

// FAQ 展開元件
function FaqItem({ category, q, a }: { category: string; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        open ? "border-brand/40 shadow-md" : "border-gray-200 hover:border-brand/30"
      }`}
      onClick={() => setOpen(!open)}
    >
      <div className={`flex items-center justify-between p-5 ${
        open ? "bg-secondary" : "bg-white"
      }`}>
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xs font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">{category}</span>
          <p className="font-medium text-gray-900 text-sm leading-relaxed">{q}</p>
        </div>
        <div className={`ml-4 flex-shrink-0 transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}>
          <ChevronDown className="h-5 w-5 text-brand" />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-5 bg-secondary border-t border-border">
          <p className="text-gray-600 text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const [expandedService, setExpandedService] = useState<string | null>("premium");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={IMAGES.servicesBanner}
          alt="服務項目"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"; }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">服務項目</h1>
            <p className="text-xl text-white/80">創勝提供全方位精致搬家服務</p>
          </div>
        </div>
      </section>

      {/* Service Types - Card Grid */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img
                src="https://static.wixstatic.com/media/605461_4018b61c1b3f4fb597a2e5b9c4290cc6~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/605461_4018b61c1b3f4fb597a2e5b9c4290cc6~mv2.png"
                alt="icon"
                className="w-10 h-10"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">服務種類</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              無論您是一般住宅搬家、企業辦公室遷移，還是需要特殊物品搬運，創勝都能提供最專業的服務
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICE_TYPES.map((service) => (
              <Card
                key={service.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md cursor-pointer"
                onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.style.background = "linear-gradient(135deg, #FFF3E0, #FFE0B2)";
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="#F97316" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg></div>`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg leading-tight">{service.name}</h3>
                      {service.highlight && (
                        <Badge className="bg-brand text-white text-xs">{service.highlight}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{service.description}</p>

                  {/* Expandable Details */}
                  {expandedService === service.id && (
                    <ul className="space-y-2 mb-4 border-t pt-3">
                      {service.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      className="text-brand text-sm font-medium flex items-center gap-1 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedService(expandedService === service.id ? null : service.id);
                      }}
                    >
                      {expandedService === service.id ? (
                        <>收起 <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>了解更多 <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                    <Link href="/ai-estimate" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" className="bg-brand hover:bg-brand/90 text-white rounded-full text-xs px-4">
                        立即估價
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-services Navigation */}
      <section className="py-12 bg-gradient-to-br from-secondary to-background">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">更多服務項目</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "服務種類", href: "/services", Icon: Truck },
              { label: "到府估僷", href: "/evaluate", Icon: ClipboardList },
              { label: "特殊搬運", href: "/services#special", Icon: Package },
              { label: "倉儲服務", href: "/services#storage", Icon: Warehouse },
              { label: "包材介紹", href: "/packaging", Icon: Box },
              { label: "計僷方式", href: "/pricing/taipei", Icon: Calculator },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-2">
                    <item.Icon className="h-5 w-5 text-brand" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">創勝服務包含什麼？</h2>
            <p className="text-gray-500">所有服務均採用最高標準包裝材料，確保物品安全</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "全程使用加強型防護包裝（氣泡布、棉被、木板）",
              "傢俱家電全部拆解、包裝、重新組裝",
              "完工後廢棄包材及垃圾一併免費收走",
              "每車提供新台幣150萬物品責任險",
              "搬家前簽訂客製化契約保障雙方權益",
              "提供售後服務，完工後持續關心",
              "費用採實報實銷，不浮報費用",
              "市面上所有 DIY 組裝家具全都難不倒我們",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-secondary rounded-xl">
                <CheckCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">服務地區</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-brand/30 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold">北</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">台北服務區</h3>
                    <p className="text-sm text-gray-500">台中以北地區</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  服務範圍：台北市、新北市、桃園市、新竹縣市、苗栗縣、台中市（部分）
                </p>
                <a href={BRAND.bookingUrls.taipei} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white rounded-full">
                    台北預約
                  </Button>
                </a>
              </CardContent>
            </Card>
            <Card className="border-brand-dark/30 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center text-white font-bold">南</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">高雄服務區</h3>
                    <p className="text-sm text-gray-500">彰化以南地區</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  服務範圍：高雄市、台南市、嘉義縣市、雲林縣、彰化縣（部分）
                </p>
                <a href={BRAND.bookingUrls.kaohsiung} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white rounded-full">
                    高雄預約
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="h-8 w-8 text-brand" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">常見問題</h2>
            <p className="text-gray-500">搬家前最常被問到的問題，我們一次解答</p>
          </div>

          <div className="space-y-3">
            {[
              {
                category: "服務說明",
                q: "什麼是精緻搬家打包服務？我有需要自備包材或是準備什麼嗎？",
                a: "精緻搬家打包 ＝ 免動手搬家 ＝ 懶人搬家 ＝ 無痛搬家。就是什麼都不用準備，預約好等待搬家即可！創勝提供全套包材與人力，您只需要在搬家當天等待師傅到府服務。"
              },
              {
                category: "如何選擇",
                q: "我應該如何選擇合適的搬家公司或搬家服務？",
                a: "看是要擇優還是價低，都有不同的考量條件與評估。最主要也是要看能不能處理客戶所有的問題！創勝提供到府估價、合約保障、物品責任險，讓您選擇有保障的搬家服務。"
              },
              {
                category: "計僷方式",
                q: "市面上大多以箱計價，跟創勝的以車計價的差別在哪裡？",
                a: "以『箱』計價像是單點式餐食，總合起來價格比較高。以『車』計價像是精緻型的吃到飽，什麼服務都包！搞懂車子材積與大小即可。創勝採以車計價，讓您一次搞定所有費用，不用擔心額外加收。"
              },
              {
                category: "預約時間",
                q: "請問我需要多久之前預約搬家服務呢？",
                a: "建議 4~6 週前預約，且需要『先估價』才能預約搬家日期！旺季（農曆年前後、暑假）建議提前 2 個月以上預約，以確保您想要的日期。"
              },
              {
                category: "物品評估",
                q: "我應該如何評估我的物品數量和大小，以確定搬家所需的車輛和工作人員數量？",
                a: "估價師在報價的時候都會說明，以車計價就是以物品或家具的材積計算，工作人員人數也是由公司直接指派！您不需要自行計算，交給專業估價師評估即可。"
              },
              {
                category: "估僷方式",
                q: "你們怎麼估價，是線上估價還是現場估價的？",
                a: "現場與線上都可以估價，都是由經驗豐富的估價師團隊報價！您可以選擇 AI 線上快速估價，或預約估價師到府評估，兩種方式都能提供準確的報價。"
              },
            ].map((faq, i) => (
              <FaqItem key={i} category={faq.category} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 mb-4">還有其他問題？</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/faq">
                <Button variant="outline" className="border-brand text-brand hover:bg-brand/5 rounded-full">
                  查看完整常見問題
                </Button>
              </Link>
              <a href="https://line.me/R/ti/p/@vvipmoving" target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  LINE 直接詢問
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">不知道選哪個服務？</h2>
          <p className="text-white/80 mb-8">使用 AI 智能估價，輸入您的搬家需求，我們幫您規劃最適合的方案</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-estimate">
              <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
                AI 智能估價
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-brand font-bold rounded-full px-8">
                <MessageCircle className="mr-2 h-5 w-5" />
                LINE 詢問
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
