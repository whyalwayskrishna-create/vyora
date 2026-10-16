// Server-only AI provider adapter. Reads secrets from process.env and never exposes them to the client.
export function aiConfig() {
  const key = process.env.OPENAI_API_KEY;
  return { configured: !!key, key, model: process.env.OPENAI_MODEL || "gpt-4o-mini", baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "") };
}
export const COACH_SYSTEM = `You are VYORA Coach, a friendly, knowledgeable fitness and nutrition companion inside the VYORA app.
Rules: Do not diagnose medical conditions or prescribe medication. Never recommend extreme diets, very low calorie intake, or dangerous training. If the user reports chest pain, fainting, severe breathlessness, numbness or sharp pain, tell them to stop and seek medical care. Be extra cautious with minors. Avoid body-shaming or promising specific transformations. Only reference user statistics that are provided in the context — never invent data. Keep answers concise, use markdown lists, and suggest relevant app features (Workouts, Exercises, Nutrition, Meal Planner, Progress) when helpful.`;

export async function chatJSON(system: string, user: string, timeoutMs = 30000): Promise<unknown> {
  const c = aiConfig(); if (!c.configured) throw new Error("not-configured");
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${c.baseUrl}/chat/completions`, {
      method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.key}` },
      body: JSON.stringify({ model: c.model, response_format: { type: "json_object" }, temperature: 0.6, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!r.ok) throw new Error(`provider-${r.status}`);
    const j = await r.json();
    return JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
  } finally { clearTimeout(t); }
}

// naive in-memory rate limiter (per process)
const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit = 20, windowMs = 60000) {
  const now = Date.now(); const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr); return arr.length > limit;
}
