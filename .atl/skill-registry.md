# Skill Registry — angular-helpers

## Project Skills

| Skill                      | Trigger                                             | Source                                               |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| `angular-service-analyzer` | Analyze Angular services, verify service objectives | `~/.claude/skills/angular-service-analyzer/SKILL.md` |

## SDD Skills (OpenSpec File Mode)

Backend: **OpenSpec Local Files** (files in `.sdd/` directory)

| Skill         | Trigger                             | OpenSpec File Pattern                     |
| ------------- | ----------------------------------- | ----------------------------------------- |
| `sdd-init`    | Initialize SDD context              | `.atl/testing-capabilities.json`          |
| `sdd-explore` | Investigate ideas before committing | (no artifact, dynamic exploration)        |
| `sdd-propose` | Create change proposal              | `.sdd/proposal-{change-slug}.md`          |
| `sdd-spec`    | Write specifications                | `.sdd/spec-{change-slug}.md`              |
| `sdd-design`  | Technical design                    | `.sdd/design-{change-slug}.md`            |
| `sdd-tasks`   | Task breakdown                      | `.sdd/tasks-{change-slug}.md`             |
| `sdd-apply`   | Implement tasks                     | `.sdd/tasks-{change-slug}.md` (status)    |
| `sdd-verify`  | Validate implementation             | (validation output/reports)               |
| `sdd-archive` | Archive completed change            | Moves completed files to `.sdd/.archive/` |

**Multi-change support**: Each change has a unique slug and corresponding spec files in `.sdd/`.

## Project Conventions

| File        | Role                                                                |
| ----------- | ------------------------------------------------------------------- |
| `AGENTS.md` | Angular/TypeScript coding standards, accessibility, signals, OnPush |
