# MissionWeaveProtocol Normative Documentation Restructure Design

Date: 2026-08-03

Status: Approved design, pending implementation plan

## Context

The MissionWeaveProtocol website currently combines learning material, SDK
summaries, and selected references, while depending on GitHub-hosted README and
repository documentation for important details. Its structure predates the
First-Admission and Historical-Trust contract, the Admission conformance
bundle, and full runtime documentation for all six official SDKs. Several
published counts and pins are also stale.

The website is now defined as a normative publication of the protocol. It must
be understandable without following links to GitHub README or `docs/` pages,
must publish all seven languages with equal normative force, and must align its
prose, machine-readable artifacts, conformance bundles, and SDK references as
one release.

## Goals

1. Replace the current incremental documentation layout with a durable
   Learn/Build/Reference information architecture.
2. Make versioned website documentation a normative component of each protocol
   release.
3. Publish English, Simplified Chinese, Traditional Chinese, Japanese,
   Spanish, French, and German with equal normative force.
4. Provide complete, local runtime reference documentation for Python,
   TypeScript, Go, Rust, Java, and C++.
5. Keep protocol explanations, SDK instructions, and normative reference
   material on the website instead of delegating them to GitHub README or
   repository documentation.
6. Publish schemas, manifests, conformance bundles, pins, and digests as local
   website artifacts.
7. Prevent drift through structured release data, stable clause identifiers,
   source verification, locale parity checks, and atomic publication.
8. Preserve existing public URLs through explicit redirects and verify the
   deployed GitHub Pages site before declaring completion.

## Non-goals

This restructure does not expand the First-Admission or Historical-Trust
contract to include:

- command freshness;
- signer authorization;
- portable log-proof verification;
- state-machine acceptance; or
- caller-provided trust booleans.

The website may link to source repositories, exact commits, downloadable raw
source artifacts, and issue reporting. It must not require a GitHub README or
repository documentation page to explain normative behavior or SDK usage.

## Normative authority model

### Unified normative release

A protocol release is a coordinated normative package containing:

- versioned website prose;
- JSON Schemas;
- structural conformance artifacts;
- cryptography conformance artifacts;
- Admission conformance artifacts;
- protocol and SDK pins; and
- the public runtime contracts documented for all six SDKs.

The release is described by a website-hosted `normative-release.json`. The
manifest pins the website commit and build identity, the protocol commit, all
six SDK commits, artifact counts and digests, and the content digests for all
seven locales. It is generated during the production build so that the source
tree does not attempt to contain its own Git commit identifier. The committed
release source records every non-self-referential input; the generated manifest
adds the checked-out website commit, build identity, and output digests. A
mismatch between any two components is a release defect, not an invitation to
choose an undocumented source of truth.

The initial synchronized release uses protocol commit
`f7e70a72c76bbeb5014c186cd820aac2112f0dde` and the following SDK commits:

| SDK | Commit |
| --- | --- |
| Python | `9403cf1310914670506c56cbab363fdaa465d3cc` |
| TypeScript | `6d53ebfcf8350ae81d89fd818611b07f7373685c` |
| Go | `80c39852e8a2053ac761b8d53d62483264f803f1` |
| Rust | `2727f8777737265d98dde4ceaca306612ef54c52` |
| Java | `3b2798c21d906c81887c54fe80e5bca8a19ddac7` |
| C++ | `481b0ce3a65c1f2265935318b54481ece5032fdf` |

The synchronized artifacts contain:

- 22 normative schemas;
- 58 structural vectors: 27 valid and 31 invalid;
- 98 cryptography artifacts, 22 cases, and 62 evaluations: 12 complete and
  50 rejected, with digest
  `sha256:5eade516e4bc5dcf04477727ebcccd11f33348b2d9135fb6fe0365c6e6cc2ea3`;
- 19 Admission artifacts, 5 cases, and 30 evaluations: 12 complete and
  18 rejected, with digest
  `sha256:39971bfafb68ef6c18f9026220cccc4f023fd4d5c8074f8ff0276cb1129cd0a0`;
  and
- Admission profile
  `missionweaveprotocol.first-admission-historical-trust.v0.1`.

### Equal normative languages

All seven language variants are normative and structurally complete. No
language automatically overrides another. A semantic inconsistency between
languages is a normative defect and must be corrected through the errata and
release process.

Every testable requirement receives a stable clause identifier, such as
`MWP-ADM-001`. All translations, conformance cases, and SDK reference pages use
the same identifier. Checks compare clause presence, order, normative keywords,
and cross-references across locales.

