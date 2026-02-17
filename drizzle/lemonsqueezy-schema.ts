import {
  pgTable, varchar, integer, decimal, text, timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

// LemonSqueezy 訂閱方案
export const lemonsqueezyPlans = pgTable('lemonsqueezy_plans', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(), // 診所 ID
  lemonSqueezyProductId: varchar('lemonsqueezy_product_id', { length: 255 }).notNull(), // LemonSqueezy Product ID
  lemonSqueezyVariantId: varchar('lemonsqueezy_variant_id', { length: 255 }).notNull(), // LemonSqueezy Variant ID
  name: varchar('name', { length: 255 }).notNull(), // 方案名稱
  description: text('description'), // 方案說明
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // 價格
  currency: varchar('currency', { length: 10 }).notNull().default('TWD'), // 幣別
  interval: text('interval').notNull(), // 計費週期
  intervalCount: integer('interval_count').notNull().default(1), // 計費週期數量
  isActive: integer('is_active').notNull().default(1), // 是否啟用
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// LemonSqueezy 訂閱記錄
export const lemonsqueezySubscriptions = pgTable('lemonsqueezy_subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(), // 診所 ID
  userId: integer('user_id').notNull(), // 用戶 ID
  planId: integer('plan_id').notNull(), // 方案 ID
  lemonSqueezySubscriptionId: varchar('lemonsqueezy_subscription_id', { length: 255 }).notNull().unique(), // LemonSqueezy Subscription ID
  lemonSqueezyCustomerId: varchar('lemonsqueezy_customer_id', { length: 255 }).notNull(), // LemonSqueezy Customer ID
  lemonSqueezyOrderId: varchar('lemonsqueezy_order_id', { length: 255 }), // LemonSqueezy Order ID
  status: text('status').notNull(), // 訂閱狀態
  trialEndsAt: timestamp('trial_ends_at'), // 試用結束時間
  renewsAt: timestamp('renews_at'), // 續訂時間
  endsAt: timestamp('ends_at'), // 結束時間
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// LemonSqueezy 付款記錄
export const lemonsqueezyPayments = pgTable('lemonsqueezy_payments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(), // 診所 ID
  userId: integer('user_id').notNull(), // 用戶 ID
  subscriptionId: integer('subscription_id'), // 訂閱 ID（若為訂閱付款）
  lemonSqueezyOrderId: varchar('lemonsqueezy_order_id', { length: 255 }).notNull().unique(), // LemonSqueezy Order ID
  lemonSqueezyCustomerId: varchar('lemonsqueezy_customer_id', { length: 255 }).notNull(), // LemonSqueezy Customer ID
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // 金額
  currency: varchar('currency', { length: 10 }).notNull().default('TWD'), // 幣別
  status: text('status').notNull(), // 付款狀態
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }), // 退款金額
  refundedAt: timestamp('refunded_at'), // 退款時間
  receiptUrl: varchar('receipt_url', { length: 500 }), // 收據 URL
  invoiceUrl: varchar('invoice_url', { length: 500 }), // 發票 URL
  paidAt: timestamp('paid_at'), // 付款時間
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// LemonSqueezy Webhook 事件記錄
export const lemonsqueezyWebhookEvents = pgTable('lemonsqueezy_webhook_events', {
  id: serial('id').primaryKey(),
  lemonSqueezyEventId: varchar('lemonsqueezy_event_id', { length: 255 }).notNull().unique(), // LemonSqueezy Event ID
  eventName: varchar('event_name', { length: 255 }).notNull(), // 事件名稱
  payload: text('payload').notNull(), // 事件 Payload（JSON）
  processed: integer('processed').notNull().default(0), // 是否已處理
  processedAt: timestamp('processed_at'), // 處理時間
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const lemonsqueezyPlansRelations = relations(lemonsqueezyPlans, ({ many }) => ({
  subscriptions: many(lemonsqueezySubscriptions),
}));

export const lemonsqueezySubscriptionsRelations = relations(lemonsqueezySubscriptions, ({ one, many }) => ({
  plan: one(lemonsqueezyPlans, {
    fields: [lemonsqueezySubscriptions.planId],
    references: [lemonsqueezyPlans.id],
}),
  payments: many(lemonsqueezyPayments),
}));

export const lemonsqueezyPaymentsRelations = relations(lemonsqueezyPayments, ({ one }) => ({
  subscription: one(lemonsqueezySubscriptions, {
    fields: [lemonsqueezyPayments.subscriptionId],
    references: [lemonsqueezySubscriptions.id],
}),
}));
