"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { EditorialCardItem, EditorialSection, ExploreDimension } from "@/lib/types";

const filterOrder: Array<{ id: ExploreDimension; label: string }> = [
  { id: "all", label: "All" },
  { id: "families", label: "Families" },
  { id: "dishes", label: "Dishes" },
  { id: "techniques", label: "Techniques" },
  { id: "ingredients", label: "Ingredients" },
  { id: "methods", label: "Methods" },
  { id: "creators", label: "Creators" },
  { id: "recipes", label: "Recipes" }
];

export function CuratedSectionBrowser({
  sections,
  defaultFilter = "all",
  showFilters = true
}: {
  sections: EditorialSection[];
  defaultFilter?: ExploreDimension;
  showFilters?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<ExploreDimension>(defaultFilter);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const visibleSections = sections.filter((section) => activeFilter === "all" || section.id === activeFilter);
  const availableFilters = filterOrder.filter(
    (filter) => filter.id === "all" || sections.some((section) => section.id === filter.id && section.items.length)
  );

  return (
    <div className="curated-browser">
      {showFilters ? (
        <div className="filter-rail" role="tablist" aria-label="Explore filters">
          {availableFilters.map((filter) => (
            <button
              aria-selected={activeFilter === filter.id}
              className={`filter-pill${activeFilter === filter.id ? " active" : ""}`}
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              role="tab"
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="stack curated-sections">
        {visibleSections.map((section) => {
          const isExpanded = expandedSections[section.id] ?? false;
          const visibleItems = isExpanded
            ? section.items
            : section.items.slice(0, section.initialVisibleCount ?? section.items.length);

          return (
            <section className="section" key={section.id}>
              <div className="section-head">
                <div>
                  <p className="eyebrow">{section.id}</p>
                  <h2>{section.title}</h2>
                  <p className="meta">{section.description}</p>
                </div>
              </div>

              {section.items.length ? (
                <>
                  <div className="editorial-grid">
                    {visibleItems.map((item) => (
                      <EditorialCard item={item} key={item.id} />
                    ))}
                  </div>
                  {section.items.length > visibleItems.length ? (
                    <button
                      className="ghost-button show-more-button"
                      onClick={() =>
                        setExpandedSections((current) => ({
                          ...current,
                          [section.id]: true
                        }))
                      }
                      type="button"
                    >
                      <ChevronDown size={16} /> Show more
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="card stack">
                  <h3>Coming soon</h3>
                  <p className="meta">{section.emptyState ?? "This section is planned, but the curated content is not wired yet."}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditorialCard({ item }: { item: EditorialCardItem }) {
  const content = (
    <>
      <div className="row">
        <span className={`entity-chip entity-chip--${item.entityType}`}>{item.eyebrow ?? item.entityType}</span>
        {item.priorityScore ? <span className="tag">Rank {Math.round(item.priorityScore)}</span> : null}
      </div>
      <h3>{item.title}</h3>
      <p className="meta">{item.description}</p>
      <div className="editorial-card-footer">
        {item.meta ? <span className="meta">{item.meta}</span> : <span className="meta">{item.subtitle}</span>}
        {item.href ? (
          <span className="pill">
            Explore <ArrowRight size={15} />
          </span>
        ) : item.isStub ? (
          <span className="tag">Editorial slot</span>
        ) : null}
      </div>
      {item.tags?.length ? (
        <div className="tag-list">
          {item.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  if (item.href) {
    return (
      <Link className="card stack editorial-card" href={item.href}>
        {content}
      </Link>
    );
  }

  return <div className="card stack editorial-card">{content}</div>;
}
