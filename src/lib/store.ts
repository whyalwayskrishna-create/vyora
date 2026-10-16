"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ActiveSession, AppNotification, BodyMeasurement, ChatMessage, FoodEntry, FoodItem, GroceryItem, Habit, HabitEntry,
  HydrationEntry, MealPlan, MealType, NutritionTargets, ReadinessEntry, Settings, SleepEntry, UserProfile, WorkoutPlan, WorkoutSession,
} from "@/types";
import { TEMPLATES } from "@/data/workouts";
import { FOODS } from "@/data/foods";
import { addDays, lastNDays, todayKey, uid, weekdayOf } from "./utils";

export interface SavedMeal { id: string; name: string; items: { foodId: string; grams: number; unitLabel: string; quantity: number }[] }

export interface AppState {
  onboarded: boolean;
  profile: UserProfile;
  settings: Settings;
  targets: NutritionTargets | null;
  targetsSource: "user" | "estimate" | "demo" | null;
  favExercises: string[];
  favPlans: string[];
  favFoods: string[];
  savedRecipes: string[];
  recentExercises: string[];
  recentFoods: string[];
  recentSearches: string[];
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  active: ActiveSession | null;
  customFoods: FoodItem[];
  foodEntries: FoodEntry[];
  savedMeals: SavedMeal[];
  mealPlans: MealPlan[];
  grocery: GroceryItem[];
  hydration: HydrationEntry[];
  sleep: SleepEntry[];
  readiness: ReadinessEntry[];
  measurements: BodyMeasurement[];
  habits: Habit[];
  habitEntries: HabitEntry[];
  steps: Record<string, number>;
  chat: ChatMessage[];
  notifications: AppNotification[];
  seenAchievements: string[];
  demoRequests: Record<string, { status: "queued" | "unavailable" | "error"; at: string; message?: string }>;
  hasDemoData: boolean;
  joinedChallenges: Record<string, string>;
}

interface Actions {
  set: (p: Partial<AppState>) => void;
  completeOnboarding: (p: UserProfile, withDemo: boolean) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setTargets: (t: NutritionTargets | null, src: AppState["targetsSource"]) => void;
  toggleFavExercise: (id: string) => void;
  toggleFavPlan: (id: string) => void;
  toggleFavFood: (id: string) => void;
  toggleSavedRecipe: (id: string) => void;
  viewExercise: (id: string) => void;
  addSearch: (q: string) => void;
  savePlan: (p: WorkoutPlan) => void;
  deletePlan: (id: string) => void;
  duplicatePlan: (id: string) => string | null;
  startSession: (planId: string) => boolean;
  setActive: (a: ActiveSession | null) => void;
  finishSession: (effort: number, notes: string) => string | null;
  addFoodEntry: (e: Omit<FoodEntry, "id" | "createdAt">) => void;
  updateFoodEntry: (id: string, p: Partial<FoodEntry>) => void;
  deleteFoodEntry: (id: string) => void;
  copyMeal: (fromDate: string, meal: MealType, toDate: string, toMeal?: MealType) => number;
  saveMeal: (name: string, date: string, meal: MealType) => void;
  deleteSavedMeal: (id: string) => void;
  addCustomFood: (f: FoodItem) => void;
  addWater: (ml: number, date?: string) => void;
  deleteWater: (id: string) => void;
  addSleep: (s: Omit<SleepEntry, "id">) => void;
  deleteSleep: (id: string) => void;
  addReadiness: (r: Omit<ReadinessEntry, "id">) => void;
  addMeasurement: (m: Omit<BodyMeasurement, "id">) => void;
  deleteMeasurement: (id: string) => void;
  addHabit: (name: string, icon: string, reminder?: string) => void;
  updateHabit: (id: string, p: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  setSteps: (date: string, n: number) => void;
  addChat: (m: ChatMessage) => void;
  updateChat: (id: string, p: Partial<ChatMessage>) => void;
  clearChat: () => void;
  notify: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  saveMealPlan: (p: MealPlan) => void;
  deleteMealPlan: (id: string) => void;
  setGrocery: (g: GroceryItem[]) => void;
  loadDemo: () => void;
  clearDemo: () => void;
  resetAll: () => void;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "", ageRange: "25–34", units: "metric", region: "United States", language: "English",
  goals: ["Improve general fitness"], experience: "Beginner", equipment: ["No equipment"], duration: 40,
  days: ["Mon", "Wed", "Fri"], environment: "Home", activities: [], diet: "No preference", allergies: [],
};
export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  reminders: {
    workouts: { enabled: true, time: "18:00" }, meals: { enabled: false, time: "12:30" }, hydration: { enabled: true, time: "10:00" },
    habits: { enabled: true, time: "20:00" }, reports: { enabled: true, time: "09:00" },
  },
  saveChatHistory: true, shareContextWithCoach: true, timerSound: true, timerVibrate: true,
};

