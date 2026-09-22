import { useLocale } from "../content/locale";
export function AboutPage() {
  const { t } = useLocale();
  return (
    <section className="foundation-page about-page" data-route="about">
      <p className="foundation-kicker">{t.nav[1]}</p>
      <h1>{t.lead}</h1>
      <div className="about-copy">
        {t.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  );
}
