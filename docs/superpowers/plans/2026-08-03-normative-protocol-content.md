# Normative Protocol and Shared Runtime Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the complete English normative protocol, reader learning path,
and shared runtime guidance entirely within the versioned website.

**Architecture:** Import every normative requirement from the pinned protocol
into focused Reference pages, assign stable clause IDs, and build Learn/Build
pages that cite those local clauses instead of duplicating divergent rules. MDX
components expose clause identity and release facts; checks reject missing BCP
14 requirements and external README/docs dependencies.

**Tech Stack:** Astro/Starlight MDX, Astro components, Node.js ESM validation
scripts, BCP 14 keywords.

---

### Task 1: Add stable normative-clause primitives

**Files:**

- Create: `src/components/NormativeClause.astro`
- Create: `src/components/InformativeBlock.astro`
- Create: `src/components/NormativeReleaseFacts.astro`
- Create: `src/data/normative/0.1/clauses.json`
- Create: `scripts/check-normative-clauses.mjs`
- Create: `scripts/test-normative-clauses.mjs`
- Modify: `package.json`

- [x] **Step 1: Write the failing clause checker**

The checker must scan versioned English `.mdx` files and require:

```mdx
<NormativeClause id="MWP-SDV-001" level="MUST">
  ...
</NormativeClause>
```

When a source paragraph contains multiple distinct levels, keep their
first-occurrence order in the same `level` prop:

```mdx
<NormativeClause id="MWP-SDV-002" level={["MUST", "SHOULD", "MUST NOT"]}>
  ...
</NormativeClause>
```

It must reject duplicate IDs, malformed IDs, a BCP 14 keyword outside a
`NormativeClause`, an ID not listed in `clauses.json`, or a scalar/array level
set that differs from the complete first-occurrence level sequence in the clause
body. The canonical `src/content/docs/0.1/` root may remain absent or empty
during Task 1; Task 2 source-coverage checks make missing specification content
fail.

- [x] **Step 2: Verify the checker fails before components and data exist**

```bash
node scripts/check-normative-clauses.mjs
```

Expected: FAIL with missing clause manifest/component errors.

- [x] **Step 3: Implement the clause component**

`NormativeClause.astro` must render a section with a stable lowercase HTML id,
visible clause badge, every normative level, and slot content.
`InformativeBlock.astro` must render an explicitly labelled non-requirement
block. Neither component may alter or translate the BCP 14 keyword.

- [x] **Step 4: Define deterministic ID namespaces**

Use these page prefixes:

```text
MWP-FND  foundations
MWP-IDN  identity, Registry, sessions
MWP-SDV  Signed Document verification
MWP-ADM  First Admission and Historical Trust
MWP-MSN  Missions, Groups, Membership, Conversations, child Missions
MWP-WRK  WorkItems, scheduling, execution, recovery, Artifacts, replay
MWP-AUT  authorization, budgets, side effects
MWP-EVT  Commands, Events, WebSocket binding
MWP-EXT  extensions, errors, controls, compatibility, conformance
```

Within each prefix, assign three-digit ordinals in source order. Once committed,
an ID remains attached to its requirement even when wording moves.
`clauses.json` records each source paragraph's exact line range and SHA-256. Its
clause list starts empty until Task 2 imports the pinned source paragraphs.

- [x] **Step 5: Add release facts component**

Render protocol/SDK pins and all current counts from `release-source.json`. No
count or digest may be hard-coded in content pages.

- [x] **Step 6: Run and commit the primitives**

```bash
npm run check:normative-clauses
npm run test:normative-clauses
git add docs/superpowers/plans/2026-08-03-normative-protocol-content.md package.json scripts/check-normative-clauses.mjs scripts/test-normative-clauses.mjs src/components src/data/normative/0.1/clauses.json
git commit -m "feat(docs): add normative clause primitives"
```

### Task 2: Import the complete English specification

**Files:**

- Create: `src/content/docs/0.1/reference/specification/index.mdx`
- Create: `src/content/docs/0.1/reference/specification/foundations.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/identity-registry-and-sessions.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/signed-documents-and-trust.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/first-admission-and-historical-trust.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/missions-groups-and-membership.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/work-scheduling-and-recovery.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/authorization-and-budgets.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/commands-events-and-ordering.mdx`
- Create:
  `src/content/docs/0.1/reference/specification/errors-extensions-and-security.mdx`
- Modify: `src/data/normative/0.1/clauses.json`

- [x] **Step 1: Create the specification index and source map**

The index must state `Draft Standard 0.1.0`, define BCP 14 keyword handling,
identify the unified normative release, and map each original protocol section
to a local page and clause range.

- [x] **Step 2: Migrate every source range without omission**

Use exact content from protocol commit `f7e70a72...` with this mapping:

