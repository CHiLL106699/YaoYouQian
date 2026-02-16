/**
 * YoCHiLLSAAS - Booking Router Tests
 * 預約系統 Router 單元測試
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { createContext } from '../_core/context';
import type { Request, Response } from 'express';

describe('bookingRouter', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // 建立測試用的 tRPC caller
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const ctx = createContext({ req: mockReq, res: mockRes });
    caller = appRouter.createCaller(ctx);
  });

  describe('getAvailableSlots', () => {
    it('應該回傳可用時段列表', async () => {
      const result = await caller.booking.getAvailableSlots({
        tenantId: 1,
        date: '2026-02-15',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('time');
        expect(result[0]).toHaveProperty('available');
        expect(result[0]).toHaveProperty('isAvailable');
      }
    });
  });

  describe('submitBooking', () => {
    it('應該成功建立預約', async () => {
      const result = await caller.booking.submitBooking({
        tenantId: 1,
        date: '2026-02-20',
        timeSlot: '10:00',
        name: '測試客戶',
        phone: '0912345678',
        notes: '測試預約',
        lineUserId: 'test-line-user-id',
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
    });

    it('應該拒絕缺少必要欄位的預約', async () => {
      await expect(
        caller.booking.submitBooking({
          tenantId: 1,
          date: '2026-02-20',
          timeSlot: '10:00',
          name: '',
          phone: '0912345678',
          lineUserId: 'test-line-user-id',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('listByCustomer', () => {
    it('應該回傳客戶的預約列表', async () => {
      const result = await caller.booking.listByCustomer({
        lineUserId: 'test-line-user-id',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('對於不存在的客戶應該回傳空陣列', async () => {
      const result = await caller.booking.listByCustomer({
        lineUserId: 'non-existent-user-id',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('cancel', () => {
    it('應該成功取消預約', async () => {
      // 先建立一個預約
      const booking = await caller.booking.submitBooking({
        tenantId: 1,
        date: '2026-02-25',
        timeSlot: '14:00',
        name: '測試客戶',
        phone: '0912345678',
        lineUserId: 'test-cancel-user-id',
      });

      // 取消預約
      const result = await caller.booking.cancel({
        appointmentId: booking.appointmentId,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
