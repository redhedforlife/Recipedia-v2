"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import type { RecipeFamily } from "@/lib/types";

export function ImportForm({ families }: { families: RecipeFamily[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("https://www.seriouseats.com/the-best-chili-recipe");
  const [familySlug, setFamilySlug] = useState(families[0]?.slug ?? "");
  const [status, setStatus] = useState("");

  return (
    <form
      className="card form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("Fetching and extracting the recipe...");
        const response = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, familySlug })
        });
        const body = (await response.json()) as { slug?: string; error?: string };
        if (!response.ok || !body.slug) {
          setStatus(body.error ?? "Import failed.");
          return;
        }
        router.push(`/recipes/${body.slug}`);
      }}
    >
      <label className="field">
        <span>Serious Eats URL</span>
        <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} />
      </label>
      <label className="field">
        <span>Recipe family</span>
        <select className="select" value={familySlug} onChange={(event) => setFamilySlug(event.target.value)}>
          {families.map((family) => (
            <option key={family.id} value={family.slug}>
              {family.displayName}
            </option>
          ))}
        </select>
      </label>
      <button className="button" type="submit">
        <Download size={16} /> Import recipe
      </button>
      {status ? <p className="notice">{status}</p> : null}
    </form>
  );
}

