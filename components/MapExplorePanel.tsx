"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { ExploreDimension, ExploreProfile, KnowledgeGraphNode } from "@/lib/types";

const filterOrder: Array<{ id: ExploreDimension; label: string }> = [
  { id: "all", label: "All" },
  { id: "categories", label: "Categories" },
  { id: "families", label: "Families" },
  { id: "dishes", label: "Dishes" },
  { id: "techniques", label: "Techniques" },
  { id: "ingredients", label: "Ingredients" },
  { id: "methods", label: "Methods" },
  { id: "creators", label: "Creators" },
  { id: "recipes", label: "Recipes" }
];

export function MapExplorePanel({
  activeFilter,
  expandedCounts,
  experience,
  nodesById,
  onFilterChange,
  onFocusNode,
  onSeeMore,
  showFilters = true
}: {
  activeFilter: ExploreDimension;
  expandedCounts: Record<string, number>;
  experience: ExploreProfile;
  nodesById: Map<string, KnowledgeGraphNode>;
  onFilterChange: (filter: ExploreDimension) => void;
  onFocusNode: (node: KnowledgeGraphNode) => void;
  onSeeMore: (sectionId: string) => void;
  showFilters?: boolean;
}) {
  const visibleSections = experience.sections.filter((section) => activeFilter === "all" || section.id === activeFilter);
  const availableFilters = filterOrder.filter(
    (filter) => filter.id === "all" || experience.sections.some((section) => section.id === filter.id && section.items.length)
  );

  return (
    <div className="map-explore-panel">
      <div className="detail-kicker">
        <span className="node-kind-dot" />
        {experience.eyebrow}
      </div>
      <h2>{experience.title}</h2>
      <p>{experience.description}</p>

      <div className="tag-list">
        {experience.highlights.map((highlight) => (
          <span className="tag" key={highlight}>
            {highlight}
          </span>
        ))}
      </div>

      <div className="graph-stats" aria-label="Explore summary">
        {experience.stats.map((stat) => (
          <span className="graph-stat" key={stat.label}>
            {stat.label} {stat.value}
          </span>
        ))}
      </div>

      {showFilters && availableFilters.length > 1 ? (
        <div className="filter-rail map-filter-rail" role="tablist" aria-label="Explore filters">
          {availableFilters.map((filter) => (
            <button
              aria-selected={activeFilter === filter.id}
              className={`filter-pill${activeFilter === filter.id ? " active" : ""}`}
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              role="tab"
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-explore-sections">
        {visibleSections.map((section) => {
          const visibleCount = expandedCounts[section.id] ?? section.defaultVisibleCount ?? Math.min(section.items.length, 6);
          const visibleItems = section.items.slice(0, visibleCount);

          return (
            <section className="stack" key={section.id}>
              <div className="row">
                <div>
                  <h3>{section.title}</h3>
                  <p className="meta">{section.description}</p>
                </div>
              </div>

              <div className="map-item-list">
                {visibleItems.map((item) => {
                  const graphNode = nodesById.get(item.nodeId);
                  const button = graphNode ? (
                    <button className="map-item-card" key={item.nodeId} onClick={() => onFocusNode(graphNode)} type="button">
                      <span className={`entity-chip entity-chip--${item.entityType}`}>{item.eyebrow ?? item.entityType}</span>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                      <small>{graphNode.label === item.label ? "Focus on map" : `Focus ${graphNode.label}`}</small>
                    </button>
                  ) : item.href ? (
                    <Link className="map-item-card" href={item.href} key={item.nodeId}>
                      <span className={`entity-chip entity-chip--${item.entityType}`}>{item.eyebrow ?? item.entityType}</span>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                      <small>
                        Open detail <ArrowRight size={13} />
                      </small>
                    </Link>
                  ) : (
                    <div className="map-item-card" key={item.nodeId}>
                      <span className={`entity-chip entity-chip--${item.entityType}`}>{item.eyebrow ?? item.entityType}</span>
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                      <small>Explore slot</small>
                    </div>
                  );
                  return button;
                })}
              </div>

              {section.items.length > visibleItems.length ? (
                <button
                  className="ghost-button"
                  onClick={() => onSeeMore(section.id)}
                  type="button"
                >
                  <ChevronDown size={15} /> See more
                </button>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
