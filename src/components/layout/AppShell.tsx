"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import {
  Activity, Apple, Bell, BookOpen, Bot, CalendarDays, ChefHat, Droplets, Dumbbell, HelpCircle, History, Home, LayoutGrid, ListChecks,
  Moon, Ruler, Search, Settings, ShoppingCart, Sparkles, Sun, Trophy, User, Utensils, X, Clock,
} from "lucide-react";
import { useStore, getAllPlans, getFoodMap, dataSnapshot } from "@/lib/store";
import { EXERCISES } from "@/data/exercises";
import { RECIPES } from "@/data/foods";
import { cn } from "@/lib/utils";
import { Logo, Modal, Skeleton, UIProvider } from "@/components/ui";
import { useReminderEngine } from "@/lib/reminders";

export const PRIMARY = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/exercises", label: "Exercises", icon: BookOpen },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/progress", label: "Progress", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
];
export const SECONDARY = [
  { href: "/workouts/generator", label: "Workout generator", icon: Sparkles },
  { href: "/workouts/history", label: "Workout history", icon: History },
  { href: "/nutrition/planner", label: "Meal planner", icon: ChefHat },
  { href: "/nutrition/foods", label: "Food database", icon: Apple },
  { href: "/nutrition/grocery", label: "Grocery list", icon: ShoppingCart },
  { href: "/wellness/hydration", label: "Hydration", icon: Droplets },
  { href: "/wellness/sleep", label: "Sleep & recovery", icon: Moon },
  { href: "/wellness/habits", label: "Habits", icon: ListChecks },
  { href: "/progress/measurements", label: "Measurements", icon: Ruler },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help & privacy", icon: HelpCircle },
];

export const useSync = create<{ status: "idle" | "saving" | "saved" | "offline"; at: string | null }>(() => ({ status: "idle", at: null }));
export const deviceId = () => {
  let id = localStorage.getItem("vyora-device");
  if (!id) { id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)); localStorage.setItem("vyora-device", id); }
  return id;
};

