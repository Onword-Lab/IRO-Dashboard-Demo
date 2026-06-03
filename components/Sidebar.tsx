"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, CheckSquare, Calendar, Mail, Contact, Wallet, Receipt, Code2,
  FileText, HardDrive, MessagesSquare, ShoppingCart, Truck, Package, BarChart3, Plug,
} from "lucide-react";

type Item = { href: string; label: string; icon: any };

const GROUPS: { label: string; items: Item[] }[] = [
  { label: "Operations", items: [
    { href: "/projects", label: "Projects", icon: LayoutGrid },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
  ]},
  { label: "Comms", items: [
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/mail", label: "Mail", icon: Mail },
    { href: "/contacts", label: "Contacts", icon: Contact },
    { href: "/slack", label: "Slack", icon: MessagesSquare },
  ]},
  { label: "Finance", items: [
    { href: "/finance", label: "Banking", icon: Wallet },
    { href: "/tax", label: "Tax", icon: Receipt },
    { href: "/connections", label: "연동", icon: Plug },
  ]},
  { label: "Commerce", items: [
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/shipping", label: "Shipping", icon: Truck },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/sales", label: "Sales", icon: BarChart3 },
  ]},
  { label: "Dev", items: [
    { href: "/code", label: "Code", icon: Code2 },
  ]},
  { label: "Sources", items: [
    { href: "/notion", label: "Notion", icon: FileText },
    { href: "/drive", label: "Google Drive", icon: HardDrive },
  ]},
];

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: any; active: boolean }) {
  return (
    <Link
      href={href}
      className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-coral/15 text-coral-dark" : "text-charcoal hover:bg-line/60"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-warmgray">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-4">
        <div className="text-lg font-bold tracking-tight text-charcoal">IRO</div>
        <div className="text-[11px] text-warmgray">Onword ops dashboard</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <GroupLabel>{g.label}</GroupLabel>
            {g.items.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} Icon={icon} active={isActive(href)} />
            ))}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 text-[10px] text-warmgray">v0.3 · dogfooding</div>
    </aside>
  );
}
