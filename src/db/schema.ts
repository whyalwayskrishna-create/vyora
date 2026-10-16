import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Per-device app state snapshot (demo-mode sync without authentication). */
export const appState = pgTable("app_state", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Queue of AI demo video requests (only processed if a video provider is configured). */
export const demoRequests = pgTable("demo_requests", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
