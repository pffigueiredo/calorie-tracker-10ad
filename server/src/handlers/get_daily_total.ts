import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type GetEntriesByDateInput, type DailyCalorieTotal } from '../schema';
import { sql, gte, lt } from 'drizzle-orm';

export const getDailyTotal = async (input: GetEntriesByDateInput): Promise<DailyCalorieTotal> => {
  try {
    // Use provided date or default to today
    const targetDate = input.date || new Date().toISOString().split('T')[0];
    
    // Create date range for the entire day
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
    const startOfNextDay = new Date(`${targetDate}T00:00:00.000Z`);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    
    // Query to sum calories for entries created on the target date
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(${foodEntriesTable.calories}), 0)`
    })
    .from(foodEntriesTable)
    .where(
      sql`${foodEntriesTable.created_at} >= ${startOfDay} AND ${foodEntriesTable.created_at} < ${startOfNextDay}`
    )
    .execute();
    
    const totalCalories = Number(result[0]?.total) || 0;
    
    return {
      date: targetDate,
      total_calories: totalCalories
    };
  } catch (error) {
    console.error('Failed to get daily calorie total:', error);
    throw error;
  }
};