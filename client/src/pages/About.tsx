import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, CheckCircle, Phone, MessageCircle, ArrowRight, Scale, FileText, Star, Heart, Users, MapPin, Mail, Clock } from "lucide-react";
import { BRAND, IMAGES, ABOUT_CONTENT } from "@/lib/brandData";

// 背景圖片（S3 永久 CDN URL）
const HERO_BG_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663363342819/TgaUgiqyGCsoKNXp.jpg";
const FAMILY_WARMTH_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663363342819/nDamrWUHOeiLzJos.jpeg";
const LAWYER_BG_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663363342819/xPhktJsnhtfCBjNa.jpg";

// 關於我們頁面真實照片（來自原網站 /about 頁面）
const ABOUT_PHOTOS = [
  {
    src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663363342819/StByaOaKxtbMOoPA.jpeg",
    alt: "創勝包裝全員路跨活動合照",
  },
  {
    src: "https://static.wixstatic.com/media/605461_c12f666b819d40beaf5ad1f1505ed519~mv2.jpg/v1/fill/w_500,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/605461_c12f666b819d40beaf5ad1f1505ed519~mv2.jpg",
    alt: "貨運會員證書",
  },
  {
    src: "https://static.wixstatic.com/media/605461_2e5c4e1c2c1440c6a862e4211ae6db85~mv2.jpg/v1/fill/w_500,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/605461_2e5c4e1c2c1440c6a862e4211ae6db85~mv2.jpg",
    alt: "法律顧問證書",
  },
  {
    src: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663363342819/UxcbVKrTdHwdSVEy.jpeg",
    alt: "創勝包裝尾牙活動合照",
  },
];

