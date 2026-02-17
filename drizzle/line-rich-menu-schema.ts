import {
  pgTable, integer, varchar, text, boolean, timestamp, jsonb,
  serial,
} from "drizzle-orm/pg-core";

/**
 * LINE 圖文選單資料表
 * 儲存診所的 LINE 圖文選單設定
 */
export const lineRichMenus = pgTable('line_rich_menus', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').notNull(), // 診所 ID
  richMenuId: varchar('rich_menu_id', { length: 255 }).notNull().unique(), // LINE Rich Menu ID
  name: varchar('name', { length: 255 }).notNull(), // 圖文選單名稱
  chatBarText: varchar('chat_bar_text', { length: 14 }).notNull(), // 選單列文字（最多 14 字元）
  imageUrl: text('image_url').notNull(), // 圖片 URL
  imageKey: text('image_key'), // S3 圖片 Key（用於刪除或更新）
  size: jsonb('size').notNull().$type<{ width: number; height: number }>(), // 圖片尺寸
  areas: jsonb('areas').notNull().$type<Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: { type: string; uri?: string; text?: string };
  }>>(), // 按鈕區域配置
  isDefault: boolean('is_default').notNull().default(false), // 是否為預設圖文選單
  isActive: boolean('is_active').notNull().default(true), // 是否啟用
  clickCount: integer('click_count').notNull().default(0), // 點擊次數
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type LineRichMenu = typeof lineRichMenus.$inferSelect;
export type InsertLineRichMenu = typeof lineRichMenus.$inferInsert;
