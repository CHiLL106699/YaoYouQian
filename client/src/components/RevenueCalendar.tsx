import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DayRevenue {
  date: string;
  amount: number;
  count: number;
}

interface RevenueCalendarProps {
  tenantId: number;
}

export function RevenueCalendar({ tenantId }: RevenueCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 取得當月營收資料
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  
  const { data: revenueData } = trpc.revenue.getByDateRange.useQuery({
    tenantId,
    startDate,
    endDate,
  });

  // 轉換為 Map 格式
  const dailyRevenue = useMemo(() => {
    if (!revenueData) return new Map<string, DayRevenue>();

    const revenueMap = new Map<string, DayRevenue>();
    revenueData.forEach(item => {
      revenueMap.set(item.date, {
        date: item.date,
        amount: item.amount,
        count: item.count,
      });
    });

    return revenueMap;
  }, [revenueData]);

  // 計算當月總營收
  const monthlyTotal = useMemo(() => {
    let total = 0;
    dailyRevenue.forEach(day => {
      total += day.amount;
    });
    return total;
  }, [dailyRevenue]);

  // 計算日均營收
  const dailyAverage = useMemo(() => {
    const daysWithRevenue = dailyRevenue.size;
    return daysWithRevenue > 0 ? monthlyTotal / daysWithRevenue : 0;
  }, [monthlyTotal, dailyRevenue]);

  // 計算最高營收（用於熱度計算）
  const maxRevenue = useMemo(() => {
    let max = 0;
    dailyRevenue.forEach(day => {
      if (day.amount > max) max = day.amount;
    });
    return max;
  }, [dailyRevenue]);

  // 生成日曆天數
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 填充當月日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  // 取得日期的營收資料
  const getDateRevenue = (day: number): DayRevenue | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dailyRevenue.get(dateStr);
  };

  // 計算熱度顏色
  const getHeatColor = (amount: number): string => {
    if (amount === 0) return 'bg-muted/30';
    const intensity = maxRevenue > 0 ? amount / maxRevenue : 0;
    
    if (intensity > 0.8) return 'bg-primary';
    if (intensity > 0.6) return 'bg-primary/80';
    if (intensity > 0.4) return 'bg-primary/60';
    if (intensity > 0.2) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  // 切換月份
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const selectedDateRevenue = selectedDate ? dailyRevenue.get(selectedDate) : undefined;

  return (
    <>
      <Card className="luxury-card">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-gold-solid">營收日曆</CardTitle>
              <CardDescription>
                {year} 年 {month + 1} 月
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth(-1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="h-8 px-3"
              >
                今天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth(1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* 統計資訊 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
              <div className="text-xs text-muted-foreground mb-0.5">本月總營收</div>
              <div className="text-lg font-bold text-primary">
                NT$ {monthlyTotal.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-chart-2/10 to-chart-2/5 rounded-xl">
              <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                日均營收
              </div>
              <div className="text-lg font-bold" style={{ color: 'oklch(75% 0.08 320)' }}>
                NT$ {dailyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日曆格子 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const revenue = getDateRevenue(day);
              const amount = revenue?.amount || 0;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-2xl p-2 transition-all duration-300 ease-out
                    hover:scale-105 hover:shadow-lg
                    ${getHeatColor(amount)}
                    ${isToday ? 'ring-2 ring-primary/60 ring-offset-2' : ''}
                    ${amount > 0 ? 'cursor-pointer opacity-100' : 'cursor-default opacity-60'}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className={`text-sm font-medium ${amount > 0 ? 'text-white' : 'text-muted-foreground'}`}>
                      {day}
                    </div>
                    {amount > 0 && (
                      <div className="text-[10px] text-white/90 mt-0.5">
                        {(amount / 1000).toFixed(0)}k
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 熱度圖例 */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>營收熱度：</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-muted/30"></div>
              <span>低</span>
            </div>
            <div className="flex items-center gap-1">
              {[20, 40, 60, 80, 100].map(intensity => (
                <div
                  key={intensity}
                  className={`w-4 h-4 rounded bg-primary/${intensity}`}
                ></div>
              ))}
              <span>高</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日期明細對話框 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </DialogTitle>
            <DialogDescription>
              當日營收明細
            </DialogDescription>
          </DialogHeader>

          {selectedDateRevenue && (
            <div className="space-y-4">
              {/* 統計卡片 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">當日總營收</div>
                  <div className="text-2xl font-bold text-primary">
                    NT$ {selectedDateRevenue.amount.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-chart-2/5 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">交易筆數</div>
                  <div className="text-2xl font-bold" style={{ color: 'oklch(75% 0.08 320)' }}>
                    {selectedDateRevenue.count} 筆
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedDateRevenue && (
            <div className="text-center py-8 text-muted-foreground">
              當日無交易記錄
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
