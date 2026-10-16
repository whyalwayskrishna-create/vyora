"use client";
import { useEffect } from "react";
import { useStore } from "./store";
import { todayKey } from "./utils";

const COPY: Record<string, { title: string; body: string; href: string }> = {
  workouts: { title: "Planned workout", body: "Your workout is ready when you are.", href: "/" },
  meals: { title: "Meal logging", body: "Take a moment to log what you've eaten today.", href: "/nutrition" },
  hydration: { title: "Hydration check", body: "A quick glass of water? Log it in one tap.", href: "/wellness/hydration" },
  habits: { title: "Habit check-in", body: "Review today's habits — small wins count.", href: "/wellness/habits" },
  reports: { title: "Weekly report", body: "Your weekly summary is ready to review.", href: "/progress/report" },
};

/** In-app reminder engine: fires each enabled reminder once per day after its time, while the app is open. */
export function useReminderEngine() {
  useEffect(() => {
    const check = () => {
      const s = useStore.getState(); if (!s.onboarded) return;
      const now = new Date(); const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      Object.entries(s.settings.reminders).forEach(([cat, r]) => {
        if (!r.enabled || hm < r.time) return;
        if (cat === "reports" && now.getDay() !== 1) return;
        const key = `vyora-reminded-${todayKey()}-${cat}`; if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
        const c = COPY[cat]; if (c) s.notify({ ...c, category: cat });
      });
    };
    check(); const t = setInterval(check, 60000); return () => clearInterval(t);
  }, []);
}
