/**
 * VoucherManagement.tsx
 * 票券系統管理頁面 — 發行、核銷、統計的完整流程
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Ticket, Plus, CheckCircle2, XCircle, BarChart3, Search } from 'lucide-react';
import { format } from 'date-fns';

const VOUCHER_TYPE_LABELS: Record<string, string> = {
  discount: '折扣券',
  service: '服務券',
  product: '商品券',
};

export default function VoucherManagement() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemCustomerId, setRedeemCustomerId] = useState('');

  // 查詢票券列表
  const { data: vouchersData, refetch, isLoading, error } = trpc.voucher.list.useQuery(
    { tenantId: tenantId!, page, limit: 20 },
    { enabled: !!tenantId }
  );

  // 查詢票券統計
  const { data: stats } = trpc.voucher.stats.useQuery(
    { tenantId: tenantId! },
    { enabled: !!tenantId }
  );

  // 建立票券
  const createVoucher = trpc.voucher.create.useMutation({
    onSuccess: () => {
      toast.success('票券建立成功');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`票券建立失敗：${error.message}`),
  });

  // 核銷票券
  const redeemVoucher = trpc.voucher.redeem.useMutation({
    onSuccess: () => {
      toast.success('票券核銷成功');
      setIsRedeemDialogOpen(false);
      setRedeemCode('');
      setRedeemCustomerId('');
      refetch();
    },
    onError: (error) => toast.error(`票券核銷失敗：${error.message}`),
  });

  const [formData, setFormData] = useState({
    voucherCode: '',
    voucherType: 'discount' as 'service' | 'product' | 'discount',
    discountValue: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
  });

  const resetForm = () => {
    setFormData({
      voucherCode: '',
      voucherType: 'discount',
      discountValue: 0,
      validFrom: '',
      validUntil: '',
      usageLimit: 0,
    });
  };

  const handleCreateVoucher = () => {
    if (!tenantId) return;
    if (!formData.voucherCode.trim()) {
      toast.error('請輸入票券代碼');
      return;
    }
    if (!formData.validFrom || !formData.validUntil) {
      toast.error('請設定有效期限');
      return;
    }
    createVoucher.mutate({ tenantId, ...formData });
  };

  const handleRedeem = () => {
    if (!tenantId) return;
    if (!redeemCode.trim()) {
      toast.error('請輸入票券代碼');
      return;
    }
    if (!redeemCustomerId.trim() || isNaN(Number(redeemCustomerId))) {
      toast.error('請輸入有效的客戶 ID');
      return;
    }
    redeemVoucher.mutate({
      tenantId,
      voucherCode: redeemCode.trim(),
      customerId: Number(redeemCustomerId),
    });
  };

  const getVoucherStatus = (voucher: any) => {
    if (!voucher.is_active) return { label: '已停用', variant: 'destructive' as const };
    const now = new Date();
    if (new Date(voucher.valid_until) < now) return { label: '已過期', variant: 'secondary' as const };
    if (new Date(voucher.valid_from) > now) return { label: '未生效', variant: 'outline' as const };
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) return { label: '已用完', variant: 'secondary' as const };
    return { label: '有效', variant: 'default' as const };
  };

  const totalPages = Math.ceil((vouchersData?.total || 0) / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          票券管理
        </h1>
        <div className="flex gap-2">
          {/* 核銷票券 Dialog */}
          <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                核銷票券
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>核銷票券</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>票券代碼</Label>
                  <Input
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="輸入票券代碼"
                  />
                </div>
                <div>
                  <Label>客戶 ID</Label>
                  <Input
                    type="number"
                    value={redeemCustomerId}
                    onChange={(e) => setRedeemCustomerId(e.target.value)}
                    placeholder="輸入客戶編號"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleRedeem} disabled={redeemVoucher.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  確認核銷
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 建立票券 Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                發行票券
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>發行新票券</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>票券代碼</Label>
                  <Input
                    value={formData.voucherCode}
                    onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                    placeholder="例如：SUMMER2026"
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
                  <Label>折扣金額 (元)</Label>
                  <Input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>生效日期</Label>
                    <Input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>到期日期</Label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>使用次數上限 (0 = 無限制)</Label>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleCreateVoucher} disabled={createVoucher.isPending}>
                  發行票券
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 票券統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總票券數</CardDescription>
            <CardTitle className="text-3xl">{stats?.total_vouchers || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <BarChart3 className="inline h-3 w-3 mr-1" />
              所有已發行的票券
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>有效票券</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.active_vouchers || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="inline h-3 w-3 mr-1 text-green-500" />
              目前可使用的票券
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總核銷次數</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.total_usage || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <Ticket className="inline h-3 w-3 mr-1 text-blue-500" />
              累計使用次數
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 票券列表 */}
      <Card>
        <CardHeader>
          <CardTitle>票券列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>票券代碼</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>折扣金額</TableHead>
                <TableHead>有效期限</TableHead>
                <TableHead>使用次數</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">載入中...</TableCell>
                </TableRow>
              ) : !vouchersData?.vouchers?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    尚無票券，點擊「發行票券」開始建立
                  </TableCell>
                </TableRow>
              ) : (
                vouchersData.vouchers.map((voucher: any) => {
                  const status = getVoucherStatus(voucher);
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
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono font-bold">{voucher.voucher_code}</TableCell>
                      <TableCell>{VOUCHER_TYPE_LABELS[voucher.voucher_type] || voucher.voucher_type}</TableCell>
                      <TableCell>${voucher.discount_value || 0}</TableCell>
                      <TableCell className="text-sm">
                        {voucher.valid_from ? format(new Date(voucher.valid_from), 'yyyy/MM/dd') : '--'}
                        {' ~ '}
                        {voucher.valid_until ? format(new Date(voucher.valid_until), 'yyyy/MM/dd') : '--'}
                      </TableCell>
                      <TableCell>
                        {voucher.usage_count || 0} / {voucher.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={status.label !== '有效'}
                          onClick={() => {
                            setRedeemCode(voucher.voucher_code);
                            setRedeemCustomerId('');
                            setIsRedeemDialogOpen(true);
                          }}
                        >
                          核銷
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button onClick={() => setPage(page - 1)} disabled={page === 1} variant="outline" size="sm">
                上一頁
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                第 {page} 頁 / 共 {totalPages} 頁
              </span>
              <Button onClick={() => setPage(page + 1)} disabled={page >= totalPages} variant="outline" size="sm">
                下一頁
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
