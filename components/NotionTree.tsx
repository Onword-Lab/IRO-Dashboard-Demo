"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Database, ExternalLink, Check } from "lucide-react";
import type { NotionItem, NotionRef } from "@/lib/types";

function MdLine({ md, depth }: { md: string; depth: number }) {
  const pad = { paddingLeft: depth * 16 + 8 } as const;
  if (md.startsWith("### ")) return <h4 style={pad} className="pt-1 text-sm font-semibold text-charcoal">{md.slice(4)}</h4>;
  if (md.startsWith("## ")) return <h3 style={pad} className="pt-1.5 text-base font-semibold text-charcoal">{md.slice(3)}</h3>;
  if (md.startsWith("# ")) return <h2 style={pad} className="pt-1.5 text-lg font-bold text-charcoal">{md.slice(2)}</h2>;
  const todo = md.match(/^- \[([ x])\] (.*)$/);
  if (todo) return (
    <div style={pad} className="flex items-center gap-2 py-0.5 text-sm text-charcoal">
      <input type="checkbox" checked={todo[1] === "x"} readOnly className="accent-coral" /> {todo[2]}
    </div>
  );
  if (md.startsWith("- ")) return (
    <div style={pad} className="flex gap-2 py-0.5 text-sm text-charcoal"><span className="text-coral">•</span><span>{md.slice(2).replace(/\*\*/g, "")}</span></div>
  );
  if (md.startsWith("1. ")) return <div style={pad} className="py-0.5 text-sm text-charcoal">{md.slice(3)}</div>;
  return <p style={pad} className="py-0.5 text-sm text-charcoal">{md.replace(/\*\*/g, "")}</p>;
}

function RefRow({ refNode, depth, onPick }: { refNode: NotionRef; depth: number; onPick?: (r: NotionRef) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotionItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && items === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/notion/node?id=${refNode.id}&kind=${refNode.kind}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } catch { setItems([]); }
      setLoading(false);
    }
    setOpen((o) => !o);
  }

  return (
    <div>
      <div className="group flex items-center gap-1.5 rounded-md py-1 pr-2 hover:bg-line/40" style={{ paddingLeft: depth * 16 }}>
        <button onClick={toggle} className="text-warmgray hover:text-charcoal" aria-label="Expand">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {refNode.kind === "database" ? <Database size={14} className="shrink-0 text-coral" /> : <FileText size={14} className="shrink-0 text-warmgray" />}
        <button onClick={toggle} className="flex-1 truncate text-left text-sm text-charcoal">{refNode.title}</button>
        <a href={refNode.url} target="_blank" rel="noreferrer" title="Open in Notion"
          className="shrink-0 text-warmgray opacity-0 transition-opacity hover:text-charcoal group-hover:opacity-100">
          <ExternalLink size={12} />
        </a>
        {onPick && (
          <button onClick={() => onPick(refNode)}
            className="flex shrink-0 items-center gap-1 rounded bg-coral/15 px-2 py-0.5 text-[11px] font-semibold text-coral-dark hover:bg-coral hover:text-white">
            <Check size={11} /> Link
          </button>
        )}
      </div>
      {open && (
        <div>
          {loading && <p className="py-1 text-xs text-warmgray" style={{ paddingLeft: (depth + 1) * 16 + 8 }}>Loading…</p>}
          {!loading && items && items.length === 0 && (
            <p className="py-1 text-xs text-warmgray" style={{ paddingLeft: (depth + 1) * 16 + 8 }}>Empty.</p>
          )}
          {items && items.length > 0 && <NotionTree items={items} depth={depth + 1} onPick={onPick} />}
        </div>
      )}
    </div>
  );
}

export default function NotionTree({
  items, depth = 0, onPick,
}: {
  items: NotionItem[];
  depth?: number;
  onPick?: (r: NotionRef) => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((it, i) =>
        it.node === "text"
          ? <MdLine key={`t${i}`} md={it.md} depth={depth} />
          : <RefRow key={`${it.ref.id}-${i}`} refNode={it.ref} depth={depth} onPick={onPick} />
      )}
    </div>
  );
}
