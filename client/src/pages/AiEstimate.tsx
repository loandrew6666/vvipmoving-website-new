import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Bot, MapPin, HomeIcon, Camera, CheckCircle, ArrowRight, ArrowLeft,
  Upload, Loader2, AlertTriangle, Phone, MessageCircle, Package, Star, X,
  Sofa, BedDouble, ChefHat, BookOpen, Sun, MoreHorizontal,
  Truck, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAIWAN_CITIES, getDistrictsByCity } from "../../../shared/taiwan-districts";

type Region = "taipei" | "kaohsiung";

interface RoomLayout {
  living: number;
  bedroom: number;
  kitchen: number;
  study: number;
  balcony: number;
  other: number;
  [key: string]: number;
}

interface RoomPhotoEntry {
  file: File;
  previewUrl: string;
}

interface DetectedItem {
  name: string;
  count: number;
  truckUnit: number;
  room: string;
}

interface AiResult {
  photoCount: number;
  furnitureCount: number;
  truckCount: number;
  detectedItems?: DetectedItem[];
  invalidPhotos?: string[];
  roomSummaries: Array<{ room: string; items: string; note: string }>;
  riskItems: string[];
  estimateNote: string;
  priceRange: { min: number; max: number };
  needsManualReview?: boolean;
  calibrationInfo?: {
    baseTruckCount: number;
    afterCompensation: number;
    afterCalibration: number;
    boxEstimation: string | null;
    elevatorInfo: string | null;
  };
}

