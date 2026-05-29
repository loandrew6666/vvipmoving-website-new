import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Search,
  Eye,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  FileText,
  AlertCircle,
  LogOut,
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

const SOURCE_LABELS: Record<string, string> = {
  ai_estimate: "AI 估價",
  contact_form: "聯絡表單",
  phone: "電話",
  line: "LINE",
};

const REGION_LABELS: Record<string, string> = {
  taipei: "台北",
  kaohsiung: "高雄",
};

// 未讀訊息計數組件
function UnreadChatCountCell({ ticketId }: { ticketId: number }) {
  const { data: unreadCount } = trpc.admin.getUnreadChatCount.useQuery(
    { ticketId },
    { refetchInterval: 5000 }
  );

  if (!unreadCount || unreadCount === 0) {
    return <TableCell className="text-center text-gray-400">-</TableCell>;
  }

  return (
    <TableCell className="text-center">
      <Badge className="bg-red-500 hover:bg-red-600">
        {unreadCount} 未讀
      </Badge>
    </TableCell>
  );
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "updated">("newest");
  const [activeTab, setActiveTab] = useState<"tickets" | "audit">("tickets");

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: ticketsData, isLoading } = trpc.admin.listTickets.useQuery(
    statusFilter !== "all"
      ? { status: statusFilter as any, search: search || undefined }
      : { search: search || undefined },
    { refetchInterval: 30000 }
  );
  
  // 從分頁結果中取出資料
  const tickets = ticketsData?.data ? [...ticketsData.data].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  }) : [];
  const totalTickets = ticketsData?.total ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">需要登入</h2>
            <p className="text-gray-500 text-sm mb-4">請先登入才能訪問後台管理系統</p>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = getLoginUrl()} 
                className="flex-1 bg-brand hover:bg-brand-dark"
              >
                登入
              </Button>
              <Button 
                onClick={() => setLocation("/")} 
                variant="outline"
                className="flex-1"
              >
                返回首頁
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">權限不足</h2>
            <p className="text-gray-500 text-sm mb-4">您的帳號沒有後台管理權限，請聯繫管理員</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { label: "全部案件", value: stats?.total ?? 0, icon: ClipboardList, color: "text-gray-700", bg: "bg-gray-50" },
    { label: "新進線", value: stats?.new ?? 0, icon: AlertCircle, color: "text-brand", bg: "bg-secondary" },
    { label: "待聯繫", value: stats?.pending ?? 0, icon: Clock, color: "text-brand-dark", bg: "bg-brand/10" },
    { label: "已報價", value: stats?.quoted ?? 0, icon: FileText, color: "text-brand-dark", bg: "bg-secondary" },
    { label: "已簽約", value: stats?.contracted ?? 0, icon: Users, color: "text-brand", bg: "bg-brand/10" },
    { label: "已完成", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-gray-600", bg: "bg-gray-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導覽列 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">創勝包裝 後台管理</h1>
              <p className="text-xs text-gray-500">VVIP Moving Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.name}（管理員）
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-2 text-gray-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">登出</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className={`cursor-pointer border hover:shadow-md transition-shadow ${card.bg}`}
              onClick={() => setStatusFilter(
                card.label === "全部案件" ? "all" :
                Object.entries(STATUS_LABELS).find(([, v]) => v.label === card.label)?.[0] ?? "all"
              )}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 篩選列 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand" />
              案件管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜尋客戶姓名、電話、案件編號..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="篩選狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部狀態</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className={statusFilter === "pending" ? "bg-brand-dark hover:bg-brand-dark/90" : ""}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  待回覆
                </Button>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">最新建立</SelectItem>
                    <SelectItem value="oldest">最早建立</SelectItem>
                    <SelectItem value="updated">最近更新</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 案件表格 */}
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-32">案件編號</TableHead>
                      <TableHead>客戶姓名</TableHead>
                      <TableHead>聯絡電話</TableHead>
                      <TableHead className="w-20">區域</TableHead>
                      <TableHead className="w-24">來源</TableHead>
                      <TableHead className="w-24">狀態</TableHead>
                      <TableHead className="w-24">未讀訊息</TableHead>
                      <TableHead className="w-32">建立時間</TableHead>
                      <TableHead className="w-16 text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                            載入中...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : !tickets || tickets?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>目前沒有案件資料</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => {
                        const statusInfo = STATUS_LABELS[ticket.status] ?? { label: ticket.status, color: "bg-gray-100 text-gray-600" };
                        return (
                          <TableRow
                            key={ticket.id}
                            className="hover:bg-secondary/50 cursor-pointer transition-colors"
                            onClick={() => setLocation(`/admin/ticket/${ticket.id}`)}
                          >
                            <TableCell className="font-mono text-xs text-gray-600">
                              {ticket.ticketNo}
                            </TableCell>
                            <TableCell className="font-medium text-gray-900">
                              {ticket.customerName}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {ticket.customerPhone}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {REGION_LABELS[ticket.region] ?? ticket.region}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-gray-500">
                                {SOURCE_LABELS[ticket.source ?? ""] ?? ticket.source ?? "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <UnreadChatCountCell ticketId={ticket.id} />
                            <TableCell className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString("zh-TW", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/admin/ticket/${ticket.id}`);
                                }}
                              >
                                <Eye className="w-4 h-4 text-brand" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            {tickets && tickets.length > 0 && (
              <p className="text-xs text-gray-400 text-right">
                共 {tickets.length} 筆案件
              </p>
            )}
          </CardContent>
        </Card>

        {/* 審計日誌面板 */}
        {activeTab === "audit" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                審計日誌
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AuditLogViewer />
            </CardContent>
          </Card>
        )}
      </div>

      {/* 選項卡切換按鈕 */}
      <div className="fixed bottom-6 right-6 flex gap-2 z-50">
        <Button
          variant={activeTab === "tickets" ? "default" : "outline"}
          onClick={() => setActiveTab("tickets")}
          className={activeTab === "tickets" ? "bg-brand hover:bg-brand-dark" : ""}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          案件管理
        </Button>
        <Button
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => setActiveTab("audit")}
          className={activeTab === "audit" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          <FileText className="w-4 h-4 mr-2" />
          審計日誌
        </Button>
      </div>
    </div>
  );
}
