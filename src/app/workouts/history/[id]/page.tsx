"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Check, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Card, EmptyState, LinkButton, SectionTitle, Stat, Notice } from "@/components/ui";
import { fmtDuration, fmtWeight } from "@/lib/utils";
import { sessionStats } from "@/lib/workout";

export default function Summary() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const x = s.sessions.find((y) => y.id === id);
  if (!x) return <EmptyState icon={<XCircle size={20} />} title="Session not found" action={<LinkButton href="/workouts/history">History</LinkButton>} />;
  const st = sessionStats(x);
  const prev = s.sessions.filter((y) => y.planId === x.planId && y.startedAt < x.startedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const pst = prev ? sessionStats(prev) : null;
  const earlier = s.sessions.filter((y) => y.startedAt < x.startedAt);
  const prs = x.exercises.flatMap((e) => {
    const best = Math.max(0, ...e.sets.filter((z) => z.done && z.weight).map((z) => z.weight!));
    if (!best) return [];
    const prevBest = Math.max(0, ...earlier.flatMap((y) => y.exercises.filter((z) => z.exerciseId === e.exerciseId).flatMap((z) => z.sets.filter((q) => q.done && q.weight).map((q) => q.weight!))));
    return best > prevBest && prevBest > 0 ? [{ id: e.exerciseId, best, prevBest }] : [];
  });
  const latestWeight = [...s.measurements].reverse().find((m) => m.weightKg)?.weightKg;
  const kcalEst = latestWeight ? Math.round(5 * latestWeight * (x.durationSec / 3600)) : null;
  const diff = (a: number, b: number) => { const d = a - b; return d === 0 ? "same as last time" : `${d > 0 ? "+" : ""}${Math.round(d)} vs last time`; };
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/workouts/history" className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} />History</Link>
      <Card className="mb-5 overflow-hidden border-accent/30 bg-gradient-to-br from-accent-soft to-transparent text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink anim-pop"><Check size={28} /></div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">Workout complete</p>
        <h1 className="mt-1 text-2xl font-extrabold">{x.planName}</h1>
        <p className="text-sm text-muted">{new Date(x.startedAt).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} {x.demo && <Badge>Demo</Badge>}</p>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Duration" value={fmtDuration(x.durationSec)} sub={pst && prev ? diff(x.durationSec / 60, prev.durationSec / 60) + " min" : undefined} />
        <Stat label="Exercises" value={`${st.exercisesDone}/${x.exercises.length}`} />
        <Stat label="Sets · reps" value={`${st.sets} · ${st.reps}`} sub={pst ? diff(st.reps, pst.reps) + " reps" : undefined} />
        <Stat label="Effort" value={x.effort ? `${x.effort}/10` : "—"} sub="self-reported" />
      </div>
      {prs.length > 0 && <Card className="mt-5 border-warn/30"><SectionTitle><span className="flex items-center gap-2"><Award size={16} className="text-warn" />New personal bests</span></SectionTitle><ul className="space-y-1 text-sm">{prs.map((p) => <li key={p.id}><span className="font-semibold">{EX_BY_ID[p.id]?.name}</span>: {fmtWeight(p.best, s.profile.units)} <span className="text-muted">(previous {fmtWeight(p.prevBest, s.profile.units)})</span></li>)}</ul><p className="mt-2 text-[11px] text-muted">Heaviest recorded weight, compared with your earlier logged sessions.</p></Card>}
      <Card className="mt-5">
        <SectionTitle>Exercises</SectionTitle>
        <ul className="divide-y divide-line">
          {x.exercises.map((e, i) => { const ex = EX_BY_ID[e.exerciseId]; return (
            <li key={i} className="py-3">
              <div className="flex items-center justify-between"><Link href={`/exercises/${e.exerciseId}`} className="font-semibold hover:text-accent">{ex?.name}</Link>{e.skipped ? <Badge tone="warn">Skipped</Badge> : <span className="text-xs text-muted">{e.sets.filter((z) => z.done).length}/{e.sets.length} sets</span>}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">{e.sets.map((z, j) => <span key={j} className={`tabular rounded-lg border px-2 py-0.5 text-xs ${z.done ? "border-line bg-elevated" : "border-dashed border-line text-muted line-through"}`}>{z.durationSec && e.target.durationSec ? `${z.durationSec}s` : `${z.reps} reps`}{z.weight ? ` × ${fmtWeight(z.weight, "metric").replace(" kg", s.profile.units === "metric" ? " kg" : " lb")}` : ""}</span>)}</div>
            </li>); })}
        </ul>
      </Card>
      {x.notes && <Card className="mt-5"><SectionTitle>Notes</SectionTitle><p className="whitespace-pre-wrap text-sm text-muted">{x.notes}</p></Card>}
      {kcalEst ? <Notice className="mt-5">Estimated energy use: ~{kcalEst} kcal. Rough estimate using a general MET value of 5 × your latest logged body weight × duration; actual expenditure varies widely.</Notice> : <Notice className="mt-5">Energy estimates are only shown when a body weight measurement is recorded.</Notice>}
      <div className="mt-5 flex flex-wrap gap-2"><LinkButton href="/">Back to dashboard</LinkButton><LinkButton href="/progress" variant="secondary">View progress</LinkButton></div>
    </div>
  );
}
