"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const value = (formData.get("room") as string | null)?.trim();
    if (!value) {
      setError("Enter a valid room number");
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
    <div className="min-h-[100svh] flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <div className="flex flex-col items-center mb-8 select-none">
        <Image
          src="/placeholder-logo.png"
          alt="Resort Dining Logo"
          width={64}
          height={64}
          className="mb-2 rounded-lg shadow"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Resort Dining
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Room Service Ordering
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Enter your room number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-2" noValidate>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="room"
                className="w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-primary"
                placeholder="e.g. 1203"
                min={1}
                aria-label="Room number"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-invalid={!!error}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-md border bg-primary text-primary-foreground px-4 py-2 text-base font-medium shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <Search className="h-5 w-5" />
                {submitting ? "Checking..." : "Go"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              We will validate the room before showing the menu.
            </p>
            {error ? (
              <p
                role="alert"
                aria-live="polite"
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
