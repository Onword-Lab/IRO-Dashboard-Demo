"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Level-A "real-time": re-runs the server components (re-fetching Notion/Drive)
// on an interval and on demand. router.refresh() preserves client UI state.
export default function AutoRefresh({ intervalSeconds = 45 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [last, setLast] = useState<string>("");

  const doRefresh = () => {
    startTransition(() => router.refresh());
    setLast(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setLast(new Date().toLocaleTimeString());
    const id = setInterval(() => {
      router.refresh();
      setLast(new Date().toLocaleTimeString());
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [router, intervalSeconds]);

  return (
    <button
      onClick={doRefresh}
      title={`Auto-refresh every ${intervalSeconds}s — click to refresh now`}
      className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-warmgray transition-colors hover:text-charcoal"
    >
      <RefreshCw size={13} className={isPending ? "animate-spin" : ""} />
      {last ? `updated ${last}` : "refresh"}
    </button>
  );
}
