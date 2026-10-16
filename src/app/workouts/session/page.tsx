"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Timer, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { EX_BY_ID } from "@/data/exercises";
import { Button, Card, EmptyState, Field, LinkButton, Modal, useUI } from "@/components/ui";
import { ExercisePlayer } from "@/components/exercises/ExerciseAnimation";
import { cn, fmtDuration } from "@/lib/utils";
import { beep } from "@/lib/workout";
import type { ActiveSession } from "@/types";

/** Countdown driven by an absolute end timestamp, so it stays accurate across renders/tab throttling. */
function useCountdown(onDone: () => void) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remainingPaused, setRemainingPaused] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [, force] = useState(0);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => { if (Date.now() >= endsAt) { setEndsAt(null); setRemainingPaused(null); doneRef.current(); } else force((x) => x + 1); }, 200);
    return () => clearInterval(t);
  }, [endsAt]);
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : remainingPaused ?? 0;
  return {
    remaining, total, running: !!endsAt, active: !!endsAt || remainingPaused !== null,
    start: (sec: number) => { setTotal(sec); setRemainingPaused(null); setEndsAt(Date.now() + sec * 1000); },
    pause: () => { if (endsAt) { setRemainingPaused(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))); setEndsAt(null); } },
    resume: () => { if (remainingPaused !== null) { setEndsAt(Date.now() + remainingPaused * 1000); setRemainingPaused(null); } },
    reset: () => { setEndsAt(Date.now() + total * 1000); setRemainingPaused(null); },
    adjust: (d: number) => { if (endsAt) setEndsAt(Math.max(Date.now() + 1000, endsAt + d * 1000)); else if (remainingPaused !== null) setRemainingPaused(Math.max(1, remainingPaused + d)); setTotal((t) => Math.max(1, t + d)); },
    stop: () => { setEndsAt(null); setRemainingPaused(null); },
  };
}

