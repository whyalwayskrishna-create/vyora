"use client";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Heart, Search, X } from "lucide-react";
import type { FoodEntry, FoodItem, MealType } from "@/types";
import { scaleNutrients, r0, r1 } from "@/lib/nutrition";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import { Badge, Button, Chip, Field, Modal, Notice, useUI } from "@/components/ui";
import { cn, todayKey } from "@/lib/utils";

export const MEALS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
export function defaultMeal(): MealType { const h = new Date().getHours(); return h < 11 ? "Breakfast" : h < 15 ? "Lunch" : h < 21 ? "Dinner" : "Snacks"; }

export function NutrientGrid({ n, compact }: { n: ReturnType<typeof scaleNutrients>; compact?: boolean }) {
  const items = [["Calories", `${r0(n.kcal)}`, "kcal"], ["Protein", r1(n.protein), "g"], ["Carbs", r1(n.carbs), "g"], ["Fat", r1(n.fat), "g"], ...(!compact ? [["Fiber", r1(n.fiber), "g"], ["Sugar", r1(n.sugar), "g"], ["Sodium", r0(n.sodium), "mg"]] : [])];
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-4 sm:grid-cols-7")}>
      {items.map(([k, v, u], i) => (
        <div key={k as string} className={cn("rounded-xl border border-line bg-elevated p-2.5 text-center", i === 0 && "border-accent/40")}>
          <div className="tabular text-base font-extrabold">{v}<span className="ml-0.5 text-[10px] font-medium text-muted">{u}</span></div>
          <div className="text-[10px] font-semibold text-muted">{k}</div>
        </div>
      ))}
    </div>
  );
}

