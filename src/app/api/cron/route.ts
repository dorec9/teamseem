import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventStore } from "@/lib/store/event-store";

// Vercel cron or manual trigger
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find sessions that have been active, but their agents haven't been seen in 30 minutes
    const staleSessions = await prisma.session.findMany({
      where: {
        status: "active",
        agents: {
          every: {
            lastSeen: {
              lt: thirtyMinutesAgo,
            },
          },
        },
      },
    });

    if (staleSessions.length === 0) {
      return NextResponse.json({ ok: true, stopped: 0 });
    }

    // Mark them as stopped
    const stoppedCount = await prisma.session.updateMany({
      where: {
        id: {
          in: staleSessions.map(s => s.id)
        }
      },
      data: {
        status: "stopped"
      }
    });

    // Notify clients about the state change
    for (const session of staleSessions) {
      eventStore.addEvent({
        type: "SessionStart", // Technically it's an update, but we reuse existing logic
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        agentId: session.id,
        agentName: "System",
        content: "세션이 자동 종료되었습니다.",
        metadata: {
          status: "stopped"
        }
      });
    }

    return NextResponse.json({ ok: true, stopped: stoppedCount.count });
  } catch (error: any) {
    console.error("[CRON] Error stopping stale sessions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
