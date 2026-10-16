"use client";
import { useEffect, useMemo } from "react";
import { CalendarCheck, CheckCircle2, Compass, Droplets, Dumbbell, Flame, Hammer, Lock, Target, Trophy, Utensils, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeAchievements } from "@/services/achievements";
import { Badge, Bar, Button, Card, PageHeader, SectionTitle, useUI } from "@/components/ui";
import { cn, lastNDays, todayKey } from "@/lib/utils";

const ICONS: Record<string, typeof Trophy> = { Dumbbell, Flame, Trophy, Utensils, Droplets, Compass, CalendarCheck, Hammer, CheckCircle2, Target };

export default function Achievements() {
  const s = useStore();
  const { toast } = useUI();
  const list = useMemo(() => computeAchievements(s), [s]);
  const fresh = list.filter((a) => a.unlocked && !s.seenAchievements.includes(a.id)).map((a) => a.id);
  useEffect(() => { if (fresh.length) { const t = setTimeout(() => useStore.getState().set({ seenAchievements: [...useStore.getState().seenAchievements, ...fresh] }), 2500); return () => clearTimeout(t); } }, [fresh.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const unlocked = list.filter((a) => a.unlocked).length;
  const nextUp = list.filter((a) => !a.unlocked).sort((a, b) => b.progress / b.target - a.progress / a.target)[0];

  const challenges = useMemo(() => {
    const since = (id: string) => s.joinedChallenges[id];
    const daysSince = (d: string) => lastNDays(7).filter((x) => x >= d);
    return [
      { id: "hydrate7", title: "7-day hydration logging", desc: "Log water every day for a week.", target: 7, progress: (d: string) => daysSince(d).filter((x) => s.hydration.some((h) => h.date === x)).length },
      { id: "move3", title: "3 workouts in 7 days", desc: "Complete three sessions this week.", target: 3, progress: (d: string) => s.sessions.filter((x) => x.startedAt.slice(0, 10) >= d && !x.demo).length },
      { id: "mobility5", title: "Mobility streak", desc: "Check off a habit 5 days in a row.", target: 5, progress: (d: string) => new Set(s.habitEntries.filter((e) => e.date >= d).map((e) => e.date)).size },
      { id: "meals5", title: "Mindful week", desc: "Log at least one meal on 5 days.", target: 5, progress: (d: string) => new Set(s.foodEntries.filter((e) => e.date >= d).map((e) => e.date)).size },
    ].map((c) => ({ ...c, joined: since(c.id), value: since(c.id) ? Math.min(c.target, c.progress(since(c.id))) : 0 }));
  }, [s]);
  const toggleChallenge = (id: string, title: string) => {
    const j = { ...s.joinedChallenges };
    if (j[id]) { delete j[id]; toast(`Left “${title}”`, "info"); } else { j[id] = todayKey(); toast(`Joined “${title}” — progress counts from today`); }
    s.set({ joinedChallenges: j });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Motivation" title="Achievements & challenges" subtitle={`${unlocked} of ${list.length} unlocked · private to you`} />
      {nextUp && <Card className="border-accent/25 bg-gradient-to-r from-accent-soft to-transparent"><p className="text-xs font-bold uppercase tracking-wider text-accent">Next milestone</p><p className="mt-1 font-bold">{nextUp.title}</p><p className="text-sm text-muted">{nextUp.description}</p><div className="mt-3 flex items-center gap-3"><Bar value={nextUp.progress} max={nextUp.target} className="flex-1" /><span className="tabular text-xs font-bold">{nextUp.progress}/{nextUp.target}</span></div></Card>}
      <section>
        <SectionTitle>Achievements</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 stagger">
          {list.map((a) => { const I = ICONS[a.icon] ?? Trophy; const isNew = fresh.includes(a.id); return (
            <Card key={a.id} className={cn("relative flex flex-col items-center p-4 text-center", a.unlocked ? "border-accent/30" : "opacity-75")}>
              {isNew && <Badge tone="accent" className="absolute right-2 top-2">New!</Badge>}
              <div className={cn("mb-3 grid h-14 w-14 place-items-center rounded-2xl", a.unlocked ? "bg-accent text-accent-ink" : "bg-elevated-2 text-muted", isNew && "anim-pop")}>{a.unlocked ? <I size={26} /> : <Lock size={20} />}</div>
              <p className="text-sm font-bold">{a.title}</p><p className="mt-0.5 text-[11px] text-muted">{a.description}</p>
              {!a.unlocked && <div className="mt-3 w-full"><Bar value={a.progress} max={a.target} /><p className="tabular mt-1 text-[10px] text-muted">{a.progress}/{a.target}</p></div>}
            </Card>); })}
        </div>
      </section>
      <section>
        <SectionTitle>Private challenges <span className="text-xs font-medium text-muted">optional · no public rankings</span></SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Flag size={18} /></div><div className="min-w-0 flex-1"><p className="font-bold">{c.title}</p><p className="text-xs text-muted">{c.desc}</p></div><Button size="sm" variant={c.joined ? "secondary" : "primary"} onClick={() => toggleChallenge(c.id, c.title)}>{c.joined ? "Leave" : "Join"}</Button></div>
              {c.joined && <div className="mt-3"><div className="flex items-center gap-3"><Bar value={c.value} max={c.target} className="flex-1" /><span className="tabular text-xs font-bold">{c.value}/{c.target}</span></div>{c.value >= c.target && <p className="mt-1 text-xs font-semibold text-success">Completed — well done!</p>}</div>}
            </Card>
          ))}
        </div>
      </section>
      <p className="text-center text-xs text-muted">Progress is calculated from your own logs. Achievements celebrate effort — they&apos;re never a measure of worth.</p>
    </div>
  );
}
