"use client";

import { useEffect, useState } from "react";
import { Folder, ChevronRight, ExternalLink } from "lucide-react";

export default function DriveBrowse() {
  const [stack, setStack] = useState<{ id?: string; name: string }[]>([{ name: "My Drive" }]);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load(parentId?: string) {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/drive/folders${parentId ? `?parent=${parentId}` : ""}`);
      const data = await res.json();
      if (!data.configured) setMsg("Google Drive isn't connected.");
      else { setFolders(data.folders ?? []); if (!data.folders?.length) setMsg("No sub-folders here."); }
    } catch { setMsg("Couldn't list folders."); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function open(f: { id: string; name: string }) { setStack((s) => [...s, f]); load(f.id); }
  function jump(i: number) { const next = stack.slice(0, i + 1); setStack(next); load(next[next.length - 1].id); }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Google Drive</h1>
        <p className="text-sm text-warmgray">Your company file store. Attach any folder to a project from its detail view.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1 text-sm text-warmgray">
        {stack.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} />}
            <button onClick={() => jump(i)} className="hover:text-charcoal">{s.name}</button>
          </span>
        ))}
      </div>

      {msg && <p className="px-1 py-2 text-sm text-warmgray">{msg}</p>}

      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {loading && <p className="px-4 py-3 text-sm text-warmgray">Loading…</p>}
        {folders.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-line/40">
            <Folder size={15} className="text-coral" />
            <button onClick={() => open(f)} className="flex-1 truncate text-left text-charcoal">{f.name}</button>
            <a href={`https://drive.google.com/drive/folders/${f.id}`} target="_blank" rel="noreferrer" className="text-warmgray hover:text-charcoal">
              <ExternalLink size={13} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
