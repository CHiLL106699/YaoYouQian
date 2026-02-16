/**
 * 預約鎖機制
 *
 * 使用 Supabase 的 appointment_locks 表實現樂觀鎖：
 * 1. 嘗試插入鎖定記錄（UNIQUE 約束防止重複）
 * 2. 若插入成功，表示取得鎖定
 * 3. 鎖定有過期時間，過期後自動失效
 * 4. 預約完成或取消時釋放鎖定
 *
 * 此機制防止同一時段被重複預約（高併發超賣）。
 */

import { supabase } from "../supabaseClient";

const DEFAULT_LOCK_DURATION_MINUTES = 10;

interface AcquireLockParams {
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;        // e.g. "10:00"
  tenantId: number;
  lockedBy: number;        // user or customer id
  durationMinutes?: number;
}

interface LockResult {
  success: boolean;
  lockId?: number;
  error?: string;
}

/**
 * 嘗試取得預約鎖
 * 使用 UNIQUE(appointment_date, time_slot, tenant_id) 約束防止重複
 */
export async function acquireAppointmentLock(params: AcquireLockParams): Promise<LockResult> {
  const {
    appointmentDate,
    timeSlot,
    tenantId,
    lockedBy,
    durationMinutes = DEFAULT_LOCK_DURATION_MINUTES,
  } = params;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // 先清除已過期的鎖
  await supabase
    .from("appointment_locks")
    .delete()
    .eq("appointment_date", appointmentDate)
    .eq("time_slot", timeSlot)
    .eq("tenant_id", tenantId)
    .lt("expires_at", now.toISOString());

  // 嘗試插入鎖定（UNIQUE 約束保證原子性）
  const { data, error } = await supabase
    .from("appointment_locks")
    .insert({
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      tenant_id: tenantId,
      locked_by: lockedBy,
      locked_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation，表示已被其他人鎖定
    if (error.code === "23505") {
      return { success: false, error: "該時段已被其他人鎖定，請選擇其他時段" };
    }
    return { success: false, error: `鎖定失敗: ${error.message}` };
  }

  return { success: true, lockId: data.id };
}

/**
 * 釋放預約鎖
 */
export async function releaseAppointmentLock(params: {
  appointmentDate: string;
  timeSlot: string;
  tenantId: number;
}): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("appointment_locks")
    .delete()
    .eq("appointment_date", params.appointmentDate)
    .eq("time_slot", params.timeSlot)
    .eq("tenant_id", params.tenantId);

  if (error) {
    console.error(`[AppointmentLock] 釋放鎖定失敗: ${error.message}`);
    return { success: false };
  }
  return { success: true };
}

/**
 * 釋放指定 ID 的鎖
 */
export async function releaseAppointmentLockById(lockId: number): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("appointment_locks")
    .delete()
    .eq("id", lockId);

  if (error) {
    console.error(`[AppointmentLock] 釋放鎖定失敗: ${error.message}`);
    return { success: false };
  }
  return { success: true };
}

/**
 * 檢查時段是否已被鎖定
 */
export async function isSlotLocked(params: {
  appointmentDate: string;
  timeSlot: string;
  tenantId: number;
}): Promise<boolean> {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("appointment_locks")
    .select("id")
    .eq("appointment_date", params.appointmentDate)
    .eq("time_slot", params.timeSlot)
    .eq("tenant_id", params.tenantId)
    .gt("expires_at", now)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * 清除所有已過期的鎖（可由 cron 定期呼叫）
 */
export async function cleanupExpiredLocks(): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointment_locks")
    .delete()
    .lt("expires_at", now)
    .select("id");

  if (error) {
    console.error(`[AppointmentLock] 清除過期鎖失敗: ${error.message}`);
    return 0;
  }

  return data?.length ?? 0;
}
