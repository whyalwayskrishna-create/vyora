"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Copy, Dumbbell, Heart, History, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { TEMPLATES } from "@/data/workouts";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Button, Card, Chip, DifficultyBadge, EmptyState, LinkButton, PageHeader, SectionTitle, useUI } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseAnimation";
import type { WorkoutPlan } from "@/types";
import { estMinutes } from "@/lib/workout";



function PlanCard({ p }: { p: WorkoutPlan }) {
  const s = useStore();
  const { toast, confirm } = useUI();
  const fav = s.favPlans.includes(p.id);
  const first = EX_BY_ID[p.exercises[0]?.exerciseId];
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:border-accent/40">
      <Link href={`/workouts/${p.id}`} className="relative block">
        {first ? <ExerciseThumb ex={first} className="aspect-[16/9]" /> : <div className="aspect-[16/9] bg-elevated" />}
        <div className="absolute left-3 top-3 flex gap-1.5"><DifficultyBadge d={p.difficulty} />{p.source === "rules-generator" && <Badge tone="accent">Generated</Badge>}</div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/workouts/${p.id}`} className="font-bold hover:text-accent">{p.name}</Link>
        <p className="text-xs text-muted">{p.focus}</p>
        <div className="mt-3 flex gap-4 text-xs text-muted"><span className="flex items-center gap-1"><Clock size={13} />~{estMinutes(p)} min</span><span className="flex items-center gap-1"><Dumbbell size={13} />{p.exercises.length} exercises</span><span>{p.location}</span></div>
        {p.scheduledDays?.length ? <p className="mt-2 text-[11px] text-accent">Scheduled: {p.scheduledDays.join(", ")}</p> : null}
        <div className="mt-auto flex items-center gap-1 pt-3">
          <button onClick={() => s.toggleFavPlan(p.id)} className="press rounded-lg p-2 text-muted hover:text-accent" aria-label="Favorite workout" aria-pressed={fav}><Heart size={16} className={fav ? "fill-accent text-accent" : ""} /></button>
          <button onClick={() => { s.duplicatePlan(p.id); toast("Duplicated to My workouts"); }} className="press rounded-lg p-2 text-muted hover:text-fg" aria-label="Duplicate"><Copy size={16} /></button>
          {!p.isTemplate && <>
            <Link href={`/workouts/builder?id=${p.id}`} className="press rounded-lg p-2 text-muted hover:text-fg" aria-label="Edit"><Pencil size={16} /></Link>
            <button onClick={async () => { if (await confirm({ title: "Delete workout?", body: `“${p.name}” will be permanently removed. History is kept.`, danger: true, confirmLabel: "Delete" })) { s.deletePlan(p.id); toast("Workout deleted"); } }} className="press rounded-lg p-2 text-muted hover:text-danger" aria-label="Delete"><Trash2 size={16} /></button>
          </>}
          <LinkButton href={`/workouts/${p.id}`} size="sm" variant="secondary" className="ml-auto">Open</LinkButton>
        </div>
      </div>
    </div>
  );
}

export default function Workouts() {
  const s = useStore();
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Home", "Gym", "Beginner", "Intermediate", "Short", "Mobility", "Cardio"];
  const templates = useMemo(() => TEMPLATES.filter((t) => filter === "All" || t.location === filter || t.difficulty === filter || (filter === "Short" && estMinutes(t) <= 25) || (filter === "Mobility" && t.focus.toLowerCase().includes("mobility")) || (filter === "Cardio" && t.focus.toLowerCase().includes("cardio"))), [filter]);
  const favs = [...s.plans, ...TEMPLATES].filter((p) => s.favPlans.includes(p.id));
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Train" title="Workouts" subtitle="Templates, your saved plans, and AI-assisted planning."
        actions={<><LinkButton href="/workouts/history" variant="secondary"><History size={16} />History</LinkButton><LinkButton href="/workouts/generator" variant="outline"><Sparkles size={16} />Generate plan</LinkButton><LinkButton href="/workouts/builder"><Plus size={16} />New workout</LinkButton></>} />
      <section>
        <SectionTitle>My workouts</SectionTitle>
        {s.plans.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">{s.plans.map((p) => <PlanCard key={p.id} p={p} />)}</div>
          : <EmptyState icon={<Dumbbell size={20} />} title="No saved workouts yet" body="Build your own, duplicate a template, or let the generator create a weekly plan." action={<div className="flex gap-2"><LinkButton href="/workouts/builder" size="sm">Build a workout</LinkButton><LinkButton href="/workouts/generator" size="sm" variant="outline">Generate</LinkButton></div>} />}
      </section>
      {favs.length > 0 && <section><SectionTitle>Favorites</SectionTitle><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{favs.map((p) => <PlanCard key={"f" + p.id} p={p} />)}</div></section>}
      <section>
        <SectionTitle>Template library <span className="ml-1 text-xs font-medium text-muted">example plans, not universal prescriptions</span></SectionTitle>
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">{filters.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}</div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">{templates.map((p) => <PlanCard key={p.id} p={p} />)}</div>
      </section>
      <Card className="flex flex-col items-start justify-between gap-3 border-accent/25 bg-gradient-to-r from-accent-soft to-transparent sm:flex-row sm:items-center">
        <div><p className="font-bold">Not sure where to start?</p><p className="text-sm text-muted">Answer a few questions and get a structured weekly plan from the exercise library.</p></div>
        <Button onClick={() => (window.location.href = "/workouts/generator")}><Sparkles size={16} />Open generator</Button>
      </Card>
    </div>
  );
}
