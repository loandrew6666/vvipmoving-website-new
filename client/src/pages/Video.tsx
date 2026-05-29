import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Youtube, ExternalLink } from "lucide-react";
import { BRAND, VIDEOS, IMAGES } from "@/lib/brandData";

export default function Video() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: `url(${IMAGES.heroBanner})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <Youtube className="h-12 w-12 mx-auto mb-3 text-red-500" />
            <h1 className="text-4xl md:text-5xl font-bold mb-2">影音專區</h1>
            <p className="text-xl text-gray-300">眾多知名 YouTuber 親身體驗創勝搬家服務</p>
          </div>
        </div>
      </section>

      {/* Featured Video */}
      <section className="py-12 bg-white">
        <div className="container max-w-5xl">
          <div className="text-center mb-8">
            <Badge className="bg-red-100 text-red-600 border-red-200 mb-3">創勝最新影片</Badge>
            <h2 className="text-2xl font-bold text-gray-900">趕快進來看看！</h2>
          </div>

          {/* Featured: 木曜4超玩 */}
          <div className="rounded-2xl overflow-hidden shadow-xl mb-8">
            {activeVideo === VIDEOS[0].id ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${VIDEOS[0].id}?autoplay=1`}
                  title={VIDEOS[0].title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div
                className="aspect-video relative cursor-pointer group"
                onClick={() => setActiveVideo(VIDEOS[0].id)}
              >
                <img
                  src={VIDEOS[0].thumbnail}
                  alt={VIDEOS[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="h-10 w-10 text-white fill-white ml-2" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-lg">
                  {VIDEOS[0].duration}
                </div>
              </div>
            )}
            <div className="p-6 bg-gray-50">
              <p className="text-red-600 font-medium text-sm mb-2">{VIDEOS[0].channel}</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{VIDEOS[0].title}</h3>
              <a
                href={`https://www.youtube.com/watch?v=${VIDEOS[0].id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  在 YouTube 觀看
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* All Videos Grid */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">所有影片</h2>
            <p className="text-gray-500">共 {VIDEOS.length} 支影片，持續更新中</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {VIDEOS.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div
                  className="relative aspect-video cursor-pointer"
                  onClick={() => setActiveVideo(activeVideo === video.id ? null : video.id)}
                >
                  {activeVideo === video.id ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {video.duration}
                      </div>
                    </>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-red-600 font-medium mb-1">{video.channel}</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-3">{video.title}</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    YouTube 觀看
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container text-center">
          <Youtube className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">訂閱創勝 YouTube 頻道</h2>
          <p className="text-red-100 mb-6">第一時間掌握最新搬家資訊、案例分享與優惠活動</p>
          <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 font-bold rounded-full px-8">
              <Youtube className="mr-2 h-5 w-5" />
              前往訂閱頻道
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
