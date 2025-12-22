"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NEXTBIKE_API_KEY } from "@/config";


type NextbikeUser = {
  id: number;
  fail_count: number;
  mobile: string;
  email: string;
  loginkey: string;
};

type LoginResponse = {
  server_time: number;
  user: NextbikeUser;
};

const LOGIN_URL = "https://api.nextbike.net/api/v1.1/login.json";

export function LoginForm() {
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mobile || !pin) {
      setError("Please enter both mobile number and PIN.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<LoginResponse>(LOGIN_URL, {
        // Let the browser set standard headers (User-Agent, Accept, etc.)
        // Adding custom headers here can cause CORS preflight failures.
        params: {
          api_key: NEXTBIKE_API_KEY,
          mobile,
          pin,
        },
      });

      if (!response.data?.user) {
        setError("Login failed. Please check your credentials.");
        return;
      }

      const data = response.data;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("nextbike_session", JSON.stringify(data));
      }

      router.push("/analytics");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response
          ? `Login failed: ${err.response.status} ${err.response.statusText}`
          : "Login request failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center from-background to-muted">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nextbike Analytics Login</CardTitle>
          <CardDescription>Sign in with your Nextbike mobile number and PIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile number</Label>
              <Input
                id="mobile"
                name="mobile"
                placeholder="e.g. +49123456789"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                disabled={isLoading}
                autoComplete="tel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Your credentials are sent directly to the official Nextbike API endpoint as this application does not use any backend server or database. Your session data is stored temporarily in your browser&apos;s session storage and is never transmitted to any third-party service. You can clear this data at any time by logging out.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


