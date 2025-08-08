import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createFoodEntryInputSchema, 
  getEntriesByDateInputSchema 
} from './schema';

// Import handlers
import { createFoodEntry } from './handlers/create_food_entry';
import { getFoodEntries } from './handlers/get_food_entries';
import { getEntriesByDate } from './handlers/get_entries_by_date';
import { getDailyTotal } from './handlers/get_daily_total';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new food entry
  createFoodEntry: publicProcedure
    .input(createFoodEntryInputSchema)
    .mutation(({ input }) => createFoodEntry(input)),
  
  // Get all food entries
  getFoodEntries: publicProcedure
    .query(() => getFoodEntries()),
  
  // Get food entries for a specific date
  getEntriesByDate: publicProcedure
    .input(getEntriesByDateInputSchema)
    .query(({ input }) => getEntriesByDate(input)),
  
  // Get daily calorie total for a specific date
  getDailyTotal: publicProcedure
    .input(getEntriesByDateInputSchema)
    .query(({ input }) => getDailyTotal(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();