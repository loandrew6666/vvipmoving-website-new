import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function NewsDetail() {
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-3xl">
        <Link href="/news"><Button variant="ghost" className="gap-2 mb-6 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" />返回最新消息</Button></Link>
        <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">搬家知識</Badge>
        <h1 className="text-3xl font-black text-foreground mb-3">搬家前必做的 10 件事，讓搬家更順利</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8"><Calendar className="w-4 h-4" />2025-11-20</div>
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed space-y-4">
          <p>搬家是人生中的重要里程碑，充分的準備可以讓整個過程更加順利。以下整理了搬家前必做的 10 件事，幫助您做好萬全準備。</p>
          <h2 className="text-xl font-bold mt-6">1. 提前 2-4 週開始規劃</h2>
          <p>搬家不是一蹴可幾的事，建議提前 2-4 週開始規劃。這段時間可以用來整理物品、聯繫搬家公司、確認新居狀況。</p>
          <h2 className="text-xl font-bold mt-6">2. 清點並整理不需要的物品</h2>
          <p>搬家前是清理家中雜物的好時機。將不需要的物品分類：捐贈、二手販售、或丟棄。減少搬運量不只省錢，也讓新家更整潔。</p>
          <h2 className="text-xl font-bold mt-6">3. 使用 AI 估價獲得初步報價</h2>
          <p>透過創勝搬家的 AI 智能估價功能，上傳房間照片即可獲得初步估價，幫助您提前規劃預算。</p>
          <h2 className="text-xl font-bold mt-6">4. 預約到府估價</h2>
          <p>AI 估價後，建議預約免費到府估價，讓專員確認實際搬運條件，提供精確報價。</p>
          <h2 className="text-xl font-bold mt-6">5. 確認新居狀況</h2>
          <p>提前確認新居的電梯尺寸、門框寬度、停車位置等，避免搬家當天出現意外。</p>
        </div>
        <div className="mt-10 pt-6 border-t border-border">
          <Link href="/ai-estimate"><Button className="bg-primary hover:bg-primary/90 text-white">立即 AI 智能估價</Button></Link>
        </div>
      </div>
    </div>
  );
}
