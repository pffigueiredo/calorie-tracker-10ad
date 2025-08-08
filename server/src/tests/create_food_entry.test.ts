import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput } from '../schema';
import { createFoodEntry } from '../handlers/create_food_entry';
import { eq, gte } from 'drizzle-orm';

// Simple test input
const testInput: CreateFoodEntryInput = {
  name: 'Apple',
  calories: 95
};

describe('createFoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food entry', async () => {
    const result = await createFoodEntry(testInput);

    // Basic field validation
    expect(result.name).toEqual('Apple');
    expect(result.calories).toEqual(95);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save food entry to database', async () => {
    const result = await createFoodEntry(testInput);

    // Query using proper drizzle syntax
    const entries = await db.select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toEqual('Apple');
    expect(entries[0].calories).toEqual(95);
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different food types correctly', async () => {
    const pizzaInput: CreateFoodEntryInput = {
      name: 'Pizza Slice',
      calories: 285
    };

    const result = await createFoodEntry(pizzaInput);

    expect(result.name).toEqual('Pizza Slice');
    expect(result.calories).toEqual(285);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const entries = await db.select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.id, result.id))
      .execute();

    expect(entries[0].name).toEqual('Pizza Slice');
    expect(entries[0].calories).toEqual(285);
  });

  it('should handle zero calories correctly', async () => {
    const zeroCalorieInput: CreateFoodEntryInput = {
      name: 'Water',
      calories: 0
    };

    const result = await createFoodEntry(zeroCalorieInput);

    expect(result.name).toEqual('Water');
    expect(result.calories).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createFoodEntry(testInput);
    const afterCreation = new Date();

    // Verify timestamp is within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
  });

  it('should query food entries by date range correctly', async () => {
    // Create test food entry
    await createFoodEntry(testInput);

    // Test date filtering - demonstration of correct date handling
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Query entries created today or later
    const entries = await db.select()
      .from(foodEntriesTable)
      .where(gte(foodEntriesTable.created_at, yesterday))
      .execute();

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(entry => {
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.created_at >= yesterday).toBe(true);
    });
  });

  it('should create multiple entries independently', async () => {
    const input1: CreateFoodEntryInput = {
      name: 'Banana',
      calories: 105
    };

    const input2: CreateFoodEntryInput = {
      name: 'Orange',
      calories: 62
    };

    const result1 = await createFoodEntry(input1);
    const result2 = await createFoodEntry(input2);

    // Both entries should have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Banana');
    expect(result2.name).toEqual('Orange');
    expect(result1.calories).toEqual(105);
    expect(result2.calories).toEqual(62);

    // Verify both exist in database
    const allEntries = await db.select()
      .from(foodEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });
});