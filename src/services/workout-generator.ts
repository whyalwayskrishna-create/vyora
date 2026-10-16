import { EXERCISES, EX_BY_ID } from "@/data/exercises";
import type { Difficulty, Exercise, MuscleGroup, WorkoutExercise } from "@/types";

export interface GenPrefs {
  goal: string; experience: Difficulty; equipment: string[]; days: string[]; duration: number;
  types: string[]; avoid: string[]; considerations: string;
}
export interface GenDay { day: string; title: string; focus: string; warmup: string[]; exercises: WorkoutExercise[]; cooldown: string[] }
export interface GeneratedPlan { name: string; summary: string; days: GenDay[]; progression: string[]; substitutions: { from: string; to: string; reason: string }[]; notes: string[] }

const EQUIP_MAP: Record<string, string[]> = {
  "No equipment": ["None"], "Resistance bands": ["Resistance Band", "None"], Dumbbells: ["Dumbbells", "Bench", "None"],
  "Barbell and plates": ["Barbell", "Bench", "None"], "Full gym": ["None", "Dumbbells", "Barbell", "Cable", "Machine", "Bench", "Pull-up Bar", "Kettlebell", "Cardio Machine", "Resistance Band"],
  "Home workout equipment": ["None", "Kettlebell", "Pull-up Bar", "Resistance Band", "Dumbbells", "Bench"],
};
const LEVEL: Record<Difficulty, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export function allowedEquipment(equipment: string[]) {
  const set = new Set<string>(["None"]);
  equipment.forEach((e) => (EQUIP_MAP[e] ?? []).forEach((x) => set.add(x)));
  return set;
}
function usable(e: Exercise, eq: Set<string>, lvl: Difficulty, avoid: string[]) {
  if (avoid.some((a) => a && (e.id === a || e.name.toLowerCase().includes(a.toLowerCase())))) return false;
  if (LEVEL[e.difficulty] > LEVEL[lvl]) return false;
  return e.equipment.every((x) => eq.has(x)) || e.equipment.includes("None") && e.equipment.length === 1;
}

const SPLITS: Record<number, { title: string; focus: string; muscles: MuscleGroup[] }[]> = {
  1: [{ title: "Full Body", focus: "Full body", muscles: ["Quads", "Chest", "Back", "Hamstrings & Glutes", "Shoulders", "Core"] }],
  2: [{ title: "Full Body A", focus: "Squat & push emphasis", muscles: ["Quads", "Chest", "Back", "Core", "Shoulders"] }, { title: "Full Body B", focus: "Hinge & pull emphasis", muscles: ["Hamstrings & Glutes", "Back", "Shoulders", "Core", "Biceps"] }],
  3: [{ title: "Full Body A", focus: "Strength foundations", muscles: ["Quads", "Chest", "Back", "Core"] }, { title: "Full Body B", focus: "Posterior chain", muscles: ["Hamstrings & Glutes", "Shoulders", "Back", "Core"] }, { title: "Full Body C", focus: "Single-leg & arms", muscles: ["Quads", "Chest", "Biceps", "Triceps", "Calves"] }],
  4: [{ title: "Upper A", focus: "Upper body", muscles: ["Chest", "Back", "Shoulders", "Triceps"] }, { title: "Lower A", focus: "Lower body", muscles: ["Quads", "Hamstrings & Glutes", "Calves", "Core"] }, { title: "Upper B", focus: "Upper body", muscles: ["Back", "Chest", "Shoulders", "Biceps"] }, { title: "Lower B", focus: "Lower body", muscles: ["Hamstrings & Glutes", "Quads", "Core", "Calves"] }],
  5: [{ title: "Push", focus: "Chest, shoulders, triceps", muscles: ["Chest", "Shoulders", "Triceps"] }, { title: "Pull", focus: "Back & biceps", muscles: ["Back", "Biceps", "Shoulders"] }, { title: "Legs", focus: "Lower body", muscles: ["Quads", "Hamstrings & Glutes", "Calves"] }, { title: "Upper", focus: "Upper body", muscles: ["Chest", "Back", "Shoulders"] }, { title: "Lower + Core", focus: "Legs & core", muscles: ["Hamstrings & Glutes", "Quads", "Core"] }],
};

