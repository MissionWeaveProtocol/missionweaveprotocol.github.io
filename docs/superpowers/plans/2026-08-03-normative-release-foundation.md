# Normative Release Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the structured release source, offline protocol artifacts,
generated release manifest, and release-blocking integrity checks.

**Architecture:** Store every non-self-referential release input in versioned
JSON, copy protocol artifacts from the exact pinned commit, and generate
`normative-release.json` only after the production build so it can include the
website commit without recursive hashing. Normal builds remain offline; a
separate release check verifies exact source repositories.

**Tech Stack:** Node.js 22 ESM, Astro content schema, JSON, Git, SHA-256, npm
scripts, GitHub Actions.

---

### Task 1: Establish the clean baseline

**Files:**

- Verify: `package.json`
- Verify: `package-lock.json`
- Verify: `.github/workflows/pages.yml`

- [ ] **Step 1: Install the locked website dependencies**

Run:

```bash
npm ci
```

Expected: Node 22 installs the lockfile without changing `package-lock.json`.

- [ ] **Step 2: Run the current full check**

Run:

```bash
npm run check
```

Expected: existing policy, locale, terminology, asset, format, type, build, and
built-site checks pass before foundation changes.

- [ ] **Step 3: Confirm the baseline remains clean**

Run:

```bash
git status --short
```

Expected: no output.

### Task 2: Define the normative content schema and release source

**Files:**

- Modify: `src/content.config.ts`
- Create: `src/data/normative/0.1/release-source.json`
- Create: `src/data/normative/0.1/artifacts.json`
- Create: `src/data/normative/0.1/terminology.json`
- Create: `scripts/check-normative-release-source.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing release-source check**

Create `scripts/check-normative-release-source.mjs` with assertions for:

```js
const expected = {
  protocolVersion: "0.1",
  protocolCommit: "f7e70a72c76bbeb5014c186cd820aac2112f0dde",
  schemaCount: 22,
  structural: { total: 58, valid: 27, invalid: 31 },
  cryptography: {
    artifacts: 98,
    cases: 22,
    evaluations: 62,
    complete: 12,
    rejected: 50,
    digest:
      "sha256:5eade516e4bc5dcf04477727ebcccd11f33348b2d9135fb6fe0365c6e6cc2ea3",
  },
  admission: {
    artifacts: 19,
    cases: 5,
    evaluations: 30,
    complete: 12,
    rejected: 18,
    profile: "missionweaveprotocol.first-admission-historical-trust.v0.1",
    digest:
      "sha256:39971bfafb68ef6c18f9026220cccc4f023fd4d5c8074f8ff0276cb1129cd0a0",
  },
};
```

The script must also assert exact SDK commits for `python`, `typescript`, `go`,
`rust`, `java`, and `cpp`, require the seven locale identifiers, and reject a
committed `websiteCommit` or generated `contentDigests` field.

- [ ] **Step 2: Run the new check and verify it fails**

Run:

```bash
node scripts/check-normative-release-source.mjs
```

Expected: FAIL because `release-source.json` does not exist.

- [ ] **Step 3: Add the exact release source**

Create `release-source.json` with this identity and no website commit:

```json
{
  "releaseId": "missionweaveprotocol-0.1",
  "status": "draft-standard",
  "protocolVersion": "0.1",
  "protocolCommit": "f7e70a72c76bbeb5014c186cd820aac2112f0dde",
  "locales": ["en", "zh-CN", "zh-TW", "ja", "es", "fr", "de"],
  "sdks": {
    "python": "9403cf1310914670506c56cbab363fdaa465d3cc",
    "typescript": "6d53ebfcf8350ae81d89fd818611b07f7373685c",
    "go": "80c39852e8a2053ac761b8d53d62483264f803f1",
    "rust": "2727f8777737265d98dde4ceaca306612ef54c52",
    "java": "3b2798c21d906c81887c54fe80e5bca8a19ddac7",
    "cpp": "481b0ce3a65c1f2265935318b54481ece5032fdf"
  },
  "schemas": { "count": 22 },
  "structural": { "total": 58, "valid": 27, "invalid": 31 },
  "cryptography": {
    "artifacts": 98,
    "cases": 22,
    "evaluations": 62,
    "complete": 12,
    "rejected": 50,
    "digest": "sha256:5eade516e4bc5dcf04477727ebcccd11f33348b2d9135fb6fe0365c6e6cc2ea3"
  },
  "admission": {
    "artifacts": 19,
    "cases": 5,
    "evaluations": 30,
    "complete": 12,
    "rejected": 18,
    "profile": "missionweaveprotocol.first-admission-historical-trust.v0.1",
    "digest": "sha256:39971bfafb68ef6c18f9026220cccc4f023fd4d5c8074f8ff0276cb1129cd0a0"
  }
}
```

- [ ] **Step 4: Extend the Astro content schema**

Extend `docsSchema()` with required fields:

```ts
normativeVersion: z.literal("0.1"),
normativeStatus: z.enum(["normative", "informative"]),
clausePrefix: z.string().regex(/^MWP-[A-Z]{3}$/u).optional(),
```

Legacy pages may temporarily omit these fields until the migration plan removes
them; implement the extension as optional during foundation work and make it
required for versioned `/0.1/` pages in the normative-content checker.

- [ ] **Step 5: Add npm entry points and rerun the check**

Add:

```json
"check:normative-release": "node scripts/check-normative-release-source.mjs"
```

Run:

```bash
npm run check:normative-release
```

Expected: PASS with protocol `f7e70a72...`, six SDK pins, and seven locales.

- [ ] **Step 6: Commit the release source**

```bash
git add src/content.config.ts src/data/normative/0.1 package.json scripts/check-normative-release-source.mjs
git commit -m "feat(docs): define normative release source"
```

### Task 3: Vendor and verify protocol artifacts

**Files:**

- Create: `scripts/sync-normative-artifacts.mjs`
- Create: `scripts/check-normative-artifacts.mjs`
- Create: `public/artifacts/0.1/protocol/`
- Create: `.gitattributes`
- Modify: `.prettierignore`
- Modify: `scripts/check-normative-release-source.mjs`
- Modify: `src/data/normative/0.1/release-source.json`
- Modify: `src/data/normative/0.1/artifacts.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing artifact check**

