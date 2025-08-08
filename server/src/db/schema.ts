import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const foodEntriesTable = pgTable('food_entries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  calories: integer('calories').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type FoodEntry = typeof foodEntriesTable.$inferSelect; // For SELECT operations
export type NewFoodEntry = typeof foodEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { foodEntries: foodEntriesTable };