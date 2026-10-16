import type { FoodItem, Nutrients, FoodEntry, NutritionTargets, Recipe } from "@/types";

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

/** consumed nutrient = nutrient per 100 g × consumed grams / 100 — the single shared calculation. */
export function scaleNutrients(food: FoodItem, grams: number): Nutrients {
  const g = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const k = g / 100;
  const p = food.per100;
  return {
    kcal: p.kcal * k, protein: p.protein * k, carbs: p.carbs * k, fat: p.fat * k,
    fiber: p.fiber * k, sugar: (p.sugar ?? 0) * k, sodium: (p.sodium ?? 0) * k,
  };
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber, sugar: a.sugar + b.sugar, sodium: a.sodium + b.sodium };
}

/** Convert quantity of a food-specific unit to grams. Returns null if unit is not defined for this food. */
export function unitToGrams(food: FoodItem, unitLabel: string, quantity: number): number | null {
  const u = food.units.find((x) => x.label === unitLabel);
  if (!u) return null;
  return u.grams * quantity;
}

export function totalsFor(entries: FoodEntry[], foods: Record<string, FoodItem>): Nutrients {
  return entries.reduce((acc, e) => {
    const f = foods[e.foodId];
    return f ? addNutrients(acc, scaleNutrients(f, e.grams)) : acc;
  }, { ...ZERO });
}

export function recipeNutrition(r: Recipe, foods: Record<string, FoodItem>, servings = 1): { total: Nutrients; perServing: Nutrients; complete: boolean } {
  let complete = true;
  const total = r.ingredients.reduce((acc, i) => {
    const f = foods[i.foodId];
    if (!f) { complete = false; return acc; }
    return addNutrients(acc, scaleNutrients(f, i.grams));
  }, { ...ZERO });
  const div = r.servings || 1;
  const perServing = Object.fromEntries(Object.entries(total).map(([k, v]) => [k, (v / div) * servings])) as unknown as Nutrients;
  return { total, perServing, complete };
}

/** Mifflin-St Jeor — an estimate, used only when the user opts in. */
export function estimateTargets(opts: { sex: "male" | "female" | "unspecified"; age: number; weightKg: number; heightCm: number; activity: number }): NutritionTargets {
  const base = 10 * opts.weightKg + 6.25 * opts.heightCm - 5 * opts.age + (opts.sex === "male" ? 5 : opts.sex === "female" ? -161 : -78);
  const kcal = Math.round((base * opts.activity) / 10) * 10;
  const protein = Math.round(opts.weightKg * 1.6);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, fiber: 30, water: 2500 };
}

export const r0 = (n: number) => Math.round(n);
export const r1 = (n: number) => Math.round(n * 10) / 10;
