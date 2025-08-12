import { NextResponse } from "next/server";
import { subscribe } from "@/lib/realtime";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

export async function GET(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = (token as { role?: string } | null)?.role;
  const staff = role === "admin" || role === "manager" || role === "kitchen";
  if (!staff) return new NextResponse("Unauthorized", { status: 401 });
  let closed = false;
  let unsub: (() => void) | null = null;
  let hbTimer: number | null = null;

  const stream = new ReadableStream<string>({
    start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          // ignore enqueue on closed controller
        }
      };
      const send = (data: unknown) =>
        safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);
      unsub = subscribe("orders", send);
      // Initial heartbeat
      send({ type: "hello" });
      const heartbeat = () => {
        if (closed) return;
        safeEnqueue(`:\n\n`);
        hbTimer = setTimeout(heartbeat, 15000) as unknown as number;
      };
      hbTimer = setTimeout(heartbeat, 15000) as unknown as number;
    },
    cancel() {
      closed = true;
      if (hbTimer) clearTimeout(hbTimer);
      if (unsub) unsub();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
