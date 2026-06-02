import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/projects-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project = await createProject(body);
  return NextResponse.json(project, { status: 201 });
}
