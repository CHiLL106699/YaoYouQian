/**
 * slotCalculatorRouter.ts
 * 時段自動計算 tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { supabase } from '../supabaseClient';
import { TRPCError } from '@trpc/server';

export const slotCalculatorRouter = router({
  // 根據服務項目時長自動計算可預約時段
  calculate: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      date: z.string(), // YYYY-MM-DD
      startTime: z.string(), // HH:MM
      endTime: z.string(), // HH:MM
    }))
    .query(async ({ input }) => {
      // 查詢服務項目時長
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', input.serviceId)
        .eq('tenant_id', input.tenantId)
        .single();

      if (serviceError || !service) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '服務項目不存在' });
      }

      const durationMinutes = service.duration_minutes || 60; // 預設 60 分鐘

      // 查詢當天已預約的時段
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id')
        .eq('tenant_id', input.tenantId)
        .eq('appointment_date', input.date)
        .eq('status', 'confirmed');

      if (appointmentsError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: appointmentsError.message });
      }

      // 計算可用時段
      const availableSlots: string[] = [];
      const start = parseTime(input.startTime);
      const end = parseTime(input.endTime);

      for (let time = start; time < end; time += durationMinutes) {
        const slotTime = formatTime(time);
        const isConflict = appointments?.some(apt => {
          const aptTime = parseTime(apt.appointment_time);
          return time < aptTime + durationMinutes && time + durationMinutes > aptTime;
        });

        if (!isConflict) {
          availableSlots.push(slotTime);
        }
      }

      return {
        date: input.date,
        service_id: input.serviceId,
        duration_minutes: durationMinutes,
        available_slots: availableSlots,
      };
    }),

  // 批次計算多天的可用時段
  calculateBatch: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      serviceId: z.number(),
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(), // YYYY-MM-DD
      startTime: z.string(), // HH:MM
      endTime: z.string(), // HH:MM
    }))
    .query(async ({ input }) => {
      const results: any[] = [];
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // 查詢服務項目時長
        const { data: service } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', input.serviceId)
          .eq('tenant_id', input.tenantId)
          .single();

        if (!service) continue;

        const durationMinutes = service.duration_minutes || 60;

        // 查詢當天已預約的時段
        const { data: appointments } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('tenant_id', input.tenantId)
          .eq('appointment_date', dateStr)
          .eq('status', 'confirmed');

        // 計算可用時段
        const availableSlots: string[] = [];
        const startTime = parseTime(input.startTime);
        const endTime = parseTime(input.endTime);

        for (let time = startTime; time < endTime; time += durationMinutes) {
          const slotTime = formatTime(time);
          const isConflict = appointments?.some(apt => {
            const aptTime = parseTime(apt.appointment_time);
            return time < aptTime + durationMinutes && time + durationMinutes > aptTime;
          });

          if (!isConflict) {
            availableSlots.push(slotTime);
          }
        }

        results.push({
          date: dateStr,
          available_slots: availableSlots,
        });
      }

      return {
        service_id: input.serviceId,
        results,
      };
    }),
});

// 輔助函數：將 HH:MM 或 ISO timestamp 轉換為分鐘數
function parseTime(time: string): number {
  // 支援 ISO timestamp 格式 (e.g. 2024-01-01T09:00:00+08:00)
  if (time.includes('T')) {
    const d = new Date(time);
    return d.getHours() * 60 + d.getMinutes();
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// 輔助函數：將分鐘數轉換為 HH:MM
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
