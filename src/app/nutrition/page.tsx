"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Apple, BookmarkPlus, CalendarDays, ChefHat, ChevronLeft, ChevronRight, Copy, CopyPlus, Droplets, MoreHorizontal, Pencil, Plus, Settings2, ShoppingCart, Target, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDayTotals, useFoodMap, useWater } from "@/lib/hooks";
import { estimateTargets, r0, scaleNutrients, totalsFor } from "@/lib/nutrition";
import type { FoodEntry, MealType, NutritionTargets } from "@/types";
import { Badge, Bar, Button, Card, Field, LinkButton, MacroBar, Modal, Notice, PageHeader, ProgressRing, SectionTitle, Segmented, useUI } from "@/components/ui";
import { FoodModal, FoodPicker, MEALS } from "@/components/nutrition/FoodModal";
import { BarsChart } from "@/components/charts/Charts";
import { addDays, fmtDay, fmtVolume, keyToDate, lastNDays, todayKey, lbToKg, inToCm } from "@/lib/utils";

function TargetsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore(); const { toast } = useUI();
  const [mode, setMode] = useState<"manual" | "estimate">("manual");
  const [t, setT] = useState<NutritionTargets>(s.targets ?? { kcal: 2000, protein: 100, carbs: 230, fat: 70, fiber: 30, water: 2000 });
  const [est, setEst] = useState({ sex: "unspecified" as "male" | "female" | "unspecified", age: "30", weight: "", height: "", activity: "1.55" });
  useEffect(() => { if (open && s.targets) setT(s.targets); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const imp = s.profile.units === "imperial";
  const valid = t.kcal >= 1000 && t.kcal <= 6000 && t.protein >= 0 && t.protein <= 400 && t.carbs >= 0 && t.carbs <= 900 && t.fat >= 0 && t.fat <= 300 && t.water >= 500 && t.water <= 8000;
  const runEstimate = () => {
    const w = Number(est.weight), h = Number(est.height), a = Number(est.age);
    if (!(w > 0 && h > 0 && a >= 13 && a <= 100)) return toast("Enter a valid age (13–100), weight and height", "error");
    if (a < 18) toast("For people under 18, please discuss energy needs with a healthcare professional.", "info");
    const r = estimateTargets({ sex: est.sex, age: a, weightKg: imp ? lbToKg(w) : w, heightCm: imp ? inToCm(h) : h, activity: Number(est.activity) });
    setT({ ...r, water: t.water }); setMode("manual"); toast("Estimate calculated — review and save");
  };
  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0));
  return (
    <Modal open={open} onClose={onClose} title="Nutrition targets" footer={<>
      {s.targets && <Button variant="ghost" onClick={() => { s.setTargets(null, null); toast("Targets cleared"); onClose(); }}>Clear targets</Button>}
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button disabled={!valid || mode !== "manual"} onClick={() => { s.setTargets(t, s.targetsSource === "estimate" && mode === "manual" ? "estimate" : "user"); toast("Targets saved"); onClose(); }}>Save targets</Button></>}>
      <Segmented value={mode} onChange={setMode} options={[{ value: "manual", label: "Set manually" }, { value: "estimate", label: "Estimate for me" }]} />
      {mode === "manual" ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Calories (kcal)"><input className="input tabular" type="number" value={t.kcal} onChange={(e) => setT({ ...t, kcal: num(e.target.value) })} /></Field>
          <Field label="Protein (g)"><input className="input tabular" type="number" value={t.protein} onChange={(e) => setT({ ...t, protein: num(e.target.value) })} /></Field>
          <Field label="Carbs (g)"><input className="input tabular" type="number" value={t.carbs} onChange={(e) => setT({ ...t, carbs: num(e.target.value) })} /></Field>
          <Field label="Fat (g)"><input className="input tabular" type="number" value={t.fat} onChange={(e) => setT({ ...t, fat: num(e.target.value) })} /></Field>
          <Field label="Fiber (g)"><input className="input tabular" type="number" value={t.fiber} onChange={(e) => setT({ ...t, fiber: num(e.target.value) })} /></Field>
          <Field label="Water (ml)"><input className="input tabular" type="number" value={t.water} onChange={(e) => setT({ ...t, water: num(e.target.value) })} /></Field>
          {!valid && <p className="col-span-2 text-xs text-danger">Calories must be 1000–6000 kcal and water 500–8000 ml. Very low targets aren&apos;t supported.</p>}
          <p className="col-span-2 text-[11px] text-muted">Macros total: {r0(t.protein * 4 + t.carbs * 4 + t.fat * 9)} kcal from protein/carbs/fat.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Notice>Uses the Mifflin-St Jeor equation × an activity factor. It&apos;s a rough starting point, not a measurement of your actual energy expenditure. These details are used once and not stored.</Notice>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sex (for equation)"><select className="input" value={est.sex} onChange={(e) => setEst({ ...est, sex: e.target.value as "male" })}><option value="unspecified">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></Field>
            <Field label="Age"><input className="input" type="number" value={est.age} onChange={(e) => setEst({ ...est, age: e.target.value })} /></Field>
            <Field label={`Weight (${imp ? "lb" : "kg"})`}><input className="input" type="number" value={est.weight} onChange={(e) => setEst({ ...est, weight: e.target.value })} /></Field>
            <Field label={`Height (${imp ? "in" : "cm"})`}><input className="input" type="number" value={est.height} onChange={(e) => setEst({ ...est, height: e.target.value })} /></Field>
          </div>
          <Field label="Activity level"><select className="input" value={est.activity} onChange={(e) => setEst({ ...est, activity: e.target.value })}><option value="1.2">Mostly seated</option><option value="1.375">Lightly active</option><option value="1.55">Moderately active</option><option value="1.725">Very active</option></select></Field>
          <Button className="w-full" onClick={runEstimate}>Calculate estimate</Button>
        </div>
      )}
    </Modal>
  );
}

