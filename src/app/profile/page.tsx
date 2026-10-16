"use client";
import Link from "next/link";
import { useState } from "react";
import { Bookmark, ChevronRight, Dumbbell, Heart, History, Pencil, Settings, Trophy, Utensils } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeAchievements } from "@/services/achievements";
import type { Difficulty, UserProfile } from "@/types";
import { Badge, Button, Card, Chip, Field, Modal, PageHeader, SectionTitle, Stat, useUI } from "@/components/ui";
import { WEEKDAYS } from "@/lib/utils";

const GOALS = ["Build strength", "Improve cardiovascular fitness", "Improve mobility", "Develop consistency", "Improve general fitness", "Support a sport or activity", "Follow a personalized wellness routine"];
const EQUIP = ["No equipment", "Resistance bands", "Dumbbells", "Barbell and plates", "Full gym", "Home workout equipment"];
const DIETS = ["No preference", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free"];
const ALLERGIES = ["dairy", "egg", "gluten", "peanuts", "tree nuts", "soy", "fish", "sesame"];
const tog = (a: string[], v: string) => a.includes(v) ? a.filter((x) => x !== v) : [...a, v];

export default function Profile() {
  const s = useStore();
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<UserProfile>(s.profile);
  const up = (x: Partial<UserProfile>) => setP((o) => ({ ...o, ...x }));
  const ach = computeAchievements(s).filter((a) => a.unlocked).length;
  const save = () => { if (!p.name.trim()) return toast("Name is required", "error"); if (!p.goals.length || !p.days.length || !p.equipment.length) return toast("Choose at least one goal, day and equipment option", "error"); s.updateProfile({ ...p, name: p.name.trim().slice(0, 40) }); toast("Profile updated"); setOpen(false); };
  const links = [
    { href: "/exercises?view=favorites", label: "Favorite exercises", icon: Heart, count: s.favExercises.length },
    { href: "/workouts", label: "Saved workouts", icon: Dumbbell, count: s.plans.length },
    { href: "/workouts/history", label: "Workout history", icon: History, count: s.sessions.length },
    { href: "/nutrition/planner", label: "Meal plans & recipes", icon: Bookmark, count: s.mealPlans.length + s.savedRecipes.length },
    { href: "/nutrition/foods", label: "Favorite foods", icon: Utensils, count: s.favFoods.length },
    { href: "/achievements", label: "Achievements", icon: Trophy, count: ach },
    { href: "/settings", label: "Settings & privacy", icon: Settings },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader eyebrow="You" title="Profile" />
      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-accent to-success text-3xl font-extrabold text-accent-ink">{(s.profile.name || "V")[0].toUpperCase()}</div>
        <div className="min-w-0 flex-1"><h2 className="text-2xl font-extrabold">{s.profile.name}</h2><p className="text-sm text-muted">{s.profile.experience} · {s.profile.environment} · {s.profile.region}</p><div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">{s.profile.goals.map((g) => <Badge key={g} tone="accent">{g}</Badge>)}</div></div>
        <Button variant="secondary" onClick={() => { setP(s.profile); setOpen(true); }}><Pencil size={15} />Edit profile</Button>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Workouts" value={s.sessions.length} /><Stat label="Training days" value={s.profile.days.length} sub={s.profile.days.join(" ")} /><Stat label="Session length" value={`${s.profile.duration}m`} /><Stat label="Achievements" value={ach} /></div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card><SectionTitle>Fitness preferences</SectionTitle><dl className="space-y-2 text-sm">{[["Equipment", s.profile.equipment.join(", ")], ["Activities", s.profile.activities.join(", ") || "—"], ["Units", s.profile.units === "metric" ? "Metric (kg, cm, ml)" : "Imperial (lb, in, fl oz)"], ["Age range", s.profile.ageRange]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl></Card>
        <Card><SectionTitle>Nutrition preferences</SectionTitle><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted">Diet</dt><dd className="font-medium">{s.profile.diet}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Allergies</dt><dd className="text-right font-medium">{s.profile.allergies.join(", ") || "None listed"}</dd></div><div className="flex justify-between"><dt className="text-muted">Calorie target</dt><dd className="font-medium">{s.targets ? `${s.targets.kcal} kcal` : "Not set"}</dd></div></dl></Card>
      </div>
      <Card className="divide-y divide-line p-0">{links.map((l) => <Link key={l.href} href={l.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-elevated-2"><l.icon size={17} className="text-accent" /><span className="flex-1 text-sm font-semibold">{l.label}</span>{l.count !== undefined && <span className="tabular text-xs text-muted">{l.count}</span>}<ChevronRight size={15} className="text-muted" /></Link>)}</Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit profile" wide footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3"><Field label="Name"><input className="input" value={p.name} onChange={(e) => up({ name: e.target.value })} maxLength={40} /></Field><Field label="Age range"><select className="input" value={p.ageRange} onChange={(e) => up({ ageRange: e.target.value })}>{["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"].map((a) => <option key={a}>{a}</option>)}</select></Field><Field label="Region"><input className="input" value={p.region} onChange={(e) => up({ region: e.target.value })} /></Field></div>
          <div><span className="label">Goals</span><div className="flex flex-wrap gap-1.5">{GOALS.map((g) => <Chip key={g} active={p.goals.includes(g)} onClick={() => up({ goals: tog(p.goals, g) })}>{g}</Chip>)}</div></div>
          <div><span className="label">Experience</span><div className="flex gap-1.5">{(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((g) => <Chip key={g} active={p.experience === g} onClick={() => up({ experience: g })}>{g}</Chip>)}</div></div>
          <div><span className="label">Equipment</span><div className="flex flex-wrap gap-1.5">{EQUIP.map((g) => <Chip key={g} active={p.equipment.includes(g)} onClick={() => up({ equipment: tog(p.equipment, g) })}>{g}</Chip>)}</div></div>
          <div><span className="label">Training days</span><div className="flex flex-wrap gap-1.5">{WEEKDAYS.map((g) => <Chip key={g} active={p.days.includes(g)} onClick={() => up({ days: tog(p.days, g) })}>{g}</Chip>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label={`Duration: ${p.duration} min`}><input type="range" min={10} max={90} step={5} value={p.duration} onChange={(e) => up({ duration: Number(e.target.value) })} className="w-full accent-[var(--accent)]" /></Field><Field label="Environment"><select className="input" value={p.environment} onChange={(e) => up({ environment: e.target.value as UserProfile["environment"] })}>{["Home", "Gym", "Outdoors", "Mixed"].map((x) => <option key={x}>{x}</option>)}</select></Field></div>
          <div><span className="label">Diet</span><div className="flex flex-wrap gap-1.5">{DIETS.map((g) => <Chip key={g} active={p.diet === g} onClick={() => up({ diet: g })}>{g}</Chip>)}</div></div>
          <div><span className="label">Allergies</span><div className="flex flex-wrap gap-1.5">{ALLERGIES.map((g) => <Chip key={g} active={p.allergies.includes(g)} onClick={() => up({ allergies: tog(p.allergies, g) })}>{g}</Chip>)}</div></div>
        </div>
      </Modal>
    </div>
  );
}