| Website page                         | Pinned `PROTOCOL.md` source           |
| ------------------------------------ | ------------------------------------- |
| foundations                          | lines 1-184, sections 1-5             |
| identity-registry-and-sessions       | lines 185-246, sections 6.1-6.3       |
| signed-documents-and-trust           | lines 247-410 and 521-536             |
| first-admission-and-historical-trust | lines 411-520                         |
| missions-groups-and-membership       | lines 538-691 and 951-976             |
| work-scheduling-and-recovery         | lines 692-869, 911-950, and 1099-1117 |
| authorization-and-budgets            | lines 870-910                         |
| commands-events-and-ordering         | lines 977-1098 and 1118-1159          |
| errors-extensions-and-security       | lines 1160 through end of file        |

Preserve tables, code, exclusions, error mappings, and external normative RFC
links. Replace GitHub-internal specification links with local clause links.
Treat the BCP 14 interpretation paragraph at source lines 5-8 as a Foundation
clause: it governs requirement interpretation even though it is not itself an
implementation behavior.

- [x] **Step 3: Wrap every testable BCP 14 paragraph**

Assign the page prefix and next stable ordinal. Keep BCP 14 keywords uppercase
inside all locales; localized prose will surround the same keyword in the
localization plan.

- [x] **Step 4: Verify complete source coverage**

Add coverage to `check-normative-clauses.mjs` so every BCP 14 paragraph from the
vendored `public/artifacts/0.1/protocol/spec/PROTOCOL.md` maps to one website
clause ID. Expected: zero omitted or multiply mapped source paragraphs.

- [x] **Step 5: Run specification checks**

```bash
npm run check:normative-clauses
npm run typecheck
npm run docs:build
```

Expected: the full local English specification builds and clause coverage is
complete.

- [x] **Step 6: Commit the English specification**

```bash
git add src/content/docs/0.1/reference/specification src/data/normative/0.1/clauses.json scripts/check-normative-clauses.mjs
git commit -m "docs(protocol): publish normative specification locally"
```

### Task 3: Publish local reference artifacts and conformance pages

**Files:**

- Create: `src/content/docs/0.1/reference/terminology.mdx`
- Create: `src/content/docs/0.1/reference/schemas.mdx`
- Create: `src/content/docs/0.1/reference/conformance/index.mdx`
- Create: `src/content/docs/0.1/reference/conformance/structural.mdx`
- Create: `src/content/docs/0.1/reference/conformance/cryptography.mdx`
- Create: `src/content/docs/0.1/reference/conformance/admission.mdx`
- Create: `src/content/docs/0.1/reference/artifacts-and-digests.mdx`
- Create: `src/content/docs/0.1/reference/normative-release.mdx`
- Create: `src/content/docs/0.1/reference/errata.mdx`

- [x] **Step 1: Add the reference landing pages**

All artifact links must resolve below `/artifacts/0.1/`. The conformance
overview must show three distinct surfaces and state that passing one does not
imply passing the others.

- [x] **Step 2: Add exact structural conformance facts**

Render 58 total, 27 valid, and 31 invalid from release data. Explain manifest
semantics locally and link to the local manifest and vector directories.

- [x] **Step 3: Add exact cryptography conformance facts**

Render 98 artifacts, 22 cases, 62 evaluations, 12 complete, 50 rejected, the six
semantic stages, and digest `5eade516...` from release data.

- [x] **Step 4: Add exact Admission conformance facts**

Render 19 artifacts, 5 cases, 30 evaluations, 12 complete, 18 rejected, profile
`missionweaveprotocol.first-admission-historical-trust.v0.1`, and digest
`39971bfa...`. Include the explicit scope exclusions.

- [x] **Step 5: Add release and errata behavior**

The release page must describe generated versus committed fields. The errata
page must state that cross-language conflict is a release defect and record an
empty initial errata set as `No published errata for this release` rather than
using a placeholder.

- [x] **Step 6: Build and commit reference pages**

```bash
npm run docs:build
npm run check:built-site
git add src/content/docs/0.1/reference
git commit -m "docs(protocol): add local normative references"
```

### Task 4: Build the English Learn path

**Files:**

- Create: `src/content/docs/0.1/learn/index.mdx`
- Create: `src/content/docs/0.1/learn/core-model.mdx`
- Create: `src/content/docs/0.1/learn/identity-roles-and-authority.mdx`
- Create: `src/content/docs/0.1/learn/work-lifecycle.mdx`
- Create: `src/content/docs/0.1/learn/groups-and-scheduling.mdx`
- Create: `src/content/docs/0.1/learn/child-missions.mdx`
- Create: `src/content/docs/0.1/learn/signed-documents-and-trust.mdx`
- Create: `src/content/docs/0.1/learn/first-admission-and-historical-trust.mdx`
- Create: `src/content/docs/0.1/learn/security-boundaries.mdx`
- Create: `scripts/check-learn-pages.mjs`
- Modify: `package.json`

