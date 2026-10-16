import type { FoodItem } from "@/types";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function offToFood(p: any): FoodItem | null {
  const n = p?.nutriments ?? {};
  const kcal = Number(n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : NaN));
  if (!p?.product_name || !Number.isFinite(kcal)) return null;
  const num = (k: string) => { const v = Number(n[k]); return Number.isFinite(v) ? v : 0; };
  const serving = Number(p.serving_quantity);
  return {
    id: `off-${p.code}`, name: String(p.product_name).slice(0, 80), brand: p.brands ? String(p.brands).split(",")[0] : undefined, category: "Packaged", basis: "100g",
    per100: { kcal: Math.round(kcal), protein: num("proteins_100g"), carbs: num("carbohydrates_100g"), fat: num("fat_100g"), fiber: num("fiber_100g"), sugar: num("sugars_100g"), sodium: Math.round(num("sodium_100g") * 1000) },
    units: [{ unit: "g", label: "g", grams: 1 }, ...(Number.isFinite(serving) && serving > 0 ? [{ unit: "serving" as const, label: `1 serving (${serving} g)`, grams: serving }] : [])],
    source: "External database", verified: false, tags: ["open food facts"],
    allergens: Array.isArray(p.allergens_tags) ? p.allergens_tags.map((a: string) => a.replace("en:", "")) : [],
  };
}
