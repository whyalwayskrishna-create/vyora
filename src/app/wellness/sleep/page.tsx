"use client";
import { useState } from "react";
import { BatteryCharging, Moon, Star, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, Field, Notice, PageHeader, SectionTitle, Stat, useUI } from "@/components/ui";
import { BarsChart } from "@/components/charts/Charts";
import { cn, fmtDay, lastNDays, todayKey } from "@/lib/utils";

function hoursBetween(bed: string, wake: string) { const [bh, bm] = bed.split(":").map(Number); const [wh, wm] = wake.split(":").map(Number); let d = wh * 60 + wm - (bh * 60 + bm); if (d <= 0) d += 1440; return Math.round((d / 60) * 10) / 10; }

export default function Sleep() {
  const s = useStore();
  const { toast, confirm } = useUI();
  const [f, setF] = useState({ date: todayKey(), bedtime: "23:00", wake: "07:00", quality: 3 });
  const [r, setR] = useState({ energy: 7, soreness: 3, note: "" });
  const hours = hoursBetween(f.bedtime, f.wake);
  const save = () => { if (hours < 0.5 || hours > 16) return toast("Sleep duration should be between 0.5 and 16 hours", "error"); if (f.date > todayKey()) return toast("Date can't be in the future", "error"); s.addSleep({ ...f, hours }); toast("Sleep logged"); };
  const days = lastNDays(14);
  const chart = days.map((d) => ({ day: fmtDay(d, { month: "short", day: "numeric" }), h: s.sleep.find((x) => x.date === d)?.hours ?? 0 }));
  const logged = s.sleep.filter((x) => days.includes(x.date));
  const avg = logged.length ? Math.round((logged.reduce((a, b) => a + b.hours, 0) / logged.length) * 10) / 10 : null;
  const todayReady = s.readiness.find((x) => x.date === todayKey());
  const score = Math.round(((r.energy + (10 - r.soreness)) / 2) * 10) / 10;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader eyebrow="Wellness" title="Sleep & recovery" subtitle="Manual logging — no wearable is connected, so sleep stages aren't measured." />
      <div className="grid grid-cols-3 gap-3"><Stat label="Avg sleep (14d)" value={avg ? `${avg} h` : "—"} icon={<Moon size={15} />} /><Stat label="Nights logged" value={`${logged.length}/14`} /><Stat label="Today's readiness" value={todayReady ? `${todayReady.score}/10` : "—"} icon={<BatteryCharging size={15} />} sub="self-reported" /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionTitle>Log sleep</SectionTitle>
          <div className="grid grid-cols-3 gap-3"><Field label="Night of (wake date)"><input type="date" className="input" value={f.date} max={todayKey()} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field><Field label="Bedtime"><input type="time" className="input" value={f.bedtime} onChange={(e) => setF({ ...f, bedtime: e.target.value })} /></Field><Field label="Wake time"><input type="time" className="input" value={f.wake} onChange={(e) => setF({ ...f, wake: e.target.value })} /></Field></div>
          <div><span className="label">Quality (optional, subjective)</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((q) => <button key={q} onClick={() => setF({ ...f, quality: q })} aria-label={`${q} stars`} aria-pressed={f.quality === q} className="press p-1"><Star size={24} className={cn(q <= f.quality ? "fill-warn text-warn" : "text-line")} /></button>)}</div></div>
          <div className="flex items-center justify-between rounded-xl bg-elevated p-3"><span className="text-sm text-muted">Duration</span><span className="tabular text-xl font-extrabold">{hours} h</span></div>
          <Button className="w-full" onClick={save}>Save sleep</Button>
        </Card>
        <Card className="space-y-4">
          <SectionTitle>Readiness check-in</SectionTitle>
          <Field label={`Energy: ${r.energy}/10`}><input type="range" min={1} max={10} value={r.energy} onChange={(e) => setR({ ...r, energy: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>
          <Field label={`Muscle soreness: ${r.soreness}/10`}><input type="range" min={0} max={10} value={r.soreness} onChange={(e) => setR({ ...r, soreness: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>
          <Field label="Note (optional)"><input className="input" value={r.note} onChange={(e) => setR({ ...r, note: e.target.value })} /></Field>
          <div className="flex items-center justify-between rounded-xl bg-elevated p-3"><span className="text-sm text-muted">Readiness score</span><span className="tabular text-xl font-extrabold">{score}/10</span></div>
          <p className="text-xs text-muted">{score >= 7 ? "Feeling good — a normal session is likely fine." : score >= 4.5 ? "Consider a lighter session or extra warm-up." : "A rest day, walk or gentle mobility may be a better fit today."}</p>
          <Button className="w-full" variant="secondary" onClick={() => { s.addReadiness({ date: todayKey(), score, energy: r.energy, soreness: r.soreness, note: r.note || undefined }); toast("Readiness saved"); }}>Save check-in</Button>
          <p className="text-[11px] text-muted">A self-reported score for reflection, not a medical assessment.</p>
        </Card>
      </div>
      <Card><SectionTitle>Sleep duration — last 14 nights</SectionTitle><BarsChart data={chart} x="day" y="h" unit=" h" color="#a99bff" target={8} name="Sleep" /></Card>
      <Card className="p-0"><p className="border-b border-line px-5 py-3 font-bold">History</p>{s.sleep.length ? <ul className="divide-y divide-line">{[...s.sleep].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map((x) => <li key={x.id} className="tabular flex items-center justify-between px-5 py-2.5 text-sm"><span>{x.date}</span><span className="text-muted">{x.bedtime} → {x.wake}</span><span className="font-bold">{x.hours} h</span><span className="flex">{Array.from({ length: x.quality }).map((_, i) => <Star key={i} size={11} className="fill-warn text-warn" />)}</span><button onClick={async () => { if (await confirm({ title: "Delete sleep entry?", body: x.date, danger: true, confirmLabel: "Delete" })) s.deleteSleep(x.id); }} className="p-1 text-muted hover:text-danger" aria-label="Delete"><Trash2 size={13} /></button></li>)}</ul> : <p className="p-5 text-sm text-muted">No sleep logged yet.</p>}</Card>
      <Card><SectionTitle>Recovery basics</SectionTitle><ul className="grid gap-3 text-sm text-muted sm:grid-cols-2">{["Most adults do well with 7–9 hours of sleep; consistency in timing helps.", "Plan 1–2 lighter or rest days per week — walking and mobility count.", "Mild soreness 24–72 h after new training is common; sharp or worsening pain isn't.", "Eat enough overall, including protein spread across the day, to support recovery."].map((t) => <li key={t} className="rounded-xl border border-line p-3">{t}</li>)}</ul></Card>
      <Notice>Persistent sleep problems or unusual fatigue are worth discussing with a healthcare professional.</Notice>
    </div>
  );
}
