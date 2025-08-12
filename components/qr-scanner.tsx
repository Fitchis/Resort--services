"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Dynamically import to avoid SSR issues; library exports Scanner
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false }
);

export default function QRScanner({ height = 320 }: { height?: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border">
        <Scanner
          onScan={(detected) => {
            const result = detected?.[0]?.rawValue ?? "";
            try {
              // Expect a URL with /room/:roomNumber
              const url = new URL(result);
              const match = url.pathname.match(/\/room\/(\d+)/);
              const roomNumber = match?.[1] || url.searchParams.get("room");
              if (!roomNumber)
                throw new Error("QR does not contain a valid room number");
              router.push(`/room/${encodeURIComponent(roomNumber)}`);
            } catch {
              // If not a URL, maybe the QR just contains the room number
              const num = result.match(/^\d+$/) ? result : null;
              if (num) {
                router.push(`/room/${encodeURIComponent(num)}`);
              } else {
                setError(
                  "Invalid QR. Please use the room QR provided by the resort."
                );
              }
            }
          }}
          onError={(err: unknown) => {
            setError(
              "Camera error. Please allow camera access or try manual entry."
            );
            console.error(err);
          }}
          constraints={{ facingMode: "environment" }}
          styles={{ container: { width: "100%", height: `${height}px` } }}
        />
      </div>
      {error && (
        <Alert>
          <AlertTitle>QR Scan Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">
          Private: camera never leaves your device
        </Badge>
        <Badge variant="outline">Works offline</Badge>
      </div>
    </div>
  );
}
