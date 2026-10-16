"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Barcode, Camera, Globe, Heart, ImageUp, Plus, Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useFoodMap } from "@/lib/hooks";
import type { FoodItem } from "@/types";
import { Badge, Button, Card, Chip, EmptyState, Field, Notice, PageHeader, Segmented, Skeleton, useUI } from "@/components/ui";
import { FoodModal } from "@/components/nutrition/FoodModal";
import { uid } from "@/lib/utils";

type Tab = "library" | "custom" | "barcode" | "scan" | "online";

function FoodRow({ f, onOpen }: { f: FoodItem; onOpen: () => void }) {
  const fav = useStore((s) => s.favFoods.includes(f.id));
  return (
    <li><button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-elevated-2">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{f.name} {fav && <Heart size={11} className="inline fill-accent text-accent" />}</p><p className="truncate text-[11px] text-muted">{f.brand ? `${f.brand} · ` : ""}{f.category} · {f.source}</p></div>
      <div className="tabular text-right text-xs"><p className="font-bold">{f.per100.kcal} kcal</p><p className="text-muted">P{f.per100.protein} C{f.per100.carbs} F{f.per100.fat} /100{f.basis === "100ml" ? "ml" : "g"}</p></div>
    </button></li>
  );
}

export default function Foods() {
  const params = useSearchParams();
  const s = useStore();
  const foods = useFoodMap();
  const { toast } = useUI();
  const [tab, setTab] = useState<Tab>(params.get("scan") ? "scan" : "library");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [onlyFav, setOnlyFav] = useState(false);
  const [sel, setSel] = useState<FoodItem | null>(null);
  const [external, setExternal] = useState<FoodItem[]>([]);
  useEffect(() => { const id = params.get("food"); if (id && foods[id]) setSel(foods[id]); }, [params, foods]);
  const cats = useMemo(() => ["All", ...new Set(Object.values(foods).map((f) => f.category))], [foods]);
  const list = useMemo(() => Object.values(foods).filter((f) => (cat === "All" || f.category === cat) && (!onlyFav || s.favFoods.includes(f.id)) && (!q || f.name.toLowerCase().includes(q.toLowerCase()) || f.brand?.toLowerCase().includes(q.toLowerCase()))), [foods, cat, q, onlyFav, s.favFoods]);
  const openExternal = (f: FoodItem) => { if (!foods[f.id]) s.addCustomFood(f); setSel(f); };

  // custom food form
  const blank = { name: "", brand: "", basis: "100g" as "100g" | "100ml", kcal: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "", servingLabel: "", servingGrams: "" };
  const [cf, setCf] = useState(blank);
  const [cfErr, setCfErr] = useState<string | null>(null);
  const saveCustom = () => {
    const n = (v: string) => (v === "" ? 0 : Number(v));
    const vals = [cf.kcal, cf.protein, cf.carbs, cf.fat, cf.fiber, cf.sugar].map(n);
    if (!cf.name.trim()) return setCfErr("Name is required.");
    if (cf.kcal === "" || vals.some((v) => !Number.isFinite(v) || v < 0)) return setCfErr("Enter non-negative numbers; calories are required.");
    if (n(cf.kcal) > 900 || n(cf.protein) + n(cf.carbs) + n(cf.fat) > 100.5) return setCfErr("Per 100 g/ml values look impossible (max 900 kcal; protein+carbs+fat ≤ 100 g).");
    const sg = Number(cf.servingGrams);
    const f: FoodItem = {
      id: "custom-" + uid(), name: cf.name.trim(), brand: cf.brand.trim() || undefined, category: "Custom", basis: cf.basis,
      per100: { kcal: n(cf.kcal), protein: n(cf.protein), carbs: n(cf.carbs), fat: n(cf.fat), fiber: n(cf.fiber), sugar: n(cf.sugar), sodium: n(cf.sodium) },
      units: [{ unit: cf.basis === "100ml" ? "ml" : "g", label: cf.basis === "100ml" ? "ml" : "g", grams: 1 }, ...(cf.servingLabel && sg > 0 ? [{ unit: "serving" as const, label: `${cf.servingLabel} (${sg} ${cf.basis === "100ml" ? "ml" : "g"})`, grams: sg }] : [])],
      source: "User-entered", verified: false, tags: ["custom"],
    };
    s.addCustomFood(f); setCf(blank); setCfErr(null); toast("Custom food created"); setSel(f); setTab("library");
  };

  // barcode
  const [code, setCode] = useState(""); const [bcState, setBcState] = useState<"idle" | "loading" | "error">("idle"); const [bcErr, setBcErr] = useState("");
  const lookup = async () => {
    setBcState("loading");
    try { const r = await fetch(`/api/foods/barcode?code=${encodeURIComponent(code.trim())}`); const j = await r.json(); if (!r.ok) throw new Error(j.error); setBcState("idle"); openExternal(j.food); }
    catch (e) { setBcErr(e instanceof Error ? e.message : "Lookup failed"); setBcState("error"); }
  };
  // online search
  const [oq, setOq] = useState(""); const [oState, setOState] = useState<"idle" | "loading" | "error" | "done">("idle"); const [oErr, setOErr] = useState("");
  const searchOnline = async () => {
    if (oq.trim().length < 2) return;
    setOState("loading");
    try { const r = await fetch(`/api/foods/search?q=${encodeURIComponent(oq.trim())}`); const j = await r.json(); if (!r.ok) throw new Error(j.error); setExternal(j.foods); setOState("done"); }
    catch (e) { setOErr(e instanceof Error ? e.message : "Search failed"); setOState("error"); }
  };
  // photo scan
  const [vision, setVision] = useState<boolean | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const [scanState, setScanState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [scanErr, setScanErr] = useState("");
  const [matches, setMatches] = useState<{ foodId: string | null; label: string; grams: number; confidence?: number }[]>([]);
  useEffect(() => { if (tab === "scan" && vision === null) fetch("/api/ai/status").then((r) => r.json()).then((j) => setVision(!!j.vision)).catch(() => setVision(false)); }, [tab, vision]);
  const onFile = (file?: File) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) return toast("Please choose a JPG, PNG or WebP image", "error");
    if (file.size > 4_000_000) return toast("Image must be under 4 MB", "error");
    const r = new FileReader(); r.onload = () => { setImg(String(r.result)); setScanState("idle"); setMatches([]); }; r.readAsDataURL(file);
  };
  const analyze = async () => {
    if (!img) return; setScanState("loading");
    try { const r = await fetch("/api/ai/food-vision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: img }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setMatches(j.items); setScanState("done"); }
    catch (e) { setScanErr(e instanceof Error ? e.message : "Analysis failed"); setScanState("error"); }
  };

  return (
    <div>
      <PageHeader eyebrow="Nutrition" title="Food database" subtitle={`${Object.keys(foods).length} foods · sample dataset, your custom foods, and Open Food Facts lookups`} />
      <div className="no-scrollbar -mx-1 mb-5 overflow-x-auto px-1"><Segmented value={tab} onChange={setTab} options={[{ value: "library", label: <span className="flex items-center gap-1.5"><Search size={13} />Search</span> }, { value: "custom", label: <span className="flex items-center gap-1.5"><Plus size={13} />Custom food</span> }, { value: "barcode", label: <span className="flex items-center gap-1.5"><Barcode size={13} />Barcode</span> }, { value: "online", label: <span className="flex items-center gap-1.5"><Globe size={13} />Online</span> }, { value: "scan", label: <span className="flex items-center gap-1.5"><Camera size={13} />Photo</span> }]} /></div>

      {tab === "library" && (
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search foods…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search foods" />{q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Clear"><X size={15} /></button>}</div>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto"><Chip active={onlyFav} onClick={() => setOnlyFav((v) => !v)}><Heart size={11} className="mr-1 inline" />Favorites</Chip>{cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>
          {list.length ? <Card className="p-0"><ul className="divide-y divide-line">{list.map((f) => <FoodRow key={f.id} f={f} onOpen={() => setSel(f)} />)}</ul></Card>
            : <EmptyState icon={<Search size={20} />} title="No foods found" body="Try the online search, scan a barcode, or create a custom food." action={<div className="flex gap-2"><Button size="sm" onClick={() => { setOq(q); setTab("online"); }}>Search online</Button><Button size="sm" variant="secondary" onClick={() => { setCf({ ...blank, name: q }); setTab("custom"); }}>Create custom</Button></div>} />}
        </div>
      )}

      {tab === "custom" && (
        <Card className="max-w-2xl space-y-4">
          <Notice>Custom foods are marked as <b>user-entered</b>. Copy values from the product label where possible.</Notice>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Food name *"><input className="input" value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} maxLength={80} /></Field><Field label="Brand (optional)"><input className="input" value={cf.brand} onChange={(e) => setCf({ ...cf, brand: e.target.value })} /></Field></div>
          <Field label="Values are per"><Segmented value={cf.basis} onChange={(v) => setCf({ ...cf, basis: v })} options={[{ value: "100g", label: "100 g" }, { value: "100ml", label: "100 ml" }]} /></Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([["kcal", "Calories *"], ["protein", "Protein g"], ["carbs", "Carbs g"], ["fat", "Fat g"], ["fiber", "Fiber g"], ["sugar", "Sugar g"], ["sodium", "Sodium mg"]] as const).map(([k, l]) => <Field key={k} label={l}><input className="input tabular" type="number" min={0} step="any" value={cf[k]} onChange={(e) => setCf({ ...cf, [k]: e.target.value })} /></Field>)}</div>
          <div className="grid grid-cols-2 gap-3"><Field label="Serving name (optional)" hint="e.g. 1 bar"><input className="input" value={cf.servingLabel} onChange={(e) => setCf({ ...cf, servingLabel: e.target.value })} /></Field><Field label={`Serving size (${cf.basis === "100ml" ? "ml" : "g"})`}><input className="input" type="number" min={0} value={cf.servingGrams} onChange={(e) => setCf({ ...cf, servingGrams: e.target.value })} /></Field></div>
          {cfErr && <p className="text-xs text-danger">{cfErr}</p>}
          <Button onClick={saveCustom}><Plus size={15} />Create food</Button>
        </Card>
      )}

      {tab === "barcode" && (
        <Card className="max-w-xl space-y-3">
          <p className="text-sm text-muted">Look up packaged foods by barcode using the public <b className="text-fg">Open Food Facts</b> database. Results are community-sourced and marked as external.</p>
          <div className="flex gap-2"><input className="input tabular" inputMode="numeric" placeholder="e.g. 3017620422003" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Barcode number" onKeyDown={(e) => e.key === "Enter" && lookup()} /><Button onClick={lookup} loading={bcState === "loading"} disabled={code.length < 6}>Look up</Button></div>
          {bcState === "error" && <Notice tone="warn">{bcErr}</Notice>}
          <p className="text-[11px] text-muted">Camera barcode scanning isn&apos;t enabled in this build — type the number printed under the barcode.</p>
        </Card>
      )}

      {tab === "online" && (
        <div className="space-y-3">
          <div className="flex max-w-xl gap-2"><input className="input" placeholder="Search Open Food Facts…" value={oq} onChange={(e) => setOq(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchOnline()} aria-label="Online search" /><Button onClick={searchOnline} loading={oState === "loading"}>Search</Button></div>
          {oState === "loading" && <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>}
          {oState === "error" && <Notice tone="warn">{oErr} You can still use the local database or create a custom food.</Notice>}
          {oState === "done" && (external.length ? <Card className="p-0"><ul className="divide-y divide-line">{external.map((f) => <FoodRow key={f.id} f={f} onOpen={() => openExternal(f)} />)}</ul></Card> : <EmptyState icon={<Globe size={20} />} title="No online results" body="Try a different term or brand name." />)}
          <p className="text-[11px] text-muted">Source: Open Food Facts (ODbL). Data is not verified by VYORA.</p>
        </div>
      )}

      {tab === "scan" && (
        <div className="grid max-w-4xl gap-5 md:grid-cols-2">
          <Card className="space-y-3">
            {vision === false && <Notice tone="warn">Image recognition is <b>not configured</b> on this server (requires <code>OPENAI_API_KEY</code>). You can still upload a photo for reference and add foods manually.</Notice>}
            {vision && <Notice>A vision model will suggest possible foods and rough portions. You must confirm everything before it&apos;s logged — photo estimates are never exact.</Notice>}
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-elevated text-sm text-muted hover:border-accent/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img ? <img src={img} alt="Uploaded meal" className="h-full w-full object-cover" /> : <><ImageUp size={28} className="mb-2 text-accent" />Tap to upload or take a photo</>}
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <div className="flex gap-2"><Button className="flex-1" onClick={analyze} disabled={!img || !vision} loading={scanState === "loading"}>Analyze photo</Button><Button variant="secondary" onClick={() => setTab("library")}>Add manually</Button></div>
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Suggestions</h2>
            {scanState === "loading" && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>}
            {scanState === "error" && <Notice tone="warn">{scanErr}</Notice>}
            {scanState === "done" && !matches.length && <p className="text-sm text-muted">No foods recognised. Try manual search.</p>}
            {matches.length > 0 && <ul className="space-y-2">{matches.map((m, i) => { const f = m.foodId ? foods[m.foodId] : null; return (
              <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3"><div><p className="text-sm font-semibold">{m.label}</p><p className="text-xs text-muted">~{Math.round(m.grams)} g estimated{m.confidence ? ` · ${Math.round(m.confidence * 100)}% confidence` : ""}</p></div>{f ? <Button size="sm" onClick={() => setSel(f)}>Review</Button> : <Badge>No match</Badge>}</li>); })}</ul>}
            {scanState === "idle" && <p className="text-sm text-muted">Upload a photo to get started.</p>}
          </Card>
        </div>
      )}
      <FoodModal food={sel} open={!!sel} onClose={() => setSel(null)} />
    </div>
  );
}
