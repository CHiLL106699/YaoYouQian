import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AftercareContentManagement() {
  const { tenantId } = useTenant();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    treatmentName: "",
    category: "general",
    description: "",
    instructions: [""],
    imageUrl: "",
  });

  const { data: contents, refetch } = trpc.aftercareContent.list.useQuery(
    { tenantId },
    { enabled: tenantId > 0 }
  );

  const createMutation = trpc.aftercareContent.create.useMutation({
    onSuccess: () => { toast.success("衛教內容已新增"); refetch(); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = trpc.aftercareContent.update.useMutation({
    onSuccess: () => { toast.success("衛教內容已更新"); refetch(); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = trpc.aftercareContent.delete.useMutation({
    onSuccess: () => { toast.success("已刪除"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ treatmentName: "", category: "general", description: "", instructions: [""], imageUrl: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(item: any) {
    setForm({
      treatmentName: item.treatment_name,
      category: item.category || "general",
      description: item.description || "",
      instructions: Array.isArray(item.instructions) ? item.instructions : [""],
      imageUrl: item.image_url || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.treatmentName.trim()) { toast.error("請輸入療程名稱"); return; }
    const instructions = form.instructions.filter((i) => i.trim());
    if (instructions.length === 0) { toast.error("請至少輸入一項護理須知"); return; }

    if (editingId) {
      updateMutation.mutate({
        id: editingId, tenantId, treatmentName: form.treatmentName,
        category: form.category, description: form.description,
        instructions, imageUrl: form.imageUrl || undefined,
      });
    } else {
      createMutation.mutate({
        tenantId, treatmentName: form.treatmentName,
        category: form.category, description: form.description,
        instructions, imageUrl: form.imageUrl || undefined,
      });
    }
  }

  function addInstruction() {
    setForm({ ...form, instructions: [...form.instructions, ""] });
  }

  function updateInstruction(idx: number, value: string) {
    const updated = [...form.instructions];
    updated[idx] = value;
    setForm({ ...form, instructions: updated });
  }

  function removeInstruction(idx: number) {
    setForm({ ...form, instructions: form.instructions.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">衛教內容管理</h1>
          <p className="text-muted-foreground">管理術後護理衛教圖卡內容，LINE Bot 會自動使用這些內容回覆客人</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>新增衛教內容</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "編輯衛教內容" : "新增衛教內容"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>療程名稱</Label>
                <Input value={form.treatmentName} onChange={(e) => setForm({ ...form, treatmentName: e.target.value })} placeholder="例：玻尿酸注射" />
              </div>
              <div>
                <Label>分類</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="例：注射類、雷射類" />
              </div>
            </div>
            <div>
              <Label>說明</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="簡短說明此衛教內容" />
            </div>
            <div>
              <Label>圖片 URL（選填）</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>護理須知（LINE 圖卡會顯示這些項目）</Label>
              <div className="space-y-2 mt-2">
                {form.instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-sm text-muted-foreground mt-2">{idx + 1}.</span>
                    <Input value={inst} onChange={(e) => updateInstruction(idx, e.target.value)} placeholder="輸入護理須知..." />
                    {form.instructions.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeInstruction(idx)}>✕</Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addInstruction}>+ 新增項目</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "更新" : "新增"}
              </Button>
              <Button variant="outline" onClick={resetForm}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {contents?.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.treatment_name}</h3>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">{item.category}</span>
                    {!item.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已停用</span>}
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  <div className="mt-2 space-y-1">
                    {(Array.isArray(item.instructions) ? item.instructions : []).map((inst: string, idx: number) => (
                      <p key={idx} className="text-sm">
                        <span className="text-pink-500 mr-1">{idx + 1}.</span>{inst}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>編輯</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: item.id, tenantId })}>刪除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!contents || contents.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              尚未建立衛教內容。點擊「新增衛教內容」開始設定，LINE Bot 會自動使用這些內容回覆客人。
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
