"use client";

import type React from "react";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LockKeyhole, User2 } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrs = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrs.email?.[0],
        password: fieldErrs.password?.[0],
      });
      toast({
        title: "Invalid credentials",
        description: "Check email and password.",
        variant: "destructive",
      });
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.replace("/staff/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: res?.error || "Try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 min-h-[70vh] flex items-center justify-center">
      <Card className="w-full bg-card text-card-foreground border border-card">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyhole className="h-5 w-5" />
            <span className="text-xs">Staff Portal</span>
          </div>
          <CardTitle>Staff login</CardTitle>
          <CardDescription>
            Kitchen staff, managers, and admins only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@resort.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={loading}
                />
                <User2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-5">
            <p className="mb-2 text-xs text-muted-foreground">
              Quick-fill demo accounts (password: demo)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmail("admin@resort.com");
                  setPassword("demo");
                }}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmail("manager@resort.com");
                  setPassword("demo");
                }}
              >
                Manager
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmail("kitchen@resort.com");
                  setPassword("demo");
                }}
              >
                Kitchen
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Your credentials are encrypted in transit. Contact an admin to reset
            access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
