"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Bookmark, Bot, ChefHat, Clock, Minus, Plus, RefreshCcw, Save, ShoppingCart, Sparkles, Trash2, Utensils } from "lucide-react";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import { RECIPES, RECIPE_BY_ID } from "@/data/foods";
import { recipeNutrition, r0, addNutrients, ZERO } from "@/lib/nutrition";
import { mergeGrocery } from "@/lib/grocery";
import { recipeAllowed, type MealPrefs } from "@/services/meal-planner";
import type { MealPlan, MealPlanDay, MealType } from "@/types";
import { Badge, Button, Card, Chip, EmptyState, Field, Notice, PageHeader, SectionTitle, Skeleton, useUI } from "@/components/ui";
import { todayKey, uid } from "@/lib/utils";

const DIETS = ["No preference", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free"];
const ALLERGIES = ["dairy", "egg", "gluten", "peanuts", "tree nuts", "soy", "fish", "sesame"];
const CUISINES = ["Global", "Mediterranean", "Asian", "Indian", "Middle Eastern", "Italian", "Nordic"];
const MEALS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

export default function Planner() {
  const s = useStore();
  const foods = useFoodMap();
  const { toast, confirm } = useUI();
  const [p, setP] = useState<MealPrefs>({ diet: s.profile.diet, allergies: s.profile.allergies, dislikes: [], cuisines: [], maxMinutes: 30, meals: ["Breakfast", "Lunch", "Dinner"], days: 3, kcal: s.targets?.kcal, budget: "Moderate", equipment: ["Stovetop", "Oven"] });
  const [dislikes, setDislikes] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const up = (x: Partial<MealPrefs>) => setP((o) => ({ ...o, ...x }));
  const tog = <T extends string>(arr: T[], v: T) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const prefs = { ...p, dislikes: dislikes.split(",").map((x) => x.trim()).filter(Boolean) };

  const generate = async () => {
    if (!p.meals.length) { setErr("Choose at least one meal."); setState("error"); return; }
    setState("loading");
    try {
      const r = await fetch("/api/ai/meal-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...prefs, seed: Math.floor(Math.random() * 1000) }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "Request failed");
      setPlan({ id: uid(), name: `${p.days}-day ${p.diet === "No preference" ? "" : p.diet.toLowerCase() + " "}plan`, createdAt: new Date().toISOString(), days: j.days, source: j.source === "ai" ? "ai" : "rules-generator", prefs });
      setWarnings([...(j.warnings ?? []), ...(j.notice ? [j.notice] : [])]); setState("done");
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); setState("error"); }
  };
  const setDays = (days: MealPlanDay[]) => plan && setPlan({ ...plan, days });
  const regenMeal = (di: number, mi: number) => {
    if (!plan) return;
    const cur = plan.days[di].meals[mi];
    const pool = RECIPES.filter((r) => r.meal === cur.meal && r.id !== cur.recipeId && recipeAllowed(r, prefs));
    if (!pool.length) return toast("No other recipes match your restrictions for this meal", "info");
    const r = pool[Math.floor(Math.random() * pool.length)];
    setDays(plan.days.map((d, i) => i !== di ? d : { ...d, meals: d.meals.map((m, j) => j !== mi ? m : { ...m, recipeId: r.id }) }));
  };
  const adjust = (di: number, mi: number, delta: number) => plan && setDays(plan.days.map((d, i) => i !== di ? d : { ...d, meals: d.meals.map((m, j) => j !== mi ? m : { ...m, servings: Math.min(3, Math.max(0.5, m.servings + delta)) }) }));
  const dayTotals = (d: MealPlanDay) => d.meals.reduce((acc, m) => addNutrients(acc, recipeNutrition(RECIPE_BY_ID[m.recipeId], foods, m.servings).perServing), { ...ZERO });
  const toGrocery = (pl: MealPlan) => { let g = s.grocery; pl.days.forEach((d) => d.meals.forEach((m) => { g = mergeGrocery(g, RECIPE_BY_ID[m.recipeId], m.servings); })); s.setGrocery(g); toast("Grocery list updated"); };
  const toDiary = (d: MealPlanDay) => { d.meals.forEach((m) => { const r = RECIPE_BY_ID[m.recipeId]; const f = m.servings / r.servings; r.ingredients.forEach((i) => s.addFoodEntry({ date: todayKey(), meal: m.meal, foodId: i.foodId, grams: Math.round(i.grams * f), unitLabel: "g", quantity: Math.round(i.grams * f) })); }); toast(`${d.day}'s meals added to today's diary`); };
  const savedRecipes = useMemo(() => s.savedRecipes.map((id) => RECIPE_BY_ID[id]).filter(Boolean), [s.savedRecipes]);

  return (
    <div>
      <PageHeader eyebrow="Nutrition" title="Meal planner" subtitle="Plans built from recipes whose nutrition is calculated from the food database." />
      <Notice className="mb-5">The meal planner offers general suggestions and does not replace individualized advice from a registered dietitian or doctor. Always double-check ingredients for allergens.</Notice>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div><span className="label">Dietary pattern</span><div className="flex flex-wrap gap-1.5">{DIETS.map((d) => <Chip key={d} active={p.diet === d} onClick={() => up({ diet: d })}>{d}</Chip>)}</div></div>
          <div><span className="label">Allergies (strictly excluded)</span><div className="flex flex-wrap gap-1.5">{ALLERGIES.map((d) => <Chip key={d} active={p.allergies.includes(d)} onClick={() => up({ allergies: tog(p.allergies, d) })}>{d}</Chip>)}</div></div>
          <Field label="Dislikes" hint="Comma separated, e.g. tuna, tempeh"><input className="input" value={dislikes} onChange={(e) => setDislikes(e.target.value)} /></Field>
          <div><span className="label">Preferred cuisines</span><div className="flex flex-wrap gap-1.5">{CUISINES.map((d) => <Chip key={d} active={p.cuisines.includes(d)} onClick={() => up({ cuisines: tog(p.cuisines, d) })}>{d}</Chip>)}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max cooking time"><select className="input" value={p.maxMinutes} onChange={(e) => up({ maxMinutes: Number(e.target.value) })}>{[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
            <Field label="Days"><select className="input" value={p.days} onChange={(e) => up({ days: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6, 7].map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
            <Field label="Budget"><select className="input" value={p.budget} onChange={(e) => up({ budget: e.target.value })}><option>Low</option><option>Moderate</option><option>Flexible</option></select></Field>
            <Field label="Daily kcal (optional)" hint="Used to scale servings, min 1200"><input className="input" type="number" min={0} value={p.kcal ?? ""} onChange={(e) => up({ kcal: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          </div>
          <div><span className="label">Meals</span><div className="flex flex-wrap gap-1.5">{MEALS.map((d) => <Chip key={d} active={p.meals.includes(d)} onClick={() => up({ meals: tog(p.meals, d) })}>{d}</Chip>)}</div></div>
          <div><span className="label">Cooking equipment</span><div className="flex flex-wrap gap-1.5">{["Stovetop", "Oven", "Microwave", "Blender"].map((d) => <Chip key={d} active={!!p.equipment?.includes(d)} onClick={() => up({ equipment: tog(p.equipment ?? [], d) })}>{d}</Chip>)}</div></div>
          <Button size="lg" className="w-full" onClick={generate} loading={state === "loading"}><Sparkles size={16} />Generate plan</Button>
        </Card>

        <div className="space-y-5">
          {state === "idle" && <EmptyState icon={<ChefHat size={20} />} title="Plan your meals" body="Choose your preferences and generate. Without an AI provider configured, a transparent rules-based planner is used." />}
          {state === "loading" && [0, 1].map((i) => <Skeleton key={i} className="h-56" />)}
          {state === "error" && <Card className="border-danger/30"><p className="flex items-center gap-2 font-bold"><AlertTriangle size={16} className="text-danger" />Couldn&apos;t create a plan</p><p className="text-sm text-muted">{err}</p><Button size="sm" variant="secondary" className="mt-3" onClick={generate}>Retry</Button></Card>}
          {state === "done" && plan && (
            <>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="mb-1">{plan.source === "ai" ? <Badge tone="accent"><Bot size={11} />AI generated</Badge> : <Badge><Sparkles size={11} />Rules-based planner (no AI model called)</Badge>}</div><input className="bg-transparent text-xl font-extrabold outline-none" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} aria-label="Plan name" /></div>
                <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={generate}><RefreshCcw size={15} />Regenerate</Button><Button variant="secondary" onClick={() => toGrocery(plan)}><ShoppingCart size={15} />Grocery list</Button><Button onClick={() => { s.saveMealPlan(plan); toast("Meal plan saved"); }}><Save size={15} />Save plan</Button></div>
              </Card>
              {warnings.map((w) => <Notice key={w} tone="warn">{w}</Notice>)}
              {plan.days.map((d, di) => { const t = dayTotals(d); return (
                <Card key={di}>
                  <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => toDiary(d)}><Utensils size={13} />Log to today</Button>}>{d.day} <span className="tabular ml-2 text-xs font-medium text-muted">≈ {r0(t.kcal)} kcal · P {r0(t.protein)} · C {r0(t.carbs)} · F {r0(t.fat)}</span></SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {d.meals.map((m, mi) => { const r = RECIPE_BY_ID[m.recipeId]; const n = recipeNutrition(r, foods, m.servings).perServing; return (
                      <div key={mi} className="rounded-2xl border border-line bg-elevated p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{m.meal}</p>
                        <Link href={`/nutrition/recipes/${r.id}`} className="mt-0.5 block font-bold hover:text-accent">{r.name}</Link>
                        <p className="flex items-center gap-1 text-xs text-muted"><Clock size={11} />{r.minutes} min · {r.cuisine}</p>
                        <p className="tabular mt-2 text-xs">{r0(n.kcal)} kcal · P {r0(n.protein)} g · C {r0(n.carbs)} g · F {r0(n.fat)} g</p>
                        <div className="mt-3 flex items-center gap-1">
                          <button onClick={() => adjust(di, mi, -0.25)} className="press rounded-lg border border-line p-1" aria-label="Fewer servings"><Minus size={12} /></button>
                          <span className="tabular w-14 text-center text-xs font-semibold">{m.servings} srv</span>
                          <button onClick={() => adjust(di, mi, 0.25)} className="press rounded-lg border border-line p-1" aria-label="More servings"><Plus size={12} /></button>
                          <button onClick={() => regenMeal(di, mi)} className="press ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:text-accent"><RefreshCcw size={12} />Swap</button>
                        </div>
                      </div>); })}
                  </div>
                </Card>); })}
              <p className="text-[11px] text-muted">Nutrition is estimated from ingredient quantities in the sample dataset. Leftover suggestion: dinners marked with 2 servings make a ready-made lunch for the next day.</p>
            </>
          )}

          <Card>
            <SectionTitle>Saved meal plans</SectionTitle>
            {s.mealPlans.length ? <ul className="divide-y divide-line">{s.mealPlans.map((mp) => (
              <li key={mp.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{mp.name}</p><p className="text-xs text-muted">{mp.days.length} days · {new Date(mp.createdAt).toLocaleDateString()}</p></div>
                <Button size="sm" variant="secondary" onClick={() => { setPlan(mp); setWarnings([]); setState("done"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Open & edit</Button>
                <Button size="sm" variant="ghost" onClick={() => toGrocery(mp)} aria-label="Add to grocery list"><ShoppingCart size={14} /></Button>
                <button onClick={async () => { if (await confirm({ title: "Delete meal plan?", body: mp.name, danger: true, confirmLabel: "Delete" })) s.deleteMealPlan(mp.id); }} className="p-2 text-muted hover:text-danger" aria-label="Delete plan"><Trash2 size={14} /></button>
              </li>))}</ul> : <p className="text-sm text-muted">No saved plans yet.</p>}
          </Card>
          <Card>
            <SectionTitle>Saved recipes</SectionTitle>
            {savedRecipes.length ? <div className="flex flex-wrap gap-2">{savedRecipes.map((r) => <Link key={r.id} href={`/nutrition/recipes/${r.id}`} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent/50"><Bookmark size={11} className="fill-accent text-accent" />{r.name}</Link>)}</div> : <p className="text-sm text-muted">Save recipes from any recipe page. Browse: {RECIPES.slice(0, 3).map((r, i) => <span key={r.id}>{i > 0 && ", "}<Link href={`/nutrition/recipes/${r.id}`} className="text-accent hover:underline">{r.name}</Link></span>)}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
