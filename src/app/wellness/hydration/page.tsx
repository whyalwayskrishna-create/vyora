"use client";
import { useState } from "react";
import { Droplets, GlassWater, Plus, Settings2, Trash2, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useWater } from "@/lib/hooks";
import { Button, Card, Field, Modal, Notice, PageHeader, ProgressRing, SectionTitle, useUI } from "@/components/ui";
import { BarsChart } from "@/components/charts/Charts";
import { fmtDay, fmtVolume, lastNDays, mlToOz, ozToMl, todayKey } from "@/lib/utils";

export default function Hydration() {
  const s = useStore();
  const { toast } = useUI();
  const today = todayKey();
  const total = useWater(today);
  const imp = s.profile.units === "imperial";
  const target = s.targets?.water ?? 2000;
  const [custom, setCustom] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);
  const [goal, setGoal] = useState(String(Math.round(imp ? mlToOz(target) : target)));
  const entries = s.hydration.filter((h) => h.date === today).sort((a, b) => b.at.localeCompare(a.at));
  const quick = imp ? [8, 12, 16, 24].map((oz) => ({ label: `${oz} oz`, ml: Math.round(ozToMl(oz)) })) : [150, 250, 500, 750].map((ml) => ({ label: `${ml} ml`, ml }));
  const add = (ml: number) => { s.addWater(ml); toast(`+${fmtVolume(ml, s.profile.units)}`, "success", { label: "Undo", fn: () => { const last = useStore.getState().hydration.at(-1); if (last) useStore.getState().deleteWater(last.id); } }); };
  const addCustom = () => { const v = Number(custom); const ml = imp ? ozToMl(v) : v; if (!(ml > 0 && ml <= 3000)) return toast(`Enter 1–${imp ? 100 : 3000} ${imp ? "oz" : "ml"}`, "error"); add(Math.round(ml)); setCustom(""); };
  const history = lastNDays(14).map((d) => ({ day: fmtDay(d, { month: "short", day: "numeric" }), ml: s.hydration.filter((h) => h.date === d).reduce((a, b) => a + b.ml, 0) }));
  const saveGoal = () => { const v = Number(goal); const ml = imp ? ozToMl(v) : v; if (!(ml >= 500 && ml <= 8000)) return toast("Goal must be between 500 and 8000 ml", "error"); s.setTargets({ ...(s.targets ?? { kcal: 2000, protein: 100, carbs: 230, fat: 70, fiber: 30, water: 2000 }), water: Math.round(ml) }, s.targetsSource ?? "user"); setGoalOpen(false); toast("Hydration goal updated"); };
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Wellness" title="Hydration" actions={<Button variant="secondary" onClick={() => setGoalOpen(true)}><Settings2 size={15} />Goal</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex flex-col items-center text-center">
          <ProgressRing value={total} max={target} size={200} stroke={14} color="#7cc4ff" label="Water today">
            <div><Droplets className="mx-auto mb-1 text-[#7cc4ff]" size={22} /><div className="tabular text-3xl font-extrabold">{fmtVolume(total, s.profile.units)}</div><div className="text-xs text-muted">of {fmtVolume(target, s.profile.units)} goal</div></div>
          </ProgressRing>
          <div className="mt-5 grid w-full grid-cols-4 gap-2">{quick.map((q) => <button key={q.label} onClick={() => add(q.ml)} className="press flex flex-col items-center gap-1 rounded-2xl border border-line bg-elevated py-3 text-xs font-bold hover:border-[#7cc4ff]/60"><GlassWater size={18} className="text-[#7cc4ff]" />{q.label}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); addCustom(); }} className="mt-3 flex w-full gap-2"><input className="input" type="number" placeholder={`Custom (${imp ? "oz" : "ml"})`} value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom amount" /><Button type="submit"><Plus size={15} />Add</Button></form>
        </Card>
        <div className="space-y-5">
          <Card>
            <SectionTitle action={entries.length ? <Button size="sm" variant="ghost" onClick={() => { s.deleteWater(entries[0].id); toast("Last entry removed"); }}><Undo2 size={13} />Undo last</Button> : undefined}>Today&apos;s entries</SectionTitle>
            {entries.length ? <ul className="max-h-56 divide-y divide-line overflow-y-auto">{entries.map((h) => <li key={h.id} className="flex items-center justify-between py-2 text-sm"><span className="tabular">{fmtVolume(h.ml, s.profile.units)}</span><span className="flex items-center gap-2 text-xs text-muted">{new Date(h.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}<button onClick={() => s.deleteWater(h.id)} className="p-1 hover:text-danger" aria-label="Delete entry"><Trash2 size={13} /></button></span></li>)}</ul> : <p className="text-sm text-muted">No water logged yet today.</p>}
          </Card>
          <Card><SectionTitle>Last 14 days</SectionTitle><BarsChart data={history} x="day" y="ml" unit=" ml" color="#7cc4ff" target={target} name="Water" height={180} /></Card>
        </div>
      </div>
      <Notice className="mt-5">Fluid needs vary with body size, climate, activity and diet — there&apos;s no single right number. Set a goal that feels practical for you.</Notice>
      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="Daily hydration goal" footer={<Button onClick={saveGoal}>Save</Button>}><Field label={`Goal (${imp ? "fl oz" : "ml"})`}><input className="input" type="number" value={goal} onChange={(e) => setGoal(e.target.value)} /></Field></Modal>
    </div>
  );
}
