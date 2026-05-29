import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import * as XLSX from "xlsx";

interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

const actionColors: Record<string, string> = {
  view: "bg-blue-100 text-blue-800",
  create: "bg-green-100 text-green-800",
  update: "bg-yellow-100 text-yellow-800",
  delete: "bg-red-100 text-red-800",
  export: "bg-purple-100 text-purple-800",
  denied: "bg-red-100 text-red-800",
};

const resourceTypeLabels: Record<string, string> = {
  ticket: "案件",
  sensitive_data: "敏感資料",
  chat_message: "聊天訊息",
  audit_log: "審計日誌",
};

export function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    pageSize: 50,
  });

  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const { data, isLoading } = trpc.admin.auditLogs.useQuery({
    action: filters.action,
    resourceType: filters.resourceType,
    dateFrom: dateFromInput,
    dateTo: dateToInput,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / filters.pageSize);

  const handleExportExcel = () => {
    if (!logs || logs.length === 0) {
      alert("沒有資料可匯出");
      return;
    }

    const exportData = logs.map((log: any) => ({
      時間: format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss", { locale: zhTW }),
      用戶: log.userName,
      操作: log.action,
      資源類型: resourceTypeLabels[log.resourceType] || log.resourceType,
      資源ID: log.resourceId,
      IP地址: log.ipAddress,
      狀態: log.status,
      原始值: log.oldValue || "-",
      新值: log.newValue || "-",
      原因: log.reason || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "審計日誌");
    XLSX.writeFile(wb, `audit-logs-${format(new Date(), "yyyyMMdd-HHmmss")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">審計日誌</h2>
        <Button onClick={handleExportExcel} variant="outline">
          匯出 Excel
        </Button>
      </div>

      {/* 篩選區 */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 操作類型篩選 */}
          <div>
            <label className="text-sm font-medium mb-2 block">操作類型</label>
            <Select
              value={filters.action || ""}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="全部操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部操作</SelectItem>
                <SelectItem value="view">查看</SelectItem>
                <SelectItem value="create">建立</SelectItem>
                <SelectItem value="update">更新</SelectItem>
                <SelectItem value="delete">刪除</SelectItem>
                <SelectItem value="export">匯出</SelectItem>
                <SelectItem value="denied">拒絕</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 資源類型篩選 */}
          <div>
            <label className="text-sm font-medium mb-2 block">資源類型</label>
            <Select
              value={filters.resourceType || ""}
              onValueChange={(value) =>
                setFilters({ ...filters, resourceType: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="全部類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部類型</SelectItem>
                <SelectItem value="ticket">案件</SelectItem>
                <SelectItem value="sensitive_data">敏感資料</SelectItem>
                <SelectItem value="chat_message">聊天訊息</SelectItem>
                <SelectItem value="audit_log">審計日誌</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 開始日期 */}
          <div>
            <label className="text-sm font-medium mb-2 block">開始日期</label>
            <Input
              type="date"
              value={dateFromInput}
              onChange={(e) => {
                setDateFromInput(e.target.value);
                setFilters({ ...filters, page: 1 });
              }}
            />
          </div>

          {/* 結束日期 */}
          <div>
            <label className="text-sm font-medium mb-2 block">結束日期</label>
            <Input
              type="date"
              value={dateToInput}
              onChange={(e) => {
                setDateToInput(e.target.value);
                setFilters({ ...filters, page: 1 });
              }}
            />
          </div>

          {/* 重置按鈕 */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ page: 1, pageSize: 50 });
                setDateFromInput("");
                setDateToInput("");
              }}
              className="w-full"
            >
              重置
            </Button>
          </div>
        </div>
      </Card>

      {/* 結果統計 */}
      <div className="text-sm text-gray-600">
        共找到 <span className="font-bold">{total}</span> 筆記錄
      </div>

      {/* 表格 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-40">時間</TableHead>
                <TableHead className="w-24">用戶</TableHead>
                <TableHead className="w-20">操作</TableHead>
                <TableHead className="w-24">資源類型</TableHead>
                <TableHead className="w-16">資源ID</TableHead>
                <TableHead className="w-32">IP地址</TableHead>
                <TableHead className="w-16">狀態</TableHead>
                <TableHead className="w-32">詳情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    載入中...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    沒有符合條件的記錄
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss", {
                        locale: zhTW,
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-800"}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {resourceTypeLabels[log.resourceType] || log.resourceType}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{log.resourceId}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-600">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={log.status === "success" ? "default" : "destructive"}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.reason && (
                        <div className="text-gray-600 truncate" title={log.reason}>
                          {log.reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            第 {filters.page} / {totalPages} 頁
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              disabled={filters.page === totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
