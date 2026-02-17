/**
 * 管理後台 - 排班管理
 * 員工排班日曆
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Clock } from "lucide-react";

interface StaffMember {
  id: number;
  name: string;
  role: string;
}

interface Shift {
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: "normal" | "overtime" | "off";
}

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: "王醫師", role: "醫師" },
  { id: 2, name: "李護理師", role: "護理師" },
  { id: 3, name: "張美容師", role: "美容師" },
  { id: 4, name: "陳諮詢師", role: "諮詢師" },
];

const MOCK_SHIFTS: Shift[] = [
  { staffId: 1, date: "2026-02-17", startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { staffId: 1, date: "2026-02-18", startTime: "09:00", endTime: "18:00", shiftType: "normal" },
  { staffId: 1, date: "2026-02-19", startTime: "09:00", endTime: "21:00", shiftType: "overtime" },
  { staffId: 2, date: "2026-02-17", startTime: "08:00", endTime: "17:00", shiftType: "normal" },
  { staffId: 2, date: "2026-02-18", startTime: "08:00", endTime: "17:00", shiftType: "normal" },
  { staffId: 3, date: "2026-02-17", startTime: "10:00", endTime: "19:00", shiftType: "normal" },
  { staffId: 3, date: "2026-02-19", startTime: "10:00", endTime: "19:00", shiftType: "normal" },
  { staffId: 4, date: "2026-02-17", startTime: "09:00", endTime: "18:00", shiftType: "normal" },
];

const SHIFT_COLORS = {
  normal: "bg-blue-100 text-blue-700 border-blue-200",
  overtime: "bg-orange-100 text-orange-700 border-orange-200",
  off: "bg-gray-100 text-gray-500 border-gray-200",
};

const WEEKDAYS = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

export default function ScheduleManagement() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const getShiftsForCell = (staffId: number, date: string) =>
    MOCK_SHIFTS.filter(s => s.staffId === staffId && s.date === date);

  const filteredStaff = selectedStaff === "all" ? MOCK_STAFF : MOCK_STAFF.filter(s => s.id.toString() === selectedStaff);

  const weekLabel = `${formatDate(weekDates[0])} ~ ${formatDate(weekDates[6])}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">排班管理</h1>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> 新增排班
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="篩選員工" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部員工</SelectItem>
            {MOCK_STAFF.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.role})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
          <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /><span className="text-sm text-gray-600">正常</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200" /><span className="text-sm text-gray-600">加班</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /><span className="text-sm text-gray-600">休假</span></div>
      </div>

      {/* Schedule Grid */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-sm font-medium text-gray-600 w-32">
                  <Users className="h-4 w-4 inline mr-1" /> 員工
                </th>
                {weekDates.map((date, i) => (
                  <th key={i} className="p-3 text-center text-sm font-medium text-gray-600 min-w-[120px]">
                    <div>{WEEKDAYS[i]}</div>
                    <div className="text-xs text-gray-400">{date.getMonth() + 1}/{date.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(staff => (
                <tr key={staff.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium text-sm">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.role}</div>
                  </td>
                  {weekDates.map((date, i) => {
                    const dateStr = formatDate(date);
                    const shifts = getShiftsForCell(staff.id, dateStr);
                    return (
                      <td
                        key={i}
                        className="p-2 text-center cursor-pointer hover:bg-indigo-50 transition-colors"
                        onClick={() => { setSelectedDate(dateStr); setShowDialog(true); }}
                      >
                        {shifts.map((shift, si) => (
                          <div key={si} className={`rounded px-2 py-1 text-xs border ${SHIFT_COLORS[shift.shiftType]} mb-1`}>
                            <Clock className="h-3 w-3 inline mr-0.5" />
                            {shift.startTime}-{shift.endTime}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Shift Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增排班</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">員工</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="選擇員工" /></SelectTrigger>
                <SelectContent>
                  {MOCK_STAFF.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">日期</label>
              <Input type="date" defaultValue={selectedDate} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">上班時間</label>
                <Input type="time" defaultValue="09:00" />
              </div>
              <div>
                <label className="text-sm font-medium">下班時間</label>
                <Input type="time" defaultValue="18:00" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">班別</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="選擇班別" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">正常</SelectItem>
                  <SelectItem value="overtime">加班</SelectItem>
                  <SelectItem value="off">休假</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { toast.success("排班已儲存"); setShowDialog(false); }}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
