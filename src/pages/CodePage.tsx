import { useEffect, useState } from "react";
import { useLocale } from "../content/locale";
import { site } from "../content/site";
import {
  cachedGitHub,
  refreshGitHub,
  refreshInterval,
} from "../services/github";

function Profile({ username }: { username: string }) {
  const { locale } = useLocale();
  const ru = locale === "ru";
  const [data, setData] = useState(() => cachedGitHub(username));
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [request, setRequest] = useState(0);
  useEffect(() => {
    let alive = true;
    let refreshing = false;
    let attempted = 0;
    const update = async () => {
      if (document.hidden || refreshing || Date.now() - attempted < 60000)
        return;
      const cached = cachedGitHub(username);
      if (!request && cached && Date.now() - cached.fetchedAt < refreshInterval)
        return;
      refreshing = true;
      attempted = Date.now();
      setBusy(true);
      try {
        const next = await refreshGitHub(username);
        if (alive) {
          setData(next);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        refreshing = false;
        if (alive) setBusy(false);
      }
    };
    void update();
    const timer = window.setInterval(() => void update(), refreshInterval);
    const visible = () => void update();
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [username, request]);
  const safe = (url: string) =>
    url.startsWith(`https://github.com/${username}`)
      ? url
      : `https://github.com/${username}`;
  return (
    <article className="github-profile" aria-busy={busy}>
      <header>
        <h2>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {username}
          </a>
        </h2>
        <span className="profile-mark" aria-hidden="true">
          {busy ? "[··]" : error ? "[--]" : "[+]"}
        </span>
      </header>
      {data && (
        <>
          <p className="profile-bio">{data.profile.bio}</p>
          <p className="profile-counts">
            {data.profile.public_repos} {ru ? "репозиториев" : "repositories"} /{" "}
            {data.profile.followers} {ru ? "подписчиков" : "followers"}
          </p>
          <ul className="repository-list">
            {data.repositories.map((repo) => (
              <li key={repo.id}>
                <a
                  href={safe(repo.html_url)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span>{repo.name}</span>
                  <span className="repo-meta">
                    {repo.language ?? ""}{" "}
                    {repo.stargazers_count > 0
                      ? `* ${repo.stargazers_count}`
                      : ""}
                  </span>
                </a>
                {repo.description && <p>{repo.description}</p>}
                <time dateTime={repo.pushed_at}>
                  {new Intl.DateTimeFormat(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(repo.pushed_at))}
                </time>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="profile-status" role="status">
        {error
          ? ru
            ? "GitHub сейчас недоступен. Сохранённые данные оставлены."
            : "GitHub is unavailable. Saved data is still shown."
          : busy
            ? ru
              ? "обновление"
              : "updating"
            : data
              ? `${ru ? "проверено" : "checked"} ${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(data.fetchedAt)}`
              : ""}
      </div>
      <button
        className="text-control"
        disabled={busy}
        onClick={() => setRequest((value) => value + 1)}
      >
        {ru ? "обновить" : "refresh"}
      </button>
    </article>
  );
}
export function CodePage() {
  const { locale } = useLocale();
  return (
    <section className="foundation-page code-page" data-route="code">
      <h1>code</h1>
      <p className="integration-note">
        {locale === "ru"
          ? "Публичные профили GitHub. Автообновление каждые 10 минут."
          : "Public GitHub profiles. Updated every 10 minutes."}
      </p>
      <div className="github-profiles">
        <Profile username={site.identity.githubPrimary} />
        <Profile username={site.identity.githubSecondary} />
      </div>
    </section>
  );
}
