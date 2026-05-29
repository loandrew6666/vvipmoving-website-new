import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Package, Leaf, ArrowRight, RefreshCw, Sprout, Shield } from "lucide-react";
import { BRAND, PACKAGING_MATERIALS, IMAGES } from "@/lib/brandData";

export default function Packaging() {
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  const categories = ["全部", "環保包材", "一般包材"];

  const filtered = activeCategory === "全部"
    ? PACKAGING_MATERIALS
    : PACKAGING_MATERIALS.filter((m) => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-40 md:h-80 overflow-hidden">
        <img
          src="https://static.wixstatic.com/media/605461_2d71f74e54524d55b235796a8adb0e69~mv2.jpg/v1/fill/w_1265,h_380,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/605461_2d71f74e54524d55b235796a8adb0e69~mv2.jpg"
          alt="包材介紹"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"; }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-5xl font-bold mb-1 md:mb-3">包材介紹</h1>
            <p className="text-sm md:text-xl text-white/80">搬家用環保包材，保護您的每一件珍貴物品</p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-5 md:py-12 bg-secondary">
        <div className="container max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-6 w-6 text-brand" />
            <h2 className="text-2xl font-bold text-gray-900">搬家用環保包材</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            我們使用許多可重複利用的保護工具，減少一次性垃圾，傢俱有保障，也為永續發展盡一份心力，為地球減少負擔。
          </p>
          <div className="bg-brand/10 border border-brand/30 rounded-xl p-4 text-sm text-brand-dark text-left">
            <p className="font-semibold mb-2">⚠️ 重要說明：</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>尺寸大小皆以公分（CM）表示（長×寬×高）</li>
              <li>因應原物料上漲，包裝材料僅提供創勝客戶購買，恕不對外販售</li>
              <li>環保包材屬搬家基礎保護配備，不包含額外使用氣泡/瓦楞/土報紙等加強防護</li>
              <li>創勝包裝為了保護您的傢俱及家電，搬家除了基礎保護外，皆會另外使用加強防護</li>
              <li>若搬運過程中有所損傷，我們有保險公司搭配第三方公正單位，將會根據物品價值做損害賠償</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-3 md:py-8 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-brand text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Materials Grid */}
      <section className="py-4 md:py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filtered.map((material) => (
              <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-secondary to-background">
                  {(material as any).image ? (
                    <img
                      src={(material as any).image}
                      alt={material.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center text-6xl';
                          fallback.textContent = material.icon;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{material.icon}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3 md:p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{material.name}</h3>
                    <Badge
                      variant="secondary"
                      className="text-xs ml-2 flex-shrink-0 bg-brand/10 text-brand"
                    >
                      {material.category === "環保包材" ? "環保" : "一般"}
                    </Badge>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">{material.description}</p>

                  {material.sizes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">尺寸規格：</p>
                      <ul className="space-y-0.5">
                        {material.sizes.map((size, i) => (
                          <li key={i} className="text-xs text-gray-500">• {size}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">售價</p>
                    <p className="text-brand font-semibold text-sm">{material.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Eco Commitment */}
      <section className="py-16 bg-gradient-to-br from-secondary to-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <Leaf className="h-10 w-10 text-brand mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">環保承諾</h2>
            <p className="text-gray-600">創勝不惜成本為地球盡一份心力，特別請工廠量身打造可以不斷回收再利用的環保包材</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: RefreshCw,
                title: "可重複利用",
                desc: "環保型塑魔笱（紅笱）可無限次回收再利用，大幅減少一次性垃圾",
              },
              {
                Icon: Sprout,
                title: "永續發展",
                desc: "選用環保材質包材，在保護您物品的同時，也為地球環境盡一份心力",
              },
              {
                Icon: Shield,
                title: "保險保障",
                desc: "搬運過程若有損傷，保險公司搦配第三方公正單位，根據物品價値做損害賠償",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.Icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-white/80" />
          <h2 className="text-3xl font-bold mb-4">需要購買包材或詢問搬家服務？</h2>
          <p className="text-white/80 mb-8">包裝材料僅提供創勝客戶購買，歡迎聯絡我們了解更多</p>
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
