import { NextResponse } from "next/server";
import { aiConfig } from "@/services/ai-provider";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = aiConfig();
  return NextResponse.json({
    chat: c.configured, model: c.configured ? c.model : null,
    vision: c.configured && process.env.VISION_ENABLED !== "false",
    video: !!process.env.VIDEO_API_KEY,
    foodDatabase: "Open Food Facts (public, no key)",
  });
}
