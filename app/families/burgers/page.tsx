import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Network } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CuratedSectionBrowser } from "@/components/CuratedSectionBrowser";
import { getBurgerExploreExperience } from "@/lib/editorial";

export default async function BurgersPage() {
  const experience = await getBurgerExploreExperience();
  if (!experience) notFound();

  return (
    <main className="container section">
      <Breadcrumbs
        items={[
          { label: "Explore", href: "/" },
          { label: "American", href: "/cuisines/american" },
          { label: "Burgers" }
        ]}
      />

      <section className="page-hero page-hero--editorial">
        <div className="stack">
          <p className="eyebrow">{experience.eyebrow}</p>
          <h1>{experience.title}</h1>
          <p className="lede">{experience.description}</p>
          <div className="tag-list">
            {experience.highlights.map((highlight) => (
              <span className="tag" key={highlight}>
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <aside className="hero-rail">
          <div className="card stack">
            <h3>Quick stats</h3>
            <div className="stats-grid">
              {experience.stats.map((stat) => (
                <div className="stat-tile" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card stack">
            <h3>Go deeper</h3>
            <Link className="button" href="/dishes/oklahoma-onion-burger">
              Follow a subtype <ArrowRight size={15} />
            </Link>
            <Link className="ghost-button" href={experience.graphHref}>
              Open burger map <Network size={15} />
            </Link>
          </div>
        </aside>
      </section>

      <CuratedSectionBrowser sections={experience.sections} />
    </main>
  );
}
