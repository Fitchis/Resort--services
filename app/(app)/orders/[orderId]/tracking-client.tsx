"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const STATUS_STEPS = ["received", "preparing", "ready", "delivered"] as const;
type Status = (typeof STATUS_STEPS)[number];

export default function OrderTrackingClient({
  orderId = "",
  initialStatus = "received",
}: {
  orderId?: string;
  initialStatus?: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [liveStatus, setLiveStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const esRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef<number>(1000);
  const reconnectTimerRef = useRef<number | null>(null);
  const step = Math.max(0, STATUS_STEPS.indexOf(status));
  const pct = ((step + 1) / STATUS_STEPS.length) * 100;

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
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
      const next = Math.min(
        15000,
        Math.floor(delay * 1.5) + Math.floor(Math.random() * 500)
      );
      retryDelayRef.current = next;
    }

    function connect() {
      cleanup();
      setLiveStatus("connecting");
      try {
        const es = new EventSource(`/api/orders/${orderId}/stream`);
        esRef.current = es;
        es.onopen = () => {
          setLiveStatus("live");
          retryDelayRef.current = 1000;
        };
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data) as { status?: Status };
            if (data.status) setStatus(data.status);
          } catch {}
        };
        es.onerror = () => {
          try {
            es.close();
          } catch {}
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    }

    connect();

    function onVisibility() {
      if (
        document.visibilityState === "visible" &&
        liveStatus !== "live" &&
        !reconnectTimerRef.current
      ) {
        retryDelayRef.current = Math.min(retryDelayRef.current, 1500);
        connect();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const pretty = (s: Status) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="bg-card border border-card rounded-2xl p-6 shadow-sm space-y-3 text-card-foreground">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
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
      <div className="bg-muted rounded-2xl p-6 space-y-3 text-card-foreground">
        <div className="flex flex-wrap gap-2">
          {STATUS_STEPS.map((s, i) => (
            <Badge key={s} variant={i <= step ? "default" : "outline"}>
              {pretty(s)}
            </Badge>
          ))}
        </div>
        <Progress value={pct} />
        <p className="text-sm text-muted-foreground">
          Current status: {pretty(status)}
        </p>
      </div>
    </div>
  );
}