The checker must require these local roots:

```text
public/artifacts/0.1/protocol/CONTEXT.md
public/artifacts/0.1/protocol/spec/PROTOCOL.md
public/artifacts/0.1/protocol/schemas/
public/artifacts/0.1/protocol/conformance/
public/artifacts/0.1/protocol/cryptography/
public/artifacts/0.1/protocol/admission/
```

It must count 22 `schemas/*.schema.json`, 58 structural vectors, verify every
manifest-listed artifact path, byte length, and SHA-256, recompute the
cryptography and Admission JCS manifest digests, and compare their cases,
evaluations, and outcomes with `release-source.json`. The RFC 8785
canonicalization evaluation has an implicit successful outcome and no `expect`
member. The release data must also record the byte digest shared by all six
exact `PROTOCOL_PIN.json` files and the pinned structural bundle digest.

- [ ] **Step 2: Verify the artifact check fails before synchronization**

Run:

```bash
node scripts/check-normative-artifacts.mjs
```

Expected: FAIL with the missing local protocol artifact root.

- [ ] **Step 3: Implement exact-commit artifact synchronization**

`sync-normative-artifacts.mjs` must accept:

```text
--protocol-root /absolute/path/to/missionweaveprotocol
```

For each path returned by the equivalent of this exact local verification
command:

```bash
git -C /Users/lionelmbp/repos/missionweaveprotocol ls-tree -r --name-only f7e70a72c76bbeb5014c186cd820aac2112f0dde -- CONTEXT.md spec/PROTOCOL.md schemas conformance cryptography admission
```

the script must read exact bytes with
`git -C protocolRoot show ${protocolCommit}:${sourcePath}` and write them
beneath `public/artifacts/0.1/protocol/`. Reject a dirty destination diff after
a second run to prove deterministic output.

- [ ] **Step 4: Synchronize from the exact local source**

Run:

```bash
node scripts/sync-normative-artifacts.mjs --protocol-root /Users/lionelmbp/repos/missionweaveprotocol
artifact_snapshot=$(mktemp -d)
cp -R public/artifacts/0.1/protocol "$artifact_snapshot/protocol"
node scripts/sync-normative-artifacts.mjs --protocol-root /Users/lionelmbp/repos/missionweaveprotocol
diff -ru "$artifact_snapshot/protocol" public/artifacts/0.1/protocol
```

Expected: the second synchronization produces no diff.

- [ ] **Step 5: Verify the committed artifacts**

Run:

```bash
node scripts/check-normative-artifacts.mjs
```

Expected: PASS with 22 schemas, 58 structural vectors, cryptography digest
`5eade516...`, and Admission digest `39971bfa...`.

- [ ] **Step 6: Commit the artifact bundle**

```bash
git add public/artifacts/0.1/protocol src/data/normative/0.1/artifacts.json scripts/sync-normative-artifacts.mjs scripts/check-normative-artifacts.mjs package.json
git commit -m "feat(docs): vendor normative protocol artifacts"
```

### Task 4: Generate the deployed release manifest without self-reference

**Files:**

- Create: `scripts/generate-normative-release.mjs`
- Create: `scripts/check-generated-release.mjs`
- Modify: `package.json`
- Modify: `scripts/check-built-site.mjs`

- [ ] **Step 1: Write a failing generated-manifest test**

Require `dist/artifacts/0.1/normative-release.json` to satisfy these concrete
assertions:

```js
assert.equal(manifest.releaseId, "missionweaveprotocol-0.1");
assert.match(manifest.websiteCommit, /^[0-9a-f]{40}$/u);
assert.equal(typeof manifest.buildIdentity, "string");
assert.ok(manifest.buildIdentity.length > 0);
for (const locale of ["en", "zh-CN", "zh-TW", "ja", "es", "fr", "de"]) {
  assert.match(manifest.contentDigests[locale], /^sha256:[0-9a-f]{64}$/u);
}
```

