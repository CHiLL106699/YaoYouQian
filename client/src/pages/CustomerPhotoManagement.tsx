/**
 * 會員護照 - 成品照片上傳與管理
 * 讓診所人員上傳術前術後照片到 S3，並記錄到資料庫
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Camera, Upload, Trash2, Eye, Loader2} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";

export default function CustomerPhotoManagement() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [photoType, setPhotoType] = useState<"before" | "after" | "during">("before");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  
  const { tenantId } = useTenant();

  // 查詢客戶列表
  const { data: customersData, isLoading, error } = trpc.customer.list.useQuery({ tenantId, page: 1, pageSize: 100 });
  const customers = customersData?.customers || [];

  // 查詢照片列表
  const { data: photosData, refetch: refetchPhotos } = trpc.customerPhoto.list.useQuery({
    tenantId,
    customerId: selectedCustomerId || undefined,
  });
  const photos = (photosData as any)?.photos || photosData || [];

  // 上傳照片 mutation
  const uploadPhotoMutation = trpc.customerPhoto.create.useMutation({
    onSuccess: () => {
      toast.success("照片上傳成功");
      refetchPhotos();
      resetForm();
    },
    onError: (error) => {
      toast.error(`上傳失敗：${error.message}`);
    },
  });

  // 刪除照片 mutation
  const deletePhotoMutation = trpc.customerPhoto.delete.useMutation({
    onSuccess: () => {
      toast.success("照片已刪除");
      refetchPhotos();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  // 處理照片選擇
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上傳照片到 S3 並儲存到資料庫
  const handleUpload = async () => {
    if (!selectedCustomerId || !photoFile) {
      toast.error("請選擇客戶並上傳照片");
      return;
    }

    setIsUploading(true);

    try {
      // TODO: 實作 S3 上傳邏輯
      // 1. 將 photoFile 上傳到 S3
      // 2. 取得 S3 URL
      const photoUrl = photoPreview!; // 暫時使用 Base64，實際應該上傳到 S3

      await uploadPhotoMutation.mutateAsync({
        tenantId,
        customerId: selectedCustomerId,
        photoUrl,
        photoType,
        notes,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // 重置表單
  const resetForm = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoType("before");
    setNotes("");
  };

  // 刪除照片
  const handleDelete = (photoId: number) => {
    if (confirm("確定要刪除這張照片嗎？")) {
      deletePhotoMutation.mutate({ id: photoId });
    }
  };

  if (isLoading) {

    return (

      <div className="flex items-center justify-center min-h-[60vh]">

        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <span className="ml-2 text-muted-foreground">載入中...</span>

      </div>

    );

  }


  if (error) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">

        <p className="text-destructive">載入資料時發生錯誤</p>

        <p className="text-sm text-muted-foreground">{error.message}</p>

        <Button variant="outline" onClick={() => window.location.reload()}>重試</Button>

      </div>

    );

  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gold mb-2">會員護照</h1>
          <p className="text-muted-foreground">上傳與管理客戶的術前術後照片</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 上傳區塊 */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-gold-solid flex items-center gap-2">
                <Camera className="w-5 h-5" />
                上傳照片
              </CardTitle>
              <CardDescription>選擇客戶並上傳術前術後照片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 選擇客戶 */}
              <div className="space-y-2">
                <Label>選擇客戶</Label>
                <Select
                  value={selectedCustomerId?.toString() || ""}
                  onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇客戶" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 照片類型 */}
              <div className="space-y-2">
                <Label>照片類型</Label>
                <Select
                  value={photoType}
                  onValueChange={(value: "before" | "after" | "during") => setPhotoType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">術前</SelectItem>
                    <SelectItem value="after">術後</SelectItem>
                    <SelectItem value="during">療程中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 上傳照片 */}
              <div className="space-y-2">
                <Label>選擇照片</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="cursor-pointer"
                />
              </div>

              {/* 照片預覽 */}
              {photoPreview && (
                <div className="space-y-2">
                  <Label>預覽</Label>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 備註 */}
              <div className="space-y-2">
                <Label>備註</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例如：療程部位、日期、特殊說明..."
                  rows={3}
                />
              </div>

              {/* 上傳按鈕 */}
              <Button
                onClick={handleUpload}
                disabled={!selectedCustomerId || !photoFile || isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "上傳中..." : "上傳照片"}
              </Button>
            </CardContent>
          </Card>

          {/* 照片列表 */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-gold-solid">照片列表</CardTitle>
              <CardDescription>
                {selectedCustomerId
                  ? `顯示選中客戶的照片`
                  : "選擇客戶以查看照片"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo: any) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={photo.photo_url}
                          alt={`${photo.photo_type} photo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewPhoto(photo.photo_url)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                {photo.photo_type === "before" ? "術前" : photo.photo_type === "after" ? "術後" : "療程中"}
                              </DialogTitle>
                              <DialogDescription>
                                {photo.customers?.name} - {new Date(photo.upload_date).toLocaleDateString('zh-TW')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                              <img
                                src={photo.photo_url}
                                alt="Full size"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {photo.notes && (
                              <div className="text-sm text-muted-foreground">
                                備註：{photo.notes}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {photo.photo_type === "before" ? "術前" : photo.photo_type === "after" ? "術後" : "療程中"}
                        {" · "}
                        {new Date(photo.upload_date).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {selectedCustomerId ? "尚無照片" : "請選擇客戶"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
