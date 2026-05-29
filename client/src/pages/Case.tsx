import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CASES, IMAGES } from "@/lib/brandData";

export default function Case() {
  const [selectedCase, setSelectedCase] = useState<typeof CASES[0] | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={IMAGES.casesBanner}
          alt="案例回顧"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"; }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">案例回顧</h1>
            <p className="text-xl text-white/80">每一次搬家，都是一段精彩的故事</p>
          </div>
        </div>
      </section>

      {/* Cases Grid */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CASES.map((c) => (
              <Card
                key={c.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 shadow-md"
                onClick={() => setSelectedCase(c)}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={c.images[0]}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-brand text-white text-xs">{c.region}</Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {c.images.length} 張照片
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs border-brand/30 text-brand">{c.type}</Badge>
                    <span className="text-xs text-gray-400">{c.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{c.description}</p>
                  <div className="mt-4 text-brand text-sm font-medium">點擊查看更多 →</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedCase(null); setSelectedImg(null); }}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-brand text-white">{selectedCase.region}</Badge>
                    <Badge variant="outline" className="border-brand/30 text-brand">{selectedCase.type}</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCase.title}</h2>
                  <p className="text-gray-500 text-sm mt-1">{selectedCase.date}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  onClick={() => { setSelectedCase(null); setSelectedImg(null); }}
                >
                  ×
                </button>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {selectedCase.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImg(img)}
                  >
                    <img
                      src={img}
                      alt={`${selectedCase.title} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"; }}
                    />
                  </div>
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">{selectedCase.description}</p>

              <div className="flex gap-3">
                <Link href="/ai-estimate" onClick={() => setSelectedCase(null)}>
                  <Button className="bg-brand hover:bg-brand/90 text-white rounded-full">
                    我也要預約
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-gray-300 rounded-full"
                  onClick={() => { setSelectedCase(null); setSelectedImg(null); }}
                >
                  關閉
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="放大圖片"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold"
            onClick={() => setSelectedImg(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">您的搬家案例，下一個就是您</h2>
          <p className="text-white/80 mb-8">立即使用 AI 估價，讓創勝為您規劃完美的搬家方案</p>
          <Link href="/ai-estimate">
            <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
              立即 AI 估價
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