const initial: AppState = {
  onboarded: false, profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS, targets: null, targetsSource: null,
  favExercises: [], favPlans: [], favFoods: [], savedRecipes: [], recentExercises: [], recentFoods: [], recentSearches: [],
  plans: [], sessions: [], active: null, customFoods: [], foodEntries: [], savedMeals: [], mealPlans: [], grocery: [],
  hydration: [], sleep: [], readiness: [], measurements: [], habits: [], habitEntries: [], steps: {}, chat: [], notifications: [],
  seenAchievements: [], demoRequests: {}, hasDemoData: false, joinedChallenges: {},
};

export const getAllPlans = (s: Pick<AppState, "plans">) => [...s.plans, ...TEMPLATES];
export const getPlan = (s: Pick<AppState, "plans">, id: string) => getAllPlans(s).find((p) => p.id === id);
export const getFoodMap = (s: Pick<AppState, "customFoods">): Record<string, FoodItem> =>
  Object.fromEntries([...FOODS, ...s.customFoods].map((f) => [f.id, f]));

function buildDemo(): Partial<AppState> {
  const today = todayKey();
  const sessions: WorkoutSession[] = [];
  const pattern = [-20, -18, -16, -13, -11, -9, -6, -4, -2, -1];
  const tplCycle = ["tpl-full-body", "tpl-bodyweight", "tpl-mobility", "tpl-dumbbell", "tpl-express"];
  pattern.forEach((off, i) => {
    const tpl = TEMPLATES.find((t) => t.id === tplCycle[i % tplCycle.length])!;
    const date = addDays(today, off);
    const dur = 1800 + ((i * 397) % 1200);
    const start = new Date(`${date}T18:00:00`);
    sessions.push({
      id: "demo-s" + i, planId: tpl.id, planName: tpl.name, startedAt: start.toISOString(), endedAt: new Date(start.getTime() + dur * 1000).toISOString(),
      durationSec: dur, effort: 5 + (i % 4), demo: true, notes: "",
      exercises: tpl.exercises.map((we, j) => ({
        exerciseId: we.exerciseId, target: we,
        sets: Array.from({ length: we.sets }, () => ({ reps: we.reps + (i > 5 ? 1 : 0), weight: we.exerciseId.includes("db") || we.exerciseId.includes("goblet") || we.exerciseId.includes("romanian") ? 10 + Math.floor(i / 2) * 2 + j : undefined, durationSec: we.durationSec, done: true })),
      })),
    });
  });
  const foodEntries: FoodEntry[] = [];
  const dayMenus: [MealType, string, number, string, number][][] = [
    [["Breakfast", "oats", 50, "g", 50], ["Breakfast", "banana", 118, "1 medium (118 g)", 1], ["Lunch", "chicken-breast", 150, "g", 150], ["Lunch", "brown-rice", 195, "1 cup (195 g)", 1], ["Dinner", "salmon", 154, "1 fillet (154 g)", 1], ["Dinner", "sweet-potato", 200, "g", 200], ["Snacks", "greek-yogurt", 170, "1 pot (170 g)", 1]],
    [["Breakfast", "egg", 100, "1 large (50 g)", 2], ["Breakfast", "wholegrain-bread", 64, "1 slice (32 g)", 2], ["Lunch", "lentils", 198, "1 cup (198 g)", 1], ["Lunch", "spinach", 60, "1 cup (30 g)", 2], ["Dinner", "tofu", 175, "½ block (175 g)", 1], ["Dinner", "quinoa", 185, "1 cup (185 g)", 1], ["Snacks", "almonds", 28, "Handful (28 g)", 1]],
  ];
  lastNDays(7).forEach((d, i) => {
    if (d === today) {
      foodEntries.push({ id: uid(), date: d, meal: "Breakfast", foodId: "greek-yogurt", grams: 170, unitLabel: "1 pot (170 g)", quantity: 1, createdAt: new Date().toISOString() });
      foodEntries.push({ id: uid(), date: d, meal: "Breakfast", foodId: "blueberries", grams: 74, unitLabel: "g", quantity: 74, createdAt: new Date().toISOString() });
      return;
    }
    dayMenus[i % 2].forEach(([meal, foodId, grams, unitLabel, quantity]) => foodEntries.push({ id: uid(), date: d, meal, foodId, grams, unitLabel, quantity, createdAt: new Date().toISOString() }));
  });
  const hydration: HydrationEntry[] = [];
  lastNDays(14).forEach((d, i) => {
    const count = d === today ? 2 : 4 + (i % 4);
    for (let k = 0; k < count; k++) hydration.push({ id: uid(), date: d, ml: k % 2 ? 500 : 250, at: `${d}T${String(8 + k * 2).padStart(2, "0")}:00:00` });
  });
  const sleep: SleepEntry[] = lastNDays(14).filter((d) => d !== today).map((d, i) => {
    const hours = 6.3 + ((i * 37) % 20) / 10;
    return { id: uid(), date: d, bedtime: "23:00", wake: `0${Math.floor(5 + hours - 6)}:${hours % 1 >= 0.5 ? "30" : "00"}`.slice(-5), hours: Math.round(hours * 10) / 10, quality: 3 + (i % 3) };
  });
  const measurements: BodyMeasurement[] = [-56, -42, -28, -14, 0].map((off, i) => ({ id: uid(), date: addDays(today, off), weightKg: 74.2 - i * 0.3, waistCm: 84 - i * 0.4, hipCm: 98 }));
  const habits: Habit[] = [
    { id: "h1", name: "Take a movement break", icon: "Footprints", reminder: "11:00", createdAt: addDays(today, -21) },
    { id: "h2", name: "Practice mobility for 10 min", icon: "StretchHorizontal", reminder: "07:30", createdAt: addDays(today, -21) },
    { id: "h3", name: "Prepare tomorrow's meals", icon: "ChefHat", reminder: "20:00", createdAt: addDays(today, -21) },
    { id: "h4", name: "Lights out by 23:00", icon: "Moon", reminder: "22:30", createdAt: addDays(today, -21) },
  ];
  const habitEntries: HabitEntry[] = [];
  lastNDays(21).forEach((d, i) => habits.forEach((h, j) => { if (d !== today && (i + j) % 3 !== 0) habitEntries.push({ habitId: h.id, date: d }); }));
  const steps: Record<string, number> = {};
  lastNDays(14).forEach((d, i) => { if (d !== today) steps[d] = 5200 + ((i * 1733) % 5200); });
  return {
    sessions, foodEntries, hydration, sleep, measurements, habits, habitEntries, steps, hasDemoData: true,
    targets: { kcal: 2200, protein: 120, carbs: 250, fat: 75, fiber: 30, water: 2500 }, targetsSource: "demo",
    readiness: lastNDays(7).filter((d) => d !== today).map((d, i) => ({ id: uid(), date: d, score: 6 + (i % 4), soreness: 2 + (i % 3), energy: 6 + (i % 3) })),
    notifications: [
      { id: uid(), title: "Welcome to VYORA", body: "Your dashboard is ready. Sample demo data is loaded — you can clear it anytime in Settings.", at: new Date().toISOString(), read: false, category: "system", href: "/settings" },
      { id: uid(), title: "Weekly report available", body: "Your weekly summary is ready to review.", at: new Date().toISOString(), read: false, category: "reports", href: "/progress/report" },
    ],
  };
}

