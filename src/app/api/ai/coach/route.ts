import { NextRequest } from "next/server";
import { aiConfig, COACH_SYSTEM, rateLimited } from "@/services/ai-provider";
import { fallbackReply, hasRedFlag, SAFETY_REPLY, type CoachContext } from "@/services/coach-kb";

export const dynamic = "force-dynamic";
const enc = new TextEncoder();

function streamText(text: string, source: string) {
  const parts = text.match(/[\s\S]{1,24}/g) ?? [text];
  const body = new ReadableStream({
    async start(ctrl) { for (const p of parts) { ctrl.enqueue(enc.encode(p)); await new Promise((r) => setTimeout(r, 12)); } ctrl.close(); },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Vyora-Source": source } });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited("coach:" + ip, 30)) return new Response("Too many requests — please wait a moment.", { status: 429 });
  let body: { messages: { role: string; content: string }[]; context?: CoachContext | null };
  try { body = await req.json(); } catch { return new Response("Invalid request", { status: 400 }); }
  const msgs = (body.messages ?? []).slice(-16).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 4000) }));
  const last = msgs[msgs.length - 1]?.content ?? "";
  const ctx = body.context ?? {};
  if (hasRedFlag(last)) return streamText(SAFETY_REPLY, "safety");
  const c = aiConfig();
  if (!c.configured) return streamText(fallbackReply(last, ctx), "fallback");
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45000);
  req.signal.addEventListener("abort", () => ctrl.abort());
  try {
    const r = await fetch(`${c.baseUrl}/chat/completions`, {
      method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.key}` },
      body: JSON.stringify({ model: c.model, stream: true, temperature: 0.7, messages: [{ role: "system", content: COACH_SYSTEM + (body.context ? `\n\nUser context (shared with permission): ${JSON.stringify(ctx)}` : "\n\nThe user has not shared their data.") }, ...msgs] }),
    });
    if (!r.ok || !r.body) { clearTimeout(timer); return new Response(`AI provider error (${r.status}).`, { status: 502 }); }
    const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
    const out = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) { clearTimeout(timer); controller.close(); return; }
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const l of lines) {
          const t = l.trim(); if (!t.startsWith("data:")) continue;
          const d = t.slice(5).trim(); if (d === "[DONE]") continue;
          try { const delta = JSON.parse(d).choices?.[0]?.delta?.content; if (delta) controller.enqueue(enc.encode(delta)); } catch {}
        }
      },
      cancel() { ctrl.abort(); },
    });
    return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Vyora-Source": "ai" } });
  } catch {
    clearTimeout(timer);
    return new Response("The AI provider timed out or is unreachable.", { status: 504 });
  }
}
