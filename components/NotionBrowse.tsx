"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { NotionRef } from "@/lib/types";
import NotionTree from "./NotionTree";

export default function NotionBrowse() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NotionRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(query: string) {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/notion/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.configured) setMsg("Notion isn't connected (no token in .env.local).");
      else { setResults(data.results ?? []); if (!data.results?.length) setMsg("No results."); }
    } catch { setMsg("Search failed."); }
    setLoading(false);
  }

  useEffect(() => { run(""); /* eslint-disable-next-line */ }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Notion</h1>
        <p className="text-sm text-warmgray">Browse your connected Notion workspace. Attach any page or database to a project from its detail view.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
        <Search size={15} className="text-warmgray" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages & databases…"
          className="w-full bg-transparent text-charcoal outline-none placeholder:text-warmgray" />
        <button type="submit" className="rounded-md bg-coral px-3 py-1 text-xs font-semibold text-white">{loading ? "…" : "Search"}</button>
      </form>

      <p className="mb-2 px-1 text-[11px] text-warmgray">Click ▸ to drill into any page's sub-pages and databases.</p>
      {msg && <p className="px-1 py-2 text-sm text-warmgray">{msg}</p>}

      <div className="rounded-xl border border-line bg-surface p-2">
        <NotionTree items={results.map((r) => ({ node: "ref" as const, ref: r }))} />
      </div>
    </div>
  );
}
