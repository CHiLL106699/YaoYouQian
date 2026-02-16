/**
 * 同意書管理頁面
 * - 同意書列表（分頁 + 篩選）
 * - 新增同意書（含電子簽名）
 * - 檢視 / 刪除
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileSignature, Plus, Trash2, Eye, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const formTypes = [
  { value: "general", label: "一般同意書" },
  { value: "surgery", label: "手術同意書" },
  { value: "anesthesia", label: "麻醉同意書" },
  { value: "injection", label: "注射同意書" },
  { value: "laser", label: "雷射同意書" },
  { value: "privacy", label: "隱私權同意書" },
];

export default function ConsentFormManagement() {
  const [formTypeFilter, setFormTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [createData, setCreateData] = useState({
    patientId: "",
    formType: "general",
    witnessName: "",
  });
  const tenantId = 1; // TODO: 從 context 取得

  // 查詢同意書列表
  const formsQuery = trpc.consentForm.list.useQuery({
    tenantId,
    formType: formTypeFilter !== "all" ? formTypeFilter : undefined,
    page,
    pageSize: 20,
  });

  // 查詢客戶列表
  const customersQuery = trpc.customer.list.useQuery({ tenantId });

  // 新增同意書
  const createMutation = trpc.consentForm.create.useMutation({
    onSuccess: () => {
      toast.success("同意書已建立");
      setShowCreateDialog(false);
      setCreateData({ patientId: "", formType: "general", witnessName: "" });
      formsQuery.refetch();
    },
    onError: (err) => toast.error(`建立失敗: ${err.message}`),
  });

  // 刪除同意書
  const deleteMutation = trpc.consentForm.delete.useMutation({
    onSuccess: () => {
      toast.success("同意書已刪除");
      formsQuery.refetch();
    },
    onError: (err) => toast.error(`刪除失敗: ${err.message}`),
  });

  const handleCreate = () => {
    if (!createData.patientId) {
      toast.error("請選擇患者");
      return;
    }
    createMutation.mutate({
      tenantId,
      patientId: Number(createData.patientId),
      formType: createData.formType,
      witnessName: createData.witnessName || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("確定要刪除此同意書嗎？")) {
      deleteMutation.mutate({ id, tenantId });
    }
  };

  const forms = formsQuery.data?.forms || [];
  const total = formsQuery.data?.total || 0;
  const totalPages = Math.ceil(total / 20);
  const customers = (customersQuery.data as any)?.customers || customersQuery.data || [];

  const getFormTypeLabel = (type: string) => {
    return formTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            同意書管理
          </h1>
          <p className="text-muted-foreground mt-1">管理患者的各類醫療同意書</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增同意書
        </Button>
      </div>

      {/* 篩選 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-[200px]">
              <Select value={formTypeFilter} onValueChange={(v) => { setFormTypeFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="同意書類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  {formTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={() => formsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 同意書列表 */}
      <Card>
        <CardHeader>
          <CardTitle>同意書列表</CardTitle>
          <CardDescription>共 {total} 份同意書</CardDescription>
        </CardHeader>
        <CardContent>
          {formsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileSignature className="h-12 w-12 mb-4" />
              <p>尚無同意書記錄</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者</TableHead>
                    <TableHead>同意書類型</TableHead>
                    <TableHead>簽署狀態</TableHead>
                    <TableHead>見證人</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form: any) => {
                    const patient = form.customers;
                    const isSigned = !!form.signed_at;
                    return (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">
                          {patient?.name || `患者 #${form.patient_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getFormTypeLabel(form.form_type)}</Badge>
                        </TableCell>
                        <TableCell>
                          {isSigned ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              已簽署
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              待簽署
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{form.witness_name || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(form.created_at).toLocaleDateString("zh-TW")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedForm(form); setShowDetailDialog(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(form.id)}
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

      {/* 新增同意書 Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增同意書</DialogTitle>
            <DialogDescription>為患者建立新的同意書</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>患者 *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={createData.patientId}
                onChange={(e) => setCreateData({ ...createData, patientId: e.target.value })}
              >
                <option value="">請選擇患者</option>
                {(Array.isArray(customers) ? customers : []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>同意書類型 *</Label>
              <Select
                value={createData.formType}
                onValueChange={(v) => setCreateData({ ...createData, formType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>見證人</Label>
              <Input
                placeholder="見證人姓名"
                value={createData.witnessName}
                onChange={(e) => setCreateData({ ...createData, witnessName: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "建立中..." : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 同意書詳情 Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>同意書詳情</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">患者</Label>
                <p className="font-medium">{selectedForm.customers?.name || "未知"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">同意書類型</Label>
                <p>{getFormTypeLabel(selectedForm.form_type)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">簽署狀態</Label>
                <p>{selectedForm.signed_at ? `已簽署 (${new Date(selectedForm.signed_at).toLocaleString("zh-TW")})` : "待簽署"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">見證人</Label>
                <p>{selectedForm.witness_name || "無"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">建立時間</Label>
                <p>{new Date(selectedForm.created_at).toLocaleString("zh-TW")}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
