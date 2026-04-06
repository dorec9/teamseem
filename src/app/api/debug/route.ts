import { type NextRequest } from "next/server";
import { appendFile, readFile, access } from "fs/promises";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "hook-debug.log");

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = new Date().toISOString();
    const entry = `\n=== ${timestamp} ===\nHeaders: ${JSON.stringify(Object.fromEntries(request.headers))}\nBody: ${body}\n`;

    await appendFile(LOG_PATH, entry, "utf-8");

    return Response.json({ ok: true, logged: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await access(LOG_PATH);
  } catch {
    return new Response("아직 수신된 이벤트 없음", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const content = await readFile(LOG_PATH, "utf-8");
    return new Response(content, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
