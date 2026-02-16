import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, Plus, Edit, Trash2 } from "lucide-react";

export default function CustomerManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  const { data, isLoading, refetch } = trpc.customer.list.useQuery({ 
    tenantId, 
    page, 
    pageSize: 20, 
    search: search || undefined 
  });
  
  const createMut = trpc.customer.create.useMutation({
    onSuccess: () => {
      toast.success("客戶新增成功");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => toast.error(`新增失敗：${error.message}`),
  });
  
  const updateMut = trpc.customer.update.useMutation({
    onSuccess: () => {
      toast.success("客戶更新成功");
      setEditingCustomer(null);
      refetch();
    },
    onError: (error) => toast.error(`更新失敗：${error.message}`),
  });
  
  const deleteMut = trpc.customer.delete.useMutation({
    onSuccess: () => {
      toast.success("客戶刪除成功");
      refetch();
    },
    onError: (error) => toast.error(`刪除失敗：${error.message}`),
  });
  
  const items: any[] = data?.customers || [];
  
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMut.mutate({
      tenantId,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || undefined,
      memberLevel: (formData.get('memberLevel') as string) || undefined,
    });
  };
  
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMut.mutate({
      customerId: editingCustomer.id,
      tenantId,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || undefined,
      memberLevel: (formData.get('memberLevel') as string) || undefined,
    });
  };
  
  const handleDelete = (customerId: number) => {
    if (confirm('確定要刪除此客戶嗎？')) {
      deleteMut.mutate({ customerId, tenantId });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          客戶管理
        </h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增客戶
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增客戶</DialogTitle>
              <DialogDescription>填寫客戶基本資料</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="phone">電話 *</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="memberLevel">會員等級</Label>
                <Input id="memberLevel" name="memberLevel" placeholder="一般" />
              </div>
              <Button type="submit" disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "新增中..." : "確認新增"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="搜尋客戶..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>會員等級</TableHead>
                <TableHead>累計消費</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">載入中...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    尚無客戶
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>{c.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.member_level || "一般"}</Badge>
                    </TableCell>
                    <TableCell>NT$ {(c.total_spent || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingCustomer(c)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {(data?.total || 0) > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            上一頁
          </Button>
          <span className="py-2 px-3 text-sm">第 {page} 頁</span>
          <Button variant="outline" size="sm" disabled={items.length < 20} onClick={() => setPage(p => p + 1)}>
            下一頁
          </Button>
        </div>
      )}
      
      {/* 編輯對話框 */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯客戶</DialogTitle>
            <DialogDescription>修改客戶基本資料</DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">姓名 *</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={editingCustomer.name} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">電話 *</Label>
                <Input 
                  id="edit-phone" 
                  name="phone" 
                  defaultValue={editingCustomer.phone} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  name="email" 
                  type="email" 
                  defaultValue={editingCustomer.email || ''} 
                />
              </div>
              <div>
                <Label htmlFor="edit-memberLevel">會員等級</Label>
                <Input 
                  id="edit-memberLevel" 
                  name="memberLevel" 
                  defaultValue={editingCustomer.member_level || '一般'} 
                />
              </div>
              <Button type="submit" disabled={updateMut.isPending} className="w-full">
                {updateMut.isPending ? "更新中..." : "確認更新"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
