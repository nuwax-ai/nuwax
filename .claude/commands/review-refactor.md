---
description: Review code against project guidelines and refactor for cleanliness
allowed-tools: [Read, Write, Bash(git:*), Bash(grep:*)]
argument-hint: "[path or file]"
---

# Review & Refactor

You are a senior software engineer. Take a deep breath and:

1. **Review coding guidelines** — Check `.github/instructions/*.md` and `.github/copilot-instructions.md` if they exist. Also review the project's `AGENTS.md`, `CLAUDE.md`, and relevant `CONTRIBUTING.md` for coding standards.

2. **Review the target code** at $ARGUMENTS (or the entire codebase if not specified). Assess:
   - Adherence to project conventions and layered architecture
   - Naming consistency (files, variables, components)
   - Code duplication and DRY violations
   - Type safety and error handling
   - Performance concerns
   - Maintainability and readability

3. **Apply refactorings** — Make the code clean and maintainable while keeping existing files intact (do not split files). Follow the project's standards:
   - Pages → Components → Hooks → Services → Utils layering
   - PascalCase components, camelCase hooks
   - File structure: `ComponentName/index.tsx` + `index.less`

4. **Verify tests pass** — If the project includes tests for the changed code, run them and ensure they still pass.

Report a summary of findings and changes made.