The release source identifies the digest algorithm as
`missionweaveprotocol.built-html-tree-sha256.v1`. For each locale, hash the
sorted built HTML output paths and exact bytes using `path`, NUL, `bytes`, NUL.
English owns unprefixed HTML output; the other locales own their configured
route prefixes. Non-content assets and `normative-release.json` itself are
excluded.

- [ ] **Step 2: Run the test before generation**

```bash
npm run docs:build
node scripts/check-generated-release.mjs
```

Expected: FAIL because the generated manifest is absent.

- [ ] **Step 3: Implement post-build generation**

The generator must read `release-source.json`, obtain the exact website commit
from `git rev-parse HEAD`, use `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT` when
available for `buildIdentity`, hash sorted output files per locale, and write
the deployed manifest under `dist/artifacts/0.1/`.

The generated-release checker validates the recorded identity independently of
the checker's current `GITHUB_RUN_*` environment. An exact expected identity may
be supplied explicitly with `NORMATIVE_EXPECTED_BUILD_IDENTITY`.

- [ ] **Step 4: Integrate generation with the production build**

Change scripts to:

```json
"docs:build": "astro build && node scripts/generate-normative-release.mjs",
"check:generated-release": "node scripts/check-generated-release.mjs"
```

Add `check:generated-release` before `check:built-site` in `npm run check`.

- [ ] **Step 5: Build twice and prove determinism for the same identity**

Run with a fixed identity:

```bash
GITHUB_RUN_ID=local GITHUB_RUN_ATTEMPT=1 npm run docs:build
cp dist/artifacts/0.1/normative-release.json /tmp/missionweaveprotocol-release.json
GITHUB_RUN_ID=local GITHUB_RUN_ATTEMPT=1 npm run docs:build
cmp /tmp/missionweaveprotocol-release.json dist/artifacts/0.1/normative-release.json
npm run check:generated-release
```

Expected: `cmp` and the generated release check pass.

- [ ] **Step 6: Commit manifest generation**

```bash
git add package.json scripts/generate-normative-release.mjs scripts/check-generated-release.mjs scripts/check-built-site.mjs
git commit -m "feat(docs): generate normative release manifest"
```

### Task 5: Add exact-source release verification

**Files:**

- Create: `scripts/checkout-normative-sources.mjs`
- Create: `scripts/check-normative-sources.mjs`
- Create: `scripts/test-checkout-normative-sources.mjs`
- Modify: `.github/workflows/pages.yml`
- Modify: `package.json`
- Modify: `scripts/check-normative-release-source.mjs`
- Modify: `src/data/normative/0.1/release-source.json`

- [x] **Step 1: Implement source checkout from release data**

The checkout script must clone or fetch these repositories into an explicit
temporary root and detach each at its pinned commit:

```text
missionweaveprotocol
python-sdk
typescript-sdk
go-sdk
rust-sdk
java-sdk
cpp-sdk
```

It must reject a repository whose detached HEAD differs from the release source.
Repository URLs are explicit release-source data. The checkout command may use
an explicit local mirror root for offline verification, but the Pages gate uses
the published repository URLs. Before any Git mutation, it must reject a
repository destination that is a symbolic link or resolves outside the explicit
sources root; the regression test must prove that an external checkout remains
unchanged. Checkout must also refuse to overwrite ignored local files.

- [x] **Step 2: Implement source verification**

`check-normative-sources.mjs` must compare the protocol artifacts byte-for-byte
with `public/artifacts/0.1/protocol/`, verify every SDK's exact
`PROTOCOL_PIN.json` byte digest against `release-source.json`, and compare the
complete parsed pin fields with the release and artifact metadata.

The release-sources gate must also run the destination-symlink regression
against its checked-out repositories as local mirrors.

- [x] **Step 3: Run against local repositories**

```bash
MW_SOURCES_ROOT=/Users/lionelmbp/repos npm run check:release-sources
```

Expected: all seven exact pins and all vendored protocol artifacts pass.

- [x] **Step 4: Gate deployment on exact-source verification**

In `.github/workflows/pages.yml`, add a `release-sources` job for pushes to
`main` and manual dispatch. The deploy job must require both `build` and
`release-sources`. Pull requests continue to run the offline committed-artifact
checks.

- [x] **Step 5: Run the full foundation suite**

```bash
npm run check
MW_SOURCES_ROOT=/Users/lionelmbp/repos npm run check:release-sources
```

Expected: both commands pass.

- [x] **Step 6: Commit the source-verification gate**

```bash
git add .github/workflows/pages.yml docs/superpowers/plans/2026-08-03-normative-release-foundation.md package.json scripts/check-normative-release-source.mjs scripts/check-normative-sources.mjs scripts/checkout-normative-sources.mjs scripts/test-checkout-normative-sources.mjs src/data/normative/0.1/release-source.json
git commit -m "ci(docs): verify exact normative release sources"
```
