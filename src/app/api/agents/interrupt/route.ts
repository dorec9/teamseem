import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/db";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { agentId, action } = await req.json();

    if (!agentId || !action) {
      return NextResponse.json(
        { error: "agentId and action are required" },
        { status: 400 },
      );
    }

    console.log(`[Interrupt API] Action '${action}' requested for agent ${agentId}`);

    if (action === "stop") {
      // 1. Notify the dashboard by firing a Stop event manually
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (agent) {
        await fetch(new URL("/api/events", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: agent.parentAgentId ? "SubagentStop" : "Stop",
            sessionId: agent.sessionId,
            timestamp: new Date().toISOString(),
            agentId: agent.id,
            agentName: agent.name,
            metadata: { terminationReason: "User manually interrupted the agent from TeamSeem UI." }
          })
        }).catch(err => console.error("[Interrupt API] Failed to broadcast stop event:", err));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Interrupt signal '${action}' sent to agent ${agentId}`,
    });
  } catch (error) {
    console.error("Failed to process interrupt request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
