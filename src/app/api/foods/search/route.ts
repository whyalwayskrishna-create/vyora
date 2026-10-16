import { NextRequest, NextResponse } from "next/server";
import { offToFood } from "../off";
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ foods: [] });
  try {
    const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=12&fields=code,product_name,brands,nutriments,serving_quantity,allergens_tags`, { headers: { "User-Agent": "VYORA/1.0 (demo)" }, signal: AbortSignal.timeout(12000) });
    const j = await r.json();
    const foods = (j.products ?? []).map(offToFood).filter(Boolean);
    return NextResponse.json({ foods });
  } catch { return NextResponse.json({ error: "Open Food Facts is unreachable right now." }, { status: 502 }); }
}
