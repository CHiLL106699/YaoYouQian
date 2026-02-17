/**
 * LIFF 員工客戶速查頁面
 */
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, Phone, Mail, Calendar, Info, Hash } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  visitCount: number;
  lastVisit: string;
  totalSpent: string;
  tags: string[];
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: 1, name: "王小明", phone: "0912-345-678", email: "wang@email.com", visitCount: 12, lastVisit: "2026-02-10", totalSpent: "58,000", tags: ["VIP", "敏感肌"] },
  { id: 2, name: "李美麗", phone: "0923-456-789", email: "li@email.com", visitCount: 8, lastVisit: "2026-02-08", totalSpent: "32,000", tags: ["美白"] },
  { id: 3, name: "張大華", phone: "0934-567-890", email: null, visitCount: 3, lastVisit: "2026-01-20", totalSpent: "15,000", tags: ["新客"] },
  { id: 4, name: "陳小芳", phone: "0945-678-901", email: "chen@email.com", visitCount: 20, lastVisit: "2026-02-15", totalSpent: "120,000", tags: ["VIP", "抗老"] },
  { id: 5, name: "林志偉", phone: "0956-789-012", email: null, visitCount: 5, lastVisit: "2026-02-01", totalSpent: "22,000", tags: [] },
];

export default function LiffStaffCustomers() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = MOCK_CUSTOMERS.filter(c =>
    c.name.includes(search) || c.phone.includes(search)
  );

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4 text-amber-400">
        <Info className="h-12 w-12" />
        <p className="mt-4 text-lg font-semibold">無效的頁面連結</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2744] p-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">客戶速查</h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="搜尋姓名或電話..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-white/10 border-amber-400/30 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(customer => (
          <Card
            key={customer.id}
            className="bg-white/5 border-amber-400/20 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setSelected(customer)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{customer.name}</span>
                  {customer.tags.includes("VIP") && <Badge className="bg-amber-500/20 text-amber-300 text-xs">VIP</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                  <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{customer.visitCount}次</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">找不到符合的客戶</p>
        )}
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0f1d35] border-amber-400/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> 電話</p>
                  <p className="text-white text-sm font-medium mt-1">{selected.phone}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                  <p className="text-white text-sm font-medium mt-1">{selected.email || "未填寫"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> 來訪次數</p>
                  <p className="text-amber-400 text-sm font-bold mt-1">{selected.visitCount} 次</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">累計消費</p>
                  <p className="text-amber-400 text-sm font-bold mt-1">NT${selected.totalSpent}</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> 最近來訪</p>
                <p className="text-white text-sm mt-1">{selected.lastVisit}</p>
              </div>
              {selected.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selected.tags.map(tag => (
                    <Badge key={tag} className="bg-amber-500/20 text-amber-300">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
