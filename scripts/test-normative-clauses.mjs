import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

function entry(id, level, startLine, sourceText, endLine = startLine) {
  return {
    id,
    page: "reference/specification/foundations",
    level,
    source: {
      startLine,
      endLine,
      sha256: `sha256:${createHash("sha256").update(sourceText).digest("hex")}`,
    },
  };
}

async function writeFixture(
  root,
  { clauses, content, source = "", sourceCounts = { total: 0, mixed: 0 } },
) {
  const componentsRoot = path.join(root, "src/components");
  const dataRoot = path.join(root, "src/data/normative/0.1");
  const contentRoot = path.join(root, "src/content/docs/0.1");
  const contentFile = path.join(
    contentRoot,
    "reference/specification/foundations.mdx",
  );
  const sourceRoot = path.join(root, "public/artifacts/0.1/protocol/spec");
  await mkdir(componentsRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });
  await mkdir(contentRoot, { recursive: true });
  await mkdir(path.dirname(contentFile), { recursive: true });
  await mkdir(sourceRoot, { recursive: true });
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
    `${JSON.stringify(
      {
        ...baseManifest,
        source: {
          ...baseManifest.source,
          bcp14Paragraphs: sourceCounts.total,
          mixedLevelParagraphs: sourceCounts.mixed,
        },
        clauses,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(contentFile, content);
  await writeFile(path.join(sourceRoot, "PROTOCOL.md"), source);
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
  const singleSource = "Implementations MUST preserve the value.";
  const mixedSource =
    "Implementations MUST parse the value, SHOULD report failures, and MUST NOT normalize it.";
  const validSource = `${singleSource}\n\n${mixedSource}\n`;
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
        entry("MWP-FND-001", "MUST", 1, singleSource),
        entry("MWP-FND-002", ["MUST", "SHOULD", "MUST NOT"], 3, mixedSource),
      ],
      content: validContent,
      source: validSource,
      sourceCounts: { total: 2, mixed: 1 },
    },
    "pass",
  );

  await runCase(
    temporaryRoot,
    "duplicate-id",
    {
      clauses: [entry("MWP-FND-001", "MUST", 1, singleSource)],
      content: `<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST comply.</NormativeClause>
<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST comply.</NormativeClause>
`,
      source: `${singleSource}\n\nA runtime MUST comply.\n`,
      sourceCounts: { total: 2, mixed: 0 },
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
      clauses: [entry("MWP-FND-001", "MUST", 1, singleSource)],
      content:
        '<NormativeClause id="MWP-FND-001" level="MUST">A runtime MUST NOT normalize.</NormativeClause>\n',
      source: `${singleSource}\n`,
      sourceCounts: { total: 1, mixed: 0 },
    },
    /declared levels differ/u,
  );

  await runCase(
    temporaryRoot,
    "invalid-source-identity",
    {
      clauses: [
        {
          id: "MWP-FND-001",
          page: "reference/specification/foundations",
          level: "MUST",
        },
        entry("MWP-FND-002", "MUST", 3, singleSource),
      ],
      content: `<NormativeClause id="MWP-FND-001" level="MUST">Implementations MUST preserve the value.</NormativeClause>
<NormativeClause id="MWP-FND-002" level="MUST">Implementations MUST preserve the value.</NormativeClause>
`,
      source: `${singleSource}\n\n${singleSource}\n`,
      sourceCounts: { total: 2, mixed: 0 },
    },
    /MWP-FND-001 has invalid source paragraph identity/u,
  );

  await runCase(
    temporaryRoot,
    "non-contiguous-ordinal",
    {
      clauses: [
        entry("MWP-FND-001", "MUST", 1, singleSource),
        entry("MWP-FND-003", "MUST", 3, singleSource),
      ],
      content: `<NormativeClause id="MWP-FND-001" level="MUST">Implementations MUST preserve the value.</NormativeClause>
<NormativeClause id="MWP-FND-003" level="MUST">Implementations MUST preserve the value.</NormativeClause>
`,
      source: `${singleSource}\n\n${singleSource}\n`,
      sourceCounts: { total: 2, mixed: 0 },
    },
    /MWP-FND-003 ordinal is not contiguous/u,
  );

  await runCase(
    temporaryRoot,
    "stable-reordered-ordinals",
    {
      clauses: [
        entry("MWP-FND-002", "MUST", 1, singleSource),
        entry("MWP-FND-001", "MUST", 3, singleSource),
      ],
      content: `<NormativeClause id="MWP-FND-002" level="MUST">Implementations MUST preserve the value.</NormativeClause>
<NormativeClause id="MWP-FND-001" level="MUST">Implementations MUST preserve the value.</NormativeClause>
`,
      source: `${singleSource}\n\n${singleSource}\n`,
      sourceCounts: { total: 2, mixed: 0 },
    },
    "pass",
  );

  const wrappedKeywordSource =
    "A runtime MAY inspect the value but MUST\nNOT normalize it.";
  await runCase(
    temporaryRoot,
    "wrapped-keyword",
    {
      clauses: [
        entry("MWP-FND-001", ["MAY", "MUST NOT"], 1, wrappedKeywordSource, 2),
      ],
      content:
        '<NormativeClause id="MWP-FND-001" level={["MAY", "MUST NOT"]}>A runtime MAY inspect the value but MUST NOT normalize it.</NormativeClause>\n',
      source: `${wrappedKeywordSource}\n`,
      sourceCounts: { total: 1, mixed: 1 },
    },
    "pass",
  );

  console.log(
    "Normative clause checker fixture tests passed three valid and seven rejecting cases.",
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
