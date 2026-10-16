"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, ChevronRight, FileText, Ruler } from "lucide-react";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import { totalsFor, r0 } from "@/lib/nutrition";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Card, LinkButton, PageHeader, SectionTitle, Segmented, Stat } from "@/components/ui";
import { BarsChart, LinesChart } from "@/components/charts/Charts";
import { addDays, fmtDay, fmtWeight, lastNDays, keyToDate } from "@/lib/utils";
import { sessionStats } from "@/lib/workout";

export default function Progress() {
  const s = useStore();
  const foods = useFoodMap();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const days = useMemo(() => lastNDays(Number(range)), [range]);
  const daySet = useMemo(() => new Set(days), [days]);
  const sessions = s.sessions.filter((x) => daySet.has(x.startedAt.slice(0, 10)));
  const label = (d: string) => range === "7" ? fmtDay(d) : keyToDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const activity = useMemo(() => {
    if (range === "7") return days.map((d) => ({ x: label(d), min: r0(s.sessions.filter((z) => z.startedAt.slice(0, 10) === d).reduce((a, b) => a + b.durationSec, 0) / 60) }));
    const weeks: { x: string; min: number; sessions: number }[] = [];
    for (let i = 0; i < days.length; i += 7) { const chunk = days.slice(i, i + 7); const ss = s.sessions.filter((z) => chunk.includes(z.startedAt.slice(0, 10))); weeks.push({ x: label(chunk[0]), min: r0(ss.reduce((a, b) => a + b.durationSec, 0) / 60), sessions: ss.length }); }
    return weeks;
  }, [days, s.sessions, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const durationTrend = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)).map((x) => ({ x: label(x.startedAt.slice(0, 10)), min: r0(x.durationSec / 60), effort: x.effort ?? null }));
  const exerciseOptions = useMemo(() => { const c: Record<string, number> = {}; s.sessions.forEach((x) => x.exercises.forEach((e) => { if (e.sets.some((z) => z.done)) c[e.exerciseId] = (c[e.exerciseId] ?? 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([id]) => id); }, [s.sessions]);
  const [exId, setExId] = useState<string>("");
  const selEx = exId || exerciseOptions[0];
  const perf = useMemo(() => [...s.sessions].filter((x) => daySet.has(x.startedAt.slice(0, 10))).sort((a, b) => a.startedAt.localeCompare(b.startedAt)).flatMap((x) => { const e = x.exercises.find((z) => z.exerciseId === selEx); if (!e) return []; const done = e.sets.filter((z) => z.done); if (!done.length) return []; return [{ x: label(x.startedAt.slice(0, 10)), weight: Math.max(0, ...done.map((z) => z.weight ?? 0)) || null, reps: done.reduce((a, b) => a + b.reps, 0) }]; }), [s.sessions, selEx, daySet]); // eslint-disable-line react-hooks/exhaustive-deps
  const nutrition = days.map((d) => { const t = totalsFor(s.foodEntries.filter((e) => e.date === d), foods); return { x: label(d), kcal: t.kcal ? r0(t.kcal) : null, protein: t.protein ? r0(t.protein) : null }; });
  const hydration = days.map((d) => ({ x: label(d), ml: s.hydration.filter((h) => h.date === d).reduce((a, b) => a + b.ml, 0) }));
  const habits = days.map((d) => ({ x: label(d), pct: s.habits.length ? r0((s.habitEntries.filter((e) => e.date === d).length / s.habits.length) * 100) : 0 }));
  const prev = s.sessions.filter((x) => { const k = x.startedAt.slice(0, 10); return k >= addDays(days[0], -Number(range)) && k < days[0]; });
  const totalMin = r0(sessions.reduce((a, b) => a + b.durationSec, 0) / 60);
  const prs = useMemo(() => { const best: Record<string, number> = {}; s.sessions.forEach((x) => x.exercises.forEach((e) => e.sets.forEach((z) => { if (z.done && z.weight) best[e.exerciseId] = Math.max(best[e.exerciseId] ?? 0, z.weight); }))); return Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 5); }, [s.sessions]);
  const activeDays = new Set(sessions.map((x) => x.startedAt.slice(0, 10))).size;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Analytics" title="Progress" subtitle={<>Based only on what you&apos;ve recorded{s.hasDemoData && <> · <Badge>includes demo data</Badge></>}</>} actions={<><Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} /></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 stagger">
        <Stat label="Sessions" value={sessions.length} sub={`${sessions.length - prev.length >= 0 ? "+" : ""}${sessions.length - prev.length} vs previous period`} />
        <Stat label="Training time" value={`${totalMin} min`} sub={sessions.length ? `avg ${r0(totalMin / sessions.length)} min/session` : "—"} />
        <Stat label="Weekly frequency" value={(sessions.length / (Number(range) / 7)).toFixed(1)} sub="sessions per week" />
        <Stat label="Active days" value={`${activeDays}/${range}`} sub="days with a workout" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><SectionTitle>{range === "7" ? "Daily activity" : "Weekly training trend"} <span className="text-xs font-medium text-muted">minutes</span></SectionTitle><BarsChart data={activity} x="x" y="min" unit=" min" name="Minutes" /></Card>
        <Card><SectionTitle>Workout duration & effort</SectionTitle>{durationTrend.length ? <LinesChart data={durationTrend} x="x" lines={[{ key: "min", color: "var(--accent)", name: "Minutes" }, { key: "effort", color: "var(--warn)", name: "Effort (1–10)" }]} /> : <p className="py-16 text-center text-sm text-muted">No sessions in this range.</p>}</Card>
        <Card>
          <SectionTitle action={exerciseOptions.length ? <select aria-label="Exercise" className="input !w-auto !py-1 text-xs" value={selEx} onChange={(e) => setExId(e.target.value)}>{exerciseOptions.map((id) => <option key={id} value={id}>{EX_BY_ID[id]?.name}</option>)}</select> : undefined}>Exercise performance</SectionTitle>
          {perf.length ? <LinesChart data={perf} x="x" lines={[{ key: "weight", color: "var(--accent)", name: `Top weight (${s.profile.units === "metric" ? "kg" : "lb"})` }, { key: "reps", color: "var(--success)", name: "Total reps" }]} /> : <p className="py-16 text-center text-sm text-muted">Record sets in guided mode to see performance trends.</p>}
        </Card>
        <Card><SectionTitle>Nutrition intake</SectionTitle><LinesChart data={nutrition} x="x" area lines={[{ key: "kcal", color: "var(--accent)", name: "Calories" }]} unit="" /></Card>
        <Card><SectionTitle>Protein trend <span className="text-xs font-medium text-muted">g/day</span></SectionTitle><LinesChart data={nutrition} x="x" lines={[{ key: "protein", color: "var(--success)", name: "Protein" }]} unit=" g" /></Card>
        <Card><SectionTitle>Hydration <span className="text-xs font-medium text-muted">ml/day</span></SectionTitle><BarsChart data={hydration} x="x" y="ml" unit=" ml" color="#7cc4ff" target={s.targets?.water} name="Water" /></Card>
        <Card><SectionTitle>Habit completion <span className="text-xs font-medium text-muted">% of habits</span></SectionTitle><BarsChart data={habits} x="x" y="pct" unit="%" color="var(--success)" name="Completed" /></Card>
        <Card>
          <SectionTitle><span className="flex items-center gap-2"><Award size={15} className="text-warn" />Personal records</span></SectionTitle>
          {prs.length ? <ul className="divide-y divide-line">{prs.map(([id, w]) => <li key={id} className="flex justify-between py-2 text-sm"><Link href={`/exercises/${id}`} className="hover:text-accent">{EX_BY_ID[id]?.name}</Link><span className="tabular font-bold">{fmtWeight(w, "metric").replace(" kg", s.profile.units === "metric" ? " kg" : " lb")}</span></li>)}</ul> : <p className="text-sm text-muted">Log weights during workouts to track records.</p>}
          <p className="mt-2 text-[11px] text-muted">Heaviest weight recorded per exercise, across all sessions.</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/progress/report" className="card flex items-center gap-3 p-4 hover:border-accent/40"><FileText className="text-accent" /><div className="flex-1"><p className="font-bold">Weekly report</p><p className="text-xs text-muted">Summary & suggestions</p></div><ChevronRight size={16} /></Link>
        <Link href="/progress/measurements" className="card flex items-center gap-3 p-4 hover:border-accent/40"><Ruler className="text-accent" /><div className="flex-1"><p className="font-bold">Body measurements</p><p className="text-xs text-muted">Optional & private</p></div><ChevronRight size={16} /></Link>
        <LinkButton href="/workouts/history" variant="secondary" className="h-auto rounded-[20px] p-4">Workout history <ChevronRight size={16} /></LinkButton>
      </div>
      {sessions.length > 0 && <p className="text-[11px] text-muted">Total sets in range: {sessions.reduce((a, b) => a + sessionStats(b).sets, 0)} · Total reps: {sessions.reduce((a, b) => a + sessionStats(b).reps, 0)}</p>}
    </div>
  );
}