interface UploadedFileInfo {
  name: string;
  type: string;
  url: string;
  size: number;
  extractedFiles?: Array<{ name: string; type: string; url: string; size: number }>;
}

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/*";
const MAX_FILE_SIZE_MB = 50;
const MAX_PHOTOS_PER_ROOM = 10;

const STEPS = [
  { id: 1, label: "選擇區域", icon: MapPin },
  { id: 2, label: "房型格局", icon: HomeIcon },
  { id: 3, label: "上傳照片", icon: Camera },
  { id: 4, label: "AI 分析", icon: Bot },
  { id: 5, label: "建立案件", icon: CheckCircle },
];

const roomLabels: Record<keyof RoomLayout, string> = {
  living: "客廳",
  bedroom: "臥室",
  kitchen: "廚房",
  study: "書房",
  balcony: "陽台",
  other: "其他空間",
};

const roomIcons: Record<string, React.ReactNode> = {
  living: <Sofa className="w-4 h-4" />,
  bedroom: <BedDouble className="w-4 h-4" />,
  kitchen: <ChefHat className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  balcony: <Sun className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

export default function AiEstimate() {
  const [step, setStep] = useState(1);
  const [region, setRegion] = useState<Region | null>(null);
  const [roomLayout, setRoomLayout] = useState<RoomLayout>({
    living: 1, bedroom: 2, kitchen: 1, study: 0, balcony: 0, other: 0,
  });
  const [riskItems, setRiskItems] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [roomPhotos, setRoomPhotos] = useState<Record<string, RoomPhotoEntry[]>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showItemList, setShowItemList] = useState(false);

  // 新增欄位：樓層/電梯（步驟2使用，AI分析時傳遞）
  const [fromHasElevator, setFromHasElevator] = useState<string>("");
  const [fromFloor, setFromFloor] = useState("");
  const [toHasElevator, setToHasElevator] = useState<string>("");
  const [toFloor, setToFloor] = useState("");
  // 新增欄位：物品過濾模式（exclude=排除不搬的 / only=只搬這些）
  const [itemFilterMode, setItemFilterMode] = useState<"exclude" | "only">("exclude");
  // 不搬物品清單
  const [notMovingItems, setNotMovingItems] = useState("");
  // 只搬物品清單
  const [onlyMovingItems, setOnlyMovingItems] = useState("");
  // 新增欄位：預估紙箱/雜物量
  const [boxEstimation, setBoxEstimation] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLine, setCustomerLine] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [moveDate, setMoveDate] = useState("");
  // 搬離地址
  const [fromCity, setFromCity] = useState("");
  const [fromDistrict, setFromDistrict] = useState("");
  const [fromDetail, setFromDetail] = useState("");
  // 搬入地址
  const [toCity, setToCity] = useState("");
  const [toDistrict, setToDistrict] = useState("");
  const [toDetail, setToDetail] = useState("");

  // 進入 AI 估價頁面時，清除舊的聊天暫存資料（避免新案件顯示舊案件資訊）
  useEffect(() => {
    localStorage.removeItem("vvip_estimate_data");
    localStorage.removeItem("vvip_chat_messages");
    localStorage.removeItem("vvip_ticket_id");
    localStorage.removeItem("vvip_chat_is_open");
  }, []);

  // 組合完整地址
  const fromAddress = [fromCity, fromDistrict, fromDetail].filter(Boolean).join("");
  const toAddress = [toCity, toDistrict, toDetail].filter(Boolean).join("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const analyzeMutation = trpc.aiEstimate.analyze.useMutation();
  const createTicketMutation = trpc.ticket.create.useMutation();
  const uploadFileMutation = trpc.aiEstimate.uploadFile.useMutation();

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const totalPhotoCount = Object.values(roomPhotos).reduce((sum, arr) => sum + arr.length, 0);
  const activeRooms = Object.keys(roomLabels).filter(
    (room) => roomLayout[room] > 0
  );

  const handleRoomPhotoSelect = (roomKey: string, files: FileList) => {
    const current = roomPhotos[roomKey] ?? [];
    const remaining = MAX_PHOTOS_PER_ROOM - current.length;
    if (remaining <= 0) {
      toast.error(`每個空間最多上傳 ${MAX_PHOTOS_PER_ROOM} 張照片`);
      return;
    }
    const newEntries: RoomPhotoEntry[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} 超過 ${MAX_FILE_SIZE_MB}MB 限制`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} 不是圖片格式，請上傳 JPG/PNG`);
        continue;
      }
      newEntries.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (newEntries.length > 0) {
      setRoomPhotos((prev) => ({ ...prev, [roomKey]: [...(prev[roomKey] ?? []), ...newEntries] }));
    }
  };

  const removeRoomPhoto = (roomKey: string, index: number) => {
    setRoomPhotos((prev) => ({
      ...prev,
      [roomKey]: (prev[roomKey] ?? []).filter((_, i) => i !== index),
    }));
  };

  // 壓縮照片：將大圖縮小到最大 1920px 邊長，品質 0.8，大幅減少 base64 體積
  const compressImage = async (file: File, maxDimension = 1920, quality = 0.8): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        // 只在超過最大尺寸時才縮放
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas 不可用")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1] ?? dataUrl;
        resolve({ base64, mimeType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("圖片載入失敗"));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadSinglePhoto = async (file: File): Promise<string | null> => {
    try {
      // 壓縮照片後再上傳（手機照片通常 5-15MB，壓縮後約 200KB-1MB）
      const { base64, mimeType } = await compressImage(file);
      console.log(`[Upload] 壓縮完成: ${file.name} (原始 ${(file.size / 1024 / 1024).toFixed(1)}MB → base64 ${(base64.length / 1024 / 1024).toFixed(1)}MB)`);
      const result = await uploadFileMutation.mutateAsync({
        fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
        fileBase64: base64,
        mimeType,
        fileSize: Math.round(base64.length * 0.75), // approximate decoded size
      });
      console.log(`[Upload] 成功上傳: ${file.name}`);
      return (result as UploadedFileInfo).url;
    } catch (error) {
      console.error(`[Upload] 上傳失敗 ${file.name}:`, error);
      toast.error(`上傳 ${file.name} 失敗，請重試`);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!region) return;
    if (totalPhotoCount === 0) {
      toast.error("請至少上傳一張室內照片，以獲得更準確的 AI 估價");
      return;
    }
    setIsAnalyzing(true);
    setStep(4);
    try {
      setIsUploading(true);
      const roomPhotoUrls: Record<string, string[]> = {};
      const allUploadedFiles: UploadedFileInfo[] = [];
      let uploadFailureCount = 0;

      for (const [roomKey, entries] of Object.entries(roomPhotos)) {
        if (!entries.length) continue;
        const urls: string[] = [];
        for (const entry of entries) {
          const url = await uploadSinglePhoto(entry.file);
          if (url) {
            urls.push(url);
            allUploadedFiles.push({
              name: entry.file.name,
              type: entry.file.type,
              url,
              size: entry.file.size,
            });
          } else {
            uploadFailureCount++;
          }
        }
        if (urls.length > 0) roomPhotoUrls[roomKey] = urls;
      }
      
      if (uploadFailureCount > 0) {
        console.warn(`[Analyze] ${uploadFailureCount} 張照片上傳失敗`);
      }
      
      if (Object.keys(roomPhotoUrls).length === 0) {
        toast.error("照片上傳失敗，請檢查網路連接後重試");
        setStep(3);
        setIsAnalyzing(false);
        setIsUploading(false);
        return;
      }
      
      setUploadedFiles(allUploadedFiles);
      setIsUploading(false);

      console.log(`[Analyze] 開始 AI 分析，已上傳 ${allUploadedFiles.length} 張照片`);
      const result = await analyzeMutation.mutateAsync({
        region,
        roomLayout,
        roomPhotos: roomPhotoUrls,
        riskItems,
        notes,
        // 新增欄位傳遞給 AI 分析
        fromHasElevator: (fromHasElevator === "yes" || fromHasElevator === "no") ? fromHasElevator : undefined,
        fromFloor: fromFloor ? Number(fromFloor) : undefined,
        toHasElevator: (toHasElevator === "yes" || toHasElevator === "no") ? toHasElevator : undefined,
        toFloor: toFloor ? Number(toFloor) : undefined,
        itemFilterMode: itemFilterMode,
        notMovingItems: itemFilterMode === "exclude" ? (notMovingItems || undefined) : undefined,
        onlyMovingItems: itemFilterMode === "only" ? (onlyMovingItems || undefined) : undefined,
        boxEstimation: (boxEstimation === "few" || boxEstimation === "normal" || boxEstimation === "many" || boxEstimation === "extreme") ? boxEstimation : undefined,
      });
      console.log("[Analyze] AI 分析完成", result);
      setAiResult(result as AiResult);
    } catch (error) {
      console.error("[Analyze] 分析失敗:", error);
      const errorMsg = error instanceof Error ? error.message : "未知錯誤";
      toast.error(`AI 分析失敗: ${errorMsg}`);
      setStep(3);
    } finally {
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!customerName || !customerPhone) {
      toast.error("請填寫姓名與電話");
      return;
    }
    if (!fromCity || !fromDistrict) {
      toast.error("請填寫搬離地址（縣市與行政區）");
      return;
    }
    if (!toCity || !toDistrict) {
      toast.error("請填寫搬入地址（縣市與行政區）");
      return;
    }
    if (!region) return;
    try {
      const imageUrls = uploadedFiles
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => f.url);

      const result = await createTicketMutation.mutateAsync({
        region,
        customerName,
        customerPhone,
        customerLine: customerLine || undefined,
        customerEmail: customerEmail || undefined,
        moveDate: moveDate ? new Date(moveDate).toISOString() : undefined,
        fromAddress: fromAddress || undefined,
        toAddress: toAddress || undefined,
        fromCity: fromCity || undefined,
        fromDistrict: fromDistrict || undefined,
        toCity: toCity || undefined,
        toDistrict: toDistrict || undefined,
        fromHasElevator: (fromHasElevator === "yes" || fromHasElevator === "no") ? fromHasElevator : undefined,
        fromFloor: fromHasElevator === "no" && fromFloor ? Number(fromFloor) : undefined,
        toHasElevator: (toHasElevator === "yes" || toHasElevator === "no") ? toHasElevator : undefined,
        toFloor: toHasElevator === "no" && toFloor ? Number(toFloor) : undefined,
        roomLayout,
        aiResult,
        photoUrls: imageUrls,
        uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        notes: notes || undefined,
        source: "ai_estimate",
      });
      toast.success("案件已成功建立！");
      
      const ticketNo = (result as { ticketNo?: string; id?: number })?.ticketNo || "";
      const ticketId = (result as { ticketNo?: string; id?: number })?.id || 0;
      if (ticketNo && (window as any).__openChatWithEstimate) {
        setTimeout(() => {
          (window as any).__openChatWithEstimate({
            ticketNo,
            ticketId, // 關鍵：傳遞 ticketId 給 ChatWidget
            customerName,
            customerPhone,
            customerEmail: customerEmail || "",
            roomLayout,
            photoCount: imageUrls.length,
            furnitureCount: aiResult?.furnitureCount,
            truckCount: aiResult?.truckCount,
            priceRange: aiResult?.priceRange,
          });
        }, 500);
      }
    } catch {
      toast.error("建立案件失敗，請稍後再試");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />AI 智能估價
              </h1>
              <p className="text-xs text-muted-foreground">上傳室內照片，AI 自動辨識物件並估算費用</p>
            </div>
            <Badge variant="outline" className="text-xs border-primary text-primary">
              步驟 {step} / {STEPS.length}
            </Badge>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0",
                  step > s.id ? "bg-primary text-white" :
                  step === s.id ? "bg-primary text-white shadow-lg shadow-primary/30" :
                  "bg-white border-2 border-border text-muted-foreground"
                )}>
                  {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : s.id}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-1", step > s.id ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Card className="shadow-lg border-0">

          {/* Step 1 - Region */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />選擇服務區域
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">請選擇您的搬家起點所在區域，我們將為您分配最近的服務團隊。</p>
                <div className="grid grid-cols-2 gap-4">
                  {(["taipei", "kaohsiung"] as Region[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={cn(
                        "p-6 rounded-xl border-2 text-left transition-all hover:shadow-md",
                        region === r
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white"
                      )}
                    >
                      <div className="text-3xl font-black mb-2 text-brand">
                        {r === "taipei" ? "台北" : "高雄"}
                      </div>
                      <div className="text-sm font-semibold text-foreground mb-1">
                        {r === "taipei" ? "台中以北" : "彰化以南"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r === "taipei"
                          ? "台北市、新北市、桃園市、基隆市、新竹縣市、苗栗縣、台中市"
                          : "彰化縣、南投縣、雲林縣、嘉義縣市、台南市、高雄市、屏東縣"}
                      </div>
                      {region === r && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                          <CheckCircle className="w-3.5 h-3.5" />已選擇
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="bg-brand/10 border border-brand/30 rounded-lg p-3 text-sm text-brand-dark">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />若搬家跨越區域，請選擇起點所在區域，並在備註中說明。
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                  disabled={!region}
                  onClick={() => setStep(2)}
                >
                  下一步：填寫房型格局<ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2 - Room Layout */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-primary" />填寫房型格局
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(roomLabels) as Array<keyof RoomLayout>).map((room) => (
                    <div key={room} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <Label className="font-medium flex items-center gap-1.5">
                        {roomIcons[room]}{roomLabels[room]}
                      </Label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRoomLayout((p) => ({ ...p, [room]: Math.max(0, p[room] - 1) }))}
                          className="w-7 h-7 rounded-full border border-border bg-white flex items-center justify-center hover:bg-accent font-bold"
                        >−</button>
                        <span className="w-6 text-center font-bold">{roomLayout[room]}</span>
                        <button
                          onClick={() => setRoomLayout((p) => ({ ...p, [room]: p[room] + 1 }))}
                          className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 font-bold"
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="font-semibold mb-2 block">特殊物品（可複選）</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["鋼琴", "大型電視", "精品包包", "藝術品/古董", "大型魚缸", "健身器材", "大型植物", "保險箱"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setRiskItems((p) => p.includes(item) ? p.filter((i) => i !== item) : [...p, item])}
                        className={cn(
                          "p-2.5 rounded-lg border text-sm text-left transition-all",
                          riskItems.includes(item)
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border bg-white hover:border-primary/50"
                        )}
                      >
                        {riskItems.includes(item) ? "✓ " : ""}{item}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 新增：樓層與電梯狀態 */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <Label className="font-bold text-base block flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />樓層與電梯狀態
                    <span className="text-xs font-normal text-muted-foreground">(影響車數評估)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">搬出有無電梯</Label>
                      <Select value={fromHasElevator} onValueChange={setFromHasElevator}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">有電梯</SelectItem>
                          <SelectItem value="no">無電梯（需走樓梯）</SelectItem>
                        </SelectContent>
                      </Select>
                      {fromHasElevator === "no" && (
                        <Select value={fromFloor} onValueChange={setFromFloor}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="搬出樓層" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((f) => (
                              <SelectItem key={f} value={String(f)}>{f} 樓</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">搬入有無電梯</Label>
                      <Select value={toHasElevator} onValueChange={setToHasElevator}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">有電梯</SelectItem>
                          <SelectItem value="no">無電梯（需走樓梯）</SelectItem>
                        </SelectContent>
                      </Select>
                      {toHasElevator === "no" && (
                        <Select value={toFloor} onValueChange={setToFloor}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="搬入樓層" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((f) => (
                              <SelectItem key={f} value={String(f)}>{f} 樓</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                {/* 新增：預估紙箱/雜物量 */}
                <div>
                  <Label className="font-semibold mb-2 block flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />預估紙箱/雜物量
                    <span className="text-xs font-normal text-muted-foreground">(影響車數評估)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "few", label: "極少", desc: "0-15箱" },
                      { value: "normal", label: "一般", desc: "15-30箱" },
                      { value: "many", label: "多", desc: "30-50箱" },
                      { value: "extreme", label: "極多", desc: "50+箱" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBoxEstimation(opt.value)}
                        className={cn(
                          "p-3 rounded-lg border text-sm text-left transition-all",
                          boxEstimation === opt.value
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border bg-white hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">紙箱數量與車數高度相關，40個白箱子≈ 1車</p>
                </div>

                {/* 物品過濾模式切換 + 輸入 */}
                <div>
                  <Label className="font-semibold mb-2 block">物品搬運範圍（選填）</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={itemFilterMode === "exclude" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setItemFilterMode("exclude")}
                      className={itemFilterMode === "exclude" ? "bg-[#D4A574] hover:bg-[#C4956A] text-white" : ""}
                    >
                      排除不搬的
                    </Button>
                    <Button
                      type="button"
                      variant={itemFilterMode === "only" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setItemFilterMode("only")}
                      className={itemFilterMode === "only" ? "bg-[#D4A574] hover:bg-[#C4956A] text-white" : ""}
                    >
                      只搬這些
                    </Button>
                  </div>
                  {itemFilterMode === "exclude" ? (
                    <>
                      <Textarea
                        placeholder="請列出不需要搬運的物品，例如：電視櫃不搬、舊沙發不要、大型書櫃留給房東..."
                        value={notMovingItems}
                        onChange={(e) => setNotMovingItems(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">AI 將排除這些物品不計入車數</p>
                    </>
                  ) : (
                    <>
                      <Textarea
                        placeholder="請列出只需要搬運的物品，例如：麻將桌、Dyson 空氣清淨機..."
                        value={onlyMovingItems}
                        onChange={(e) => setOnlyMovingItems(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">照片中只會計算您列出的物品，其他全部忽略</p>
                    </>
                  )}
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">其他備註</Label>
                  <Textarea
                    placeholder="例如：特殊物品說明、動線狀況、停車位置..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />上一步
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
                    onClick={() => setStep(3)}
                  >
                    下一步：上傳照片<ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3 - Room-based Photo Upload */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />上傳各空間照片
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-secondary border border-border rounded-lg p-3 text-sm text-muted-foreground space-y-1">
                  <p className="font-semibold">拍照建議：</p>
                  <ul className="space-y-0.5 text-xs">
                    <li>• 每個空間拍 2-4 張，涵蓋四個角落</li>
                    <li>• 確保光線充足，物品清晰可見</li>
                    <li>• 大型傢俱（沙發、床、衣櫃）要入鏡</li>
                    <li>• 請上傳室內照片，非室內照片 AI 將無法辨識</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">已上傳照片</span>
                    <span className={cn("font-bold", totalPhotoCount > 0 ? "text-primary" : "text-muted-foreground")}>
                    {totalPhotoCount} 張
                  </span>
                </div>

                {activeRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    請先在上一步設定房型格局
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRooms.map((roomKey) => {
                      const photos = roomPhotos[roomKey] ?? [];
                      const count = roomLayout[roomKey];
                      return (
                        <div key={roomKey} className="border border-border rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-2 font-semibold text-sm">
                              {roomIcons[roomKey]}
                              {roomLabels[roomKey]}
                              {count > 1 && <span className="text-xs text-muted-foreground">x{count}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {photos.length > 0 && (
                                <Badge className="bg-brand/10 text-brand border-brand/20 text-xs">
                                  {photos.length} 張
                                </Badge>
                              )}
                              <button
                                onClick={() => fileInputRefs.current[roomKey]?.click()}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                                disabled={photos.length >= MAX_PHOTOS_PER_ROOM}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {photos.length === 0 ? "上傳照片" : "新增"}
                              </button>
                              <input
                                ref={(el) => { fileInputRefs.current[roomKey] = el; }}
                                type="file"
                                accept={IMAGE_TYPES}
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && handleRoomPhotoSelect(roomKey, e.target.files)}
                              />
                            </div>
                          </div>

                          {photos.length > 0 ? (
                            <div className="p-3">
                              <div className="grid grid-cols-3 gap-2">
                                {photos.map((entry, i) => (
                                  <div key={i} className="relative group aspect-square">
                                    <img
                                      src={entry.previewUrl}
                                      alt={`${roomLabels[roomKey]} ${i + 1}`}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    <div className="absolute top-2 left-2 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                      {i + 1}
                                    </div>
                                    <button
                                      onClick={() => removeRoomPhoto(roomKey, i)}
                                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {photos.length < MAX_PHOTOS_PER_ROOM && (
                                  <button
                                    onClick={() => fileInputRefs.current[roomKey]?.click()}
                                    className="aspect-square border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all relative"
                                  >
                                    <Upload className="w-5 h-5 text-primary/50" />
                                    <span className="text-xs text-primary/50">新增</span>
                                    {photos.length > 0 && (
                                      <span className="absolute top-1 right-1 w-5 h-5 bg-brand text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {photos.length}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => fileInputRefs.current[roomKey]?.click()}
                              className="w-full p-6 flex flex-col items-center gap-2 hover:bg-muted/20 transition-colors"
                            >
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-primary/50" />
                              </div>
                              <p className="text-sm text-muted-foreground">點擊拍攝 {roomLabels[roomKey]} 照片</p>
                              <p className="text-xs text-muted-foreground/60">JPG / PNG，最多 {MAX_PHOTOS_PER_ROOM} 張</p>
                              <p className="text-xs text-brand font-medium mt-2">拍攝後會自動標上數字編號</p>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-secondary border border-border rounded-lg p-3 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  照片僅用於 AI 估價分析，不會對外公開。AI 估價為初步參考，實際費用以估價師評估為準。
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />上一步
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
                    onClick={handleAnalyze}
                    disabled={totalPhotoCount === 0}
                  >
                    <Bot className="w-4 h-4" />
                    {totalPhotoCount === 0 ? "請先上傳照片" : `開始 AI 分析（${totalPhotoCount} 張）`}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4 - AI Analysis */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />AI 智能分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      {isUploading
                        ? <Upload className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        : <Bot className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      }
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isUploading ? "照片上傳中..." : "AI 正在辨識物件..."}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {isUploading
                        ? "正將照片安全儲存至雲端，請勿關閉頁面"
                        : "AI 正在分析每張照片，辨識傢俱與電器..."}
                    </p>
                  </div>
                ) : aiResult ? (
                  <div className="space-y-5">
                    {/* 無效照片警告 */}
                    {aiResult.invalidPhotos && aiResult.invalidPhotos.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />發現非室內照片
                        </h4>
                        <ul className="space-y-1">
                          {aiResult.invalidPhotos.map((msg, i) => (
                            <li key={i} className="text-sm text-red-600">• {msg}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-red-500 mt-2">以上照片未納入估價計算，建議重新上傳室內照片以提升準確度。</p>
                      </div>
                    )}

                    {/* 需人工複核提示 */}
                    {aiResult.needsManualReview && (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-amber-800 text-sm">此案件已標記為「需人工複核」</div>
                          <div className="text-amber-700 text-xs mt-1">估算車數超過 6 車，創勝專員將優先與您聯繫確認實際需求。</div>
                        </div>
                      </div>
                    )}

                    {/* 主要估價結果 */}
                    <div className="bg-gradient-to-br from-brand-dark to-brand rounded-xl p-6 text-white">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5" />
                        <span className="font-bold text-lg">AI 估價結果</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {[
                          { v: aiResult.photoCount, l: "照片數量" },
                          { v: aiResult.furnitureCount, l: "大型傢俱" },
                          { v: aiResult.truckCount, l: "估計車數" },
                        ].map((item) => (
                          <div key={item.l} className="bg-white/20 rounded-lg p-3 text-center">
                            <div className="text-2xl font-black">{item.v}</div>
                            <div className="text-white/80 text-xs">{item.l}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/20 rounded-lg p-4 text-center">
                        <div className="text-xs text-white/70 mb-1">初步估價範圍</div>
                        <div className="text-3xl font-black">
                          NT$ {aiResult.priceRange.min.toLocaleString()} ~ {aiResult.priceRange.max.toLocaleString()}
                        </div>
                        <div className="text-white/70 text-xs mt-1">實際費用以估價師評估為準</div>
                      </div>
                    </div>

                    {/* 辨識物件清單（可展開） */}
                    {aiResult.detectedItems && aiResult.detectedItems.length > 0 && (
                      <div className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setShowItemList((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-bold text-sm flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            辨識物件清單（{aiResult.detectedItems.length} 種）
                          </span>
                          {showItemList
                            ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                            : <Eye className="w-4 h-4 text-muted-foreground" />
                          }
                        </button>
                        {showItemList && (
                          <div className="p-3">
                            <div className="space-y-1.5">
                              {aiResult.detectedItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0 gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-muted-foreground text-xs w-5 text-right flex-shrink-0">{i + 1}.</span>
                                    <span className="font-medium break-words">{item.name}</span>
                                    {item.count > 1 && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">x{item.count}</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">（{item.room}）</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {(item.truckUnit * item.count).toFixed(2)} 車
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-border flex justify-between text-sm font-bold">
                              <span>合計</span>
                              <span className="text-primary">{aiResult.truckCount} 車</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 房間物品摘要 */}
                    {aiResult.roomSummaries.length > 0 && (
                      <div>
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />房間物品摘要
                        </h4>
                        <div className="space-y-2">
                          {aiResult.roomSummaries.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg text-sm min-w-0">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-medium">{s.room}：</span>
                                <span className="text-muted-foreground break-words">{s.items}</span>
                                {s.note && <p className="text-xs text-brand mt-0.5 break-words">{s.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 特殊物品提醒 */}
                    {aiResult.riskItems.length > 0 && (
                      <div className="bg-secondary border border-border rounded-lg p-4">
                        <h4 className="font-bold text-brand-dark mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />特殊物品提醒
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.riskItems.map((item) => (
                            <Badge key={item} className="bg-brand/10 text-brand border-brand/20 break-words">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-secondary border border-border rounded-lg p-3 text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">重要聲明</p>
                      <p className="break-words">{aiResult.estimateNote}</p>
                    </div>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                      onClick={() => setStep(5)}
                    >
                      建立案件，等待專員聯繫<ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </>
          )}

          {/* Step 5 - Create Ticket */}
          {step === 5 && !createTicketMutation.isSuccess && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />建立案件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">填寫聯絡資訊，我們的專員將在 24 小時內與您聯繫確認細節。</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold mb-1.5 block">姓名 <span className="text-red-500">*</span></Label>
                    <Input placeholder="您的姓名" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className={!customerName ? "border-red-300" : ""} />
                  </div>
                  <div>
                    <Label className="font-semibold mb-1.5 block">電話 <span className="text-red-500">*</span></Label>
                    <Input placeholder="09xx-xxx-xxx" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required className={!customerPhone ? "border-red-300" : ""} />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold mb-1.5 block">LINE ID（選填）</Label>
                  <Input placeholder="LINE ID 或 @帳號" value={customerLine} onChange={(e) => setCustomerLine(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold mb-1.5 block">Email（選填，用於接收案件確認信）</Label>
                  <Input type="email" placeholder="example@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
                <div>
                  <Label className="font-semibold mb-1.5 block">預計搬家日期（選填）</Label>
                  <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
                </div>
                {/* 搬離地址 */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <Label className="font-bold text-base block">搬離地址 <span className="text-red-500 text-sm font-normal">（縣市與行政區必填）</span></Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">縣市</Label>
                      <Select value={fromCity} onValueChange={(v) => { setFromCity(v); setFromDistrict(""); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇縣市" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAIWAN_CITIES.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">行政區</Label>
                      <Select value={fromDistrict} onValueChange={setFromDistrict} disabled={!fromCity}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇行政區" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDistrictsByCity(fromCity).map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">詳細地址（選填）</Label>
                    <Input placeholder="路/街/巷/弄/號/樓" value={fromDetail} onChange={(e) => setFromDetail(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">是否有電梯</Label>
                      <Select value={fromHasElevator} onValueChange={setFromHasElevator}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">有電梯</SelectItem>
                          <SelectItem value="no">無電梯（需走樓梯）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {fromHasElevator === "no" && (
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">樓層數</Label>
                      <Select value={fromFloor} onValueChange={(v) => setFromFloor(v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇樓層" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((f) => (
                            <SelectItem key={f} value={String(f)}>{f} 樓</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    )}
                  </div>
                </div>

                {/* 搬入地址 */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <Label className="font-bold text-base block">搬入地址 <span className="text-red-500 text-sm font-normal">（縣市與行政區必填）</span></Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">縣市</Label>
                      <Select value={toCity} onValueChange={(v) => { setToCity(v); setToDistrict(""); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇縣市" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAIWAN_CITIES.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">行政區</Label>
                      <Select value={toDistrict} onValueChange={setToDistrict} disabled={!toCity}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="選擇行政區" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDistrictsByCity(toCity).map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">詳細地址（選填）</Label>
                    <Input placeholder="路/街/巷/弄/號/樓" value={toDetail} onChange={(e) => setToDetail(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1 block">是否有電梯</Label>
                      <Select value={toHasElevator} onValueChange={setToHasElevator}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="請選擇" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">有電梯</SelectItem>
                          <SelectItem value="no">無電梯（需走樓梯）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {toHasElevator === "no" && (
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1 block">樓層數</Label>
                        <Select value={toFloor} onValueChange={(v) => setToFloor(v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇樓層" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((f) => (
                              <SelectItem key={f} value={String(f)}>{f} 樓</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                  您的個人資訊僅用於搬家服務聯繫，不會對外提供或用於其他用途。
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                  onClick={handleCreateTicket}
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" />建立中...</>
                    : <><CheckCircle className="w-4 h-4" />確認建立案件</>
                  }
                </Button>
              </CardContent>
            </>
          )}

          {/* Success */}
          {step === 5 && createTicketMutation.isSuccess && (
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-2xl font-black mb-2">案件已成功建立！</h2>
              <p className="text-muted-foreground mb-2">
                案件編號：<span className="font-bold text-primary">
                  {(createTicketMutation.data as { ticketNo?: string })?.ticketNo ?? "已建立"}
                </span>
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                我們的專員將在 24 小時內透過電話或 LINE 與您聯繫，確認搬家細節並安排估價師評估。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://line.me/R/ti/p/@vvipmoving" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary hover:bg-primary/90 text-white gap-2 w-full sm:w-auto">
                    <MessageCircle className="w-4 h-4" />加入 LINE 即時諮詢
                  </Button>
                </a>
                <a href="tel:02-55740033">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white gap-2 w-full sm:w-auto">
                    <Phone className="w-4 h-4" />立即致電
                  </Button>
                </a>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>AI 估價為初步參考，實際費用以估價師評估為準。如有疑問請直接聯繫客服。</p>
        </div>
      </div>
    </div>
  );
}
