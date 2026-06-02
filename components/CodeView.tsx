"use client";

import { useEffect, useState } from "react";
import { GitBranch, GitCommit, GitPullRequest, CircleDot, ExternalLink } from "lucide-react";
import type { Repo, Commit, PullRequest } from "@/lib/types";
import { PageHeader, SourceBadge, SampleNotice } from "./ui";

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  HCL: "bg-purple-400",
  Go: "bg-cyan-400",
  Rust: "bg-orange-400",
};

function LangDot({ language }: { language?: string }) {
  if (!language) return null;
  const dot = LANG_COLORS[language] ?? "bg-warmgray";
  return (
    <span className="flex items-center gap-1 text-[11px] text-warmgray">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      {language}
    </span>
  );
}

export default function CodeView() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/code");
        const data = await res.json();
        setRepos(data.repos ?? []);
        setCommits(data.commits ?? []);
        setPrs(data.prs ?? []);
        setLive(!!data.configured);
      } catch { /* keep empty */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Code"
        subtitle="GitHub activity across Onword repositories."
        badge={<SourceBadge live={live} />}
      />
      {!live && (
        <SampleNotice>
          Showing <b>sample</b> GitHub data. To go live: create a fine-grained <b>read-only</b> Personal Access Token
          and set <code className="mx-1 rounded bg-line px-1">GITHUB_TOKEN</code> +{" "}
          <code className="rounded bg-line px-1">GITHUB_ORG</code> in{" "}
          <code className="mx-1 rounded bg-line px-1">.env.local</code>.
        </SampleNotice>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: Repositories */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warmgray">
            <GitBranch size={12} /> Repositories
          </div>
          {loading && <p className="text-sm text-warmgray">Loading…</p>}
          {!loading && repos.length === 0 && <p className="text-sm text-warmgray">No repositories found.</p>}
          <div className="space-y-2">
            {repos.map((repo) => (
              <div key={repo.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-charcoal hover:text-coral-dark hover:underline"
                    >
                      {repo.name}
                    </a>
                    {repo.description && (
                      <p className="mt-0.5 truncate text-xs text-warmgray">{repo.description}</p>
                    )}
                  </div>
                  {repo.private && (
                    <span className="shrink-0 rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-warmgray">
                      private
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <LangDot language={repo.language} />
                  {repo.openIssues !== undefined && (
                    <span className="flex items-center gap-1 text-[11px] text-warmgray">
                      <CircleDot size={11} /> {repo.openIssues} issues
                    </span>
                  )}
                  <span className="text-[11px] text-warmgray">updated {fmtRelative(repo.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Commits + Open PRs */}
        <div className="space-y-5">
          {/* Recent Commits */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warmgray">
              <GitCommit size={12} /> Recent Commits
            </div>
            {loading && <p className="text-sm text-warmgray">Loading…</p>}
            {!loading && commits.length === 0 && <p className="text-sm text-warmgray">No commits found.</p>}
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {commits.map((c) => (
                <div key={c.sha + c.date} className="group flex items-start gap-3 px-4 py-3">
                  <code className="mt-0.5 shrink-0 rounded bg-line px-1.5 py-0.5 text-[10px] font-mono text-warmgray">
                    {c.sha}
                  </code>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-charcoal">{c.message}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-warmgray">
                      <span>{c.repo}</span>
                      <span>·</span>
                      <span>{c.author}</span>
                      <span>·</span>
                      <span>{fmtRelative(c.date)}</span>
                    </div>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-warmgray opacity-0 transition-opacity hover:text-charcoal group-hover:opacity-100"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Open PRs */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warmgray">
              <GitPullRequest size={12} /> Open PRs
            </div>
            {!loading && prs.length === 0 && <p className="text-sm text-warmgray">No open pull requests.</p>}
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {prs.map((pr) => (
                <div key={pr.id} className="group flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 shrink-0 text-xs font-semibold ${
                      pr.state === "merged" ? "text-sage" : "text-coral-dark"
                    }`}
                  >
                    #{pr.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm text-charcoal hover:text-coral-dark hover:underline"
                    >
                      {pr.title}
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-warmgray">
                      <span>{pr.repo}</span>
                      <span>·</span>
                      <span>{pr.author}</span>
                      <span>·</span>
                      <span>{fmtRelative(pr.updatedAt)}</span>
                    </div>
                  </div>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-warmgray opacity-0 transition-opacity hover:text-charcoal group-hover:opacity-100"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
