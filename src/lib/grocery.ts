import type { GroceryItem, Recipe } from "@/types";
import { FOOD_BY_ID_STATIC } from "@/data/foods";
export function mergeGrocery(list: GroceryItem[], recipe: Recipe, servings: number, ingredients = recipe.ingredients): GroceryItem[] {
  const out = list.map((x) => ({ ...x }));
  const factor = servings / (recipe.servings || 1);
  ingredients.forEach((i) => {
    const f = FOOD_BY_ID_STATIC[i.foodId]; if (!f) return;
    const ex = out.find((x) => x.id === i.foodId);
    if (ex) ex.grams += i.grams * factor; else out.push({ id: i.foodId, name: f.name, grams: i.grams * factor, have: false, category: f.category });
  });
  return out;
}
