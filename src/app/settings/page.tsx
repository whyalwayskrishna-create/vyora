"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Bot, Cloud, Database, Download, Globe, Link2, Moon, Palette, Shield, Sun, Trash2, Watch } from "lucide-react";
import { useStore, dataSnapshot } from "@/lib/store";
import { deviceId, useSync } from "@/components/layout/AppShell";
import { Badge, Button, Card, Field, Notice, PageHeader, SectionTitle, Segmented, useUI } from "@/components/ui";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-accent" : "bg-line")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} /></button>;
}
function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="text-sm font-semibold">{title}</p>{desc && <p className="text-xs text-muted">{desc}</p>}</div>{children}</div>;
}
const REMINDER_LABELS: Record<string, string> = { workouts: "Planned workouts", meals: "Meal logging", hydration: "Hydration", habits: "Habits", reports: "Weekly report (Mondays)" };

export default function SettingsPage() {
  const s = useStore();
  const sync = useSync();
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [ai, setAi] = useState<{ chat: boolean; model: string | null; vision: boolean; video: boolean } | null>(null);
  useEffect(() => { fetch("/api/ai/status").then((r) => r.json()).then(setAi).catch(() => setAi(null)); }, []);
  const exportData = () => { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: "VYORA", data: dataSnapshot() }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `vyora-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href); toast("Export downloaded"); };
  const deleteAll = async () => {
    if (!(await confirm({ title: "Delete all data?", body: "This permanently removes your profile, logs and settings from this device and the sync database. This cannot be undone.", danger: true, confirmLabel: "Delete everything" }))) return;
    try { await fetch(`/api/state?id=${deviceId()}`, { method: "DELETE" }); } catch {}
    s.resetAll(); localStorage.removeItem("vyora-store"); localStorage.removeItem("vyora-device"); toast("All data deleted"); router.replace("/onboarding");
  };
  const setReminder = (k: string, p: Partial<{ enabled: boolean; time: string }>) => s.updateSettings({ reminders: { ...s.settings.reminders, [k]: { ...s.settings.reminders[k], ...p } } });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Account" title="Settings" subtitle={<>Edit your profile details on the <Link href="/profile" className="text-accent hover:underline">Profile</Link> page.</>} />
      <Card>
        <SectionTitle><span className="flex items-center gap-2"><Palette size={15} className="text-accent" />Appearance & units</span></SectionTitle>
        <div className="divide-y divide-line">
          <Row title="Theme"><Segmented value={s.settings.theme} onChange={(v) => s.updateSettings({ theme: v })} options={[{ value: "dark", label: <span className="flex items-center gap-1"><Moon size={12} />Dark</span> }, { value: "light", label: <span className="flex items-center gap-1"><Sun size={12} />Light</span> }]} /></Row>
          <Row title="Measurement units" desc="Data is stored in metric and converted precisely for display (1 lb = 0.45359237 kg, 1 in = 2.54 cm)."><Segmented value={s.profile.units} onChange={(v) => { s.updateProfile({ units: v }); toast(`Units set to ${v}`); }} options={[{ value: "metric", label: "Metric" }, { value: "imperial", label: "Imperial" }]} /></Row>
          <Row title="Language" desc="Translations coming later; interface shows English."><select className="input !w-auto" value={s.profile.language} onChange={(e) => s.updateProfile({ language: e.target.value })} aria-label="Language">{["English", "Español", "Français", "Deutsch", "Português"].map((l) => <option key={l}>{l}</option>)}</select></Row>
          <Row title="Dietary preference" desc="Used by the meal planner."><select className="input !w-auto" value={s.profile.diet} onChange={(e) => s.updateProfile({ diet: e.target.value })} aria-label="Diet">{["No preference", "Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free"].map((l) => <option key={l}>{l}</option>)}</select></Row>
          <Row title="Timer sound" desc="Beep when rest/work timers end."><Toggle label="Timer sound" on={s.settings.timerSound} onChange={(v) => s.updateSettings({ timerSound: v })} /></Row>
          <Row title="Timer vibration" desc="Where supported by your device."><Toggle label="Timer vibration" on={s.settings.timerVibrate} onChange={(v) => s.updateSettings({ timerVibrate: v })} /></Row>
        </div>
      </Card>

      <Card id="notifications">
        <SectionTitle><span className="flex items-center gap-2"><Bell size={15} className="text-accent" />Reminders</span></SectionTitle>
        <Notice className="mb-2">Reminders are delivered in-app (notification center) once per day after the chosen time while VYORA is open. Background push notifications aren&apos;t configured.</Notice>
        <div className="divide-y divide-line">{Object.entries(s.settings.reminders).map(([k, r]) => (
          <Row key={k} title={REMINDER_LABELS[k] ?? k}><div className="flex items-center gap-3"><input type="time" className="input !w-auto !py-1.5" value={r.time} disabled={!r.enabled} onChange={(e) => setReminder(k, { time: e.target.value })} aria-label={`${k} time`} /><Toggle label={`${k} reminders`} on={r.enabled} onChange={(v) => setReminder(k, { enabled: v })} /></div></Row>))}</div>
      </Card>

      <Card id="ai">
        <SectionTitle><span className="flex items-center gap-2"><Shield size={15} className="text-accent" />Privacy & AI</span></SectionTitle>
        <div className="divide-y divide-line">
          <Row title="Share my activity summary with Coach" desc="Sends aggregate stats (e.g. workouts this week, today's calories) with your messages. Never raw measurements."><Toggle label="Share data with coach" on={s.settings.shareContextWithCoach} onChange={(v) => s.updateSettings({ shareContextWithCoach: v })} /></Row>
          <Row title="Save chat history" desc="When off, conversations aren't persisted after you leave."><Toggle label="Save chat history" on={s.settings.saveChatHistory} onChange={(v) => s.updateSettings({ saveChatHistory: v })} /></Row>
        </div>
      </Card>

      <Card>
        <SectionTitle><span className="flex items-center gap-2"><Link2 size={15} className="text-accent" />Connected services</span></SectionTitle>
        <ul className="divide-y divide-line text-sm">
          <li className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Bot size={15} />AI chat / generators</span>{ai === null ? <Badge>Checking…</Badge> : ai.chat ? <Badge tone="success">Configured · {ai.model}</Badge> : <Badge tone="warn">Not configured — rules-based fallback</Badge>}</li>
          <li className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Bot size={15} />Food photo recognition</span>{ai?.vision ? <Badge tone="success">Configured</Badge> : <Badge tone="warn">Not configured</Badge>}</li>
          <li className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Bot size={15} />AI demo video generation</span>{ai?.video ? <Badge tone="success">Configured</Badge> : <Badge tone="warn">Not configured</Badge>}</li>
          <li className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Globe size={15} />Open Food Facts (barcode & search)</span><Badge tone="success">Public API · no key needed</Badge></li>
          <li className="flex items-center justify-between py-3"><span className="flex items-center gap-2"><Watch size={15} />Wearables & health platforms</span><Badge>Not available in this build</Badge></li>
        </ul>
        <p className="mt-2 text-[11px] text-muted">Server administrators can enable AI by setting <code>OPENAI_API_KEY</code> (optional <code>OPENAI_MODEL</code>, <code>OPENAI_BASE_URL</code>) and video by setting <code>VIDEO_API_KEY</code>. Keys stay on the server.</p>
      </Card>

      <Card id="data">
        <SectionTitle><span className="flex items-center gap-2"><Database size={15} className="text-accent" />Your data</span></SectionTitle>
        <div className="divide-y divide-line">
          <Row title="Sync status" desc="Data is saved locally and synced to the app database for this device (no account required)."><Badge tone={sync.status === "offline" ? "warn" : "success"}><Cloud size={11} />{sync.status === "idle" ? "Up to date" : sync.status === "saving" ? "Saving…" : sync.status === "saved" ? "Synced" : "Offline (local only)"}</Badge></Row>
          <Row title="Demo data" desc={s.hasDemoData ? "Sample history is currently loaded." : "Load ~3 weeks of example activity to explore charts."}>{s.hasDemoData ? <Button size="sm" variant="secondary" onClick={async () => { if (await confirm({ title: "Clear demo data?", body: "Removes sample workouts, meals, hydration, sleep, habits and measurements. Your own workouts are kept; other logs are reset.", confirmLabel: "Clear demo data" })) { s.clearDemo(); toast("Demo data cleared"); } }}>Clear demo data</Button> : <Button size="sm" variant="secondary" onClick={async () => { if (await confirm({ title: "Load demo data?", body: "This replaces current food, hydration, sleep, habit and measurement logs with sample data.", confirmLabel: "Load demo" })) { s.loadDemo(); toast("Demo data loaded"); } }}>Reset demo data</Button>}</Row>
          <Row title="Export data" desc="Download everything as JSON."><Button size="sm" variant="secondary" onClick={exportData}><Download size={14} />Export</Button></Row>
          <Row title="Delete all data" desc="Permanently erase your profile and logs."><Button size="sm" variant="danger" onClick={deleteAll}><Trash2 size={14} />Delete</Button></Row>
        </div>
      </Card>
      <p className="text-center text-xs text-muted"><Link href="/help#terms" className="hover:text-fg">Terms</Link> · <Link href="/help#privacy" className="hover:text-fg">Privacy policy</Link> · <Link href="/help" className="hover:text-fg">Help</Link></p>
    </div>
  );
}
