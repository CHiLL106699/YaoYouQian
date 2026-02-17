/**
 * LIFF 員工班表頁面
 * 月曆顯示排班
 */
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Info, Clock } from "lucide-react";

interface ShiftDay {
  date: number;
  startTime: string;
  endTime: string;
  shiftType: "normal" | "overtime" | "off";
}

const SHIFT_COLORS = {
  normal: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  overtime: "bg-orange-500/20 text-orange-300 border-orange-400/30",
  off: "bg-gray-500/20 text-gray-400 border-gray-400/30",
};

const SHIFT_LABELS = {
  normal: "正常",
  overtime: "加班",
  off: "休假",
};

// Mock schedule data
const MOCK_SHIFTS: ShiftDay[] = [
  { date: 3, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 4, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 5, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 6, startTime: "09:00", endTime: "21:00", shiftType: "overtime" },
  { date: 7, startTime: "00:00", endTime: "00:00", shiftType: "off" },
  { date: 8, startTime: "00:00", endTime: "00:00", shiftType: "off" },
  { date: 10, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 11, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 12, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 13, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 14, startTime: "00:00", endTime: "00:00", shiftType: "off" },
  { date: 15, startTime: "00:00", endTime: "00:00", shiftType: "off" },
  { date: 17, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 18, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 19, startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { date: 20, startTime: "09:00", endTime: "20:00", shiftType: "overtime" },
];

export default function LiffStaffSchedule() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tenantId = searchParams.get("tenantId");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<ShiftDay | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

  const getShift = (day: number) => MOCK_SHIFTS.find(s => s.date === day);

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
        <Calendar className="h-6 w-6 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-400">我的班表</h1>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" className="text-amber-400" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-white font-semibold text-lg">{monthLabel}</span>
        <Button variant="ghost" size="sm" className="text-amber-400" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-white/5 border-amber-400/20 mb-4">
        <CardContent className="p-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["日", "一", "二", "三", "四", "五", "六"].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 py-1">{day}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const shift = getShift(day);
              return (
                <button
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs border transition-colors ${
                    shift ? SHIFT_COLORS[shift.shiftType] : "border-transparent text-gray-500"
                  } ${selectedDay?.date === day ? "ring-2 ring-amber-400" : ""}`}
                  onClick={() => shift && setSelectedDay(shift)}
                >
                  <span className="font-medium">{day}</span>
                  {shift && shift.shiftType !== "off" && (
                    <span className="text-[10px] mt-0.5">{shift.startTime}</span>
                  )}
                  {shift?.shiftType === "off" && (
                    <span className="text-[10px] mt-0.5">休</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-3 mb-4 justify-center">
        {Object.entries(SHIFT_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${SHIFT_COLORS[key as keyof typeof SHIFT_COLORS].split(" ")[0]}`} />
            <span className="text-gray-400 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <Card className="bg-white/5 border-amber-400/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{month + 1}月{selectedDay.date}日</p>
                <Badge className={SHIFT_COLORS[selectedDay.shiftType]}>{SHIFT_LABELS[selectedDay.shiftType]}</Badge>
              </div>
              {selectedDay.shiftType !== "off" && (
                <div className="text-right">
                  <p className="text-gray-400 text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> 班表時間</p>
                  <p className="text-white font-mono">{selectedDay.startTime} - {selectedDay.endTime}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
