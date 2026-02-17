import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { supabase } from "../supabaseClient";

export const tenantRouter = router({
  /**
   * 查詢租戶儀表板統計資料
   */
  getDashboardStats: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

      // 今日預約數
      const { count: todayApptCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId)
        .gte('appointment_date', today.toISOString())
        .lt('appointment_date', tomorrow.toISOString());

      // 總客戶數
      const { count: totalCustCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId);

      // 本月新客戶
      const { count: newCustCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());

      // 本月營收
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('tenant_id', input.tenantId)
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());
      const monthlyRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

      // 待處理訂單
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId)
        .eq('status', 'pending');

      return {
        todayAppointments: todayApptCount || 0,
        todayAppointmentsChange: 0,
        totalCustomers: totalCustCount || 0,
        newCustomersThisMonth: newCustCount || 0,
        monthlyRevenue,
        revenueGrowth: 0,
        pendingOrders: pendingCount || 0,
        pendingOrdersChange: 0,
      };
    }),

  /**
   * 註冊新租戶（公開 API）
   */
  register: publicProcedure
    .input(z.object({
      companyName: z.string().min(1, "公司名稱不能為空"),
      contactPerson: z.string().min(1, "聯絡人姓名不能為空"),
      email: z.string().email("請輸入有效的 Email"),
      password: z.string().min(8, "密碼至少需要 8 個字元"),
      subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']),
    }))
    .mutation(async ({ input }) => {
      // 1. 使用 Supabase Auth Admin API 建立使用者帳號（後端）
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true, // 自動確認 Email
        user_metadata: {
          company_name: input.companyName,
          contact_person: input.contactPerson,
          subscription_plan: input.subscriptionPlan,
        }
      });

      if (authError || !authData.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `建立使用者帳號失敗: ${authError?.message || '未知錯誤'}`
        });
      }

      // 2. 建立租戶資料
      const subdomain = input.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: input.companyName,
          subdomain: subdomain,
          status: 'trial',
          auth_user_id: authData.user.id,
          owner_email: input.email,
          owner_name: input.contactPerson,
        })
        .select()
        .single();

      if (tenantError) {
        // 如果建立租戶失敗，刪除已建立的使用者帳號
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `建立租戶失敗: ${tenantError.message}`
        });
      }

      // 3. 建立訂閱記錄
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const { error: subscriptionError } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan: input.subscriptionPlan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndDate.toISOString(),
        });

      if (subscriptionError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `建立訂閱記錄失敗: ${subscriptionError.message}`
        });
      }

      // 4. 建立租戶設定
      await supabase
        .from('tenant_settings')
        .insert({
          tenant_id: tenant.id,
          primary_color: '#d4af37', // 金色
        });

      return {
        success: true,
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        message: '註冊成功！14 天免費試用期已開通'
      };
    }),

  /**
   * 取得當前租戶資訊（by tenantId）
   */
  getCurrent: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', input.tenantId)
        .single();

      if (error || !tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到租戶資料'
        });
      }

      return tenant;
    }),

  /**
   * 根據 Supabase Auth User ID 安全查詢租戶資訊
   * 此 procedure 在後端使用 service_role 查詢，前端無需直接讀取 tenants 表
   */
  getByAuthUser: publicProcedure
    .input(z.object({
      authUserId: z.string().uuid(),
      email: z.string().email().optional(),
    }))
    .query(async ({ input }) => {
      // 先以 auth_user_id 查詢
      let { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, subdomain, status')
        .eq('auth_user_id', input.authUserId)
        .single();

      // 若找不到，以 email 查詢
      if (!tenant && input.email) {
        const { data: tenantByEmail } = await supabase
          .from('tenants')
          .select('id, name, subdomain, status')
          .eq('owner_email', input.email)
          .single();
        tenant = tenantByEmail;
      }

      if (!tenant) {
        return null;
      }

      return tenant;
    }),

  /**
   * 更新租戶資訊
   */
  update: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      name: z.string().optional(),
      ownerName: z.string().optional(),
      ownerEmail: z.string().email().optional(),
      ownerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { tenantId, ...updateData } = input;

      const { data, error } = await supabase
        .from('tenants')
        .update({
          name: updateData.name,
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `更新租戶資料失敗: ${error.message}`
        });
      }

      return { success: true, tenant: data };
    }),

  /**
   * 查詢升級狀態
   */
  getUpgradeStatus: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, plan_type, upgrade_status, upgrade_requested_at, enabled_modules, source_product')
        .eq('id', input.tenantId)
        .single();
      if (error || !tenant) {
        return { planType: 'yyq_basic', upgradeStatus: null, enabledModules: [] };
      }
      return {
        planType: (tenant as any).plan_type || 'yyq_basic',
        upgradeStatus: (tenant as any).upgrade_status || null,
        enabledModules: (tenant as any).enabled_modules || [],
        upgradeRequestedAt: (tenant as any).upgrade_requested_at || null,
      };
    }),

  /**
   * 申請升級到 YOKAGE 高配版
   * 安全：僅更新自己的租戶，透過後端 service_role 操作
   */
  requestUpgrade: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. 檢查是否已有待審核的升級請求
      const { data: existing } = await supabase
        .from('upgrade_requests')
        .select('id, status')
        .eq('tenant_id', input.tenantId)
        .eq('status', 'pending')
        .single();
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '已有待審核的升級請求，請等待審核完成'
        });
      }
      // 2. 取得當前方案
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan_type')
        .eq('id', input.tenantId)
        .single();
      const currentPlan = (tenant as any)?.plan_type || 'yyq_basic';
      if (currentPlan === 'yokage_pro') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '您已經是高配版方案'
        });
      }
      // 3. 建立升級請求
      const { error: insertError } = await supabase
        .from('upgrade_requests')
        .insert({
          tenant_id: input.tenantId,
          current_plan: currentPlan,
          requested_plan: 'yokage_pro',
          status: 'pending',
          notes: input.notes || null,
          source_product: 'yaoyouqian',
          requested_at: new Date().toISOString(),
        });
      if (insertError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `建立升級請求失敗: ${insertError.message}`
        });
      }
      // 4. 更新租戶升級狀態
      await supabase
        .from('tenants')
        .update({
          upgrade_status: 'pending',
          upgrade_requested_at: new Date().toISOString(),
        })
        .eq('id', input.tenantId);
      return { success: true, message: '升級請求已送出，等待審核' };
    }),

  /**
   * 列出所有租戶（僅超級管理員）
   */
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('tenants')
        .select('*, tenant_subscriptions(*)', { count: 'exact' });

      // 搜尋功能
      if (input.search) {
        query = query.or(`name.ilike.%${input.search}%,subdomain.ilike.%${input.search}%`);
      }

      // 分頁
      const { data: tenants, error, count } = await query
        .range((input.page - 1) * input.pageSize, input.page * input.pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `查詢租戶清單失敗: ${error.message}`
        });
      }

      return {
        tenants: tenants || [],
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
});
