import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appState } from "@/db/schema";
import { eq } from "drizzle-orm";

const valid = (id: string | null) => !!id && /^[a-z0-9-]{8,64}$/i.test(id);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!valid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const rows = await db.select().from(appState).where(eq(appState.id, id!)).limit(1);
    return NextResponse.json({ data: rows[0]?.data ?? null, updatedAt: rows[0]?.updatedAt ?? null });
  } catch { return NextResponse.json({ error: "database unavailable" }, { status: 503 }); }
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!valid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const text = await req.text();
  if (text.length > 2_000_000) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  let data: unknown; try { data = JSON.parse(text); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  try {
    await db.insert(appState).values({ id: id!, data, updatedAt: new Date() }).onConflictDoUpdate({ target: appState.id, set: { data, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "database unavailable" }, { status: 503 }); }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!valid(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try { await db.delete(appState).where(eq(appState.id, id!)); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "database unavailable" }, { status: 503 }); }
}
