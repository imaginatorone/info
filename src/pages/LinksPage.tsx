import { site } from "../content/site";

export function LinksPage() {
  return (
    <section className="foundation-page" data-route="links">
      <p className="foundation-kicker">links</p>
      <h1>signal out</h1>
      <a href={site.socials.telegram}>telegram</a>
      <a href={site.socials.youtube}>youtube</a>
      <a href={site.socials.githubPrimary}>github / primary</a>
      <a href={site.socials.githubSecondary}>github / secondary</a>
    </section>
  );
}
