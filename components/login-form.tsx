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
const PIN_RECOVER_URL = "https://api.nextbike.net/api/pinRecover.xml";

export function LoginForm() {
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecoveringPin, setIsRecoveringPin] = useState(false);
  const [pinRecoveryMessage, setPinRecoveryMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mobile || !pin) {
      setError("Please enter both mobile number and PIN.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPinRecoveryMessage(null);

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

      // --- UMAMI TRACKING START ---
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track('Successful Login', { user_id: data.user.id });
      }
      // --- UMAMI TRACKING END ---

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

  async function handlePinRecovery() {
    if (!mobile) {
      setError("Please enter your mobile number first.");
      return;
    }

    setIsRecoveringPin(true);
    setError(null);
    setPinRecoveryMessage(null);

    try {
      await axios.get(PIN_RECOVER_URL, {
        params: {
          apikey: NEXTBIKE_API_KEY,
          version: "1.0",
          mobile: mobile.replace(/\s/g, ""), // Remove any spaces from mobile number
        },
        responseType: "text", // The API returns XML/text
      });

      // The API typically returns a message like "Check phone number for existence"
      // or similar confirmation messages
      setPinRecoveryMessage(
        "PIN recovery message sent! Please check your phone for the PIN. If you don't receive it, please verify your mobile number is correct."
      );
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response
          ? `PIN recovery failed: ${err.response.status} ${err.response.statusText}`
          : "PIN recovery request failed. Please try again.";
      setError(message);
    } finally {
      setIsRecoveringPin(false);
    }
  }

  return (
    <div className="flex items-center justify-center from-background to-muted">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nextbike Analytics Login</CardTitle>
          <CardDescription>Sign in with your Nextbike mobile number and PIN to get started! 🚴</CardDescription>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="pin">PIN</Label>
                <button
                  type="button"
                  onClick={handlePinRecovery}
                  disabled={isLoading || isRecoveringPin || !mobile}
                  className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecoveringPin ? "Sending…" : "Forgot PIN?"}
                </button>
              </div>
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
            {pinRecoveryMessage ? (
              <p className="text-sm text-green-600 dark:text-green-400">{pinRecoveryMessage}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in… 🚴" : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            🔒 Your credentials are sent directly to the official Nextbike API endpoint as this application does not use any backend server or database. Your session data is stored temporarily in your browser&apos;s session storage and is never transmitted to any third-party service. You can clear this data at any time by logging out.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


