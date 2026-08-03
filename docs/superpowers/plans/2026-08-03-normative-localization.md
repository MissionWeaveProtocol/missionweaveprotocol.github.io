# Seven-Language Normative Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish complete and semantically aligned normative content for
Simplified Chinese, Traditional Chinese, Japanese, Spanish, French, and German
alongside English.

**Architecture:** Every locale mirrors the English versioned route and clause
tree, retains identical BCP 14 keywords and clause IDs, and localizes prose,
titles, descriptions, diagrams, and terminology. Automated checks compare
structure and requirement strength; human review treats any language conflict as
a release defect.

**Tech Stack:** Markdown/MDX, Node.js locale validators, Starlight locales,
shared structured release data.

---

### Task 1: Define normative locale policy

**Files:**

- Create: `src/data/normative/0.1/locale-policy.json`
- Create: `scripts/check-normative-locales.mjs`
- Modify: `scripts/check-locale-source-parity.mjs`
- Modify: `scripts/check-locale-terminology.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing normative-locale checker**

For every English `/0.1/` page require a corresponding file beneath each of:

```text
zh-cn/0.1/
zh-tw/0.1/
ja/0.1/
es/0.1/
fr/0.1/
de/0.1/
```

The checker must compare clause ID sequence, `level` values, informative-block
markers, heading depth, local links, and code-block count.

- [ ] **Step 2: Define normative keyword policy**

Retain these BCP 14 tokens unchanged and uppercase in all languages:

```text
MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT,
RECOMMENDED, NOT RECOMMENDED, MAY, OPTIONAL
```

Localized prose explains the requirement; the shared token provides exact
cross-language strength.

- [ ] **Step 3: Define canonical localized protocol terms**

Keep wire names and protocol object names such as `Agent`, `Mission`, `Group`,
`WorkItem`, `Command`, `Event`, `Registry`, `Admission Log`, and
`First-Admission Record` byte-identical in code and clause references. Provide a
localized first-use explanation and use the established Child Mission terms
already enforced by the repository.

- [ ] **Step 4: Run the new checker before translations exist**

```bash
npm run check:normative-locales
```

Expected: FAIL with missing versioned locale pages.

- [ ] **Step 5: Commit locale policy and failing coverage gate**

```bash
git add src/data/normative/0.1/locale-policy.json scripts/check-normative-locales.mjs scripts/check-locale-source-parity.mjs scripts/check-locale-terminology.mjs package.json
git commit -m "test(i18n): define normative locale parity"
```

### Task 2: Translate Simplified and Traditional Chinese

**Files:**

- Create: `src/content/docs/zh-cn/0.1/` as a complete path-for-path mirror of
  the checked English `src/content/docs/0.1/` tree
- Create: `src/content/docs/zh-tw/0.1/` as a complete path-for-path mirror of
  the checked English `src/content/docs/0.1/` tree

- [ ] **Step 1: Translate the complete Reference tree**

Preserve every clause ID, BCP 14 token, table row, code block, local artifact
link, and explicit exclusion. Use Simplified and Traditional terminology
consistently; do not mechanically character-convert legal or technical prose.

- [ ] **Step 2: Translate the complete Learn tree**

Localize explanations, diagram labels, callouts, and security boundaries while
keeping local clause links identical in meaning.

- [ ] **Step 3: Translate shared runtime and all six SDK trees**

Keep package names, source symbols, commands, and code examples unchanged.
Localize surrounding instructions and support-status explanations.

- [ ] **Step 4: Run Chinese-specific checks**

```bash
npm run check:normative-locales
npm run check:terminology
```

Expected: no missing routes, clause differences, deprecated Child Mission
wording, or Simplified/Traditional cross-contamination.

- [ ] **Step 5: Commit both Chinese locales**

```bash
git add src/content/docs/zh-cn/0.1 src/content/docs/zh-tw/0.1
git commit -m "docs(i18n): add normative Chinese documentation"
```

### Task 3: Translate Japanese

**Files:**

- Create: `src/content/docs/ja/0.1/` as a complete path-for-path mirror of the
  checked English `src/content/docs/0.1/` tree

- [ ] **Step 1: Translate Reference, Learn, runtime, and SDK pages**

Preserve every clause ID and uppercase BCP 14 token. Use Japanese explanatory
text without translating public symbols or wire values.

- [ ] **Step 2: Verify Japanese route and semantic parity**

```bash
npm run check:normative-locales
npm run check:terminology
```

Expected: complete parity and no English prose outside code, identifiers,
defined protocol terms, or normative keywords.

- [ ] **Step 3: Commit Japanese**

```bash
git add src/content/docs/ja/0.1
git commit -m "docs(i18n): add normative Japanese documentation"
```

### Task 4: Translate Spanish, French, and German

**Files:**

- Create: `src/content/docs/es/0.1/` as a complete path-for-path mirror of the
  checked English `src/content/docs/0.1/` tree
- Create: `src/content/docs/fr/0.1/` as a complete path-for-path mirror of the
  checked English `src/content/docs/0.1/` tree
- Create: `src/content/docs/de/0.1/` as a complete path-for-path mirror of the
  checked English `src/content/docs/0.1/` tree

- [ ] **Step 1: Translate Spanish completely**

Cover Reference, Learn, shared runtime, and all six SDK references. Preserve
clause identity, keywords, code, and local links.

- [ ] **Step 2: Translate French completely**

Apply the same structural and normative requirements; do not reuse Spanish or
English prose.

- [ ] **Step 3: Translate German completely**

Apply the same structural and normative requirements; preserve compound
technical terms consistently through the terminology policy.

- [ ] **Step 4: Run all locale checks**

```bash
npm run check:locales
npm run check:terminology
npm run check:normative-locales
```

Expected: every English route has six non-identical translations with equal
clause order and requirement levels.

- [ ] **Step 5: Commit European locales**

```bash
git add src/content/docs/es/0.1 src/content/docs/fr/0.1 src/content/docs/de/0.1
git commit -m "docs(i18n): add normative European documentation"
```

### Task 5: Add cross-language semantic signatures

**Files:**

- Create: `scripts/generate-locale-clause-signatures.mjs`
- Create: `scripts/check-locale-clause-signatures.mjs`
- Create: `src/data/normative/0.1/locale-clause-signatures.json`
- Modify: `package.json`

- [ ] **Step 1: Generate structural signatures per clause**

For every locale and clause record:

```json
{
  "id": "MWP-ADM-001",
  "level": "MUST",
  "links": ["/0.1/reference/..."],
  "codeTokens": ["AUTH_INVALID_SIGNATURE", "admission"]
}
```

Sort by route and source order. Do not hash localized prose as if equal text
were required.

- [ ] **Step 2: Check semantic equality**

Require all locales to have identical IDs, levels, wire tokens, local clause
targets, and explicit exclusions. Reject a missing `MUST NOT` or changed wire
code even when page counts match.

- [ ] **Step 3: Generate twice and prove determinism**

```bash
npm run generate:locale-signatures
cp src/data/normative/0.1/locale-clause-signatures.json /tmp/missionweaveprotocol-locale-signatures.json
npm run generate:locale-signatures
cmp /tmp/missionweaveprotocol-locale-signatures.json src/data/normative/0.1/locale-clause-signatures.json
npm run check:locale-signatures
```

Expected: deterministic output and semantic parity.

- [ ] **Step 4: Commit semantic signatures**

```bash
git add scripts/generate-locale-clause-signatures.mjs scripts/check-locale-clause-signatures.mjs src/data/normative/0.1/locale-clause-signatures.json package.json
git commit -m "test(i18n): enforce normative semantic parity"
```

### Task 6: Perform the equal-authority review

**Files:**

- Modify only pages with review findings beneath `src/content/docs/zh-cn/0.1/`
- Modify only pages with review findings beneath `src/content/docs/zh-tw/0.1/`
- Modify only pages with review findings beneath `src/content/docs/ja/0.1/`
- Modify only pages with review findings beneath `src/content/docs/es/0.1/`
- Modify only pages with review findings beneath `src/content/docs/fr/0.1/`
- Modify only pages with review findings beneath `src/content/docs/de/0.1/`

- [ ] **Step 1: Review First Admission across all languages side by side**

Confirm all eight core behaviors and five exclusions appear under the same
clause IDs, with `admission` and `AUTH_INVALID_SIGNATURE` unchanged.

- [ ] **Step 2: Review identity, authorization, ordering, and error sections**

Confirm actor roles, half-open time intervals, fencing epochs, required
authority, and error codes retain the same strength.

- [ ] **Step 3: Review every SDK support statement**

Confirm all locales distinguish Python's reference runtime from the five
protocol runtimes and identify unavailable higher-level components without
ambiguous wording.

- [ ] **Step 4: Run the complete site check**

```bash
npm run check
```

Expected: all locale, terminology, semantic-signature, type, build, and
built-site checks pass.

- [ ] **Step 5: Commit review corrections**

```bash
git add src/content/docs
git commit -m "docs(i18n): complete equal-authority review"
```
