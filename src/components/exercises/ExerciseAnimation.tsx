"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, ChevronLeft, ChevronRight, Maximize2, Pause, Play, Repeat, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { AnimPattern, Exercise } from "@/types";
import { cn } from "@/lib/utils";

type P = [number, number];
type SidePose = { head: P; sh: P; el: P; ha: P; hip: P; kn: P; an: P; to: P; mid?: P; el2?: P; ha2?: P; kn2?: P; an2?: P; to2?: P; dy?: number };
type FrontPose = { head: P; shL: P; shR: P; elL: P; elR: P; haL: P; haR: P; hipL: P; hipR: P; knL: P; knR: P; anL: P; anR: P; dy?: number };

const STAND: SidePose = { head: [100, 36], sh: [100, 58], el: [101, 82], ha: [103, 104], hip: [100, 106], kn: [102, 142], an: [100, 176], to: [113, 179] };
const S = (p: Partial<SidePose>): SidePose => ({ ...STAND, ...p });

const SIDE: Record<AnimPattern, { frames: SidePose[]; bar?: boolean; floor?: boolean }> = {
  squat: { frames: [S({ el: [116, 70], ha: [134, 70] }), S({ head: [106, 72], sh: [102, 92], el: [122, 98], ha: [142, 96], hip: [78, 134], kn: [116, 140] })] },
  pushup: { frames: [
    { head: [158, 120], sh: [142, 130], el: [142, 155], ha: [142, 179], hip: [96, 146], kn: [68, 160], an: [40, 172], to: [34, 179] },
    { head: [160, 152], sh: [142, 160], el: [122, 164], ha: [142, 179], hip: [96, 166], kn: [68, 171], an: [40, 175], to: [34, 179] }] },
  press: { frames: [S({ el: [114, 78], ha: [106, 58] }), S({ el: [103, 34], ha: [102, 12] })] },
  row: { frames: [
    S({ head: [146, 72], sh: [130, 80], el: [131, 104], ha: [132, 128], hip: [90, 104], kn: [100, 140] }),
    S({ head: [146, 72], sh: [130, 80], el: [110, 92], ha: [122, 110], hip: [90, 104], kn: [100, 140] })] },
  curl: { frames: [S({}), S({ ha: [114, 62] })] },
  raise: { frames: [S({}), S({ el: [122, 62], ha: [144, 58] })] },
  hinge: { frames: [S({}), S({ head: [142, 84], sh: [126, 90], el: [126, 114], ha: [126, 136], hip: [80, 102], kn: [92, 140] })] },
  lunge: { frames: [S({}), S({ head: [100, 64], sh: [100, 86], el: [100, 108], ha: [101, 128], hip: [100, 130], kn: [128, 142], an: [128, 176], to: [140, 179], kn2: [86, 170], an2: [62, 168], to2: [54, 177] })] },
  plank: { frames: [
    { head: [158, 132], sh: [142, 146], el: [142, 177], ha: [162, 179], hip: [96, 152], kn: [68, 163], an: [40, 172], to: [34, 179] },
    { head: [158, 131], sh: [142, 145], el: [142, 177], ha: [162, 179], hip: [96, 149], kn: [68, 162], an: [40, 172], to: [34, 179], kn2: [110, 158], an2: [88, 172], to2: [84, 179] }] },
  crunch: { frames: [
    { head: [36, 166], sh: [52, 170], el: [42, 156], ha: [34, 150], hip: [98, 172], kn: [116, 142], an: [134, 176], to: [144, 178] },
    { head: [56, 142], sh: [66, 156], el: [56, 142], ha: [48, 136], hip: [98, 172], kn: [104, 136], an: [124, 150], to: [134, 150] }] },
  jump: { frames: [S({}), S({ head: [104, 62], sh: [101, 84], el: [92, 104], ha: [84, 118], hip: [86, 124], kn: [114, 144] }), S({ dy: -24, el: [104, 34], ha: [106, 12], to: [108, 182] })] },
  calf: { frames: [S({}), S({ dy: -9, an: [100, 176], to: [108, 188] })] },
  pullup: { bar: true, frames: [
    { head: [100, 40], sh: [100, 56], el: [103, 34], ha: [104, 13], hip: [100, 104], kn: [100, 140], an: [98, 174], to: [108, 178] },
    { head: [104, 6], sh: [100, 28], el: [86, 38], ha: [104, 13], hip: [100, 76], kn: [100, 112], an: [98, 146], to: [108, 150] }] },
  bridge: { frames: [
    { head: [34, 168], sh: [52, 172], el: [70, 176], ha: [88, 177], hip: [98, 172], kn: [122, 142], an: [134, 176], to: [146, 178] },
    { head: [34, 168], sh: [52, 170], el: [70, 176], ha: [88, 177], hip: [98, 138], kn: [126, 128], an: [134, 176], to: [146, 178] }] },
  walk: { frames: [
    S({ el: [92, 80], ha: [86, 100], el2: [110, 80], ha2: [118, 98], kn: [112, 140], an: [116, 176], to: [128, 178], kn2: [92, 142], an2: [80, 172], to2: [86, 180] }),
    S({ el: [110, 80], ha: [118, 98], el2: [92, 80], ha2: [86, 100], kn2: [112, 140], an2: [116, 176], to2: [128, 178], kn: [92, 142], an: [80, 172], to: [86, 180] })] },
  stretch: { frames: [
    { head: [154, 126], sh: [140, 136], el: [140, 158], ha: [140, 179], hip: [86, 136], kn: [86, 179], an: [52, 179], to: [46, 176], mid: [113, 116] },
    { head: [156, 114], sh: [140, 136], el: [140, 158], ha: [140, 179], hip: [86, 136], kn: [86, 179], an: [52, 179], to: [46, 176], mid: [113, 152] }] },
  extension: { frames: [S({ el: [104, 30], ha: [86, 44] }), S({ el: [104, 30], ha: [104, 8] })] },
  fly: { frames: [S({ el: [116, 66], ha: [134, 64] }), S({ el: [94, 68], ha: [84, 60] })] },
};

