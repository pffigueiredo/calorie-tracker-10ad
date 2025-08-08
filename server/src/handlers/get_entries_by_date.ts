import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type GetEntriesByDateInput, type FoodEntry } from '../schema';
import { sql } from 'drizzle-orm';

export const getEntriesByDate = async (input: GetEntriesByDateInput): Promise<FoodEntry[]> => {
  try {
    // Use today's date if no date is provided
    const targetDate = input.date || new Date().toISOString().split('T')[0];
    
    // Query entries where the date portion of created_at matches the target date
    const results = await db.select()
      .from(foodEntriesTable)
      .where(
        sql`DATE(${foodEntriesTable.created_at}) = ${targetDate}`
      )
      .orderBy(foodEntriesTable.created_at)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get entries by date:', error);
    throw error;
  }
};