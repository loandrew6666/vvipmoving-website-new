import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Phone, MessageCircle, Bot, Clock, MapPin, Camera, FileText, Truck, AlertTriangle } from "lucide-react";
import { EVALUATE_SOP, BRAND } from "@/lib/brandData";

const STEP_ICONS = [Phone, MapPin, FileText, CheckCircle, Truck, MapPin, CheckCircle, Camera];

const photoTips = [
  { title: "說明格局", desc: "先說明房子格局：例三房兩廳兩衛" },
  { title: "對角線拍攝", desc: "每個空間以對角線呈現完整面貌，同時說明需要搬遷的大型傢俱" },
  { title: "打開拍攝", desc: "櫃體及抽屜請打開拍攝，讓估價師估算物品量及所需包材" },
];

export default function Evaluate() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-secondary to-background">
        <div className="container">
          <Badge className="bg-brand/10 text-brand border-brand/20 mb-4">{EVALUATE_SOP.title}</Badge>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">到府估價 SOP</h1>
          <p className="text-gray-500 text-lg max-w-2xl">{EVALUATE_SOP.subtitle}</p>
          <div className="flex gap-3 mt-6">
            <Link href="/ai-estimate"><Button className="bg-brand hover:bg-brand-dark text-white gap-2 px-6 py-3 text-lg"><Bot className="w-5 h-5" />AI 智能估價</Button></Link>
          </div>
        </div>
      </section>

      {/* SOP Steps */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">服務流程</h2>
          <div className="space-y-6">
            {EVALUATE_SOP.steps.map((s, i) => {
              const Icon = STEP_ICONS[i] || CheckCircle;
              return (
                <div key={s.step} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-black text-lg flex-shrink-0">{s.step}</div>
                    {i < EVALUATE_SOP.steps.length - 1 && <div className="w-0.5 h-full bg-brand/20 mt-2" />}
                  </div>
                  <Card className="flex-1 border-border mb-2">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Icon className="w-4 h-4 text-brand" /></div>
                        <h3 className="font-black text-lg text-gray-900">{s.title}</h3>
                      </div>
                      <p className="text-gray-500 text-sm">{s.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Photo Guide */}
      <section className="py-16 bg-secondary">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{EVALUATE_SOP.photoGuide.title}</h2>
          <p className="text-gray-500 text-center mb-8">{EVALUATE_SOP.subtitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {photoTips.map((tip) => (
              <Card key={tip.title} className="border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mx-auto mb-3"><Camera className="w-5 h-5 text-brand" /></div>
                  <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-500 text-sm">{tip.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border bg-secondary">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand" />
                {EVALUATE_SOP.photoGuide.title}
              </h3>
              <ul className="space-y-3">
                {EVALUATE_SOP.photoGuide.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Special Notice */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          <Card className="border-border bg-secondary">
            <CardContent className="p-6">
              <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {EVALUATE_SOP.specialNotice.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EVALUATE_SOP.specialNotice.items.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="text-brand font-bold flex-shrink-0">▶</span>
                    <span className="text-muted-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center">
          <Clock className="w-10 h-10 text-white/80 mx-auto mb-3" />
          <h3 className="text-2xl font-bold mb-2">到府估價完全免費</h3>
          <p className="text-white/80 mb-6">不論最終是否委託，到府估價不收取任何費用。</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`tel:${BRAND.phone}`}><Button className="bg-white text-brand hover:bg-secondary font-bold gap-2"><Phone className="w-4 h-4" />台北 {BRAND.phone}</Button></a>
            <a href={`tel:${BRAND.mobile}`}><Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand font-bold gap-2"><Phone className="w-4 h-4" />高雄 {BRAND.mobile}</Button></a>
            <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer"><Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand font-bold gap-2"><MessageCircle className="w-4 h-4" />LINE 預約</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
