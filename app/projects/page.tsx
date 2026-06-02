import { getProjects } from "@/lib/data";
import ProjectsView from "@/components/ProjectsView";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsView projects={projects} />;
}
