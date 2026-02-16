import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';

export default function ServiceManagement() {
  const [tenantId] = useState(1); // TODO: 從認證系統取得
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const { data: services, isLoading, refetch } = trpc.service.list.useQuery({ tenantId });
  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      toast.success('服務項目建立成功');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });
  const updateMutation = trpc.service.update.useMutation({
    onSuccess: () => {
      toast.success('服務項目更新成功');
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });
  const deleteMutation = trpc.service.delete.useMutation({
    onSuccess: () => {
      toast.success('服務項目刪除成功');
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });
  const toggleStatusMutation = trpc.service.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success('狀態更新成功');
      refetch();
    },
    onError: (error) => {
      toast.error(`狀態更新失敗：${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      tenantId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      duration: Number(formData.get('duration')),
      category: formData.get('category') as string,
      imageUrl: formData.get('imageUrl') as string || null,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      tenantId,
      serviceId: selectedService.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      duration: Number(formData.get('duration')),
      category: formData.get('category') as string,
      imageUrl: formData.get('imageUrl') as string || null,
    });
  };

  const handleDelete = (serviceId: number) => {
    if (confirm('確定要刪除此服務項目嗎？')) {
      deleteMutation.mutate({ tenantId, serviceId });
    }
  };

  const handleToggleStatus = (serviceId: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ tenantId, serviceId, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] flex items-center justify-center">
        <div className="text-[#d4af37] text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2942] to-[#1e4976] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#d4af37]">服務項目管理</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#d4af37] text-[#0a1929] hover:bg-[#f4cf57]">
                <Plus className="mr-2 h-4 w-4" />
                新增服務項目
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f2942] border-[#d4af37]">
              <DialogHeader>
                <DialogTitle className="text-[#d4af37]">新增服務項目</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#d4af37]">服務名稱</Label>
                  <Input id="name" name="name" required className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <div>
                  <Label htmlFor="category" className="text-[#d4af37]">服務分類</Label>
                  <Select name="category" required>
                    <SelectTrigger className="bg-[#0a1929] border-[#d4af37] text-white">
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f2942] border-[#d4af37]">
                      <SelectItem value="美容護理">美容護理</SelectItem>
                      <SelectItem value="醫學美容">醫學美容</SelectItem>
                      <SelectItem value="身體療程">身體療程</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description" className="text-[#d4af37]">服務描述</Label>
                  <Textarea id="description" name="description" className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-[#d4af37]">價格（元）</Label>
                    <Input id="price" name="price" type="number" required className="bg-[#0a1929] border-[#d4af37] text-white" />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-[#d4af37]">時長（分鐘）</Label>
                    <Input id="duration" name="duration" type="number" required className="bg-[#0a1929] border-[#d4af37] text-white" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="imageUrl" className="text-[#d4af37]">圖片網址（選填）</Label>
                  <Input id="imageUrl" name="imageUrl" placeholder="https://..." className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <Button type="submit" className="w-full bg-[#d4af37] text-[#0a1929] hover:bg-[#f4cf57]" disabled={createMutation.isPending}>
                  {createMutation.isPending ? '建立中...' : '建立服務項目'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service: any) => (
            <Card key={service.id} className="bg-[#0f2942] border-[#d4af37] p-6">
              {service.imageUrl && (
                <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover rounded-lg mb-4" />
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-[#d4af37]">{service.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                  {service.isActive ? '啟用' : '停用'}
                </span>
              </div>
              <p className="text-sm text-[#d4af37] mb-2">{service.category}</p>
              <p className="text-white mb-4">{service.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#d4af37] font-bold">NT$ {service.price}</span>
                <span className="text-white text-sm">{service.duration} 分鐘</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a1929]"
                  onClick={() => {
                    setSelectedService(service);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  編輯
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a1929]"
                  onClick={() => handleToggleStatus(service.id, service.isActive)}
                >
                  {service.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* 編輯對話框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#0f2942] border-[#d4af37]">
            <DialogHeader>
              <DialogTitle className="text-[#d4af37]">編輯服務項目</DialogTitle>
            </DialogHeader>
            {selectedService && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-[#d4af37]">服務名稱</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedService.name} required className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-[#d4af37]">服務分類</Label>
                  <Select name="category" defaultValue={selectedService.category} required>
                    <SelectTrigger className="bg-[#0a1929] border-[#d4af37] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f2942] border-[#d4af37]">
                      <SelectItem value="美容護理">美容護理</SelectItem>
                      <SelectItem value="醫學美容">醫學美容</SelectItem>
                      <SelectItem value="身體療程">身體療程</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-[#d4af37]">服務描述</Label>
                  <Textarea id="edit-description" name="description" defaultValue={selectedService.description} className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price" className="text-[#d4af37]">價格（元）</Label>
                    <Input id="edit-price" name="price" type="number" defaultValue={selectedService.price} required className="bg-[#0a1929] border-[#d4af37] text-white" />
                  </div>
                  <div>
                    <Label htmlFor="edit-duration" className="text-[#d4af37]">時長（分鐘）</Label>
                    <Input id="edit-duration" name="duration" type="number" defaultValue={selectedService.duration} required className="bg-[#0a1929] border-[#d4af37] text-white" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-imageUrl" className="text-[#d4af37]">圖片網址（選填）</Label>
                  <Input id="edit-imageUrl" name="imageUrl" defaultValue={selectedService.imageUrl || ''} placeholder="https://..." className="bg-[#0a1929] border-[#d4af37] text-white" />
                </div>
                <Button type="submit" className="w-full bg-[#d4af37] text-[#0a1929] hover:bg-[#f4cf57]" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? '更新中...' : '更新服務項目'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