Examples or implementation advice that do not create protocol requirements
must be explicitly marked `Informative example` or `Implementation note`.
Unmarked requirements on normative pages have normative force.

## URL and version model

The site provides three forms of navigation:

1. Versioned normative content under `/0.1/learn/`, `/0.1/build/`, and
   `/0.1/reference/`.
2. Unversioned Latest aliases under `/learn/`, `/build/`, and `/reference/`.
3. Explicit compatibility redirects from existing `/docs/0.1/*`, `/sdk/*`, and
   current reference routes.

The Latest aliases always identify the current published protocol version.
Versioned routes remain available when a later protocol version becomes
current. Old routes use one-to-one redirects to the corresponding replacement;
they must not fall back generically to a section index or home page.

Every locale has the same route tree. Canonical and alternate-language metadata
must identify the versioned route and all language equivalents correctly.

## Information architecture

### Learn

Learn follows the reader's conceptual journey:

1. Protocol overview
2. Core model
3. Identity, roles, and authority
4. Work lifecycle
5. Groups and scheduling
6. Child Missions
7. Signed Documents and trust
8. First Admission and Historical Trust
9. Security boundaries

Learn pages are normative explanations. They introduce the model without
requiring the reader to assemble rules from source repository documents.

### Build

Build follows an implementer's integration journey:

1. Integration overview
2. Runtime architecture and bootstrap
3. Protocol types
4. Validation, canonicalization, signing, and key resolution
5. First Admission and Historical Trust
6. Persistence and recovery
7. Transport and framing
8. Errors and observability
9. Conformance and upgrades
10. SDK overview
11. Python runtime reference
12. TypeScript runtime reference
13. Go runtime reference
14. Rust runtime reference
15. Java runtime reference
16. C++ runtime reference

Shared runtime pages define cross-language behavior once. Each SDK reference
defines the real public names, types, call sequence, adapters, examples, and
language-specific behavior for that implementation.

Every SDK reference covers:

- installation, versions, and runtime requirements;
- initialization and configuration;
- public types and APIs;
- validation, canonicalization, signing, and key resolution;
- First Admission and Historical Trust;
- runtime components and call flow;
- persistence, recovery, and adapters;
- transport, frames, and error handling;
- conformance, bundle pins, and upgrades; and
- complete runnable examples.

"Complete runtime reference" means complete documentation of the runtime
surface that the pinned SDK actually implements, including explicit support
and availability information. It does not mean inventing missing APIs or
claiming that all SDKs have identical implementation breadth. If a required
documented surface does not exist at the pinned commit, the normative release
is blocked. Implementing missing SDK functionality is a separate cross-repository
change and requires separate authorization.

The website must verify these descriptions against the public API at the pinned
SDK commit. It must not manufacture parity by copying Python names into another
language.

### Reference

Reference maps the normative protocol and release artifacts:

- specification foundations;
- identity, Registry, and sessions;
- Missions, Groups, and Membership;
- Commands, Events, and ordering;
- work, scheduling, and recovery;
- Signed Documents and trust;
- First Admission and Historical Trust;
- authorization and budgets;
- errors, extensions, and security;
- terminology;
- JSON Schemas;
- structural conformance;
- cryptography conformance;
- Admission conformance;
- artifacts and digests;
- the normative release manifest; and
- errata.

The Reference section contains the complete website-hosted normative text. It
does not send readers to a GitHub specification or conformance README to obtain
missing rules.

## First-Admission and Historical-Trust contract

The Learn, Build, and Reference views must express one consistent contract:

1. First admission runs all six cryptographic verification stages before any
   Admission Log access.
2. Current Registry evidence is distinct from historical Registry evidence.
3. Only authoritative absence permits record creation.
4. Append uses atomic append-or-return-existing behavior.
5. Any record returned by an adapter is validated again.
6. Historical replay reruns cryptography, requires an existing record, never
   issues a trusted context, and never appends.
7. The protected instant and trusted instant use the same selected key
   interval.
8. Admission failures use stage `admission` and wire code
   `AUTH_INVALID_SIGNATURE`.

The pages must also state the explicit exclusions listed in the Non-goals
section.

## Structured content model

Version-specific shared facts live under a structure equivalent to:

```text
src/data/normative/0.1/
├── release-source.json
├── clauses.json
├── terminology.json
├── routes.json
├── artifacts.json
└── sdk-runtime-matrix.json
```

