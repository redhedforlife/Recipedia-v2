import { ImportForm } from "@/app/admin/import/ImportForm";
import { getData } from "@/lib/data";

export default async function ImportPage() {
  const data = await getData();

  return (
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Internal tool</p>
          <h1>Import a Serious Eats recipe</h1>
          <p className="lede">
            The MVP importer tries recipe-scrapers first, then JSON-LD recipe data, then a Beautiful Soup fallback.
          </p>
        </div>
      </div>
      <div className="split">
        <ImportForm families={data.families} />
        <aside className="card stack">
          <h3>Import rules</h3>
          <p className="meta">Only Serious Eats URLs are accepted in this MVP.</p>
          <p className="meta">Attribution, extraction method, confidence, source URL, and imported timestamp are stored.</p>
          <p className="meta">Install Python dependencies with: pip install -r requirements.txt</p>
        </aside>
      </div>
    </main>
  );
}