const FSTAND: FrontPose = { head: [100, 36], shL: [86, 58], shR: [114, 58], elL: [82, 82], elR: [118, 82], haL: [82, 104], haR: [118, 104], hipL: [92, 106], hipR: [108, 106], knL: [91, 142], knR: [109, 142], anL: [90, 176], anR: [110, 176] };
const F = (p: Partial<FrontPose>): FrontPose => ({ ...FSTAND, ...p });
const FRONT: Partial<Record<AnimPattern, FrontPose[]>> = {
  squat: [F({ elL: [88, 70], haL: [94, 68], elR: [112, 70], haR: [106, 68] }), F({ head: [100, 66], shL: [86, 88], shR: [114, 88], elL: [88, 98], haL: [94, 96], elR: [112, 98], haR: [106, 96], hipL: [90, 134], hipR: [110, 134], knL: [78, 142], knR: [122, 142] })],
  raise: [F({}), F({ elL: [64, 60], haL: [42, 60], elR: [136, 60], haR: [158, 60] })],
  jump: [F({}), F({ dy: -6, elL: [72, 40], haL: [74, 16], elR: [128, 40], haR: [126, 16], knL: [82, 142], knR: [118, 142], anL: [72, 176], anR: [128, 176] })],
  press: [F({ elL: [72, 74], haL: [78, 52], elR: [128, 74], haR: [122, 52] }), F({ elL: [80, 34], haL: [84, 10], elR: [120, 34], haR: [116, 10] })],
  fly: [F({ elL: [62, 66], haL: [42, 70], elR: [138, 66], haR: [158, 70] }), F({ elL: [88, 72], haL: [98, 76], elR: [112, 72], haR: [102, 76] })],
  calf: [F({}), F({ dy: -9 })],
  curl: [F({}), F({ haL: [80, 62], haR: [120, 62] })],
  lunge: [F({}), F({ head: [100, 62], shL: [86, 84], shR: [114, 84], elL: [82, 106], haL: [82, 128], elR: [118, 106], haR: [118, 128], hipL: [92, 132], hipR: [108, 132], knL: [90, 152], knR: [110, 166] })],
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function lerpPose<T extends Record<string, unknown>>(a: T, b: T, t: number): T {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const alt = (o: T) => (k.endsWith("2") ? (o[k.slice(0, -1)] as P | undefined) : undefined);
    const va = (a[k] ?? alt(a)) as P | number | undefined, vb = (b[k] ?? alt(b)) as P | number | undefined;
    if (typeof va === "number" || typeof vb === "number") out[k] = ((va as number) ?? 0) + (((vb as number) ?? 0) - ((va as number) ?? 0)) * t;
    else if (va || vb) out[k] = lerp((va ?? vb) as P, (vb ?? va) as P, t);
  });
  return out as T;
}
/** phase 0..1 over a full cycle visiting each frame then returning. */
function sample<T extends Record<string, unknown>>(frames: T[], phase: number): T {
  const seq = frames.length > 2 ? [...frames, frames[0]] : [...frames, frames[0]];
  const segs = seq.length - 1; const x = phase * segs; const i = Math.min(segs - 1, Math.floor(x));
  const local = x - i; const held = Math.min(1, Math.max(0, (local - 0.1) / 0.8));
  return lerpPose(seq[i], seq[i + 1], ease(held));
}

