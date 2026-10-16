import type { WorkoutPlan, WorkoutExercise, Difficulty } from "@/types";

let n = 0;
const w = (exerciseId: string, sets: number, reps: number, restSec = 75, durationSec?: number): WorkoutExercise => ({ uid: `t${++n}`, exerciseId, sets, reps, restSec, durationSec });
const t = (id: string, name: string, focus: string, difficulty: Difficulty, location: WorkoutPlan["location"], description: string, exercises: WorkoutExercise[]): WorkoutPlan =>
  ({ id, name, focus, difficulty, location, description, exercises, isTemplate: true, source: "template", createdAt: "2025-01-01T00:00:00.000Z" });

export const TEMPLATES: WorkoutPlan[] = [
  t("tpl-full-body", "Foundation Full Body", "Full body strength", "Beginner", "Any", "A balanced session covering squat, push, pull, hinge and core.",
    [w("goblet-squat", 3, 10), w("push-up", 3, 8), w("one-arm-db-row", 3, 10), w("romanian-deadlift", 3, 10), w("plank", 3, 1, 45, 30)]),
  t("tpl-upper", "Upper Body Builder", "Chest, back, shoulders, arms", "Intermediate", "Gym", "Push/pull balanced upper session.",
    [w("db-bench-press", 4, 8, 90), w("lat-pulldown", 4, 10), w("db-shoulder-press", 3, 10), w("seated-cable-row", 3, 10), w("db-curl", 2, 12, 60), w("triceps-pushdown", 2, 12, 60)]),
  t("tpl-lower", "Lower Body Strength", "Quads, glutes, hamstrings", "Intermediate", "Gym", "Squat and hinge emphasis with single-leg work.",
    [w("barbell-squat", 4, 6, 120), w("romanian-deadlift", 3, 8, 90), w("bulgarian-split-squat", 3, 8), w("leg-curl", 3, 12, 60), w("standing-calf-raise", 3, 12, 45)]),
  t("tpl-push", "Push Day", "Chest, shoulders, triceps", "Intermediate", "Gym", "Part of a push/pull/legs split.",
    [w("bb-bench-press", 4, 6, 120), w("incline-db-press", 3, 10), w("lateral-raise", 3, 12, 60), w("overhead-triceps-ext", 3, 12, 60)]),
  t("tpl-pull", "Pull Day", "Back, rear delts, biceps", "Intermediate", "Gym", "Part of a push/pull/legs split.",
    [w("pull-up", 4, 6, 120), w("seated-cable-row", 3, 10), w("face-pull", 3, 15, 60), w("hammer-curl", 3, 12, 60)]),
  t("tpl-legs", "Legs Day", "Quads, hamstrings, calves", "Intermediate", "Gym", "Part of a push/pull/legs split.",
    [w("leg-press", 4, 10, 90), w("hip-thrust", 3, 10), w("leg-extension", 3, 12, 60), w("seated-calf-raise", 3, 15, 45)]),
  t("tpl-bodyweight", "Beginner Bodyweight", "No-equipment full body", "Beginner", "Home", "Approachable session using only your bodyweight.",
    [w("bodyweight-squat", 3, 12, 60), w("incline-push-up", 3, 8, 60), w("glute-bridge", 3, 12, 60), w("bird-dog", 2, 8, 45), w("dead-bug", 2, 8, 45)]),
  t("tpl-dumbbell", "Dumbbell Only", "Full body with dumbbells", "Intermediate", "Home", "Everything you need with a pair of dumbbells.",
    [w("goblet-squat", 3, 12), w("db-bench-press", 3, 10), w("one-arm-db-row", 3, 10), w("romanian-deadlift", 3, 10), w("db-shoulder-press", 3, 10), w("hammer-curl", 2, 12, 60)]),
  t("tpl-home-hiit", "Home Conditioning", "Conditioning circuit", "Intermediate", "Home", "Short conditioning blocks — scale pace to you.",
    [w("jumping-jack", 3, 1, 30, 40), w("mountain-climber", 3, 1, 30, 30), w("burpee", 3, 8, 45), w("reverse-lunge", 3, 10, 45)]),
  t("tpl-mobility", "Daily Mobility Flow", "Mobility & recovery", "Beginner", "Any", "Gentle mobility for recovery days.",
    [w("cat-cow", 1, 10, 15), w("thoracic-rotation", 2, 8, 15), w("hip-flexor-stretch", 2, 1, 15, 40), w("hamstring-stretch", 2, 1, 15, 40), w("ankle-mobility", 2, 10, 15), w("shoulder-mobility", 2, 10, 15)]),
  t("tpl-cardio", "Steady Cardio", "Cardiovascular fitness", "Beginner", "Any", "Zone-2 style steady session at conversational pace.",
    [w("walking", 1, 1, 0, 1200), w("cycling", 1, 1, 0, 900)]),
  t("tpl-express", "15-Minute Express", "Short session for busy days", "Beginner", "Home", "Quick, efficient, and effective.",
    [w("bodyweight-squat", 2, 15, 30), w("push-up", 2, 10, 30), w("reverse-lunge", 2, 10, 30), w("plank", 2, 1, 30, 30)]),
];
