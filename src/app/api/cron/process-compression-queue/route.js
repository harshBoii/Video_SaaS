// app/api/cron/process-compression-queue/route.js
import { NextResponse } from "next/server";
import { processCompressionQueue } from "@/app/lib/compressionWorker";

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processCompressionQueue();

    return NextResponse.json({
      success: true,
      processed: result ? 1 : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