export default function Nutrition() {
  const params = useSearchParams();
  const s = useStore();
  const foods = useFoodMap();
  const { toast, confirm } = useUI();
  const [date, setDate] = useState(todayKey());
  const [pickMeal, setPickMeal] = useState<MealType | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [targetsOpen, setTargetsOpen] = useState(params.get("targets") === "1");
  const [copyFrom, setCopyFrom] = useState<MealType | null>(null);
  const [copyTo, setCopyTo] = useState(addDays(todayKey(), 1));
  const [saveFrom, setSaveFrom] = useState<MealType | null>(null);
  const [saveName, setSaveName] = useState("");
  const [menu, setMenu] = useState<MealType | null>(null);
  const totals = useDayTotals(date);
  const water = useWater(date);
  const entries = useMemo(() => s.foodEntries.filter((e) => e.date === date), [s.foodEntries, date]);
  const tg = s.targets;
  const week = lastNDays(7, date);
  const weekData = useMemo(() => week.map((d) => ({ day: fmtDay(d), kcal: r0(totalsFor(s.foodEntries.filter((e) => e.date === d), foods).kcal), protein: r0(totalsFor(s.foodEntries.filter((e) => e.date === d), foods).protein) })), [s.foodEntries, foods, week]);
  const loggedDays = weekData.filter((d) => d.kcal > 0);
  const avg = loggedDays.length ? r0(loggedDays.reduce((a, b) => a + b.kcal, 0) / loggedDays.length) : 0;
  const isToday = date === todayKey();
  const frequent = useMemo(() => { const c: Record<string, number> = {}; s.foodEntries.forEach((e) => (c[e.foodId] = (c[e.foodId] ?? 0) + 1)); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => foods[id]).filter(Boolean); }, [s.foodEntries, foods]);
  const [quickFood, setQuickFood] = useState<string | null>(null);

  const del = (e: FoodEntry) => { s.deleteFoodEntry(e.id); toast("Entry removed", "success", { label: "Undo", fn: () => s.addFoodEntry({ date: e.date, meal: e.meal, foodId: e.foodId, grams: e.grams, unitLabel: e.unitLabel, quantity: e.quantity }) }); };

  return (
    <div>
      <PageHeader eyebrow="Nutrition" title="Food diary" subtitle="Track meals, calories and macros with food-specific serving calculations."
        actions={<><LinkButton href="/nutrition/planner" variant="outline"><ChefHat size={16} />Meal planner</LinkButton><LinkButton href="/nutrition/foods" variant="secondary"><Apple size={16} />Food database</LinkButton><Button onClick={() => setPickMeal("Snacks")}><Plus size={16} />Log food</Button></>} />

      <div className="mb-5 flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-2">
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={18} /></Button>
        <label className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} className="text-accent" />
          {isToday ? "Today" : keyToDate(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          <input type="date" className="input !w-auto !py-1 text-xs" value={date} max={addDays(todayKey(), 7)} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Choose date" />
        </label>
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={18} /></Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center">
              <ProgressRing value={totals.kcal} max={tg?.kcal ?? Math.max(1, totals.kcal)} size={156} stroke={12} label="Calories consumed">
                <div><div className="tabular text-3xl font-extrabold">{r0(totals.kcal)}</div><div className="text-[11px] font-semibold text-muted">kcal logged</div>{tg && <div className="tabular mt-0.5 text-[11px] text-accent">{tg.kcal - r0(totals.kcal) >= 0 ? `${tg.kcal - r0(totals.kcal)} remaining` : `${r0(totals.kcal) - tg.kcal} over`}</div>}</div>
              </ProgressRing>
              <button onClick={() => setTargetsOpen(true)} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent"><Target size={13} />{tg ? `Target ${tg.kcal} kcal · ${s.targetsSource}` : "Set targets (optional)"}</button>
            </div>
            <div className="space-y-3.5 self-center">
              <MacroBar label="Protein" value={totals.protein} target={tg?.protein} color="var(--accent)" />
              <MacroBar label="Carbohydrates" value={totals.carbs} target={tg?.carbs} color="var(--success)" />
              <MacroBar label="Fat" value={totals.fat} target={tg?.fat} color="var(--warn)" />
              <MacroBar label="Fiber" value={totals.fiber} target={tg?.fiber} color="#8fb3ff" />
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted"><span>Sugar <b className="tabular text-fg">{r0(totals.sugar)} g</b></span><span>Sodium <b className="tabular text-fg">{r0(totals.sodium)} mg</b></span><Link href="/wellness/hydration" className="flex items-center gap-1 hover:text-accent"><Droplets size={12} />Water <b className="tabular text-fg">{fmtVolume(water, s.profile.units)}</b></Link></div>
            </div>
          </Card>
          {!tg && <Notice>Targets are optional. Estimated needs are starting points, not exact measurements of energy expenditure.</Notice>}

          {MEALS.map((meal) => {
            const list = entries.filter((e) => e.meal === meal);
            const mt = totalsFor(list, foods);
            return (
              <Card key={meal} className="p-0">
                <div className="flex items-center justify-between gap-2 px-5 py-3.5">
                  <div><h2 className="font-bold">{meal}</h2><p className="tabular text-xs text-muted">{r0(mt.kcal)} kcal · P {r0(mt.protein)} · C {r0(mt.carbs)} · F {r0(mt.fat)}</p></div>
                  <div className="relative flex items-center gap-1">
                    {list.length > 0 && <button onClick={() => setMenu(menu === meal ? null : meal)} className="press rounded-lg p-2 text-muted hover:text-fg" aria-label={`${meal} options`} aria-expanded={menu === meal}><MoreHorizontal size={17} /></button>}
                    {menu === meal && (
                      <div className="absolute right-10 top-0 z-20 w-48 rounded-xl border border-line bg-elevated p-1 text-sm shadow-2xl anim-scale-in" onMouseLeave={() => setMenu(null)}>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-elevated-2" onClick={() => { setCopyFrom(meal); setMenu(null); }}><Copy size={14} />Copy to another day</button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-elevated-2" onClick={() => { const n = s.copyMeal(date, meal, date); toast(`Duplicated ${n} items`); setMenu(null); }}><CopyPlus size={14} />Duplicate meal</button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-elevated-2" onClick={() => { setSaveFrom(meal); setSaveName(`My ${meal.toLowerCase()}`); setMenu(null); }}><BookmarkPlus size={14} />Save as meal</button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-danger hover:bg-elevated-2" onClick={async () => { setMenu(null); if (await confirm({ title: `Clear ${meal}?`, body: `Remove all ${list.length} entries from ${meal}.`, danger: true, confirmLabel: "Clear" })) list.forEach((e) => s.deleteFoodEntry(e.id)); }}><Trash2 size={14} />Clear meal</button>
                      </div>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setPickMeal(meal)}><Plus size={14} />Add</Button>
                  </div>
                </div>
                {list.length > 0 ? (
                  <ul className="divide-y divide-line border-t border-line">
                    {list.map((e) => { const f = foods[e.foodId]; if (!f) return <li key={e.id} className="px-5 py-3 text-sm text-muted">Unknown food (removed) <button onClick={() => s.deleteFoodEntry(e.id)} className="ml-2 text-danger">Remove</button></li>; const n = scaleNutrients(f, e.grams); return (
                      <li key={e.id} className="group flex items-center gap-3 px-5 py-2.5">
                        <button onClick={() => setEditing(e)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold">{f.name} {f.source === "User-entered" && <Badge tone="warn">custom</Badge>}</p><p className="text-xs text-muted">{e.unitLabel === "g" || e.unitLabel === "ml" ? `${r0(e.grams)} ${e.unitLabel}` : `${e.quantity} × ${e.unitLabel}`}</p></button>
                        <span className="tabular text-right text-sm font-bold">{r0(n.kcal)}<span className="block text-[10px] font-medium text-muted">P{r0(n.protein)} C{r0(n.carbs)} F{r0(n.fat)}</span></span>
                        <button onClick={() => setEditing(e)} className="press rounded-lg p-1.5 text-muted hover:text-fg" aria-label={`Edit ${f.name}`}><Pencil size={14} /></button>
                        <button onClick={() => s.addFoodEntry({ date: e.date, meal: e.meal, foodId: e.foodId, grams: e.grams, unitLabel: e.unitLabel, quantity: e.quantity })} className="press hidden rounded-lg p-1.5 text-muted hover:text-fg sm:block" aria-label={`Duplicate ${f.name}`}><CopyPlus size={14} /></button>
                        <button onClick={() => del(e)} className="press rounded-lg p-1.5 text-muted hover:text-danger" aria-label={`Delete ${f.name}`}><Trash2 size={14} /></button>
                      </li>); })}
                  </ul>
                ) : <button onClick={() => setPickMeal(meal)} className="w-full border-t border-dashed border-line px-5 py-4 text-left text-sm text-muted hover:text-accent">+ Nothing logged yet — add {meal.toLowerCase()}</button>}
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle>7-day summary</SectionTitle>
            <BarsChart data={weekData} x="day" y="kcal" unit=" kcal" target={tg?.kcal} name="Calories" height={180} />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted">Avg on logged days</p><p className="tabular font-bold">{avg} kcal</p></div><div><p className="text-xs text-muted">Days logged</p><p className="tabular font-bold">{loggedDays.length}/7</p></div></div>
          </Card>
          {s.savedMeals.length > 0 && <Card><SectionTitle>Saved meals</SectionTitle><ul className="space-y-2">{s.savedMeals.map((m) => { const kcal = r0(m.items.reduce((a, it) => a + (foods[it.foodId] ? scaleNutrients(foods[it.foodId], it.grams).kcal : 0), 0)); return (
            <li key={m.id} className="flex items-center gap-2 rounded-xl border border-line p-2.5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.name}</p><p className="text-xs text-muted">{m.items.length} items · {kcal} kcal</p></div>
              <select aria-label="Add to meal" className="input !w-auto !py-1 text-xs" defaultValue="" onChange={(e) => { if (!e.target.value) return; m.items.forEach((it) => s.addFoodEntry({ ...it, date, meal: e.target.value as MealType })); toast(`${m.name} added to ${e.target.value}`); e.target.value = ""; }}><option value="">Add to…</option>{MEALS.map((x) => <option key={x}>{x}</option>)}</select>
              <button onClick={() => s.deleteSavedMeal(m.id)} className="p-1 text-muted hover:text-danger" aria-label="Delete saved meal"><Trash2 size={14} /></button></li>); })}</ul></Card>}
          {frequent.length > 0 && <Card><SectionTitle>Frequently logged</SectionTitle><div className="flex flex-wrap gap-2">{frequent.map((f) => <button key={f.id} onClick={() => setQuickFood(f.id)} className="press rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent/50">{f.name}</button>)}</div></Card>}
          <Card><SectionTitle>Plan ahead</SectionTitle><div className="grid gap-2"><LinkButton href="/nutrition/planner" variant="secondary"><ChefHat size={15} />Generate a meal plan</LinkButton><LinkButton href="/nutrition/grocery" variant="secondary"><ShoppingCart size={15} />Grocery list ({s.grocery.filter((g) => !g.have).length})</LinkButton><Button variant="ghost" onClick={() => setTargetsOpen(true)}><Settings2 size={15} />Adjust targets</Button></div></Card>
          {tg && <Card><SectionTitle>Remaining today</SectionTitle>{(["kcal", "protein", "carbs", "fat"] as const).map((k) => <div key={k} className="mb-2"><div className="mb-1 flex justify-between text-xs"><span className="capitalize text-muted">{k === "kcal" ? "Calories" : k}</span><span className="tabular font-semibold">{Math.max(0, r0(tg[k] - totals[k]))}{k === "kcal" ? " kcal" : " g"}</span></div><Bar value={totals[k]} max={tg[k]} /></div>)}</Card>}
        </div>
      </div>

      <FoodPicker open={!!pickMeal} onClose={() => setPickMeal(null)} date={date} meal={pickMeal ?? undefined} />
      <FoodModal food={editing ? foods[editing.foodId] : null} open={!!editing} onClose={() => setEditing(null)} entry={editing ?? undefined} date={date} />
      <FoodModal food={quickFood ? foods[quickFood] : null} open={!!quickFood} onClose={() => setQuickFood(null)} date={date} />
      <TargetsModal open={targetsOpen} onClose={() => setTargetsOpen(false)} />
      <Modal open={!!copyFrom} onClose={() => setCopyFrom(null)} title={`Copy ${copyFrom ?? ""} to…`} footer={<Button onClick={() => { if (!copyFrom) return; const n = s.copyMeal(date, copyFrom, copyTo); toast(`Copied ${n} items to ${copyTo}`); setCopyFrom(null); }}>Copy</Button>}>
        <Field label="Destination date"><input type="date" className="input" value={copyTo} onChange={(e) => setCopyTo(e.target.value)} /></Field>
      </Modal>
      <Modal open={!!saveFrom} onClose={() => setSaveFrom(null)} title="Save meal" footer={<Button disabled={!saveName.trim()} onClick={() => { if (saveFrom) { s.saveMeal(saveName.trim(), date, saveFrom); toast("Meal saved"); } setSaveFrom(null); }}>Save</Button>}>
        <Field label="Name"><input className="input" value={saveName} onChange={(e) => setSaveName(e.target.value)} maxLength={50} /></Field>
      </Modal>
    </div>
  );
}
