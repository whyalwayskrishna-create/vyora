"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Clapperboard, Heart, Plus, Play, ShieldCheck, Wind, XCircle } from "lucide-react";
import { EXERCISES, EX_BY_ID } from "@/data/exercises";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, DifficultyBadge, EmptyState, LinkButton, Modal, Notice, SectionTitle, useUI } from "@/components/ui";
import { ExercisePlayer, ExerciseThumb, MuscleMap } from "@/components/exercises/ExerciseAnimation";
import { uid } from "@/lib/utils";
import { deviceId } from "@/components/layout/AppShell";
import type { WorkoutSession } from "@/types";

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const ex = EX_BY_ID[id];
  const router = useRouter();
  const { toast } = useUI();
  const s = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => { if (ex) s.viewExercise(ex.id); }, [ex?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const related = useMemo(() => ex ? EXERCISES.filter((e) => e.id !== ex.id && (e.muscle === ex.muscle || e.pattern === ex.pattern)).slice(0, 6) : [], [ex]);
  if (!ex) return <EmptyState icon={<XCircle size={20} />} title="Exercise not found" body="It may have been removed or the link is incorrect." action={<LinkButton href="/exercises">Back to library</LinkButton>} />;
  const fav = s.favExercises.includes(ex.id);
  const findByName = (n?: string) => n ? EXERCISES.find((e) => e.name.toLowerCase() === n.toLowerCase()) : undefined;
  const demoReq = s.demoRequests[ex.id];

  const guided = () => {
    if (s.active) { toast("Finish or exit your current workout first.", "error"); return router.push("/workouts/session"); }
    const target = { uid: uid(), exerciseId: ex.id, sets: 3, reps: 10, restSec: 60, durationSec: ex.anim === "plank" ? 30 : ex.category === "Cardio" ? 600 : ex.category === "Mobility" ? 40 : undefined };
    const session: WorkoutSession = { id: uid(), planId: "adhoc", planName: `Guided: ${ex.name}`, startedAt: new Date().toISOString(), durationSec: 0, exercises: [{ exerciseId: ex.id, target, sets: Array.from({ length: 3 }, () => ({ reps: 10, durationSec: target.durationSec, done: false })) }] };
    s.setActive({ session, exIndex: 0, setIndex: 0, paused: false, elapsedBeforePause: 0, resumedAt: Date.now() });
    router.push("/workouts/session");
  };
  const addTo = (planId: string | null) => {
    const we = { uid: uid(), exerciseId: ex.id, sets: 3, reps: 10, restSec: 75 };
    if (!planId) { s.savePlan({ id: uid(), name: `My ${ex.muscle} workout`, focus: ex.muscle, difficulty: ex.difficulty, location: "Any", exercises: [we], source: "custom", createdAt: new Date().toISOString() }); toast("New workout created"); }
    else { const p = s.plans.find((x) => x.id === planId); if (p) { s.savePlan({ ...p, exercises: [...p.exercises, we] }); toast(`Added to ${p.name}`); } }
    setAddOpen(false);
  };
  const requestDemo = async () => {
    setDemoLoading(true);
    try {
      const r = await fetch("/api/ai/demo-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exerciseId: ex.id, deviceId: deviceId() }) });
      const j = await r.json();
      s.set({ demoRequests: { ...s.demoRequests, [ex.id]: { status: j.status ?? "error", at: new Date().toISOString(), message: j.message } } });
      toast(j.message ?? "Request processed", j.status === "queued" ? "success" : "info");
    } catch { toast("Network error — couldn't reach the server.", "error"); }
    setDemoLoading(false);
  };

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} />Back</button>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4 anim-fade-up">
          <ExercisePlayer ex={ex} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={requestDemo} loading={demoLoading}><Clapperboard size={14} />Request AI video demo</Button>
            {demoReq && <Badge tone={demoReq.status === "queued" ? "accent" : "warn"}>{demoReq.status === "queued" ? "Video queued" : "Video generation unavailable"}</Badge>}
          </div>
          <Notice>This cartoon animation is generated procedurally from keyframes to illustrate the general movement pattern. It hasn&apos;t been reviewed by a coach as definitive technique guidance — prioritize the written cues and how your body feels.</Notice>
        </div>
        <div className="space-y-4">
          <div className="anim-fade-up">
            <div className="flex flex-wrap gap-2"><DifficultyBadge d={ex.difficulty} /><Badge>{ex.category}</Badge><Badge>{ex.pattern}</Badge>{ex.location.map((l) => <Badge key={l}>{l}</Badge>)}</div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{ex.name}</h1>
            <p className="mt-1 text-sm text-muted">Primary: <span className="font-semibold text-fg">{ex.muscle}</span>{ex.secondary.length > 0 && <> · Secondary: {ex.secondary.join(", ")}</>}</p>
            <p className="text-sm text-muted">Equipment: {ex.equipment.join(", ")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Button onClick={guided} className="col-span-2"><Play size={16} />Start guided</Button>
              <Button variant="secondary" onClick={() => setAddOpen(true)}><Plus size={16} />Add</Button>
              <Button variant="secondary" onClick={() => { s.toggleFavExercise(ex.id); toast(fav ? "Removed from favorites" : "Saved to favorites"); }} aria-pressed={fav}><Heart size={16} className={fav ? "fill-accent text-accent" : ""} />{fav ? "Saved" : "Save"}</Button>
            </div>
          </div>
          <Card className="p-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="label">Suggested sets × reps</p><p className="font-bold">{ex.sets}</p></div><div><p className="label">Rest</p><p className="font-bold">{ex.rest}</p></div></div><p className="mt-2 text-[11px] text-muted">Starting suggestions only — adjust to your experience and how you feel.</p></Card>
          <Card className="p-4"><SectionTitle>Muscles worked</SectionTitle><MuscleMap ex={ex} /></Card>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>How to perform</SectionTitle>
          <p className="mb-3 rounded-xl bg-elevated p-3 text-sm"><span className="font-semibold">Starting position: </span>{ex.start}</p>
          <ol className="space-y-2.5">{ex.steps.map((st, i) => <li key={i} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span><span className="pt-0.5">{st}</span></li>)}</ol>
          <div className="mt-4 flex gap-2.5 rounded-xl border border-line p-3 text-sm"><Wind size={17} className="shrink-0 text-accent" /><span><span className="font-semibold">Breathing: </span>{ex.breathing}</span></div>
        </Card>
        <div className="space-y-5">
          <Card><SectionTitle>Common mistakes</SectionTitle><ul className="space-y-2 text-sm">{ex.mistakes.map((m) => <li key={m} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" />{m}</li>)}</ul></Card>
          <Card><SectionTitle>Safety</SectionTitle><ul className="space-y-2 text-sm">{ex.safety.map((m) => <li key={m} className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" />{m}</li>)}</ul></Card>
        </div>
      </div>

      {(ex.easier || ex.harder) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[["Easier variation", ex.easier], ["Harder variation", ex.harder]].filter(([, v]) => v).map(([k, v]) => { const m = findByName(v); return (
            <Card key={k} className="flex items-center justify-between p-4"><div><p className="label">{k}</p><p className="font-bold">{v}</p></div>{m && <LinkButton href={`/exercises/${m.id}`} size="sm" variant="outline">View</LinkButton>}</Card>); })}
        </div>
      )}

      <section className="mt-6">
        <SectionTitle action={related.length > 3 ? <button className="flex items-center gap-1 text-xs text-muted" onClick={() => setMore((m) => !m)}>{more ? <>Less <ChevronUp size={13} /></> : <>More <ChevronDown size={13} /></>}</button> : undefined}>Related exercises</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{related.slice(0, more ? 6 : 3).map((r) => (
          <Link key={r.id} href={`/exercises/${r.id}`} className="card flex items-center gap-3 overflow-hidden p-2 hover:border-accent/40"><ExerciseThumb ex={r} className="h-14 w-14 shrink-0 rounded-xl" /><div className="min-w-0"><p className="truncate text-sm font-bold">{r.name}</p><p className="text-[11px] text-muted">{r.muscle}</p></div></Link>))}
        </div>
      </section>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add to workout">
        <div className="space-y-2">
          <button onClick={() => addTo(null)} className="press flex w-full items-center gap-3 rounded-xl border border-dashed border-accent/50 p-3 text-left text-sm font-semibold text-accent"><Plus size={16} />Create new workout with this exercise</button>
          {s.plans.map((p) => <button key={p.id} onClick={() => addTo(p.id)} className="press flex w-full items-center justify-between rounded-xl border border-line p-3 text-left text-sm hover:border-accent/40"><span className="font-semibold">{p.name}</span><span className="text-xs text-muted">{p.exercises.length} exercises</span></button>)}
          {!s.plans.length && <p className="pt-2 text-center text-xs text-muted">You have no custom workouts yet. Templates can be duplicated from the Workouts page.</p>}
        </div>
      </Modal>
    </div>
  );
}
