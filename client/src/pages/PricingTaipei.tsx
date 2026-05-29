import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageCircle, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { BRAND, PRICING_TAIPEI } from "@/lib/brandData";

export default function PricingTaipei() {
  const p = PRICING_TAIPEI;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-secondary to-background">
        <div className="container text-center">
          <Badge className="bg-brand text-white mb-4 px-4 py-1">台北地區</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{p.title}</h1>
          <p className="text-brand font-bold text-xl mb-2">{p.formula}</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container max-w-4xl">

          {/* Highlights */}
          <Card className="mb-8 border-brand/20 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-brand" />
                <h2 className="text-xl font-bold text-gray-900">重要說明</h2>
              </div>
              <ul className="space-y-3">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Ton Conversion */}
          <Card className="mb-8 bg-secondary border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">◆ {p.tonConversion.title}</h2>
              <p className="text-brand font-semibold mb-2">1車 = 3.49噸 = 200材</p>
              <ul className="space-y-2">
                {p.tonConversion.items.map((item) => (
                  <li key={item} className="text-gray-700 flex items-center gap-2">
                    <span className="text-brand">◆</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card className="mb-8 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-brand mb-2">{p.transport.title}</h2>
              <p className="text-gray-600 mb-4">= {p.transport.formula}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {p.transport.prices.map((price) => (
                  <div key={price.route} className="bg-secondary rounded-xl p-4 text-center border border-border">
                    <div className="text-sm text-gray-600 mb-1">{price.route}</div>
                    <div className="text-2xl font-bold text-brand">{price.price}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{p.transport.note}</p>
              </div>
            </CardContent>
          </Card>

          {/* Packing */}
          <Card className="mb-8 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-brand mb-2">{p.packing.title}</h2>
              <div className="text-3xl font-bold text-gray-900 mb-4">{p.packing.price}</div>
              <h3 className="font-semibold text-gray-700 mb-3">◆ 打包項目</h3>
              <ul className="space-y-2">
                {p.packing.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-brand font-bold">{idx + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Placement */}
          <Card className="mb-8 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-brand mb-2">{p.placement.title}</h2>
              <div className="text-3xl font-bold text-gray-900 mb-4">{p.placement.price}</div>
              <h3 className="font-semibold text-gray-700 mb-3">◆ 上架項目</h3>
              <ul className="space-y-2">
                {p.placement.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-brand font-bold">{idx + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Vehicle Types */}
          <Card className="mb-8 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-brand mb-2">{p.vehicleTypes.title}</h2>
              <p className="text-gray-500 text-sm mb-4">{p.vehicleTypes.note}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="p-3 text-left font-semibold text-gray-700">噸數</th>
                      <th className="p-3 text-center font-semibold text-gray-700">計算車數</th>
                      <th className="p-3 text-center font-semibold text-gray-700">容積</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.vehicleTypes.types.map((type, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-3 font-medium text-brand">{type.tonnage}</td>
                        <td className="p-3 text-center text-gray-700">{type.cars}</td>
                        <td className="p-3 text-center text-gray-700">{type.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Special Items */}
          <Card className="mb-8 border-red-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">{p.specialItems.title}</h2>
              </div>
              <ul className="space-y-3">
                {p.specialItems.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <span className="text-red-500 font-bold">{idx + 1}.</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Damage Policy */}
          <div className="bg-blue-50 rounded-xl p-4 mb-8 flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm">◇ {p.damagePolicy}</p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-brand-dark to-brand rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">台北地區立即預約</h2>
            <p className="text-white/80 mb-6">台中以北地區，歡迎透過 LINE 或電話預約估價</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={BRAND.bookingUrls.taipei} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  台北預約（台中以北）
                </Button>
              </a>
              <a href={`tel:${BRAND.phone}`}>
                <Button size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-brand font-bold rounded-full px-8">
                  <Phone className="mr-2 h-5 w-5" />
                  {BRAND.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
