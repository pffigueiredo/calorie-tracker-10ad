import { z } from 'zod';

// Food entry schema for database records
export const foodEntrySchema = z.object({
  id: z.number(),
  name: z.string(),
  calories: z.number().int().nonnegative(),
  created_at: z.coerce.date()
});

export type FoodEntry = z.infer<typeof foodEntrySchema>;

// Input schema for creating food entries
export const createFoodEntryInputSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.number().int().nonnegative("Calories must be a non-negative integer")
});

export type CreateFoodEntryInput = z.infer<typeof createFoodEntryInputSchema>;

// Schema for getting daily total calories
export const dailyCalorieTotalSchema = z.object({
  date: z.string(), // ISO date string (YYYY-MM-DD)
  total_calories: z.number().int().nonnegative()
});

export type DailyCalorieTotal = z.infer<typeof dailyCalorieTotalSchema>;

// Input schema for getting entries by date
export const getEntriesByDateInputSchema = z.object({
  date: z.string().optional() // ISO date string, defaults to today if not provided
});

export type GetEntriesByDateInput = z.infer<typeof getEntriesByDateInputSchema>;