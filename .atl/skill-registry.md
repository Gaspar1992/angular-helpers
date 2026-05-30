# Skill Registry — angular-helpers

## Project Skills

| Skill                      | Trigger                                             | Source                                               |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| `angular-service-analyzer` | Analyze Angular services, verify service objectives | `~/.claude/skills/angular-service-analyzer/SKILL.md` |

## SDD Skills (OpenSpec Directory Mode)

Backend: **OpenSpec Local Files** (files in `openspec/` directory)

| Skill         | Trigger                             | OpenSpec File Pattern                                  |
| ------------- | ----------------------------------- | ------------------------------------------------------ |
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

## Project Conventions

| File        | Role                                                                |
| ----------- | ------------------------------------------------------------------- |
| `AGENTS.md` | Angular/TypeScript coding standards, accessibility, signals, OnPush |
