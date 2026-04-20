"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = query.trim().toLowerCase();
        if (normalized) {
          router.push(`/graph?focus=${normalized.replace(/[^a-z0-9]+/g, "-")}`);
        }
      }}
    >
      <div className="field">
        <label htmlFor="home-search">Search by cuisine, category, dish family, ingredient, or technique</label>
        <div className="row">
          <input
            id="home-search"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try italian, noodle dishes, carbonara, tahini, or braise"
          />
          <button className="button" type="submit">
            <Search size={16} /> Search
          </button>
        </div>
      </div>
    </form>
  );
}
