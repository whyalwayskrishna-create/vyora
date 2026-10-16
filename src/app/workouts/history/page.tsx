"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, History, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Segmented, Stat, useUI } from "@/components/ui";
import { fmtDuration, lastNDays } from "@/lib/utils";
import { sessionStats } from "@/lib/workout";

export default function HistoryPage() {
  const s = useStore();
  const { confirm, toast } = useUI();
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");
  const list = useMemo(() => { const days = range === "all" ? null : new Set(lastNDays(Number(range))); return s.sessions.filter((x) => !days || days.has(x.startedAt.slice(0, 10))).sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }, [s.sessions, range]);
  const totalMin = Math.round(list.reduce((a, b) => a + b.durationSec, 0) / 60);
  const totalSets = list.reduce((a, b) => a + sessionStats(b).sets, 0);
  return (
    <div>
      <PageHeader eyebrow="Workouts" title="Workout history" subtitle="Every session you've recorded." actions={<Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7d" }, { value: "30", label: "30d" }, { value: "90", label: "90d" }, { value: "all", label: "All" }]} />} />
      <div className="mb-5 grid grid-cols-3 gap-3"><Stat label="Sessions" value={list.length} /><Stat label="Total time" value={`${totalMin} min`} /><Stat label="Sets" value={totalSets} /></div>
      {!list.length ? <EmptyState icon={<History size={20} />} title="No sessions in this range" body="Complete a workout and it will appear here." action={<LinkButton href="/workouts">Start a workout</LinkButton>} /> : (
        <Card className="divide-y divide-line p-0">
          {list.map((x) => { const st = sessionStats(x); return (
            <div key={x.id} className="flex items-center gap-3 p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-elevated text-center"><div><p className="text-[9px] font-bold uppercase text-muted">{new Date(x.startedAt).toLocaleDateString("en-US", { month: "short" })}</p><p className="text-sm font-extrabold leading-none">{new Date(x.startedAt).getDate()}</p></div></div>
              <Link href={`/workouts/history/${x.id}`} className="min-w-0 flex-1"><p className="truncate font-semibold hover:text-accent">{x.planName} {x.demo && <Badge className="ml-1">Demo</Badge>}</p><p className="tabular text-xs text-muted">{fmtDuration(x.durationSec)} · {st.exercisesDone} exercises · {st.sets} sets{x.effort ? ` · effort ${x.effort}/10` : ""}</p></Link>
              <button onClick={async () => { if (await confirm({ title: "Delete session?", body: "This removes it from your history and charts.", danger: true, confirmLabel: "Delete" })) { s.set({ sessions: s.sessions.filter((y) => y.id !== x.id) }); toast("Session deleted"); } }} className="press rounded-lg p-2 text-muted hover:text-danger" aria-label="Delete session"><Trash2 size={15} /></button>
              <Link href={`/workouts/history/${x.id}`} aria-label="Open summary"><ChevronRight size={16} className="text-muted" /></Link>
            </div>); })}
        </Card>
      )}
    </div>
  );
}
