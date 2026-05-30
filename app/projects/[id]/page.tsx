import { notFound } from "next/navigation";
import {
  getProject, getTasksByProject, getFolderTree, getNotionMarkdown, getDriveFolders,
} from "@/lib/data";
import ProjectDetail from "@/components/ProjectDetail";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const [tasks, tree, notionMarkdown] = await Promise.all([
    getTasksByProject(project.id),
    getFolderTree(project.driveFolderId),
    getNotionMarkdown(project),
  ]);
  const folders = getDriveFolders();

  return (
    <ProjectDetail
      project={project}
      tasks={tasks}
      tree={tree}
      notionMarkdown={notionMarkdown}
      folders={folders}
    />
  );
}
