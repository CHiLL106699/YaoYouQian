/**
 * LIFF 員工客戶查詢 — 搜尋、客戶資訊、標籤
 */
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import LiffLayout from '@/components/LiffLayout';
import { Loader2, Search, User, Phone, Mail, Calendar } from 'lucide-react';

function CustomersContent({ tenantId }: { profile: { displayName: string; userId: string }; tenantId: number }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const query = trpc.customer.list.useQuery({ tenantId, search: debouncedSearch, page: 1, pageSize: 30 });

  const handleSearch = (val: string) => {
    setSearch(val);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(val), 300);
  };

  const customers = (query.data as any)?.customers || query.data || [];

  return (
    <div className="p-4 pb-20">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-10" placeholder="搜尋客戶姓名或電話..." value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* Customer List */}
      {query.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#06C755]" /></div>
      ) : (customers as any[]).length === 0 ? (
        <p className="text-center text-gray-400 py-8">無搜尋結果</p>
      ) : (
        <div className="space-y-3">
          {(customers as any[]).map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#06C755]/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-[#06C755]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.name || c.customer_name || '-'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(c.tags || []).map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] h-5">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500 pl-13">
                  {(c.phone || c.customer_phone) && (
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone || c.customer_phone}</div>
                  )}
                  {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</div>}
                  {c.last_visit && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> 最近來訪: {c.last_visit}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StaffCustomers() {
  return <LiffLayout title="客戶查詢">{(props) => <CustomersContent {...props} />}</LiffLayout>;
}
