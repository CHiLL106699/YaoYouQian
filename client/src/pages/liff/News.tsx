/**
 * LIFF 最新消息 — 列表、詳情、圖片展示
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, ArrowLeft, Newspaper, Calendar } from 'lucide-react';

function NewsContent({ tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const listQuery = trpc.notification.list.useQuery(
    { tenantId, status: 'sent', channel: 'line', limit: 30 },
  );

  const notifications = listQuery.data?.notifications || [];
  const selected = selectedId ? notifications.find(n => n.id === selectedId) : null;

  if (selected) {
    return (
      <div className="p-4">
        <button onClick={() => setSelectedId(null)} className="flex items-center text-sm text-gray-500 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回列表
        </button>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{selected.title}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Calendar className="h-3 w-3" />
            <span>{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('zh-TW') : ''}</span>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {selected.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Newspaper className="h-5 w-5 text-[#06C755]" /> 最新消息
      </h2>
      {listQuery.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-400 py-8">暫無消息</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(n.id)}>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-gray-800 line-clamp-1">{n.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.content}</p>
                <p className="text-xs text-gray-300 mt-2">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('zh-TW') : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiffNews() {
  return <LiffLayout title="最新消息">{(props) => <NewsContent {...props} />}</LiffLayout>;
}
