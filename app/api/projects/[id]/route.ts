import { NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject } from "@/lib/projects-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const p = await getProjectById(params.id);
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const p = await updateProject(params.id, body);
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = await deleteProject(params.id);
  return NextResponse.json({ ok });
}
