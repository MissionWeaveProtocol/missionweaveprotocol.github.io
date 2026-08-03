# MissionWeaveProtocol Normative Documentation Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a self-contained, versioned, equally normative seven-language
website with complete, source-verified runtime references for all six official
SDKs.

**Architecture:** Execute five independently testable plans in order: release
foundation, English protocol content, SDK runtime references, normative
localization, and route migration/publication. The site commits all offline
artifacts, generates a non-self-referential release manifest during the build,
and blocks publication unless exact protocol/SDK pins, locale parity, internal
links, and the live Pages site verify.

**Tech Stack:** Astro 7, Starlight 0.41, TypeScript/JavaScript ESM,
Markdown/MDX, Node.js 22, GitHub Actions and GitHub Pages.

---

## Program order

1. [Normative release foundation](./2026-08-03-normative-release-foundation.md)
2. [Normative protocol and shared runtime content](./2026-08-03-normative-protocol-content.md)
3. [Six-SDK runtime reference](./2026-08-03-sdk-runtime-reference.md)
4. [Seven-language normative localization](./2026-08-03-normative-localization.md)
5. [Route migration, publication, and live verification](./2026-08-03-normative-migration-publication.md)

The plans share one branch and one isolated worktree:

```text
branch: docs/normative-documentation-restructure
worktree: /Users/lionelmbp/.config/superpowers/worktrees/missionweaveprotocol.github.io/normative-documentation-restructure
```

The root agent owns all edits and commits. Read-only investigation or review may
run in parallel, but no other agent may mutate the worktree or GitHub state.

## Program checkpoints

- [ ] **Checkpoint 1: Confirm design and plan commits are clean**

Run:

```bash
git status --short --branch
git log -2 --oneline --decorate
```

Expected: branch `docs/normative-documentation-restructure`, no uncommitted
changes, and the design/plan commits at HEAD.

- [ ] **Checkpoint 2: Complete plans 1-4 without deploying**

Run after each plan:

```bash
npm run check
git status --short
```

Expected: the full repository check passes and the worktree is clean after the
plan's final commit.

- [ ] **Checkpoint 3: Run the release candidate verification**

Run:

```bash
npm run check
npm run check:release-sources
npm run verify:preview
```

Expected: all offline checks pass, all seven exact repositories verify, and the
local preview read-back reports every required route and artifact present.

- [ ] **Checkpoint 4: Stop before external mutation**

Before push, pull request, merge, or deployment, report the exact branch, HEAD,
test results, target repository, and intended external action to the user and
obtain current confirmation.

- [ ] **Checkpoint 5: Publish and verify the live site**

After approved publication, run:

```bash
SITE_URL=https://missionweaveprotocol.github.io npm run verify:live
```

Expected: all seven locales, Latest aliases, versioned routes, redirects,
release manifest, artifacts, and six SDK references pass live read-back.

## Program completion

Do not mark the program complete until all five plans are complete, the branch
is integrated into `main`, the Pages deployment is successful, and live
verification passes against the deployed commit.
