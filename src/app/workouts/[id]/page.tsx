"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Copy, Dumbbell, Heart, Pencil, Play, Trash2, XCircle } from "lucide-react";
import { useStore, getPlan } from "@/lib/store";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Button, Card, DifficultyBadge, EmptyState, LinkButton, Notice, SectionTitle, useUI } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseAnimation";
import { estMinutes } from "@/lib/workout";
import { fmtDuration } from "@/lib/utils";

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const router = useRouter();
  const { toast, confirm } = useUI();
  const p = getPlan(s, id);
  if (!p) return <EmptyState icon={<XCircle size={20} />} title="Workout not found" action={<LinkButton href="/workouts">All workouts</LinkButton>} />;
  const fav = s.favPlans.includes(p.id);
  const past = s.sessions.filter((x) => x.planId === p.id).slice(0, 3);
  const start = async () => {
    if (s.active) { if (!(await confirm({ title: "Replace current workout?", body: `You have “${s.active.session.planName}” in progress. Starting a new one will discard it.`, confirmLabel: "Discard & start", danger: true }))) return; }
    if (s.startSession(p.id)) router.push("/workouts/session"); else toast("This workout has no exercises.", "error");
  };
  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft size={16} />Back</button>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap gap-2"><DifficultyBadge d={p.difficulty} /><Badge>{p.location}</Badge>{p.isTemplate ? <Badge>Template</Badge> : <Badge tone="accent">{p.source === "rules-generator" ? "Generated" : p.source === "ai" ? "AI generated" : "Custom"}</Badge>}</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{p.name}</h1>
          <p className="text-muted">{p.focus}</p>
          {p.description && <p className="mt-2 max-w-2xl text-sm text-muted">{p.description}</p>}
          <div className="mt-4 flex flex-wrap gap-5 text-sm"><span className="flex items-center gap-1.5"><Clock size={16} className="text-accent" />~{estMinutes(p)} min</span><span className="flex items-center gap-1.5"><Dumbbell size={16} className="text-accent" />{p.exercises.length} exercises</span>{p.scheduledDays?.length ? <span className="flex items-center gap-1.5"><CalendarDays size={16} className="text-accent" />{p.scheduledDays.join(", ")}</span> : null}</div>
          <ol className="mt-6 space-y-2 stagger">
            {p.exercises.map((we, i) => { const ex = EX_BY_ID[we.exerciseId]; if (!ex) return null; return (
              <li key={we.uid}><Link href={`/exercises/${ex.id}`} className="card flex items-center gap-3 p-2.5 pr-4 hover:border-accent/40">
                <ExerciseThumb ex={ex} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1"><p className="text-xs text-muted">{i + 1}. {ex.muscle}</p><p className="truncate font-bold">{ex.name}</p>{we.notes && <p className="truncate text-xs text-muted">{we.notes}</p>}</div>
                <div className="tabular text-right text-sm"><p className="font-bold">{we.sets} × {we.durationSec ? fmtDuration(we.durationSec) : we.reps}</p><p className="text-[11px] text-muted">rest {we.restSec}s</p></div>
              </Link></li>); })}
          </ol>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <Button size="lg" className="w-full" onClick={start}><Play size={18} />Start workout</Button>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => s.toggleFavPlan(p.id)} aria-pressed={fav}><Heart size={14} className={fav ? "fill-accent text-accent" : ""} />{fav ? "Saved" : "Save"}</Button>
              <Button variant="secondary" size="sm" onClick={() => { const nid = s.duplicatePlan(p.id); toast("Duplicated"); if (nid) router.push(`/workouts/builder?id=${nid}`); }}><Copy size={14} />Copy</Button>
              {p.isTemplate ? <Button variant="secondary" size="sm" onClick={() => { const nid = s.duplicatePlan(p.id); if (nid) router.push(`/workouts/builder?id=${nid}`); }}><Pencil size={14} />Edit</Button> : <LinkButton href={`/workouts/builder?id=${p.id}`} variant="secondary" size="sm"><Pencil size={14} />Edit</LinkButton>}
            </div>
            {!p.isTemplate && <Button variant="danger" size="sm" className="mt-2 w-full" onClick={async () => { if (await confirm({ title: "Delete workout?", body: "This can't be undone.", danger: true, confirmLabel: "Delete" })) { s.deletePlan(p.id); toast("Deleted"); router.push("/workouts"); } }}><Trash2 size={14} />Delete</Button>}
          </Card>
          <Card><SectionTitle>Previous sessions</SectionTitle>{past.length ? <ul className="space-y-2 text-sm">{past.map((x) => <li key={x.id}><Link href={`/workouts/history/${x.id}`} className="flex justify-between hover:text-accent"><span>{new Date(x.startedAt).toLocaleDateString()}</span><span className="tabular text-muted">{fmtDuration(x.durationSec)}</span></Link></li>)}</ul> : <p className="text-sm text-muted">No sessions recorded for this plan yet.</p>}</Card>
          <Notice>Warm up for 5 minutes first. Choose loads that let you finish each set with good form.</Notice>
        </aside>
      </div>
    </div>
  );
}
