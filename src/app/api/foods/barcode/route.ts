import { NextRequest, NextResponse } from "next/server";
import { offToFood } from "../off";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!/^\d{6,14}$/.test(code)) return NextResponse.json({ error: "Enter a valid 6–14 digit barcode." }, { status: 400 });
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=code,product_name,brands,nutriments,serving_quantity,allergens_tags`, { headers: { "User-Agent": "VYORA/1.0 (demo)" }, signal: AbortSignal.timeout(10000) });
    const j = await r.json();
    if (j.status !== 1 || !j.product) return NextResponse.json({ error: "Product not found in Open Food Facts." }, { status: 404 });
    const food = offToFood(j.product);
    if (!food) return NextResponse.json({ error: "Product found but nutrition data is incomplete." }, { status: 422 });
    return NextResponse.json({ food });
  } catch { return NextResponse.json({ error: "Open Food Facts is unreachable right now." }, { status: 502 }); }
}
