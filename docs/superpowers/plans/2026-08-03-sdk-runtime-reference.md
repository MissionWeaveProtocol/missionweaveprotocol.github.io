# Six-SDK Runtime Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish complete, local, exact-commit runtime references and runnable
Admission examples for Python, TypeScript, Go, Rust, Java, and C++.

**Architecture:** A structured SDK matrix records package identity, toolchain,
pinned commit, implemented runtime surface, source paths, and public Admission
API names. Shared components render support and API inventories; language pages
document the entire implemented surface without claiming unavailable
orchestration features. Release verification checks symbols and runs native
examples against exact pinned sources.

**Tech Stack:** Astro MDX, Node.js source verification, Python 3.12/uv, Node.js
20+/TypeScript, Go 1.24, Rust 1.85, Java 21/Maven 3.9, C++20/CMake
3.24/OpenSSL 3.

---

### Task 1: Define the six-SDK source and capability matrix

**Files:**

- Create: `src/data/normative/0.1/sdk-runtime-matrix.json`
- Create: `scripts/check-sdk-runtime-matrix.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write a failing matrix checker**

Require exactly six entries with these package identities and toolchains:

| SDK        | Package                                             | Minimum runtime              |
| ---------- | --------------------------------------------------- | ---------------------------- |
| Python     | `missionweaveprotocol`                              | Python 3.12                  |
| TypeScript | `@missionweaveprotocol/sdk`                         | Node.js 20                   |
| Go         | `github.com/missionweaveprotocol/go-sdk`            | Go 1.24                      |
| Rust       | `missionweaveprotocol`                              | Rust 1.85                    |
| Java       | `org.missionweaveprotocol:missionweaveprotocol-sdk` | Java 21, Maven 3.9           |
| C++        | `MissionWeaveProtocol::sdk`                         | C++20, CMake 3.24, OpenSSL 3 |

The checker must require exact pins from `release-source.json`, at least one
source file per capability, explicit `implemented` and `notImplemented` arrays,
and public Admission operation names.

- [ ] **Step 2: Run the checker before the matrix exists**

```bash
node scripts/check-sdk-runtime-matrix.mjs
```

Expected: FAIL with missing `sdk-runtime-matrix.json`.

- [ ] **Step 3: Add the actual runtime breadth**

Record Python as the reference runtime with Core, Agent runtime, Scheduler,
Group gateway, stores, replay, policy, leases, budgets, delegation, validation,
signing, frames, conformance, and Admission.

Record TypeScript, Go, Rust, Java, and C++ as protocol runtimes implementing
strict JSON/schema validation, canonicalization, Ed25519 signing or
verification, Registry-backed key resolution, frames, conformance, embedded
bundles, and First Admission/Historical Trust. Explicitly list high-level
Mission orchestration, Worker scheduling, gateway service, and persistence
runtime as not implemented where source verification confirms their absence.

- [ ] **Step 4: Record exact Admission operation names**

Use:

| SDK        | Prepare                   | First admission | Historical replay             |
| ---------- | ------------------------- | --------------- | ----------------------------- |
| Python     | `prepare_first_admission` | `admit_first`   | `verify_historical_admission` |
| TypeScript | `prepareFirstAdmission`   | `admitFirst`    | `verifyHistoricalAdmission`   |
| Go         | `PrepareFirstAdmission`   | `AdmitFirst`    | `VerifyHistoricalAdmission`   |
| Rust       | `prepare_first_admission` | `admit_first`   | `verify_historical_admission` |
| Java       | `prepareFirstAdmission`   | `admitFirst`    | `verifyHistoricalAdmission`   |
| C++        | `prepare_first_admission` | `admit_first`   | `verify_historical_admission` |

- [ ] **Step 5: Run and commit the matrix**

```bash
npm run check:sdk-matrix
git add src/data/normative/0.1/sdk-runtime-matrix.json scripts/check-sdk-runtime-matrix.mjs package.json
git commit -m "feat(docs): define six SDK runtime matrix"
```

### Task 2: Generate and verify SDK API inventories

**Files:**

- Create: `scripts/generate-sdk-api-inventories.mjs`
- Create: `scripts/check-sdk-api-inventories.mjs`
- Create: `public/artifacts/0.1/sdks/python-api.json`
- Create: `public/artifacts/0.1/sdks/typescript-api.json`
- Create: `public/artifacts/0.1/sdks/go-api.json`
- Create: `public/artifacts/0.1/sdks/rust-api.json`
- Create: `public/artifacts/0.1/sdks/java-api.json`
- Create: `public/artifacts/0.1/sdks/cpp-api.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing inventory check**

