import Link from "next/link";
import { FileText, FolderOpen, FolderX } from "lucide-react";
import type { Project } from "@/lib/types";
import { StatusPill, AvatarStack, PriorityTag } from "./ui";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug text-charcoal group-hover:text-coral-dark">
          {project.name}
        </h3>
        <StatusPill status={project.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-warmgray">
        <AvatarStack people={project.assignees} />
        <PriorityTag priority={project.priority} />
        {project.endDate && <span>· due {project.endDate}</span>}
      </div>
      <div className="mt-1 flex items-center gap-3 border-t border-line pt-2 text-[11px] text-warmgray">
        <span className="flex items-center gap-1">
          <FileText size={12} /> Notion
        </span>
        <span className="flex items-center gap-1">
          {project.driveFolderId ? (
            <>
              <FolderOpen size={12} className="text-sage" /> Drive linked
            </>
          ) : (
            <>
              <FolderX size={12} /> No Drive folder
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
