import { NextResponse } from "next/server";
import { authenticateRequest, hasPermission } from "@/app/lib/auth";
import {
  processQueue,
  getQueueStats,
  retryFailedItems,
} from "@/app/lib/streamQueue";

// Get queue statistics
export async function GET(request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;

    // Only admins can view queue stats
    if (!user.isAdmin && !hasPermission(user, "manage_stream_queue")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[QUEUE STATS ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get queue statistics" },
      { status: 500 }
    );
  }
}

// Manually trigger queue processing
export async function POST(request) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;

    // Only admins can trigger processing
    if (!user.isAdmin && !hasPermission(user, "manage_stream_queue")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, batchSize } = body;

    if (action === "process") {
      const results = await processQueue(batchSize || 5);
      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} items`,
        processed: results.length,
      });
    }

    if (action === "retry") {
      const retried = await retryFailedItems();
      return NextResponse.json({
        success: true,
        message: `Queued ${retried} failed items for retry`,
        retried,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'process' or 'retry'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[QUEUE ACTION ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process queue action" },
      { status: 500 }
    );
  }
}
