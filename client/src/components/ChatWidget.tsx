import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader, Phone, ImagePlus, Camera } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brandData";

interface ChatMessage {
  role: "customer" | "admin";
  message: string;
  timestamp: number;
  isRead?: boolean;
  imageUrl?: string;
}

interface EstimateData {
  ticketNo: string;
  ticketId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomLayout?: Record<string, number>;
  photoCount?: number;
  furnitureCount?: number;
  truckCount?: number;
  priceRange?: { min: number; max: number };
}

const STORAGE_KEY_ESTIMATE = "vvip_estimate_data";
const STORAGE_KEY_CHAT = "vvip_chat_messages";
const STORAGE_KEY_IS_OPEN = "vvip_chat_is_open";
const STORAGE_KEY_TICKET_ID = "vvip_ticket_id";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [estimateData, setEstimateData] = useState<EstimateData | null>(null);
  const [ticketId, setTicketId] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  // 打開聊天窗口（從 FloatingCTA 調用）
  const openChat = useCallback(() => {
    setIsOpen(true);
    localStorage.setItem(STORAGE_KEY_IS_OPEN, "true");
  }, []);

  // 打開聊天窗口（從 AI 估價調用，帶估價資料和 ticketId）
  const openChatWithEstimate = useCallback((data: EstimateData) => {
    setEstimateData(data);
    setIsOpen(true);

    if (data.ticketId && data.ticketId > 0) {
      setTicketId(data.ticketId);
      localStorage.setItem(STORAGE_KEY_TICKET_ID, String(data.ticketId));
    }

    localStorage.setItem(STORAGE_KEY_IS_OPEN, "true");
    localStorage.setItem(STORAGE_KEY_ESTIMATE, JSON.stringify(data));
  }, []);

  // 暴露方法到全局作用域
  useEffect(() => {
    (window as any).__openChatWithEstimate = openChatWithEstimate;
    (window as any).__openChat = openChat;
    return () => {
      delete (window as any).__openChatWithEstimate;
      delete (window as any).__openChat;
    };
  }, [openChatWithEstimate, openChat]);

  // 初始化：從本地儲存恢復狀態（只執行一次）
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      const storedIsOpen = localStorage.getItem(STORAGE_KEY_IS_OPEN);
      const storedEstimate = localStorage.getItem(STORAGE_KEY_ESTIMATE);
      const storedChat = localStorage.getItem(STORAGE_KEY_CHAT);
      const storedTicketId = localStorage.getItem(STORAGE_KEY_TICKET_ID);

      if (storedEstimate) {
        setEstimateData(JSON.parse(storedEstimate));
      }

      if (storedChat) {
        setChatMessages(JSON.parse(storedChat));
      }

      if (storedTicketId) {
        const id = parseInt(storedTicketId);
        if (id > 0) setTicketId(id);
      }

      if (storedIsOpen === "true" && storedTicketId && parseInt(storedTicketId) > 0) {
        setIsOpen(true);
      }
    } catch (e) {
      console.error("Failed to restore chat state:", e);
    }
  }, []);

  // 查詢聊天記錄
  const queryChatHistory = trpc.ticket.getChatHistory.useQuery(
    { ticketId },
    {
      enabled: ticketId > 0 && isOpen,
      refetchInterval: isOpen && ticketId > 0 ? 3000 : false,
    }
  );

  // 發送訊息 mutation
  const sendMessageMutation = trpc.ticket.sendChatMessage.useMutation({
    onSuccess: () => {
      queryChatHistory.refetch();
    },
  });

  // 上傳圖片 mutation
  const uploadImageMutation = trpc.ticket.uploadChatImage.useMutation();

  // 當聊天記錄更新時，同步到本地
  useEffect(() => {
    if (queryChatHistory.data && queryChatHistory.data.length > 0) {
      setChatMessages(queryChatHistory.data);
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(queryChatHistory.data));
    }
  }, [queryChatHistory.data]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 聊天窗口打開時聚焦輸入框
  useEffect(() => {
    if (isOpen && ticketId > 0) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, ticketId]);

  // 選擇圖片（本機）
  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  // 開啟相機
  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("圖片大小不能超過 10MB");
      return;
    }
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = "";
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setPendingImageFile(null);
  };

  // 撥打電話
  const handleCallPhone = () => {
    window.location.href = `tel:${BRAND.phone}`;
  };

  // 發送訊息（含圖片）
  const handleSendMessage = useCallback(async () => {
    const hasText = messageInput.trim().length > 0;
    const hasImage = !!pendingImageFile;
    if ((!hasText && !hasImage) || ticketId <= 0) return;

    setIsSending(true);
    const message = messageInput.trim();
    setMessageInput("");
    const imageFile = pendingImageFile;
    const localPreview = previewImage;
    setPendingImageFile(null);
    setPreviewImage(null);

    // 樂觀更新：立即在本地顯示訊息
    const optimisticMsg: ChatMessage = {
      role: "customer",
      message: message || "",
      timestamp: Date.now(),
      isRead: false,
      imageUrl: localPreview || undefined,
    };
    const updatedMessages = [...chatMessages, optimisticMsg];
    setChatMessages(updatedMessages);
    localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(updatedMessages));

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        // 上傳圖片到 S3
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const uploadResult = await uploadImageMutation.mutateAsync({
          ticketId,
          fileBase64: base64,
          fileName: imageFile.name,
          mimeType: imageFile.type,
        });
        imageUrl = uploadResult.url;
      }

      await sendMessageMutation.mutateAsync({
        ticketId,
        message: message || "",
        imageUrl,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // 回滾樂觀更新
      setChatMessages(chatMessages);
      setMessageInput(message);
      if (imageFile) {
        setPendingImageFile(imageFile);
        setPreviewImage(localPreview);
      }
    } finally {
      setIsSending(false);
    }
  }, [messageInput, pendingImageFile, previewImage, ticketId, chatMessages, sendMessageMutation, uploadImageMutation]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY_IS_OPEN, "false");
  };

  const handleClearAll = () => {
    localStorage.removeItem(STORAGE_KEY_ESTIMATE);
    localStorage.removeItem(STORAGE_KEY_CHAT);
    localStorage.removeItem(STORAGE_KEY_IS_OPEN);
    localStorage.removeItem(STORAGE_KEY_TICKET_ID);
    setEstimateData(null);
    setChatMessages([]);
    setTicketId(0);
    setIsOpen(false);
  };

  const canSend = ticketId > 0;
  const isPending = isSending || sendMessageMutation.isPending;

  if (!isOpen) return <div data-chat-widget style={{ display: "none" }} />;

  return (
    <div data-chat-widget>
      {/* 聊天窗口 */}
      <Card className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[520px] md:max-h-[620px] flex flex-col shadow-2xl z-[9995] rounded-none md:rounded-xl border-0 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-brand text-white p-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <MessageCircle size={18} />
              <span>創勝客服</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {/* 電話按鈕 */}
              <button
                onClick={handleCallPhone}
                className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                aria-label="撥打電話"
                title={`撥打 ${BRAND.phone}`}
              >
                <Phone size={16} />
              </button>
              {estimateData && (
                <button
                  onClick={handleClearAll}
                  className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  title="清除聊天記錄"
                >
                  清除
                </button>
              )}
              <button
                onClick={handleClose}
                className="hover:bg-white/20 rounded-full p-1.5 transition-colors"
                aria-label="關閉聊天"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* 估價資訊顯示 */}
        {estimateData && (
          <div className="px-3 py-2 border-b bg-secondary text-sm flex-shrink-0">
            <div className="font-semibold text-brand-dark mb-1 text-xs">您的估價資訊</div>
            <div className="space-y-0.5 text-muted-foreground text-xs">
              <div>案件編號：<span className="font-bold">{estimateData.ticketNo}</span></div>
              {estimateData.truckCount != null && (
                <div>估計車數：{estimateData.truckCount} 車</div>
              )}
              {estimateData.priceRange && (
                <div>
                  估價範圍：NT$
                  {estimateData.priceRange.min.toLocaleString()} - NT$
                  {estimateData.priceRange.max.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 聊天訊息區 */}
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 min-h-0">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-6">
              <MessageCircle size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">歡迎使用創勝客服</p>
              {canSend ? (
                <p className="text-xs mt-1 text-gray-400">有任何問題，歡迎提問！</p>
              ) : (
                <p className="text-xs mt-1 text-gray-400">
                  請先完成 AI 估價，即可開始對話
                </p>
              )}
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === "customer" ? "items-end" : "items-start"}`}>
                  {/* 圖片訊息 */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 max-w-full">
                      <img
                        src={msg.imageUrl}
                        alt="圖片訊息"
                        className="max-w-full max-h-48 object-contain cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, "_blank")}
                      />
                    </div>
                  )}
                  {/* 文字訊息 */}
                  {msg.message && (
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm break-words ${
                        msg.role === "customer"
                          ? "bg-brand text-white rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                  <div className={`text-xs opacity-60 px-1 ${msg.role === "customer" ? "text-right" : "text-left"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.role === "customer" && msg.isRead && (
                      <span className="ml-1 text-brand">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* 圖片預覽 */}
        {previewImage && (
          <div className="px-3 py-2 border-t bg-white flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <img src={previewImage} alt="預覽" className="h-14 w-14 object-cover rounded-lg border" />
              <button
                onClick={handleCancelImage}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </div>
            <span className="text-xs text-gray-500">圖片已選擇，點發送傳出</span>
          </div>
        )}

        {/* 訊息輸入框 */}
        <div className="p-3 border-t bg-white flex-shrink-0">
          {!canSend ? (
            <div className="text-center text-xs text-gray-400 py-1">
              請先完成 AI 估價建立案件，即可與客服對話
            </div>
          ) : (
            <div className="flex gap-1.5 items-center">
              {/* 本機圖片上傳 */}
              <button
                onClick={handleSelectImage}
                disabled={isPending}
                className="text-gray-400 hover:text-brand transition-colors flex-shrink-0 disabled:opacity-50 p-1"
                title="上傳圖片"
                aria-label="上傳圖片"
              >
                <ImagePlus size={20} />
              </button>
              {/* 相機拍攝 */}
              <button
                onClick={handleOpenCamera}
                disabled={isPending}
                className="text-gray-400 hover:text-brand transition-colors flex-shrink-0 disabled:opacity-50 p-1"
                title="拍照"
                aria-label="拍照"
              >
                <Camera size={20} />
              </button>

              {/* 隱藏的 file input（本機圖片） */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {/* 隱藏的 file input（相機） */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <Input
                ref={inputRef}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={previewImage ? "輸入圖片說明（可選）..." : "輸入訊息..."}
                disabled={isPending}
                className="flex-1 text-sm rounded-full bg-gray-100 border-0 focus-visible:ring-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!messageInput.trim() && !pendingImageFile) || isPending}
                size="sm"
                className="bg-brand hover:bg-brand-dark rounded-full w-9 h-9 p-0 flex-shrink-0"
                aria-label="發送"
              >
                {isPending ? (
                  <Loader size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