export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (p) => set(p),
      completeOnboarding: (profile, withDemo) => {
        set({ profile, onboarded: true });
        if (withDemo) get().loadDemo();
        else set({ notifications: [{ id: uid(), title: "Welcome to VYORA", body: "Start by exploring workouts or logging your first meal.", at: new Date().toISOString(), read: false, category: "system" }] });
      },
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setTargets: (targets, targetsSource) => set({ targets, targetsSource }),
      toggleFavExercise: (id) => set((s) => ({ favExercises: s.favExercises.includes(id) ? s.favExercises.filter((x) => x !== id) : [id, ...s.favExercises] })),
      toggleFavPlan: (id) => set((s) => ({ favPlans: s.favPlans.includes(id) ? s.favPlans.filter((x) => x !== id) : [id, ...s.favPlans] })),
      toggleFavFood: (id) => set((s) => ({ favFoods: s.favFoods.includes(id) ? s.favFoods.filter((x) => x !== id) : [id, ...s.favFoods] })),
      toggleSavedRecipe: (id) => set((s) => ({ savedRecipes: s.savedRecipes.includes(id) ? s.savedRecipes.filter((x) => x !== id) : [id, ...s.savedRecipes] })),
      viewExercise: (id) => set((s) => ({ recentExercises: [id, ...s.recentExercises.filter((x) => x !== id)].slice(0, 12) })),
      addSearch: (q) => { const t = q.trim(); if (t.length < 2) return; set((s) => ({ recentSearches: [t, ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) })); },
      savePlan: (p) => set((s) => ({ plans: s.plans.some((x) => x.id === p.id) ? s.plans.map((x) => (x.id === p.id ? p : x)) : [p, ...s.plans] })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id), favPlans: s.favPlans.filter((x) => x !== id) })),
      duplicatePlan: (id) => {
        const p = getPlan(get(), id); if (!p) return null;
        const np: WorkoutPlan = { ...p, id: uid(), name: `${p.name} (copy)`, isTemplate: false, source: "custom", createdAt: new Date().toISOString(), exercises: p.exercises.map((e) => ({ ...e, uid: uid() })) };
        set((s) => ({ plans: [np, ...s.plans] })); return np.id;
      },
      startSession: (planId) => {
        const p = getPlan(get(), planId); if (!p || !p.exercises.length) return false;
        const session: WorkoutSession = {
          id: uid(), planId, planName: p.name, startedAt: new Date().toISOString(), durationSec: 0,
          exercises: p.exercises.map((we) => ({ exerciseId: we.exerciseId, target: we, sets: Array.from({ length: we.sets }, () => ({ reps: we.reps, durationSec: we.durationSec, done: false })) })),
        };
        set({ active: { session, exIndex: 0, setIndex: 0, paused: false, elapsedBeforePause: 0, resumedAt: Date.now() } });
        return true;
      },
      setActive: (active) => set({ active }),
      finishSession: (effort, notes) => {
        const a = get().active; if (!a) return null;
        const elapsed = a.elapsedBeforePause + (a.paused ? 0 : (Date.now() - a.resumedAt) / 1000);
        const s: WorkoutSession = { ...a.session, endedAt: new Date().toISOString(), durationSec: Math.round(elapsed), effort, notes };
        set((st) => ({
          sessions: [s, ...st.sessions], active: null,
          notifications: [{ id: uid(), title: "Workout completed", body: `${s.planName} saved to your history.`, at: new Date().toISOString(), read: false, category: "workouts", href: `/workouts/history/${s.id}` }, ...st.notifications],
        }));
        return s.id;
      },
      addFoodEntry: (e) => set((s) => ({ foodEntries: [...s.foodEntries, { ...e, id: uid(), createdAt: new Date().toISOString() }], recentFoods: [e.foodId, ...s.recentFoods.filter((x) => x !== e.foodId)].slice(0, 12) })),
      updateFoodEntry: (id, p) => set((s) => ({ foodEntries: s.foodEntries.map((e) => (e.id === id ? { ...e, ...p } : e)) })),
      deleteFoodEntry: (id) => set((s) => ({ foodEntries: s.foodEntries.filter((e) => e.id !== id) })),
      copyMeal: (fromDate, meal, toDate, toMeal) => {
        const items = get().foodEntries.filter((e) => e.date === fromDate && e.meal === meal);
        set((s) => ({ foodEntries: [...s.foodEntries, ...items.map((e) => ({ ...e, id: uid(), date: toDate, meal: toMeal ?? meal, createdAt: new Date().toISOString() }))] }));
        return items.length;
      },
      saveMeal: (name, date, meal) => {
        const items = get().foodEntries.filter((e) => e.date === date && e.meal === meal).map(({ foodId, grams, unitLabel, quantity }) => ({ foodId, grams, unitLabel, quantity }));
        if (items.length) set((s) => ({ savedMeals: [{ id: uid(), name, items }, ...s.savedMeals] }));
      },
      deleteSavedMeal: (id) => set((s) => ({ savedMeals: s.savedMeals.filter((m) => m.id !== id) })),
      addCustomFood: (f) => set((s) => ({ customFoods: [f, ...s.customFoods] })),
      addWater: (ml, date = todayKey()) => set((s) => ({ hydration: [...s.hydration, { id: uid(), date, ml, at: new Date().toISOString() }] })),
      deleteWater: (id) => set((s) => ({ hydration: s.hydration.filter((h) => h.id !== id) })),
      addSleep: (e) => set((s) => ({ sleep: [{ ...e, id: uid() }, ...s.sleep.filter((x) => x.date !== e.date)] })),
      deleteSleep: (id) => set((s) => ({ sleep: s.sleep.filter((x) => x.id !== id) })),
      addReadiness: (r) => set((s) => ({ readiness: [{ ...r, id: uid() }, ...s.readiness.filter((x) => x.date !== r.date)] })),
      addMeasurement: (m) => set((s) => ({ measurements: [...s.measurements, { ...m, id: uid() }].sort((a, b) => a.date.localeCompare(b.date)) })),
      deleteMeasurement: (id) => set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),
      addHabit: (name, icon, reminder) => set((s) => ({ habits: [...s.habits, { id: uid(), name, icon, reminder, createdAt: todayKey() }] })),
      updateHabit: (id, p) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...p } : h)) })),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id), habitEntries: s.habitEntries.filter((e) => e.habitId !== id) })),
      toggleHabit: (habitId, date) => set((s) => ({
        habitEntries: s.habitEntries.some((e) => e.habitId === habitId && e.date === date)
          ? s.habitEntries.filter((e) => !(e.habitId === habitId && e.date === date)) : [...s.habitEntries, { habitId, date }],
      })),
      setSteps: (date, n) => set((s) => ({ steps: { ...s.steps, [date]: n } })),
      addChat: (m) => set((s) => ({ chat: [...s.chat, m] })),
      updateChat: (id, p) => set((s) => ({ chat: s.chat.map((m) => (m.id === id ? { ...m, ...p } : m)) })),
      clearChat: () => set({ chat: [] }),
      notify: (n) => set((s) => ({ notifications: [{ ...n, id: uid(), at: new Date().toISOString(), read: false }, ...s.notifications].slice(0, 50) })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),
      saveMealPlan: (p) => set((s) => ({ mealPlans: s.mealPlans.some((x) => x.id === p.id) ? s.mealPlans.map((x) => (x.id === p.id ? p : x)) : [p, ...s.mealPlans] })),
      deleteMealPlan: (id) => set((s) => ({ mealPlans: s.mealPlans.filter((p) => p.id !== id) })),
      setGrocery: (grocery) => set({ grocery }),
      loadDemo: () => { get().clearDemo(); set(buildDemo()); },
      clearDemo: () => set((s) => ({
        sessions: s.sessions.filter((x) => !x.demo), hasDemoData: false,
        ...(s.hasDemoData ? { foodEntries: [], hydration: [], sleep: [], measurements: [], habits: [], habitEntries: [], steps: {}, readiness: [], targets: s.targetsSource === "demo" ? null : s.targets, targetsSource: s.targetsSource === "demo" ? null : s.targetsSource } : {}),
      })),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: "vyora-store", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true,
      partialize: (s) => {
        const { settings, chat, ...rest } = s;
        return { ...rest, settings, chat: settings.saveChatHistory ? chat : [] };
      },
      merge: (persisted, current) => {
        const p = (persisted && typeof persisted === "object" ? persisted : {}) as Partial<AppState>;
        const safe: Partial<AppState> = {};
        for (const k of Object.keys(initial) as (keyof AppState)[]) {
          const v = p[k];
          if (v === undefined || v === null) continue;
          if (Array.isArray(initial[k]) && !Array.isArray(v)) continue;
          (safe as Record<string, unknown>)[k] = v;
        }
        return { ...current, ...safe, profile: { ...DEFAULT_PROFILE, ...(safe.profile ?? {}) }, settings: { ...DEFAULT_SETTINGS, ...(safe.settings ?? {}), reminders: { ...DEFAULT_SETTINGS.reminders, ...(safe.settings?.reminders ?? {}) } } };
      },
    }
  )
);

export function dataSnapshot(): Partial<AppState> {
  const s = useStore.getState();
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(initial)) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out as Partial<AppState>;
}

export function todaysPlan(s: Pick<AppState, "plans" | "profile">) {
  const wd = weekdayOf(todayKey());
  const scheduled = s.plans.find((p) => p.scheduledDays?.includes(wd));
  if (scheduled) return { plan: scheduled, scheduled: true };
  const isTrainingDay = s.profile.days.includes(wd);
  const env = s.profile.environment;
  const noEquip = s.profile.equipment.every((e) => e === "No equipment");
  const id = !isTrainingDay ? "tpl-mobility" : noEquip ? "tpl-bodyweight" : env === "Gym" ? "tpl-upper" : s.profile.equipment.includes("Dumbbells") ? "tpl-dumbbell" : "tpl-full-body";
  return { plan: TEMPLATES.find((t) => t.id === id)!, scheduled: false, restDay: !isTrainingDay };
}