For example, require the Python inventory to contain this exact identity and
shape; apply the corresponding exact values to the other five SDKs:

```json
{
  "sdk": "python",
  "commit": "9403cf1310914670506c56cbab363fdaa465d3cc",
  "package": "missionweaveprotocol",
  "symbols": ["AdmissionService"],
  "sourceFiles": ["src/missionweaveprotocol/admission.py"]
}
```

Require `AdmissionService`, `AdmissionLog`, `AdmissionCurrentKeyResolver`,
`TrustedAdmissionContext`, `FirstAdmissionRecord`, `PreparedFirstAdmission`,
`AdmittedSignedDocument`, and the three operations in every inventory.

- [ ] **Step 2: Verify the check fails before inventories exist**

```bash
node scripts/check-sdk-api-inventories.mjs
```

Expected: FAIL listing six absent inventory files.

- [ ] **Step 3: Implement exact-commit inventory generation**

Read source bytes with `git -C sdkRoot show ${sdk.commit}:${sourcePath}`. Use
these public-entry sources:

```text
Python:     src/missionweaveprotocol/__init__.py, src/missionweaveprotocol/admission.py
TypeScript: src/index.ts, src/admission.ts
Go:         admission.go
Rust:       src/lib.rs, src/admission.rs
Java:       src/main/java/org/missionweaveprotocol/sdk/*.java
C++:        include/missionweaveprotocol/*.hpp
```

The generator must preserve sorted symbol names, source paths, package identity,
and exact commit. It must fail if a required source file or Admission operation
is absent.

- [ ] **Step 4: Generate from local exact commits and prove determinism**

```bash
MW_SOURCES_ROOT=/Users/lionelmbp/repos node scripts/generate-sdk-api-inventories.mjs
cp -R public/artifacts/0.1/sdks /tmp/missionweaveprotocol-sdk-inventories
MW_SOURCES_ROOT=/Users/lionelmbp/repos node scripts/generate-sdk-api-inventories.mjs
diff -ru /tmp/missionweaveprotocol-sdk-inventories public/artifacts/0.1/sdks
```

Expected: no diff.

- [ ] **Step 5: Check and commit inventories**

```bash
npm run check:sdk-inventories
git add public/artifacts/0.1/sdks scripts/generate-sdk-api-inventories.mjs scripts/check-sdk-api-inventories.mjs package.json
git commit -m "feat(docs): add exact SDK API inventories"
```

### Task 3: Add reusable SDK reference components

**Files:**

- Create: `src/components/SdkRuntimeMatrix.astro`
- Create: `src/components/SdkApiInventory.astro`
- Create: `src/components/SdkInstall.astro`
- Create: `src/components/SupportStatus.astro`

- [ ] **Step 1: Add matrix rendering from structured data**

The matrix must show implemented, not implemented, exact commit, package,
toolchain, structural vectors, cryptography bundle, and Admission bundle. No
capability may be embedded in the component source.

- [ ] **Step 2: Add local API inventory rendering**

`SdkApiInventory.astro` reads the local JSON file and renders source path,
public symbol, and exact commit. Source links may point to exact GitHub code for
provenance, but explanations remain local.

- [ ] **Step 3: Add explicit support labels**

