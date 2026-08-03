import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { format } from "prettier";

import { sourceReplacements } from "./lib/normative-specification-config.mjs";
import {
  buildInitialClauseManifest,
  refreshClauseManifest,
  renderSpecification,
  validateSourceCoverage,
} from "./lib/normative-specification.mjs";

const normativeLevels = ["MUST", "MUST NOT", "SHOULD", "MAY"];
const sourceLines = [
  "# Sample Protocol",
  "",
  "Status: Draft Standard, version `0.1.0`.",
  "",
  "A runtime MAY inspect the value.",
  "",
  "## Details",
  "",
  "A runtime MUST preserve:",
  "",
  "* the value; and",
  "* the ordering.",
  "",
  "See the [context](../CONTEXT.md).",
  "",
  "## Licensing",
  "",
  "Licensed for use.",
];
const source = `${sourceLines.join("\n")}\n`;
const pages = [
  {
    page: "reference/specification/foundations",
    prefix: "MWP-FND",
    title: "Foundations",
    description: "Sample protocol foundations.",
    sectionMappings: ["Preamble"],
    sourceSegments: [[1, 6]],
  },
  {
    page: "reference/specification/details",
    prefix: "MWP-IDN",
    title: "Details",
    description: "Sample protocol details.",
    sectionMappings: ["Details", "Licensing"],
    sourceSegments: [[7, 18]],
  },
];
const prefixes = {
  "MWP-FND": "foundations",
  "MWP-IDN": "details",
};

assert.doesNotMatch(
  JSON.stringify(sourceReplacements),
  /\]\(\/(?:0\.1|artifacts)\//u,
  "generated local links must not escape a configured Pages base",
);

const wrappedKeywordSource =
  "A runtime MAY inspect the value but MUST\nNOT normalize it.\n";
const wrappedKeywordManifest = buildInitialClauseManifest({
  source: wrappedKeywordSource,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "d".repeat(40),
  protocolVersion: "0.1",
  prefixes: { "MWP-FND": "foundations" },
  pages: [
    {
      page: "reference/specification/foundations",
      prefix: "MWP-FND",
      title: "Foundations",
      description: "Foundations.",
      sectionMappings: ["Foundations"],
      sourceSegments: [[1, 2]],
    },
  ],
  normativeLevels,
});
assert.deepEqual(wrappedKeywordManifest.clauses[0].level, ["MAY", "MUST NOT"]);
const staleWrappedKeywordManifest = structuredClone(wrappedKeywordManifest);
staleWrappedKeywordManifest.clauses[0].level = ["MAY", "MUST"];
assert.deepEqual(
  refreshClauseManifest({
    source: wrappedKeywordSource,
    manifest: staleWrappedKeywordManifest,
    pages: [
      {
        page: "reference/specification/foundations",
        prefix: "MWP-FND",
        title: "Foundations",
        description: "Foundations.",
        sectionMappings: ["Foundations"],
        sourceSegments: [[1, 2]],
      },
    ],
    normativeLevels,
  }).clauses[0].level,
  ["MAY", "MUST NOT"],
);

const coverage = validateSourceCoverage(source, pages);
assert.deepEqual(coverage.unmappedBlankLines, []);
assert.throws(
  () => validateSourceCoverage(source, pages.slice(0, 1)),
  /uncovered non-blank source lines/u,
);
assert.throws(
  () =>
    validateSourceCoverage(source, [
      pages[0],
      { ...pages[1], sourceSegments: [[6, 18]] },
    ]),
  /source line 6 is mapped more than once/u,
);

const manifest = buildInitialClauseManifest({
  source,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "a".repeat(40),
  protocolVersion: "0.1",
  prefixes,
  pages,
  normativeLevels,
});

