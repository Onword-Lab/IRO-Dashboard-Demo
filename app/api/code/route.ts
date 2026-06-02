import { NextResponse } from "next/server";
import { githubConfigured, listRepos, recentCommits, openPRs } from "@/lib/github";
import { sampleRepos, sampleCommits, samplePRs } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (githubConfigured()) {
    try {
      const [repos, commits, prs] = await Promise.all([listRepos(), recentCommits(), openPRs()]);
      return NextResponse.json({ configured: true, repos, commits, prs });
    } catch (e) {
      console.error("GitHub live failed, using sample:", e);
    }
  }
  return NextResponse.json({ configured: false, repos: sampleRepos, commits: sampleCommits, prs: samplePRs });
}
