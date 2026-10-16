import type { Achievement } from "@/types";
import type { AppState } from "@/lib/store";
import { lastNDays } from "@/lib/utils";

export function computeAchievements(s: AppState): Achievement[] {
  const realSessions = s.sessions.length;
  const loggedDays = new Set(s.foodEntries.map((e) => e.date)).size;
  const waterDays = new Set(s.hydration.map((h) => h.date)).size;
  const habitChecks = s.habitEntries.length;
  const weekWorkouts = s.sessions.filter((x) => lastNDays(7).includes(x.startedAt.slice(0, 10))).length;
  const a = (id: string, title: string, description: string, icon: string, target: number, progress: number): Achievement =>
    ({ id, title, description, icon, target, progress: Math.min(progress, target), unlocked: progress >= target });
  return [
    a("first-workout", "First Rep", "Complete your first workout session.", "Dumbbell", 1, realSessions),
    a("five-workouts", "Finding Rhythm", "Complete five workout sessions.", "Flame", 5, realSessions),
    a("twenty-workouts", "Committed", "Complete twenty workout sessions.", "Trophy", 20, realSessions),
    a("week-logging", "Mindful Eater", "Log meals on seven different days.", "Utensils", 7, loggedDays),
    a("hydration", "Hydration Habit", "Record water intake on 7 different days.", "Droplets", 7, waterDays),
    a("explorer", "Library Explorer", "View 10 different exercises.", "Compass", 10, s.recentExercises.length),
    a("meal-plan", "Planner", "Save your first meal plan.", "CalendarCheck", 1, s.mealPlans.length),
    a("builder", "Architect", "Create your own workout plan.", "Hammer", 1, s.plans.length),
    a("habits", "Small Wins", "Complete 25 habit check-ins.", "CheckCircle2", 25, habitChecks),
    a("weekly-3", "Weekly Goal", "Complete 3 workouts within 7 days.", "Target", 3, weekWorkouts),
  ];
}
