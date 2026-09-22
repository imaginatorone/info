export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  updated_at: string;
}

export async function getGitHubProfile(username: string, signal?: AbortSignal) {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub profile request failed: ${response.status}`);
  }

  return response.json() as Promise<GitHubProfile>;
}

export interface GitHubRepository {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
}
export interface GitHubSnapshot {
  profile: GitHubProfile;
  repositories: GitHubRepository[];
  fetchedAt: number;
}
const pending = new Map<string, Promise<GitHubSnapshot>>();
export const refreshInterval = 10 * 60 * 1000;
export function cachedGitHub(username: string): GitHubSnapshot | null {
  try {
    const data = JSON.parse(
      localStorage.getItem(`github-v1-${username}`) ?? "null",
    );
    return data?.profile?.login === username &&
      Array.isArray(data.repositories) &&
      Number.isFinite(data.fetchedAt)
      ? data
      : null;
  } catch {
    return null;
  }
}
export function refreshGitHub(username: string): Promise<GitHubSnapshot> {
  const existing = pending.get(username);
  if (existing) return existing;
  const signal = AbortSignal.timeout(12000);
  const task = Promise.all([
    getGitHubProfile(username, signal),
    fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&direction=desc&per_page=12`,
      { signal, headers: { Accept: "application/vnd.github+json" } },
    ).then(async (response) => {
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as GitHubRepository[];
    }),
  ])
    .then(([profile, repositories]) => {
      const snapshot = {
        profile,
        repositories: repositories.filter((repo) => !repo.fork).slice(0, 4),
        fetchedAt: Date.now(),
      };
      try {
        localStorage.setItem(`github-v1-${username}`, JSON.stringify(snapshot));
      } catch {
        /* The in-memory view remains usable. */
      }
      return snapshot;
    })
    .finally(() => pending.delete(username));
  pending.set(username, task);
  return task;
}