// 法律顧問證書圖片
const LEGAL_CERT_IMAGES = [
  {
    src: "https://static.wixstatic.com/media/605461_c12f666b819d40beaf5ad1f1505ed519~mv2.jpg/v1/fill/w_400,h_600,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%E8%B2%A8%E9%81%8B%E6%9C%83%E5%93%A1%E8%AD%89%E6%9B%B8.jpg",
    alt: "貨運會員證書（北市貨運商證字第336號）",
    label: "貨運會員證書",
  },
  {
    src: "https://static.wixstatic.com/media/605461_2e5c4e1c2c1440c6a862e4211ae6db85~mv2.jpg/v1/fill/w_400,h_600,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/a1.jpg",
    alt: "法律顧問證書（大恆國際法律事務所林柏裕律師）",
    label: "法律顧問證書",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner - 溫馨家庭背景圖 */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('${HERO_BG_IMG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-brand/90 text-white border-0 text-sm px-4 py-1.5">
            創立於 2016 年
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            關於<span className="text-brand">創勝</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 font-light">
            創勝包裝 — 豈止於服務
          </p>
          <p className="text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            十年來，我們用職人精神守護每一個家庭的搬遷旅程，
            讓每一次新開始都充滿溫度與安心。
          </p>
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { num: "10+", label: "年搬家經驗" },
              { num: "10,000+", label: "戶搬遷服務" },
              { num: "4.2", label: "Google 評分" },
              { num: "$150萬", label: "物品責任險" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-brand">{stat.num}</div>
                <div className="text-sm text-white/80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story - 溫馨家庭照片 */}
      <section className="py-20 bg-secondary">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <Badge className="mb-4 bg-brand/10 text-brand border-0">我們的故事</Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{ABOUT_CONTENT.title}</h2>
              <p className="text-brand text-xl font-semibold mb-6">{ABOUT_CONTENT.subtitle}</p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                創勝包裝成立於台灣，致力於提供高端精緻的搬家體驗。我們相信搬家不只是移動物品，
                更是幫助您把美好的生活帶到新的空間。從打包、搬運到歸位，每一個環節都由專業師傅親手完成，
                讓您的搬家過程從容優雅，如同欣賞藝術創作般的氣質時尚。
              </p>
              <div className="flex gap-4">
                <Link href="/services">
                  <Button className="bg-brand hover:bg-brand/90 text-white">了解我們的服務</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="border-brand text-brand hover:bg-brand/5">立即聯絡</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={FAMILY_WARMTH_IMG}
                  alt="家庭搬遷溫馨場景"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-5 max-w-[200px]">
                <div className="flex mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 font-medium">「師傅們非常專業，搬完後連一個杯子都沒有破！」</p>
                <p className="text-xs text-gray-400 mt-2">— Google 評論</p>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ABOUT_PHOTOS.map((photo, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md aspect-square">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.style.background = "linear-gradient(135deg, #FFF3E0, #FFE0B2)";
                    target.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>

          {/* 5 Principles */}
          <div className="space-y-6">
            {ABOUT_CONTENT.principles.map((principle) => (
              <Card key={principle.number} className="border-l-4 border-l-brand shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {principle.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{principle.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{principle.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Guarantee - 全版律師背景圖 */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          backgroundImage: `url('${LAWYER_BG_IMG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/92 via-gray-900/80 to-gray-900/55" />
        <div className="container max-w-5xl relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-white/20 text-brand-light border border-white/30 text-sm px-4 py-1.5">
              <Scale className="w-4 h-4 inline mr-2" />
              法律保障
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {ABOUT_CONTENT.legalGuarantee.title}
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed max-w-2xl">
              {ABOUT_CONTENT.legalGuarantee.description}
            </p>

            {/* 三項保障 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {ABOUT_CONTENT.legalGuarantee.items.map((item) => (
                <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <FileText className="w-8 h-8 text-brand-light mb-3" />
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>

            {/* 證書展示區 */}
            <div className="mt-8">
              <h3 className="text-white/90 text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-brand-light" />
                官方證明文件
              </h3>
              <div className="grid grid-cols-2 gap-6 max-w-md">
                {LEGAL_CERT_IMAGES.map((cert, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/25 hover:border-brand-light/50 transition-all group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-3">
                      <img
                        src={cert.src}
                        alt={cert.alt}
                        className="w-full h-52 object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.parentElement!.style.background = "#f3f4f6";
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <p className="text-brand-light text-sm font-semibold text-center">{(cert as any).label}</p>
                    <p className="text-white/60 text-xs text-center mt-1 leading-relaxed">{cert.alt}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-white font-semibold text-lg mb-2">{ABOUT_CONTENT.legalGuarantee.conclusion}</p>
                <p className="text-white/60 text-sm leading-relaxed">
                  創勝持有合法貨運業執照及公司登記，所有業務均依法規範運作，讓您搞得安心、搞得放心。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <div className="bg-gradient-to-r from-brand-dark to-brand rounded-2xl p-8 text-white text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">每車 $150萬物品責任險</h2>
            <p className="text-white/80 text-lg mb-6">
              創勝每車均提供新台幣150萬物品責任險。
              若有物品損壞，將由保險公司及第三方公正單位作賠償，公正公開處理相關事宜。
              搬家完畢後3天內告知即可申請理賠。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  LINE 諮詢
                </Button>
              </a>
              <a href={`tel:${BRAND.phone}`}>
                <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-brand font-bold rounded-full px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  {BRAND.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">創勝的承諾</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "恕不承接純搬運服務，所有物品含傢俱家電皆使用加強型防護",
              "費用皆採實報實銷，以實際現場執行為主，不浮報費用",
              "搬家前簽訂客製化契約，保障雙方權益",
              "完工後廢棄包材及垃圾一併免費收走",
              "提供售後服務，完工後持續關心確保您滿意",
              "不衝量只重品質，每一個案件都全力以赴",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                <CheckCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">聯絡資訊</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-brand/20 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold">北</div>
                  <h3 className="text-xl font-bold text-gray-900">台北據點</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.addresses.taipei}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.phone}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.mobile}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.email}</p>
                  <p className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-brand flex-shrink-0" />LINE: {BRAND.line}</p>
                  <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand flex-shrink-0" />營業時間：09:00 - 21:00（每日）</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-brand-dark/20 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center text-white font-bold">南</div>
                  <h3 className="text-xl font-bold text-gray-900">高雄據點</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.addresses.kaohsiung}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.phone}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.mobile}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand flex-shrink-0" />{BRAND.email}</p>
                  <p className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-brand flex-shrink-0" />LINE: {BRAND.line}</p>
                  <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand flex-shrink-0" />營業時間：09:00 - 21:00（每日）</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">讓創勝成為您搬家的最佳夥伴</h2>
          <p className="text-white/80 mb-8">立即聯繫我們，開始規劃您的搬家方案</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/ai-estimate">
              <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
                AI 智能估價
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-brand rounded-full px-8">
                聯絡我們
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
