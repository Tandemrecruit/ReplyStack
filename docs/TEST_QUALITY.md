# Verifying Test Quality

This guide explains how to ensure your tests actually catch bugs and aren't just written to pass.

## Quick Techniques

### 1. **Test Coverage Reports**

Run coverage to see what code is actually being exercised:

```bash
npm run test:coverage
```

This generates:
- Terminal output showing coverage percentages
- HTML report in `coverage/index.html` (open in browser)
- JSON report for CI integration

**What to look for:**
- Low coverage (< 70%) indicates untested code paths
- High coverage but weak tests = false confidence
- Missing edge cases (error handling, boundary conditions)

**Coverage thresholds** (configured in `vitest.config.ts`):
- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

### 2. **Manual Mutation Testing**

Intentionally break your code to see if tests catch it. This is the most practical way to verify test quality.

**Technique:**
1. Make a small, realistic bug in production code
2. Run tests
3. If tests still pass → your tests are too weak
4. Revert the bug

**Example mutations to try:**

```typescript
// Original code
if (error.status === 401 || error.status === 403) {
  throw error;
}

// Mutation 1: Change operator
if (error.status === 401 && error.status === 403) {  // Always false!
  throw error;
}
// ✅ Good test should fail (tests should verify 401/403 are not retried)

// Mutation 2: Remove condition
// if (error.status === 401 || error.status === 403) {
//   throw error;
// }
// ✅ Good test should fail (tests should verify errors are thrown)

// Mutation 3: Change value
if (error.status === 400 || error.status === 403) {  // Wrong status code
  throw error;
}
// ✅ Good test should fail (tests should use correct status codes)
```

**Common mutations:**
- Change `===` to `!==` or `==`
- Change `&&` to `||` or vice versa
- Remove error handling blocks
- Change return values (e.g., `return true` → `return false`)
- Remove null/undefined checks
- Change comparison operators (`>` → `<`, `>=` → `<=`)

### 3. **Review Test Assertions**

Look for these **test smells** that indicate weak tests:

#### ❌ Bad: Testing implementation details
```typescript
// BAD: Tests internal state, not behavior
expect(component.state.isLoading).toBe(true);
```

#### ✅ Good: Testing user-visible behavior
```typescript
// GOOD: Tests what user sees
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

#### ❌ Bad: Trivial assertions
```typescript
// BAD: Always passes, doesn't verify anything meaningful
expect(result).toBeDefined();
```

#### ✅ Good: Specific, meaningful assertions
```typescript
// GOOD: Verifies actual behavior
expect(result.text).toBe("Thank you for your review!");
expect(result.tokensUsed).toBe(120);
```

#### ❌ Bad: Missing error cases
```typescript
// BAD: Only tests happy path
it("generates response", async () => {
  const result = await generateResponse(review, profile, "Biz");
  expect(result).toBeDefined();
});
```

#### ✅ Good: Tests both success and failure
```typescript
// GOOD: Tests multiple scenarios
it("generates response on success", async () => { /* ... */ });
it("throws error on API failure", async () => { /* ... */ });
it("retries on transient errors", async () => { /* ... */ });
```

### 4. **Check for Missing Test Cases**

Ask yourself for each function/component:

- ✅ **Happy path**: Does it work with valid inputs?
- ✅ **Error cases**: What happens when things go wrong?
- ✅ **Edge cases**: Empty strings, null values, boundary conditions?
- ✅ **Validation**: Are invalid inputs rejected?
- ✅ **Side effects**: Are external calls made correctly?
- ✅ **State changes**: Does UI update correctly?

**Example checklist for `generateResponse`:**

```typescript
// ✅ Happy path - valid review and profile
// ✅ API error - network failure
// ✅ API error - 401/403 (should not retry)
// ✅ API error - 500 (should retry)
// ✅ Timeout - request takes too long
// ✅ Invalid review data - missing fields
// ✅ Empty review text
// ✅ Very long review text (truncation)
// ✅ Missing voice profile (uses default)
// ✅ Token usage tracking
```

### 5. **Automated Mutation Testing (Advanced)**

For deeper analysis, consider mutation testing tools:

**Stryker** (JavaScript/TypeScript):
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
npx stryker init
npx stryker run
```

**Setup steps:**
1. Run `npx stryker init`
2. When prompted "Are you using one of these frameworks?", select **"None/other"** (Next.js isn't in the preset list)
3. When prompted for test runner, select **"vitest"**
4. Stryker will generate a `stryker.conf.json` configuration file
5. Review and adjust the config if needed (test files, source files, etc.)

Stryker automatically:
- Introduces mutations (bugs) into your code
- Runs your tests against each mutation
- Reports which mutations weren't caught (survived)
- Shows mutation score (higher = better tests)

**Interpretation:**
- Mutation score > 80%: Excellent test quality
- Mutation score 60-80%: Good, but some gaps
- Mutation score < 60%: Tests need improvement

## Practical Workflow

### Before committing:

1. **Run coverage**: `npm run test:coverage`
   - Check for uncovered code paths
   - Add tests for missing coverage

2. **Manual mutation**: Pick one critical function
   - Make a realistic bug
   - Run tests
   - If tests pass, strengthen them
   - Revert the bug

3. **Review assertions**: Read your test file
   - Are assertions specific and meaningful?
   - Are error cases covered?
   - Are edge cases tested?

### During code review:

- Check test coverage for new code
- Verify error handling is tested
- Ensure edge cases are covered
- Look for test smells (trivial assertions, missing cases)

## Example: Testing the Test

Here's how to verify your `generateResponse` test actually works:

```typescript
// 1. Run the test - should pass
npm test lib/claude/client.test.ts

// 2. Break the code intentionally
// In lib/claude/client.ts, change:
if (error.status === 401 || error.status === 403) {
  throw error;
}
// To:
if (error.status === 401 && error.status === 403) {  // Bug!
  throw error;
}

// 3. Run the test again
npm test lib/claude/client.test.ts

// 4. If test still passes → test is too weak
//    If test fails → test is catching bugs ✅

// 5. Revert the bug
```

## Red Flags

Your tests might be too weak if:

- ✅ Coverage is high but you can break code without tests failing
- ✅ Assertions are vague (`toBeDefined()`, `toBeTruthy()`)
- ✅ Only happy paths are tested
- ✅ Error cases return early without assertions
- ✅ Mocks always return success
- ✅ Tests pass when you comment out production code

## Good Test Indicators

Your tests are strong if:

- ✅ Breaking production code causes tests to fail
- ✅ Assertions verify specific, meaningful behavior
- ✅ Error cases are tested with realistic scenarios
- ✅ Edge cases and boundary conditions are covered
- ✅ Tests fail when you remove error handling
- ✅ Tests verify both success and failure paths

## Resources

- [Testing Library: Common mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mutation Testing Explained](https://stryker-mutator.io/docs/mutation-testing-introduction/)
- [Test Coverage vs Test Quality](https://martinfowler.com/bliki/TestCoverage.html)

