import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  Bot,
  ArrowRight,
  Sparkles,
  Star,
} from "lucide-react";
import { BRAND } from "@/lib/brandData";

export default function Contact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<"taipei" | "kaohsiung">("taipei");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const contactMutation = trpc.contact.submit.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("請填寫姓名與電話");
      return;
    }
    try {
      await contactMutation.mutateAsync({ name, phone, email: email || undefined, region, message: message || undefined });
      setSubmitted(true);
      toast.success("訊息已送出！我們將盡快與您聯繫。");
    } catch {
      toast.error("送出失敗，請稍後再試或直接致電。");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-secondary via-background to-white">
        <div className="container">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">聯絡我們</Badge>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            開始您的搬家之旅
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            有任何搬家問題，歡迎透過以下方式聯繫我們。建議先使用 AI 估價，快速了解費用範圍。
          </p>
        </div>
      </section>

      {/* AI 估價優先 CTA */}
      <section className="py-12 bg-gradient-to-r from-brand-dark to-brand">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-90">推薦方式</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-2">
                先用 AI 估價，再決定是否預約
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-lg">
                只需填寫搬家資訊，AI 立即分析費用範圍，免等待、免電話，3 分鐘了解搬家費用。
              </p>
              <div className="flex items-center gap-4 mt-3">
                {["即時報價", "免費使用", "無需登入"].map((tag) => (
                  <div key={tag} className="flex items-center gap-1 text-sm text-white/80">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link href="/ai-estimate">
                <Button
                  size="lg"
                  className="bg-white text-brand hover:bg-secondary font-bold text-base px-8 py-6 rounded-2xl shadow-lg gap-2"
                >
                  <Bot className="w-5 h-5" />
                  立即 AI 估價
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-white/70 text-xs text-center mt-2">平均 3 分鐘完成估價</p>
            </div>
          </div>
        </div>
      </section>

      {/* 快速聯絡方式 */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="container">
          <h2 className="text-xl font-bold text-center text-gray-700 mb-8">
            或選擇以下方式直接聯絡
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* 電話 */}
            <a
              href={`tel:${BRAND.phone}`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 hover:border-brand/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                <Phone className="w-5 h-5 text-brand group-hover:text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{BRAND.phone}</div>
                <div className="text-xs text-gray-500 mt-0.5">台北服務專線</div>
              </div>
            </a>

            {/* LINE */}
            <a
              href={BRAND.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 hover:border-brand/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-brand transition-colors">
                <MessageCircle className="w-5 h-5 text-brand group-hover:text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">LINE 即時詢問</div>
                <div className="text-xs text-gray-500 mt-0.5">{BRAND.line}</div>
              </div>
            </a>

            {/* 高雄電話 */}
            <a
              href={`tel:${BRAND.mobile}`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 hover:border-brand/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-brand transition-colors">
                <Phone className="w-5 h-5 text-brand group-hover:text-white" />
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{BRAND.mobile}</div>
                <div className="text-xs text-gray-500 mt-0.5">高雄服務專線</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 聯絡表單 + 地址 */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 表單 */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-black text-foreground">傳送訊息</h2>
                <Badge variant="outline" className="text-xs text-gray-500">或選擇此方式</Badge>
              </div>

              {submitted ? (
                <div className="text-center py-16 bg-secondary rounded-2xl border border-border">
                  <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-brand" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">訊息已送出！</h2>
                  <p className="text-muted-foreground mb-6">我們將在 24 小時內與您聯繫。</p>
                  <Link href="/ai-estimate">
                    <Button className="bg-primary text-white gap-2">
                      <Bot className="w-4 h-4" />
                      同時使用 AI 估價
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold mb-1.5 block">姓名 *</Label>
                      <Input
                        placeholder="您的姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="font-semibold mb-1.5 block">電話 *</Label>
                      <Input
                        placeholder="09xx-xxx-xxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold mb-1.5 block">Email（選填）</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold mb-1.5 block">服務區域</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: "taipei", l: "台北（台中以北）" },
                        { v: "kaohsiung", l: "高雄（彰化以南）" },
                      ].map((r) => (
                        <button
                          type="button"
                          key={r.v}
                          onClick={() => setRegion(r.v as "taipei" | "kaohsiung")}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            region === r.v
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-white text-foreground"
                          }`}
                        >
                          {r.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold mb-1.5 block">訊息內容</Label>
                    <Textarea
                      placeholder="請描述您的搬家需求，例如：搬家日期、地點、物品概況..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        送出中...
                      </>
                    ) : (
                      "送出訊息"
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    想要更快得到報價？
                    <Link href="/ai-estimate" className="text-primary font-medium ml-1">
                      使用 AI 估價 →
                    </Link>
                  </p>
                </form>
              )}
            </div>

            {/* 地址資訊 */}
            <div className="space-y-4">
              <Card className="border-border overflow-hidden">
                <div className="bg-gradient-to-r from-brand-dark to-brand px-6 py-3">
                  <h3 className="font-bold text-white text-sm">台北服務據點</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <a href={`tel:${BRAND.phone}`} className="font-semibold text-brand">
                          {BRAND.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <a
                          href={BRAND.lineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-green-600"
                        >
                          LINE {BRAND.line}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">{BRAND.addresses.taipei}</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">週一至週六 09:00–18:00</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
                  <h3 className="font-bold text-white text-sm">高雄服務據點</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <a href={`tel:${BRAND.mobile}`} className="font-semibold text-blue-600">
                          {BRAND.mobile}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <a
                          href={BRAND.lineUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-green-600"
                        >
                          LINE {BRAND.line}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">{BRAND.addresses.kaohsiung}</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-muted-foreground">週一至週六 09:00–18:00</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google 評價 */}
              <Card className="border-border bg-secondary">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">4.9 / 5</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    「師傅非常專業，打包細心，搬家過程零損壞，強烈推薦！」
                  </p>
                  <p className="text-xs text-gray-400 mt-2">— Google 評論</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
