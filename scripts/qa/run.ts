import { runPublishedQaChecks } from "@/lib/pipeline/stages/runQa";

async function main() {
  const report = await runPublishedQaChecks();
  console.log("QA complete", {
    totalIssues: report.totalIssues,
    errorCount: report.errorCount,
    warningCount: report.warningCount
  });

  if (report.errorCount > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