assert.equal(manifest.source.lines, sourceLines.length);
assert.equal(
  manifest.source.sha256,
  `sha256:${createHash("sha256").update(source).digest("hex")}`,
);
assert.equal(manifest.source.bcp14Paragraphs, 2);
assert.equal(manifest.source.mixedLevelParagraphs, 0);
assert.deepEqual(
  manifest.clauses.map(({ id, page, level, source: identity }) => ({
    id,
    page,
    level,
    startLine: identity.startLine,
    endLine: identity.endLine,
  })),
  [
    {
      id: "MWP-FND-001",
      page: "reference/specification/foundations",
      level: "MAY",
      startLine: 5,
      endLine: 5,
    },
    {
      id: "MWP-IDN-001",
      page: "reference/specification/details",
      level: "MUST",
      startLine: 9,
      endLine: 9,
    },
  ],
);
assert.deepEqual(
  manifest.pages.map(({ page, firstClauseId, lastClauseId, clauseCount }) => ({
    page,
    firstClauseId,
    lastClauseId,
    clauseCount,
  })),
  [
    {
      page: "reference/specification/foundations",
      firstClauseId: "MWP-FND-001",
      lastClauseId: "MWP-FND-001",
      clauseCount: 1,
    },
    {
      page: "reference/specification/details",
      firstClauseId: "MWP-IDN-001",
      lastClauseId: "MWP-IDN-001",
      clauseCount: 1,
    },
  ],
);

const publication = renderSpecification({
  source,
  manifest,
  pages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
  replacements: [
    {
      line: 14,
      from: "../CONTEXT.md",
      to: "/artifacts/0.1/protocol/CONTEXT.md",
    },
  ],
  injections: [
    {
      line: 11,
      value: '<span id="requirements-list"></span>\n\n',
    },
  ],
});

assert.deepEqual(
  [...publication.files.keys()],
  [
    "reference/specification/index.mdx",
    "reference/specification/foundations.mdx",
    "reference/specification/details.mdx",
  ],
);
assert.match(
  publication.files.get("reference/specification/index.mdx"),
  /Draft Standard 0\.1\.0/u,
);
assert.match(
  publication.files.get("reference/specification/index.mdx"),
  /MWP-FND-001/u,
);
assert.match(
  publication.files.get("reference/specification/foundations.mdx"),
  /<NormativeClause id="MWP-FND-001" level="MAY">[\s\S]*A runtime MAY inspect the value\.[\s\S]*<\/NormativeClause>/u,
);
assert.match(
  publication.files.get("reference/specification/details.mdx"),
  /<NormativeClause id="MWP-IDN-001" level="MUST">[\s\S]*A runtime MUST preserve:[\s\S]*requirements-list[\s\S]*\* the ordering\.[\s\S]*<\/NormativeClause>/u,
);
assert.match(
  publication.files.get("reference/specification/details.mdx"),
  /\[context\]\(\/artifacts\/0\.1\/protocol\/CONTEXT\.md\)/u,
);

const repeated = renderSpecification({
  source,
  manifest,
  pages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
  replacements: [
    {
      line: 14,
      from: "../CONTEXT.md",
      to: "/artifacts/0.1/protocol/CONTEXT.md",
    },
  ],
  injections: [
    {
      line: 11,
      value: '<span id="requirements-list"></span>\n\n',
    },
  ],
});
assert.deepEqual(repeated, publication);

const stableIdentityPages = [
  {
    page: "reference/specification/foundations",
    prefix: "MWP-FND",
    title: "Foundations",
    description: "Foundations.",
    sectionMappings: ["Foundations"],
    sourceSegments: [[1, Number.POSITIVE_INFINITY]],
  },
];
const stableIdentitySource =
  "A runtime MUST preserve A.\n\nA runtime SHOULD preserve C.\n";
const stableIdentityManifest = buildInitialClauseManifest({
  source: stableIdentitySource,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "f".repeat(40),
  protocolVersion: "0.1",
  prefixes: { "MWP-FND": "foundations" },
  pages: stableIdentityPages,
  normativeLevels,
});