Use only `Implemented`, `Not implemented`, and `Deployment adapter required`. Do
not use ambiguous partial-support or future-tense labels.

- [ ] **Step 4: Build and commit components**

```bash
npm run typecheck
npm run docs:build
git add src/components
git commit -m "feat(docs): add SDK reference components"
```

### Task 4: Publish the Python runtime reference

**Files:**

- Create: `src/content/docs/0.1/build/sdk/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/python/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/python/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/python/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/python/api.mdx`
- Create: `examples/sdk/python/admission.py`

- [ ] **Step 1: Document installation and package entry points**

Document Python 3.12+, package `missionweaveprotocol`, and the three console
commands `missionweaveprotocol-server`, `missionweaveprotocol-demo`, and
`missionweaveprotocol-conformance`.

- [ ] **Step 2: Document the complete reference runtime**

Cover the exported Core, Agent runtime, Scheduler, gateway, local and database
stores, replay, policy, lease, budget, delegation, schema, signing, frames,
conformance, and Admission modules from pinned source. Mark database or network
services as deployment dependencies, not protocol guarantees.

- [ ] **Step 3: Document First Admission and Historical Trust**

Use the exact Python public classes and method names from the inventory. The
runnable example must implement typed in-memory resolver, Admission Log, and
trusted-context adapters, then call both `admit_first` and
`verify_historical_admission` without caller-provided trust booleans.

- [ ] **Step 4: Verify the Python example**

Copy the example into a detached checkout of the pinned SDK and run:

```bash
uv sync --all-extras
uv run python /absolute/path/to/examples/sdk/python/admission.py
```

Expected: exit 0 and matching admission record IDs for first admission and
historical replay.

- [ ] **Step 5: Build and commit Python documentation**

```bash
npm run docs:build
git add src/content/docs/0.1/build/sdk examples/sdk/python
git commit -m "docs(sdk): add Python runtime reference"
```

### Task 5: Publish TypeScript and Go runtime references

**Files:**

- Create: `src/content/docs/0.1/build/sdk/typescript/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/typescript/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/typescript/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/typescript/api.mdx`
- Create: `src/content/docs/0.1/build/sdk/go/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/go/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/go/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/go/api.mdx`
- Create: `examples/sdk/typescript/admission.ts`
- Create: `examples/sdk/go/admission/main.go`

- [ ] **Step 1: Document TypeScript exactly**

Document Node.js 20+, package `@missionweaveprotocol/sdk`, ESM/CJS exports,
strict JSON, schema catalog, canonical JSON, signed-document codec, frame codec,
conformance CLI, embedded bundles, and Admission. State that Mission
orchestration, Scheduler, gateway, and persistence runtime are not implemented
at the pinned commit.

- [ ] **Step 2: Verify the TypeScript example and SDK**

```bash
npm ci
npm run check
cp /absolute/path/to/examples/sdk/typescript/admission.ts examples/website-admission.ts
node --experimental-strip-types examples/website-admission.ts
```

Run these commands only in a disposable detached checkout. The existing
`typecheck:examples` step includes `examples/website-admission.ts`; the SDK
check must pass and the Node 22 execution must exit 0.

- [ ] **Step 3: Document Go exactly**

Document Go 1.24, module `github.com/missionweaveprotocol/go-sdk`, schema,
canonicalization, signing, Registry resolution, frame, conformance, bundle, and
Admission APIs. State unavailable high-level runtime surfaces explicitly.

- [ ] **Step 4: Verify the Go example and SDK**

```bash
go test ./...
go run /absolute/path/to/examples/sdk/go/admission/main.go
```

Expected: tests pass and the example exits 0.

- [ ] **Step 5: Commit TypeScript and Go documentation**

```bash
git add src/content/docs/0.1/build/sdk/typescript src/content/docs/0.1/build/sdk/go examples/sdk/typescript examples/sdk/go
git commit -m "docs(sdk): add TypeScript and Go runtime references"
```

### Task 6: Publish Rust, Java, and C++ runtime references