export default function Session() {
  const active = useStore((s) => s.active);
  const setActive = useStore((s) => s.setActive);
  const finishSession = useStore((s) => s.finishSession);
  const settings = useStore((s) => s.settings);
  const units = useStore((s) => s.profile.units);
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [finishing, setFinishing] = useState(false);
  const [effort, setEffort] = useState(6);
  const [notes, setNotes] = useState("");
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const alert = useCallback(() => { if (settings.timerSound) beep(); if (settings.timerVibrate && "vibrate" in navigator) navigator.vibrate?.([200, 100, 200]); }, [settings]);
  const rest = useCountdown(() => { alert(); toast("Rest complete — next set!", "info"); });
  const work = useCountdown(() => { alert(); completeSet(); });

  if (!active) return (
    <div className="mx-auto max-w-md px-4 py-20"><EmptyState icon={<Timer size={20} />} title="No active workout" body="Start a workout from your dashboard, a plan, or any exercise page." action={<LinkButton href="/workouts">Browse workouts</LinkButton>} /></div>
  );

  const a = active;
  const update = (p: Partial<ActiveSession>) => setActive({ ...a, ...p });
  const exs = a.session.exercises;
  const cur = exs[a.exIndex];
  const ex = EX_BY_ID[cur.exerciseId];
  const elapsed = a.elapsedBeforePause + (a.paused ? 0 : (Date.now() - a.resumedAt) / 1000);
  const totalSets = exs.reduce((s, e) => s + (e.skipped ? 0 : e.sets.length), 0);
  const doneSets = exs.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0);
  const allDone = exs.every((e) => e.skipped || e.sets.every((x) => x.done));
  const next = exs[a.exIndex + 1] ? EX_BY_ID[exs[a.exIndex + 1].exerciseId] : null;
  const timed = cur.target.durationSec !== undefined;

  function setSession(exIndex: number, mutate: (s: ActiveSession["session"]) => void, nav?: Partial<ActiveSession>) {
    const session = structuredClone(a.session); mutate(session); setActive({ ...a, session, ...nav, exIndex: nav?.exIndex ?? exIndex });
  }
  function completeSet() {
    const st = useStore.getState().active; if (!st) return;
    const session = structuredClone(st.session); const e = session.exercises[st.exIndex];
    const idx = e.sets.findIndex((x) => !x.done); if (idx < 0) return;
    e.sets[idx].done = true;
    const lastSet = idx === e.sets.length - 1;
    let exIndex = st.exIndex;
    if (lastSet) { const n = session.exercises.findIndex((x, j) => j > st.exIndex && !x.skipped && x.sets.some((y) => !y.done)); if (n >= 0) exIndex = n; }
    setActive({ ...st, session, exIndex, setIndex: lastSet ? 0 : idx + 1 });
    const nowAllDone = session.exercises.every((x) => x.skipped || x.sets.every((y) => y.done));
    if (nowAllDone) { setFinishing(true); return; }
    if (e.target.restSec > 0) rest.start(e.target.restSec);
  }
  const togglePause = () => {
    if (a.paused) update({ paused: false, resumedAt: Date.now() });
    else { update({ paused: true, elapsedBeforePause: elapsed }); rest.pause(); work.pause(); }
  };
  const go = (d: number) => { const j = a.exIndex + d; if (j >= 0 && j < exs.length) { rest.stop(); work.stop(); update({ exIndex: j, setIndex: Math.max(0, exs[j].sets.findIndex((x) => !x.done)) }); } };
  const skip = () => { setSession(a.exIndex, (s) => { s.exercises[a.exIndex].skipped = true; }, { exIndex: Math.min(exs.length - 1, a.exIndex + 1) }); rest.stop(); toast(`Skipped ${ex.name}`, "info"); if (a.exIndex === exs.length - 1) setFinishing(true); };
  const exit = async () => {
    if (!doneSets) { if (await confirm({ title: "Exit workout?", body: "No sets recorded yet, so nothing will be saved.", confirmLabel: "Exit", danger: true })) { setActive(null); router.push("/workouts"); } return; }
    setFinishing(true);
  };
  const discard = async () => { if (await confirm({ title: "Discard this workout?", body: "Recorded sets will be lost.", confirmLabel: "Discard", danger: true })) { setActive(null); setFinishing(false); router.push("/workouts"); } };
  const save = () => { const id = finishSession(effort, notes.slice(0, 1000)); if (id) { toast("Workout saved to history"); router.push(`/workouts/history/${id}`); } };

  const editSet = (i: number, p: { reps?: number; weight?: number }) => setSession(a.exIndex, (s) => { Object.assign(s.exercises[a.exIndex].sets[i], p); });
  const nextSetIdx = cur.sets.findIndex((x) => !x.done);

  return (
    <div className="min-h-dvh pb-40 lg:pb-10">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button onClick={exit} className="press grid h-10 w-10 place-items-center rounded-xl border border-line text-muted hover:text-fg" aria-label="Exit workout"><X size={18} /></button>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.session.planName}</p><p className="tabular text-xs text-muted">{fmtDuration(elapsed)} · {doneSets}/{totalSets} sets {a.paused && <span className="font-semibold text-warn">· Paused</span>}</p></div>
          <Button variant="secondary" onClick={togglePause} aria-label={a.paused ? "Resume workout" : "Pause workout"}>{a.paused ? <><Play size={16} />Resume</> : <><Pause size={16} />Pause</>}</Button>
        </div>
        <div className="h-1 bg-elevated-2" role="progressbar" aria-valuenow={doneSets} aria-valuemax={totalSets} aria-label="Workout progress"><div className="bar-anim h-full bg-accent" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>
      </header>

      <div className={cn("mx-auto grid max-w-6xl gap-5 px-4 pt-5 lg:grid-cols-[1.1fr_1fr]", a.paused && "opacity-60")}>
        <div className="space-y-4">
          <ExercisePlayer ex={ex} compact />
          {next && <Card className="flex items-center gap-3 p-3"><span className="text-[11px] font-bold uppercase tracking-wider text-muted">Up next</span><span className="truncate text-sm font-semibold">{next.name}</span><span className="tabular ml-auto text-xs text-muted">{exs[a.exIndex + 1].target.sets} × {exs[a.exIndex + 1].target.durationSec ? `${exs[a.exIndex + 1].target.durationSec}s` : exs[a.exIndex + 1].target.reps}</span></Card>}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Exercise {a.exIndex + 1} of {exs.length}{cur.skipped && " · skipped"}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"><Link href={`/exercises/${ex.id}`} className="hover:text-accent">{ex.name}</Link></h1>
            <p className="text-sm text-muted">Target: {cur.target.sets} sets × {timed ? fmtDuration(cur.target.durationSec!) : `${cur.target.reps} reps`} · rest {cur.target.restSec}s</p>
            {cur.target.notes && <p className="mt-1 text-xs text-muted">Note: {cur.target.notes}</p>}
          </div>

          {(rest.active || work.active) && (
            <Card className={cn("text-center", rest.active ? "border-accent/40" : "border-success/40")} aria-live="polite">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{rest.active ? "Rest" : "Work"}</p>
              <p className="tabular my-1 text-6xl font-extrabold tracking-tight">{fmtDuration((rest.active ? rest : work).remaining)}</p>
              {(() => { const t = rest.active ? rest : work; return (
                <>
                  <div className="mx-auto mb-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-elevated-2"><div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${t.total ? (t.remaining / t.total) * 100 : 0}%` }} /></div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => t.adjust(-15)} aria-label="Subtract 15 seconds"><Minus size={14} />15s</Button>
                    {t.running ? <Button size="sm" variant="secondary" onClick={t.pause}><Pause size={14} />Pause</Button> : <Button size="sm" variant="secondary" onClick={t.resume}><Play size={14} />Resume</Button>}
                    <Button size="sm" variant="secondary" onClick={t.reset}><RotateCcw size={14} />Reset</Button>
                    <Button size="sm" variant="secondary" onClick={() => t.adjust(15)} aria-label="Add 15 seconds"><Plus size={14} />15s</Button>
                    <Button size="sm" variant="ghost" onClick={t.stop}>{rest.active ? "Skip rest" : "Stop"}</Button>
                  </div>
                </>); })()}
            </Card>
          )}

          <Card className="p-3">
            <div className="grid grid-cols-[40px_1fr_1fr_44px] items-center gap-2 px-1 pb-2 text-[11px] font-semibold text-muted"><span>Set</span><span>{timed ? "Seconds" : "Reps"}</span><span>Weight ({units === "metric" ? "kg" : "lb"})</span><span /></div>
            <ul className="space-y-1.5">
              {cur.sets.map((st, i) => (
                <li key={i} className={cn("grid grid-cols-[40px_1fr_1fr_44px] items-center gap-2 rounded-xl px-1 py-1", i === nextSetIdx && "bg-accent-soft", st.done && "opacity-70")}>
                  <span className="tabular text-center text-sm font-bold">{i + 1}</span>
                  {timed ? <span className="tabular px-3 text-sm">{st.durationSec}s</span> : <input aria-label={`Set ${i + 1} reps`} className="input tabular !py-1.5" type="number" min={0} max={200} value={st.reps} onChange={(e) => editSet(i, { reps: Math.max(0, Math.min(200, Math.round(Number(e.target.value) || 0))) })} />}
                  <input aria-label={`Set ${i + 1} weight`} className="input tabular !py-1.5" type="number" min={0} max={1000} step={0.5} placeholder="—" value={st.weight ?? ""} onChange={(e) => editSet(i, { weight: e.target.value === "" ? undefined : Math.max(0, Math.min(1000, Number(e.target.value))) })} />
                  <button onClick={() => setSession(a.exIndex, (s) => { s.exercises[a.exIndex].sets[i].done = !st.done; })} aria-label={st.done ? `Mark set ${i + 1} incomplete` : `Mark set ${i + 1} complete`} className={cn("press grid h-9 w-9 place-items-center rounded-xl border", st.done ? "border-success bg-success/20 text-success" : "border-line text-muted")}><Check size={16} /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => setSession(a.exIndex, (s) => { s.exercises[a.exIndex].sets.push({ reps: cur.target.reps, durationSec: cur.target.durationSec, done: false }); })} className="mt-2 w-full rounded-xl border border-dashed border-line py-2 text-xs font-semibold text-muted hover:text-accent">+ Add set</button>
          </Card>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
            <div className="mx-auto flex max-w-6xl gap-2">
              <Button variant="secondary" size="lg" onClick={() => go(-1)} disabled={a.exIndex === 0} aria-label="Previous exercise"><ChevronLeft size={18} /></Button>
              {allDone ? <Button size="lg" className="flex-1" onClick={() => setFinishing(true)}><Check size={18} />Finish workout</Button>
                : nextSetIdx < 0 ? <Button size="lg" className="flex-1" onClick={() => go(1)}>Next exercise <ChevronRight size={18} /></Button>
                : timed && !work.active ? <Button size="lg" className="flex-1" disabled={a.paused} onClick={() => { rest.stop(); work.start(cur.sets[nextSetIdx].durationSec ?? 30); }}><Timer size={18} />Start {cur.sets[nextSetIdx].durationSec}s timer</Button>
                : <Button size="lg" className="flex-1 anim-pulse" disabled={a.paused} onClick={() => { work.stop(); completeSet(); }}><Check size={18} />Complete set {nextSetIdx + 1}</Button>}
              <Button variant="secondary" size="lg" onClick={skip} aria-label="Skip exercise"><SkipForward size={18} /></Button>
              <Button variant="secondary" size="lg" onClick={() => go(1)} disabled={a.exIndex === exs.length - 1} aria-label="Next exercise"><ChevronRight size={18} /></Button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={finishing} onClose={() => setFinishing(false)} title={allDone ? "Great work! 🎉" : "Finish workout?"}
        footer={<><Button variant="danger" onClick={discard}>Discard</Button><Button variant="secondary" onClick={() => setFinishing(false)}>Keep going</Button><Button onClick={save}>Save workout</Button></>}>
        <p className="text-sm text-muted">{doneSets} of {totalSets} sets recorded in {fmtDuration(elapsed)}.</p>
        <div className="mt-4"><Field label={`Perceived effort: ${effort}/10`} hint="1 = very easy, 10 = maximal effort"><input type="range" min={1} max={10} value={effort} onChange={(e) => setEffort(Number(e.target.value))} className="w-full accent-[var(--accent)]" /></Field></div>
        <div className="mt-3"><Field label="Notes (optional)"><textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="How did it feel?" /></Field></div>
      </Modal>
    </div>
  );
}
