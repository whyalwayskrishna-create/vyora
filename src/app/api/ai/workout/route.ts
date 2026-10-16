import { NextRequest, NextResponse } from "next/server";
import { aiConfig, chatJSON, rateLimited } from "@/services/ai-provider";
import { generateWorkoutPlanLocal, validatePlan, allowedEquipment, type GenPrefs } from "@/services/workout-generator";
import { EXERCISES } from "@/data/exercises";

export async function POST(req: NextRequest) {
  if (rateLimited("wk:" + (req.headers.get("x-forwarded-for") ?? "l"), 10)) return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
  let p: GenPrefs; try { p = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!p.goal || !p.experience || !Array.isArray(p.days) || !p.days.length) return NextResponse.json({ error: "Goal, experience and at least one training day are required." }, { status: 422 });
  if (aiConfig().configured) {
    try {
      const eq = allowedEquipment(p.equipment);
      const lib = EXERCISES.filter((e) => e.equipment.every((x) => eq.has(x))).map((e) => `${e.id}|${e.muscle}|${e.difficulty}`).join("\n");
      const raw = await chatJSON("You are a careful strength coach. Return ONLY JSON matching: {name, summary, days:[{day,title,focus,warmup:string[],exercises:[{exerciseId,sets,reps,restSec,durationSec?}],cooldown:string[]}], progression:string[], substitutions:[{from,to,reason}], notes:string[]}. Use only exerciseId values from the provided library. Be conservative and safe.",
        `Preferences: ${JSON.stringify(p)}\nLibrary (id|muscle|difficulty):\n${lib}`);
      const plan = validatePlan(raw);
      if (plan) return NextResponse.json({ source: "ai", model: aiConfig().model, plan });
    } catch { /* fall through to rules engine, reported honestly */
      return NextResponse.json({ source: "rules", plan: generateWorkoutPlanLocal(p), notice: "The AI provider failed, so the rules-based planner was used instead." });
    }
  }
  return NextResponse.json({ source: "rules", plan: generateWorkoutPlanLocal(p) });
}
