"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CheckSquare, Home, Bot, Users, Calendar, Brain } from "lucide-react";

const ACTIVE = [
  { href: "/projects", label: "Projects", icon: LayoutGrid },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

const SOON = [
  { label: "Home", icon: Home },
  { label: "Agent", icon: Bot },
  { label: "Clients", icon: Users },
  { label: "Calendar", icon: Calendar },
  { label: "Brain", icon: Brain },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-4">
        <div className="text-lg font-bold tracking-tight text-charcoal">IRO</div>
        <div className="text-[11px] text-warmgray">Onword ops dashboard</div>
      </div>
      <nav className="flex-1 px-2">
        {ACTIVE.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-coral/15 text-coral-dark" : "text-charcoal hover:bg-line/60"
              }`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
        <div className="my-3 border-t border-line" />
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-warmgray">
          Roadmap
        </div>
        {SOON.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="mb-0.5 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-warmgray/50"
            title="Coming in a later build"
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 text-[10px] text-warmgray">v0.1 · dogfooding</div>
    </aside>
  );
}
