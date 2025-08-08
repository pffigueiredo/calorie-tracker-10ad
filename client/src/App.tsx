import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { FoodEntry, CreateFoodEntryInput, DailyCalorieTotal } from '../../server/src/schema';

function App() {
  const [todaysEntries, setTodaysEntries] = useState<FoodEntry[]>([]);
  const [dailyTotal, setDailyTotal] = useState<DailyCalorieTotal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateFoodEntryInput>({
    name: '',
    calories: 0
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Load today's entries and total
  const loadTodaysData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load today's entries and daily total in parallel
      const [entries, total] = await Promise.all([
        trpc.getEntriesByDate.query({ date: today }),
        trpc.getDailyTotal.query({ date: today })
      ]);
      setTodaysEntries(entries);
      setDailyTotal(total);
    } catch (error) {
      console.error('Failed to load today\'s data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadTodaysData();
  }, [loadTodaysData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.calories <= 0) return;

    setIsSubmitting(true);
    try {
      const newEntry = await trpc.createFoodEntry.mutate(formData);
      
      // Update today's entries
      setTodaysEntries((prev: FoodEntry[]) => [newEntry, ...prev]);
      
      // Update daily total
      if (dailyTotal) {
        setDailyTotal((prev: DailyCalorieTotal | null) => prev ? {
          ...prev,
          total_calories: prev.total_calories + formData.calories
        } : null);
      }
      
      // Reset form
      setFormData({
        name: '',
        calories: 0
      });
    } catch (error) {
      console.error('Failed to create food entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🥗 Daily Calorie Tracker
          </h1>
          <p className="text-gray-600 text-lg">
            Track your meals and stay on top of your nutrition goals
          </p>
        </div>

        {/* Today's Summary Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-700">
              📅 {formatDate(new Date())}
            </CardTitle>
            <CardDescription>
              Your calorie intake for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {dailyTotal?.total_calories || 0}
                </div>
                <p className="text-gray-600 text-lg">calories consumed</p>
                <Badge variant="secondary" className="mt-2">
                  {todaysEntries.length} {todaysEntries.length === 1 ? 'entry' : 'entries'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Food Entry Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🍎</span>
              Add Food Entry
            </CardTitle>
            <CardDescription>
              Log a new meal or snack
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="food-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Food Name
                  </label>
                  <Input
                    id="food-name"
                    placeholder="e.g., Grilled chicken breast"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFoodEntryInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-2">
                    Calories
                  </label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="e.g., 250"
                    value={formData.calories || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFoodEntryInput) => ({ 
                        ...prev, 
                        calories: parseInt(e.target.value) || 0 
                      }))
                    }
                    min="1"
                    required
                    className="w-full"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.name.trim() || formData.calories <= 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Adding Entry...
                  </>
                ) : (
                  <>
                    <span className="mr-2">➕</span>
                    Add Food Entry
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Today's Entries */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              Today's Entries
            </CardTitle>
            <CardDescription>
              All the foods you've logged today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-gray-500 text-lg mb-2">No entries yet today</p>
                <p className="text-gray-400">Add your first meal above to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysEntries.map((entry: FoodEntry, index: number) => (
                  <div key={entry.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {index % 4 === 0 ? '🍎' : index % 4 === 1 ? '🥗' : index % 4 === 2 ? '🍖' : '🥪'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{entry.name}</h3>
                        <p className="text-sm text-gray-500">
                          Added at {entry.created_at.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                      {entry.calories} cal
                    </Badge>
                  </div>
                ))}
                
                {todaysEntries.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                          <h3 className="font-bold text-gray-800">Daily Total</h3>
                          <p className="text-sm text-gray-600">{todaysEntries.length} entries</p>
                        </div>
                      </div>
                      <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                        {dailyTotal?.total_calories || 0} cal
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            💡 Note: Backend handlers are currently using placeholder data. 
            Food entries will reset when the server restarts.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;