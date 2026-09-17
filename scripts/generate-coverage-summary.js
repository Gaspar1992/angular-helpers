import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

function getStatusBadge(pct) {
  if (pct >= 80) return '🟢';
  if (pct >= 60) return '🟡';
  return '🔴';
}

function formatRow(name, data) {
  const badge = getStatusBadge(data.pct);
  return `| **${name}** | **${data.pct}%** | ${badge} | ${data.covered} / ${data.total} |`;
}

function run() {
  const summaryPath = resolve(process.cwd(), 'coverage/coverage-summary.json');
  if (!existsSync(summaryPath)) {
    console.log('No coverage summary found at', summaryPath);
    return;
  }

  const raw = readFileSync(summaryPath, 'utf8');
  let summary;
  try {
    summary = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse coverage-summary.json:', err.message);
    return;
  }

  const total = summary.total;
  if (!total) {
    console.log('No total coverage metrics found.');
    return;
  }

  const lines = [
    '## 📊 Test Coverage Summary',
    '',
    '| Metric | Coverage | Status | Covered / Total |',
    '| :--- | :---: | :---: | :---: |',
    formatRow('Lines', total.lines),
    formatRow('Statements', total.statements),
    formatRow('Functions', total.functions),
    formatRow('Branches', total.branches),
    '',
  ];

  // Group by packages/libraries
  const packageStats = new Map();
  for (const [filePath, stats] of Object.entries(summary)) {
    if (filePath === 'total') continue;

    let pkg = 'other';
    const match = filePath.match(/(?:libs|apps)\/([^/]+)/);
    if (match) {
      pkg = match[0];
    }

    if (!packageStats.has(pkg)) {
      packageStats.set(pkg, {
        lines: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
      });
    }

    const current = packageStats.get(pkg);
    for (const key of ['lines', 'statements', 'functions', 'branches']) {
      current[key].total += stats[key].total || 0;
      current[key].covered += stats[key].covered || 0;
    }
  }

  if (packageStats.size > 0) {
    lines.push('<details>');
    lines.push('<summary><strong>📦 Coverage by Package / App</strong></summary>');
    lines.push('');
    lines.push('| Package | Lines | Statements | Functions | Branches |');
    lines.push('| :--- | :---: | :---: | :---: | :---: |');

    const sortedPackages = Array.from(packageStats.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    for (const [pkg, stats] of sortedPackages) {
      const calcPct = (m) => (m.total > 0 ? ((m.covered / m.total) * 100).toFixed(1) : '100.0');
      const linesPct = Number(calcPct(stats.lines));
      const stmtsPct = Number(calcPct(stats.statements));
      const funcsPct = Number(calcPct(stats.functions));
      const branchPct = Number(calcPct(stats.branches));

      lines.push(
        `| \`${pkg}\` | ${linesPct}% ${getStatusBadge(linesPct)} | ${stmtsPct}% ${getStatusBadge(stmtsPct)} | ${funcsPct}% ${getStatusBadge(funcsPct)} | ${branchPct}% ${getStatusBadge(branchPct)} |`,
      );
    }

    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  lines.push('> [!TIP]');
  lines.push(
    '> Download the `coverage-report` artifact from this run to explore full line-by-line HTML reports.',
  );
  lines.push('');

  const markdown = lines.join('\n');

  console.log(markdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
    console.log('Successfully written to GITHUB_STEP_SUMMARY');
  }
}

run();
