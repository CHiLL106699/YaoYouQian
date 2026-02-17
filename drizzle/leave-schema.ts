import {
  pgTable, varchar, text, timestamp, integer,
} from "drizzle-orm/pg-core";

/**
 * 請假申請記錄表
 */
export const leaveRequests = pgTable('leave_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 36 }).notNull(),
  staffId: varchar('staff_id', { length: 36 }).notNull(),
  leaveType: text('leave_type').notNull(),
  startDate: timestamp('start_date').notNull(), // 請假開始日期時間
  endDate: timestamp('end_date').notNull(), // 請假結束日期時間
  reason: text('reason'), // 請假原因
  status: text('status').notNull().default('pending'),
  reviewerId: varchar('reviewer_id', { length: 36 }), // 審核者 ID
  reviewedAt: timestamp('reviewed_at'), // 審核時間
  reviewNote: text('review_note'), // 審核備註
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
