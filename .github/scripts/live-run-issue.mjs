// Opens one issue when the weekly live API run fails, or comments on the one already open.
import { existsSync, readFileSync } from 'node:fs';

export const marker = 'Live API run failed';

/** Every failed test in a Playwright JSON report, as "file › title". */
export function failedTests(report) {
  const failed = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs ?? []) if (!spec.ok) failed.push(`${spec.file ?? file} › ${spec.title}`);
    for (const child of suite.suites ?? []) walk(child, suite.file ?? file);
  };
  for (const suite of report.suites ?? []) walk(suite, suite.file);
  return failed;
}

export async function openOrComment({ github, context, reportPath }) {
  const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : {};
  const tests = failedTests(report);
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const date = new Date().toISOString().slice(0, 10);
  const list = tests.length ? tests.map((t) => `- ${t}`).join('\n') : '- The run failed before any test reported; see the run log.';
  const body = `The weekly run against the live Humanbase API failed on ${date}.\n\n**Failing tests**\n${list}\n\n[Open the run](${runUrl}). The report is attached to the run as live-report.`;

  const open = await github.paginate(github.rest.issues.listForRepo, { ...context.repo, state: 'open', labels: 'api', per_page: 100 });
  const existing = open.find((issue) => issue.title.startsWith(marker));
  if (existing) {
    await github.rest.issues.createComment({ ...context.repo, issue_number: existing.number, body });
    return `commented on #${existing.number}`;
  }
  const { data } = await github.rest.issues.create({ ...context.repo, title: `${marker} on ${date}`, body, labels: ['bug', 'api'] });
  return `opened #${data.number}`;
}

