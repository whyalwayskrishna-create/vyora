"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Clock, Minus, Plus, RefreshCcw, ShoppingCart, Utensils, XCircle } from "lucide-react";
import { RECIPE_BY_ID, FOODS } from "@/data/foods";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import { recipeNutrition, r0 } from "@/lib/nutrition";
import { mergeGrocery } from "@/lib/grocery";
import type { MealType, RecipeIngredient } from "@/types";
import { Badge, Button, Card, EmptyState, LinkButton, Modal, Notice, SectionTitle, useUI } from "@/components/ui";
import { MEALS, NutrientGrid } from "@/components/nutrition/FoodModal";
import { todayKey } from "@/lib/utils";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const base = RECIPE_BY_ID[id];
  const s = useStore();
  const foods = useFoodMap();
  const router = useRouter();
  const { toast } = useUI();
  const [servings, setServings] = useState(1);
  const [ings, setIngs] = useState<RecipeIngredient[]>(base?.ingredients ?? []);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const recipe = useMemo(() => (base ? { ...base, ingredients: ings } : null), [base, ings]);
  if (!recipe || !base) return <EmptyState icon={<XCircle size={20} />} title="Recipe not found" action={<LinkButton href="/nutrition/planner">Meal planner</LinkButton>} />;
  const nut = recipeNutrition(recipe, foods, servings);
  const factor = servings / recipe.servings;
  const saved = s.savedRecipes.includes(recipe.id);
  const have = new Set(s.grocery.filter((g) => g.have).map((g) => g.id));
  const userAllergens = s.profile.allergies;
  const conflicts = ings.flatMap((i) => foods[i.foodId]?.allergens?.filter((a) => userAllergens.includes(a)) ?? []);
  const addToDiary = (meal: MealType) => { ings.forEach((i) => s.addFoodEntry({ date: todayKey(), meal, foodId: i.foodId, grams: Math.round(i.grams * factor), unitLabel: "g", quantity: Math.round(i.grams * factor) })); toast(`${recipe.name} added to ${meal}`); setDiaryOpen(false); };
  const alternatives = replaceIdx !== null ? FOODS.filter((f) => f.category === foods[ings[replaceIdx].foodId]?.category && f.id !== ings[replaceIdx].foodId && !(f.allergens ?? []).some((a) => userAllergens.includes(a))) : [];
  const modified = ings.some((x, i) => x.foodId !== base.ingredients[i].foodId);
  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} />Back</button>
      <div className="flex flex-wrap gap-2"><Badge tone="accent">{recipe.meal}</Badge><Badge>{recipe.cuisine}</Badge>{recipe.tags.map((t) => <Badge key={t}>{t}</Badge>)}{modified && <Badge tone="warn">Modified</Badge>}</div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{recipe.name}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Clock size={14} />{recipe.minutes} min · makes {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</p>
      {conflicts.length > 0 && <Notice tone="warn" className="mt-3">Contains {[...new Set(conflicts)].join(", ")} — listed in your allergies. Replace those ingredients before eating.</Notice>}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <SectionTitle action={<div className="flex items-center gap-2"><Button size="icon" variant="secondary" className="!h-8 !w-8" onClick={() => setServings((x) => Math.max(0.5, x - 0.5))} aria-label="Fewer servings"><Minus size={14} /></Button><span className="tabular w-16 text-center text-sm font-bold">{servings} srv</span><Button size="icon" variant="secondary" className="!h-8 !w-8" onClick={() => setServings((x) => Math.min(8, x + 0.5))} aria-label="More servings"><Plus size={14} /></Button></div>}>Ingredients</SectionTitle>
            <ul className="divide-y divide-line">
              {ings.map((i, idx) => { const f = foods[i.foodId]; return (
                <li key={idx} className="flex items-center gap-3 py-2.5">
                  <input type="checkbox" aria-label={`Have ${f?.name}`} checked={have.has(i.foodId)} onChange={() => { const exists = s.grocery.find((g) => g.id === i.foodId); s.setGrocery(exists ? s.grocery.map((g) => g.id === i.foodId ? { ...g, have: !g.have } : g) : [...s.grocery, { id: i.foodId, name: f?.name ?? i.foodId, grams: 0, have: true, category: f?.category ?? "Other" }]); }} className="h-4 w-4 accent-[var(--accent)]" />
                  <span className="flex-1 text-sm"><span className="font-semibold">{f?.name ?? "Unknown"}</span>{f?.allergens?.length ? <span className="ml-1 text-[10px] text-warn">({f.allergens.join(", ")})</span> : null}</span>
                  <span className="tabular text-sm text-muted">{r0(i.grams * factor)} g</span>
                  <button onClick={() => setReplaceIdx(idx)} className="press rounded-lg p-1.5 text-muted hover:text-accent" aria-label={`Replace ${f?.name}`}><RefreshCcw size={14} /></button>
                </li>); })}
            </ul>
            <p className="mt-2 text-[11px] text-muted">Tick ingredients you already have — they&apos;re marked in your grocery list.</p>
          </Card>
          <Card><SectionTitle>Instructions</SectionTitle><ol className="space-y-2.5">{recipe.steps.map((st, i) => <li key={i} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span><span className="pt-0.5">{st}</span></li>)}</ol></Card>
        </div>
        <div className="space-y-4">
          <Card><SectionTitle>Nutrition · {servings} serving{servings !== 1 ? "s" : ""}</SectionTitle><NutrientGrid n={nut.perServing} compact /><p className="mt-3 text-[11px] text-muted">Calculated from ingredient quantities using the sample food dataset{nut.complete ? "" : " — some ingredients missing, so this is a partial estimate"}. Values are approximate.</p></Card>
          <Card className="grid gap-2">
            <Button onClick={() => setDiaryOpen(true)}><Utensils size={15} />Add to food diary</Button>
            <Button variant="secondary" onClick={() => { s.setGrocery(mergeGrocery(s.grocery, recipe, servings, ings)); toast("Ingredients added to grocery list"); }}><ShoppingCart size={15} />Add to shopping list</Button>
            <Button variant="secondary" onClick={() => { s.toggleSavedRecipe(recipe.id); toast(saved ? "Removed from saved" : "Recipe saved"); }} aria-pressed={saved}><Bookmark size={15} className={saved ? "fill-accent text-accent" : ""} />{saved ? "Saved" : "Save recipe"}</Button>
          </Card>
          <Notice>Leftovers tip: cook a double batch and use extras for tomorrow&apos;s lunch within 3 days (refrigerated).</Notice>
        </div>
      </div>
      <Modal open={replaceIdx !== null} onClose={() => setReplaceIdx(null)} title="Replace ingredient">
        <ul className="space-y-1">{alternatives.map((f) => <li key={f.id}><button onClick={() => { setIngs((a) => a.map((x, j) => j === replaceIdx ? { ...x, foodId: f.id } : x)); setReplaceIdx(null); toast(`Replaced with ${f.name}`); }} className="flex w-full justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-elevated-2"><span>{f.name}</span><span className="text-xs text-muted">{f.per100.kcal} kcal/100g</span></button></li>)}{!alternatives.length && <p className="text-sm text-muted">No similar ingredients available.</p>}</ul>
      </Modal>
      <Modal open={diaryOpen} onClose={() => setDiaryOpen(false)} title="Add to today's diary"><div className="grid grid-cols-2 gap-2">{MEALS.map((m) => <Button key={m} variant={m === recipe.meal ? "primary" : "secondary"} onClick={() => addToDiary(m)}>{m}</Button>)}</div><p className="mt-3 text-xs text-muted">Each ingredient is logged separately so totals stay accurate.</p></Modal>
    </div>
  );
}
