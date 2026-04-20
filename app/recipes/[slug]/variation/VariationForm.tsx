"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Save } from "lucide-react";
import type { RecipeWithDetails } from "@/lib/types";

export function VariationForm({ recipe }: { recipe: RecipeWithDetails }) {
  const router = useRouter();
  const [title, setTitle] = useState(`${recipe.title}, my way`);
  const [description, setDescription] = useState(`A personal variation of ${recipe.title}.`);
  const [ingredients, setIngredients] = useState(recipe.ingredients.map((item) => item.rawText));
  const [steps, setSteps] = useState(recipe.steps.map((step) => step.instructionText));
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  async function saveVariation() {
    setStatus("Saving variation...");
    const response = await fetch("/api/variations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentSlug: recipe.slug,
        title,
        description,
        ingredients,
        steps,
        note
      })
    });
    if (!response.ok) {
      setStatus("Could not save the variation.");
      return;
    }
    const body = (await response.json()) as { slug: string };
    router.push(`/recipes/${body.slug}`);
  }

  return (
    <div className="split">
      <section className="card stack">
        <div className="field">
          <label htmlFor="title">Version name</label>
          <input id="title" className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Summary</label>
          <textarea
            id="description"
            className="textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="note">Why did you change it?</label>
          <textarea
            id="note"
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="For example: faster weeknight version, less heat, pantry-friendly swap."
          />
        </div>
        <button className="button" type="button" onClick={saveVariation}>
          <Save size={16} /> Save variation
        </button>
        {status ? <p className="notice">{status}</p> : null}
      </section>

      <section className="stack">
        <div className="card stack">
          <div className="section-head">
            <h2>Ingredients</h2>
            <button className="ghost-button" type="button" onClick={() => setIngredients([...ingredients, ""])}>
              <Plus size={16} /> Add ingredient
            </button>
          </div>
          {ingredients.map((ingredient, index) => (
            <div className="field" key={`ingredient-${index}`}>
              <label htmlFor={`ingredient-${index}`}>Ingredient {index + 1}</label>
              <input
                id={`ingredient-${index}`}
                className="input"
                value={ingredient}
                onChange={(event) => {
                  const next = [...ingredients];
                  next[index] = event.target.value;
                  setIngredients(next);
                }}
              />
            </div>
          ))}
        </div>

        <div className="card stack">
          <div className="section-head">
            <h2>Steps</h2>
            <button className="ghost-button" type="button" onClick={() => setSteps([...steps, ""])}>
              <Plus size={16} /> Add step
            </button>
          </div>
          {steps.map((step, index) => (
            <div className="field" key={`step-${index}`}>
              <label htmlFor={`step-${index}`}>Step {index + 1}</label>
              <textarea
                id={`step-${index}`}
                className="textarea"
                value={step}
                onChange={(event) => {
                  const next = [...steps];
                  next[index] = event.target.value;
                  setSteps(next);
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

