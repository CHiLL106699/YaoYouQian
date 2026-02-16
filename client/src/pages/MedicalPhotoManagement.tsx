/**
 * EMR 影像管理頁面
 * - 照片列表（按患者、類型篩選）
 * - 上傳照片（術前 / 術後 / 進度）
 * - Before/After 對比檢視
 */
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Camera, Upload, Trash2, Eye, RefreshCw, Image, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

const photoTypeLabels: Record<string, { label: string; color: string }> = {
  before: { label: "術前", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  after: { label: "術後", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  progress: { label: "進度", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export default function MedicalPhotoManagement() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState({
    patientId: "",
    photoType: "before" as "before" | "after" | "progress",
    photoUrl: "",
    photoCategory: "",
    notes: "",
  });
  const tenantId = 1; // TODO: 從 context 取得

  // 查詢照片列表
  const photosQuery = trpc.medicalPhoto.list.useQuery({
    tenantId,
    patientId: selectedPatientId !== "all" ? Number(selectedPatientId) : undefined,
    photoType: selectedType !== "all" ? selectedType as any : undefined,
  });

  // 查詢客戶列表
  const customersQuery = trpc.customer.list.useQuery({ tenantId });

  // Before/After 配對
  const compareQuery = trpc.medicalPhoto.getBeforeAfterPairs.useQuery(
    {
      tenantId,
      patientId: selectedPatientId !== "all" ? Number(selectedPatientId) : 0,
    },
    { enabled: showCompareDialog && selectedPatientId !== "all" }
  );

  // 新增照片
  const createMutation = trpc.medicalPhoto.create.useMutation({
    onSuccess: () => {
      toast.success("照片已上傳");
      setShowUploadDialog(false);
      setUploadData({ patientId: "", photoType: "before", photoUrl: "", photoCategory: "", notes: "" });
      photosQuery.refetch();
    },
    onError: (err) => toast.error(`上傳失敗: ${err.message}`),
  });

  // 刪除照片
  const deleteMutation = trpc.medicalPhoto.delete.useMutation({
    onSuccess: () => {
      toast.success("照片已刪除");
      photosQuery.refetch();
    },
    onError: (err) => toast.error(`刪除失敗: ${err.message}`),
  });

  const handleUpload = () => {
    if (!uploadData.patientId || !uploadData.photoUrl) {
      toast.error("請填寫必要欄位");
      return;
    }
    createMutation.mutate({
      tenantId,
      patientId: Number(uploadData.patientId),
      photoType: uploadData.photoType,
      photoUrl: uploadData.photoUrl,
      photoCategory: uploadData.photoCategory || undefined,
      notes: uploadData.notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("確定要刪除此照片嗎？")) {
      deleteMutation.mutate({ id, tenantId });
    }
  };

  const photos = photosQuery.data || [];
  const customers = (customersQuery.data as any)?.customers || customersQuery.data || [];
  const beforePhotos = compareQuery.data?.beforePhotos || [];
  const afterPhotos = compareQuery.data?.afterPhotos || [];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-6 w-6" />
            影像病歷管理
          </h1>
          <p className="text-muted-foreground mt-1">管理術前術後照片與影像記錄</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCompareDialog(true)}
            disabled={selectedPatientId === "all"}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Before/After 對比
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上傳照片
          </Button>
        </div>
      </div>

      {/* 篩選 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">患者</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="全部患者" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部患者</SelectItem>
                  {(Array.isArray(customers) ? customers : []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Label className="text-xs text-muted-foreground mb-1 block">照片類型</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="全部類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="before">術前</SelectItem>
                  <SelectItem value="after">術後</SelectItem>
                  <SelectItem value="progress">進度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="icon" onClick={() => photosQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 照片網格 */}
      <Card>
        <CardHeader>
          <CardTitle>照片列表</CardTitle>
          <CardDescription>共 {photos.length} 張照片</CardDescription>
        </CardHeader>
        <CardContent>
          {photosQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mb-4" />
              <p>尚無照片記錄</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo: any) => {
                const typeInfo = photoTypeLabels[photo.photo_type] || photoTypeLabels.progress;
                return (
                  <div key={photo.id} className="group relative rounded-lg overflow-hidden border bg-muted">
                    <div className="aspect-square relative">
                      <img
                        src={photo.photo_url}
                        alt={photo.notes || "醫療照片"}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23f3f4f6' width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='12'>無法載入</text></svg>"; }}
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="icon" onClick={() => setViewPhoto(photo.photo_url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(photo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          {photo.customers?.name || "未知"}
                        </span>
                        <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      {photo.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{photo.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 上傳照片 Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上傳照片</DialogTitle>
            <DialogDescription>新增醫療影像記錄</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>患者 *</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={uploadData.patientId}
                onChange={(e) => setUploadData({ ...uploadData, patientId: e.target.value })}
              >
                <option value="">請選擇患者</option>
                {(Array.isArray(customers) ? customers : []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>照片類型 *</Label>
              <Select
                value={uploadData.photoType}
                onValueChange={(v) => setUploadData({ ...uploadData, photoType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">術前</SelectItem>
                  <SelectItem value="after">術後</SelectItem>
                  <SelectItem value="progress">進度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>照片 URL *</Label>
              <Input
                placeholder="輸入照片 URL 或上傳後的連結"
                value={uploadData.photoUrl}
                onChange={(e) => setUploadData({ ...uploadData, photoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>分類標籤</Label>
              <Input
                placeholder="例如：臉部、身體"
                value={uploadData.photoCategory}
                onChange={(e) => setUploadData({ ...uploadData, photoCategory: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                placeholder="照片說明..."
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>取消</Button>
              <Button onClick={handleUpload} disabled={createMutation.isPending}>
                {createMutation.isPending ? "上傳中..." : "上傳"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Before/After 對比 Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Before / After 對比</DialogTitle>
            <DialogDescription>術前術後照片比較</DialogDescription>
          </DialogHeader>
          {compareQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (beforePhotos.length === 0 && afterPhotos.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>此患者尚無術前/術後照片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2 text-center">術前 (Before)</h3>
                <div className="space-y-2">
                  {beforePhotos.map((p: any) => (
                    <img
                      key={p.id}
                      src={p.photo_url}
                      alt="術前"
                      className="w-full rounded-lg border"
                    />
                  ))}
                  {beforePhotos.length === 0 && (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      尚無術前照片
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-center">術後 (After)</h3>
                <div className="space-y-2">
                  {afterPhotos.map((p: any) => (
                    <img
                      key={p.id}
                      src={p.photo_url}
                      alt="術後"
                      className="w-full rounded-lg border"
                    />
                  ))}
                  {afterPhotos.length === 0 && (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      尚無術後照片
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 照片全螢幕檢視 */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          {viewPhoto && (
            <img src={viewPhoto} alt="照片檢視" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
