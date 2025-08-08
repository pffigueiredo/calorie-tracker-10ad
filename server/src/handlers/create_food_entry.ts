import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput, type FoodEntry } from '../schema';

export const createFoodEntry = async (input: CreateFoodEntryInput): Promise<FoodEntry> => {
  try {
    // Insert food entry record
    const result = await db.insert(foodEntriesTable)
      .values({
        name: input.name,
        calories: input.calories
        // created_at will be set automatically by database default
      })
      .returning()
      .execute();

    // Return the created food entry
    const foodEntry = result[0];
    return foodEntry;
  } catch (error) {
    console.error('Food entry creation failed:', error);
    throw error;
  }
};