---
description: Run tests, analyze failures, and auto-apply fixes
allowed-tools: [Read, Write, Bash(pnpm:*), Bash(vitest:*)]
---

# Test & Fix Cycle

1. **Run the tests** using the project's test runner:
   ```
   pnpm test
   ```

2. **Analyze failures** — For each failing test, extract:
   - File path and line number
   - Expected vs actual values
   - Error message and stack trace

3. **Apply fixes** — For each failure:
   - Read the test file and the source file it tests
   - Determine if the fix should be in the test (test was wrong) or the source (bug in code)
   - Apply the minimal fix
   - Re-run that specific test to verify

4. **Re-run full suite** — After all fixes, run the full test suite again to catch regressions.

Report a summary: total tests, passed, failed, fixed, and any remaining issues.
