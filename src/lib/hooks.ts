"use client";
import { useMemo } from "react";
import { useStore, getFoodMap } from "./store";
import { totalsFor } from "./nutrition";
import { lastNDays, todayKey } from "./utils";
import type { CoachContext } from "@/services/coach-kb";

export function useFoodMap() {
  const customFoods = useStore((s) => s.customFoods);
  return useMemo(() => getFoodMap({ customFoods }), [customFoods]);
}
export function useDayTotals(date: string) {
  const entries = useStore((s) => s.foodEntries);
  const foods = useFoodMap();
  return useMemo(() => totalsFor(entries.filter((e) => e.date === date), foods), [entries, foods, date]);
}
export function useWater(date: string) {
  const h = useStore((s) => s.hydration);
  return useMemo(() => h.filter((x) => x.date === date).reduce((a, b) => a + b.ml, 0), [h, date]);
}
export function useCoachContext(): CoachContext | null {
  const s = useStore();
  const foods = useFoodMap();
  return useMemo(() => {
    if (!s.settings.shareContextWithCoach) return null;
    const t = todayKey(); const d7 = lastNDays(7); const d30 = lastNDays(30);
    const s30 = s.sessions.filter((x) => d30.includes(x.startedAt.slice(0, 10)));
    const tot = totalsFor(s.foodEntries.filter((e) => e.date === t), foods);
    const lastSleep = [...s.sleep].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      name: s.profile.name, goals: s.profile.goals, experience: s.profile.experience, equipment: s.profile.equipment,
      workoutsLast7: s.sessions.filter((x) => d7.includes(x.startedAt.slice(0, 10))).length, workoutsLast30: s30.length,
      avgDurationMin: s30.length ? Math.round(s30.reduce((a, b) => a + b.durationSec, 0) / s30.length / 60) : 0,
      todayKcal: Math.round(tot.kcal), kcalTarget: s.targets?.kcal ?? null, todayProteinG: Math.round(tot.protein),
      todayWaterMl: s.hydration.filter((h) => h.date === t).reduce((a, b) => a + b.ml, 0), lastSleepH: lastSleep?.hours ?? null,
      recentWorkouts: s.sessions.slice(0, 3).map((x) => x.planName),
    };
  }, [s, foods]);
}
