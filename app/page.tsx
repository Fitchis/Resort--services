"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState("");

  // Prefill the last used room number if available
  useEffect(() => {
    try {
      const last = localStorage.getItem("lastRoom");
      if (last) setRoom(last);
    } catch {}
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const value = room.trim();
    if (!value) {
      setError("Enter a valid room number");
      return;
    }
    // Basic client-side guard: digits only
    if (!/^\d+$/.test(value)) {
      setError("Room number must be digits only");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(
        `/api/rooms/${encodeURIComponent(value)}/validate`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error("Failed to validate room");
      const data: { ok: boolean } = await res.json();
      if (data.ok) {
        try {
          localStorage.setItem("lastRoom", value);
        } catch {}
        router.push(`/room/${encodeURIComponent(value)}`);
      } else {
        setError("Room not found. Please check your number.");
      }
    } catch {
      setError("Could not validate room. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/40 px-4 py-10">
      <div className="flex flex-col items-center mb-8 select-none">
        <Image
          src="/icon.svg"
          alt="Resort Dining Logo"
          width={64}
          height={64}
          className="mb-2 rounded-xl shadow ring-1 ring-border/50"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Resort Dining
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Room Service Ordering
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Enter your room number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div className="flex items-center gap-2">
              <label htmlFor="room-input" className="sr-only">
                Room number
              </label>
              <Input
                id="room-input"
                type="text"
                name="room"
                value={room}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D+/g, "");
                  setRoom(digitsOnly);
                }}
                inputMode="numeric"
                pattern="\\d*"
                autoComplete="on"
                placeholder="e.g. 1203"
                aria-label="Room number"
                aria-invalid={!!error}
                aria-describedby={error ? "room-help room-error" : "room-help"}
                autoFocus
              />
              <Button type="submit" disabled={submitting} aria-label="Go">
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" /> Go
                  </>
                )}
              </Button>
            </div>
            <p id="room-help" className="text-xs text-muted-foreground">
              We will validate the room before showing the menu.
            </p>
            {error ? (
              <p
                role="alert"
                aria-live="polite"
                id="room-error"
                className="text-sm text-red-600 font-medium"
              >
                {error}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <footer className="mt-10 text-xs text-muted-foreground opacity-70">
        &copy; {new Date().getFullYear()} Resort Dining
      </footer>
    </div>
  );
}
