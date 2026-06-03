"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Search } from "lucide-react";
import type { Partner } from "@/lib/types";

interface PartnerPickerProps {
  onPick: (p: Partner) => void;
}

export default function PartnerPicker({ onPick }: PartnerPickerProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data: Partner[]) => setPartners(data))
      .catch(() => setPartners([]));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query.trim()
    ? partners.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.bizNo.replace(/-/g, "").includes(query.replace(/-/g, ""))
      )
    : partners;

  function pick(p: Partner) {
    onPick(p);
    setQuery(p.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 text-[#6B6862]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="거래처 검색 (상호/사업자번호)"
          className="w-full rounded-lg border border-[#E8E2D5] bg-[#F5F1E8] py-1.5 pl-8 pr-3 text-sm text-[#1F1F1E] placeholder-[#6B6862] focus:outline-none focus:ring-1 focus:ring-[#D97757]"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E8E2D5] bg-[#FAF7F0] shadow-md">
          {filtered.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-[#6B6862]">
              <Building2 size={14} className="shrink-0" />
              <span>거래처 없음</span>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F1E8]"
              >
                <Building2
                  size={14}
                  className="mt-0.5 shrink-0 text-[#6B6862]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-[#1F1F1E] text-sm">
                      {p.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[#6B6862]">
                      {p.bizNo}
                    </span>
                  </div>
                  {p.ceoName && (
                    <span className="text-xs text-[#6B6862]">
                      대표 {p.ceoName}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
