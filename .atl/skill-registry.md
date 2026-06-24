# Skill Registry — angular-helpers

## Project Skills

| Skill                       | Trigger                                                                                                                                  | Source                                               |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `angular-performance-tuner` | Guidelines and instructions for tuning Angular application performance, ensuring zoneless safety, and enforcing accessibility standards. | `skills/angular-performance-tuner/SKILL.md`          |
| `angular-service-analyzer`  | Analyze Angular services, verify service objectives                                                                                      | `~/.claude/skills/angular-service-analyzer/SKILL.md` |

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

## Global Skills

| Skill                  | Trigger                                                                                                                             | Source                                                                          |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| `branch-pr`            | Create Gentle AI pull requests with issue-first checks. Trigger: creating, opening, or preparing PRs for review.                    | `/home/gasparrv92/.gemini/antigravity-cli/skills/branch-pr/SKILL.md`            |
| `chained-pr`           | Trigger: PRs over 400 lines, stacked PRs, review slices. Split oversized changes into chained PRs that protect review focus.        | `/home/gasparrv92/.gemini/antigravity-cli/skills/chained-pr/SKILL.md`           |
| `cognitive-doc-design` | Design docs that reduce cognitive load. Trigger: writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.    | `/home/gasparrv92/.gemini/antigravity-cli/skills/cognitive-doc-design/SKILL.md` |
| `comment-writer`       | Write warm, direct collaboration comments. Trigger: PR feedback, issue replies, reviews, Slack messages, or GitHub comments.        | `/home/gasparrv92/.gemini/antigravity-cli/skills/comment-writer/SKILL.md`       |
| `go-testing`           | Trigger: Go tests, go test coverage, Bubbletea teatest, golden files. Apply focused Go testing patterns.                            | `/home/gasparrv92/.gemini/antigravity-cli/skills/go-testing/SKILL.md`           |
| `issue-creation`       | Create Gentle AI issues with issue-first checks. Trigger: creating GitHub issues, bug reports, or feature requests.                 | `/home/gasparrv92/.gemini/antigravity-cli/skills/issue-creation/SKILL.md`       |
| `judgment-day`         | Trigger: judgment day, dual review, adversarial review, juzgar. Run blind dual review, fix confirmed issues, then re-judge.         | `/home/gasparrv92/.gemini/antigravity-cli/skills/judgment-day/SKILL.md`         |
| `skill-creator`        | Trigger: new skills, agent instructions, documenting AI usage patterns. Create LLM-first skills with valid frontmatter.             | `/home/gasparrv92/.gemini/antigravity-cli/skills/skill-creator/SKILL.md`        |
| `skill-improver`       | Trigger: improve skills, audit skills, refactor skills, skill quality. Audit and upgrade existing LLM-first skills.                 | `/home/gasparrv92/.gemini/antigravity-cli/skills/skill-improver/SKILL.md`       |
| `work-unit-commits`    | Plan commits as reviewable work units. Trigger: implementation, commit splitting, chained PRs, or keeping tests and docs with code. | `/home/gasparrv92/.gemini/antigravity-cli/skills/work-unit-commits/SKILL.md`    |

## Project Conventions

| File        | Role                                                        |
| :---------- | :---------------------------------------------------------- |
| `AGENTS.md` | Angular/TypeScript coding standards, accessibility, signals |
