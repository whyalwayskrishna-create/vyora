import { NextRequest, NextResponse } from "next/server";
import { aiConfig, chatJSON, rateLimited } from "@/services/ai-provider";
import { generateMealPlanLocal, recipeAllowed, validateMealPlan, type MealPrefs } from "@/services/meal-planner";
import { RECIPES } from "@/data/foods";

export async function POST(req: NextRequest) {
  if (rateLimited("mp:" + (req.headers.get("x-forwarded-for") ?? "l"), 10)) return NextResponse.json({ error: "Rate limit reached." }, { status: 429 });
  let p: MealPrefs & { seed?: number }; try { p = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!Array.isArray(p.meals) || !p.meals.length) return NextResponse.json({ error: "Choose at least one meal." }, { status: 422 });
  p.days = Math.min(7, Math.max(1, Number(p.days) || 1));
  if (aiConfig().configured) {
    try {
      const allowed = RECIPES.filter((r) => recipeAllowed(r, p)).map((r) => `${r.id}|${r.meal}|${r.name}|${r.cuisine}`).join("\n");
      const raw = await chatJSON("You plan balanced meals. Return ONLY JSON {days:[{day, meals:[{meal, recipeId, servings}]}]}. Use only recipeIds provided (they already respect allergies). Never plan below 1200 kcal/day.", `Prefs: ${JSON.stringify(p)}\nRecipes:\n${allowed}`);
      const days = validateMealPlan(raw);
      if (days) return NextResponse.json({ source: "ai", days, warnings: [] });
    } catch { const r = generateMealPlanLocal(p, p.seed); return NextResponse.json({ source: "rules", ...r, notice: "AI provider failed; rules-based planner used." }); }
  }
  return NextResponse.json({ source: "rules", ...generateMealPlanLocal(p, p.seed) });
}
