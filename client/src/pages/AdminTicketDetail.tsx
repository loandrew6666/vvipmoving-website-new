import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Truck,
  Package,
  Camera,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Save,
  ExternalLink,
  Home,
  Send,
  MessageCircle,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "新進線", color: "bg-brand/10 text-brand border-brand/20" },
  pending: { label: "待聯繫", color: "bg-brand/20 text-brand-dark border-brand/30" },
  quoted: { label: "已報價", color: "bg-secondary text-brand-dark border-border" },
  contracted: { label: "已簽約", color: "bg-brand/10 text-brand border-brand/20" },
  scheduled: { label: "待執行", color: "bg-brand/10 text-brand border-brand/20" },
  completed: { label: "已完成", color: "bg-gray-100 text-gray-600 border-gray-200" },
  archived: { label: "已封存", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

const ROOM_LABELS: Record<string, string> = {
  living: "客廳",
  bedroom: "臥室",
  kitchen: "廚房",
  study: "書房",
  balcony: "陽台",
  other: "其他",
};

type AiResult = {
  photoCount?: number;
  furnitureCount?: number;
  truckCount?: number;
  estimateNote?: string;
  priceRange?: { min: number; max: number };
  detectedItems?: Array<{ name: string; count: number; room: string; truckUnit: number }>;
  invalidPhotos?: Array<{ url: string; reason: string }>;
  riskItems?: string[];
  roomSummaries?: Record<string, string>;
};

type RoomLayout = Record<string, number>;

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showItems, setShowItems] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<any>>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatSearchInput, setChatSearchInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 過濾聊天訊息（搜尋）
  const filteredChatMessages = chatMessages.filter((msg) =>
    msg.message.toLowerCase().includes(chatSearchInput.toLowerCase())
  );

  const ticketId = parseInt(id ?? "0");
  const { data: ticket, isLoading, refetch } = trpc.admin.getTicket.useQuery(
    { id: ticketId },
    { enabled: !!ticketId && !loading && user?.role === "admin" }
  );

  const chatHistoryQuery = trpc.admin.getChatHistory.useQuery(
    { ticketId },
    {
      enabled: !!ticketId && showChat,
      refetchInterval: showChat ? 3000 : false,
    }
  );
  const chatHistory = chatHistoryQuery.data ?? [];

  const sendChatMutation = trpc.admin.sendChatMessage.useMutation({
    onSuccess: () => {
      setChatInput("");
      chatHistoryQuery.refetch();
    },
    onError: () => toast.error("訊息發送失敗"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (showChat) {
      setChatMessages(chatHistory);
    }
  }, [showChat, chatHistory]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMutation.mutate({
      ticketId,
      message: chatInput,
    });
  };

  const updateMutation = trpc.admin.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("案件狀態已更新");
      refetch();
      setNewStatus("");
    },
    onError: () => toast.error("更新失敗，請重試"),
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">無訪問權限</p>
            <Button onClick={() => setLocation("/admin")} variant="outline">返回後台</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">找不到此案件</p>
            <Button onClick={() => setLocation("/admin")} variant="outline">返回列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiResult = ticket.aiResult as AiResult | null;
  const photoUrls = ticket.photoUrls as string[] | null;
  const roomLayout = ticket.roomLayout as RoomLayout | null;
  const statusInfo = STATUS_LABELS[ticket.status] ?? { label: ticket.status, color: "bg-gray-100 text-gray-600" };

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateMutation.mutate({
      id: ticketId,
      status: newStatus as any,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導覽列 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="gap-2 text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-sm text-gray-600">{ticket.ticketNo}</span>
            <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            建立：{new Date(ticket.createdAt).toLocaleDateString("zh-TW")}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 左欄：客戶資訊 + 搬家資訊 + 狀態更新 */}
          <div className="space-y-5">
            {/* 客戶資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-brand" />
                  客戶資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-900">{ticket.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${ticket.customerPhone}`} className="text-brand hover:underline">
                    {ticket.customerPhone}
                  </a>
                </div>
                {ticket.customerLine && (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-gray-400 shrink-0 text-xs font-bold flex items-center justify-center">L</span>
                    <span className="text-gray-700">{ticket.customerLine}</span>
                  </div>
                )}
                {ticket.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <a href={`mailto:${ticket.customerEmail}`} className="text-blue-600 hover:underline truncate">
                      {ticket.customerEmail}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{ticket.region === "taipei" ? "台北" : "高雄"}</span>
                </div>
              </CardContent>
            </Card>

            {/* 搬家資訊 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-brand" />
                  搬家資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {ticket.moveDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">搬家日期</p>
                      <p className="text-gray-700">{new Date(ticket.moveDate).toLocaleDateString("zh-TW")}</p>
                    </div>
                  </div>
                )}
                {ticket.fromAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">搬出地址</p>
                      <p className="text-gray-700">{ticket.fromAddress}</p>
                    </div>
                  </div>
                )}
                {ticket.toAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand/60 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">搬入地址</p>
                      <p className="text-gray-700">{ticket.toAddress}</p>
                    </div>
                  </div>
                )}
                {roomLayout && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">房型格局</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(roomLayout).map(([room, count]) =>
                        count > 0 ? (
                          <Badge key={room} variant="outline" className="text-xs bg-secondary text-brand border-border">
                            {ROOM_LABELS[room] ?? room} ×{count}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 狀態更新 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand" />
                  更新案件狀態
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="選擇新狀態..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="備註（選填）..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updateMutation.isPending}
                  className="w-full bg-brand hover:bg-brand-dark gap-2"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? "更新中..." : "儲存狀態"}
                </Button>
                {ticket.notes && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">最新備註</p>
                    <p className="text-sm text-gray-700">{ticket.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 聊天區塊 */}
            <Card>
              <CardHeader className="pb-3">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
                >
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-brand" />
                    客戶聊天
                  </CardTitle>
                  {showChat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CardHeader>
              {showChat && (
                <CardContent className="space-y-3">
                  {/* 搜尋輸入框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatSearchInput}
                      onChange={(e) => setChatSearchInput(e.target.value)}
                      placeholder="搜尋聊天記錄..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    {chatSearchInput && (
                      <button
                        onClick={() => setChatSearchInput("")}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="清除搜尋"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 聊天訊息區 */}
                  <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>尚無聊天記錄</p>
                      </div>
                    ) : filteredChatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>找不到符合「{chatSearchInput}」的訊息</p>
                      </div>
                    ) : (
                      filteredChatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              msg.role === "admin"
                                ? "bg-brand text-white rounded-br-none"
                                : "bg-gray-200 text-gray-900 rounded-bl-none"
                            }`}
                          >
                            {msg.message}
                            <div className="text-xs mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString("zh-TW", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* 訊息輸入區 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="輸入訊息..."
                      disabled={sendChatMutation.isPending}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <Button
                      onClick={handleSendChat}
                      disabled={sendChatMutation.isPending || !chatInput.trim()}
                      className="bg-brand hover:bg-brand-dark text-white px-3"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* 右欄：AI 估價結果 + 照片 */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI 估價結果 */}
            {aiResult && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand" />
                    AI 估價結果
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 摘要數字 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand">{aiResult.photoCount ?? 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">照片數量</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand">{aiResult.furnitureCount ?? 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">大型傢俱</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-brand">{aiResult.truckCount ?? 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">估計車數</p>
                    </div>
                  </div>

                  {/* 估價範圍 */}
                  {aiResult.priceRange && (
                    <div className="bg-gradient-to-r from-brand-dark to-brand rounded-lg p-4 text-white text-center">
                      <p className="text-xs opacity-80 mb-1">初步估價範圍</p>
                      <p className="text-xl font-bold">
                        NT$ {aiResult.priceRange.min.toLocaleString()} ~ {aiResult.priceRange.max.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* 估價說明 */}
                  {aiResult.estimateNote && (
                    <div className="bg-secondary border border-border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{aiResult.estimateNote}</p>
                    </div>
                  )}

                  {/* 風險物件 */}
                  {aiResult.riskItems && aiResult.riskItems.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-xs font-medium text-red-700">需特別注意物件</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.riskItems.map((item, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 物件清單 */}
                  {aiResult.detectedItems && aiResult.detectedItems.length > 0 && (
                    <div>
                      <button
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 w-full text-left"
                        onClick={() => setShowItems(!showItems)}
                      >
                        <Package className="w-4 h-4 text-brand" />
                        辨識物件清單（{aiResult.detectedItems.length} 項）
                        {showItems ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                      </button>
                      {showItems && (
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500">
                                <th className="text-left px-3 py-2 font-medium">物件名稱</th>
                                <th className="text-center px-3 py-2 font-medium">數量</th>
                                <th className="text-left px-3 py-2 font-medium">空間</th>
                                <th className="text-right px-3 py-2 font-medium">車數</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiResult.detectedItems.map((item, i) => (
                                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-800">{item.name}</td>
                                  <td className="px-3 py-2 text-center text-gray-600">×{item.count}</td>
                                  <td className="px-3 py-2 text-gray-500">{ROOM_LABELS[item.room] ?? item.room}</td>
                                  <td className="px-3 py-2 text-right text-brand font-medium">
                                    {(item.truckUnit * item.count).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 無效照片警告 */}
                  {aiResult.invalidPhotos && aiResult.invalidPhotos.length > 0 && (
                    <div className="bg-secondary border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-brand" />
                        <p className="text-xs font-medium text-brand-dark">
                          {aiResult.invalidPhotos.length} 張照片無法辨識
                        </p>
                      </div>
                      <div className="space-y-1">
                        {aiResult.invalidPhotos.map((p, i) => (
                          <p key={i} className="text-xs text-yellow-600">• {p.reason}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 客戶上傳照片 */}
            {photoUrls && photoUrls.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand" />
                    客戶上傳照片（{photoUrls.length} 張）
                    <button
                      className="ml-auto"
                      onClick={() => setShowPhotos(!showPhotos)}
                    >
                      {showPhotos ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                  </CardTitle>
                </CardHeader>
                {showPhotos && (
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photoUrls.map((url, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity group"
                          onClick={() => setSelectedPhoto(url)}
                        >
                          <img
                            src={url}
                            alt={`照片 ${i + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='12' fill='%239ca3af'%3E無法載入%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                            {i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 照片燈箱 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="照片預覽"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
            <a
              href={selectedPhoto}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-lg px-3 py-1 text-xs flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              開新視窗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
