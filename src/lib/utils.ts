export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toKey(new Date());
export const addDays = (key: string, n: number) => { const [y, m, d] = key.split("-").map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + n); return toKey(dt); };
export const keyToDate = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
export const lastNDays = (n: number, end = todayKey()) => Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
export const fmtDay = (key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short" }) => keyToDate(key).toLocaleDateString("en-US", opts);
export const fmtDuration = (sec: number) => { const s = Math.max(0, Math.round(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60; return h ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`; };
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const weekdayOf = (key: string) => WEEKDAYS[(keyToDate(key).getDay() + 6) % 7];

// Unit conversions
export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const ML_PER_FLOZ = 29.5735;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const inToCm = (i: number) => i * CM_PER_IN;
export const mlToOz = (ml: number) => ml / ML_PER_FLOZ;
export const ozToMl = (oz: number) => oz * ML_PER_FLOZ;
export function fmtWeight(kg: number | undefined, units: "metric" | "imperial") { if (kg == null) return "—"; return units === "metric" ? `${(Math.round(kg * 10) / 10)} kg` : `${Math.round(kgToLb(kg) * 10) / 10} lb`; }
export function fmtLength(cm: number | undefined, units: "metric" | "imperial") { if (cm == null) return "—"; return units === "metric" ? `${Math.round(cm * 10) / 10} cm` : `${Math.round(cmToIn(cm) * 10) / 10} in`; }
export function fmtVolume(ml: number, units: "metric" | "imperial") { return units === "metric" ? (ml >= 1000 ? `${Math.round(ml / 100) / 10} L` : `${Math.round(ml)} ml`) : `${Math.round(mlToOz(ml))} fl oz`; }