Markdown or MDX stores the normative prose for each locale. Structured data
provides values that must not be copied manually across hundreds of pages:

- versions and commits;
- artifact counts and digests;
- SDK pins and capability matrices;
- stable clause identifiers;
- shared terminology; and
- version and redirect routes.

`release-source.json` excludes the website commit and generated output digests.
The production build combines it with the checked-out commit and computed
outputs to create the deployed `normative-release.json`, excluding that manifest
itself from the content-digest calculation.

Pages render these values through shared components. Shared runtime semantics
appear in the language-independent runtime pages; SDK pages refer to local
clause identifiers instead of restating subtly different versions of the same
rule.

## Local normative artifacts

The website publishes versioned, local copies of all required machine-readable
artifacts under `/artifacts/0.1/`, including schemas, manifests, conformance
bundles, release pins, and SDK API inventories. Readers can view or download
them without visiting GitHub.

The ordinary site build is offline and uses committed artifacts. The formal
release verification additionally checks out the exact protocol and SDK
commits from `normative-release.json`, regenerates inventories, recomputes
digests, and compares the results with the committed website artifacts.

## SDK source verification

For each pinned SDK, the release verification must:

1. Confirm the documented public types and API names exist.
2. Confirm the protocol and bundle pins.
3. Confirm every documented runtime component exists.
4. Compile or execute documentation examples when the SDK toolchain supports
   such checks.
5. Produce a committed, reviewable API inventory.
6. Reject undocumented substitutions that make one language appear equivalent
   by name alone.

A normal offline content build may use the committed inventories. A normative
release cannot proceed unless the fresh exact-commit verification succeeds for
all six SDKs.

## Migration strategy

Implementation is staged for review but published atomically:

1. Add versioned routes, Latest aliases, structured facts, and the redirect
   map.
2. Migrate and expand the complete protocol specification into local pages.
3. Add shared runtime documentation and all six SDK reference trees.
4. Complete all seven normative translations.
5. Import and verify local normative artifacts and SDK inventories.
6. Run the entire validation suite and publish one complete release.

Existing pages remain until their replacements and redirects are verified.
Intermediate commits must not deploy a partially normative site.

## Validation and error handling

The repository must add or extend checks for:

- route, navigation, title, and page parity across locales;
- clause identifier presence, uniqueness, ordering, and cross-language parity;
- normative keyword and terminology consistency;
- prohibited dependencies on GitHub README or repository documentation links;
- local artifact counts and digests;
- protocol and SDK pins;
- SDK public symbols and documentation examples;
- internal links, canonical URLs, alternate-language links, redirects, and
  sitemap output;
- Latest alias and versioned route consistency;
- Astro production build output; and
- the final built site's required pages and downloads.

Missing locales, unavailable exact source commits, API mismatches, digest
mismatches, broken internal links, invalid redirects, or failed SDK examples
are release-blocking errors. The workflow must not silently omit a language,
SDK, example, or artifact.

## Publication and live verification

All repository checks and the production build must pass before publication.
The deployment workflow must be confirmed against the current objective,
branch, commit, and Pages configuration immediately before any externally
visible action.

A successful GitHub Actions job is not sufficient evidence of completion. The
published site must be read back to verify:

- representative pages in all seven languages;
- the versioned routes and Latest aliases;
- every compatibility redirect class;
- the normative release manifest;
- schemas, manifests, and conformance downloads;
- the six SDK runtime references; and
- the First-Admission and Historical-Trust clauses.

Only after those checks pass may the update be reported as published.

## Completion criteria

The restructure is complete when:

1. The website is self-contained for protocol and SDK documentation.
2. Seven complete, equally normative language trees are published.
3. Six accurate and verified runtime SDK references are published.
4. The three conformance surfaces and all normative artifacts are available
   locally with correct counts and digests.
5. Versioned routes, Latest aliases, and compatibility redirects work.
6. The normative release manifest pins all coordinated inputs.
7. Offline build, exact-source release verification, locale checks, link checks,
   and built-site checks pass.
8. The public GitHub Pages site is read back successfully.

## Implementation boundaries

All implementation work occurs in an isolated worktree. Existing worktrees and
unrelated changes are preserved. The root agent owns the single write lane;
parallel agents, if used, are limited to independent read-only investigation,
review, testing, or evidence gathering.

Push, pull request, merge, and deployment actions require a fresh scope and
target verification. No completion claim may exceed the exact tests and live
checks that passed.
