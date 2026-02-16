import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { createContext } from '../_core/context';
import type { Request, Response } from 'express';

describe('Service Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const mockReq = {
      headers: {},
      cookies: {},
    } as Request;

    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    caller = appRouter.createCaller(ctx);
  });

  it('should list services for a tenant', async () => {
    const result = await caller.service.list({ tenantId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should create a new service', async () => {
    const result = await caller.service.create({
      tenantId: 1,
      name: '測試服務項目',
      description: '這是一個測試服務項目',
      price: 1000,
      duration: 60,
      category: '美容護理',
      imageUrl: null,
    });
    expect(result.success).toBe(true);
    expect(result.serviceId).toBeDefined();
  });

  it('should toggle service status', async () => {
    // 先建立一個服務項目
    const createResult = await caller.service.create({
      tenantId: 1,
      name: '測試服務項目 2',
      description: '這是一個測試服務項目',
      price: 1500,
      duration: 90,
      category: '醫學美容',
      imageUrl: null,
    });

    // 停用服務項目
    const toggleResult = await caller.service.toggleStatus({
      tenantId: 1,
      serviceId: createResult.serviceId,
      isActive: false,
    });
    expect(toggleResult.success).toBe(true);
  });
});

describe('LINE Binding Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const mockReq = {
      headers: {},
      cookies: {},
    } as Request;

    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as Response;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    caller = appRouter.createCaller(ctx);
  });

  it('should check binding status for a LINE User ID', async () => {
    const result = await caller.lineBinding.checkBinding({
      tenantId: 1,
      lineUserId: 'U1234567890abcdef',
    });
    expect(result).toHaveProperty('isBound');
    expect(result).toHaveProperty('customer');
  });

  it('should create a new binding', async () => {
    const result = await caller.lineBinding.createBinding({
      tenantId: 1,
      lineUserId: 'U1234567890abcdef',
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
    expect(result.customerId).toBeDefined();
  });
});
