import { NextResponse } from "next/server";
import { subscribe } from "@/lib/realtime";
import { getToken } from "next-auth/jwt";

export const runtime = "edge";

async function getTokenWithFallback(request: Request) {
  const secret = process.env.NEXTAUTH_SECRET;
  let t = await getToken({ req: request as any, secret });
  if (t) return t;
  t = await getToken({
    req: request as any,
    secret,
    cookieName: "authjs.session-token",
  });
  if (t) return t;
  t = await getToken({
    req: request as any,
    secret,
    cookieName: "__Secure-authjs.session-token",
  });
  if (t) return t;
  t = await getToken({
    req: request as any,
    secret,
    cookieName: "next-auth.session-token",
  });
  if (t) return t;
  t = await getToken({
    req: request as any,
    secret,
    cookieName: "__Secure-next-auth.session-token",
  });
  return t;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Optional: if you want to restrict by staff or by order ownership, check token here
  await getTokenWithFallback(request);
  const { id } = await params;
  const channel = `order:${id}`;
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
          // ignore enqueue after close
        }
      };
      const send = (data: unknown) =>
        safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);
      unsub = subscribe(channel, send);
      send({ ok: true });
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
  try {
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to open stream" },
      { status: 500 }
    );
  }
}
