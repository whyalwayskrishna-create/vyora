import { RECIPES, FOOD_BY_ID_STATIC } from "@/data/foods";
import { recipeNutrition } from "@/lib/nutrition";
import type { MealPlanDay, MealType, Recipe } from "@/types";

export interface MealPrefs { diet: string; allergies: string[]; dislikes: string[]; cuisines: string[]; maxMinutes: number; meals: MealType[]; days: number; kcal?: number; protein?: number; budget?: string; equipment?: string[] }

const DIET_TAG: Record<string, string | null> = { Vegan: "vegan", Vegetarian: "vegetarian", "Dairy-free": "dairy-free", "Gluten-free": "gluten-free", Pescatarian: null, "No preference": null };

export function recipeAllergens(r: Recipe) {
  return new Set(r.ingredients.flatMap((i) => FOOD_BY_ID_STATIC[i.foodId]?.allergens ?? []));
}
export function recipeAllowed(r: Recipe, p: MealPrefs) {
  const tag = DIET_TAG[p.diet];
  if (tag && !r.tags.includes(tag)) return false;
  if (p.diet === "Pescatarian" && r.ingredients.some((i) => ["chicken-breast", "lean-beef"].includes(i.foodId))) return false;
  const al = recipeAllergens(r);
  if (p.allergies.some((a) => al.has(a.toLowerCase()))) return false;
  if (p.dislikes.some((d) => d && (r.name.toLowerCase().includes(d.toLowerCase()) || r.ingredients.some((i) => FOOD_BY_ID_STATIC[i.foodId]?.name.toLowerCase().includes(d.toLowerCase()))))) return false;
  if (r.minutes > p.maxMinutes) return false;
  return true;
}

export function generateMealPlanLocal(p: MealPrefs, seed = Date.now()): { days: MealPlanDay[]; warnings: string[] } {
  const warnings: string[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const pools: Record<string, Recipe[]> = {};
  for (const m of p.meals) {
    let pool = RECIPES.filter((r) => r.meal === m && recipeAllowed(r, p));
    if (p.cuisines.length) { const pref = pool.filter((r) => p.cuisines.includes(r.cuisine)); if (pref.length) pool = pref; }
    pools[m] = pool;
    if (!pool.length) warnings.push(`No ${m.toLowerCase()} recipes in the sample library match all your restrictions.`);
  }
  const days: MealPlanDay[] = Array.from({ length: p.days }, (_, d) => {
    const meals = p.meals.flatMap((m, j) => { const pool = pools[m]; if (!pool.length) return []; const r = pool[(seed + d * 7 + j * 3) % pool.length]; return [{ meal: m, recipeId: r.id, servings: 1 }]; });
    if (p.kcal && p.kcal >= 1200) {
      const base = meals.reduce((acc, x) => acc + recipeNutrition(RECIPE_LOOKUP[x.recipeId], FOOD_BY_ID_STATIC, 1).perServing.kcal, 0);
      const share = p.kcal * (meals.length / Math.max(1, p.meals.length));
      const factor = base > 0 ? Math.min(2, Math.max(0.75, share / base)) : 1;
      meals.forEach((x) => (x.servings = Math.round(factor * 4) / 4));
    }
    return { day: dayNames[d % 7], meals };
  });
  if (p.kcal && p.kcal < 1200) warnings.push("Targets below 1200 kcal aren't used for automatic scaling. Please discuss very low intakes with a qualified professional.");
  return { days, warnings };
}
const RECIPE_LOOKUP: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function validateMealPlan(x: unknown): MealPlanDay[] | null {
  if (!x || typeof x !== "object" || !Array.isArray((x as { days?: unknown }).days)) return null;
  const days = ((x as { days: MealPlanDay[] }).days).map((d) => ({ day: String(d.day), meals: (d.meals ?? []).filter((m) => RECIPE_LOOKUP[m.recipeId]).map((m) => ({ meal: m.meal, recipeId: m.recipeId, servings: Math.min(3, Math.max(0.5, Number(m.servings) || 1)) })) }));
  return days.length ? days : null;
}
