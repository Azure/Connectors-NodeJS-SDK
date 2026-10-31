# Building and publishing SDK documentation

The Node.js SDK uses [TypeDoc](https://typedoc.org/) to generate a searchable
HTML API reference from the TypeScript source and JSDoc. Like the Python SDK,
it builds documentation on pull requests and deploys only from `main` using
GitHub Actions and GitHub Pages.

## Build locally

From the repository root, using Node.js 20 or later:

```bash
npm ci
npm run docs:build
```

Open `site/index.html` to review the generated documentation. The build fails
on TypeScript errors, TypeDoc validation warnings, or missing public API coverage.
Existing generated JSDoc can produce comment-parser warnings (for example,
repeated `@remarks` tags or unescaped Teams mentions). These remain visible in
the build log; correcting them belongs in the upstream SDK generator, not in
hand-edited generated files.
The generated `site/` and `artifacts/api-docs.json` files are ignored by Git
and are not part of the npm package.

The reference includes the package-root exports, every generated connector
module, and both connector catalogs. New `*Extensions.ts` files are discovered
automatically. Private, protected, and `@internal` members are excluded.
No generated SDK source is edited to produce the documentation.

## One-time repository setup

A repository administrator must configure GitHub Pages before the first
deployment:

1. Review and merge the documentation PR.
2. Open **Settings > Pages > Build and deployment** in
   `Azure/Connectors-NodeJS-SDK`.
3. Select **GitHub Actions** as the source. Do not select a `gh-pages` branch.
4. Check **Settings > Environments > github-pages**. Allow deployments only
   from `main`; add approval requirements if the team needs them.
5. Confirm organization Actions policy permits the pinned checkout, setup-node,
   configure-pages, upload-pages-artifact, and deploy-pages actions.
6. Open **Actions > Documentation** and run the workflow on `main`, or push
   a new commit to `main`. If the merge-triggered deployment ran before Pages
   was configured, rerun it after completing setup.
7. Verify the successful deployment and use the URL shown in the
   `github-pages` environment. The expected project URL is
   <https://azure.github.io/Connectors-NodeJS-SDK/>.

Repository settings are not enabled by merging YAML alone. If the Pages
settings are unavailable, ask an organization or repository administrator to
enable Pages for this repository. No Azure resources, custom domain, npm
publication, or personal access token is required.

## Ongoing workflow

- Pull requests build and validate docs with read-only repository permissions;
  they never publish to Pages or receive deployment credentials.
- Pushes to `main` build, validate, and upload the site, then deploy it using
  `pages: write` and OpenID Connect (`id-token: write`) in the deployment job.
- Manual runs on `main` can redeploy the site. Runs on other branches only build.
- Review landing-page changes in `docs/index.md` and API changes in the source.
  Do not check the generated HTML into Git or maintain a separate docs branch.
- The site tracks `main`, not versioned npm releases. Link to release notes and
  package versions when explaining differences from an installed SDK.
