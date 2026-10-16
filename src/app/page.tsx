"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bot, Camera, ChevronRight, Clock, Compass, Droplets, Dumbbell, Flame, Footprints, Moon, Play, Plus, Ruler, Sparkles, Utensils } from "lucide-react";
import { useStore, todaysPlan } from "@/lib/store";
import { useDayTotals, useWater } from "@/lib/hooks";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Button, Card, DifficultyBadge, LinkButton, MacroBar, Modal, ProgressRing, SectionTitle, Field, useUI } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseAnimation";
import { FoodPicker } from "@/components/nutrition/FoodModal";
import { BarsChart } from "@/components/charts/Charts";
import { fmtDay, fmtVolume, lastNDays, todayKey } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Home() {
  const s = useStore();
  const router = useRouter();
  const { toast } = useUI();
  const today = todayKey();
  const totals = useDayTotals(today);
  const water = useWater(today);
  const [foodOpen, setFoodOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [stepsVal, setStepsVal] = useState("");
  const { plan, scheduled, restDay } = todaysPlan(s);
  const estMin = Math.round(plan.exercises.reduce((a, e) => a + e.sets * ((e.durationSec ?? e.reps * 3) + e.restSec), 0) / 60) + 5;
  const week = lastNDays(7);
  const weekData = useMemo(() => week.map((d) => ({ day: fmtDay(d), minutes: Math.round(s.sessions.filter((x) => x.startedAt.slice(0, 10) === d).reduce((a, b) => a + b.durationSec, 0) / 60) })), [s.sessions, week]);
  const todayMin = weekData[6].minutes;
  const weekSessions = s.sessions.filter((x) => week.includes(x.startedAt.slice(0, 10))).length;
  const weekTarget = s.profile.days.length || 3;
  const mealsToday = new Set(s.foodEntries.filter((e) => e.date === today).map((e) => e.meal)).size;
  const lastSleep = s.sleep.find((x) => x.date === today) ?? s.sleep.find((x) => x.date === lastNDays(2)[0]);
  const waterTarget = s.targets?.water ?? 2000;
  const doneToday = s.sessions.some((x) => x.startedAt.slice(0, 10) === today);
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const firstEx = EX_BY_ID[plan.exercises[0]?.exerciseId];

  const insight = useMemo(() => {
    if (s.active) return { text: `You have a workout in progress — ${s.active.session.planName}. Pick up where you left off.`, href: "/workouts/session", cta: "Resume" };
    if (water < waterTarget * 0.3 && h >= 12) return { text: `You've logged ${fmtVolume(water, s.profile.units)} of water so far today. A glass now could help you stay on track.`, href: "/wellness/hydration", cta: "Log water" };
    if (!doneToday && !restDay) return { text: `Today's suggested session is ${plan.name} (~${estMin} min). A 5-minute warm-up makes a great start.`, href: `/workouts/${plan.id}`, cta: "View plan" };
    if (weekSessions >= 2) return { text: `You've recorded ${weekSessions} sessions in the last 7 days. Nice consistency — remember recovery matters too.`, href: "/progress", cta: "See progress" };
    if (!mealsToday) return { text: "No meals logged yet today. Logging even one meal helps build awareness.", href: "/nutrition", cta: "Log a meal" };
    return { text: "Ask the coach anything about training, recovery or nutrition.", href: "/coach", cta: "Open coach" };
  }, [s.active, water, waterTarget, h, doneToday, restDay, plan, estMin, weekSessions, mealsToday, s.profile.units]);

  const start = () => { if (s.active) return router.push("/workouts/session"); if (s.startSession(plan.id)) router.push("/workouts/session"); };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 anim-fade-up sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greet}, {s.profile.name || "there"}</h1>
        </div>
        <p className="text-sm text-muted"><span className="font-bold text-fg">{todayMin}</span> active min today · <span className="font-bold text-fg">{weekSessions}/{weekTarget}</span> sessions this week</p>
      </div>
      {s.hasDemoData && <div className="flex items-center gap-2 text-[11px] text-muted"><Badge>Demo data</Badge>Sample history is loaded for exploration. <Link href="/settings#data" className="text-accent hover:underline">Manage</Link></div>}

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Today's workout */}
        <Card className="relative overflow-hidden p-0 glow anim-fade-up">
          <div className="grid sm:grid-cols-[1fr_220px]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2"><Badge tone="accent">{restDay ? "Recovery day" : scheduled ? "Scheduled today" : "Suggested for today"}</Badge><DifficultyBadge d={plan.difficulty} />{doneToday && <Badge tone="success">Completed today</Badge>}</div>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{plan.name}</h2>
              <p className="text-sm text-muted">{plan.focus}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm"><span className="flex items-center gap-1.5"><Clock size={15} className="text-accent" />~{estMin} min</span><span className="flex items-center gap-1.5"><Dumbbell size={15} className="text-accent" />{plan.exercises.length} exercises</span></div>
              <ul className="mt-4 space-y-1 text-sm text-muted">{plan.exercises.slice(0, 4).map((e) => <li key={e.uid} className="flex justify-between gap-2"><span className="truncate">{EX_BY_ID[e.exerciseId]?.name}</span><span className="tabular shrink-0">{e.sets} × {e.durationSec ? `${e.durationSec}s` : e.reps}</span></li>)}{plan.exercises.length > 4 && <li className="text-xs">+{plan.exercises.length - 4} more</li>}</ul>
              <div className="mt-5 flex flex-wrap gap-2"><Button onClick={start} size="lg"><Play size={17} />{s.active ? "Resume Workout" : "Start Workout"}</Button><LinkButton href={`/workouts/${plan.id}`} variant="secondary" size="lg">View Plan</LinkButton></div>
            </div>
            {firstEx && <ExerciseThumb ex={firstEx} className="hidden border-l border-line sm:block" />}
          </div>
        </Card>

        {/* Nutrition overview */}
        <Card className="anim-fade-up">
          <SectionTitle action={<Link href="/nutrition" className="text-xs font-semibold text-muted hover:text-accent">Diary <ChevronRight size={12} className="inline" /></Link>}>Nutrition today</SectionTitle>
          <div className="flex items-center gap-5">
            <ProgressRing value={totals.kcal} max={s.targets?.kcal ?? Math.max(totals.kcal, 1)} size={124} label="Calories logged">
              <div><div className="tabular text-2xl font-extrabold">{Math.round(totals.kcal)}</div><div className="text-[10px] font-semibold text-muted">kcal logged</div></div>
            </ProgressRing>
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" value={totals.protein} target={s.targets?.protein} color="var(--accent)" />
              <MacroBar label="Carbs" value={totals.carbs} target={s.targets?.carbs} color="var(--success)" />
              <MacroBar label="Fat" value={totals.fat} target={s.targets?.fat} color="var(--warn)" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
            <span>{s.targets ? <>Target {s.targets.kcal} kcal <span className="opacity-70">({s.targetsSource === "user" ? "set by you" : s.targetsSource === "estimate" ? "estimate" : "demo"})</span></> : <Link href="/nutrition?targets=1" className="text-accent hover:underline">Set a calorie target (optional)</Link>} · {mealsToday} meals</span>
            <Button size="sm" onClick={() => setFoodOpen(true)}><Plus size={14} />Quick add</Button>
          </div>
        </Card>
      </div>

      {/* Daily overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 stagger">
        {[
          { label: "Week sessions", value: `${weekSessions}/${weekTarget}`, icon: Flame, href: "/workouts/history" },
          { label: "Active today", value: `${todayMin} min`, icon: Clock, href: "/progress" },
          { label: "Steps", value: s.steps[today] ? s.steps[today].toLocaleString() : "Add", icon: Footprints, onClick: () => { setStepsVal(String(s.steps[today] ?? "")); setStepsOpen(true); } },
          { label: "Water", value: fmtVolume(water, s.profile.units), icon: Droplets, href: "/wellness/hydration", pct: water / waterTarget },
          { label: "Meals logged", value: `${mealsToday}/4`, icon: Utensils, href: "/nutrition" },
          { label: "Sleep", value: lastSleep ? `${lastSleep.hours} h` : "Log", icon: Moon, href: "/wellness/sleep" },
        ].map((c) => {
          const inner = (<><div className="flex items-center justify-between text-xs font-semibold text-muted">{c.label}<c.icon size={15} className="text-accent" /></div><div className="tabular mt-2 text-xl font-extrabold">{c.value}</div>{c.pct != null && <div className="mt-2 h-1 overflow-hidden rounded-full bg-elevated-2"><div className="bar-anim h-full bg-accent" style={{ width: `${Math.min(100, c.pct * 100)}%` }} /></div>}</>);
          return c.href ? <Link key={c.label} href={c.href} className="card-elev press p-4 hover:border-accent/40">{inner}</Link> : <button key={c.label} onClick={c.onClick} className="card-elev press p-4 text-left hover:border-accent/40">{inner}</button>;
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle action={<Link href="/progress" className="text-xs font-semibold text-muted hover:text-accent">Analytics <ChevronRight size={12} className="inline" /></Link>}>Weekly activity <span className="ml-1 text-xs font-medium text-muted">minutes recorded</span></SectionTitle>
          {weekData.some((d) => d.minutes) ? <BarsChart data={weekData} x="day" y="minutes" unit=" min" name="Workout" /> : <p className="py-14 text-center text-sm text-muted">No workouts recorded this week yet.</p>}
        </Card>
        <div className="space-y-5">
          <Card className="border-accent/25 bg-gradient-to-br from-accent-soft to-transparent">
            <div className="flex gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink"><Bot size={20} /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-accent">Coach insight</p>
                <p className="mt-1 text-sm">{insight.text}</p>
                <p className="mt-1 text-[10px] text-muted">Based on your logged data · rules-based</p>
                <LinkButton href={insight.href} size="sm" variant="outline" className="mt-3">{insight.cta}</LinkButton>
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Quick actions</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Workout", icon: Play, onClick: start },
                { label: "Log meal", icon: Utensils, onClick: () => setFoodOpen(true) },
                { label: "Scan food", icon: Camera, href: "/nutrition/foods?scan=1" },
                { label: "Ask coach", icon: Sparkles, href: "/coach" },
                { label: "+250 ml", icon: Droplets, onClick: () => { s.addWater(250); toast("Logged 250 ml of water", "success", { label: "Undo", fn: () => { const last = useStore.getState().hydration.at(-1); if (last) useStore.getState().deleteWater(last.id); } }); } },
                { label: "Measure", icon: Ruler, href: "/progress/measurements?add=1" },
                { label: "Exercises", icon: Compass, href: "/exercises" },
                { label: "Generate", icon: Bot, href: "/workouts/generator" },
              ].map((a) => {
                const c = <><a.icon size={18} className="text-accent" /><span>{a.label}</span></>;
                const cls = "press flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-elevated px-1 py-3 text-[11px] font-semibold hover:border-accent/50";
                return a.href ? <Link key={a.label} href={a.href} className={cls}>{c}</Link> : <button key={a.label} onClick={a.onClick} className={cls}>{c}</button>;
              })}
            </div>
          </Card>
        </div>
      </div>

      <FoodPicker open={foodOpen} onClose={() => setFoodOpen(false)} />
      <Modal open={stepsOpen} onClose={() => setStepsOpen(false)} title="Steps today" footer={<Button onClick={() => { const n = Math.round(Number(stepsVal)); if (!Number.isFinite(n) || n < 0 || n > 100000) return toast("Enter a number between 0 and 100,000", "error"); s.setSteps(today, n); setStepsOpen(false); toast("Steps saved"); }}>Save</Button>}>
        <Field label="Steps" hint="Enter manually. No wearable is connected."><input className="input tabular" type="number" min={0} max={100000} value={stepsVal} onChange={(e) => setStepsVal(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