const SKIN = "#E9C9A6", PANTS = "#2E3A33", SHIRT = "var(--accent)", HAIR = "#2A211B";

function Limb({ pts, color, w, op = 1 }: { pts: P[]; color: string; w: number; op?: number }) {
  return <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
}
function Prop({ at, kind }: { at: P; kind: string | null }) {
  if (!kind) return null;
  if (kind === "Kettlebell") return <g><circle cx={at[0]} cy={at[1] + 8} r={7} fill="#3b3f3c" /><path d={`M${at[0] - 4} ${at[1] + 2} Q${at[0]} ${at[1] - 6} ${at[0] + 4} ${at[1] + 2}`} stroke="#3b3f3c" strokeWidth={2.5} fill="none" /></g>;
  return <g><rect x={at[0] - 9} y={at[1] - 2} width={18} height={4} rx={2} fill="#55605a" /><rect x={at[0] - 11} y={at[1] - 6} width={4} height={12} rx={1.5} fill="#2b302d" /><rect x={at[0] + 7} y={at[1] - 6} width={4} height={12} rx={1.5} fill="#2b302d" /></g>;
}

function SideFigure({ p, prop, showJoints }: { p: SidePose; prop: string | null; showJoints: boolean }) {
  const dy = p.dy ?? 0; const T = (q: P): P => [q[0], q[1] + dy];
  const mid = p.mid ?? lerp(p.sh, p.hip, 0.5);
  const back = { el: p.el2 ?? lerp(p.el, p.sh, -0.02), ha: p.ha2 ?? p.ha, kn: p.kn2 ?? p.kn, an: p.an2 ?? p.an, to: p.to2 ?? p.to };
  const [sh, hip] = [T(p.sh), T(p.hip)];
  return (
    <g>
      <Limb pts={[hip, T(back.kn), T(back.an), T(back.to)]} color={PANTS} w={11} op={0.55} />
      <Limb pts={[sh, T(back.el), T(back.ha)]} color={SKIN} w={8} op={0.5} />
      <path d={`M${sh[0]} ${sh[1]} Q${mid[0]} ${mid[1] + dy} ${hip[0]} ${hip[1]}`} stroke={SHIRT} strokeWidth={17} fill="none" strokeLinecap="round" />
      <Limb pts={[hip, T(p.kn), T(p.an)]} color={PANTS} w={12} />
      <Limb pts={[T(p.an), T(p.to)]} color="#F5F7F2" w={6} />
      <Limb pts={[sh, T(p.el), T(p.ha)]} color={SKIN} w={8.5} />
      <Prop at={T(p.ha)} kind={prop} />
      <circle cx={p.head[0]} cy={p.head[1] + dy} r={11.5} fill={SKIN} />
      <path d={`M${p.head[0] - 11.5} ${p.head[1] + dy - 1} A11.5 11.5 0 0 1 ${p.head[0] + 11.5} ${p.head[1] + dy - 1} Z`} fill={HAIR} />
      {showJoints && [p.sh, p.el, p.ha, p.hip, p.kn, p.an].map((q, i) => <circle key={i} cx={q[0]} cy={q[1] + dy} r={2.6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.4} />)}
    </g>
  );
}
function FrontFigure({ p, prop, showJoints }: { p: FrontPose; prop: string | null; showJoints: boolean }) {
  const dy = p.dy ?? 0; const T = (q: P): P => [q[0], q[1] + dy];
  return (
    <g>
      <Limb pts={[T(p.hipL), T(p.knL), T(p.anL)]} color={PANTS} w={12} />
      <Limb pts={[T(p.hipR), T(p.knR), T(p.anR)]} color={PANTS} w={12} />
      <Limb pts={[T(p.anL), [p.anL[0] - 6, p.anL[1] + dy + 3]]} color="#F5F7F2" w={6} />
      <Limb pts={[T(p.anR), [p.anR[0] + 6, p.anR[1] + dy + 3]]} color="#F5F7F2" w={6} />
      <path d={`M${p.shL[0]} ${p.shL[1] + dy} L${p.shR[0]} ${p.shR[1] + dy} L${p.hipR[0] + 2} ${p.hipR[1] + dy} L${p.hipL[0] - 2} ${p.hipL[1] + dy} Z`} fill={SHIRT} stroke={SHIRT} strokeWidth={8} strokeLinejoin="round" />
      <Limb pts={[T(p.shL), T(p.elL), T(p.haL)]} color={SKIN} w={8.5} />
      <Limb pts={[T(p.shR), T(p.elR), T(p.haR)]} color={SKIN} w={8.5} />
      <Prop at={T(p.haL)} kind={prop} /><Prop at={T(p.haR)} kind={prop} />
      <circle cx={p.head[0]} cy={p.head[1] + dy} r={11.5} fill={SKIN} />
      <path d={`M${p.head[0] - 11.5} ${p.head[1] + dy - 1} A11.5 11.5 0 0 1 ${p.head[0] + 11.5} ${p.head[1] + dy - 1} Z`} fill={HAIR} />
      {showJoints && [p.shL, p.shR, p.elL, p.elR, p.hipL, p.hipR, p.knL, p.knR].map((q, i) => <circle key={i} cx={q[0]} cy={q[1] + dy} r={2.6} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.4} />)}
    </g>
  );
}

