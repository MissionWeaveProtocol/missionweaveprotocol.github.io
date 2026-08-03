import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const checker = path.join(
  repositoryRoot,
  "scripts/check-normative-clauses.mjs",
);
const baseManifest = JSON.parse(
  await readFile(
    path.join(repositoryRoot, "src/data/normative/0.1/clauses.json"),
    "utf8",
  ),
);
const terminology = await readFile(
  path.join(repositoryRoot, "src/data/normative/0.1/terminology.json"),
  "utf8",
);

function entry(id, level, startLine) {
  return {
    id,
    page: "foundations",
    level,
    source: {
      startLine,
      endLine: startLine,
      sha256: `sha256:${"a".repeat(64)}`,
    },
  };
}

async function writeFixture(root, { clauses, content }) {
  const componentsRoot = path.join(root, "src/components");
  const dataRoot = path.join(root, "src/data/normative/0.1");
  const contentRoot = path.join(root, "src/content/docs/0.1");
  await mkdir(componentsRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });
  await mkdir(contentRoot, { recursive: true });
  for (const component of [
    "NormativeClause.astro",
    "InformativeBlock.astro",
    "NormativeReleaseFacts.astro",
  ]) {
    await writeFile(path.join(componentsRoot, component), "---\n---\n");
  }
  await writeFile(path.join(dataRoot, "terminology.json"), terminology);
  await writeFile(
    path.join(dataRoot, "clauses.json"),
    `${JSON.stringify({ ...baseManifest, clauses }, null, 2)}\n`,
  );
  await writeFile(path.join(contentRoot, "foundations.mdx"), content);
}

function runChecker(root) {
  return spawnSync(process.execPath, [checker, "--repository-root", root], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

async function runCase(temporaryRoot, name, fixture, expectation) {
  const root = path.join(temporaryRoot, name);
  await writeFixture(root, fixture);
  const result = runChecker(root);
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (expectation === "pass") {
    assert.equal(result.status, 0, `${name} failed unexpectedly:\n${output}`);
  } else {
    assert.notEqual(result.status, 0, `${name} passed unexpectedly`);
    assert.match(output, expectation, `${name} failed for the wrong reason`);
  }
}

const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), "missionweaveprotocol-clause-check-"),
);
try {
  const validContent = `---
title: Fixture
description: MUST in frontmatter is metadata, not normative prose.
---

import NormativeClause from "fixture";

\`MUST\`

\`\`\`text
MUST NOT
\`\`\`

<Example label="SHOULD" />

<NormativeClause id="MWP-FND-001" level="MUST">
Implementations MUST preserve the value.
</NormativeClause>

<NormativeClause
  id="MWP-FND-002"
  level={["MUST", "SHOULD", "MUST NOT"]}
>
Implementations MUST parse the value, SHOULD report failures, and MUST NOT normalize it.
</NormativeClause>
`;
  await runCase(
    temporaryRoot,
    "valid",
    {
      clauses: [
        entry("MWP-FND-001", "MUST", 10),
        entry("MWP-FND-002", ["MUST", "SHOULD", "MUST NOT"], 20),
      ],
      content: validContent,
    },
    "pass",
  );

  await runCase(
    temporaryRoot,
    "duplicate-id",
    {
      clauses: [entry("MWP-FND-001", "MUST", 1)],
      content: `<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST comply.</NormativeClause>
<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST comply.</NormativeClause>
`,
    },
    /duplicate normative clause id/u,
  );

  await runCase(
    temporaryRoot,
    "malformed-id",
    {
      clauses: [],
      content:
        '<NormativeClause id="MWP-BAD-1" level="MUST">A runtime MUST comply.</NormativeClause>\n',
    },
    /malformed normative clause id/u,
  );

  await runCase(
    temporaryRoot,
    "outside-keyword",
    {
      clauses: [],
      content: "A runtime MUST comply.\n",
    },
    /appears outside NormativeClause/u,
  );

  await runCase(
    temporaryRoot,
    "unlisted-id",
    {
      clauses: [],
      content:
        '<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST comply.</NormativeClause>\n',
    },
    /is not listed in clauses\.json/u,
  );

  await runCase(
    temporaryRoot,
    "keyword-substring",
    {
      clauses: [entry("MWP-FND-001", "MUST", 1)],
      content:
        '<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST NOT normalize.</NormativeClause>\n',
    },
    /declared levels differ/u,
  );

  console.log(
    "Normative clause checker fixture tests passed valid and five rejecting cases.",
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
