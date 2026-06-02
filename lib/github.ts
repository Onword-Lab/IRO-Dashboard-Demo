import type { Repo, Commit, PullRequest } from "./types";

export function githubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

const ORG = process.env.GITHUB_ORG || "";

async function gh(path: string): Promise<any> {
  const res = await fetch("https://api.github.com" + path, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub ${path} failed: ${res.status}`);
  return res.json();
}

export async function listRepos(): Promise<Repo[]> {
  let items: any[];
  try {
    items = await gh(`/orgs/${ORG}/repos?sort=updated&per_page=10`);
  } catch (e: any) {
    if (e.message?.includes("404")) {
      items = await gh(`/users/${ORG}/repos?sort=updated&per_page=10`);
    } else {
      throw e;
    }
  }
  return items.map((r: any): Repo => ({
    id: String(r.id),
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? undefined,
    updatedAt: r.updated_at,
    openIssues: r.open_issues_count,
    url: r.html_url,
    private: r.private,
    language: r.language ?? undefined,
  }));
}

export async function recentCommits(): Promise<Commit[]> {
  const repos = await listRepos();
  const top3 = repos.slice(0, 3);
  const perRepo = await Promise.all(
    top3.map(async (repo) => {
      try {
        const items: any[] = await gh(`/repos/${repo.fullName}/commits?per_page=4`);
        return items.map((c: any): Commit => ({
          sha: c.sha.slice(0, 7),
          message: (c.commit?.message ?? "").split("\n")[0],
          author: c.commit?.author?.name || c.author?.login || "unknown",
          date: c.commit?.author?.date ?? "",
          repo: repo.fullName,
          url: c.html_url,
        }));
      } catch {
        return [];
      }
    })
  );
  return perRepo
    .flat()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
}

export async function openPRs(): Promise<PullRequest[]> {
  try {
    const data: any = await gh(`/search/issues?q=is:pr+is:open+org:${ORG}&per_page=10`);
    return (data.items ?? []).map((item: any): PullRequest => {
      const parts: string[] = (item.repository_url ?? "").split("/");
      const repo = parts.length >= 2 ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}` : ORG;
      return {
        id: String(item.id),
        number: item.number,
        title: item.title,
        repo,
        author: item.user?.login ?? "unknown",
        state: "open",
        updatedAt: item.updated_at,
        url: item.html_url,
      };
    });
  } catch {
    return [];
  }
}
