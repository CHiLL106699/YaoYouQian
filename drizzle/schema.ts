import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, boolean, serial } from "drizzle-orm/pg-core";

/**
 * YoCHiLLSAAS - Complete Database Schema (PostgreSQL / Supabase)
 * 多租戶預約管理系統完整資料表定義
 * 
 * 已從 drizzle-orm/mysql-core 遷移至 drizzle-orm/pg-core
 */

// ============================================
// PostgreSQL Enums
// ============================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["trial", "active", "suspended", "cancelled"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["basic", "professional", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "cancelled"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "approved", "completed", "cancelled"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "shipped", "completed", "cancelled"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

// ============================================
// 1. Core User Table (Manus OAuth)
// ============================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// 2. Tenants Table (租戶基本資料)
// ============================================

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  ownerLineUserId: varchar("owner_line_user_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("trial").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ============================================
// 3. Tenant Subscriptions (訂閱狀態)
// ============================================

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  plan: varchar("plan", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;
export type InsertTenantSubscription = typeof tenantSubscriptions.$inferInsert;

// ============================================
// 4. Tenant Settings (白標化設定)
// ============================================

export const tenantSettings = pgTable("tenant_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#8B5CF6"),
  customDomain: varchar("custom_domain", { length: 255 }),
  lineChannelId: varchar("line_channel_id", { length: 100 }),
  lineChannelSecret: varchar("line_channel_secret", { length: 100 }),
  lineChannelAccessToken: text("line_channel_access_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TenantSetting = typeof tenantSettings.$inferSelect;
export type InsertTenantSetting = typeof tenantSettings.$inferInsert;

// ============================================
// 5. Customers Table (客戶資料)
// ============================================

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  lineUserId: varchar("line_user_id", { length: 100 }),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  birthday: timestamp("birthday"),
  gender: varchar("gender", { length: 10 }),
  address: text("address"),
  notes: text("notes"),
  tags: text("tags"), // JSON string
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  visitCount: integer("visit_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ============================================
// 6. Services Table (服務項目)
// ============================================

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // 分鐘
  category: varchar("category", { length: 100 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ============================================
// 7. Appointments Table (預約記錄)
// ============================================

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").notNull(),
  serviceId: integer("service_id"),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  notes: text("notes"),
  service: varchar("service", { length: 200 }), // 服務名稱快照
  customerName: varchar("customer_name", { length: 100 }), // 客戶名稱快照
  customerPhone: varchar("customer_phone", { length: 20 }), // 客戶電話快照
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ============================================
// 8. Booking Slot Limits (時段人數限制)
// ============================================

export const bookingSlotLimits = pgTable("booking_slot_limits", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  date: timestamp("date").notNull(),
  timeSlot: varchar("time_slot", { length: 10 }).notNull(),
  maxCapacity: integer("max_capacity").default(5).notNull(),
  currentBookings: integer("current_bookings").default(0).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BookingSlotLimit = typeof bookingSlotLimits.$inferSelect;
export type InsertBookingSlotLimit = typeof bookingSlotLimits.$inferInsert;

// ============================================
// 9. Products Table (商城商品)
// ============================================

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  category: varchar("category", { length: 100 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============================================
// 10. Orders Table (訂單)
// ============================================

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").notNull(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  shippingAddress: text("shipping_address"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ============================================
// 11. Order Items Table (訂單明細)
// ============================================

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ============================================
// 12. Time Slot Templates (時段模板)
// ============================================

export const timeSlotTemplates = pgTable("time_slot_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  slots: text("slots").notNull(), // JSON string: ["09:00", "10:00", ...]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type TimeSlotTemplate = typeof timeSlotTemplates.$inferSelect;
export type InsertTimeSlotTemplate = typeof timeSlotTemplates.$inferInsert;

// ============================================
// 13. Dose Calculations (劑量計算記錄)
// ============================================

export const doseCalculations = pgTable("dose_calculations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  customerId: integer("customer_id").notNull(),
  weight: varchar("weight", { length: 20 }).notNull(),
  productType: varchar("product_type", { length: 100 }).notNull(),
  dosage: varchar("dosage", { length: 20 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DoseCalculation = typeof doseCalculations.$inferSelect;
export type InsertDoseCalculation = typeof doseCalculations.$inferInsert;

// ============================================
// 14. Approvals (預約審核記錄)
// ============================================

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  appointmentId: integer("appointment_id").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

// ============================================
// 15. Reschedule Approvals (改期審核記錄)
// ============================================

export const rescheduleApprovals = pgTable("reschedule_approvals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  appointmentId: integer("appointment_id").notNull(),
  originalDate: varchar("original_date", { length: 20 }).notNull(),
  originalTime: varchar("original_time", { length: 20 }).notNull(),
  newDate: varchar("new_date", { length: 20 }).notNull(),
  newTime: varchar("new_time", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RescheduleApproval = typeof rescheduleApprovals.$inferSelect;
export type InsertRescheduleApproval = typeof rescheduleApprovals.$inferInsert;

// ============================================
// 16. Slot Limits (時段限制)
// ============================================

export const slotLimits = pgTable("slot_limits", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  currentCount: integer("current_count").default(0).notNull(),
  isFull: boolean("is_full").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SlotLimit = typeof slotLimits.$inferSelect;
export type InsertSlotLimit = typeof slotLimits.$inferInsert;
