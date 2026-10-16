"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { EXERCISES, EX_BY_ID, MUSCLE_GROUPS, EQUIPMENT_LIST } from "@/data/exercises";
import { useStore } from "@/lib/store";
import { Chip, DifficultyBadge, EmptyState, PageHeader, Segmented } from "@/components/ui";
import { ExerciseThumb } from "@/components/exercises/ExerciseAnimation";
import { cn } from "@/lib/utils";

const DIFF_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function ExerciseLibrary() {
  const params = useSearchParams();
  const fav = useStore((s) => s.favExercises);
  const recent = useStore((s) => s.recentExercises);
  const toggleFav = useStore((s) => s.toggleFavExercise);
  const [view, setView] = useState<"all" | "favorites" | "recent">((params.get("view") as "favorites") ?? "all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [muscle, setMuscle] = useState<string>(params.get("muscle") ?? "All");
  const [equip, setEquip] = useState("Any");
  const [diff, setDiff] = useState("Any");
  const [loc, setLoc] = useState("Any");
  const [sort, setSort] = useState("name");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let base = view === "favorites" ? fav.map((id) => EX_BY_ID[id]).filter(Boolean) : view === "recent" ? recent.map((id) => EX_BY_ID[id]).filter(Boolean) : EXERCISES;
    base = base.filter((e) =>
      (muscle === "All" || e.muscle === muscle) && (equip === "Any" || e.equipment.includes(equip as never)) && (diff === "Any" || e.difficulty === diff) &&
      (loc === "Any" || e.location.includes(loc as "Home")) && (!t || e.name.toLowerCase().includes(t) || e.tags.some((x) => x.includes(t))));
    if (view === "all") base = [...base].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "difficulty" ? DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty] : a.muscle.localeCompare(b.muscle));
    return base;
  }, [q, muscle, equip, diff, loc, sort, view, fav, recent]);
  const filtersOn = muscle !== "All" || equip !== "Any" || diff !== "Any" || loc !== "Any" || q;
  const clear = () => { setMuscle("All"); setEquip("Any"); setDiff("Any"); setLoc("Any"); setQ(""); };

  return (
    <div>
      <PageHeader eyebrow="Library" title="Exercises" subtitle={`${EXERCISES.length} exercises with animated cartoon demonstrations`}
        actions={<Segmented value={view} onChange={setView} options={[{ value: "all", label: "All" }, { value: "favorites", label: `Favorites (${fav.length})` }, { value: "recent", label: "Recent" }]} />} />
      <div className="sticky top-14 z-20 -mx-4 space-y-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search by name, muscle, equipment…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exercises" />
            {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setQ("")} aria-label="Clear search"><X size={15} /></button>}
          </div>
          <div className="hidden rounded-xl border border-line bg-elevated p-1 sm:flex">
            <button onClick={() => setLayout("grid")} aria-pressed={layout === "grid"} aria-label="Grid view" className={cn("rounded-lg p-1.5", layout === "grid" ? "bg-elevated-2 text-accent" : "text-muted")}><LayoutGrid size={16} /></button>
            <button onClick={() => setLayout("list")} aria-pressed={layout === "list"} aria-label="List view" className={cn("rounded-lg p-1.5", layout === "list" ? "bg-elevated-2 text-accent" : "text-muted")}><List size={16} /></button>
          </div>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">{["All", ...MUSCLE_GROUPS].map((m) => <Chip key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Chip>)}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <SlidersHorizontal size={14} className="text-muted" />
          <select aria-label="Equipment" className="input !w-auto !py-1.5 text-xs" value={equip} onChange={(e) => setEquip(e.target.value)}><option value="Any">Any equipment</option>{EQUIPMENT_LIST.map((x) => <option key={x}>{x}</option>)}</select>
          <select aria-label="Difficulty" className="input !w-auto !py-1.5 text-xs" value={diff} onChange={(e) => setDiff(e.target.value)}><option value="Any">Any level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
          <select aria-label="Location" className="input !w-auto !py-1.5 text-xs" value={loc} onChange={(e) => setLoc(e.target.value)}><option value="Any">Home or gym</option><option>Home</option><option>Gym</option></select>
          {view === "all" && <select aria-label="Sort" className="input !w-auto !py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Sort: A–Z</option><option value="difficulty">Sort: Difficulty</option><option value="muscle">Sort: Muscle</option></select>}
          {filtersOn && <button onClick={clear} className="font-semibold text-accent hover:underline">Clear filters</button>}
          <span className="ml-auto text-muted">{list.length} results</span>
        </div>
      </div>

      <div className="mt-5">
        {!list.length ? (
          <EmptyState icon={view === "favorites" ? <Heart size={20} /> : <Search size={20} />} title={view === "favorites" && !fav.length ? "No favorites yet" : view === "recent" && !recent.length ? "Nothing viewed yet" : "No exercises match"}
            body={view === "favorites" && !fav.length ? "Tap the heart on any exercise to save it here." : "Try removing a filter or searching another term."}
            action={filtersOn ? <button onClick={clear} className="text-sm font-semibold text-accent">Clear filters</button> : <button onClick={() => setView("all")} className="text-sm font-semibold text-accent">Browse all exercises</button>} />
        ) : layout === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 stagger">
            {list.map((e) => (
              <div key={e.id} className="card group relative overflow-hidden transition hover:border-accent/40">
                <Link href={`/exercises/${e.id}`} className="block">
                  <ExerciseThumb ex={e} className="aspect-square transition group-hover:scale-[1.02]" />
                  <div className="p-3"><p className="truncate text-sm font-bold">{e.name}</p><p className="truncate text-[11px] text-muted">{e.muscle} · {e.equipment.join(", ")}</p><div className="mt-2"><DifficultyBadge d={e.difficulty} /></div></div>
                </Link>
                <button onClick={() => toggleFav(e.id)} aria-pressed={fav.includes(e.id)} aria-label={`${fav.includes(e.id) ? "Remove" : "Add"} ${e.name} favorite`} className="press absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-bg/70 backdrop-blur"><Heart size={15} className={fav.includes(e.id) ? "fill-accent text-accent" : "text-muted"} /></button>
              </div>
            ))}
          </div>
        ) : (
          <ul className="card divide-y divide-line">
            {list.map((e) => (
              <li key={e.id} className="flex items-center gap-3 p-3">
                <Link href={`/exercises/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <ExerciseThumb ex={e} className="h-14 w-14 shrink-0 rounded-xl" />
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{e.name}</p><p className="truncate text-xs text-muted">{e.muscle} · {e.equipment.join(", ")} · {e.pattern}</p></div>
                </Link>
                <DifficultyBadge d={e.difficulty} />
                <button onClick={() => toggleFav(e.id)} aria-label="Toggle favorite" className="press p-2"><Heart size={16} className={fav.includes(e.id) ? "fill-accent text-accent" : "text-muted"} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
