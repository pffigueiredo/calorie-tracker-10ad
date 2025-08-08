import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type GetEntriesByDateInput } from '../schema';
import { getEntriesByDate } from '../handlers/get_entries_by_date';

describe('getEntriesByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return entries for a specific date', async () => {
    // Create test entries for different dates
    const today = new Date('2024-01-15T10:30:00Z');
    const yesterday = new Date('2024-01-14T15:45:00Z');
    
    await db.insert(foodEntriesTable)
      .values([
        { name: 'Apple', calories: 95, created_at: today },
        { name: 'Banana', calories: 105, created_at: today },
        { name: 'Orange', calories: 85, created_at: yesterday }
      ])
      .execute();

    const input: GetEntriesByDateInput = {
      date: '2024-01-15'
    };

    const result = await getEntriesByDate(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Apple');
    expect(result[0].calories).toEqual(95);
    expect(result[1].name).toEqual('Banana');
    expect(result[1].calories).toEqual(105);
    
    // Verify all entries are from the requested date
    result.forEach(entry => {
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.created_at.toISOString().split('T')[0]).toEqual('2024-01-15');
    });
  });

  it('should return empty array when no entries exist for date', async () => {
    // Create an entry for a different date
    const otherDate = new Date('2024-01-10T12:00:00Z');
    
    await db.insert(foodEntriesTable)
      .values({ name: 'Test Food', calories: 200, created_at: otherDate })
      .execute();

    const input: GetEntriesByDateInput = {
      date: '2024-01-15'
    };

    const result = await getEntriesByDate(input);

    expect(result).toHaveLength(0);
  });

  it('should default to today when no date is provided', async () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Create entries for today and yesterday
    const todayEntry = new Date();
    const yesterdayEntry = new Date();
    yesterdayEntry.setDate(yesterdayEntry.getDate() - 1);
    
    await db.insert(foodEntriesTable)
      .values([
        { name: 'Today Food', calories: 150, created_at: todayEntry },
        { name: 'Yesterday Food', calories: 200, created_at: yesterdayEntry }
      ])
      .execute();

    const input: GetEntriesByDateInput = {}; // No date provided

    const result = await getEntriesByDate(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Today Food');
    expect(result[0].calories).toEqual(150);
    expect(result[0].created_at.toISOString().split('T')[0]).toEqual(todayString);
  });

  it('should return entries ordered by created_at', async () => {
    const targetDate = '2024-01-15';
    
    // Create entries with different times on the same date
    const morning = new Date('2024-01-15T08:00:00Z');
    const afternoon = new Date('2024-01-15T14:30:00Z');
    const evening = new Date('2024-01-15T20:15:00Z');
    
    await db.insert(foodEntriesTable)
      .values([
        { name: 'Dinner', calories: 600, created_at: evening },
        { name: 'Breakfast', calories: 300, created_at: morning },
        { name: 'Lunch', calories: 450, created_at: afternoon }
      ])
      .execute();

    const input: GetEntriesByDateInput = {
      date: targetDate
    };

    const result = await getEntriesByDate(input);

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Breakfast');
    expect(result[1].name).toEqual('Lunch');
    expect(result[2].name).toEqual('Dinner');
    
    // Verify chronological order
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeLessThan(result[2].created_at.getTime());
  });

  it('should handle entries spanning across midnight correctly', async () => {
    // Create entries just before and after midnight
    const lateNight = new Date('2024-01-15T23:59:00Z');
    const earlyMorning = new Date('2024-01-16T00:01:00Z');
    
    await db.insert(foodEntriesTable)
      .values([
        { name: 'Late Snack', calories: 100, created_at: lateNight },
        { name: 'Early Breakfast', calories: 250, created_at: earlyMorning }
      ])
      .execute();

    // Query for January 15th
    const jan15Input: GetEntriesByDateInput = {
      date: '2024-01-15'
    };

    const jan15Result = await getEntriesByDate(jan15Input);

    expect(jan15Result).toHaveLength(1);
    expect(jan15Result[0].name).toEqual('Late Snack');

    // Query for January 16th
    const jan16Input: GetEntriesByDateInput = {
      date: '2024-01-16'
    };

    const jan16Result = await getEntriesByDate(jan16Input);

    expect(jan16Result).toHaveLength(1);
    expect(jan16Result[0].name).toEqual('Early Breakfast');
  });

  it('should include all required fields in returned entries', async () => {
    const testDate = new Date('2024-01-15T12:00:00Z');
    
    await db.insert(foodEntriesTable)
      .values({ name: 'Test Entry', calories: 123, created_at: testDate })
      .execute();

    const input: GetEntriesByDateInput = {
      date: '2024-01-15'
    };

    const result = await getEntriesByDate(input);

    expect(result).toHaveLength(1);
    
    const entry = result[0];
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe('number');
    expect(entry.name).toEqual('Test Entry');
    expect(entry.calories).toEqual(123);
    expect(entry.created_at).toBeInstanceOf(Date);
  });
});