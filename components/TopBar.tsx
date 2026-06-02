import { Search, Bell } from "lucide-react";
import AutoRefresh from "./AutoRefresh";

export default function TopBar({ mode }: { mode: { notion: string; drive: string; store: string } }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-cream px-6">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-warmgray">
        <Search size={15} />
        <span>Search projects, tasks, files…</span>
        <kbd className="ml-auto rounded bg-line px-1.5 text-[10px]">⌘K</kbd>
      </div>
      <div className="flex items-center gap-3 text-xs text-warmgray">
        <span title="Projects backend">
          Store: <b className="text-charcoal">{mode.store}</b>
        </span>
        <span title="Notion connection">
          Notion: <b className={mode.notion === "live" ? "text-sage" : "text-amber"}>{mode.notion}</b>
        </span>
        <span title="Google Drive connection">
          Drive: <b className={mode.drive === "live" ? "text-sage" : "text-amber"}>{mode.drive}</b>
        </span>
        <AutoRefresh />
        <Bell size={16} />
      </div>
    </header>
  );
}
