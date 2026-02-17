/**
 * 系統 B Schema (MySQL 轉換版本)
 * 原始來源：PostgreSQL schema from yochill-landing
 * 轉換日期：2026-01-31
 * 
 * 此檔案包含系統 B 的 6 大核心模組資料表：
 * 1. 庫存管理 (inventory, inventoryTransfers)
 * 2. LINE CRM (crmTags, customerTags)
 * 3. 遊戲化行銷 (games, prizes, gameParticipations)
 * 4. 人資薪酬 (attendanceRecords, leaveRequests, staffCommissions)
 * 5. 多店中樞 (inventoryTransfers)
 * 6. 營運分析 (依賴現有資料表)
 */

import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  jsonb,
  date,
  time,
  serial,
} from "drizzle-orm/pg-core";

// ============================================
// 庫存管理表 (System B Integration)
// ============================================
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  productId: integer("product_id").notNull(),
  batchNumber: varchar("batch_number", { length: 100 }),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").default(10),
  expiryDate: date("expiry_date"),
  location: varchar("location", { length: 100 }),
  supplier: varchar("supplier", { length: 255 }),
  status: text("status").default("in_stock"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

// ============================================
// CRM 標籤表 (System B Integration)
// ============================================
export const crmTags = pgTable("crm_tags", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).default("#000000"),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrmTag = typeof crmTags.$inferSelect;
export type InsertCrmTag = typeof crmTags.$inferInsert;

export const customerTags = pgTable("customer_tags", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  tagId: integer("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CustomerTag = typeof customerTags.$inferSelect;
export type InsertCustomerTag = typeof customerTags.$inferInsert;

// ============================================
// 遊戲化行銷表 (System B Integration)
// ============================================
export const gamesSystemB = pgTable("games_system_b", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type").notNull(),
  status: text("status").default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  description: text("description"),
  rules: jsonb("rules"),
  imageUrl: text("image_url"),
  costPoints: integer("cost_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GameSystemB = typeof gamesSystemB.$inferSelect;
export type InsertGameSystemB = typeof gamesSystemB.$inferInsert;

export const prizesSystemB = pgTable("prizes_system_b", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type").default("physical"),
  quantity: integer("quantity").notNull().default(0),
  remainingQuantity: integer("remaining_quantity").notNull().default(0),
  probability: decimal("probability", { precision: 5, scale: 2 }).default("0"),
  imageUrl: text("image_url"),
  value: decimal("value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PrizeSystemB = typeof prizesSystemB.$inferSelect;
export type InsertPrizeSystemB = typeof prizesSystemB.$inferInsert;

export const gameParticipationsSystemB = pgTable("game_participations_system_b", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  customerId: integer("customer_id").notNull(),
  prizeId: integer("prize_id"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  isClaimed: boolean("is_claimed").default(false),
  claimedAt: timestamp("claimed_at"),
});

export type GameParticipationSystemB = typeof gameParticipationsSystemB.$inferSelect;
export type InsertGameParticipationSystemB = typeof gameParticipationsSystemB.$inferInsert;

// ============================================
// 人資薪酬表 (System B Integration)
// ============================================
// 注意：attendanceRecords 與 leaveRequests 已存在於系統 A
// 這裡僅新增 staffCommissions

export const staffCommissions = pgTable("staff_commissions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  staffId: integer("staff_id").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default("0"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("calculated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffCommission = typeof staffCommissions.$inferSelect;
export type InsertStaffCommission = typeof staffCommissions.$inferInsert;

// ============================================
// 多店調撥表 (System B Integration)
// ============================================
export const inventoryTransfersSystemB = pgTable("inventory_transfers_system_b", {
  id: serial("id").primaryKey(),
  fromOrgId: integer("from_org_id").notNull(),
  toOrgId: integer("to_org_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").default("pending"),
  requestedBy: integer("requested_by"),
  approvedBy: integer("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InventoryTransferSystemB = typeof inventoryTransfersSystemB.$inferSelect;
export type InsertInventoryTransferSystemB = typeof inventoryTransfersSystemB.$inferInsert;
