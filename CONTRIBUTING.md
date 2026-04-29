# Contributing to Azure Connectors TypeScript SDK

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18 (see `engines` in `package.json`)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/downloads)

### Building

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test
```

## How to Contribute

1. Fork the repository
2. Create a topic branch from `main` (`git checkout -b feature/my-change`)
3. Make your changes
4. Run tests to ensure nothing is broken (`npm test`)
5. Commit your changes (`git commit -m "Add my change"`)
6. Push to your fork (`git push origin feature/my-change`)
7. Open a pull request against `main`

### Pull Request Guidelines

- Keep PRs focused on a single change
- Include tests for new functionality
- Update documentation if behavior changes
- Follow the existing code style (see [copilot-instructions.md](.github/copilot-instructions.md) for conventions)

### Reporting Issues

- Use [GitHub Issues](https://github.com/Azure/Connectors-NodeJS-SDK/issues) to report bugs or request features
- Search existing issues before creating a new one
- Use the provided issue templates when available

## Code Style

This project follows the coding conventions documented in [.github/copilot-instructions.md](.github/copilot-instructions.md). Key points:

- Use `async`/`await` for all asynchronous operations — never `.then()` chains
- Use `const` by default, `let` when reassignment is needed — never `var`
- Use strict equality (`===`) — never loose equality (`==`)
- Use descriptive names for all identifiers, including lambda parameters
- Use explicit access modifiers on all class members

### Automated Enforcement

Coding standards are enforced automatically in CI — PRs that violate them will not pass:

- **`npm run typecheck`** (lint job) — TypeScript strict mode type checking across source and samples
- **`npm test`** (test job) — all unit tests must pass on Node.js 20 and 22 across Ubuntu and Windows
- **Markdown linting** (lint job) — `markdownlint-cli2` checks all `.md` files

Run `npm run typecheck` locally before pushing to catch type errors early.

## Generated Code

Files under `src/generated/` are produced by an internal Microsoft code generator that is not publicly accessible at this time. **Do not submit pull requests that directly modify generated files** — changes will be overwritten the next time the code is regenerated.

If you find a bug or want to suggest an improvement in the generated code:

1. Open a [GitHub Issue](https://github.com/Azure/Connectors-NodeJS-SDK/issues) describing the problem in detail
2. Include the affected file(s) and the current (incorrect) generated output
3. You are welcome to include a code suggestion showing the desired output — this helps the team understand the fix
4. A Microsoft contributor will work your suggestion back into the internal code generator so the fix applies to all generated connectors

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
