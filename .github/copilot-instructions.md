# Copilot Instructions for azure-logicapps-connector-sdk (TypeScript)

## Overview

This repository contains the lightweight TypeScript SDK for Azure Logic Apps connectors. Code must follow the team's coding conventions.

## Quick Reference: Coding Style Rules

### File Structure

```typescript
// Copyright (c) Microsoft Corporation.  All rights reserved.

import { ConnectorClientBase } from "../azureConnectors/clientBase";
import { ConnectorException } from "../azureConnectors/connectorException";

export class YourClass {
}
```

**Rules:**

- Copyright header on first line (single-line comment)
- Imports sorted: external packages first, then relative imports alphabetically
- No empty lines between import groups

### Naming Conventions

| Element | Rule | Example |
|---------|------|---------|
| Classes | PascalCase | `Office365Client` |
| Interfaces | PascalCase | `TokenProvider` |
| Methods/functions | camelCase | `getEmailsAsync()` |
| Constants | UPPER_SNAKE_CASE or PascalCase | `DEFAULT_TIMEOUT` |
| Private fields | camelCase with no prefix | `private readonly connectionUrl: string;` |
| Local variables | camelCase, complete English terms | `parameter` not `p`, `method` not `m` |
| Lambda parameters | Use descriptive names | `items.filter(item => ...)` not `x => ...` |

**Variable naming rules:**

- Use complete, unabbreviated English terms for all identifiers
- No single-letter variable names, even in lambdas (use `item`, `method`, `parameter`)
- No placeholder names (`blah`, `foo`, `temp`, `x`) — always use meaningful names

### File Organization

**One class per file:**

- Declare only one exported class per file
- File name should match the primary export
- Exception: Related types/interfaces can co-exist if tightly coupled (e.g., a client + its options)

### Async/Await Format

**Use standard async/await:**

```typescript
const result = await this.httpClient.sendAsync<Response>("GET", url);
```

**Rules:**

- Always use `async`/`await`, never `.then()` chains
- Always handle errors with try/catch
- Prefer returning the awaited value

**DO NOT:**

```typescript
// Wrong: Promise chains instead of async/await
this.httpClient.sendAsync("GET", url).then(result => { ... });

// Wrong: Unhandled promise
this.httpClient.sendAsync("GET", url);
```

### Method Calls with Multiple Parameters

**Single line** if all parameters fit:

```typescript
this.doSomething(param1, param2);
```

**Multi-line when needed:**

```typescript
const result = await this.httpClient.sendAsync<Response>(
    "POST",
    url,
    headers,
    body,
);
```

**Rules:**

- Trailing comma on the last parameter in multi-line calls
- Each parameter on its own line when breaking

### Comments

**Inline comments — use NOTE format:**

```typescript
// NOTE(username): Explanation of why this code exists.
const result = doSomething();
```

**Rules:**

- Empty line ABOVE comment (unless first line in block)
- NO empty line between comment and code it describes
- Prefix: `// NOTE(username):` where username is your GitHub username
- Do NOT comment on the 'what' unless the code is obscure; instead comment on the 'why' when appropriate

**JSDoc documentation — required for all public APIs:**

```typescript
/**
 * Processes the incoming request and returns the result.
 * @param request The request to process.
 */
public async processAsync(request: Request): Promise<Response> {
```

**Rules:**

- End descriptions with period
- Use `@param` for parameters
- Use `@remarks` for additional context

### Error Handling

```typescript
try {
    const response = await this.httpClient.sendAsync<T>("GET", url);
} catch (error) {
    if (error instanceof ConnectorException) {
        console.error(`Connector error: '${error.message}'.`);
        throw;
    }

    throw new Error(`Operation '${operationId}' failed.`);
}
```

**Rules:**

- Wrap inserted values in single quotes in error messages
- End error messages with period
- **All errors must have descriptive messages** — never throw without context
- Use `ConnectorException` for connector-specific errors

**DO:**

```typescript
throw new Error(`Parameter '${paramName}' cannot be null or empty.`);
throw new ConnectorException(`GET ${path}`, statusCode, responseText);
```

**DO NOT:**

```typescript
throw new Error();          // No message
throw new Error("error");   // Non-descriptive
```

### String Comparison

**Use case-insensitive comparison when appropriate:**

```typescript
// Correct
str1.toLowerCase() === str2.toLowerCase()

// For exact match
str1 === str2
```

**DO NOT:**

```typescript
str1 == str2   // Loose equality
```

### Spacing and Braces

**Empty line after closing brace:**

```typescript
if (condition) {
    doSomething();
}

doSomethingElse();  // Empty line above
```

**NO empty line before closing brace:**

```typescript
// Wrong
if (condition) {
    doSomething();

}
```

### Variable Declaration

**Use `const` by default, `let` when reassignment is needed:**

```typescript
const items = new Array<string>();
const response = await this.getResponseAsync();
let counter = 0;
```

**DO NOT use `var`.**

### Ternary Operators

