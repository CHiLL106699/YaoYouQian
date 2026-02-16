/**
 * EMR 智能會員影像病歷系統 - 病歷管理頁面
 * - 病歷列表（分頁 + 搜尋）
 * - 新增 / 編輯 / 刪除病歷
 * - 關聯照片與同意書
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Search, Edit, Trash2, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

export default function MedicalRecordManagement() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    diagnosis: "",
    treatmentPlan: "",
    notes: "",
  });
  const { tenantId } = useTenant();

  // 查詢病歷列表
  const recordsQuery = trpc.medicalRecord.list.useQuery({
    tenantId,
    keyword: keyword || undefined,
    page,
    pageSize: 20,
  });

  // 查詢客戶列表（用於選擇患者）
  const customersQuery = trpc.customer.list.useQuery({ tenantId });

  // 新增病歷
  const createMutation = trpc.medicalRecord.create.useMutation({
    onSuccess: () => {
      toast.success("病歷已新增");
      setShowCreateDialog(false);
      resetForm();
      recordsQuery.refetch();
    },
    onError: (err) => toast.error(`新增失敗: ${err.message}`),
  });

  // 更新病歷
  const updateMutation = trpc.medicalRecord.update.useMutation({
    onSuccess: () => {
      toast.success("病歷已更新");
      setShowEditDialog(false);
      recordsQuery.refetch();
    },
    onError: (err) => toast.error(`更新失敗: ${err.message}`),
  });

  // 刪除病歷
  const deleteMutation = trpc.medicalRecord.delete.useMutation({
    onSuccess: () => {
      toast.success("病歷已刪除");
      recordsQuery.refetch();
    },
    onError: (err) => toast.error(`刪除失敗: ${err.message}`),
  });

  const resetForm = () => {
    setFormData({ patientId: "", diagnosis: "", treatmentPlan: "", notes: "" });
  };

  const handleCreate = () => {
    if (!formData.patientId) {
      toast.error("請選擇患者");
      return;
    }
    createMutation.mutate({
      tenantId,
      patientId: Number(formData.patientId),
      diagnosis: formData.diagnosis || undefined,
      treatmentPlan: formData.treatmentPlan || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedRecord) return;
    updateMutation.mutate({
      id: selectedRecord.id,
      tenantId,
      diagnosis: formData.diagnosis || undefined,
      treatmentPlan: formData.treatmentPlan || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("確定要刪除此病歷嗎？此操作無法復原。")) {
      deleteMutation.mutate({ id, tenantId });
    }
  };

  const openEdit = (record: any) => {
    setSelectedRecord(record);
    setFormData({
      patientId: String(record.patient_id),
      diagnosis: record.diagnosis || "",
      treatmentPlan: record.treatment_plan || "",
      notes: record.notes || "",
    });
    setShowEditDialog(true);
  };

  const records = recordsQuery.data?.records || [];
  const total = recordsQuery.data?.total || 0;
  const totalPages = Math.ceil(total / 20);
  const customers = (customersQuery.data as any)?.customers || customersQuery.data || [];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            病歷管理
          </h1>
          <p className="text-muted-foreground mt-1">管理會員的診療記錄與病歷資料</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          新增病歷
        </Button>
      </div>

      {/* 搜尋列 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋診斷、治療計畫、備註..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => recordsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 病歷列表 */}
      <Card>
        <CardHeader>
          <CardTitle>病歷列表</CardTitle>
          <CardDescription>共 {total} 筆病歷</CardDescription>
        </CardHeader>
        <CardContent>
          {recordsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>尚無病歷記錄</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者</TableHead>
                    <TableHead>診斷</TableHead>
                    <TableHead>治療計畫</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: any) => {
                    const patient = record.customers;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {patient?.name || `患者 #${record.patient_id}`}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.diagnosis || "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.treatment_plan || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString("zh-TW")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedRecord(record); setShowDetailDialog(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">第 {page} / {totalPages} 頁</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      上一頁
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 新增病歷 Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增病歷</DialogTitle>
            <DialogDescription>為患者建立新的診療記錄</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>患者 *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              >
                <option value="">請選擇患者</option>
                {(Array.isArray(customers) ? customers : []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || "無電話"})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>診斷</Label>
              <Textarea
                placeholder="輸入診斷內容..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>治療計畫</Label>
              <Textarea
                placeholder="輸入治療計畫..."
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                placeholder="其他備註..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "建立中..." : "建立病歷"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編輯病歷 Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>編輯病歷</DialogTitle>
            <DialogDescription>修改診療記錄</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>診斷</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>治療計畫</Label>
              <Textarea
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>取消</Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "更新中..." : "儲存變更"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 病歷詳情 Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>病歷詳情</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">患者</Label>
                <p className="font-medium">{selectedRecord.customers?.name || `患者 #${selectedRecord.patient_id}`}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">診斷</Label>
                <p className="whitespace-pre-wrap">{selectedRecord.diagnosis || "無"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">治療計畫</Label>
                <p className="whitespace-pre-wrap">{selectedRecord.treatment_plan || "無"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">備註</Label>
                <p className="whitespace-pre-wrap">{selectedRecord.notes || "無"}</p>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>建立: {new Date(selectedRecord.created_at).toLocaleString("zh-TW")}</span>
                <span>更新: {new Date(selectedRecord.updated_at).toLocaleString("zh-TW")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
