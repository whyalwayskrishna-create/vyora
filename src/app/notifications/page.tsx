"use client";
import Link from "next/link";
import { useState } from "react";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, Chip, EmptyState, LinkButton, PageHeader, useUI } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const s = useStore();
  const { confirm } = useUI();
  const [cat, setCat] = useState("all");
  const cats = ["all", ...new Set(s.notifications.map((n) => n.category))];
  const list = s.notifications.filter((n) => cat === "all" || n.category === cat);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Inbox" title="Notifications" subtitle="In-app notifications and reminders." actions={s.notifications.length ? <>
        <Button variant="secondary" onClick={s.markAllRead}><CheckCheck size={15} />Mark all read</Button>
        <Button variant="ghost" onClick={async () => { if (await confirm({ title: "Clear all notifications?", body: "This can't be undone.", danger: true, confirmLabel: "Clear" })) s.clearNotifications(); }}><Trash2 size={15} />Clear</Button></> : undefined} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c[0].toUpperCase() + c.slice(1)}</Chip>)}</div>
      {!list.length ? <EmptyState icon={<BellOff size={20} />} title="You're all caught up" body="Reminders you enable in Settings will appear here at their scheduled time while VYORA is open." action={<LinkButton href="/settings#notifications" size="sm" variant="secondary">Reminder settings</LinkButton>} /> : (
        <Card className="divide-y divide-line p-0">
          {list.map((n) => (
            <div key={n.id} className={cn("flex gap-3 p-4", !n.read && "bg-accent-soft/40")}>
              <div className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl", n.read ? "bg-elevated-2 text-muted" : "bg-accent text-accent-ink")}><Bell size={16} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="text-sm font-bold">{n.title}</p><time className="shrink-0 text-[10px] text-muted">{new Date(n.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
                <p className="text-sm text-muted">{n.body}</p>
                <div className="mt-2 flex gap-3 text-xs font-semibold">
                  {n.href && <Link href={n.href} onClick={() => s.markRead(n.id)} className="text-accent hover:underline">Open</Link>}
                  {!n.read && <button onClick={() => s.markRead(n.id)} className="text-muted hover:text-fg">Mark as read</button>}
                  <button onClick={() => s.set({ notifications: s.notifications.filter((x) => x.id !== n.id) })} className="text-muted hover:text-danger">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
      <p className="mt-4 text-center text-[11px] text-muted">Background/push notifications aren&apos;t enabled in this build — reminders only appear while the app is open.</p>
    </div>
  );
}
