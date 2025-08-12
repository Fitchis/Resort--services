"use client";

import { useEffect, useState } from "react";
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
  const step = Math.max(0, STATUS_STEPS.indexOf(status));
  const pct = ((step + 1) / STATUS_STEPS.length) * 100;

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { status: Status };
        if (data.status) setStatus(data.status);
      } catch {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [orderId]);

  return (
    <div className="bg-card border border-card rounded-2xl p-6 shadow-sm space-y-3 text-card-foreground">
      <div className="bg-muted rounded-2xl p-6 space-y-3 text-card-foreground">
        <div className="flex flex-wrap gap-2">
          {STATUS_STEPS.map((s, i) => (
            <Badge key={s} variant={i <= step ? "default" : "outline"}>
              {s[0].toUpperCase() + s.slice(1)}
            </Badge>
          ))}
        </div>
        <Progress value={pct} />
        <p className="text-sm text-muted-foreground">
          Current status: {status}
        </p>
      </div>
    </div>
  );
}
