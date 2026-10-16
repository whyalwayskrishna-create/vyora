"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRightLeft, Bot, RefreshCcw, Save, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EX_BY_ID } from "@/data/exercises";
import { Badge, Button, Card, Chip, EmptyState, Field, Notice, PageHeader, SectionTitle, Skeleton, useUI } from "@/components/ui";
import type { GeneratedPlan, GenPrefs } from "@/services/workout-generator";
import type { Difficulty } from "@/types";
import { uid, WEEKDAYS, fmtDuration } from "@/lib/utils";

const GOALS = ["Build strength", "Improve general fitness", "Improve cardiovascular fitness", "Improve mobility", "Develop consistency"];
const EQUIP = ["No equipment", "Resistance bands", "Dumbbells", "Barbell and plates", "Full gym", "Home workout equipment"];
const TYPES = ["Strength", "Circuits", "Cardio", "Mobility"];

export default function Generator() {
  const s = useStore();
  const router = useRouter();
  const { toast } = useUI();
  const [p, setP] = useState<GenPrefs>({ goal: s.profile.goals.find((g) => GOALS.includes(g)) ?? "Improve general fitness", experience: s.profile.experience, equipment: s.profile.equipment, days: s.profile.days, duration: s.profile.duration, types: ["Strength"], avoid: [], considerations: "" });
  const [avoidText, setAvoidText] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [res, setRes] = useState<{ plan: GeneratedPlan; source: string; model?: string; notice?: string } | null>(null);
  const [err, setErr] = useState("");
  const up = (x: Partial<GenPrefs>) => setP((o) => ({ ...o, ...x }));
  const tog = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const run = async () => {
    if (!p.days.length) { setErr("Choose at least one training day."); setState("error"); return; }
    if (!p.equipment.length) { setErr("Choose at least one equipment option."); setState("error"); return; }
    setState("loading"); setErr("");
    try {
      const r = await fetch("/api/ai/workout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, avoid: avoidText.split(",").map((x) => x.trim()).filter(Boolean) }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Request failed");
      if (!j.plan?.days?.length) throw new Error("No valid plan could be built from your preferences. Try adding equipment or days.");
      setRes(j); setState("done");
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); setState("error"); }
  };
  const saveAll = () => {
    if (!res) return;
    res.plan.days.forEach((d) => s.savePlan({ id: uid(), name: `${d.title} (${d.day})`, focus: d.focus, description: `Warm-up: ${d.warmup.join("; ")}. Cool-down: ${d.cooldown.join("; ")}.`, difficulty: p.experience, location: p.equipment.includes("Full gym") ? "Gym" : "Home", exercises: d.exercises.map((e) => ({ ...e, uid: uid() })), scheduledDays: [d.day], source: res.source === "ai" ? "ai" : "rules-generator", createdAt: new Date().toISOString() }));
    toast(`${res.plan.days.length} workouts saved and scheduled`); router.push("/workouts");
  };

  return (
    <div>
      <PageHeader eyebrow="Planner" title="Workout generator" subtitle="Builds a structured weekly plan from the VYORA exercise library." />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div><span className="label">Goal</span><div className="flex flex-wrap gap-1.5">{GOALS.map((g) => <Chip key={g} active={p.goal === g} onClick={() => up({ goal: g })}>{g}</Chip>)}</div></div>
          <div><span className="label">Experience</span><div className="flex gap-1.5">{(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((g) => <Chip key={g} active={p.experience === g} onClick={() => up({ experience: g })}>{g}</Chip>)}</div></div>
          <div><span className="label">Equipment</span><div className="flex flex-wrap gap-1.5">{EQUIP.map((g) => <Chip key={g} active={p.equipment.includes(g)} onClick={() => up({ equipment: tog(p.equipment, g) })}>{g}</Chip>)}</div></div>
          <div><span className="label">Training days</span><div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((g) => <Chip key={g} active={p.days.includes(g)} onClick={() => up({ days: tog(p.days, g) })}>{g}</Chip>)}</div></div>
          <Field label={`Session length: ${p.duration} min`}><input type="range" min={15} max={90} step={5} value={p.duration} onChange={(e) => up({ duration: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field>
          <div><span className="label">Preferred types</span><div className="flex flex-wrap gap-1.5">{TYPES.map((g) => <Chip key={g} active={p.types.includes(g)} onClick={() => up({ types: tog(p.types, g) })}>{g}</Chip>)}</div></div>
          <Field label="Exercises to avoid" hint="Comma separated, e.g. burpee, barbell squat"><input className="input" value={avoidText} onChange={(e) => setAvoidText(e.target.value)} /></Field>
          <Field label="Movement considerations (optional)"><textarea className="input min-h-16" value={p.considerations} onChange={(e) => up({ considerations: e.target.value.slice(0, 300) })} placeholder="e.g. prefer low-impact options" /></Field>
          <Button className="w-full" size="lg" onClick={run} loading={state === "loading"}><Wand2 size={17} />Generate plan</Button>
        </Card>

        <div>
          {state === "idle" && <EmptyState icon={<Sparkles size={20} />} title="Your plan will appear here" body="Set your preferences and press Generate. If no AI provider is configured on the server, a transparent rules-based planner is used." />}
          {state === "loading" && <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>}
          {state === "error" && <Card className="border-danger/30"><div className="flex gap-3"><AlertTriangle className="shrink-0 text-danger" /><div><p className="font-bold">Couldn&apos;t generate a plan</p><p className="text-sm text-muted">{err}</p><Button size="sm" variant="secondary" className="mt-3" onClick={run}><RefreshCcw size={14} />Retry</Button></div></div></Card>}
          {state === "done" && res && (
            <div className="space-y-4 anim-fade-up">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="mb-2 flex gap-2">{res.source === "ai" ? <Badge tone="accent"><Bot size={11} />AI generated · {res.model}</Badge> : <Badge><Sparkles size={11} />Rules-based planner (no AI model called)</Badge>}</div><h2 className="text-xl font-extrabold">{res.plan.name}</h2><p className="text-sm text-muted">{res.plan.summary}</p></div>
                  <div className="flex gap-2"><Button variant="secondary" onClick={run}><RefreshCcw size={15} />Regenerate</Button><Button onClick={saveAll}><Save size={15} />Save & schedule</Button></div>
                </div>
                {res.notice && <Notice tone="warn" className="mt-3">{res.notice}</Notice>}
              </Card>
              {res.plan.days.map((d) => (
                <Card key={d.day + d.title}>
                  <div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-xs font-extrabold text-accent">{d.day}</span><div><p className="font-bold">{d.title}</p><p className="text-xs text-muted">{d.focus}</p></div></div>
                  <p className="mb-2 text-xs text-muted"><span className="font-semibold text-fg">Warm-up:</span> {d.warmup.join(" · ")}</p>
                  <ol className="divide-y divide-line rounded-xl border border-line">{d.exercises.map((e, i) => { const ex = EX_BY_ID[e.exerciseId]; return <li key={e.uid} className="flex items-center justify-between gap-2 px-3 py-2 text-sm"><Link href={`/exercises/${e.exerciseId}`} className="truncate hover:text-accent">{i + 1}. {ex?.name}</Link><span className="tabular shrink-0 text-xs text-muted">{e.sets} × {e.durationSec ? fmtDuration(e.durationSec) : e.reps} · rest {e.restSec}s</span></li>; })}</ol>
                  <p className="mt-2 text-xs text-muted"><span className="font-semibold text-fg">Cool-down:</span> {d.cooldown.join(" · ")}</p>
                </Card>
              ))}
              <div className="grid gap-4 md:grid-cols-2">
                <Card><SectionTitle><span className="flex items-center gap-2"><TrendingUp size={15} className="text-accent" />Progression</span></SectionTitle><ul className="list-disc space-y-1 pl-4 text-sm text-muted">{res.plan.progression.map((x) => <li key={x}>{x}</li>)}</ul></Card>
                <Card><SectionTitle><span className="flex items-center gap-2"><ArrowRightLeft size={15} className="text-accent" />Substitutions</span></SectionTitle>{res.plan.substitutions.length ? <ul className="space-y-1 text-sm">{res.plan.substitutions.map((x) => <li key={x.from}><span className="font-semibold">{x.from}</span> → {x.to} <span className="text-xs text-muted">({x.reason})</span></li>)}</ul> : <p className="text-sm text-muted">No substitutions needed for your equipment.</p>}</Card>
              </div>
              {res.plan.notes.map((n) => <Notice key={n}>{n}</Notice>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
