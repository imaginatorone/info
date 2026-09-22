import { site } from "../content/site";

export function LinksPage() {
  return (
    <section className="foundation-page" data-route="links">
      <h1>links</h1>
      <a
        href={site.socials.soundcloud}
        target="_blank"
        rel="noreferrer noopener"
      >
        soundcloud
      </a>
      <a target="_blank" rel="noreferrer noopener" href={site.socials.telegram}>
        telegram
      </a>
      <a target="_blank" rel="noreferrer noopener" href={site.socials.youtube}>
        youtube
      </a>
      <a
        target="_blank"
        rel="noreferrer noopener"
        href={site.socials.githubPrimary}
      >
        github / imaginatorone
      </a>
      <a
        target="_blank"
        rel="noreferrer noopener"
        href={site.socials.githubSecondary}
      >
        github / sensorywave
      </a>
    </section>
  );
}
