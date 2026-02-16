import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Upload, Palette, Globe } from "lucide-react";
// Storage upload will be handled via tRPC API

export default function WhiteLabelSettings() {
  const { tenantId } = useTenant();
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 載入現有設定
  const { data: settings } = trpc.whiteLabel.getSettings.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color || "#000000");
      setCustomDomain(settings.custom_domain || "");
      setLogoUrl(settings.logo_url || "");
    }
  }, [settings]);

  const updateSettings = trpc.whiteLabel.updateSettings.useMutation({
    onSuccess: () => toast.success("白標化設定已更新"),
    onError: (error) => toast.error(`更新失敗：${error.message}`),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("請上傳圖片檔案");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("圖片大小不能超過 2MB");
      return;
    }

    setIsUploading(true);
    try {
      // 將檔案轉換為 Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // TODO: 實作 tRPC uploadLogo API
        // const { url } = await uploadLogoMutation.mutateAsync({ tenantId, base64, mimeType: file.type });
        setLogoUrl(base64); // 暫時使用 Base64 預覽
        toast.success("Logo 上傳成功（暫時储存在本地）");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("讀取檔案失敗");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(`上傳失敗：${error.message}`);
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateSettings.mutate({
      tenantId,
      primaryColor,
      logoUrl: logoUrl || undefined,
      customDomain: customDomain || undefined,
    });
  };

  if (!tenantId) {
    return <div className="container py-8">載入中...</div>;
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-3xl font-bold">白標化設定</h1>
      
      <Card className="p-6">
        <div className="space-y-6">
          {/* Logo 上傳 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Logo 上傳
            </Label>
            {logoUrl && (
              <div className="mb-3">
                <img 
                  src={logoUrl} 
                  alt="Logo Preview" 
                  className="h-20 w-auto object-contain border rounded-md p-2"
                />
              </div>
            )}
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              建議尺寸：200x200 像素，檔案大小不超過 2MB
            </p>
          </div>

          {/* 主要品牌色 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              主要品牌色
            </Label>
            <div className="flex gap-3 items-center">
              <Input 
                type="color" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input 
                type="text" 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          {/* 自訂網域 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              自訂網域
            </Label>
            <Input 
              type="text" 
              value={customDomain} 
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="例如：booking.yourdomain.com"
            />
            <p className="text-sm text-muted-foreground">
              請先在您的網域提供商設定 CNAME 記錄指向我們的伺服器
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending || isUploading}
            className="w-full"
          >
            {updateSettings.isPending ? "儲存中..." : "儲存設定"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
