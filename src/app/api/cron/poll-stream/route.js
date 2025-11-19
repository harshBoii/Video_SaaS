// app/api/cron/poll-stream/route.js
import { NextResponse } from "next/server";
import { pollStreamStatus } from "@/app/lib/streamPoller";

export async function GET(request) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pollStreamStatus();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Stream polling error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
