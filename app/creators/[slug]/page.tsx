import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CuratedSectionBrowser } from "@/components/CuratedSectionBrowser";
import { getCreatorProfile } from "@/lib/editorial";

export default async function CreatorPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCreatorProfile(slug);
  if (!profile) notFound();

  return (
    <main className="container section">
      <Breadcrumbs
        items={[
          { label: "Explore", href: "/" },
          { label: "American", href: "/cuisines/american" },
          { label: profile.creator.displayName }
        ]}
      />

      <section className="page-hero page-hero--compact">
        <div className="stack">
          <p className="eyebrow">{profile.creator.creatorCategory}</p>
          <h1>{profile.creator.displayName}</h1>
          <p className="lede">{profile.creator.shortBio}</p>
        </div>
        <aside className="hero-rail">
          <div className="card stack">
            <h3>Region</h3>
            <p className="meta">{profile.creator.region ?? "Global"}</p>
          </div>
        </aside>
      </section>

      <CuratedSectionBrowser sections={profile.sections} showFilters={false} />
    </main>
  );
}
