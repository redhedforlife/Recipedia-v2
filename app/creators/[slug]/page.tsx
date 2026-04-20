import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getData } from "@/lib/data";

export default async function CreatorPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getData();
  const creator = data.creators.find((candidate) => candidate.slug === slug);
  if (!creator) notFound();

  const linkedFamilies = data.families.filter((family) => creator.familyLinks.includes(family.slug)).slice(0, 12);
  const linkedCuisines = data.cuisines.filter((cuisine) => creator.cuisineLinks.includes(cuisine.slug)).slice(0, 8);

  return (
    <main className="container section">
      <Breadcrumbs
        items={[
          { label: "Explore", href: "/" },
          { label: creator.displayName }
        ]}
      />

      <section className="page-hero page-hero--compact">
        <div className="stack">
          <p className="eyebrow">{creator.creatorCategory}</p>
          <h1>{creator.displayName}</h1>
          <p className="lede">{creator.shortBio}</p>
        </div>
        <aside className="hero-rail">
          <div className="card stack">
            <h3>Region</h3>
            <p className="meta">{creator.region ?? "Global"}</p>
          </div>
        </aside>
      </section>

      {linkedCuisines.length ? (
        <section className="section">
          <div className="section-head">
            <h2>Linked cuisines</h2>
          </div>
          <div className="grid">
            {linkedCuisines.map((cuisine) => (
              <Link className="card stack" href={`/cuisines/${cuisine.slug}`} key={cuisine.id}>
                <span className="eyebrow">Cuisine</span>
                <h3>{cuisine.displayName}</h3>
                <p className="meta">{cuisine.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {linkedFamilies.length ? (
        <section className="section">
          <div className="section-head">
            <h2>Linked dish families</h2>
          </div>
          <div className="grid">
            {linkedFamilies.map((family) => (
              <Link className="card stack" href={`/families/${family.slug}`} key={family.id}>
                <span className="eyebrow">Dish family</span>
                <h3>{family.displayName}</h3>
                <p className="meta">{family.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
