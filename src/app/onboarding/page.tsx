"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Database, Lock, Pencil } from "lucide-react";
import { DEFAULT_PROFILE, useStore, todaysPlan } from "@/lib/store";
import type { Difficulty, UserProfile } from "@/types";
import { Button, Chip, Field, Logo, Notice, useUI } from "@/components/ui";
import { cn, WEEKDAYS } from "@/lib/utils";
import { EX_BY_ID } from "@/data/exercises";

const GOALS = ["Build strength", "Improve cardiovascular fitness", "Improve mobility", "Develop consistency", "Improve general fitness", "Support a sport or activity", "Follow a personalized wellness routine"];
const EQUIP = ["No equipment", "Resistance bands", "Dumbbells", "Barbell and plates", "Full gym", "Home workout equipment"];
const ACTIVITIES = ["Strength training", "Running", "Cycling", "Yoga", "Swimming", "Walking", "Team sports", "HIIT", "Dance", "Hiking"];
const DIETS = ["No preference", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free"];
const ALLERGIES = ["dairy", "egg", "gluten", "peanuts", "tree nuts", "soy", "fish", "sesame"];
const STEPS = ["Welcome", "Profile", "Goals", "Experience", "Preferences", "Summary"];

function toggle(list: string[], v: string) { return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]; }

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<UserProfile>({ ...DEFAULT_PROFILE });
  const [withDemo, setWithDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const complete = useStore((s) => s.completeOnboarding);
  const router = useRouter();
  const { toast } = useUI();
  const up = (x: Partial<UserProfile>) => setP((o) => ({ ...o, ...x }));

  const next = () => {
    setError(null);
    if (step === 1 && !p.name.trim()) return setError("Please enter a display name (a nickname is fine).");
    if (step === 1 && p.name.trim().length > 40) return setError("Name must be 40 characters or fewer.");
    if (step === 2 && !p.goals.length) return setError("Choose at least one goal.");
    if (step === 3 && !p.equipment.length) return setError("Choose at least one equipment option.");
    if (step === 4 && !p.days.length) return setError("Pick at least one day — you can change this later.");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const finish = () => { complete({ ...p, name: p.name.trim() }, withDemo); toast(`Welcome to VYORA, ${p.name.trim()}!`); router.replace("/"); };
  const signIn = () => {
    toast("Accounts aren't enabled in this demo. Your data syncs to this device automatically.", "info");
  };

  const preview = todaysPlan({ plans: [], profile: p });

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero.jpg" alt="Athlete sprinting in a dark studio with lime accent lighting" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute bottom-0 p-12">
          <Logo size={36} />
          <h2 className="mt-6 max-w-md text-4xl font-extrabold leading-tight tracking-tight">Move Smarter.<br /><span className="text-accent">Live Stronger.</span></h2>
          <p className="mt-3 max-w-md text-sm text-muted">Workouts, animated exercise guidance, nutrition tracking and an AI coach — in one calm, focused place.</p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden"><Logo /></div>
          {step > 0 && <div className="ml-auto flex items-center gap-1.5" aria-label={`Step ${step} of ${STEPS.length - 1}`}>
            {STEPS.slice(1).map((s, i) => <span key={s} className={cn("h-1.5 rounded-full transition-all", i + 1 <= step ? "w-6 bg-accent" : "w-3 bg-line")} />)}
          </div>}
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8" key={step}>
          <div className="anim-fade-up">
            {step === 0 && (
              <div>
                <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl lg:hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/hero.jpg" alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your fitness ecosystem</p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Welcome to VYORA</h1>
                <p className="mt-3 text-muted">Personalized workouts, a 70+ exercise library with animated demos, reliable calorie & macro tracking, meal planning, and a coach that helps you build habits that last.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button size="lg" onClick={() => setStep(1)} className="w-full">Get Started <ArrowRight size={18} /></Button>
                  <Button size="lg" variant="ghost" onClick={signIn} className="w-full">I already have an account</Button>
                </div>
                <p className="mt-6 flex items-center gap-2 text-xs text-muted"><Lock size={13} /> Sensitive health details are always optional.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div><h1 className="text-2xl font-extrabold">Tell us about you</h1><p className="mt-1 text-sm text-muted">We use this to personalize language, units and defaults.</p></div>
                <Field label="Display name" error={error}><input className="input" value={p.name} onChange={(e) => up({ name: e.target.value })} placeholder="e.g. Alex" maxLength={40} autoFocus /></Field>
                <Field label="Age range" hint="Used for age-appropriate defaults. Under 18? Some features show extra guidance.">
                  <select className="input" value={p.ageRange} onChange={(e) => up({ ageRange: e.target.value })}>{["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"].map((a) => <option key={a}>{a}</option>)}</select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Units"><select className="input" value={p.units} onChange={(e) => up({ units: e.target.value as UserProfile["units"] })}><option value="metric">Metric (kg, cm)</option><option value="imperial">Imperial (lb, in)</option></select></Field>
                  <Field label="Language"><select className="input" value={p.language} onChange={(e) => up({ language: e.target.value })}>{["English", "Español", "Français", "Deutsch", "Português"].map((l) => <option key={l}>{l}</option>)}</select></Field>
                </div>
                <Field label="Country or region"><input className="input" value={p.region} onChange={(e) => up({ region: e.target.value })} /></Field>
                {p.language !== "English" && <Notice>Interface translations are not yet available; content will display in English.</Notice>}
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-2xl font-extrabold">What would you like to work on?</h1><p className="mt-1 text-sm text-muted">Pick as many as you like.</p>
                <div className="mt-5 grid gap-2">
                  {GOALS.map((g) => { const on = p.goals.includes(g); return (
                    <button key={g} onClick={() => up({ goals: toggle(p.goals, g) })} aria-pressed={on} className={cn("press flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold", on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-muted/40")}>
                      {g}<span className={cn("grid h-5 w-5 place-items-center rounded-full border", on ? "border-accent bg-accent text-accent-ink" : "border-line")}>{on && <Check size={13} />}</span></button>); })}
                </div>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-2xl font-extrabold">Your experience</h1>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
                    <button key={d} onClick={() => up({ experience: d })} aria-pressed={p.experience === d} className={cn("press rounded-2xl border p-4 text-left", p.experience === d ? "border-accent bg-accent-soft" : "border-line bg-surface")}>
                      <span className="block text-sm font-bold">{d}</span><span className="mt-1 block text-[11px] text-muted">{d === "Beginner" ? "New or returning" : d === "Intermediate" ? "Train regularly" : "Years of training"}</span></button>
                  ))}
                </div>
                <h2 className="mb-3 mt-7 text-sm font-bold">Available equipment</h2>
                <div className="flex flex-wrap gap-2">{EQUIP.map((e) => <Chip key={e} active={p.equipment.includes(e)} onClick={() => up({ equipment: toggle(p.equipment, e) })}>{e}</Chip>)}</div>
                {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h1 className="text-2xl font-extrabold">Preferences</h1>
                <Field label={`Preferred workout duration: ${p.duration} min`}><input type="range" min={10} max={90} step={5} value={p.duration} onChange={(e) => up({ duration: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>
                <div><span className="label">Available days</span><div className="flex flex-wrap gap-2">{WEEKDAYS.map((d) => <Chip key={d} active={p.days.includes(d)} onClick={() => up({ days: toggle(p.days, d) })}>{d}</Chip>)}</div>{error && <p className="mt-2 text-xs text-danger">{error}</p>}</div>
                <div><span className="label">Environment</span><div className="flex flex-wrap gap-2">{(["Home", "Gym", "Outdoors", "Mixed"] as const).map((d) => <Chip key={d} active={p.environment === d} onClick={() => up({ environment: d })}>{d}</Chip>)}</div></div>
                <div><span className="label">Favorite activities</span><div className="flex flex-wrap gap-2">{ACTIVITIES.map((d) => <Chip key={d} active={p.activities.includes(d)} onClick={() => up({ activities: toggle(p.activities, d) })}>{d}</Chip>)}</div></div>
                <div><span className="label">Dietary preference</span><div className="flex flex-wrap gap-2">{DIETS.map((d) => <Chip key={d} active={p.diet === d} onClick={() => up({ diet: d })}>{d}</Chip>)}</div></div>
                <div><span className="label">Allergies (optional — used only to filter meal suggestions)</span><div className="flex flex-wrap gap-2">{ALLERGIES.map((d) => <Chip key={d} active={p.allergies.includes(d)} onClick={() => up({ allergies: toggle(p.allergies, d) })}>{d}</Chip>)}</div></div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h1 className="text-2xl font-extrabold">Looking good, {p.name}</h1><p className="mt-1 text-sm text-muted">Review your setup. You can change any of this later in Settings.</p>
                <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
                  {[["Profile", `${p.ageRange} · ${p.units} · ${p.region}`, 1], ["Goals", p.goals.join(", "), 2], ["Experience", `${p.experience} · ${p.equipment.join(", ")}`, 3], ["Schedule", `${p.days.join(", ")} · ${p.duration} min · ${p.environment}`, 4], ["Nutrition", `${p.diet}${p.allergies.length ? ` · avoids ${p.allergies.join(", ")}` : ""}`, 4]].map(([k, v, s]) => (
                    <div key={k as string} className="flex items-start gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted">{k}</p><p className="text-sm">{v}</p></div><button onClick={() => setStep(s as number)} className="press rounded-lg p-1.5 text-muted hover:text-accent" aria-label={`Edit ${k}`}><Pencil size={14} /></button></div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">Your suggested first session</p>
                  <p className="mt-1 font-bold">{preview.plan.name}</p>
                  <p className="text-xs text-muted">{preview.plan.exercises.slice(0, 4).map((e) => EX_BY_ID[e.exerciseId]?.name).join(" · ")}</p>
                  <p className="mt-1 text-[11px] text-muted">Rules-based suggestion from your equipment, schedule and environment.</p>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
                  <input type="checkbox" checked={withDemo} onChange={(e) => setWithDemo(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
                  <span><span className="flex items-center gap-1.5 text-sm font-semibold"><Database size={14} />Load sample demo data</span><span className="text-xs text-muted">Pre-fills ~3 weeks of example workouts, meals, sleep and hydration so you can explore charts. Clearly labeled and removable in Settings.</span></span>
                </label>
              </div>
            )}
          </div>
        </div>

        {step > 0 && (
          <div className="mx-auto flex w-full max-w-lg gap-3 pb-2">
            <Button variant="secondary" size="lg" onClick={() => { setError(null); setStep((s) => s - 1); }} aria-label="Back"><ArrowLeft size={18} /></Button>
            {step < 5 ? <Button size="lg" className="flex-1" onClick={next}>Continue <ArrowRight size={18} /></Button> : <Button size="lg" className="flex-1" onClick={finish}>Build my dashboard <Check size={18} /></Button>}
          </div>
        )}
      </div>
    </div>
  );
}
