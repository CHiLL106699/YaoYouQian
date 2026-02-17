import {
  pgTable, varchar, decimal, timestamp, integer, text, index,
} from "drizzle-orm/pg-core";

/**
 * 業績記錄表
 * 記錄員工的業績資料（自動計算或手動新增）
 */
export const performanceRecords = pgTable('performance_records', {
  id: varchar('id', { length: 191 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 191 }).notNull(),
  staffId: varchar('staff_id', { length: 191 }).notNull(),
  recordDate: timestamp('record_date').notNull(),
  
  // 業績金額（使用 DECIMAL 確保精確性）
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  
  // 業績類型（appointment: 預約、treatment: 療程、product: 產品銷售、manual: 手動新增）
  type: varchar('type', { length: 50 }).notNull(),
  
  // 關聯 ID（預約 ID、療程 ID、產品 ID 等）
  relatedId: varchar('related_id', { length: 191 }),
  
  // 備註
  notes: text('notes'),
  
  // 建立時間與更新時間
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => ({
  clinicIdIdx: index('clinic_id_idx').on(table.clinicId),
  staffIdIdx: index('staff_id_idx').on(table.staffId),
  recordDateIdx: index('record_date_idx').on(table.recordDate),
}));

/**
 * 業績目標表
 * 記錄員工的業績目標（月度、季度、年度）
 */
export const performanceTargets = pgTable('performance_targets', {
  id: varchar('id', { length: 191 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 191 }).notNull(),
  staffId: varchar('staff_id', { length: 191 }).notNull(),
  
  // 目標期間類型（monthly: 月度、quarterly: 季度、yearly: 年度）
  periodType: varchar('period_type', { length: 50 }).notNull(),
  
  // 目標年份
  year: integer('year').notNull(),
  
  // 目標月份或季度（月度：1-12，季度：1-4，年度：0）
  period: integer('period').notNull(),
  
  // 目標金額（使用 DECIMAL 確保精確性）
  targetAmount: decimal('target_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  
  // 備註
  notes: text('notes'),
  
  // 建立時間與更新時間
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => ({
  clinicIdIdx: index('clinic_id_idx').on(table.clinicId),
  staffIdIdx: index('staff_id_idx').on(table.staffId),
  periodIdx: index('period_idx').on(table.periodType, table.year, table.period),
}));