/** Food details + serving calculator. Creates or edits an entry. */
export function FoodModal({ food, open, onClose, date = todayKey(), meal, entry }: { food: FoodItem | null; open: boolean; onClose: () => void; date?: string; meal?: MealType; entry?: FoodEntry }) {
  const add = useStore((s) => s.addFoodEntry);
  const update = useStore((s) => s.updateFoodEntry);
  const favFoods = useStore((s) => s.favFoods);
  const toggleFav = useStore((s) => s.toggleFavFood);
  const { toast } = useUI();
  const [unit, setUnit] = useState("g");
  const [qty, setQty] = useState("100");
  const [m, setM] = useState<MealType>(meal ?? defaultMeal());
  useEffect(() => {
    if (!food) return;
    if (entry) { setUnit(entry.unitLabel); setQty(String(entry.quantity)); setM(entry.meal); }
    else { const pref = food.units.find((u) => u.unit !== "g" && u.unit !== "ml"); setUnit(pref?.label ?? food.units[0].label); setQty(pref ? "1" : "100"); setM(meal ?? defaultMeal()); }
  }, [food, entry, meal, open]);
  const u = food?.units.find((x) => x.label === unit) ?? food?.units[0];
  const q = Number(qty);
  const valid = Number.isFinite(q) && q > 0 && q <= (u && u.grams === 1 ? 5000 : 50);
  const grams = valid && u ? u.grams * q : 0;
  const n = useMemo(() => (food ? scaleNutrients(food, grams) : null), [food, grams]);
  if (!food || !n) return null;
  const base = food.basis === "100ml" ? "ml" : "g";
  const save = () => {
    if (!valid || !u) return;
    if (entry) { update(entry.id, { grams, unitLabel: u.label, quantity: q, meal: m }); toast("Entry updated"); }
    else { add({ date, meal: m, foodId: food.id, grams, unitLabel: u.label, quantity: q }); toast(`Added ${food.name} to ${m}`); }
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={entry ? "Edit entry" : "Add food"}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!valid}>{entry ? "Save changes" : `Add to ${m}`}</Button></>}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-lg font-extrabold leading-tight">{food.name}</h3>{food.brand && <p className="text-xs text-muted">{food.brand}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={food.source === "User-entered" ? "warn" : food.source === "External database" ? "accent" : "default"}>{food.source}</Badge>
            {food.verified && <Badge tone="success"><BadgeCheck size={11} />Verified</Badge>}
            {food.allergens?.map((a) => <Badge key={a} tone="danger">{a}</Badge>)}
          </div></div>
        <button onClick={() => toggleFav(food.id)} className="press rounded-xl p-2 text-muted hover:text-accent" aria-pressed={favFoods.includes(food.id)} aria-label="Favorite food"><Heart size={18} className={favFoods.includes(food.id) ? "fill-accent text-accent" : ""} /></button>
      </div>
      <p className="mt-3 text-xs text-muted">Per 100 {base}: {food.per100.kcal} kcal · P {food.per100.protein} g · C {food.per100.carbs} g · F {food.per100.fat} g</p>
      <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-3">
        <Field label="Amount" error={!valid ? "Enter a positive amount within a reasonable range" : null}>
          <input className="input tabular" inputMode="decimal" type="number" min={0} step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Unit" hint={u && u.grams !== 1 ? `= ${r1(grams)} ${base}` : undefined}>
          <select className="input" value={unit} onChange={(e) => { const nu = food.units.find((x) => x.label === e.target.value); setUnit(e.target.value); if (nu) setQty(nu.grams === 1 ? String(r0(grams || 100)) : "1"); }}>
            {food.units.map((x) => <option key={x.label} value={x.label}>{x.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4"><NutrientGrid n={n} /></div>
      <p className="mt-2 text-[11px] text-muted">Calculated as nutrient per 100 {base} × {r1(grams)} {base} ÷ 100. Only food-specific unit conversions are offered.</p>
      <div className="mt-4"><span className="label">Meal</span><div className="flex flex-wrap gap-2">{MEALS.map((x) => <Chip key={x} active={m === x} onClick={() => setM(x)}>{x}</Chip>)}</div></div>
    </Modal>
  );
}

/** Searchable food picker that opens the FoodModal. */
export function FoodPicker({ open, onClose, date, meal }: { open: boolean; onClose: () => void; date?: string; meal?: MealType }) {
  const foods = useFoodMap();
  const recent = useStore((s) => s.recentFoods);
  const fav = useStore((s) => s.favFoods);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<FoodItem | null>(null);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = Object.values(foods);
    if (!t) { const ids = [...new Set([...fav, ...recent])]; const pri = ids.map((i) => foods[i]).filter(Boolean); return pri.length ? pri : all.slice(0, 12); }
    return all.filter((f) => f.name.toLowerCase().includes(t) || f.category.toLowerCase().includes(t) || f.brand?.toLowerCase().includes(t)).slice(0, 30);
  }, [q, foods, recent, fav]);
  return (
    <>
      <Modal open={open && !sel} onClose={onClose} title={`Log food${meal ? ` · ${meal}` : ""}`}>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />
          {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setQ("")} aria-label="Clear"><X size={15} /></button>}
        </div>
        {!q && <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{fav.length || recent.length ? "Favorites & recent" : "Common foods"}</p>}
        <ul className="mt-2 max-h-[50vh] space-y-1 overflow-y-auto">
          {list.map((f) => (
            <li key={f.id}><button onClick={() => setSel(f)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-elevated-2">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{f.name}</span><span className="text-[11px] text-muted">{f.category}{f.source === "User-entered" ? " · custom" : ""}</span></span>
              <span className="tabular shrink-0 text-xs text-muted">{f.per100.kcal} kcal/100{f.basis === "100ml" ? "ml" : "g"}</span></button></li>
          ))}
          {!list.length && <li className="py-8 text-center text-sm text-muted">No matches. Create a custom food in the Food database.</li>}
        </ul>
        <Notice className="mt-3">Values come from an approximate sample dataset unless marked otherwise.</Notice>
      </Modal>
      <FoodModal food={sel} open={!!sel} onClose={() => { setSel(null); onClose(); }} date={date} meal={meal} />
    </>
  );
}
