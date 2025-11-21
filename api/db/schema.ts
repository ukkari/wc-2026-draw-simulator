import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const draws = sqliteTable('draws', {
  id: text('id').primaryKey(),
  drawData: text('draw_data').notNull(), // JSON string of groups
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Draw = typeof draws.$inferSelect;
export type NewDraw = typeof draws.$inferInsert;
