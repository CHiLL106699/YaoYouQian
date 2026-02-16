
import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';
import { zhTW } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';

type Appointment = {
  id: number;
  customer_name: string | null;
  service_name: string | null;
  appointment_date: string;
  time_slot: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  customers?: {
    name: string | null;
    phone: string | null;
    line_user_id: string | null;
  } | null;
};

const getStatusVariant = (status: Appointment['status']) => {
  switch (status) {
    case 'approved':
      return 'default'; // green in shadcn/ui
    case 'rejected':
    case 'cancelled':
      return 'destructive'; // red
    case 'pending':
      return 'outline'; // yellow/amber, but we'll use outline for differentiation
    default:
      return 'secondary';
  }
};

const getStatusColorClass = (status: Appointment['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const statusMap: { [key in Appointment['status']]: string } = {
    pending: '待審核',
    approved: '已核准',
    rejected: '已拒絕',
    cancelled: '已取消',
};

function ListView() {
  const { tenantId } = useTenant();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');

  const queryInput: {
    tenantId: number;
    page: number;
    pageSize: number;
    status?: Appointment['status'];
  } = { tenantId: tenantId!, page, pageSize: 20 };

  if (statusFilter !== 'all') {
    queryInput.status = statusFilter;
  }

  const { data, isLoading, refetch } = trpc.appointment.list.useQuery(queryInput, { enabled: !!tenantId });

  const approveMut = trpc.appointment.approve.useMutation({
    onSuccess: () => {
      toast.success('預約已核准');
      refetch();
    },
    onError: (error) => toast.error(`操作失敗: ${error.message}`),
  });

  const rejectMut = trpc.appointment.reject.useMutation({
    onSuccess: () => {
      toast.success('預約已拒絕');
      refetch();
    },
    onError: (error) => toast.error(`操作失敗: ${error.message}`),
  });

  const appointments: Appointment[] = data?.appointments || [];

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="篩選狀態" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部狀態</SelectItem>
                    <SelectItem value="pending">待審核</SelectItem>
                    <SelectItem value="approved">已核准</SelectItem>
                    <SelectItem value="rejected">已拒絕</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>客戶</TableHead>
                            <TableHead>服務</TableHead>
                            <TableHead>日期</TableHead>
                            <TableHead>時段</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">載入中...</TableCell></TableRow>
                        ) : appointments.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">尚無預約</TableCell></TableRow>
                        ) : (
                            appointments.map((apt) => (
                                <TableRow key={apt.id}>
                                    <TableCell className="font-medium">{apt.customers?.name || apt.customer_name || 'N/A'}</TableCell>
                                    <TableCell>{apt.service_name || 'N/A'}</TableCell>
                                    <TableCell>{format(new Date(apt.appointment_date), 'yyyy-MM-dd')}</TableCell>
                                    <TableCell>{apt.time_slot}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(apt.status)}>{statusMap[apt.status]}</Badge></TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {apt.status === 'pending' && tenantId && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => approveMut.mutate({ tenantId, appointmentId: apt.id })}><Check className="h-4 w-4 text-green-600" /></Button>
                                                <Button size="sm" variant="outline" onClick={() => rejectMut.mutate({ tenantId, appointmentId: apt.id })}><X className="h-4 w-4 text-red-600" /></Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         {/* TODO: Pagination controls */}
    </div>
  );
}

function CalendarView() {
  const { tenantId } = useTenant();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
  const endDate = format(lastDayOfMonth, 'yyyy-MM-dd');

  // 使用 startDate/endDate 參數築選當月資料，提升效能
  const { data, isLoading } = trpc.appointment.list.useQuery(
    { 
      tenantId: tenantId!,
      page: 1,
      pageSize: 1000,
      startDate,
      endDate,
    },
    { enabled: !!tenantId }
  );

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, { appointments: Appointment[], summary: Record<Appointment['status'], number> }>();
    if (!data?.appointments) return map;

    for (const apt of data.appointments) {
      const dayKey = format(new Date(apt.appointment_date), 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, { appointments: [], summary: { pending: 0, approved: 0, rejected: 0, cancelled: 0 } });
      }
      const dayData = map.get(dayKey)!;
      dayData.appointments.push(apt);
      dayData.summary[apt.status]++;
    }
    return map;
  }, [data]);

  const daysInMonth = eachDayOfInterval({ start: startOfWeek(firstDayOfMonth), end: endOfWeek(lastDayOfMonth) });

  const handleDayClick = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    if (appointmentsByDay.has(dayKey)) {
      setSelectedDay(day);
      setDialogOpen(true);
    }
  };

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDay) return [];
    const dayKey = format(selectedDay, 'yyyy-MM-dd');
    return appointmentsByDay.get(dayKey)?.appointments || [];
  }, [selectedDay, appointmentsByDay]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-xl font-semibold text-center w-48">{format(currentMonth, 'yyyy年 MMMM', { locale: zhTW })}</h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>今天</Button>
      </div>
      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 gap-1">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center font-medium text-muted-foreground text-sm py-2">{day}</div>
            ))}
            {daysInMonth.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dataForDay = appointmentsByDay.get(dayKey);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentToday = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={`relative h-32 border rounded-md p-2 flex flex-col cursor-pointer hover:bg-accent ${!isCurrentMonth ? 'text-muted-foreground bg-muted/50' : ''} ${isCurrentToday ? 'border-blue-500 border-2' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <time dateTime={format(day, 'yyyy-MM-dd')} className={`font-semibold ${isCurrentToday ? 'text-blue-600' : ''}`}>{format(day, 'd')}</time>
                  {dataForDay && (
                    <div className="mt-1 space-y-1 overflow-y-auto">
                      {Object.entries(dataForDay.summary).map(([status, count]) => 
                        count > 0 && (
                          <div key={status} className="flex items-center text-xs">
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${getStatusColorClass(status as Appointment['status'])}`}></span>
                            <span>{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>預約詳情 - {selectedDay && format(selectedDay, 'yyyy-MM-dd')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客戶</TableHead>
                  <TableHead>服務</TableHead>
                  <TableHead>時段</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDayAppointments.length > 0 ? (
                  selectedDayAppointments.map(apt => (
                    <TableRow key={apt.id}>
                      <TableCell>{apt.customers?.name || apt.customer_name || 'N/A'}</TableCell>
                      <TableCell>{apt.service_name}</TableCell>
                      <TableCell>{apt.time_slot}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(apt.status)}>{statusMap[apt.status]}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center">該日無預約</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AppointmentManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CalendarDays className="h-6 w-6" />
        預約管理
      </h1>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            列表檢視
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            月曆檢視
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <ListView />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
