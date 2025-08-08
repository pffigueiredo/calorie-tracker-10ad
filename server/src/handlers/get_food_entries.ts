import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type FoodEntry } from '../schema';
import { desc } from 'drizzle-orm';

export const getFoodEntries = async (): Promise<FoodEntry[]> => {
  try {
    // Fetch all food entries ordered by creation date (most recent first)
    const results = await db.select()
      .from(foodEntriesTable)
      .orderBy(desc(foodEntriesTable.created_at))
      .execute();

    // Return the results (no numeric conversion needed as calories is integer)
    return results;
  } catch (error) {
    console.error('Failed to fetch food entries:', error);
    throw error;
  }
};