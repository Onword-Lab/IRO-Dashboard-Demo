import { getTasks } from "@/lib/data";
import TaskBoard from "@/components/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasks();
  return <TaskBoard tasks={tasks} />;
}