const reorderedSource =
  "A runtime SHOULD preserve C.\n\nA runtime MUST preserve A.\n";
const reorderedManifest = refreshClauseManifest({
  source: reorderedSource,
  manifest: stableIdentityManifest,
  pages: stableIdentityPages,
  normativeLevels,
});
assert.deepEqual(
  reorderedManifest.clauses.map((clause) => ({
    id: clause.id,
    startLine: clause.source.startLine,
  })),
  [
    { id: "MWP-FND-002", startLine: 1 },
    { id: "MWP-FND-001", startLine: 3 },
  ],
  "reordered requirements must retain their stable IDs",
);
assert.deepEqual(
  reorderedManifest.pages[0].sourceSegments[0].clauseIds,
  ["MWP-FND-002", "MWP-FND-001"],
  "source maps must record the exact reordered clause sequence",
);
const reorderedIndex = renderSpecification({
  source: reorderedSource,
  manifest: reorderedManifest,
  pages: stableIdentityPages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
}).files.get("reference/specification/index.mdx");
assert.match(
  reorderedIndex,
  /MWP-FND-002[^\n]*, \[MWP-FND-001/u,
  "source maps must not render reordered IDs as an ordinal range",
);

const insertedSource =
  "A runtime MUST preserve A.\n\nA runtime MAY inspect B.\n\nA runtime SHOULD preserve C.\n";
const insertedManifest = refreshClauseManifest({
  source: insertedSource,
  manifest: stableIdentityManifest,
  pages: stableIdentityPages,
  normativeLevels,
});
assert.deepEqual(
  insertedManifest.clauses.map((clause) => ({
    id: clause.id,
    startLine: clause.source.startLine,
  })),
  [
    { id: "MWP-FND-001", startLine: 1 },
    { id: "MWP-FND-003", startLine: 3 },
    { id: "MWP-FND-002", startLine: 5 },
  ],
  "inserted requirements must receive a new ordinal without renumbering existing IDs",
);
assert.deepEqual(
  insertedManifest.pages[0].sourceSegments[0].clauseIds,
  ["MWP-FND-001", "MWP-FND-003", "MWP-FND-002"],
  "source maps must record inserted IDs in source order",
);
const insertedIndex = renderSpecification({
  source: insertedSource,
  manifest: insertedManifest,
  pages: stableIdentityPages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
}).files.get("reference/specification/index.mdx");
assert.match(
  insertedIndex,
  /MWP-FND-001[^\n]*, \[MWP-FND-003[^\n]*, \[MWP-FND-002/u,
  "source maps must list inserted IDs that cannot be compressed into a contiguous range",
);

const ambiguousSource =
  "A runtime MAY inspect B.\n\nA runtime MUST preserve A.\n\nA runtime MUST preserve A.\n\nA runtime SHOULD preserve C.\n";
assert.throws(
  () =>
    refreshClauseManifest({
      source: ambiguousSource,
      manifest: stableIdentityManifest,
      pages: stableIdentityPages,
      normativeLevels,
    }),
  /MWP-FND-001 matches multiple source paragraphs/u,
);

const explicitlyReassignedManifest = refreshClauseManifest({
  source: ambiguousSource,
  manifest: stableIdentityManifest,
  pages: stableIdentityPages,
  normativeLevels,
  clauseAssignments: { "MWP-FND-001": [3, 3] },
});
assert.equal(
  explicitlyReassignedManifest.clauses.find(
    (clause) => clause.id === "MWP-FND-001",
  ).source.startLine,
  3,
);

const adjacentSource =
  "A runtime MUST preserve A.\n\nA runtime MUST preserve B.\n";
const adjacentPages = [
  {
    page: "reference/specification/a",
    prefix: "MWP-FND",
    title: "A",
    description: "A.",
    sectionMappings: ["A"],
    sourceSegments: [[1, 2]],
  },
  {
    page: "reference/specification/b",
    prefix: "MWP-IDN",
    title: "B",
    description: "B.",
    sectionMappings: ["B"],
    sourceSegments: [[3, 3]],
  },
];
const adjacentManifest = buildInitialClauseManifest({
  source: adjacentSource,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "b".repeat(40),
  protocolVersion: "0.1",
  prefixes,
  pages: adjacentPages,
  normativeLevels,
});
const adjacentPublication = renderSpecification({
  source: adjacentSource,
  manifest: adjacentManifest,
  pages: adjacentPages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
});
assert.doesNotMatch(
  adjacentPublication.files.get("reference/specification/a.mdx"),
  /MWP-IDN-001/u,
);
assert.doesNotMatch(
  adjacentPublication.files.get("reference/specification/b.mdx"),
  /MWP-FND-001/u,
);

const splitSource =
  "A runtime MUST preserve A1.\n\nA runtime MUST preserve B.\n\nA runtime MUST preserve A2.\n";
const splitPages = [
  {
    page: "reference/specification/a",
    prefix: "MWP-FND",
    title: "A",
    description: "A.",
    sectionMappings: ["A1", "A2"],
    sourceSegments: [
      [1, 2],
      [5, 5],
    ],
  },
  {
    page: "reference/specification/b",
    prefix: "MWP-IDN",
    title: "B",
    description: "B.",
    sectionMappings: ["B"],
    sourceSegments: [[3, 4]],
  },
];
const splitManifest = buildInitialClauseManifest({
  source: splitSource,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "c".repeat(40),
  protocolVersion: "0.1",
  prefixes,
  pages: splitPages,
  normativeLevels,
});
assert.deepEqual(
  splitManifest.pages[0].sourceSegments.map(
    ({ firstClauseId, lastClauseId, clauseCount }) => ({
      firstClauseId,
      lastClauseId,
      clauseCount,
    }),
  ),
  [
    {
      firstClauseId: "MWP-FND-001",
      lastClauseId: "MWP-FND-001",
      clauseCount: 1,
    },
    {
      firstClauseId: "MWP-FND-002",
      lastClauseId: "MWP-FND-002",
      clauseCount: 1,
    },
  ],
);
const splitIndex = renderSpecification({
  source: splitSource,
  manifest: splitManifest,
  pages: splitPages,
  normativeLevels,
  releaseStatus: "Draft Standard",
  releaseVersion: "0.1.0",
}).files.get("reference/specification/index.mdx");
assert.ok(splitIndex.indexOf("| A1 |") < splitIndex.indexOf("| B |"));
assert.ok(splitIndex.indexOf("| B |") < splitIndex.indexOf("| A2 |"));

const listSource =
  "* Context without a requirement.\n* A runtime MUST preserve the value.\n* Closing context.\n";
const listPages = [
  {
    page: "reference/specification/foundations",
    prefix: "MWP-FND",
    title: "Foundations",
    description: "Foundations.",
    sectionMappings: ["Foundations"],
    sourceSegments: [[1, 3]],
  },
];
const listManifest = buildInitialClauseManifest({
  source: listSource,
  sourcePath: "public/artifacts/0.1/protocol/spec/PROTOCOL.md",
  sourceRepository: "https://example.test/protocol",
  sourceCommit: "e".repeat(40),
  protocolVersion: "0.1",
  prefixes: { "MWP-FND": "foundations" },
  pages: listPages,
  normativeLevels,
});
const formattedListPage = await format(
  renderSpecification({
    source: listSource,
    manifest: listManifest,
    pages: listPages,
    normativeLevels,
    releaseStatus: "Draft Standard",
    releaseVersion: "0.1.0",
  }).files.get("reference/specification/foundations.mdx"),
  { parser: "mdx", proseWrap: "always" },
);
assert.doesNotMatch(formattedListPage, /^\s{2}<NormativeClause\b/mu);

console.log(
  "Normative specification sync tests passed coverage, initial IDs, local transforms, page boundaries, split source maps, list isolation, and deterministic rendering.",
);