function propFor(ex: Exercise): string | null {
  if (ex.equipment.includes("Kettlebell") && !ex.equipment.includes("Dumbbells")) return "Kettlebell";
  if (ex.equipment.includes("Dumbbells") || ex.equipment.includes("Barbell")) return ["press", "row", "curl", "raise", "hinge", "fly", "squat", "extension"].includes(ex.anim) ? "Dumbbells" : null;
  return null;
}

export function Stage({ ex, phase, view, showJoints = true, className }: { ex: Exercise; phase: number; view: "side" | "front"; showJoints?: boolean; className?: string }) {
  const def = SIDE[ex.anim];
  const front = FRONT[ex.anim];
  const prop = propFor(ex);
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Cartoon demonstration of ${ex.name}, ${view} view`}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="85%" r="60%"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".12" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--line)" strokeWidth=".5" opacity=".5" /></pattern>
      </defs>
      <rect width="200" height="200" fill="url(#grid)" />
      <rect width="200" height="200" fill="url(#spot)" />
      <line x1="10" y1="181" x2="190" y2="181" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
      {def.bar && <line x1="60" y1="13" x2="150" y2="13" stroke="#7d877f" strokeWidth="4" strokeLinecap="round" />}
      {view === "front" && front ? <FrontFigure p={sample(front, phase)} prop={prop} showJoints={showJoints} /> : <SideFigure p={sample(def.frames, phase)} prop={prop} showJoints={showJoints} />}
    </svg>
  );
}

export function ExerciseThumb({ ex, className }: { ex: Exercise; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-elevated", className)}>
      <Stage ex={ex} phase={0.25} view={FRONT[ex.anim] && ["raise", "jump", "fly"].includes(ex.anim) ? "front" : "side"} showJoints={false} className="h-full w-full" />
    </div>
  );
}

export function hasFrontView(ex: Exercise) { return !!FRONT[ex.anim]; }

export function ExercisePlayer({ ex, compact = false, autoPlay = true }: { ex: Exercise; compact?: boolean; autoPlay?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<"side" | "front">("side");
  const [captions, setCaptions] = useState(true);
  const [narrate, setNarrate] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [phase, setPhase] = useState(0);
  const [step, setStep] = useState(0);
  const last = useRef<number | null>(null);
  const cycleMs = 3200;

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPlaying(false); setStepMode(true); }
  }, []);
  useEffect(() => { setPhase(0); setStep(0); setView("side"); }, [ex.id]);

  useEffect(() => {
    if (!playing || stepMode) { last.current = null; return; }
    let raf = 0;
    const tick = (t: number) => {
      if (last.current != null) {
        setPhase((ph) => {
          const n = ph + ((t - last.current!) / cycleMs) * speed;
          if (n >= 1 && !loop) { setPlaying(false); return 0.999; }
          return n % 1;
        });
      }
      last.current = t; raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, loop, stepMode]);

  const n = ex.steps.length;
  const currentStep = stepMode ? step : Math.min(n - 1, Math.floor(phase * n));
  useEffect(() => { if (stepMode) setPhase((step + 0.5) / n * 0.999); }, [step, stepMode, n]);

  const speak = useCallback((i: number) => {
    if (!narrate || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(ex.steps[i]));
  }, [narrate, ex.steps]);
  const lastSpoken = useRef(-1);
  useEffect(() => { if (narrate && currentStep !== lastSpoken.current) { lastSpoken.current = currentStep; speak(currentStep); } }, [currentStep, narrate, speak]);
  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const fullscreen = () => { const el = wrap.current; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.().catch(() => {}); };
  const front = hasFrontView(ex);
  const btn = "press grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-elevated-2 hover:text-fg aria-pressed:text-accent";

  return (
    <div ref={wrap} className="relative overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="relative">
        {ex.videoUrl ? (
          <video src={ex.videoUrl} className="aspect-square w-full object-cover sm:aspect-[4/3]" controls loop playsInline preload="none" />
        ) : (
          <Stage ex={ex} phase={phase} view={view} className={cn("mx-auto block w-full", compact ? "max-h-[260px]" : "max-h-[440px]")} />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-line bg-bg/80 px-2 py-0.5 text-[10px] font-semibold text-muted backdrop-blur">{ex.videoUrl ? "Video" : "Procedural animation · general movement pattern"}</span>
        </div>
        {captions && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-bg/85 px-3 py-2 text-center text-xs font-medium backdrop-blur sm:text-sm" aria-live="polite">
            <span className="mr-1.5 font-bold text-accent">{currentStep + 1}/{n}</span>{ex.steps[currentStep]}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-2">
        {stepMode ? (
          <>
            <button className={btn} onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label="Previous step"><ChevronLeft size={18} /></button>
            <span className="tabular px-1 text-xs font-semibold">Step {step + 1}/{n}</span>
            <button className={btn} onClick={() => setStep((s) => Math.min(n - 1, s + 1))} aria-label="Next step"><ChevronRight size={18} /></button>
          </>
        ) : (
          <>
            <button className={cn(btn, "bg-accent text-accent-ink hover:bg-accent-hover hover:text-accent-ink")} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
            <button className={btn} onClick={() => { setPhase(0); setPlaying(true); }} aria-label="Restart"><RotateCcw size={16} /></button>
            <button className={btn} aria-pressed={loop} onClick={() => setLoop((l) => !l)} aria-label="Toggle loop"><Repeat size={16} /></button>
            <select aria-label="Playback speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="h-9 rounded-xl border border-line bg-elevated px-2 text-xs font-semibold">
              {[0.5, 0.75, 1, 1.5].map((s) => <option key={s} value={s}>{s}×</option>)}
            </select>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button className={cn("press h-9 rounded-xl px-2.5 text-xs font-semibold", stepMode ? "bg-accent-soft text-accent" : "text-muted hover:bg-elevated-2")} onClick={() => { setStepMode((s) => !s); setPlaying(false); }} aria-pressed={stepMode}>Steps</button>
          <div className="flex rounded-xl border border-line p-0.5 text-[11px] font-semibold">
            <button className={cn("rounded-lg px-2 py-1", view === "side" ? "bg-elevated-2 text-fg" : "text-muted")} onClick={() => setView("side")}>Side</button>
            <button disabled={!front} title={front ? "Front view" : "Front view not available for this exercise"} className={cn("rounded-lg px-2 py-1 disabled:opacity-40", view === "front" ? "bg-elevated-2 text-fg" : "text-muted")} onClick={() => setView("front")}>Front</button>
          </div>
          <button className={btn} aria-pressed={captions} onClick={() => setCaptions((c) => !c)} aria-label="Toggle captions"><Captions size={16} /></button>
          <button className={btn} aria-pressed={narrate} onClick={() => setNarrate((v) => !v)} aria-label="Toggle audio narration">{narrate ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
          {!compact && <button className={btn} onClick={fullscreen} aria-label="Full screen"><Maximize2 size={16} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Muscle map ---------- */
const REGIONS: Record<string, { front?: [number, number, number, number][]; back?: [number, number, number, number][] }> = {
  chest: { front: [[40, 42, 9, 6], [60, 42, 9, 6]] }, shoulders: { front: [[29, 38, 5, 5], [71, 38, 5, 5]], back: [[29, 38, 5, 5], [71, 38, 5, 5]] },
  biceps: { front: [[26, 55, 3.5, 8], [74, 55, 3.5, 8]] }, triceps: { back: [[26, 55, 3.5, 8], [74, 55, 3.5, 8]] },
  core: { front: [[50, 62, 9, 12]] }, obliques: { front: [[40, 64, 3, 8], [60, 64, 3, 8]] }, back: { back: [[50, 52, 14, 14]] },
  quads: { front: [[43, 98, 5, 14], [57, 98, 5, 14]] }, hamstrings: { back: [[43, 102, 5, 13], [57, 102, 5, 13]] },
  glutes: { back: [[44, 82, 6, 6], [56, 82, 6, 6]] }, calves: { back: [[43, 128, 3.5, 9], [57, 128, 3.5, 9]] },
};
const MUSCLE_KEYS: Record<string, string[]> = {
  Chest: ["chest"], Back: ["back"], Shoulders: ["shoulders"], Biceps: ["biceps"], Triceps: ["triceps"], Quads: ["quads"], "Hamstrings & Glutes": ["hamstrings", "glutes"],
  Calves: ["calves"], Core: ["core", "obliques"], "Full Body": ["quads", "chest", "back", "core", "glutes"], Mobility: [], Cardio: ["quads", "calves"],
};
function secKeys(sec: string[]) {
  const map: Record<string, string> = { triceps: "triceps", biceps: "biceps", shoulders: "shoulders", "rear delts": "shoulders", core: "core", obliques: "obliques", glutes: "glutes", hamstrings: "hamstrings", quads: "quads", chest: "chest", "upper back": "back", "lower back": "back", calves: "calves", back: "back", "upper chest": "chest", legs: "quads" };
  return sec.map((s) => map[s.toLowerCase()]).filter(Boolean);
}
export function MuscleMap({ ex }: { ex: Exercise }) {
  const primary = MUSCLE_KEYS[ex.muscle] ?? []; const secondary = secKeys(ex.secondary).filter((k) => !primary.includes(k));
  const fig = (side: "front" | "back") => (
    <svg viewBox="0 0 100 150" className="h-40 w-auto" role="img" aria-label={`${side} muscle map`}>
      <g fill="var(--elevated-2)" stroke="var(--line)">
        <circle cx="50" cy="16" r="9" /><rect x="34" y="30" width="32" height="50" rx="12" /><rect x="22" y="34" width="9" height="40" rx="4.5" /><rect x="69" y="34" width="9" height="40" rx="4.5" />
        <rect x="37" y="76" width="12" height="66" rx="6" /><rect x="51" y="76" width="12" height="66" rx="6" />
      </g>
      {Object.entries(REGIONS).flatMap(([k, r]) => (r[side] ?? []).map((e, i) => {
        const tone = primary.includes(k) ? "var(--accent)" : secondary.includes(k) ? "var(--warn)" : null;
        return tone ? <ellipse key={k + i} cx={e[0]} cy={e[1]} rx={e[2]} ry={e[3]} fill={tone} opacity={primary.includes(k) ? 0.9 : 0.6} /> : null;
      }))}
      <text x="50" y="149" textAnchor="middle" fontSize="7" fill="var(--muted)">{side.toUpperCase()}</text>
    </svg>
  );
  return (
    <div>
      <div className="flex justify-center gap-4">{fig("front")}{fig("back")}</div>
      <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" />Primary</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-warn" />Secondary</span></div>
    </div>
  );
}
