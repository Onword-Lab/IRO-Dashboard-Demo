import { notFound } from "next/navigation";
import { getProject, getTasksForProject, getFolderTree, getNotionItemsForRef } from "@/lib/data";
import ProjectDetail from "@/components/ProjectDetail";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const [tasks, tree, notionItems] = await Promise.all([
    getTasksForProject(project),
    getFolderTree(project.drive?.id),
    getNotionItemsForRef(project.notion),
  ]);

  return (
    <ProjectDetail
      project={project}
      tasks={tasks}
      tree={tree}
      notionItems={notionItems}
    />
  );
}
