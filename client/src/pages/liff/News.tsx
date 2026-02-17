/**
 * LIFF 最新消息頁面
 * 診所公告、活動資訊
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Newspaper, Calendar, ChevronRight, Info } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string | null;
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: 1, title: "春季美白療程優惠", summary: "全館美白療程 85 折起", category: "優惠",
    content: "即日起至 3/31，全館美白療程享 85 折優惠！包含淨膚雷射、美白導入、維他命C導入等熱門項目。名額有限，歡迎提前預約。",
    date: "2026-02-15", imageUrl: null,
  },
  {
    id: 2, title: "新進駐醫師公告", summary: "歡迎王醫師加入團隊", category: "公告",
    content: "本院新進駐王美麗醫師，專長為微整形注射、玻尿酸填充、肉毒桿菌除皺。歡迎預約諮詢。",
    date: "2026-02-10", imageUrl: null,
  },
  {
    id: 3, title: "農曆新年營業時間", summary: "春節期間營業時間調整", category: "公告",
    content: "農曆除夕至初三休診，初四起恢復正常營業。祝大家新年快樂！",
    date: "2026-02-01", imageUrl: null,
  },
];

const categoryColors: Record<string, string> = {
  "優惠": "bg-red-500/20 text-red-300",
  "公告": "bg-blue-500/20 text-blue-300",
  "活動": "bg-green-500/20 text-green-300",
};

export default function LiffNews() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">最新消息</h1>
      </div>

      <div className="space-y-3">
        {MOCK_NEWS.map(news => (
          <Card
            key={news.id}
            className="bg-white/5 border-amber-400/20 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setSelectedNews(news)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={categoryColors[news.category] || "bg-gray-500/20 text-gray-300"}>
                      {news.category}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {news.date}
                    </span>
                  </div>
                  <h3 className="text-white font-medium">{news.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{news.summary}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-400/50 flex-shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="bg-[#0f1d35] border-amber-400/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">{selectedNews?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={categoryColors[selectedNews?.category || ""] || "bg-gray-500/20 text-gray-300"}>
                {selectedNews?.category}
              </Badge>
              <span className="text-xs text-gray-400">{selectedNews?.date}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNews?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
