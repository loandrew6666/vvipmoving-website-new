import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NEWS_ITEMS, IMAGES } from "@/lib/brandData";

const CATEGORIES = ["全部", "公告", "分享", "活動"];

export default function News() {
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = activeCategory === "全部"
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter((n) => n.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-40 md:h-80 overflow-hidden">
        <img
          src={IMAGES.newsBanner}
          alt="最新消息"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"; }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-5xl font-bold mb-1 md:mb-3">最新消息</h1>
            <p className="text-sm md:text-xl text-white/80">創勝最新動態與分享</p>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-4 md:py-8 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container">
          <div className="flex gap-2 md:gap-3 justify-center overflow-x-auto pb-1 scrollbar-none" style={{scrollbarWidth:'none'}}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-none px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-brand text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-secondary hover:text-brand"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-4 md:py-12 bg-gray-50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filtered.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-0 shadow-sm cursor-pointer">
                <div className="relative h-28 md:h-44 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <Badge className={`text-xs px-1.5 py-0.5 ${
                      item.category === "公告" ? "bg-brand text-white" :
                      item.category === "活動" ? "bg-green-600 text-white" :
                      "bg-blue-600 text-white"
                    }`}>
                      {item.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-2.5 md:p-4">
                  <p className="text-xs text-gray-400 mb-1">{item.date}</p>
                  <h3 className="text-xs md:text-sm font-semibold text-gray-800 leading-relaxed line-clamp-2">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
