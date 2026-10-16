"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUp, Bot, Check, Copy, RotateCcw, Shield, Square, Trash2, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCoachContext } from "@/lib/hooks";
import type { ChatMessage } from "@/types";
import { Badge, Button, Notice, useUI } from "@/components/ui";
import { cn, uid } from "@/lib/utils";

const PROMPTS = ["Build a workout for today", "Explain how to perform a squat", "Help me plan my meals", "Explain protein, carbohydrates, and fat", "Suggest alternatives to barbell squats", "Help me understand my workout history", "Create a beginner-friendly routine", "How do rest and recovery support training?"];

function inline(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith("**") ? <strong key={i} className="font-bold text-fg">{p.slice(2, -2)}</strong> : p.startsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em> : p.startsWith("`") ? <code key={i} className="rounded bg-elevated-2 px-1 text-[0.85em]">{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>);
}
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n"); const out: ReactNode[] = []; let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => { if (list) { const L = list.ordered ? "ol" : "ul"; out.push(<L key={out.length} className={cn("my-1.5 space-y-1 pl-5", list.ordered ? "list-decimal" : "list-disc")}>{list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</L>); list = null; } };
  lines.forEach((l) => {
    const ol = l.match(/^\s*\d+\.\s+(.*)/); const ul = l.match(/^\s*[-•]\s+(.*)/);
    if (ol) { if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; } list.items.push(ol[1]); }
    else if (ul) { if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; } list.items.push(ul[1]); }
    else { flush(); if (l.trim().startsWith("#")) out.push(<p key={out.length} className="mt-2 font-bold">{inline(l.replace(/^#+\s*/, ""))}</p>); else if (l.trim()) out.push(<p key={out.length} className="my-1">{inline(l)}</p>); }
  });
  flush(); return <>{out}</>;
}

export default function Coach() {
  const s = useStore();
  const ctx = useCoachContext();
  const { toast, confirm } = useUI();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<{ chat: boolean; model: string | null } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { fetch("/api/ai/status").then((r) => r.json()).then(setStatus).catch(() => setStatus({ chat: false, model: null })); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [s.chat]);
  const minor = s.profile.ageRange === "Under 18";

  const send = async (text: string, history?: ChatMessage[]) => {
    const t = text.trim(); if (!t || busy) return;
    const base = history ?? useStore.getState().chat;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: t.slice(0, 4000), at: new Date().toISOString() };
    if (!history) s.addChat(userMsg);
    const aId = uid();
    s.addChat({ id: aId, role: "assistant", content: "", at: new Date().toISOString() });
    setInput(""); setBusy(true);
    const ctrl = new AbortController(); abort.current = ctrl;
    try {
      const msgs = [...base.filter((m) => !m.error && m.content), ...(history ? [] : [userMsg])].map((m) => ({ role: m.role, content: m.content }));
      const r = await fetch("/api/ai/coach", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs, context: ctx ? { ...ctx, minor } : null }) });
      if (!r.ok || !r.body) { const msg = await r.text().catch(() => ""); throw new Error(msg || `Error ${r.status}`); }
      const src = r.headers.get("X-Vyora-Source") === "ai" ? "ai" : "fallback";
      const reader = r.body.getReader(); const dec = new TextDecoder(); let acc = "";
      for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); s.updateChat(aId, { content: acc, source: src }); }
      if (!acc) s.updateChat(aId, { content: "I didn't get a response. Please try again.", error: true });
    } catch (e) {
      if ((e as Error).name === "AbortError") { const cur = useStore.getState().chat.find((m) => m.id === aId); s.updateChat(aId, { content: (cur?.content || "") + (cur?.content ? "\n\n*— stopped*" : "*Generation stopped.*") }); }
      else s.updateChat(aId, { content: (e as Error).message || "Something went wrong.", error: true });
    } finally { setBusy(false); abort.current = null; }
  };
  const retry = (id: string) => {
    const idx = s.chat.findIndex((m) => m.id === id); if (idx < 1) return;
    const prevUser = [...s.chat.slice(0, idx)].reverse().find((m) => m.role === "user"); if (!prevUser) return;
    const history = s.chat.slice(0, idx);
    s.set({ chat: history });
    void send(prevUser.content, history);
  };
  const copy = async (m: ChatMessage) => { try { await navigator.clipboard.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 1500); } catch { toast("Couldn't copy", "error"); } };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col lg:h-[calc(100dvh-5.5rem)]">
      <div className="flex items-center gap-3 pb-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink"><Bot size={22} /></div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-extrabold">VYORA Coach</h1>
          <p className="truncate text-xs text-muted">{status === null ? "Checking AI status…" : status.chat ? <>Connected to <b>{status.model}</b> via server</> : <>Offline guide mode — no AI provider configured</>}</p>
        </div>
        {s.chat.length > 0 && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm({ title: "Clear conversation?", body: "All messages will be deleted from this device.", danger: true, confirmLabel: "Clear" })) s.clearChat(); }}><Trash2 size={14} />Clear</Button>}
      </div>

      <div className="flex-1 overflow-y-auto rounded-3xl border border-line bg-surface p-4" aria-live="polite">
        {!s.chat.length ? (
          <div className="flex h-full flex-col items-center justify-center text-center anim-fade-up">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-3xl bg-accent-soft text-accent"><Bot size={26} /></div>
            <h2 className="text-xl font-extrabold">Hi{ s.profile.name ? `, ${s.profile.name}` : ""}! How can I help?</h2>
            <p className="mt-1 max-w-md text-sm text-muted">Ask about training, technique, nutrition or recovery. {ctx ? "I can see your logged activity summary (you can turn this off in Settings)." : "Data sharing is off, so I can't see your logs."}</p>
            <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">{PROMPTS.map((p) => <button key={p} onClick={() => send(p)} className="press rounded-2xl border border-line bg-elevated px-4 py-3 text-left text-sm hover:border-accent/50">{p}</button>)}</div>
          </div>
        ) : (
          <ul className="space-y-5">
            {s.chat.map((m, i) => (
              <li key={m.id} className={cn("flex gap-3 anim-fade-up", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", m.role === "user" ? "bg-elevated-2 text-fg" : "bg-accent text-accent-ink")} aria-hidden>{m.role === "user" ? <User size={15} /> : <Bot size={15} />}</div>
                <div className={cn("min-w-0 max-w-[85%]", m.role === "user" && "text-right")}>
                  <div className={cn("inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed", m.role === "user" ? "rounded-tr-md bg-accent text-accent-ink" : m.error ? "rounded-tl-md border border-danger/30 bg-danger/5" : "rounded-tl-md bg-elevated text-fg/90")}>
                    {m.role === "assistant" && !m.content && busy && i === s.chat.length - 1 ? <span className="typing flex gap-1 py-1.5" aria-label="Coach is typing"><span /><span /><span /></span>
                      : m.error ? <span className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" />{m.content}</span>
                      : m.role === "assistant" ? <Markdown text={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
                  </div>
                  <div className={cn("mt-1 flex items-center gap-2 text-[10px] text-muted", m.role === "user" && "justify-end")}>
                    <time>{new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                    {m.role === "assistant" && m.source && <Badge className="!py-0 !text-[9px]">{m.source === "ai" ? "AI" : "Offline guide"}</Badge>}
                    {m.role === "assistant" && m.content && !(busy && i === s.chat.length - 1) && <>
                      <button onClick={() => copy(m)} className="flex items-center gap-1 hover:text-fg" aria-label="Copy response">{copied === m.id ? <Check size={11} /> : <Copy size={11} />}{copied === m.id ? "Copied" : "Copy"}</button>
                      <button onClick={() => retry(m.id)} className="flex items-center gap-1 hover:text-fg" aria-label="Retry response"><RotateCcw size={11} />Retry</button>
                    </>}
                  </div>
                </div>
              </li>
            ))}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      <div className="pt-3">
        {minor && <Notice className="mb-2">Since you&apos;re under 18, please involve a parent, guardian, or coach in training and nutrition decisions.</Notice>}
        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-accent/60">
          <textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={4000} placeholder="Ask your coach…" aria-label="Message"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
            className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted" />
          {busy ? <Button type="button" size="icon" variant="secondary" onClick={() => abort.current?.abort()} aria-label="Stop generating"><Square size={15} /></Button>
            : <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message"><ArrowUp size={18} /></Button>}
        </form>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted"><Shield size={11} />General guidance only — not medical advice. Stop and seek care for chest pain, fainting or sharp pain. <Link href="/settings#ai" className="underline">Privacy</Link></p>
      </div>
    </div>
  );
}
