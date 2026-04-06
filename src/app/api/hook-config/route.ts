import { type NextRequest } from "next/server";
import { generateHookConfig } from "@/lib/hook-config";

const DEFAULT_SERVER_URL = "http://localhost:3000";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") || DEFAULT_SERVER_URL;
  const config = generateHookConfig(url);
  return Response.json(config);
}
