/**
 * LIFF 同意書簽署頁面
 * 客戶閱讀並簽署療程同意書
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, CheckCircle2, Loader2, Info, PenTool } from "lucide-react";

export default function LiffConsent() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signed, setSigned] = useState<Set<number>>(new Set());

  const { data: forms, isLoading } = trpc.consentForm.list.useQuery(
    { tenantId: Number(tenantId) },
    { enabled: !!tenantId && !isNaN(Number(tenantId)) }
  );

  const formsList = forms && typeof forms === 'object' && 'forms' in (forms as Record<string, unknown>) ? (forms as unknown as { forms: any[] }).forms : (forms as unknown as any[] | undefined);
  const selectedForm = formsList?.find((f: { id: number }) => f.id === selectedFormId);

  const handleSign = () => {
    if (!signatureName.trim()) {
      toast.error("請輸入簽署姓名");
      return;
    }
    if (!agreed) {
      toast.error("請先勾選同意");
      return;
    }
    if (selectedFormId) {
      setSigned(prev => new Set(prev).add(selectedFormId));
    }
    toast.success("同意書簽署完成");
    setSelectedFormId(null);
    setAgreed(false);
    setSignatureName("");
  };

  if (!tenantId || isNaN(Number(tenantId))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Info className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">同意書簽署</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : !formsList || formsList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>目前沒有需要簽署的同意書</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formsList.map((form: { id: number; name: string; description?: string }) => (
            <Card
              key={form.id}
              className="bg-white/5 border-amber-400/20 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => { setSelectedFormId(form.id); setAgreed(false); setSignatureName(""); }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-400/70" />
                  <div>
                    <p className="text-white font-medium">{form.name}</p>
                    {form.description && <p className="text-gray-400 text-sm">{form.description}</p>}
                  </div>
                </div>
                {signed.has(form.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <PenTool className="h-5 w-5 text-amber-400/50" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Consent Form Dialog */}
      <Dialog open={!!selectedFormId} onOpenChange={() => setSelectedFormId(null)}>
        <DialogContent className="bg-[#0f1d35] border-amber-400/30 text-white max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-amber-400">{selectedForm?.name || "同意書"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 text-sm text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
              {(selectedForm as { content?: string })?.content || "同意書內容載入中..."}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="border-amber-400/50 data-[state=checked]:bg-amber-500"
              />
              <label htmlFor="agree" className="text-sm text-gray-300 cursor-pointer">
                本人已詳細閱讀並了解上述同意書內容，同意接受相關療程及處置。
              </label>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">簽署姓名</label>
              <Input
                value={signatureName}
                onChange={e => setSignatureName(e.target.value)}
                placeholder="請輸入您的姓名"
                className="bg-white/10 border-amber-400/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              disabled={!agreed || !signatureName.trim()}
              onClick={handleSign}
            >
              <PenTool className="h-4 w-4 mr-2" />
              確認簽署
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