**Put `?` and `:` at START of new line:**

```typescript
const result = condition
    ? valueIfTrue
    : valueIfFalse;
```

### Logical Operators

**Put `||` and `&&` at END of line:**

```typescript
if (value1 === undefined ||
    value2 === undefined ||
    value3 === undefined) {
```

### Access Modifiers

**ALWAYS explicit on class members:**

```typescript
public static readonly defaultValue = "default";
private readonly connectionUrl: string;
```

### Class Layout Order

1. Static fields
2. Instance fields
3. Constructor
4. Properties (getters)
5. Public methods
6. Private methods

## Patterns to Avoid

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| `.then()` chains | `await` with async/await |
| `var` declarations | `const` or `let` |
| `any` type | Specific types or `unknown` |
| Magic numbers | Named constants |
| Magic strings (e.g., `"type"`, `"object"`) | Named constants |
| Loose equality (`==`) | Strict equality (`===`) |
| `Array[0]` without check | Validate array length first |

## Testing

```typescript
test("methodName should return expected result when given valid input", async () => {
    // Arrange
    const input = createTestInput();

    // Act
    const result = await service.processAsync(input);

    // Assert
    expect(result).toBeDefined();
});
```

**Rules:**

- Test naming: descriptive sentence in `test()` or `it()` blocks
- Use `describe()` to group related tests
- Use async/await in tests, never `.then()`
- Jest framework with ts-jest preset
- Run with `npm test` or `npx jest --config config/jest.config.js --verbose`

## Git Workflow

- Branch naming: `feature/description`, `fix/description`, `docs/description`
- Never push directly to main
- Always create PR for review

## Releasing a New Version

The release workflow (`.github/workflows/release.yml`) builds, tests, packs, and publishes the npm package. There is no version file to update — the version comes from the git tag.

### Standard Release (tag push)

Creates a GitHub Release with auto-generated notes, publishes to GitHub Packages, and attempts npm registry:

```shell
git checkout main
git pull origin main
git tag v1.2.3
git push origin v1.2.3
```

### Pre-release

Use SemVer pre-release suffixes:

```shell
git tag v1.2.3-preview.1
git push origin v1.2.3-preview.1
```

### Manual Dispatch (packages only, no GitHub Release)

Use when you need to publish without creating a tag or GitHub Release:

1. Go to Actions → Release → Run workflow
2. Enter the version (e.g., `1.2.3`)

### Re-releasing a Version

Do not delete or recreate a published release tag as a normal retry path. Release
tags are part of the supply-chain integrity boundary and are protected by tag
rulesets. If a release fails after the tag was pushed, use a new version (for
example the next patch version, or a new pre-release such as
`v1.2.4-preview.1`) and release from the current reviewed `main` commit.

If a failed release left only a draft GitHub Release and no package was
published, clean up the draft release if needed, then create a new version tag.
Deleting or retagging an existing remote tag should be treated as break-glass
admin work, not the standard process.

Standard retry shape:

```shell
git checkout main
git pull origin main
git tag v1.2.4                     # or v1.2.4-preview.1 for a pre-release retry
git push origin v1.2.4             # push to trigger release
```

### What the Release Workflow Does

1. Builds and tests the package
2. Sets the package version from the tag (strips the `v` prefix)
3. Uploads `.tgz` as a build artifact
4. Pushes to GitHub Packages (`npm.pkg.github.com/Azure`)
5. Attempts push to npm registry (requires `NPM_TOKEN` secret, continues on error)
6. Creates a GitHub Release with the `.tgz` attached (tag push only)

## Adding a New Connector

When adding a new generated connector client to the SDK:

### Steps

1. **Generate the code** using the CodefulSdkGenerator CLI from the BPM repo:

   ```shell
   LogicAppsCompiler <outputDir> unused --typescriptDirectClient --connectors=<connector-name>
   ```

2. **Verify generated files** — `{Connector}Extensions.ts` lands in `src/generated/`
3. **Check `connectorNames.ts`** — the new connector constant should be generated in alphabetical order
4. **Check `ManagedConnectors.ts`** — the connector name should appear in `AvailableConnectors`
5. **Add unit tests** — create `{connector}Client.test.ts` in `tests/` following the pattern of existing tests (constructor, mocked API call, error handling)
6. **Update `ROADMAP.md`** — mark the connector as complete in the appropriate phase
7. **Update the connection setup skill** — add the connector's API name to the supported list in `.github/skills/connection-setup/SKILL.md` (Step 2)
8. **Run all tests** — `npm test` must pass with zero failures before committing
9. **Create a PR** — reference the GitHub issue (e.g., `Closes #9`)

### Validation checklist

- [ ] Generated file compiles without errors (`npm run typecheck`)
- [ ] Existing connector tests still pass (no regressions)
- [ ] `connectorNames` test passes (ConnectorNames ↔ ManagedConnectors sync)
- [ ] New connector tests cover: constructor, mocked success, mocked error, exception properties
