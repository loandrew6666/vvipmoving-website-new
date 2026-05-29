import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, ImagePlus, X, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  role: "customer" | "admin";
  message: string;
  timestamp: number;
  isRead?: boolean;
  imageUrl?: string;
}

interface ChatPanelProps {
  ticketId: number;
  customerName: string;
  ticketNo: string;
}

export function ChatPanel({ ticketId, customerName, ticketNo }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查詢聊天記錄
  const queryChatHistory = trpc.admin.getChatHistory.useQuery(
    { ticketId },
    { refetchInterval: 3000 }
  );

  // 發送訊息 mutation
  const sendMessageMutation = trpc.admin.sendChatMessage.useMutation({
    onSuccess: () => {
      queryChatHistory.refetch();
    },
  });

  // 上傳圖片 mutation
  const uploadImageMutation = trpc.admin.uploadChatImage.useMutation();

  // 標記訊息為已讀 mutation
  const markAsReadMutation = trpc.admin.markChatMessageAsRead.useMutation({
    onSuccess: () => {
      queryChatHistory.refetch();
    },
  });

  // 同步伺服器資料到本地（只在伺服器資料比本地多時更新）
  useEffect(() => {
    if (queryChatHistory.data) {
      setMessages(queryChatHistory.data);
    }
  }, [queryChatHistory.data]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 選擇圖片
  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    // 清空 input 以便重複選擇同一文件
    e.target.value = "";
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setPendingImageFile(null);
  };

  // 發送訊息（含圖片）
  const handleSendMessage = useCallback(async () => {
    const hasText = messageInput.trim().length > 0;
    const hasImage = !!pendingImageFile;
    if (!hasText && !hasImage) return;

    const message = messageInput.trim();
    setMessageInput("");
    const imageFile = pendingImageFile;
    setPendingImageFile(null);
    setPreviewImage(null);
    setIsUploading(true);

    // 樂觀更新：立即在本地顯示訊息
    const optimisticMsg: ChatMessage = {
      role: "admin",
      message: message || (hasImage ? "[圖片]" : ""),
      timestamp: Date.now(),
      isRead: false,
      imageUrl: previewImage || undefined,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        // 上傳圖片到 S3
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // 移除 data:xxx;base64, 前綴
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
      setMessages(prev => prev.filter(m => m !== optimisticMsg));
      setMessageInput(message);
      if (imageFile) {
        setPendingImageFile(imageFile);
        setPreviewImage(optimisticMsg.imageUrl || null);
      }
    } finally {
      setIsUploading(false);
    }
  }, [messageInput, pendingImageFile, previewImage, ticketId, sendMessageMutation, uploadImageMutation]);

  // 標記訊息為已讀
  const handleMarkAsRead = (index: number) => {
    markAsReadMutation.mutate({
      ticketId,
      messageIndex: index,
    });
    // 樂觀更新本地訊息
    setMessages(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], isRead: true };
      }
      return updated;
    });
  };

  const isPending = sendMessageMutation.isPending || isUploading;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            <span className="text-sm">{customerName} ({ticketNo})</span>
          </div>
          {messages.filter(m => m.role === "customer" && !m.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {messages.filter(m => m.role === "customer" && !m.isRead).length} 未讀
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* 聊天訊息區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">尚無聊天記錄</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}
              >
                <div className="flex flex-col gap-1 max-w-[75%]">
                  {/* 圖片訊息 */}
                  {msg.imageUrl && (
                    <div className={`rounded-lg overflow-hidden ${msg.role === "customer" ? "border border-gray-200" : ""}`}>
                      <img
                        src={msg.imageUrl}
                        alt="圖片訊息"
                        className="max-w-full max-h-48 object-contain cursor-pointer rounded-lg"
                        onClick={() => window.open(msg.imageUrl, "_blank")}
                      />
                    </div>
                  )}
                  {/* 文字訊息 */}
                  {msg.message && (
                    <div
                      className={`px-3 py-2 rounded-lg text-sm break-words ${
                        msg.role === "customer"
                          ? "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                          : "bg-brand text-white rounded-br-none"
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                  <div className="text-xs opacity-60 flex items-center justify-between gap-2 px-1">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.role === "customer" && (
                      <>
                        {msg.isRead ? (
                          <span className="text-green-600">✓ 已讀</span>
                        ) : (
                          <button
                            onClick={() => handleMarkAsRead(idx)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            標記已讀
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 圖片預覽 */}
        {previewImage && (
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-2">
            <div className="relative">
              <img src={previewImage} alt="預覽" className="h-16 w-16 object-cover rounded-lg border" />
              <button
                onClick={handleCancelImage}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </div>
            <span className="text-xs text-gray-500">點擊發送按鈕傳送圖片</span>
          </div>
        )}

        {/* 訊息輸入框 */}
        <div className="p-3 border-t bg-white flex-shrink-0">
          <div className="flex gap-2 items-center">
            {/* 圖片上傳按鈕 */}
            <button
              onClick={handleSelectImage}
              disabled={isPending}
              className="text-gray-400 hover:text-brand transition-colors flex-shrink-0 disabled:opacity-50"
              title="上傳圖片"
            >
              <ImagePlus size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Input
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
              className="flex-1 text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!messageInput.trim() && !pendingImageFile) || isPending}
              size="sm"
              className="flex-shrink-0"
            >
              {isPending ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
