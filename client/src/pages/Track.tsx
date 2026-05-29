import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Search, Loader2, CheckCircle, Clock, Phone, MessageCircle, AlertTriangle,
  MapPin, Home, Calendar, Bot, Camera, FileText, User, ChevronDown, ChevronUp,
  Download, Film, Archive, Image, File, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  new:        { label: "新進案件", color: "bg-blue-100 text-blue-700",     step: 1 },
  pending:    { label: "待聯繫",   color: "bg-amber-100 text-amber-700",   step: 2 },
  quoted:     { label: "已報價",   color: "bg-purple-100 text-purple-700", step: 3 },
  contracted: { label: "已簽約",   color: "bg-indigo-100 text-indigo-700", step: 4 },
  scheduled:  { label: "待執行",   color: "bg-primary/10 text-primary",    step: 5 },
  completed:  { label: "已完成",   color: "bg-green-100 text-green-700",   step: 6 },
  archived:   { label: "已封存",   color: "bg-gray-100 text-gray-700",     step: 0 },
};

const PROGRESS_STEPS = ["新進案件", "待聯繫", "已報價", "已簽約", "待執行", "已完成"];

interface AiResult {
  priceRange?: string;
  truckCount?: number;
  estimateNote?: string;
  detectedItems?: string[];
  furnitureCount?: number;
  invalidPhotos?: string[];
}

export default function Track() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: ticketByNo, isLoading: loadingNo, refetch: refetchNo } = trpc.ticket.queryByNo.useQuery(
    { ticketNo: activeQuery },
    { enabled: false }
  );

  const isLoading = loadingNo;
  const ticket = ticketByNo ?? null;

  const handleSearch = async () => {
    if (!query.trim()) { toast.error("請輸入案件編號"); return; }
    // 驗證案件編號格式
    const ticketNoPattern = /^VV-TP-\d{4}-\d{5}$/;
    if (!ticketNoPattern.test(query.trim())) {
      toast.error("請輸入有效的案件編號（格式：VV-TP-XXXX-XXXXX）");
      return;
    }
    setActiveQuery(query.trim());
    setSearched(true);
    setTimeout(() => {
      refetchNo();
    }, 50);
  };

  const status = ticket ? (statusConfig[ticket.status] ?? statusConfig.new) : null;
  const aiResult = ticket?.aiResult as AiResult | null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-2xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">案件查詢</h1>
          <p className="text-muted-foreground">輸入案件編號查詢您的搬家案件狀態</p>
        </div>

        {/* Search Section */}
        <Card className="shadow-lg border-border mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Label htmlFor="ticketNo" className="text-base font-semibold">案件編號</Label>
              <div className="flex gap-2">
                <Input
                  id="ticketNo"
                  placeholder="VV-TP-2026-00001"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading} size="lg">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  查詢
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                案件編號格式：VV-TP-XXXX-XXXXX（您在提交估價時會收到此編號）
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !isLoading && !ticket && (
          <Card className="shadow-md border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">找不到案件</p>
                  <p className="text-sm text-red-700 mt-1">
                    請確認輸入的案件編號是否正確。如有疑問，請聯絡我們的客服團隊。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {ticket && (
          <div className="space-y-4">
            {/* Case Info */}
            <Card className="shadow-md border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />案件資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">案件編號</span>
                  <span className="font-semibold">{ticket.ticketNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">案件狀態</span>
                  <Badge className={status?.color}>{status?.label}</Badge>
                </div>
                {aiResult?.priceRange && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">估價範圍</span>
                    <span className="font-semibold text-primary">{aiResult.priceRange}</span>
                  </div>
                )}
                {aiResult?.truckCount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">估計車數</span>
                    <span className="font-semibold">{aiResult.truckCount} 車</span>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">隱私保護</p>
                      <p className="text-xs text-blue-800 mt-1">
                        為保護您的隱私，完整的客戶資訊和搬家詳情只有登入後才能查看。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {status && status.step > 0 && (
              <Card className="shadow-md border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />進度追蹤
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {PROGRESS_STEPS.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                          idx < status.step
                            ? "bg-primary text-primary-foreground"
                            : idx === status.step - 1
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {idx < status.step ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={cn(
                          "text-sm",
                          idx < status.step ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis */}
            {aiResult && (
              <Card className="shadow-md border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />AI 估價結果
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-sm">
                  {aiResult.estimateNote && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">估價說明</p>
                      <p className="text-sm">{aiResult.estimateNote}</p>
                    </div>
                  )}
                  {aiResult.furnitureCount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">偵測傢具數量</span>
                      <span className="font-semibold">{aiResult.furnitureCount} 件</span>
                    </div>
                  )}
                  {aiResult.invalidPhotos && aiResult.invalidPhotos.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                      <p className="text-xs text-amber-800 font-semibold mb-1">⚠️ 無效照片</p>
                      <ul className="text-xs text-amber-700 space-y-0.5">
                        {aiResult.invalidPhotos.map((photo, idx) => (
                          <li key={idx}>• {photo}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card className="shadow-md border-border bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">需要協助？</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      如有任何問題或需要進一步的協助，請點擊下方按鈕與我們的客服團隊聯絡。
                    </p>
                    <Button className="mt-3" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      聯絡客服
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