export function generateWorkoutPlanLocal(p: GenPrefs): GeneratedPlan {
  const eq = allowedEquipment(p.equipment);
  const days = p.days.length ? p.days : ["Mon", "Wed", "Fri"];
  const goal = p.goal.toLowerCase();
  const isCardio = goal.includes("cardio");
  const isMobility = goal.includes("mobility");
  const n = Math.min(5, days.length);
  const split = SPLITS[n] ?? SPLITS[3];
  const perEx = p.experience === "Beginner" ? 6.5 : 7.5;
  const count = Math.max(3, Math.min(7, Math.floor((p.duration - 10) / perEx)));
  const rx = goal.includes("strength") ? { sets: p.experience === "Beginner" ? 3 : 4, reps: p.experience === "Beginner" ? 8 : 6, rest: p.experience === "Beginner" ? 90 : 120 } : { sets: 3, reps: 10, rest: 75 };
  const used = new Set<string>();
  const subs: GeneratedPlan["substitutions"] = [];
  const pick = (m: MuscleGroup, seed: number) => {
    const pool = EXERCISES.filter((e) => e.muscle === m && e.category !== "Mobility" && usable(e, eq, p.experience, p.avoid));
    const fresh = pool.filter((e) => !used.has(e.id));
    const list = fresh.length ? fresh : pool;
    if (!list.length) return null;
    const e = list[seed % list.length]; used.add(e.id); return e;
  };
  const planDays: GenDay[] = days.slice(0, n).map((day, i) => {
    const s = split[i % split.length];
    const exs: WorkoutExercise[] = [];
    if (isCardio || isMobility) {
      const cat = isCardio ? "Cardio" : "Mobility";
      const pool = EXERCISES.filter((e) => e.muscle === cat && usable(e, eq, p.experience, p.avoid));
      pool.slice(i % Math.max(1, pool.length)).concat(pool).slice(0, isCardio ? 2 : count).forEach((e, j) =>
        exs.push({ uid: `g${i}-${j}`, exerciseId: e.id, sets: isCardio ? 1 : 2, reps: isCardio ? 1 : 8, restSec: isCardio ? 0 : 20, durationSec: isCardio ? Math.round((p.duration * 60) / 2) : 40 }));
      if (isCardio) { const core = pick("Core", i); if (core) exs.push({ uid: `g${i}-c`, exerciseId: core.id, sets: 2, reps: 10, restSec: 45 }); }
    } else {
      let k = 0;
      while (exs.length < count && k < count * 3) {
        const m = s.muscles[k % s.muscles.length];
        const e = pick(m, i + k);
        if (e && !exs.some((x) => x.exerciseId === e.id)) {
          const timed = e.anim === "plank";
          exs.push({ uid: `g${i}-${k}`, exerciseId: e.id, sets: e.muscle === "Core" ? 2 : rx.sets, reps: e.muscle === "Core" || ["Biceps", "Triceps", "Calves"].includes(e.muscle) ? 12 : rx.reps, restSec: ["Biceps", "Triceps", "Calves", "Core"].includes(e.muscle) ? 60 : rx.rest, durationSec: timed ? 30 : undefined });
        }
        k++;
      }
    }
    return {
      day, title: isCardio ? `Cardio Session ${i + 1}` : isMobility ? `Mobility Flow ${i + 1}` : s.title, focus: isCardio ? "Aerobic base" : isMobility ? "Range of motion" : s.focus,
      warmup: ["3–5 min easy cardio (marching, cycling, brisk walk)", "Cat-cow × 8", "1–2 lighter sets of your first exercise"],
      exercises: exs, cooldown: ["2–3 min easy walking", "Hip flexor stretch 30 sec/side", "Hamstring stretch 30 sec/side"],
    };
  });
  if (!eq.has("Pull-up Bar") && !eq.has("Cable")) subs.push({ from: "Pull-ups / Lat pulldown", to: "One-arm dumbbell row or band rows", reason: "No bar or cable listed" });
  if (!eq.has("Barbell")) subs.push({ from: "Barbell squat", to: "Goblet squat or split squat", reason: "No barbell listed" });
  if (!eq.has("Bench")) subs.push({ from: "Bench press", to: "Floor press or push-ups", reason: "No bench listed" });
  return {
    name: `${p.goal} · ${n}-day plan`,
    summary: `A ${n}-day ${p.experience.toLowerCase()} plan of about ${p.duration} min per session, built from the VYORA exercise library using your equipment.`,
    days: planDays,
    progression: ["When you complete all sets at the top of the rep range with good form, add a small amount of load or 1–2 reps next time.", "Every 4–6 weeks, consider an easier week with fewer sets to recover.", "Track your sets in guided mode so progress is based on real data."],
    substitutions: subs,
    notes: [p.considerations ? `You noted: “${p.considerations}”. Choose easier variations and skip anything that causes discomfort; consider consulting a qualified professional.` : "Adjust any exercise that doesn't feel right for you.", "This is a starting template, not a universal prescription."],
  };
}

export function validatePlan(x: unknown): GeneratedPlan | null {
  if (!x || typeof x !== "object") return null;
  const p = x as GeneratedPlan;
  if (!Array.isArray(p.days) || !p.days.length) return null;
  const days = p.days.map((d, i) => ({
    day: String(d.day ?? `Day ${i + 1}`), title: String(d.title ?? "Workout"), focus: String(d.focus ?? ""),
    warmup: Array.isArray(d.warmup) ? d.warmup.map(String) : [], cooldown: Array.isArray(d.cooldown) ? d.cooldown.map(String) : [],
    exercises: (Array.isArray(d.exercises) ? d.exercises : []).filter((e) => EX_BY_ID[e?.exerciseId]).map((e, j) => ({
      uid: `a${i}-${j}`, exerciseId: e.exerciseId, sets: Math.min(8, Math.max(1, Number(e.sets) || 3)), reps: Math.min(50, Math.max(1, Number(e.reps) || 10)),
      restSec: Math.min(300, Math.max(0, Number(e.restSec) || 60)), durationSec: e.durationSec ? Math.min(3600, Number(e.durationSec)) : undefined,
    })),
  })).filter((d) => d.exercises.length);
  if (!days.length) return null;
  return { name: String(p.name ?? "AI plan"), summary: String(p.summary ?? ""), days, progression: Array.isArray(p.progression) ? p.progression.map(String) : [], substitutions: Array.isArray(p.substitutions) ? p.substitutions : [], notes: Array.isArray(p.notes) ? p.notes.map(String) : [] };
}
