"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Step = "phone" | "otp";

export function LoginFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [devMode, setDevMode] = useState(false);

  function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(() => {
      void (async () => {
        const res = await fetch("/api/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to send OTP");
          return;
        }
        setDevMode(!!data.dev);
        setStep("otp");
      })();
    });
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(() => {
      void (async () => {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Invalid code");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      })();
    });
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="bg-blue-100 rounded-full p-3">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">SafeCircle</CardTitle>
        <CardDescription>
          {step === "phone" ? "Sign in with your phone number" : "Enter the verification code"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Demo banner */}
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
          <strong>Demo mode</strong> — use any phone number and code <strong>123456</strong>.
          Try <strong>+15550000001</strong> (Alice), <strong>+15550000002</strong> (Bob), or any number.
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+15550000001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isPending || !phone}
            >
              {isPending ? "Sending…" : "Send Code"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            {devMode && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
                Demo mode: use code <strong>123456</strong>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoComplete="one-time-code"
                className="h-12 text-center text-xl tracking-[0.5em] font-mono"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isPending || code.length !== 6}
            >
              {isPending ? "Verifying…" : "Verify"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => { setStep("phone"); setCode(""); setError(""); }}
            >
              Change number
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
