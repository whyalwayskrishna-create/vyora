"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Plus, Ruler, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, EmptyState, Field, Modal, Notice, PageHeader, SectionTitle, useUI } from "@/components/ui";
import { LinesChart } from "@/components/charts/Charts";
import { cmToIn, fmtLength, fmtWeight, inToCm, kgToLb, lbToKg, todayKey, keyToDate } from "@/lib/utils";

export default function Measurements() {
  const params = useSearchParams();
  const s = useStore();
  const { toast, confirm } = useUI();
  const imp = s.profile.units === "imperial";
  const [open, setOpen] = useState(params.get("add") === "1");
  const [f, setF] = useState({ date: todayKey(), weight: "", waist: "", hip: "", note: "" });
  const [err, setErr] = useState<string | null>(null);
  const save = () => {
    const w = f.weight ? Number(f.weight) : undefined, wa = f.waist ? Number(f.waist) : undefined, h = f.hip ? Number(f.hip) : undefined;
    if (w === undefined && wa === undefined && h === undefined) return setErr("Enter at least one measurement.");
    const wKg = w !== undefined ? (imp ? lbToKg(w) : w) : undefined; const waCm = wa !== undefined ? (imp ? inToCm(wa) : wa) : undefined; const hCm = h !== undefined ? (imp ? inToCm(h) : h) : undefined;
    if ((wKg !== undefined && (wKg < 20 || wKg > 400)) || (waCm !== undefined && (waCm < 30 || waCm > 250)) || (hCm !== undefined && (hCm < 30 || hCm > 250))) return setErr("One of the values looks out of range — please check.");
    if (f.date > todayKey()) return setErr("Date can't be in the future.");
    s.addMeasurement({ date: f.date, weightKg: wKg, waistCm: waCm, hipCm: hCm, note: f.note.slice(0, 200) || undefined });
    toast("Measurement saved"); setOpen(false); setErr(null); setF({ date: todayKey(), weight: "", waist: "", hip: "", note: "" });
  };
  const data = s.measurements.map((m) => ({ x: keyToDate(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), weight: m.weightKg ? Math.round((imp ? kgToLb(m.weightKg) : m.weightKg) * 10) / 10 : null, waist: m.waistCm ? Math.round((imp ? cmToIn(m.waistCm) : m.waistCm) * 10) / 10 : null, hip: m.hipCm ? Math.round((imp ? cmToIn(m.hipCm) : m.hipCm) * 10) / 10 : null }));
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Progress" title="Body measurements" subtitle="Completely optional. Stored privately on this device and your sync record." actions={<Button onClick={() => setOpen(true)}><Plus size={16} />Add entry</Button>} />
      <Notice className="mb-5"><span className="inline-flex items-center gap-1"><Lock size={12} />Private.</span> VYORA never scores your appearance. Measurements are just one of many ways to notice change — strength, energy and consistency matter too.</Notice>
      {!s.measurements.length ? <EmptyState icon={<Ruler size={20} />} title="No measurements recorded" body="Add one whenever you like — or never. It's entirely up to you." action={<Button size="sm" onClick={() => setOpen(true)}>Add first entry</Button>} /> : (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Card><SectionTitle>Body weight ({imp ? "lb" : "kg"})</SectionTitle><LinesChart data={data} x="x" lines={[{ key: "weight", color: "var(--accent)", name: "Weight" }]} height={200} /></Card>
            <Card><SectionTitle>Circumferences ({imp ? "in" : "cm"})</SectionTitle><LinesChart data={data} x="x" lines={[{ key: "waist", color: "var(--success)", name: "Waist" }, { key: "hip", color: "var(--warn)", name: "Hip" }]} height={200} /></Card>
          </div>
          <Card className="p-0"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left text-xs text-muted"><th className="px-4 py-2.5">Date</th><th>Weight</th><th>Waist</th><th>Hip</th><th className="sr-only">Actions</th></tr></thead>
            <tbody>{[...s.measurements].reverse().map((m) => <tr key={m.id} className="tabular border-b border-line last:border-0"><td className="px-4 py-2.5">{m.date}</td><td>{fmtWeight(m.weightKg, s.profile.units)}</td><td>{fmtLength(m.waistCm, s.profile.units)}</td><td>{fmtLength(m.hipCm, s.profile.units)}</td><td className="pr-3 text-right"><button onClick={async () => { if (await confirm({ title: "Delete entry?", body: m.date, danger: true, confirmLabel: "Delete" })) s.deleteMeasurement(m.id); }} className="p-1.5 text-muted hover:text-danger" aria-label="Delete measurement"><Trash2 size={14} /></button></td></tr>)}</tbody></table></Card>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add measurement" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className="input" value={f.date} max={todayKey()} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label={`Weight (${imp ? "lb" : "kg"})`}><input type="number" step="0.1" className="input" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} /></Field>
          <Field label={`Waist (${imp ? "in" : "cm"})`}><input type="number" step="0.1" className="input" value={f.waist} onChange={(e) => setF({ ...f, waist: e.target.value })} /></Field>
          <Field label={`Hip (${imp ? "in" : "cm"})`}><input type="number" step="0.1" className="input" value={f.hip} onChange={(e) => setF({ ...f, hip: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Note (optional)"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
        </div>
        {err && <p className="mt-2 text-xs text-danger">{err}</p>}
        <p className="mt-2 text-[11px] text-muted">All fields optional except at least one value. Stored in metric and converted for display.</p>
      </Modal>
    </div>
  );
}
