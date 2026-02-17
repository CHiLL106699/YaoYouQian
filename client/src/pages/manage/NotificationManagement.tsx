/**
 * 通知管理 — 推播歷史、排程推播
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, Bell, Send, Clock, Plus, Users, CheckCircle } from 'lucide-react';

export default function NotificationManagement() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState('history');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'customer' | 'staff'>('all');
  const [scheduledAt, setScheduledAt] = useState('');

  const historyQuery = trpc.notification.list.useQuery(
    { tenantId: tenantId!, limit: 50 },
    { enabled: !!tenantId }
  );
  const createMutation = trpc.notification.create.useMutation();
  const sendMutation = trpc.notification.send.useMutation();

  const notifications = historyQuery.data?.notifications || [];

  const handleSend = async () => {
    if (!title || !message) { alert('請填寫標題和內容'); return; }
    try {
      const result = await createMutation.mutateAsync({
        tenantId: tenantId!, title, content: message, targetType,
        channel: 'line',
      });
      if (!scheduledAt && result?.id) {
        await sendMutation.mutateAsync({ tenantId: tenantId!, notificationId: result.id });
      }
      alert(scheduledAt ? '排程推播已設定' : '推播已送出');
      setTitle(''); setMessage(''); setScheduledAt('');
      historyQuery.refetch();
      setTab('history');
    } catch (e: unknown) {
      alert(`送出失敗: ${(e as Error).message}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">通知管理</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="history"><Bell className="h-4 w-4 mr-1" /> 推播歷史</TabsTrigger>
          <TabsTrigger value="create"><Plus className="h-4 w-4 mr-1" /> 新增推播</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <p className="text-center text-gray-400 py-8">尚無推播紀錄</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <Card key={n.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{n.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                      </div>
                      <Badge className={n.status === 'sent' ? 'bg-green-100 text-green-700' : n.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}>
                        {n.status === 'sent' ? '已送出' : n.status === 'scheduled' ? '排程中' : n.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {n.targetType === 'all' ? '全部' : '分群'}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {n.sentAt || n.scheduledAt || '-'}</span>
                      {n.deliveredCount !== undefined && (
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> 送達 {n.deliveredCount}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader><CardTitle>新增推播</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">標題</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="推播標題" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">內容</label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="推播內容" rows={4} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">推送對象</label>
                <div className="flex gap-2 mt-1">
                  <Button variant={targetType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTargetType('all')}>全部會員</Button>
                  <Button variant={targetType === 'customer' ? 'default' : 'outline'} size="sm" onClick={() => setTargetType('customer')}>客戶</Button>
                  <Button variant={targetType === 'staff' ? 'default' : 'outline'} size="sm" onClick={() => setTargetType('staff')}>員工</Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">排程時間（選填，留空立即推送）</label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="mt-1" />
              </div>
              <Button className="w-full bg-[#06C755] hover:bg-[#05a847] text-white" disabled={sendMutation.isPending} onClick={handleSend}>
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                {scheduledAt ? '設定排程推播' : '立即推送'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
