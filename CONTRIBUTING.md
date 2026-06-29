# Contributing to Angular Helpers

We love contributions! To keep the project maintainable, please follow these guidelines based on the GitHub Flow.

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/angular-helpers.git
   cd angular-helpers
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Generate local SSL certificates** (needed for secure browser APIs):
   ```bash
   pnpm run ssl:generate
   ```

## 🌿 Branching Strategy

- Always create a new branch from `main` for your changes:
  ```bash
  git checkout -b feat/your-feature-name
  # or
  git checkout -b fix/your-bug-name
  ```

## ✍️ Coding Standards

- We use **TypeScript** and **Angular** best practices.
- Standalone components are mandatory.
- Signals are preferred for state management.
- Formatting is managed by `oxfmt` and linting by `oxlint`/`eslint`.

Before committing, run the verification tasks:

```bash
# Check formatting
pnpm run format:check

# Run linter
pnpm run lint

# Run unit tests
pnpm test
```

## 📝 Commit Messages

We enforce **Conventional Commits**. Your commit messages must follow this format:

```
<type>(<scope>): <description>
```

Examples:

- `feat(storage): add IndexedDB transport`
- `fix(security): resolve ReDoS vulnerability in password validator`
- `docs(readme): update installation instructions`

_Note: Do not add "Co-Authored-By" or AI attribution to commits._

## 🔀 Pull Requests

1. Push your branch to your fork.
2. Open a **Pull Request** targeting the `main` branch of the original repository.
3. Ensure all CI checks (linting, formatting, unit tests, and browser smoke tests) pass.
4. Maintainers will review your PR and merge it once approved.
