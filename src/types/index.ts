export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type MuscleGroup =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Quads"
  | "Hamstrings & Glutes" | "Calves" | "Core" | "Full Body" | "Mobility" | "Cardio";
export type Equipment =
  | "None" | "Resistance Band" | "Dumbbells" | "Barbell" | "Cable" | "Machine"
  | "Kettlebell" | "Pull-up Bar" | "Bench" | "Cardio Machine" | "Pool";
export type AnimPattern =
  | "squat" | "pushup" | "press" | "row" | "curl" | "raise" | "hinge" | "lunge"
  | "plank" | "crunch" | "jump" | "calf" | "pullup" | "bridge" | "walk" | "stretch" | "extension" | "fly";

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  secondary: string[];
  equipment: Equipment[];
  difficulty: Difficulty;
  category: "Strength" | "Cardio" | "Mobility" | "Conditioning" | "Core";
  pattern: string;
  anim: AnimPattern;
  location: ("Home" | "Gym")[];
  start: string;
  steps: string[];
  breathing: string;
  sets: string;
  rest: string;
  easier?: string;
  harder?: string;
  mistakes: string[];
  safety: string[];
  tags: string[];
  videoUrl?: string;
}

export interface UserProfile {
  name: string;
  ageRange: string;
  units: "metric" | "imperial";
  region: string;
  language: string;
  goals: string[];
  experience: Difficulty;
  equipment: string[];
  duration: number;
  days: string[];
  environment: "Home" | "Gym" | "Outdoors" | "Mixed";
  activities: string[];
  diet: string;
  allergies: string[];
}

export interface WorkoutExercise {
  uid: string;
  exerciseId: string;
  sets: number;
  reps: number;
  durationSec?: number;
  restSec: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  focus: string;
  description?: string;
  difficulty: Difficulty;
  location: "Home" | "Gym" | "Any";
  exercises: WorkoutExercise[];
  scheduledDays?: string[];
  isTemplate?: boolean;
  favorite?: boolean;
  source?: "template" | "custom" | "rules-generator" | "ai";
  createdAt: string;
}

export interface WorkoutSet { reps: number; weight?: number; durationSec?: number; done: boolean }
export interface SessionExercise { exerciseId: string; target: WorkoutExercise; sets: WorkoutSet[]; skipped?: boolean }

export interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  exercises: SessionExercise[];
  effort?: number;
  notes?: string;
  demo?: boolean;
}

export interface ActiveSession {
  session: WorkoutSession;
  exIndex: number;
  setIndex: number;
  paused: boolean;
  elapsedBeforePause: number;
  resumedAt: number;
}

export type ServingUnit = "g" | "ml" | "serving" | "piece" | "cup";
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  basis: "100g" | "100ml";
  per100: { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar?: number; sodium?: number };
  /** food-specific unit conversions to grams/ml */
  units: { unit: ServingUnit; label: string; grams: number }[];
  source: "Sample dataset (approximate)" | "User-entered" | "External database";
  verified: boolean;
  tags: string[];
  allergens?: string[];
}

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  foodId: string;
  grams: number;
  unitLabel: string;
  quantity: number;
  createdAt: string;
}

export interface Nutrients { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }
export interface NutritionTargets { kcal: number; protein: number; carbs: number; fat: number; fiber: number; water: number }

export interface RecipeIngredient { foodId: string; grams: number }
export interface Recipe {
  id: string;
  name: string;
  meal: MealType;
  minutes: number;
  servings: number;
  cuisine: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  saved?: boolean;
}

export interface MealPlanDay { day: string; meals: { meal: MealType; recipeId: string; servings: number }[] }
export interface MealPlan { id: string; name: string; createdAt: string; days: MealPlanDay[]; source: "rules-generator" | "ai"; prefs: Record<string, unknown> }
export interface GroceryItem { id: string; name: string; grams: number; have: boolean; category: string }

export interface HydrationEntry { id: string; date: string; ml: number; at: string }
export interface SleepEntry { id: string; date: string; bedtime: string; wake: string; hours: number; quality: number }
export interface ReadinessEntry { id: string; date: string; score: number; soreness: number; energy: number; note?: string }
export interface BodyMeasurement { id: string; date: string; weightKg?: number; waistCm?: number; hipCm?: number; note?: string }
export interface Habit { id: string; name: string; icon: string; reminder?: string; createdAt: string }
export interface HabitEntry { habitId: string; date: string }
export interface ChatMessage { id: string; role: "user" | "assistant"; content: string; at: string; source?: "ai" | "fallback"; error?: boolean }
export interface AppNotification { id: string; title: string; body: string; at: string; read: boolean; category: string; href?: string }
export interface Achievement { id: string; title: string; description: string; icon: string; target: number; progress: number; unlocked: boolean }

export interface Settings {
  theme: "dark" | "light";
  reminders: Record<string, { enabled: boolean; time: string }>;
  saveChatHistory: boolean;
  shareContextWithCoach: boolean;
  timerSound: boolean;
  timerVibrate: boolean;
}
