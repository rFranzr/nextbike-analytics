"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LIST_URL = "https://api.nextbike.net/api/v1.1/list.json";
const API_KEY = "rXXqTgQZUPZ89lzB";

type ListUser = {
  id: number;
  email: string;
  screen_name: string;
};

type AccountItem = {
  id: number;
  node: string;
};

type ListResponse = {
  server_time: number;
  user: ListUser;
  account?: {
    items?: AccountItem[];
  };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const stored = typeof window !== "undefined"
          ? window.sessionStorage.getItem("nextbike_session")
          : null;

        if (!stored) {
          setError("No active session found. Please log in again.");
          return;
        }

        const session = JSON.parse(stored) as { user?: { loginkey?: string } };
        const loginkey = session.user?.loginkey;

        if (!loginkey) {
          setError("No login key found in session. Please log in again.");
          return;
        }

        const response = await axios.get<ListResponse>(LIST_URL, {
          params: {
            apikey: API_KEY,
            loginkey,
            limit: 10000000000,
          },
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response
            ? `Failed to load rides: ${err.response.status} ${err.response.statusText}`
            : "Failed to load rides. Please try again.";
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const user = data?.user;
  const rides = data?.account?.items ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted px-4 py-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-lg font-semibold">
            {user?.screen_name ?? "Nextbike Analytics"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {user ? (
              <>
                User ID: <span className="font-mono">{user.id}</span> · Email:{" "}
                <span className="font-mono break-all">{user.email}</span>
              </>
            ) : (
              "Loading user information…"
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.removeItem("nextbike_session");
            }
            router.push("/");
          }}
        >
          Log out
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rides overview</CardTitle>
            <CardDescription>
              All rides downloaded from Nextbike. Further analytics will be built
              on top of this data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading && <p>Loading rides…</p>}
            {!loading && error && (
              <p className="text-destructive">{error}</p>
            )}
            {!loading && !error && (
              <p>
                Loaded{" "}
                <span className="font-mono">{rides.length}</span>{" "}
                rides.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


