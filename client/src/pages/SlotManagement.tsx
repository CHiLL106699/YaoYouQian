import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";
export default function SlotManagement() {
  const { tenantId } = useTenant();
  if (!tenantId) return <div>Loading...</div>;
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: slots, refetch, isLoading, error } = trpc.slotLimit.getByDate.useQuery({
    tenantId, date: selectedDate.toISOString().split('T')[0]
  });
  
  const setLimit = trpc.slotLimit.setLimit.useMutation({
    onSuccess: () => {
      toast.success("時段上限已更新");
      refetch();
    }
  });

  if (isLoading) {

    return (

      <div className="flex items-center justify-center min-h-[60vh]">

        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <span className="ml-2 text-muted-foreground">載入中...</span>

      </div>

    );

  }


  if (error) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">

        <p className="text-destructive">載入資料時發生錯誤</p>

        <p className="text-sm text-muted-foreground">{error.message}</p>

        <Button variant="outline" onClick={() => window.location.reload()}>重試</Button>

      </div>

    );

  }


  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">時段管理</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">時段設定</h2>
          {slots?.map((slot: any) => (
            <div key={slot.time_slot} className="flex items-center gap-4 mb-4">
              <span className="w-24">{slot.time_slot}</span>
              <Input
                type="number"
                defaultValue={slot.max_bookings}
                onBlur={(e) => setLimit.mutate({
                  tenantId,
                  date: selectedDate.toISOString().split('T')[0],
                  timeSlot: slot.time_slot,
                  maxBookings: parseInt(e.target.value)
                })}
              />
              <span className={`px-3 py-1 rounded ${slot.current_bookings >= slot.max_bookings ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                {slot.current_bookings}/{slot.max_bookings}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
