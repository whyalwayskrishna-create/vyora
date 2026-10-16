"use client";
import { useState } from "react";
import { Check, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card, EmptyState, LinkButton, PageHeader, useUI } from "@/components/ui";
import { cn, uid } from "@/lib/utils";

export default function Grocery() {
  const s = useStore();
  const { confirm, toast } = useUI();
  const [name, setName] = useState("");
  const groups = s.grocery.reduce<Record<string, typeof s.grocery>>((acc, g) => { (acc[g.category] ??= []).push(g); return acc; }, {});
  const toggle = (id: string) => s.setGrocery(s.grocery.map((g) => g.id === id ? { ...g, have: !g.have } : g));
  const add = () => { const n = name.trim(); if (!n) return; s.setGrocery([...s.grocery, { id: "manual-" + uid(), name: n.slice(0, 60), grams: 0, have: false, category: "Other" }]); setName(""); };
  const remaining = s.grocery.filter((g) => !g.have).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Nutrition" title="Grocery list" subtitle={`${remaining} items to buy`} actions={s.grocery.length ? <>
        <Button variant="secondary" onClick={() => { s.setGrocery(s.grocery.filter((g) => !g.have)); toast("Checked items cleared"); }}>Clear checked</Button>
        <Button variant="danger" onClick={async () => { if (await confirm({ title: "Clear grocery list?", body: "All items will be removed.", danger: true, confirmLabel: "Clear all" })) s.setGrocery([]); }}><Trash2 size={15} />Clear all</Button></> : undefined} />
      <form className="mb-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}><input className="input" placeholder="Add an item…" value={name} onChange={(e) => setName(e.target.value)} aria-label="New grocery item" /><Button type="submit" disabled={!name.trim()}><Plus size={15} />Add</Button></form>
      {!s.grocery.length ? <EmptyState icon={<ShoppingCart size={20} />} title="Your list is empty" body="Generate a meal plan or add ingredients from any recipe." action={<LinkButton href="/nutrition/planner">Open meal planner</LinkButton>} /> : (
        <div className="space-y-4">{Object.entries(groups).map(([cat, items]) => (
          <Card key={cat} className="p-0"><p className="border-b border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted">{cat}</p>
            <ul className="divide-y divide-line">{items.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggle(g.id)} aria-pressed={g.have} aria-label={`${g.have ? "Uncheck" : "Check"} ${g.name}`} className={cn("press grid h-6 w-6 place-items-center rounded-lg border", g.have ? "border-accent bg-accent text-accent-ink" : "border-line")}>{g.have && <Check size={14} />}</button>
                <span className={cn("flex-1 text-sm", g.have && "text-muted line-through")}>{g.name}</span>
                {g.grams > 0 && <span className="tabular text-xs text-muted">{Math.round(g.grams)} g</span>}
                <button onClick={() => s.setGrocery(s.grocery.filter((x) => x.id !== g.id))} className="p-1 text-muted hover:text-danger" aria-label={`Remove ${g.name}`}><Trash2 size={14} /></button>
              </li>))}</ul></Card>))}
        </div>
      )}
    </div>
  );
}
