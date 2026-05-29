import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageCircle, Phone } from "lucide-react";
import { BRAND, FAQ_DATA } from "@/lib/brandData";

export default function Faq() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-secondary to-background">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">常見問題</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            整理了客戶最常詢問的問題，希望能幫助您更了解創勝的服務
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl">
          {FAQ_DATA.map((category) => (
            <div key={category.category} className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-brand/30">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.items.map((item, idx) => {
                  const key = `${category.category}-${idx}`;
                  const isOpen = openItems[key];
                  return (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:border-brand/40 transition-colors"
                    >
                      <button
                        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-secondary transition-colors"
                        onClick={() => toggleItem(key)}
                      >
                        <span className="font-semibold text-gray-800 pr-4">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-brand flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 bg-secondary/50 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed pt-4 whitespace-pre-line">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 bg-gradient-to-r from-brand-dark to-brand text-white">
        <div className="container text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">還有其他問題？</h2>
          <p className="text-white/80 mb-8">
            歡迎透過 LINE 或電話直接聯繫我們的客服，我們會一對一為您解答，不囉嗦！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={BRAND.lineUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-brand hover:bg-secondary font-bold rounded-full px-8">
                <MessageCircle className="mr-2 h-5 w-5" />
                LINE 立即諮詢
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
      </section>
    </div>
  );
}
