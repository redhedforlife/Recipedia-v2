import { CsvImportManager } from "@/app/admin/import/CsvImportManager";
import { ImportForm } from "@/app/admin/import/ImportForm";
import { getData } from "@/lib/data";

export default async function ImportPage() {
  const data = await getData();

  return (
    <main className="container section stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Data management</p>
          <h1>CSV Import Staging + Publish</h1>
          <p className="lede">
            Postgres is the canonical source of truth. Upload CSV into staging, validate schema and references, inspect preview,
            then publish.
          </p>
        </div>
      </div>

      <CsvImportManager />

      <section className="card stack">
        <h2>Legacy URL Import (optional)</h2>
        <p className="meta">Existing Serious Eats URL import remains available for manual enrichment workflows.</p>
        <ImportForm families={data.families} />
      </section>
    </main>
  );
}
