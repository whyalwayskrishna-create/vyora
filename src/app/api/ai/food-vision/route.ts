import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/services/ai-provider";
import { FOODS } from "@/data/foods";

export async function POST(req: NextRequest) {
  const c = aiConfig();
  if (!c.configured || process.env.VISION_ENABLED === "false") return NextResponse.json({ error: "Image recognition is not configured. Set OPENAI_API_KEY on the server to enable it. Use manual search instead." }, { status: 501 });
  const { image } = await req.json().catch(() => ({ image: null }));
  if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 6_000_000) return NextResponse.json({ error: "Please upload a JPG or PNG under ~4 MB." }, { status: 400 });
  try {
    const r = await fetch(`${c.baseUrl}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.key}` },
      body: JSON.stringify({ model: c.model, response_format: { type: "json_object" }, messages: [
        { role: "system", content: `Identify foods in the photo. Return JSON {items:[{foodId, label, grams, confidence}]}. foodId must be one of: ${FOODS.map((f) => f.id).join(",")} or null. Grams is a rough estimate.` },
        { role: "user", content: [{ type: "text", text: "What foods are in this photo?" }, { type: "image_url", image_url: { url: image } }] }] }),
    });
    if (!r.ok) return NextResponse.json({ error: `Vision provider error (${r.status})` }, { status: 502 });
    const j = await r.json(); const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    return NextResponse.json({ source: "ai", items: Array.isArray(parsed.items) ? parsed.items.slice(0, 6) : [] });
  } catch { return NextResponse.json({ error: "Vision request failed." }, { status: 502 }); }
}
