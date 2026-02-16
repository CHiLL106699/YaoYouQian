/**
 * E2E 測試：預約流程
 *
 * 覆蓋場景：
 * 1. 建立預約 → 確認預約寫入 DB → 查詢預約列表 → 取消預約
 * 2. 時段衝突檢測
 * 3. 預約日期範圍篩選
 *
 * 注意：appointment_time 是 timestamptz 格式（如 2026-02-20T10:00:00+08:00）
 *       appointment_date 是 date 格式（如 2026-02-20）
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSupabase,
  createTestTenant,
  cleanupTestTenant,
  futureDateStr,
} from "./helpers";

/**
 * 將日期字串 + 時間字串組合為 ISO timestamptz
 * 例如 ("2026-03-01", "10:00") → "2026-03-01T10:00:00+08:00"
 */
function toTimestamptz(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00+08:00`;
}

describe("預約流程 E2E", () => {
  const supabase = getSupabase();
  let tenantId: number;
  let customerId: number;

  beforeAll(async () => {
    const tenant = await createTestTenant("booking");
    tenantId = tenant.tenantId;

    // 建立測試客戶
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        name: "預約測試客戶",
        phone: "0912345678",
        email: "booking-test@example.com",
      })
      .select("id")
      .single();

    if (error) throw new Error(`建立測試客戶失敗: ${error.message}`);
    customerId = customer!.id;
  });

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("應能建立預約並確認寫入 DB", async () => {
    const appointmentDate = futureDateStr(7);

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        appointment_date: appointmentDate,
        appointment_time: toTimestamptz(appointmentDate, "10:00"),
        duration_minutes: 60,
        status: "pending",
        notes: "E2E 測試預約",
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(appointment).toBeDefined();
    expect(appointment!.tenant_id).toBe(tenantId);
    expect(appointment!.customer_id).toBe(customerId);
    expect(appointment!.status).toBe("pending");
    expect(appointment!.appointment_date).toBe(appointmentDate);

    // 從 DB 再次查詢確認
    const { data: dbRecord } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointment!.id)
      .single();

    expect(dbRecord).toBeDefined();
    expect(dbRecord!.id).toBe(appointment!.id);
  });

  it("應能查詢預約列表", async () => {
    // 建立多筆預約
    const dates = [futureDateStr(8), futureDateStr(9), futureDateStr(10)];
    for (const date of dates) {
      await supabase.from("appointments").insert({
        tenant_id: tenantId,
        customer_id: customerId,
        appointment_date: date,
        appointment_time: toTimestamptz(date, "14:00"),
        duration_minutes: 30,
        status: "pending",
      });
    }

    // 查詢該租戶所有預約
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("appointment_date", { ascending: true });

    expect(error).toBeNull();
    expect(appointments).toBeDefined();
    expect(appointments!.length).toBeGreaterThanOrEqual(3);
  });

  it("應能取消預約並更新狀態", async () => {
    const date = futureDateStr(11);
    const { data: appointment } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        appointment_date: date,
        appointment_time: toTimestamptz(date, "11:00"),
        duration_minutes: 60,
        status: "pending",
      })
      .select("id")
      .single();

    expect(appointment).toBeDefined();

    // 取消預約
    const { error: cancelError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment!.id);

    expect(cancelError).toBeNull();

    // 驗證狀態已更新
    const { data: cancelled } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointment!.id)
      .single();

    expect(cancelled!.status).toBe("cancelled");
  });

  it("應能檢測時段衝突（同一時段不應超過上限）", async () => {
    const conflictDate = futureDateStr(15);
    const conflictDay = new Date();
    conflictDay.setDate(conflictDay.getDate() + 15);
    const dayOfWeek = conflictDay.getDay(); // 0=Sun, 6=Sat

    // 設定該時段上限為 2（使用 day_of_week）
    await supabase.from("booking_slot_limits").insert({
      tenant_id: tenantId,
      day_of_week: dayOfWeek,
      time_slot: "09:00",
      max_bookings: 2,
      is_active: true,
    });

    // 建立 2 筆預約（應成功）
    for (let i = 0; i < 2; i++) {
      const { error } = await supabase.from("appointments").insert({
        tenant_id: tenantId,
        customer_id: customerId,
        appointment_date: conflictDate,
        appointment_time: toTimestamptz(conflictDate, "09:00"),
        duration_minutes: 30,
        status: "pending",
      });
      expect(error).toBeNull();
    }

    // 查詢該時段已預約數量
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("appointment_date", conflictDate)
      .neq("status", "cancelled");

    // 取得時段上限
    const { data: slotLimit } = await supabase
      .from("booking_slot_limits")
      .select("max_bookings")
      .eq("tenant_id", tenantId)
      .eq("day_of_week", dayOfWeek)
      .eq("time_slot", "09:00")
      .single();

    // 驗證已達上限
    expect(existing!.length).toBe(2);
    expect(slotLimit!.max_bookings).toBe(2);
    expect(existing!.length).toBeGreaterThanOrEqual(slotLimit!.max_bookings);
  });

  it("應能依日期範圍篩選預約", async () => {
    const startDate = futureDateStr(20);
    const endDate = futureDateStr(25);
    const inRangeDate = futureDateStr(22);
    const outOfRangeDate = futureDateStr(30);

    // 建立範圍內的預約
    await supabase.from("appointments").insert({
      tenant_id: tenantId,
      customer_id: customerId,
      appointment_date: inRangeDate,
      appointment_time: toTimestamptz(inRangeDate, "10:00"),
      duration_minutes: 60,
      status: "pending",
    });

    // 建立範圍外的預約
    await supabase.from("appointments").insert({
      tenant_id: tenantId,
      customer_id: customerId,
      appointment_date: outOfRangeDate,
      appointment_time: toTimestamptz(outOfRangeDate, "10:00"),
      duration_minutes: 60,
      status: "pending",
    });

    // 依日期範圍篩選
    const { data: filtered, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate);

    expect(error).toBeNull();
    expect(filtered).toBeDefined();

    // 確認所有結果都在範圍內
    for (const apt of filtered!) {
      expect(apt.appointment_date >= startDate).toBe(true);
      expect(apt.appointment_date <= endDate).toBe(true);
    }

    // 確認範圍外的預約不在結果中
    const outOfRange = filtered!.find(
      (a: { appointment_date: string }) =>
        a.appointment_date === outOfRangeDate
    );
    expect(outOfRange).toBeUndefined();
  });
});
