import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demoRequests } from "@/db/schema";

export async function POST(req: NextRequest) {
  const { exerciseId, deviceId } = await req.json().catch(() => ({}));
  if (typeof exerciseId !== "string") return NextResponse.json({ error: "exerciseId required" }, { status: 400 });
  if (!process.env.VIDEO_API_KEY) {
    return NextResponse.json({ status: "unavailable", message: "No AI video generation provider is configured (set VIDEO_API_KEY on the server). Showing the procedural SVG animation instead." });
  }
  try {
    const id = crypto.randomUUID();
    await db.insert(demoRequests).values({ id, deviceId: String(deviceId ?? "anon"), exerciseId, status: "queued" });
    return NextResponse.json({ status: "queued", id, message: "Request queued. Generated videos must be reviewed for movement accuracy before publishing." });
  } catch { return NextResponse.json({ status: "error", message: "Could not queue request." }, { status: 500 }); }
}
