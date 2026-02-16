/**
 * VoucherManagement.tsx
 * 票券系統管理頁面
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function VoucherManagement() {
  const [tenantId] = useState(1); // TODO: 從 context 取得
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 查詢票券列表
  const { data: vouchersData, refetch } = trpc.voucher.list.useQuery({
    tenantId,
    page,
    limit: 20,
  });

  // 查詢票券統計
  const { data: stats } = trpc.voucher.stats.useQuery({ tenantId });

  // 建立票券
  const createVoucher = trpc.voucher.create.useMutation({
    onSuccess: () => {
      toast.success('票券建立成功');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`票券建立失敗：${error.message}`);
    },
  });

  // 核銷票券
  const redeemVoucher = trpc.voucher.redeem.useMutation({
    onSuccess: () => {
      toast.success('票券核銷成功');
      refetch();
    },
    onError: (error) => {
      toast.error(`票券核銷失敗：${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    voucherCode: '',
    voucherType: 'discount' as 'service' | 'product' | 'discount',
    discountValue: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
  });

  const handleCreateVoucher = () => {
    createVoucher.mutate({
      tenantId,
      ...formData,
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">票券管理</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>建立票券</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立新票券</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>票券代碼</Label>
                <Input
                  value={formData.voucherCode}
                  onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value })}
                  placeholder="例如：SUMMER2024"
                />
              </div>
              <div>
                <Label>票券類型</Label>
                <Select
                  value={formData.voucherType}
                  onValueChange={(value: any) => setFormData({ ...formData, voucherType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">折扣券</SelectItem>
                    <SelectItem value="service">服務券</SelectItem>
                    <SelectItem value="product">商品券</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>折扣金額</Label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>有效期限（開始）</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>有效期限（結束）</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div>
                <Label>使用次數上限</Label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                />
              </div>
              <Button onClick={handleCreateVoucher} className="w-full">
                建立票券
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 票券統計 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>總票券數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_vouchers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>有效票券</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.active_vouchers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>總使用次數</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total_usage || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* 票券列表 */}
      <Card>
        <CardHeader>
          <CardTitle>票券列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vouchersData?.vouchers.map((voucher: any) => (
              <div key={voucher.id} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <p className="font-bold">{voucher.voucher_code}</p>
                  <p className="text-sm text-muted-foreground">
                    類型：{voucher.voucher_type} | 折扣：${voucher.discount_value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    有效期限：{voucher.valid_from} ~ {voucher.valid_until}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    使用次數：{voucher.usage_count} / {voucher.usage_limit || '無限制'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const customerId = prompt('請輸入客戶 ID');
                    if (customerId) {
                      redeemVoucher.mutate({
                        tenantId,
                        voucherCode: voucher.voucher_code,
                        customerId: Number(customerId),
                      });
                    }
                  }}
                  disabled={!voucher.is_active}
                >
                  核銷
                </Button>
              </div>
            ))}
          </div>

          {/* 分頁 */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
              上一頁
            </Button>
            <span className="flex items-center px-4">
              第 {page} 頁 / 共 {Math.ceil((vouchersData?.total || 0) / 20)} 頁
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil((vouchersData?.total || 0) / 20)}
              variant="outline"
            >
              下一頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
