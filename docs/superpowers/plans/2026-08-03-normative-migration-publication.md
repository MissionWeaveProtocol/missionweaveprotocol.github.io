# Normative Route Migration and Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy information architecture with versioned normative
routes, Latest aliases, exact redirects, atomic Pages deployment, and live
verification.

**Architecture:** Generate Starlight navigation and Astro redirects from one
route manifest, keep versioned content canonical, redirect Latest and legacy
paths one-to-one, remove superseded sources only after built output
verification, and gate deployment on offline plus exact-source checks. A
local/live HTTP verifier reads back required pages and artifacts.

**Tech Stack:** Astro redirects and sitemap, Starlight sidebar, Node.js
HTTP/fetch verification, GitHub Actions/Pages.

---

### Task 1: Define the route and navigation manifest

**Files:**

- Create: `src/data/normative/0.1/routes.json`
- Create: `src/data/normative/0.1/navigation.json`
- Create: `scripts/lib/normative-routes.mjs`
- Create: `scripts/check-normative-routes.mjs`
- Modify: `astro.config.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing route check**

For every versioned English route require:

```json
{
  "id": "learn-first-admission",
  "versioned": "/0.1/learn/first-admission-and-historical-trust/",
  "latest": "/learn/first-admission-and-historical-trust/",
  "legacy": ["/docs/0.1/trust-and-authority/"]
}
```

Require the same locale-prefixed route relationship for all six localized
directories. Reject duplicate destinations, loops, and generic home-page
fallbacks.

- [ ] **Step 2: Run the check before route data exists**

```bash
node scripts/check-normative-routes.mjs
```

Expected: FAIL with missing route manifest.

- [ ] **Step 3: Generate navigation from the approved tree**

Navigation groups are exactly `Learn`, `Build`, `Reference`, and `Community`.
Use localized labels from `navigation.json`, badge the versioned root as
`Draft Standard 0.1`, and include all six SDKs plus the three conformance
surfaces.

- [ ] **Step 4: Generate Latest and compatibility redirects**

Import the route helper into `astro.config.mjs` and assign its redirect object
to Astro's top-level `redirects` option. The versioned route is the redirect
destination and canonical content source.

- [ ] **Step 5: Verify route data and commit**

```bash
npm run check:normative-routes
npm run typecheck
git add src/data/normative/0.1/routes.json src/data/normative/0.1/navigation.json scripts/lib/normative-routes.mjs scripts/check-normative-routes.mjs astro.config.mjs package.json
git commit -m "feat(docs): add versioned normative routes"
```

### Task 2: Remove legacy content only after redirect coverage exists

**Files:**

- Delete: `src/content/docs/docs/0.1/`
- Delete: `src/content/docs/sdk/`
- Delete: `src/content/docs/reference/`
- Delete: `src/content/docs/zh-cn/docs/0.1/`, `src/content/docs/zh-cn/sdk/`, and
  `src/content/docs/zh-cn/reference/`
- Delete: `src/content/docs/zh-tw/docs/0.1/`, `src/content/docs/zh-tw/sdk/`, and
  `src/content/docs/zh-tw/reference/`
- Delete: `src/content/docs/ja/docs/0.1/`, `src/content/docs/ja/sdk/`, and
  `src/content/docs/ja/reference/`
- Delete: `src/content/docs/es/docs/0.1/`, `src/content/docs/es/sdk/`, and
  `src/content/docs/es/reference/`
- Delete: `src/content/docs/fr/docs/0.1/`, `src/content/docs/fr/sdk/`, and
  `src/content/docs/fr/reference/`
- Delete: `src/content/docs/de/docs/0.1/`, `src/content/docs/de/sdk/`, and
  `src/content/docs/de/reference/`
- Modify: `src/content/docs/index.mdx`
- Modify: `src/content/docs/zh-cn/index.mdx`
- Modify: `src/content/docs/zh-tw/index.mdx`
- Modify: `src/content/docs/ja/index.mdx`
- Modify: `src/content/docs/es/index.mdx`
- Modify: `src/content/docs/fr/index.mdx`
- Modify: `src/content/docs/de/index.mdx`
- Modify: `src/components/HomeStory.astro`

- [ ] **Step 1: Build with both old and new sources**

```bash
npm run docs:build
npm run check:normative-routes
```

Expected: every legacy source path has an exact redirect mapping.

- [ ] **Step 2: Update home pages and HomeStory**

Make versioned normative Learn, Build, and Reference pages the primary calls to
action. Remove descriptions that characterize website documentation as
non-normative or only a learning summary.

- [ ] **Step 3: Delete superseded content sources**

Delete only files covered by the route manifest. Keep community pages unless a
replacement is explicitly present.

- [ ] **Step 4: Build and verify legacy output redirects**

```bash
npm run docs:build
npm run check:built-site
npm run check:normative-routes
```

Expected: old paths build redirect outputs and every destination exists.

- [ ] **Step 5: Commit the migration**

```bash
git add -A src/content/docs src/components/HomeStory.astro
git commit -m "refactor(docs): migrate legacy routes to normative structure"
```

### Task 3: Update machine-readable discovery and built-site checks

**Files:**

- Modify: `public/llms.txt`
- Modify: `public/robots.txt`
- Modify: `scripts/check-built-site.mjs`
- Create: `scripts/check-discovery-files.mjs`
- Modify: `package.json`

- [ ] **Step 1: Replace stale discovery content**

`llms.txt` must list the local normative specification, Learn/Build/Reference
roots, all six SDK references, three conformance pages, release manifest,
artifacts, and errata. It must not direct model consumers to repository README
or docs pages for missing content.

- [ ] **Step 2: Expand required build outputs**

Require representative outputs for every locale and section, all six SDKs, three
conformance surfaces, `normative-release.json`, local manifests, sitemap,
robots, and `llms.txt`.

- [ ] **Step 3: Validate canonical and alternate-language metadata**

For each versioned page, check one canonical URL and seven alternate-language
links. Latest and legacy redirect pages must point to the corresponding
versioned route.

- [ ] **Step 4: Run and commit discovery checks**

```bash
npm run check:discovery
npm run check
git add public/llms.txt public/robots.txt scripts/check-built-site.mjs scripts/check-discovery-files.mjs package.json
git commit -m "test(docs): verify normative discovery output"
```

### Task 4: Add local preview and live HTTP verification

**Files:**

- Create: `scripts/verify-published-site.mjs`
- Modify: `package.json`

- [ ] **Step 1: Implement an origin-parameterized verifier**

The script reads `SITE_URL` and checks HTTP status, final URL, content marker,
and content type for:

```text
/0.1/learn/
/0.1/reference/specification/
/0.1/reference/conformance/{structural,cryptography,admission}/
/0.1/build/sdk/{python,typescript,go,rust,java,cpp}/
/artifacts/0.1/normative-release.json
/artifacts/0.1/protocol/schemas/first-admission-record.schema.json
```

Repeat representative normative and SDK routes for all six locale prefixes.
Check Latest aliases and one legacy route from each legacy route class.

- [ ] **Step 2: Add preview and live commands**

```json
"verify:preview": "node scripts/verify-published-site.mjs --spawn-preview",
"verify:live": "node scripts/verify-published-site.mjs"
```

Preview mode starts `astro preview` on an available localhost port, waits for
readiness, runs the same checks, and terminates the child process.

- [ ] **Step 3: Verify the local production build**

```bash
npm run docs:build
npm run verify:preview
```

Expected: all required local routes, redirects, pages, and artifacts pass.

- [ ] **Step 4: Commit the HTTP verifier**

```bash
git add scripts/verify-published-site.mjs package.json
git commit -m "test(docs): add published-site verification"
```

### Task 5: Final release-candidate verification

**Files:**

- Verify only; fix failures in their owning files.

- [ ] **Step 1: Confirm exact objective and worktree state**

```bash
git status --short --branch
git rev-parse HEAD
git diff main...HEAD --stat
```

Expected: intended branch, clean worktree, and only normative documentation
program changes.

- [ ] **Step 2: Run all offline checks**

```bash
npm run check
npm run verify:preview
```

Expected: PASS.

- [ ] **Step 3: Verify exact protocol and SDK sources**

```bash
MW_SOURCES_ROOT=/Users/lionelmbp/repos npm run check:release-sources
MW_SOURCES_ROOT=/Users/lionelmbp/repos npm run verify:sdk-examples
```

Expected: all exact pins, artifacts, inventories, and locally available SDK
toolchains pass. Any unavailable local toolchain remains explicitly pending
until its required GitHub Actions job succeeds.

- [ ] **Step 4: Review prohibited external documentation links**

```bash
npm run check:local-docs
```

Expected: zero GitHub README/docs/specification dependencies.

- [ ] **Step 5: Commit final verification corrections**

```bash
git add -A
git commit -m "docs: finalize normative website release"
```

Skip the commit if verification required no changes.

### Task 6: External publication gate

**Files:**

- External state only after explicit current confirmation.

- [ ] **Step 1: Report the release candidate**

Report branch, exact HEAD, commit list, full check result, exact-source result,
SDK example result, any local-toolchain boundary, and the intended push/PR/merge
and deployment path. Obtain current user confirmation before proceeding.

- [ ] **Step 2: Push the reviewed branch**

Use the verified GitHub transport and confirm the remote branch SHA equals the
local HEAD.

- [ ] **Step 3: Create and review the pull request**

The PR description must summarize the normative authority change, route
migration, SDK truth boundary, locale parity, artifact pins, redirects, and
verification. Wait for all required checks and resolve actionable review
feedback without self-approving external blockers.

- [ ] **Step 4: Merge only after current approval and green checks**

Confirm the PR head, merge target `main`, required checks, review state, and
deployment workflow before merge.

- [ ] **Step 5: Verify deployment commit and workflow**

Confirm `origin/main` contains the intended merge commit and the
`Publish website` workflow deployed that exact commit successfully.

### Task 7: Verify the public GitHub Pages site

**Files:**

- Read-only public verification.

- [ ] **Step 1: Run live verification**

```bash
SITE_URL=https://missionweaveprotocol.github.io npm run verify:live
```

Expected: PASS for all required pages, locales, aliases, redirects, release
manifest, and artifacts.

- [ ] **Step 2: Read back the normative release identity**

Confirm the live `websiteCommit`, protocol commit, six SDK commits, counts,
digests, and seven locale digests correspond to the deployed release.

- [ ] **Step 3: Check representative semantic clauses live**

Verify the First-Admission page states six stages before log access,
authoritative absence, atomic append-or-return-existing, returned-record
validation, historical replay without trusted context or append, same key
interval, stage `admission`, and `AUTH_INVALID_SIGNATURE` in all seven locales.

- [ ] **Step 4: Report exact completion evidence**

Report the merge/deploy commit, workflow result, live verification command and
result, and any non-blocking errata. Do not claim completion from CI alone.
