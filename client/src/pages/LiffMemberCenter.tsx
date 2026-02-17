/**
 * LIFF 會員中心 — 完整版
 * 會員卡展示、點數餘額、消費紀錄、我的預約、個人資料編輯
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, User, Calendar, ShoppingBag, Edit2, Save, X, CreditCard } from 'lucide-react';

function MemberContent({ profile, tenantId }: { profile: { displayName: string; userId: string; pictureUrl?: string }; tenantId: number }) {
  const [activeTab, setActiveTab] = useState('card');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', birthday: '' });

  const profileQuery = trpc.line.liffMember.getProfile.useQuery({ tenantId, lineUserId: profile.userId });
  const appointmentsQuery = trpc.line.liffMember.getMyAppointments.useQuery(
    { tenantId, lineUserId: profile.userId, status: 'all' },
    { enabled: activeTab === 'appointments' }
  );
  const transactionsQuery = trpc.line.liffMember.getTransactionHistory.useQuery(
    { tenantId, lineUserId: profile.userId },
    { enabled: activeTab === 'history' }
  );
  const updateProfileMutation = trpc.line.liffMember.updateProfile.useMutation();
  const cancelMutation = trpc.line.liffMember.cancelAppointment.useMutation();

  const memberData = profileQuery.data;

  const startEdit = () => {
    if (memberData) {
      setEditForm({ name: memberData.name, phone: memberData.phone, email: memberData.email || '', birthday: memberData.birthday || '' });
    }
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({ tenantId, lineUserId: profile.userId, ...editForm });
      setEditing(false);
      profileQuery.refetch();
    } catch (e: any) {
      alert(`更新失敗: ${e.message}`);
    }
  };

  const cancelAppointment = async (id: number) => {
    if (!confirm('確定要取消此預約嗎？')) return;
    try {
      await cancelMutation.mutateAsync({ tenantId, lineUserId: profile.userId, appointmentId: id });
      appointmentsQuery.refetch();
    } catch (e: any) {
      alert(`取消失敗: ${e.message}`);
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
  };
  const statusLabel: Record<string, string> = {
    pending: '待確認', confirmed: '已確認', completed: '已完成', cancelled: '已取消',
  };

  return (
    <div className="pb-20">
      {/* Member Card */}
      <div className="bg-gradient-to-br from-[#06C755] to-[#04a045] text-white p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {profile.pictureUrl ? <img src={profile.pictureUrl} className="w-full h-full object-cover" /> : <User className="h-7 w-7 text-white" />}
          </div>
          <div>
            <p className="font-bold text-lg">{memberData?.name || profile.displayName}</p>
            <p className="text-white/70 text-xs">會員</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{memberData?.points || 0}</p>
            <p className="text-xs text-white/70">點數</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{memberData?.visitCount || 0}</p>
            <p className="text-xs text-white/70">來店次數</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">NT${memberData?.totalSpent || '0'}</p>
            <p className="text-xs text-white/70">累計消費</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="card" className="text-xs"><CreditCard className="h-3 w-3 mr-1" />會員卡</TabsTrigger>
            <TabsTrigger value="appointments" className="text-xs"><Calendar className="h-3 w-3 mr-1" />預約</TabsTrigger>
            <TabsTrigger value="history" className="text-xs"><ShoppingBag className="h-3 w-3 mr-1" />消費</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs"><User className="h-3 w-3 mr-1" />資料</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-700 text-white">
              <CardContent className="p-5">
                <p className="text-xs text-gray-400 mb-1">曜友仟 會員卡</p>
                <p className="text-xl font-bold tracking-wider mb-4">{memberData?.name || profile.displayName}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">會員等級</span>
                  <span>{memberData?.memberLevel || '一般會員'}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">可用點數</span>
                  <span className="text-[#06C755] font-bold">{memberData?.points || 0} pts</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-4 space-y-3">
            {appointmentsQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
            ) : (appointmentsQuery.data?.appointments || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">暫無預約紀錄</p>
            ) : (
              (appointmentsQuery.data?.appointments || []).map(apt => (
                <Card key={apt.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{apt.serviceName}</p>
                        <p className="text-xs text-gray-400 mt-1">{apt.date} {apt.time}</p>
                      </div>
                      <Badge className={statusColor[apt.status] || 'bg-gray-100'}>{statusLabel[apt.status] || apt.status}</Badge>
                    </div>
                    {apt.status === 'pending' && (
                      <Button variant="ghost" size="sm" className="mt-2 text-red-500 text-xs h-7" onClick={() => cancelAppointment(apt.id)}>
                        <X className="h-3 w-3 mr-1" /> 取消預約
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {transactionsQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
            ) : (transactionsQuery.data?.transactions || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">暫無消費紀錄</p>
            ) : (
              (transactionsQuery.data?.transactions || []).map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-gray-400">{tx.date}</p>
                    </div>
                    <span className="font-bold text-sm">NT${tx.amount}</span>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {editing ? (
                  <>
                    <div><Label>姓名</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                    <div><Label>電話</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} type="email" /></div>
                    <div><Label>生日</Label><Input value={editForm.birthday} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} type="date" /></div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-[#06C755] hover:bg-[#05a847] text-white" onClick={saveProfile} disabled={updateProfileMutation.isPending}>
                        <Save className="h-4 w-4 mr-1" /> 儲存
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> 取消</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">姓名</span><span>{memberData?.name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">電話</span><span>{memberData?.phone || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Email</span><span>{memberData?.email || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">生日</span><span>{memberData?.birthday || '-'}</span></div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={startEdit}><Edit2 className="h-4 w-4 mr-1" /> 編輯資料</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function LiffMemberCenter() {
  return <LiffLayout title="會員中心" showHeader={false}>{(props) => <MemberContent {...props} />}</LiffLayout>;
}
