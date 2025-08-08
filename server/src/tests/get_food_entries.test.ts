import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput } from '../schema';
import { getFoodEntries } from '../handlers/get_food_entries';

// Test food entry data
const testEntries: CreateFoodEntryInput[] = [
  {
    name: 'Apple',
    calories: 95
  },
  {
    name: 'Banana',
    calories: 105
  },
  {
    name: 'Orange',
    calories: 62
  }
];

describe('getFoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getFoodEntries();

    expect(result).toEqual([]);
  });

  it('should return all food entries', async () => {
    // Insert test data
    await db.insert(foodEntriesTable)
      .values(testEntries)
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(3);
    
    // Check that all entries are returned with proper structure
    const entryNames = result.map(entry => entry.name);
    expect(entryNames).toContain('Apple');
    expect(entryNames).toContain('Banana');
    expect(entryNames).toContain('Orange');

    // Verify each entry has required fields
    result.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.calories).toBe('number');
      expect(entry.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return entries ordered by creation date (most recent first)', async () => {
    // Insert entries one by one with slight delays to ensure different timestamps
    await db.insert(foodEntriesTable)
      .values({ name: 'First Entry', calories: 100 })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(foodEntriesTable)
      .values({ name: 'Second Entry', calories: 200 })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(foodEntriesTable)
      .values({ name: 'Third Entry', calories: 300 })
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(3);
    
    // Check ordering - most recent first
    expect(result[0].name).toBe('Third Entry');
    expect(result[1].name).toBe('Second Entry');
    expect(result[2].name).toBe('First Entry');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle entries with various calorie values correctly', async () => {
    // Test edge cases for calories
    const edgeCaseEntries = [
      { name: 'Zero Calorie Item', calories: 0 },
      { name: 'High Calorie Item', calories: 999999 },
      { name: 'Regular Item', calories: 250 }
    ];

    await db.insert(foodEntriesTable)
      .values(edgeCaseEntries)
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(3);
    
    // Find specific entries and verify calories
    const zeroCalEntry = result.find(entry => entry.name === 'Zero Calorie Item');
    const highCalEntry = result.find(entry => entry.name === 'High Calorie Item');
    const regularEntry = result.find(entry => entry.name === 'Regular Item');

    expect(zeroCalEntry?.calories).toBe(0);
    expect(highCalEntry?.calories).toBe(999999);
    expect(regularEntry?.calories).toBe(250);
  });

  it('should verify entries are properly saved to database', async () => {
    // Insert a test entry
    const testEntry = { name: 'Database Test Entry', calories: 150 };
    await db.insert(foodEntriesTable)
      .values(testEntry)
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Database Test Entry');
    expect(result[0].calories).toBe(150);

    // Verify the entry exists in database by direct query
    const directQuery = await db.select()
      .from(foodEntriesTable)
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].name).toBe('Database Test Entry');
    expect(directQuery[0].calories).toBe(150);
  });
});