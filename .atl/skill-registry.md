# Skill Registry — angular-helpers

## Project Skills

| Skill                       | Trigger                                                                                                                                  | Source                                      |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| `angular-performance-tuner` | Guidelines and instructions for tuning Angular application performance, ensuring zoneless safety, and enforcing accessibility standards. | `skills/angular-performance-tuner/SKILL.md` |

## SDD Skills (OpenSpec Directory Mode)

Backend: **OpenSpec Local Files** (files in `openspec/` directory)

| Skill         | Trigger                             | OpenSpec File Pattern                                  |
| :------------ | :---------------------------------- | :----------------------------------------------------- |
| `sdd-init`    | Initialize SDD context              | `openspec/config.yaml`                                 |
| `sdd-explore` | Investigate ideas before committing | (no artifact, dynamic exploration)                     |
| `sdd-propose` | Create change proposal              | `openspec/proposal.md`                                 |
| `sdd-spec`    | Write specifications                | `openspec/specs/{feature-slug}/spec.md`                |
| `sdd-design`  | Technical design                    | `openspec/changes/{change-slug}/design.md`             |
| `sdd-tasks`   | Task breakdown                      | `openspec/changes/{change-slug}/tasks.md`              |
| `sdd-apply`   | Implement tasks                     | `openspec/changes/{change-slug}/tasks.md`              |
| `sdd-verify`  | Validate implementation             | `openspec/changes/{change-slug}/verify-report.md`      |
| `sdd-archive` | Archive completed change            | Moves completed changes to `openspec/changes/archive/` |

**Multi-change support**: Each change has a unique directory in `openspec/changes/` and specifications in `openspec/specs/`.

## Global Skills & Installed Plugins

| Skill                   | Trigger                                                                                                                                                | Source                                                                                                   |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `a11y-debugging`        | Accessibility (a11y) debugging and auditing based on web.dev guidelines.                                                                               | `/home/gasparrv92/.gemini/config/plugins/chrome-devtools-plugin/skills/a11y-debugging/SKILL.md`          |
| `angular-developer`     | Generates Angular code and provides architectural guidance. Trigger when creating components, services, reactivity (signals), routing, SSR, ARIA, etc. | `/home/gasparrv92/.agents/skills/angular-developer/SKILL.md`                                             |
| `branch-pr`             | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review.                                       | `/home/gasparrv92/.gemini/antigravity-cli/skills/branch-pr/SKILL.md`                                     |
| `chained-pr`            | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs.                                                     | `/home/gasparrv92/.gemini/antigravity-cli/skills/chained-pr/SKILL.md`                                    |
| `chrome-devtools`       | Uses Chrome DevTools via MCP for browser debugging, automation, performance, network inspection.                                                       | `/home/gasparrv92/.gemini/config/plugins/chrome-devtools-plugin/skills/chrome-devtools/SKILL.md`         |
| `chrome-extensions`     | Build and publish Chrome Extensions using Manifest V3 best practices.                                                                                  | `/home/gasparrv92/.gemini/config/plugins/modern-web-guidance-plugin/skills/chrome-extensions/SKILL.md`   |
| `cognitive-doc-design`  | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture.                                              | `/home/gasparrv92/.gemini/antigravity-cli/skills/cognitive-doc-design/SKILL.md`                          |
| `comment-writer`        | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, GitHub comments.                                              | `/home/gasparrv92/.gemini/antigravity-cli/skills/comment-writer/SKILL.md`                                |
| `debug-optimize-lcp`    | Guides debugging and optimizing Largest Contentful Paint (LCP) using Chrome DevTools MCP.                                                              | `/home/gasparrv92/.gemini/config/plugins/chrome-devtools-plugin/skills/debug-optimize-lcp/SKILL.md`      |
| `go-testing`            | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files.                                                                                  | `/home/gasparrv92/.gemini/antigravity-cli/skills/go-testing/SKILL.md`                                    |
| `issue-creation`        | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, feature requests.                                       | `/home/gasparrv92/.gemini/antigravity-cli/skills/issue-creation/SKILL.md`                                |
| `judgment-day`          | Trigger: judgment day, dual review, adversarial review. Run blind dual review, fix confirmed issues.                                                   | `/home/gasparrv92/.gemini/antigravity-cli/skills/judgment-day/SKILL.md`                                  |
| `memory-leak-debugging` | Diagnoses and resolves memory leaks in JavaScript/Node.js applications.                                                                                | `/home/gasparrv92/.gemini/config/plugins/chrome-devtools-plugin/skills/memory-leak-debugging/SKILL.md`   |
| `modern-web-guidance`   | Search tool for modern web development best practices (UI/Layout, Scroll/Motion, CWV, Web APIs).                                                       | `/home/gasparrv92/.gemini/config/plugins/modern-web-guidance-plugin/skills/modern-web-guidance/SKILL.md` |
| `ponytail`              | Switch ponytail intensity level (lite/full/ultra/off).                                                                                                 | `/home/gasparrv92/.gemini/config/plugins/ponytail/skills/ponytail/SKILL.md`                              |
| `ponytail-audit`        | Audit the repo for over-engineering and code deletion opportunities.                                                                                   | `/home/gasparrv92/.gemini/config/plugins/ponytail/skills/ponytail-audit/SKILL.md`                        |
| `ponytail-gain`         | Show ponytail's measured impact scoreboard.                                                                                                            | `/home/gasparrv92/.gemini/config/plugins/ponytail/skills/ponytail-gain/SKILL.md`                         |
| `ponytail-help`         | Quick reference for ponytail levels, skills, and commands.                                                                                             | `/home/gasparrv92/.gemini/config/plugins/ponytail/skills/ponytail-help/SKILL.md`                         |
| `ponytail-review`       | Review changes for over-engineering and code deletion opportunities.                                                                                   | `/home/gasparrv92/.gemini/config/plugins/ponytail/skills/ponytail-review/SKILL.md`                       |
| `skill-creator`         | Trigger: new skills, agent instructions. Create LLM-first skills with valid frontmatter.                                                               | `/home/gasparrv92/.gemini/antigravity-cli/skills/skill-creator/SKILL.md`                                 |
| `skill-improver`        | Trigger: improve skills, audit skills, refactor skills. Audit and upgrade existing skills.                                                             | `/home/gasparrv92/.gemini/antigravity-cli/skills/skill-improver/SKILL.md`                                |
| `troubleshooting`       | Uses Chrome DevTools MCP and documentation to troubleshoot connection and target issues.                                                               | `/home/gasparrv92/.gemini/config/plugins/chrome-devtools-plugin/skills/troubleshooting/SKILL.md`         |
| `work-unit-commits`     | Plan commits as reviewable work units.                                                                                                                 | `/home/gasparrv92/.gemini/antigravity-cli/skills/work-unit-commits/SKILL.md`                             |

## Project Conventions

| File        | Role                                                        |
| :---------- | :---------------------------------------------------------- |
| `AGENTS.md` | Angular/TypeScript coding standards, accessibility, signals |