- [x] **Step 1: Migrate and consolidate existing learning material**

Move the useful content from current `docs/0.1/*` pages into the new learning
path. Remove `non-normative learning guide` wording and identify each local
Reference clause used by the explanation.

- [x] **Step 2: Add the First-Admission learning flow**

The page must show this exact sequence:

```text
six-stage cryptographic verification
→ authoritative Admission Log lookup
→ found record validation OR authoritative absence
→ trusted context and candidate preparation
→ atomic append-or-return-existing
→ returned record validation
→ admitted result
```

Historical replay must show six-stage verification, required found record,
record validation, and no trusted context or append.

- [x] **Step 3: Add security boundaries**

Distinguish current from historical Registry evidence and list command
freshness, signer authorization, portable log proof, state-machine acceptance,
and caller-provided trust booleans as separate or excluded concerns.

- [x] **Step 4: Verify local-only documentation links**

Until Task 6 introduces the full-site external-document dependency checker, run
the Learn-specific `npm run check:learn` gate and the built-site internal-link
check. Expected: all learning-path documentation links are local except
normative RFCs, source code, exact commits, downloads, and issue reporting. Task
6 retains responsibility for the full-site GitHub README/docs/specification
allowlist.

- [x] **Step 5: Commit the Learn path**

```bash
git add package.json scripts/check-learn-pages.mjs \
  src/content/docs/0.1/learn \
  docs/superpowers/plans/2026-08-03-normative-protocol-content.md
git commit -m "docs(learn): add normative protocol learning path"
```

### Task 5: Build the shared English runtime path

**Files:**

- Create: `src/content/docs/0.1/build/index.mdx`
- Create: `src/content/docs/0.1/build/runtime/architecture-and-bootstrap.mdx`
- Create: `src/content/docs/0.1/build/runtime/protocol-types.mdx`
- Create:
  `src/content/docs/0.1/build/runtime/validation-canonicalization-and-signing.mdx`
- Create:
  `src/content/docs/0.1/build/runtime/first-admission-and-historical-trust.mdx`
- Create: `src/content/docs/0.1/build/runtime/persistence-and-recovery.mdx`
- Create: `src/content/docs/0.1/build/runtime/transport-and-framing.mdx`
- Create: `src/content/docs/0.1/build/runtime/errors-and-observability.mdx`
- Create: `src/content/docs/0.1/build/runtime/conformance-and-upgrades.mdx`
- Create: `scripts/check-runtime-pages.mjs`
- Modify: `package.json`

- [x] **Step 1: Define the implementation sequence**

Build pages must organize local Reference clauses into an implementer flow:
bootstrap, strict parsing/schema, canonicalization/signing, key resolution,
Admission, persistence/recovery, transport, protected diagnostics, and upgrades.

- [x] **Step 2: Keep common semantics in shared pages**

Use clause links for every cross-language requirement. SDK pages may show
language syntax but must not redefine these semantics.

- [x] **Step 3: Mark implementation advice explicitly**

Wrap deployment topology, adapter examples, performance advice, and
observability suggestions in `Implementation note` blocks unless they are backed
by a normative clause.

- [x] **Step 4: Build and commit the runtime path**

```bash
npm run check:normative-clauses
npm run docs:build
git add src/content/docs/0.1/build/runtime src/content/docs/0.1/build/index.mdx
git commit -m "docs(build): add shared runtime reference"
```

### Task 6: Enforce website self-containment

**Files:**

- Create: `scripts/check-local-documentation-links.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the prohibited-link test**

Reject Markdown links whose host is GitHub and whose path ends in or contains:

```text
/README.md
/README
/docs/
/spec/PROTOCOL.md
/conformance/README.md
/cryptography/README.md
/admission/README.md
```

Allow repository home pages, exact commit pages, source-code files used as
provenance, raw artifact downloads, issues, and pull requests.

- [ ] **Step 2: Verify the test fails against the legacy content**

```bash
node scripts/check-local-documentation-links.mjs
```

Expected: FAIL listing current README/specification dependencies.

- [ ] **Step 3: Point all explanatory links to local pages**

Replace each failure with the corresponding versioned local page or local
artifact. Do not remove permitted source/provenance links.

- [ ] **Step 4: Add the check to the full suite**

```json
"check:local-docs": "node scripts/check-local-documentation-links.mjs"
```

Run it before locale and build checks in `npm run check`.

- [ ] **Step 5: Run and commit the self-containment gate**

```bash
npm run check:local-docs
npm run check
git add scripts/check-local-documentation-links.mjs package.json src/content/docs/0.1
git commit -m "test(docs): require self-contained documentation"
```
