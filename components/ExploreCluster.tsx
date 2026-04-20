"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronDown, Compass } from "lucide-react";

type CuisineCard = {
  id: string;
  slug: string;
  title: string;
  href?: string;
  subtitle?: string;
  description: string;
  meta?: string;
  preview: string[];
  tone: string;
};

export function ExploreCluster({
  featured,
  more,
  spotlight
}: {
  featured: CuisineCard[];
  more: CuisineCard[];
  spotlight?: CuisineCard;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(spotlight?.slug ?? featured[0]?.slug ?? null);

  const active = featured.find((item) => item.slug === hoveredSlug) ?? spotlight ?? featured[0];
  const revealedMore = more.slice(0, revealedCount);

  return (
    <section className="explore-hero">
      <div className="container">
        <div className="explore-header">
          <div className="stack">
            <p className="eyebrow">Explore</p>
            <h1>Start with a ranked taste of the graph, not the whole graph.</h1>
            <p className="lede">
              Recipedia now opens as a curated discovery product. We surface the strongest cuisines first, then let the
              user expand outward when they want more depth.
            </p>
            <div className="actions">
              <Link className="button" href="/cuisines/american">
                Follow the American wedge <ArrowRight size={16} />
              </Link>
              <Link className="ghost-button" href="/graph">
                Open full map
              </Link>
            </div>
          </div>

          <div className="explore-preview card stack">
            <div className="row">
              <span className="entity-chip entity-chip--cuisine">Preview</span>
              {active?.meta ? <span className="tag">{active.meta}</span> : null}
            </div>
            <h3>{active?.title ?? "Explore cuisines"}</h3>
            <p className="meta">{active?.subtitle ?? active?.description}</p>
            <div className="tag-list">
              {active?.preview.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="cluster-shell">
          <div className="cluster-core card stack">
            <span className="entity-chip entity-chip--family">Launch wedge</span>
            <h2>{spotlight?.title ?? "American"}</h2>
            <p className="meta">{spotlight?.subtitle ?? "Burgers, barbecue, sandwiches"}</p>
            <Link className="pill" href={spotlight?.href ?? "/cuisines/american"}>
              Explore spotlight <Compass size={15} />
            </Link>
          </div>

          <div className="cluster-orbit">
            {featured.map((item, index) => (
              <CuisineOrbitCard
                active={item.slug === active?.slug}
                index={index}
                item={item}
                key={item.id}
                onHover={() => setHoveredSlug(item.slug)}
              />
            ))}
          </div>
        </div>

        {revealedMore.length ? (
          <div className="editorial-grid cluster-more">
            {revealedMore.map((item) => (
              <Link className={`card stack editorial-card tone-${item.tone}`} href={item.href ?? `/cuisines/${item.slug}`} key={item.id}>
                <span className="entity-chip entity-chip--cuisine">More cuisine</span>
                <h3>{item.title}</h3>
                <p className="meta">{item.subtitle ?? item.description}</p>
                <div className="tag-list">
                  {item.preview.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {more.length > revealedMore.length ? (
          <div className="cluster-actions">
            <button
              className="ghost-button"
              onClick={() => setRevealedCount((count) => Math.min(count + 6, more.length))}
              type="button"
            >
              <ChevronDown size={16} /> More cuisines
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CuisineOrbitCard({
  item,
  index,
  active,
  onHover
}: {
  item: CuisineCard;
  index: number;
  active: boolean;
  onHover: () => void;
}) {
  const href = item.href ?? `/cuisines/${item.slug}`;

  return (
    <Link
      className={`orbit-card tone-${item.tone}${active ? " active" : ""}`}
      href={href}
      onFocus={onHover}
      onMouseEnter={onHover}
      style={{ ["--orbit-index" as string]: index } as CSSProperties}
    >
      <span className="entity-chip entity-chip--cuisine">{item.title}</span>
      <strong>{item.subtitle}</strong>
      <span>{item.preview.join(" · ")}</span>
    </Link>
  );
}
