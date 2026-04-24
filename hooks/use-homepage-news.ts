"use client";

import { useEffect, useState } from "react";
import type { HomepageNewsEnvelope } from "@/types/navigation";
import type { NormalizedEnvelope, DataFreshness, DataAvailability } from "@/types/contracts";

export type HomepageNewsState = {
  data: HomepageNewsEnvelope | null;
  freshness: DataFreshness;
  availability: DataAvailability;
  isLoading: boolean;
  error: string | null;
};

export function useHomepageNews(): HomepageNewsState {
  const [state, setState] = useState<HomepageNewsState>({
    data: null,
    freshness: "unknown",
    availability: "unavailable",
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const res = await fetch("/api/news/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load homepage news");
        const envelope: NormalizedEnvelope<HomepageNewsEnvelope> = await res.json();
        if (!cancelled) {
          setState({
            data: envelope.data ?? null,
            freshness: envelope.freshness,
            availability: envelope.availability,
            isLoading: false,
            error: envelope.unavailableReason ?? null,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setState({
            data: null,
            freshness: "unknown",
            availability: "unavailable",
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load homepage news",
          });
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  return state;
}
