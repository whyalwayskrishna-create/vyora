"use client";
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Eye, Lightbulb, Minus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import { totalsFor, r0 } from "@/lib/nutrition";
import { Card, PageHeader, SectionTitle, Notice } from "@/components/ui";
import { lastNDays, addDays, todayKey } from "@/lib/utils";

export default function Report() {
  const s = useStore();
  const foods = useFoodMap();
  const r = useMemo(() => {
    const cur = lastNDays(7); const prev = lastNDays(7, addDays(todayKey(), -7));
    const calc = (days: string[]) => {
      const set = new Set(days);
      const ses = s.sessions.filter((x) => set.has(x.startedAt.slice(0, 10)));
      const logged = days.filter((d) => s.foodEntries.some((e) => e.date === d));
      const water = days.map((d) => s.hydration.filter((h) => h.date === d).reduce((a, b) => a + b.ml, 0));
      const sleep = s.sleep.filter((x) => set.has(x.date));
      const protein = logged.map((d) => totalsFor(s.foodEntries.filter((e) => e.date === d), foods).protein);
      return { sessions: ses.length, minutes: r0(ses.reduce((a, b) => a + b.durationSec, 0) / 60), loggedDays: logged.length, waterDays: water.filter((w) => w > 0).length, avgWater: r0(water.reduce((a, b) => a + b, 0) / 7), habitChecks: s.habitEntries.filter((e) => set.has(e.date)).length, avgSleep: sleep.length ? Math.round((sleep.reduce((a, b) => a + b.hours, 0) / sleep.length) * 10) / 10 : null, avgProtein: protein.length ? r0(protein.reduce((a, b) => a + b, 0) / protein.length) : null };
    };
    return { cur: calc(cur), prev: calc(prev), range: `${cur[0]} – ${cur[6]}` };
  }, [s, foods]);
  const rows: [string, number | null, number | null, string][] = [["Workouts completed", r.cur.sessions, r.prev.sessions, ""], ["Training minutes", r.cur.minutes, r.prev.minutes, " min"], ["Days with meals logged", r.cur.loggedDays, r.prev.loggedDays, "/7"], ["Days with water logged", r.cur.waterDays, r.prev.waterDays, "/7"], ["Habit check-ins", r.cur.habitChecks, r.prev.habitChecks, ""], ["Average sleep (logged nights)", r.cur.avgSleep, r.prev.avgSleep, " h"], ["Average protein (logged days)", r.cur.avgProtein, r.prev.avgProtein, " g"]];
  const tips: string[] = [];
  if (r.cur.sessions < (s.profile.days.length || 3)) tips.push(`You planned ${s.profile.days.length || 3} training days. Scheduling sessions in your calendar can help — even a 15-minute express workout counts.`);
  else tips.push("You met your planned training frequency. Consider keeping the same routine next week, or add a small progression.");
  if (r.cur.loggedDays < 4) tips.push("Logging meals on a few more days would give a clearer picture of your nutrition.");
  if (r.cur.waterDays < 5) tips.push("Try a quick-add water tap after each meal to make hydration logging automatic.");
  if (r.cur.avgSleep !== null && r.cur.avgSleep < 7) tips.push("Your logged sleep averaged under 7 hours. A consistent wind-down routine may help recovery.");
  if (!s.habits.length) tips.push("Create one small daily habit — e.g. a 5-minute mobility break.");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Progress" title="Weekly report" subtitle={r.range} />
      <Card>
        <SectionTitle><span className="flex items-center gap-2"><Eye size={15} className="text-accent" />Observations — this week vs. last week</span></SectionTitle>
        <ul className="divide-y divide-line">{rows.map(([k, c, p, u]) => { const d = c !== null && p !== null ? c - p : null; return (
          <li key={k} className="flex items-center justify-between py-2.5 text-sm"><span>{k}</span><span className="tabular flex items-center gap-3"><span className="font-bold">{c ?? "—"}{c !== null ? u : ""}</span><span className={`flex w-16 items-center justify-end gap-0.5 text-xs ${d === null || d === 0 ? "text-muted" : d > 0 ? "text-success" : "text-warn"}`}>{d === null ? "—" : d === 0 ? <><Minus size={12} />same</> : d > 0 ? <><ArrowUpRight size={12} />+{Math.round(d * 10) / 10}</> : <><ArrowDownRight size={12} />{Math.round(d * 10) / 10}</>}</span></span></li>); })}</ul>
      </Card>
      <Card className="mt-5">
        <SectionTitle><span className="flex items-center gap-2"><Lightbulb size={15} className="text-accent" />Suggested next steps</span></SectionTitle>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">{tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
      <Notice className="mt-5">Observations are calculated directly from your logs. Suggestions are general, rules-based ideas — not predictions or guarantees of future results.</Notice>
    </div>
  );
}