**Files:**

- Create: `src/content/docs/0.1/build/sdk/rust/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/rust/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/rust/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/rust/api.mdx`
- Create: `src/content/docs/0.1/build/sdk/java/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/java/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/java/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/java/api.mdx`
- Create: `src/content/docs/0.1/build/sdk/cpp/index.mdx`
- Create: `src/content/docs/0.1/build/sdk/cpp/runtime.mdx`
- Create: `src/content/docs/0.1/build/sdk/cpp/admission.mdx`
- Create: `src/content/docs/0.1/build/sdk/cpp/api.mdx`
- Create: `examples/sdk/rust/admission.rs`
- Create: `examples/sdk/java/AdmissionExample.java`
- Create: `examples/sdk/cpp/admission.cpp`

- [ ] **Step 1: Document and verify Rust**

Document Rust 1.85, edition 2024, crate `missionweaveprotocol`, public
re-exports, conformance binary, bundle, frame, signed-document, Registry, and
Admission surfaces. Run:

```bash
cargo test --all-targets --all-features
cargo run --example website_admission
```

Expected: tests and the copied website example pass.

- [ ] **Step 2: Document and verify Java**

Document Java 21, Maven 3.9, package `org.missionweaveprotocol.sdk`, the
conformance CLI, strict JSON, schema, canonicalization, key resolution, frame,
bundle, and Admission classes. Run:

```bash
mvn -B verify
```

Add the website example to the detached checkout's examples module for this
verification. Expected: Maven verify passes, including the example test.

- [ ] **Step 3: Document and verify C++**

Document C++20, CMake 3.24, OpenSSL 3, jsoncons 1.8.1,
`MissionWeaveProtocol::sdk`, installed headers, conformance executable, bundle,
frame, Registry, and Admission surfaces. Run:

```bash
cmake -S . -B build -DMISSIONWEAVEPROTOCOL_BUILD_TESTS=ON -DMISSIONWEAVEPROTOCOL_BUILD_EXAMPLES=ON
cmake --build build --parallel 2
ctest --test-dir build --output-on-failure
```

Expected: configure, build, and tests pass, including the copied website
Admission example.

- [ ] **Step 4: Commit Rust, Java, and C++ documentation**

```bash
git add src/content/docs/0.1/build/sdk/rust src/content/docs/0.1/build/sdk/java src/content/docs/0.1/build/sdk/cpp examples/sdk/rust examples/sdk/java examples/sdk/cpp
git commit -m "docs(sdk): add Rust Java and C++ runtime references"
```

### Task 7: Automate six-language example verification

**Files:**

- Create: `scripts/verify-sdk-examples.mjs`
- Modify: `.github/workflows/pages.yml`
- Modify: `package.json`

- [ ] **Step 1: Add a matrix-aware verifier**

The script accepts `--sdk python`, `--sdk typescript`, `--sdk go`, `--sdk rust`,
`--sdk java`, or `--sdk cpp` and `MW_SOURCES_ROOT`, validates detached HEAD,
installs only that SDK's documented toolchain dependencies, copies the website
example to a temporary path inside the checkout, and runs the exact commands
defined above.

- [ ] **Step 2: Add a release-only GitHub Actions matrix**

Create six matrix entries with the required setup action for each toolchain.
Every entry must run API inventory regeneration and the native example. The
release/deploy job depends on all six entries.

- [ ] **Step 3: Run all locally available verifiers**

```bash
MW_SOURCES_ROOT=/Users/lionelmbp/repos npm run verify:sdk-examples
```

Expected: each installed toolchain passes. If a local toolchain is unavailable,
record that exact local boundary and require the corresponding GitHub Actions
matrix job before publication.

- [ ] **Step 4: Run the website suite and commit**

```bash
npm run check
git add scripts/verify-sdk-examples.mjs .github/workflows/pages.yml package.json
git commit -m "ci(docs): verify six SDK runtime examples"
```
