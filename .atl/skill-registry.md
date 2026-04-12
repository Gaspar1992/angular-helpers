# Skill Registry — angular-helpers

## Project Skills

| Skill                      | Trigger                                             | Source                                               |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| `angular-service-analyzer` | Analyze Angular services, verify service objectives | `~/.claude/skills/angular-service-analyzer/SKILL.md` |

## SDD Skills (Engram-Only Mode)

Backend: **Engram persistent memory** (no .sdd/ files)

| Skill         | Trigger                             | Engram topic_key pattern       |
| ------------- | ----------------------------------- | ------------------------------ |
| `sdd-init`    | Initialize SDD context              | `sdd/{project}/conventions`    |
| `sdd-explore` | Investigate ideas before committing | (no artifact, uses mem_search) |
| `sdd-propose` | Create change proposal              | `sdd/{change-slug}/proposal`   |
| `sdd-spec`    | Write specifications                | `sdd/{change-slug}/spec`       |
| `sdd-design`  | Technical design                    | `sdd/{change-slug}/design`     |
| `sdd-tasks`   | Task breakdown                      | `sdd/{change-slug}/tasks`      |
| `sdd-apply`   | Implement tasks                     | `sdd/{change-slug}/status`     |
| `sdd-verify`  | Validate implementation             | `sdd/{change-slug}/status`     |
| `sdd-archive` | Archive completed change            | `sdd/{change-slug}/status`     |

**Multi-change support**: Each change has unique slug. Search with `mem_search query="sdd/"`.

## Project Conventions

| File        | Role                                                                |
| ----------- | ------------------------------------------------------------------- |
| `AGENTS.md` | Angular/TypeScript coding standards, accessibility, signals, OnPush |
