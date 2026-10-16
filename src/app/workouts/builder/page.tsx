"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, GripVertical, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useStore, getPlan } from "@/lib/store";
import { EXERCISES, EX_BY_ID, MUSCLE_GROUPS } from "@/data/exercises";
import type { Difficulty, WorkoutExercise, WorkoutPlan } from "@/types";
import { Button, Card, Chip, EmptyState, Field, Modal, PageHeader, useUI } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseAnimation";
import { cn, uid, WEEKDAYS } from "@/lib/utils";

export default function Builder() {
  const params = useSearchParams();
  const editId = params.get("id");
  const s = useStore();
  const router = useRouter();
  const { toast } = useUI();
  const existing = editId ? getPlan(s, editId) : undefined;
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(s.profile.experience);
  const [location, setLocation] = useState<WorkoutPlan["location"]>("Any");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [q, setQ] = useState(""); const [m, setM] = useState("All");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (existing) { setName(existing.isTemplate ? `${existing.name} (custom)` : existing.name); setFocus(existing.focus); setDifficulty(existing.difficulty); setLocation(existing.location); setDescription(existing.description ?? ""); setDays(existing.scheduledDays ?? []); setItems(existing.exercises.map((e) => ({ ...e }))); }
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickList = useMemo(() => EXERCISES.filter((e) => (m === "All" || e.muscle === m) && (!q || e.name.toLowerCase().includes(q.toLowerCase()))), [q, m]);

  const upd = (i: number, p: Partial<WorkoutExercise>) => setItems((arr) => arr.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => setItems((arr) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const add = (id: string) => { const ex = EX_BY_ID[id]; setItems((a) => [...a, { uid: uid(), exerciseId: id, sets: 3, reps: 10, restSec: 75, durationSec: ex.anim === "plank" ? 30 : ex.category === "Cardio" ? 900 : undefined }]); toast(`${ex.name} added`); };
  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give your workout a name.";
    if (name.length > 60) e.name = "Keep the name under 60 characters.";
    if (!items.length) e.items = "Add at least one exercise.";
    items.forEach((it) => { if (it.sets < 1 || it.sets > 10 || it.reps < 1 || it.reps > 100 || it.restSec < 0 || it.restSec > 600) e.items = "Check sets (1–10), reps (1–100) and rest (0–600 s)."; });
    setErrors(e); if (Object.keys(e).length) return toast("Please fix the highlighted fields", "error");
    const id = existing && !existing.isTemplate ? existing.id : uid();
    s.savePlan({ id, name: name.trim(), focus: focus.trim() || "Custom", difficulty, location, description, scheduledDays: days, exercises: items, source: existing?.source === "rules-generator" ? "rules-generator" : "custom", createdAt: existing?.createdAt ?? new Date().toISOString() });
    toast(existing && !existing.isTemplate ? "Workout updated" : "Workout saved");
    router.push(`/workouts/${id}`);
  };
  const num = (v: string, d: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d; };

  return (
    <div>
      <PageHeader eyebrow="Builder" title={existing && !existing.isTemplate ? "Edit workout" : "Create workout"} actions={<><Button variant="secondary" onClick={() => router.back()}>Cancel</Button><Button onClick={save}><Save size={16} />Save workout</Button></>} />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Field label="Workout name" error={errors.name}><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuesday Strength" maxLength={60} /></Field>
          <Field label="Focus"><input className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Upper body" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Difficulty"><select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Field>
            <Field label="Location"><select className="input" value={location} onChange={(e) => setLocation(e.target.value as WorkoutPlan["location"])}><option>Any</option><option>Home</option><option>Gym</option></select></Field>
          </div>
          <Field label="Notes"><textarea className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" /></Field>
          <div><span className="label">Schedule (repeats weekly)</span><div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((d) => <Chip key={d} active={days.includes(d)} onClick={() => setDays((x) => x.includes(d) ? x.filter((y) => y !== d) : [...x, d])}>{d}</Chip>)}</div></div>
        </Card>
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Exercises <span className="text-sm font-medium text-muted">({items.length})</span></h2><Button size="sm" onClick={() => setPickOpen(true)}><Plus size={14} />Add exercise</Button></div>
          {errors.items && <p className="mb-2 text-xs text-danger">{errors.items}</p>}
          {!items.length ? <EmptyState icon={<Plus size={20} />} title="No exercises yet" body="Add exercises from the library, then set sets, reps and rest." action={<Button size="sm" onClick={() => setPickOpen(true)}>Browse library</Button>} /> : (
            <ol className="space-y-2">
              {items.map((it, i) => { const ex = EX_BY_ID[it.exerciseId]; return (
                <li key={it.uid} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { setItems((arr) => { const n = [...arr]; const [x] = n.splice(dragIdx, 1); n.splice(i, 0, x); return n; }); setDragIdx(i); } }} onDragEnd={() => setDragIdx(null)}
                  className={cn("card p-3 transition", dragIdx === i && "border-accent opacity-70")}>
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="hidden shrink-0 cursor-grab text-muted sm:block" aria-hidden />
                    <ExerciseThumb ex={ex} className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{i + 1}. {ex.name}</p><p className="text-[11px] text-muted">{ex.muscle}</p></div>
                    <div className="flex">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="press rounded-lg p-1.5 text-muted hover:text-fg disabled:opacity-30" aria-label={`Move ${ex.name} up`}><ArrowUp size={15} /></button>
                      <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="press rounded-lg p-1.5 text-muted hover:text-fg disabled:opacity-30" aria-label={`Move ${ex.name} down`}><ArrowDown size={15} /></button>
                      <button onClick={() => setItems((a) => a.filter((_, j) => j !== i))} className="press rounded-lg p-1.5 text-muted hover:text-danger" aria-label={`Remove ${ex.name}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Field label="Sets"><input className="input tabular !py-1.5" type="number" min={1} max={10} value={it.sets} onChange={(e) => upd(i, { sets: num(e.target.value, 1) })} /></Field>
                    {it.durationSec !== undefined ? <Field label="Time (s)"><input className="input tabular !py-1.5" type="number" min={5} max={3600} value={it.durationSec} onChange={(e) => upd(i, { durationSec: num(e.target.value, 30) })} /></Field>
                      : <Field label="Reps"><input className="input tabular !py-1.5" type="number" min={1} max={100} value={it.reps} onChange={(e) => upd(i, { reps: num(e.target.value, 1) })} /></Field>}
                    <Field label="Rest (s)"><input className="input tabular !py-1.5" type="number" min={0} max={600} step={15} value={it.restSec} onChange={(e) => upd(i, { restSec: num(e.target.value, 60) })} /></Field>
                    <Field label="Type"><select className="input !py-1.5" value={it.durationSec !== undefined ? "time" : "reps"} onChange={(e) => upd(i, { durationSec: e.target.value === "time" ? 30 : undefined })}><option value="reps">Reps</option><option value="time">Timed</option></select></Field>
                  </div>
                  <input className="input mt-2 !py-1.5 text-xs" placeholder="Notes (optional)" value={it.notes ?? ""} onChange={(e) => upd(i, { notes: e.target.value })} aria-label={`Notes for ${ex.name}`} />
                </li>); })}
            </ol>
          )}
          <p className="mt-3 text-[11px] text-muted">Tip: drag to reorder on desktop, or use the arrow buttons.</p>
        </div>
      </div>
      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title="Add exercises" wide footer={<Button onClick={() => setPickOpen(false)}>Done</Button>}>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" aria-label="Search exercises" />{q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Clear"><X size={15} /></button>}</div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">{["All", ...MUSCLE_GROUPS].map((x) => <Chip key={x} active={m === x} onClick={() => setM(x)}>{x}</Chip>)}</div>
        <ul className="mt-3 grid max-h-[50vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {pickList.map((e) => { const count = items.filter((x) => x.exerciseId === e.id).length; return (
            <li key={e.id}><button onClick={() => add(e.id)} className="press flex w-full items-center gap-3 rounded-xl border border-line p-2 text-left hover:border-accent/50">
              <ExerciseThumb ex={e} className="h-11 w-11 shrink-0 rounded-lg" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{e.name}</span><span className="text-[11px] text-muted">{e.muscle} · {e.equipment[0]}</span></span>
              {count > 0 ? <span className="rounded-full bg-accent px-2 text-[10px] font-bold text-accent-ink">{count}</span> : <Plus size={15} className="text-accent" />}</button></li>); })}
        </ul>
      </Modal>
    </div>
  );
}