function isActive(path: string, href: string) { return href === "/" ? path === "/" : path === href || path.startsWith(href + "/"); }

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const recent = useStore((s) => s.recentSearches);
  const addSearch = useStore((s) => s.addSearch);
  const plans = useStore((s) => s.plans);
  const customFoods = useStore((s) => s.customFoods);
  const set = useStore((s) => s.set);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase(); if (t.length < 2) return null;
    const has = (s: string) => s.toLowerCase().includes(t);
    return {
      Exercises: EXERCISES.filter((e) => has(e.name) || e.tags.some(has)).slice(0, 6).map((e) => ({ href: `/exercises/${e.id}`, label: e.name, sub: e.muscle })),
      Workouts: getAllPlans({ plans }).filter((p) => has(p.name) || has(p.focus)).slice(0, 5).map((p) => ({ href: `/workouts/${p.id}`, label: p.name, sub: p.isTemplate ? "Template" : "Saved plan" })),
      Foods: Object.values(getFoodMap({ customFoods })).filter((f) => has(f.name)).slice(0, 5).map((f) => ({ href: `/nutrition/foods?food=${f.id}`, label: f.name, sub: `${f.per100.kcal} kcal / 100${f.basis === "100ml" ? "ml" : "g"}` })),
      Recipes: RECIPES.filter((r) => has(r.name) || r.tags.some(has)).slice(0, 4).map((r) => ({ href: `/nutrition/recipes/${r.id}`, label: r.name, sub: r.meal })),
    };
  }, [q, plans, customFoods]);
  const go = (href: string) => { addSearch(q); onClose(); setQ(""); router.push(href); };
  const total = results ? Object.values(results).reduce((a, b) => a + b.length, 0) : 0;
  return (
    <Modal open={open} onClose={onClose} title="Search VYORA" wide>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-9 pr-9" placeholder="Exercises, workouts, foods, recipes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search query"
          onKeyDown={(e) => { if (e.key === "Enter" && results) { const first = Object.values(results).flat()[0]; if (first) go(first.href); } }} />
        {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg" aria-label="Clear search"><X size={16} /></button>}
      </div>
      {!results ? (
        <div className="mt-5">
          {recent.length > 0 && <>
            <div className="mb-2 flex items-center justify-between"><p className="label mb-0">Recent searches</p><button className="text-xs text-muted hover:text-fg" onClick={() => set({ recentSearches: [] })}>Clear</button></div>
            <div className="mb-4 flex flex-wrap gap-2">{recent.map((r) => <button key={r} onClick={() => setQ(r)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs hover:border-accent/50"><Clock size={12} />{r}</button>)}</div>
          </>}
          <p className="label">Suggestions</p>
          <div className="flex flex-wrap gap-2">{["squat", "chest", "dumbbell", "oats", "chicken", "vegan", "mobility", "core"].map((s) => <button key={s} onClick={() => setQ(s)} className="rounded-full bg-elevated-2 px-3 py-1 text-xs hover:text-accent">{s}</button>)}</div>
        </div>
      ) : total === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No results for “{q}”. Try a muscle group, food name or equipment.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {Object.entries(results).filter(([, v]) => v.length).map(([k, v]) => (
            <div key={k}><p className="label">{k}</p>
              <ul className="space-y-1">{v.map((r) => <li key={r.href}><button onClick={() => go(r.href)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-elevated-2"><span className="font-medium">{r.label}</span><span className="text-xs text-muted">{r.sub}</span></button></li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const onboarded = useStore((s) => s.onboarded);
  const theme = useStore((s) => s.settings.theme);
  const name = useStore((s) => s.profile.name);
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const active = useStore((s) => s.active);
  const updateSettings = useStore((s) => s.updateSettings);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useReminderEngine();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useStore.persist.rehydrate();
      const id = deviceId();
      if (!useStore.getState().onboarded) {
        try { const r = await fetch(`/api/state?id=${id}`); if (r.ok) { const j = await r.json(); if (j.data?.onboarded) { useStore.setState(j.data); } } } catch {}
      }
      if (!cancelled) setReady(true);
    })();
    const unsub = useStore.subscribe(() => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(async () => {
        useSync.setState({ status: "saving" });
        try { const r = await fetch(`/api/state?id=${deviceId()}`, { method: "PUT", body: JSON.stringify(dataSnapshot()) }); useSync.setState({ status: r.ok ? "saved" : "offline", at: new Date().toISOString() }); }
        catch { useSync.setState({ status: "offline" }); }
      }, 1500);
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  useEffect(() => { document.documentElement.classList.toggle("light", theme === "light"); }, [theme]);
  useEffect(() => { if (ready && !onboarded && path !== "/onboarding") router.replace("/onboarding"); }, [ready, onboarded, path, router]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  useEffect(() => setMoreOpen(false), [path]);

  if (!ready) return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true"><div className="flex flex-col items-center gap-4"><Logo size={40} /><Skeleton className="h-2 w-40" /></div></div>
  );
  if (path === "/onboarding" || !onboarded) return <>{children}</>;
  const immersive = path === "/workouts/session";

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">Skip to content</a>
      {!immersive && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex" aria-label="Main navigation">
          <div className="px-5 pb-4 pt-6"><Link href="/" aria-label="VYORA home"><Logo /></Link><p className="mt-1.5 pl-[42px] text-[10px] font-medium text-muted">Move Smarter. Live Stronger.</p></div>
          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <ul className="space-y-0.5">
              {PRIMARY.map((n) => { const A = isActive(path, n.href); return (
                <li key={n.href}><Link href={n.href} aria-current={A ? "page" : undefined} className={cn("press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold", A ? "bg-accent-soft text-accent" : "text-muted hover:bg-elevated-2 hover:text-fg")}>
                  <n.icon size={18} />{n.label}{n.href === "/coach" && <span className="ml-auto rounded-md bg-accent/15 px-1.5 text-[9px] font-bold text-accent">AI</span>}</Link></li>); })}
            </ul>
            <p className="mb-1.5 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted/70">More</p>
            <ul className="space-y-0.5">
              {SECONDARY.map((n) => { const A = isActive(path, n.href); return (
                <li key={n.href}><Link href={n.href} aria-current={A ? "page" : undefined} className={cn("press flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px]", A ? "text-accent" : "text-muted hover:text-fg")}><n.icon size={15} />{n.label}</Link></li>); })}
            </ul>
          </nav>
          {active && <Link href="/workouts/session" className="m-3 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-3 text-sm"><span className="h-2.5 w-2.5 rounded-full bg-accent anim-pulse" /><span className="min-w-0"><span className="block text-xs text-muted">Workout in progress</span><span className="block truncate font-semibold">{active.session.planName}</span></span></Link>}
        </aside>
      )}
      <div className={cn(!immersive && "lg:pl-[248px]")}>
        {!immersive && (
          <header className="glass sticky top-0 z-30 border-b border-line">
            <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
              <Link href="/" className="lg:hidden" aria-label="VYORA home"><Logo size={26} /></Link>
              <button onClick={() => setSearchOpen(true)} className="press ml-auto flex h-9 items-center gap-2 rounded-xl border border-line bg-elevated px-3 text-sm text-muted hover:text-fg lg:ml-0 lg:w-80" aria-label="Open search">
                <Search size={15} /><span className="hidden sm:inline">Search</span><kbd className="ml-auto hidden rounded border border-line px-1.5 text-[10px] lg:inline">⌘K</kbd>
              </button>
              <div className="flex items-center gap-1 lg:ml-auto">
                <button onClick={() => updateSettings({ theme: theme === "dark" ? "light" : "dark" })} className="press grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-elevated-2 hover:text-fg" aria-label="Toggle theme">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
                <Link href="/notifications" className="press relative grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-elevated-2 hover:text-fg" aria-label={`Notifications, ${unread} unread`}>
                  <Bell size={17} />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-ink">{unread}</span>}
                </Link>
                <Link href="/profile" className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-success text-sm font-extrabold text-accent-ink" aria-label="Profile">{(name || "V").slice(0, 1).toUpperCase()}</Link>
              </div>
            </div>
          </header>
        )}
        <main id="main" className={cn("mx-auto max-w-[1400px]", immersive ? "" : "px-4 pb-28 pt-6 sm:px-6 lg:pb-12")} key={path}>
          <div className="anim-fade-in">{children}</div>
        </main>
      </div>
      {!immersive && (
        <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Primary">
          <ul className="grid grid-cols-5">
            {[PRIMARY[0], PRIMARY[1], PRIMARY[3], PRIMARY[4]].map((n) => { const A = isActive(path, n.href); return (
              <li key={n.href}><Link href={n.href} aria-current={A ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold", A ? "text-accent" : "text-muted")}><n.icon size={20} />{n.label}</Link></li>); })}
            <li><button onClick={() => setMoreOpen(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-muted" aria-label="More destinations"><LayoutGrid size={20} />More</button></li>
          </ul>
        </nav>
      )}
      {active && !immersive && <Link href="/workouts/session" className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-ink shadow-xl lg:hidden"><span className="h-2 w-2 rounded-full bg-accent-ink anim-pulse" />Resume workout</Link>}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="All destinations">
        <div className="grid grid-cols-3 gap-2">
          {[...PRIMARY.filter((p) => !["/", "/workouts", "/nutrition", "/coach"].includes(p.href)), ...SECONDARY].map((n) => (
            <Link key={n.href} href={n.href} className="press flex flex-col items-center gap-2 rounded-2xl border border-line bg-elevated p-3 text-center text-[11px] font-semibold hover:border-accent/50"><n.icon size={20} className="text-accent" />{n.label}</Link>
          ))}
        </div>
        <Link href="/workouts/generator" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-accent-soft p-3 text-xs font-bold text-accent"><CalendarDays size={14} />Plan my week</Link>
      </Modal>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return <UIProvider><Suspense fallback={null}><Shell>{children}</Shell></Suspense></UIProvider>;
}
