"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Logo ---------- */
export function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none" aria-label="VYORA">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path d="M8 9.5 L14.2 23 L16.6 18 L20.5 9.5" stroke="var(--accent-ink)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.6 21.6 L24 9.5" stroke="var(--accent-ink)" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </svg>
      {wordmark && <span className="font-extrabold tracking-[0.18em] text-[15px]">VYORA</span>}
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export function Button({ variant = "primary", size = "md", className, loading, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" | "icon"; loading?: boolean }) {
  const v: Record<Variant, string> = {
    primary: "bg-accent text-accent-ink hover:bg-accent-hover font-semibold",
    secondary: "bg-elevated-2 text-fg hover:bg-line/70 border border-line",
    outline: "border border-line text-fg hover:border-accent/60 hover:text-accent",
    ghost: "text-muted hover:text-fg hover:bg-elevated-2",
    danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30",
  };
  const s = { sm: "h-8 px-3 text-xs rounded-lg gap-1.5", md: "h-10 px-4 text-sm rounded-xl gap-2", lg: "h-12 px-6 text-[15px] rounded-2xl gap-2", icon: "h-10 w-10 rounded-xl" }[size];
  return (
    <button className={cn("press inline-flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none", v[variant], s, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
export function LinkButton({ href, variant = "primary", className, children, size = "md" }: { href: string; variant?: Variant; className?: string; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  const v: Record<Variant, string> = {
    primary: "bg-accent text-accent-ink hover:bg-accent-hover font-semibold", secondary: "bg-elevated-2 text-fg hover:bg-line/70 border border-line",
    outline: "border border-line text-fg hover:border-accent/60 hover:text-accent", ghost: "text-muted hover:text-fg hover:bg-elevated-2", danger: "bg-danger/15 text-danger",
  };
  const s = { sm: "h-8 px-3 text-xs rounded-lg gap-1.5", md: "h-10 px-4 text-sm rounded-xl gap-2", lg: "h-12 px-6 text-[15px] rounded-2xl gap-2" }[size];
  return <Link href={href} className={cn("press inline-flex items-center justify-center whitespace-nowrap", v[variant], s, className)}>{children}</Link>;
}

/* ---------- Card / Badge / Chip ---------- */
export function Card({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return <As className={cn("card p-5", className)} {...rest}>{children}</As>;
}
export function Badge({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "accent" | "success" | "warn" | "danger"; className?: string }) {
  const t = { default: "bg-elevated-2 text-muted border-line", accent: "bg-accent-soft text-accent border-accent/25", success: "bg-success/10 text-success border-success/25", warn: "bg-warn/10 text-warn border-warn/25", danger: "bg-danger/10 text-danger border-danger/25" }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", t, className)}>{children}</span>;
}
export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold", active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg hover:border-muted/50", className)}>
      {children}
    </button>
  );
}
export function DifficultyBadge({ d }: { d: string }) {
  return <Badge tone={d === "Beginner" ? "success" : d === "Intermediate" ? "warn" : "danger"}>{d}</Badge>;
}

/* ---------- Headers ---------- */
export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between anim-fade-up">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-[15px] font-bold tracking-tight">{children}</h2>{action}</div>;
}

/* ---------- Progress ---------- */
export function ProgressRing({ value, max, size = 120, stroke = 10, color = "var(--accent)", children, label }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(t); }, [pct]);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--elevated-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)} className="ring-anim" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
export function Bar({ value, max, color = "var(--accent)", className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className={cn("h-2 w-full overflow-hidden rounded-full bg-elevated-2", className)}><div className="bar-anim h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>;
}
export function MacroBar({ label, value, target, color, unit = "g" }: { label: string; value: number; target?: number | null; color: string; unit?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs"><span className="font-semibold">{label}</span>
        <span className="tabular text-muted"><span className="font-semibold text-fg">{Math.round(value)}</span>{target ? ` / ${Math.round(target)}` : ""} {unit}</span></div>
      <Bar value={value} max={target || Math.max(value, 1) * 1.4} color={color} />
    </div>
  );
}

/* ---------- Empty / Skeleton / Notice ---------- */
export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center anim-fade-in">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</div>
      <p className="font-bold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton", className)} aria-hidden />; }
