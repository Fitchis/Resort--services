"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function StatusBadge({ status }: { status: string }) {
  // Use theme variables for status colors
  let color = "bg-muted text-muted-foreground border-border";
  if (status === "received")
    color = "bg-primary/10 text-primary border-primary/30";
  if (status === "preparing")
    color =
      "bg-yellow-200/20 text-yellow-300 border-yellow-400/30 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-400/40";
  if (status === "ready")
    color =
      "bg-green-200/20 text-green-400 border-green-400/30 dark:bg-green-900/40 dark:text-green-200 dark:border-green-400/40";
  if (status === "delivered")
    color = "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
      style={{ minWidth: 70, textAlign: "center" }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

type Order = {
  id: string;
  room_number: string;
  status: "received" | "preparing" | "ready" | "delivered";
  total_amount: number;
  created_at: string;
  special_instructions?: string;
};

const COLUMNS: { key: Order["status"]; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersBoard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [soundOn, setSoundOn] = useState(false);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "offline" | "unauthorized"
  >("connecting");
  const esRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef<number>(1000);
  const reconnectTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { data } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ordersSoundOn");
    if (saved === "1") setSoundOn(true);
  }, []);

  async function ensureAudioContext() {
    if (typeof window === "undefined") return;
    const Ctx: any =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx();
    }
    try {
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === "suspended") {
        await ctx.resume();
      }
    } catch {}
  }

  function playBeep() {
    if (!soundOn) return;
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        // If not initialized by user interaction yet, skip sound
        return;
      }
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880; // A5
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      const stopAt = ctx.currentTime + 0.18;
      g.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      o.stop(stopAt);
    } catch {
      // ignore
    }
  }

  // SSE connect with auto-reconnect and status indicator
  useEffect(() => {
    function cleanup() {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {}
        esRef.current = null;
      }
    }

    function scheduleReconnect() {
      setLiveStatus("offline");
      const delay = retryDelayRef.current;
      if (reconnectTimerRef.current) return; // already scheduled
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
      // backoff with a bit of jitter
      const next = Math.min(
        30000,
        Math.floor(delay * 1.5) + Math.floor(Math.random() * 500)
      );
      retryDelayRef.current = next;
    }

    function connect() {
      cleanup();
      setLiveStatus("connecting");
      try {
        const es = new EventSource("/api/orders/stream");
        esRef.current = es;
        es.onopen = () => {
          setLiveStatus("live");
          retryDelayRef.current = 1000;
        };
        es.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg?.type === "created" && msg?.order) {
              const amount =
                typeof msg.order.total_amount === "number"
                  ? (msg.order.total_amount / 100).toFixed(2)
                  : "";
              toast({
                title: "New order",
                description: `Room ${msg.order.room_number}${
                  amount ? ` • $${amount}` : ""
                }`,
              });
              playBeep();
            }
          } catch {
            // ignore non-JSON events (e.g., heartbeat or hello)
          }
          qc.invalidateQueries({ queryKey: ["orders"] });
        };
        es.onerror = async () => {
          try {
            es.close();
          } catch {}
          // Detect unauthorized by probing a staff-only endpoint
          try {
            const res = await fetch("/api/orders", { cache: "no-store" });
            if (res.status === 401) {
              setLiveStatus("unauthorized");
              return;
            }
          } catch {}
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    }

    // Start the connection
    connect();

    // Reconnect when tab becomes visible if offline
    function onVisibility() {
      if (
        document.visibilityState === "visible" &&
        liveStatus !== "live" &&
        liveStatus !== "unauthorized" &&
        !reconnectTimerRef.current
      ) {
        // Attempt a quicker reconnect when user returns
        retryDelayRef.current = Math.min(retryDelayRef.current, 1500);
        connect();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      cleanup();
    };
    // We intentionally exclude liveStatus from deps to avoid reconnect loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, toast, soundOn]);

  const grouped = useMemo(() => {
    const g = new Map<Order["status"], Order[]>();
    COLUMNS.forEach((c) => g.set(c.key, []));
    for (const o of data ?? []) {
      g.get(o.status)?.push(o);
    }
    return g;
  }, [data]);

  const advance = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "advance" }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ordersSoundOn", next ? "1" : "0");
    }
    if (next) {
      // Initialize on user gesture
      ensureAudioContext();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div className="flex items-center gap-2 text-xs">
          {liveStatus === "live" && (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          {liveStatus === "connecting" && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Connecting…
            </span>
          )}
          {liveStatus === "offline" && (
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="size-2 rounded-full bg-red-500" />
              Reconnecting…
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={toggleSound}>
          Sound: {soundOn ? "On" : "Off"}
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <Card key={col.key} className="bg-card border border-card shadow-sm">
            <CardHeader className="sticky top-0 z-10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-card-foreground">
                {col.label}
                <StatusBadge status={col.key} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-x-hidden">
              {(grouped.get(col.key) ?? []).map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-card bg-muted/40 p-4 transition hover:bg-muted/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-base text-card-foreground">
                      Room {o.room_number}
                    </span>
                    <span className="text-right text-lg font-bold text-primary">
                      ${(o.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>#{o.id.slice(0, 8)}</span>
                    <span>
                      {new Date(o.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {o.special_instructions ? (
                    <div className="mt-1 text-xs rounded px-2 py-1 bg-yellow-500/15 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200">
                      <span className="font-medium">Note:</span>{" "}
                      {o.special_instructions}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between mt-2">
                    <StatusBadge status={o.status} />
                    {o.status !== "delivered" && (
                      <Button
                        size="sm"
                        className="ml-2 px-4 py-1 rounded-full bg-primary text-primary-foreground font-semibold shadow-sm hover:shadow transition"
                        onClick={() => advance.mutate(o.id)}
                      >
                        Advance status
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(grouped.get(col.key) ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No orders</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
