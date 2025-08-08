import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type GetEntriesByDateInput } from '../schema';
import { getDailyTotal } from '../handlers/get_daily_total';

describe('getDailyTotal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return 0 calories for a date with no entries', async () => {
    const input: GetEntriesByDateInput = {
      date: '2024-01-01'
    };

    const result = await getDailyTotal(input);

    expect(result.date).toEqual('2024-01-01');
    expect(result.total_calories).toEqual(0);
  });

  it('should sum calories for entries on a specific date', async () => {
    // Create test entries for the target date
    const targetDate = '2024-01-15';
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Breakfast',
          calories: 350,
          created_at: new Date(`${targetDate}T08:00:00.000Z`)
        },
        {
          name: 'Lunch',
          calories: 600,
          created_at: new Date(`${targetDate}T12:30:00.000Z`)
        },
        {
          name: 'Dinner',
          calories: 750,
          created_at: new Date(`${targetDate}T19:00:00.000Z`)
        }
      ])
      .execute();

    const input: GetEntriesByDateInput = {
      date: targetDate
    };

    const result = await getDailyTotal(input);

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(1700); // 350 + 600 + 750
  });

  it('should only count entries from the specified date, not adjacent dates', async () => {
    const targetDate = '2024-01-15';
    
    // Create entries for different dates
    await db.insert(foodEntriesTable)
      .values([
        // Previous day - should not be counted
        {
          name: 'Previous Day Meal',
          calories: 400,
          created_at: new Date('2024-01-14T23:59:59.999Z')
        },
        // Target date entries - should be counted
        {
          name: 'Target Day Breakfast',
          calories: 300,
          created_at: new Date(`${targetDate}T00:00:00.000Z`)
        },
        {
          name: 'Target Day Lunch',
          calories: 500,
          created_at: new Date(`${targetDate}T12:00:00.000Z`)
        },
        {
          name: 'Target Day Late Snack',
          calories: 200,
          created_at: new Date(`${targetDate}T23:59:59.999Z`)
        },
        // Next day - should not be counted
        {
          name: 'Next Day Meal',
          calories: 600,
          created_at: new Date('2024-01-16T00:00:00.000Z')
        }
      ])
      .execute();

    const input: GetEntriesByDateInput = {
      date: targetDate
    };

    const result = await getDailyTotal(input);

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(1000); // Only 300 + 500 + 200 from target date
  });

  it('should default to today when no date is provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Create an entry for today
    await db.insert(foodEntriesTable)
      .values({
        name: 'Today Meal',
        calories: 450,
        created_at: new Date()
      })
      .execute();

    const input: GetEntriesByDateInput = {}; // No date provided

    const result = await getDailyTotal(input);

    expect(result.date).toEqual(today);
    expect(result.total_calories).toEqual(450);
  });

  it('should handle single food entry correctly', async () => {
    const targetDate = '2024-02-01';
    
    await db.insert(foodEntriesTable)
      .values({
        name: 'Single Meal',
        calories: 1200,
        created_at: new Date(`${targetDate}T15:30:00.000Z`)
      })
      .execute();

    const input: GetEntriesByDateInput = {
      date: targetDate
    };

    const result = await getDailyTotal(input);

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(1200);
  });

  it('should handle entries with zero calories', async () => {
    const targetDate = '2024-03-01';
    
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Water',
          calories: 0,
          created_at: new Date(`${targetDate}T10:00:00.000Z`)
        },
        {
          name: 'Regular Meal',
          calories: 500,
          created_at: new Date(`${targetDate}T12:00:00.000Z`)
        }
      ])
      .execute();

    const input: GetEntriesByDateInput = {
      date: targetDate
    };

    const result = await getDailyTotal(input);

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(500); // 0 + 500
  });
});