"use client";
import { useState } from "react";
import { Bell, Check, ChefHat, Droplets, Dumbbell, Flame, Footprints, ListChecks, Moon, Pencil, Plus, StretchHorizontal, Trash2, Apple, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, EmptyState, Field, Modal, PageHeader, useUI } from "@/components/ui";
import { cn, fmtDay, lastNDays, todayKey } from "@/lib/utils";
import type { Habit } from "@/types";

const ICONS = { Footprints, StretchHorizontal, ChefHat, Moon, Droplets, Dumbbell, Apple, BookOpen } as const;
type IconName = keyof typeof ICONS;
function HabitIcon({ name, size = 18 }: { name: string; size?: number }) { const I = ICONS[name as IconName] ?? ListChecks; return <I size={size} />; }

function streak(entries: Set<string>) { let n = 0; let d = todayKey(); if (!entries.has(d)) d = lastNDays(2)[0]; while (entries.has(d)) { n++; d = lastNDays(2, d)[0]; } return n; }

export default function Habits() {
  const s = useStore();
  const { toast, confirm } = useUI();
  const week = lastNDays(7);
  const [edit, setEdit] = useState<Habit | "new" | null>(null);
  const [form, setForm] = useState({ name: "", icon: "Footprints", reminder: "" });
  const open = (h: Habit | "new") => { setEdit(h); setForm(h === "new" ? { name: "", icon: "Footprints", reminder: "" } : { name: h.name, icon: h.icon, reminder: h.reminder ?? "" }); };
  const save = () => { const n = form.name.trim(); if (!n || n.length > 60) return toast("Name must be 1–60 characters", "error"); if (edit === "new") s.addHabit(n, form.icon, form.reminder || undefined); else if (edit) s.updateHabit(edit.id, { name: n, icon: form.icon, reminder: form.reminder || undefined }); toast(edit === "new" ? "Habit created" : "Habit updated"); setEdit(null); };
  const todayDone = s.habits.filter((h) => s.habitEntries.some((e) => e.habitId === h.id && e.date === todayKey())).length;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Wellness" title="Habits" subtitle={s.habits.length ? `${todayDone} of ${s.habits.length} done today — every small win counts.` : "Build small routines that add up."} actions={<Button onClick={() => open("new")}><Plus size={16} />New habit</Button>} />
      {!s.habits.length ? <EmptyState icon={<ListChecks size={20} />} title="No habits yet" body="Start with something tiny — like a 5-minute walk after lunch." action={<Button size="sm" onClick={() => open("new")}>Create a habit</Button>} /> : (
        <div className="space-y-3 stagger">
          {s.habits.map((h) => {
            const set = new Set(s.habitEntries.filter((e) => e.habitId === h.id).map((e) => e.date));
            const done = set.has(todayKey()); const st = streak(set);
            const last30 = lastNDays(30).filter((d) => set.has(d)).length;
            return (
              <Card key={h.id} className="p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => { s.toggleHabit(h.id, todayKey()); if (!done) toast(`Nice — “${h.name}” done!`); }} aria-pressed={done} aria-label={`${done ? "Uncheck" : "Check"} ${h.name} for today`} className={cn("press grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 transition", done ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-accent/60")}>{done ? <Check size={22} /> : <HabitIcon name={h.icon} />}</button>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold">{h.name}</p><p className="flex flex-wrap items-center gap-x-3 text-xs text-muted"><span className="flex items-center gap-1"><Flame size={12} className={st ? "text-warn" : ""} />{st} day streak</span><span>{last30}/30 days</span>{h.reminder && <span className="flex items-center gap-1"><Bell size={11} />{h.reminder}</span>}</p></div>
                  <button onClick={() => open(h)} className="press rounded-lg p-2 text-muted hover:text-fg" aria-label={`Edit ${h.name}`}><Pencil size={15} /></button>
                  <button onClick={async () => { if (await confirm({ title: "Delete habit?", body: `“${h.name}” and its history will be removed.`, danger: true, confirmLabel: "Delete" })) s.deleteHabit(h.id); }} className="press rounded-lg p-2 text-muted hover:text-danger" aria-label={`Delete ${h.name}`}><Trash2 size={15} /></button>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">{week.map((d) => { const on = set.has(d); return (
                  <button key={d} onClick={() => s.toggleHabit(h.id, d)} aria-pressed={on} aria-label={`${h.name} on ${d}`} className={cn("press rounded-xl border py-1.5 text-center text-[10px] font-semibold", on ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted", d === todayKey() && "ring-1 ring-accent/40")}>{fmtDay(d)}<span className="block text-xs">{on ? "✓" : "·"}</span></button>); })}</div>
              </Card>
            );
          })}
          <p className="pt-2 text-center text-xs text-muted">Missed a day? That&apos;s normal. Streaks are just one signal — your 30-day total matters more.</p>
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "New habit" : "Edit habit"} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Habit"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Take a movement break" maxLength={60} /></Field>
          <div className="flex flex-wrap gap-1.5">{["Take a movement break", "Complete a planned workout", "Prepare meals", "Practice mobility", "Consistent sleep schedule"].map((x) => <button key={x} onClick={() => setForm({ ...form, name: x })} className="rounded-full bg-elevated-2 px-2.5 py-1 text-[11px] hover:text-accent">{x}</button>)}</div>
          <div><span className="label">Icon</span><div className="flex flex-wrap gap-2">{(Object.keys(ICONS) as IconName[]).map((k) => <button key={k} onClick={() => setForm({ ...form, icon: k })} aria-pressed={form.icon === k} aria-label={k} className={cn("press grid h-10 w-10 place-items-center rounded-xl border", form.icon === k ? "border-accent bg-accent-soft text-accent" : "border-line text-muted")}><HabitIcon name={k} /></button>)}</div></div>
          <Field label="Reminder time (optional)" hint="Shown in-app; background push notifications aren't enabled."><input type="time" className="input" value={form.reminder} onChange={(e) => setForm({ ...form, reminder: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
