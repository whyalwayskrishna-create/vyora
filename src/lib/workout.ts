import type { WorkoutPlan, WorkoutSession } from "@/types";
export const estMinutes = (p: WorkoutPlan) => Math.round(p.exercises.reduce((a, e) => a + e.sets * ((e.durationSec ?? e.reps * 3) + e.restSec), 0) / 60) + 5;
export const sessionStats = (s: WorkoutSession) => {
  const sets = s.exercises.flatMap((e) => e.sets.filter((x) => x.done));
  return {
    sets: sets.length, reps: sets.reduce((a, b) => a + (b.durationSec && !b.reps ? 0 : b.reps), 0),
    volume: sets.reduce((a, b) => a + (b.weight ? b.weight * b.reps : 0), 0),
    exercisesDone: s.exercises.filter((e) => e.sets.some((x) => x.done)).length,
  };
};
export function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch {}
}
