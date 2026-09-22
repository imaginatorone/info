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
