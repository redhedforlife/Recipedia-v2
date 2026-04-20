"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";

export function CookReportForm({ recipeSlug }: { recipeSlug: string }) {
  const [status, setStatus] = useState<string>("");

  return (
    <form
      className="form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/cook-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeSlug,
            madeIt: form.get("madeIt") === "on",
            rating: Number(form.get("rating") || 4),
            wouldMakeAgain: form.get("wouldMakeAgain") === "on",
            difficultyRating: Number(form.get("difficultyRating") || 3),
            notes: String(form.get("notes") || "")
          })
        });
        setStatus(response.ok ? "Saved your cook report." : "Could not save the cook report.");
      }}
    >
      <div className="row">
        <label className="pill">
          <input defaultChecked name="madeIt" type="checkbox" /> Made it
        </label>
        <label className="pill">
          <input defaultChecked name="wouldMakeAgain" type="checkbox" /> Would make again
        </label>
      </div>
      <div className="grid two">
        <label className="field">
          <span>Rating</span>
          <select className="select" name="rating" defaultValue="5">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Difficulty</span>
          <select className="select" name="difficultyRating" defaultValue="3">
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Cook notes</span>
        <textarea className="textarea" name="notes" placeholder="What worked, what changed, what you would do next." />
      </label>
      <button className="button" type="submit">
        <ClipboardCheck size={16} /> Log how it turned out
      </button>
      {status ? <p className="notice">{status}</p> : null}
    </form>
  );
}