export function Notice({ tone = "info", children, className }: { tone?: "info" | "warn" | "success"; children: ReactNode; className?: string }) {
  const Icon = tone === "warn" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;
  const c = tone === "warn" ? "border-warn/30 bg-warn/5 text-warn" : tone === "success" ? "border-success/30 bg-success/5 text-success" : "border-line bg-elevated text-muted";
  return <div className={cn("flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed", c, className)} role="note"><Icon size={15} className="mt-0.5 shrink-0" /><div className="text-fg/85">{children}</div></div>;
}
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-fg opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100">{text}</span>
    </span>
  );
}

/* ---------- Modal (dialog on desktop, bottom sheet on mobile) ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const id = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey); document.body.style.overflow = "hidden";
    setTimeout(() => ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus(), 30);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="absolute inset-0 bg-black/60 anim-fade-in" onClick={onClose} />
      <div ref={ref} className={cn("relative flex max-h-[92dvh] w-full flex-col border border-line bg-surface shadow-2xl anim-sheet sm:anim-scale-in rounded-t-3xl sm:rounded-3xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 id={id} className="text-base font-bold">{title}</h2>
          <button data-close onClick={onClose} className="press grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated-2 hover:text-fg" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toasts + confirm ---------- */
type Toast = { id: number; msg: string; tone: "success" | "error" | "info"; action?: { label: string; fn: () => void } };
type ConfirmReq = { title: string; body: string; confirmLabel?: string; danger?: boolean; resolve: (v: boolean) => void };
const UICtx = createContext<{ toast: (msg: string, tone?: Toast["tone"], action?: Toast["action"]) => void; confirm: (o: Omit<ConfirmReq, "resolve">) => Promise<boolean> }>({ toast: () => {}, confirm: async () => false });
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [conf, setConf] = useState<ConfirmReq | null>(null);
  const toast = useCallback((msg: string, tone: Toast["tone"] = "success", action?: Toast["action"]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const confirm = useCallback((o: Omit<ConfirmReq, "resolve">) => new Promise<boolean>((resolve) => setConf({ ...o, resolve })), []);
  const close = (v: boolean) => { conf?.resolve(v); setConf(null); };
  return (
    <UICtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3 text-sm shadow-2xl anim-fade-up">
            {t.tone === "success" ? <CheckCircle2 size={18} className="shrink-0 text-success" /> : t.tone === "error" ? <AlertTriangle size={18} className="shrink-0 text-danger" /> : <Info size={18} className="shrink-0 text-accent" />}
            <span className="flex-1">{t.msg}</span>
            {t.action && <button className="text-xs font-bold text-accent hover:underline" onClick={() => { t.action!.fn(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>{t.action.label}</button>}
          </div>
        ))}
      </div>
      <Modal open={!!conf} onClose={() => close(false)} title={conf?.title ?? ""}
        footer={<><Button variant="secondary" onClick={() => close(false)}>Cancel</Button><Button variant={conf?.danger ? "danger" : "primary"} onClick={() => close(true)}>{conf?.confirmLabel ?? "Confirm"}</Button></>}>
        <p className="text-sm text-muted">{conf?.body}</p>
      </Modal>
    </UICtx.Provider>
  );
}

/* ---------- Tabs / Segmented ---------- */
export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-xl border border-line bg-elevated p-1", className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn("press rounded-lg px-3 py-1.5 text-xs font-semibold", value === o.value ? "bg-accent text-accent-ink" : "text-muted hover:text-fg")}>{o.label}</button>
      ))}
    </div>
  );
}
export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string | null }) {
  return <label className="block"><span className="label">{label}</span>{children}{error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}</label>;
}
export function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card-elev p-4">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">{label}{icon && <span className="text-accent">{icon}</span>}</div>
      <div className="tabular text-2xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}
