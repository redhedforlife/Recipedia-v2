"use client";

import { useMemo, useState } from "react";

type EntityType = "nodes" | "edges" | "recipes" | "ingredients" | "recipe_ingredients" | "sources" | "variations";

type Issue = {
  code: string;
  message: string;
  field?: string;
};

type StageResponse = {
  batchId: string;
  entityType: EntityType;
  status: "preview_ready" | "validation_failed" | "published";
  rowCount: number;
  validRowCount: number;
  errorCount: number;
  warningCount: number;
  previewRows: Array<{
    rowNumber: number;
    normalizedRow: Record<string, string>;
    blockingErrors: Issue[];
    warnings: Issue[];
  }>;
};

const ENTITY_OPTIONS: Array<{ value: EntityType; label: string }> = [
  { value: "nodes", label: "Graph nodes" },
  { value: "edges", label: "Graph edges" },
  { value: "recipes", label: "Recipes" },
  { value: "ingredients", label: "Ingredients" },
  { value: "recipe_ingredients", label: "Recipe ingredients" },
  { value: "sources", label: "Sources" },
  { value: "variations", label: "Recipe lineage variations" }
];

export function CsvImportManager() {
  const [entityType, setEntityType] = useState<EntityType>("recipes");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [staged, setStaged] = useState<StageResponse | null>(null);

  const canPublish = staged?.status === "preview_ready" && staged.errorCount === 0;

  const previewHeaders = useMemo(() => {
    if (!staged?.previewRows.length) return [];
    return Object.keys(staged.previewRows[0].normalizedRow).slice(0, 8);
  }, [staged]);

  async function stageCsv() {
    if (!file) {
      setMessage("Select a CSV file first.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Staging CSV and running validation...");
    setStaged(null);

    try {
      const formData = new FormData();
      formData.append("entityType", entityType);
      formData.append("file", file);

      const response = await fetch("/api/import/csv/stage", {
        method: "POST",
        body: formData
      });

      const body = (await response.json()) as StageResponse | { error: string };
      if (!response.ok || "error" in body) {
        setMessage((body as { error: string }).error ?? "Could not stage CSV.");
        return;
      }

      setStaged(body);
      if (body.status === "preview_ready") {
        setMessage(`Preview ready. ${body.validRowCount}/${body.rowCount} rows are publishable.`);
      } else {
        setMessage(`Validation failed. Fix ${body.errorCount} blocking issues before publishing.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not stage CSV.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function publishBatch() {
    if (!staged?.batchId || !canPublish) return;

    setIsPublishing(true);
    setMessage("Publishing staged rows to Postgres...");

    try {
      const response = await fetch("/api/import/csv/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: staged.batchId })
      });

      const body = (await response.json()) as { publishedCount?: number; status?: string; error?: string };
      if (!response.ok || body.error) {
        setMessage(body.error ?? "Publish failed.");
        return;
      }

      setMessage(`Published ${body.publishedCount ?? 0} rows.`);
      setStaged((previous) =>
        previous
          ? {
              ...previous,
              status: "published"
            }
          : previous
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section className="card stack">
      <h2>CSV Staging Import</h2>
      <p className="meta">
        Upload CSV to staging, run schema and FK validation, detect duplicates, inspect preview rows, then publish to Postgres.
      </p>

      <label className="field">
        <span>Entity type</span>
        <select className="select" value={entityType} onChange={(event) => setEntityType(event.target.value as EntityType)}>
          {ENTITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>CSV file</span>
        <input
          className="input"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="button-row">
        <button className="button" type="button" onClick={stageCsv} disabled={isSubmitting || isPublishing}>
          {isSubmitting ? "Staging..." : "Stage CSV"}
        </button>
        <button className="button ghost" type="button" onClick={publishBatch} disabled={!canPublish || isPublishing || isSubmitting}>
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>

      {message ? <p className="notice">{message}</p> : null}

      {staged ? (
        <div className="stack">
          <p className="meta">
            Batch <code>{staged.batchId}</code> · status: <strong>{staged.status}</strong>
          </p>
          <p className="meta">
            Rows: {staged.rowCount} · valid: {staged.validRowCount} · errors: {staged.errorCount} · warnings: {staged.warningCount}
          </p>

          {staged.previewRows.length ? (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Row</th>
                    {previewHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {staged.previewRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      {previewHeaders.map((header) => (
                        <td key={`${row.rowNumber}-${header}`}>{row.normalizedRow[header] ?? ""}</td>
                      ))}
                      <td>
                        {row.blockingErrors.map((issue) => (
                          <p key={`${row.rowNumber}-e-${issue.code}-${issue.field ?? ""}`} className="meta">
                            Error: {issue.message}
                          </p>
                        ))}
                        {row.warnings.map((issue) => (
                          <p key={`${row.rowNumber}-w-${issue.code}-${issue.field ?? ""}`} className="meta">
                            Warning: {issue.message}
                          </p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
