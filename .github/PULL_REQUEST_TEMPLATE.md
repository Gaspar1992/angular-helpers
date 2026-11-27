## Summary

<!-- What changed and why? Keep it concise and scannable. -->

## Scope

- [ ] Libraries (`libs/*`)
- [ ] Documentation / Demo App (`apps/web`)
- [ ] Internal Docs / Tooling (`README.md`, `docs/`, `scripts/`)

## Verification

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm build:packages:prod && pnpm lint:packages`
- [ ] `pnpm test:ci`
- [ ] `pnpm nx build web` (0 budget warnings)

## Notes for Reviewers

<!-- Any breaking changes, follow-ups, or links to demos/docs. -->
