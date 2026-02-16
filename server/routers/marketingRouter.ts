/**
 * marketingRouter.ts
 * 會員分眾行銷 tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { supabase } from '../supabaseClient';
import { TRPCError } from '@trpc/server';
import { sendLineMessage } from '../_core/lineMessaging';

export const marketingRouter = router({
  // 列出所有行銷活動
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('tenant_id', input.tenantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + input.limit - 1);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const { count } = await supabase
        .from('marketing_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', input.tenantId);

      return {
        campaigns: campaigns || [],
        total: count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  // 建立行銷活動
  create: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      campaignName: z.string(),
      targetTags: z.array(z.string()).optional(),
      targetMemberLevels: z.array(z.string()).optional(),
      messageContent: z.string(),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          tenant_id: input.tenantId,
          campaign_name: input.campaignName,
          target_tags: input.targetTags || [],
          target_member_levels: input.targetMemberLevels || [],
          message_content: input.messageContent,
          scheduled_at: input.scheduledAt || null,
          status: input.scheduledAt ? 'scheduled' : 'draft',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return { success: true, campaign: data };
    }),

  // 發送行銷活動
  send: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
      campaignId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 查詢行銷活動
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', input.campaignId)
        .eq('tenant_id', input.tenantId)
        .single();

      if (campaignError || !campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '行銷活動不存在' });
      }

      // 查詢目標客戶
      let query = supabase
        .from('customers')
        .select('id, name, line_user_id')
        .eq('tenant_id', input.tenantId);

      // 根據標籤篩選
      if (campaign.target_tags && campaign.target_tags.length > 0) {
        const { data: taggedCustomers } = await supabase
          .from('customer_tags')
          .select('customer_id')
          .eq('tenant_id', input.tenantId)
          .in('tag_name', campaign.target_tags);

        const customerIds = taggedCustomers?.map(t => t.customer_id) || [];
        query = query.in('id', customerIds);
      }

      // 根據會員等級篩選
      if (campaign.target_member_levels && campaign.target_member_levels.length > 0) {
        query = query.in('member_level', campaign.target_member_levels);
      }

      const { data: customers, error: customerError } = await query;

      if (customerError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: customerError.message });

      // 發送 LINE 訊息
      let successCount = 0;
      let failCount = 0;

      for (const customer of customers || []) {
        if (customer.line_user_id) {
          try {
            await sendLineMessage(customer.line_user_id, [{ type: 'text', text: campaign.message_content }]);
            successCount++;
          } catch (error) {
            console.error(`[Marketing] Failed to send to ${customer.name}:`, error);
            failCount++;
          }
        }
      }

      // 更新行銷活動狀態
      await supabase
        .from('marketing_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', input.campaignId);

      return {
        success: true,
        totalTargets: customers?.length || 0,
        successCount,
        failCount,
      };
    }),

  // 行銷活動統計
  stats: protectedProcedure
    .input(z.object({
      tenantId: z.number(),
    }))
    .query(async ({ input }) => {
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select('status')
        .eq('tenant_id', input.tenantId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const totalCampaigns = campaigns?.length || 0;
      const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;
      const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled').length || 0;

      return {
        total_campaigns: totalCampaigns,
        sent_campaigns: sentCampaigns,
        scheduled_campaigns: scheduledCampaigns,
      };
    }),
});
