import { createHash } from "node:crypto";

import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sourceLayout(source) {
  if (source.length === 0) {
    return { lineCount: 0, lineStarts: [] };
  }
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") lineStarts.push(index + 1);
  }
  const lineCount =
    source.endsWith("\n") && lineStarts.at(-1) === source.length
      ? lineStarts.length - 1
      : lineStarts.length;
  return { lineCount, lineStarts };
}

function normalizedEndLine(endLine, lineCount) {
  return endLine === Number.POSITIVE_INFINITY ? lineCount : endLine;
}

function lineRangeOffsets(source, startLine, endLine) {
  const { lineCount, lineStarts } = sourceLayout(source);
  const normalizedEnd = normalizedEndLine(endLine, lineCount);
  if (
    !Number.isInteger(startLine) ||
    !Number.isInteger(normalizedEnd) ||
    startLine < 1 ||
    normalizedEnd < startLine ||
    normalizedEnd > lineCount
  ) {
    throw new Error(
      `invalid source line range ${startLine}-${String(endLine)} for ${lineCount} lines`,
    );
  }
  return {
    startOffset: lineStarts[startLine - 1],
    endOffset:
      normalizedEnd === lineCount ? source.length : lineStarts[normalizedEnd],
    endLine: normalizedEnd,
  };
}

function sourceSegment(source, startLine, endLine) {
  const offsets = lineRangeOffsets(source, startLine, endLine);
  return source.slice(offsets.startOffset, offsets.endOffset);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function unique(values) {
  return [...new Set(values)];
}

function normativeKeywordPattern(normativeLevels) {
  const alternatives = [...normativeLevels]
    .sort((left, right) => right.length - left.length)
    .map((level) => level.split(/\s+/u).map(escapeRegExp).join("\\s+"));
  return new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gu");
}

function visibleMarkdownText(node) {
  if (node.type === "inlineCode" || node.type === "code") return "";
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(visibleMarkdownText).join(" ");
}

function levelsInNode(node, keywordPattern) {
  return unique(
    [...visibleMarkdownText(node).matchAll(keywordPattern)].map((match) =>
      match[0].replace(/\s+/gu, " "),
    ),
  );
}

function pageMatchesForRange(pages, startLine, endLine, sourceLineCount) {
  return pages.filter((page) =>
    page.sourceSegments.some(([segmentStart, segmentEnd]) => {
      const normalizedEnd = normalizedEndLine(segmentEnd, sourceLineCount);
      return startLine >= segmentStart && endLine <= normalizedEnd;
    }),
  );
}

export function validateSourceCoverage(source, pages) {
  const { lineCount } = sourceLayout(source);
  const lineOwners = Array.from({ length: lineCount + 1 }, () => []);

  for (const page of pages) {
    if (
      typeof page.page !== "string" ||
      page.page.length === 0 ||
      typeof page.prefix !== "string" ||
      page.prefix.length === 0 ||
      !Array.isArray(page.sourceSegments) ||
      page.sourceSegments.length === 0
    ) {
      throw new Error("invalid specification page definition");
    }
    for (const [startLine, configuredEndLine] of page.sourceSegments) {
      const endLine = normalizedEndLine(configuredEndLine, lineCount);
      lineRangeOffsets(source, startLine, endLine);
      for (let line = startLine; line <= endLine; line += 1) {
        lineOwners[line].push(page.page);
        if (lineOwners[line].length > 1) {
          throw new Error(`source line ${line} is mapped more than once`);
        }
      }
    }
  }

  const sourceLines = source.split("\n");
  const uncoveredNonBlankLines = [];
  const unmappedBlankLines = [];
  for (let line = 1; line <= lineCount; line += 1) {
    if (lineOwners[line].length > 0) continue;
    if ((sourceLines[line - 1] ?? "").trim().length === 0) {
      unmappedBlankLines.push(line);
    } else {
      uncoveredNonBlankLines.push(line);
    }
  }
  if (uncoveredNonBlankLines.length > 0) {
    throw new Error(
      `uncovered non-blank source lines: ${uncoveredNonBlankLines.join(", ")}`,
    );
  }
  return { lineCount, unmappedBlankLines };
}

export function collectNormativeSourceParagraphs({
  source,
  pages,
  normativeLevels,
}) {
  const { lineCount } = sourceLayout(source);
  const keywordPattern = normativeKeywordPattern(normativeLevels);
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const paragraphs = [];

  function visit(node, parent) {
    if (node.type === "paragraph") {
      const levels = levelsInNode(node, keywordPattern);
      if (levels.length > 0) {
        const startLine = node.position.start.line;
        const endLine = node.position.end.line;
        const pageMatches = pageMatchesForRange(
          pages,
          startLine,
          endLine,
          lineCount,
        );
        if (pageMatches.length !== 1) {
          throw new Error(
            `source paragraph ${startLine}-${endLine} maps to ${pageMatches.length} specification pages`,
          );
        }
        const sourceText = source.slice(
          node.position.start.offset,
          node.position.end.offset,
        );
        paragraphs.push({
          node,
          parent,
          page: pageMatches[0],
          startLine,
          endLine,
          startOffset: node.position.start.offset,
          endOffset: node.position.end.offset,
          levels,
          sourceText,
          sha256: sha256(sourceText),
        });
      }
    }
    for (const child of node.children ?? []) visit(child, node);
  }

  visit(tree, undefined);
  return { tree, paragraphs };
}

function manifestLevel(levels) {
  return levels.length === 1 ? levels[0] : levels;
}

function normalizedManifestLevel(level) {
  return typeof level === "string" ? [level] : level;
}

function pageManifestEntries(source, pages, clauses) {
  return pages.map((page) => {
    const pageClauses = clauses.filter((clause) => clause.page === page.page);
    return {
      page: page.page,
      prefix: page.prefix,
      title: page.title,
      sectionMappings: page.sectionMappings,
      sourceSegments: page.sourceSegments.map(
        ([startLine, configuredEndLine]) => {
          const { endLine } = lineRangeOffsets(
            source,
            startLine,
            configuredEndLine,
          );
          const segmentClauses = pageClauses.filter(
            (clause) =>
              clause.source?.startLine >= startLine &&
              clause.source?.endLine <= endLine,
          );
          return {
            startLine,
            endLine,
            sha256: sha256(sourceSegment(source, startLine, endLine)),
            clauseIds: segmentClauses.map((clause) => clause.id),
            firstClauseId: segmentClauses.at(0)?.id ?? null,
            lastClauseId: segmentClauses.at(-1)?.id ?? null,
            clauseCount: segmentClauses.length,
          };
        },
      ),
      firstClauseId: pageClauses.at(0)?.id ?? null,
      lastClauseId: pageClauses.at(-1)?.id ?? null,
      clauseCount: pageClauses.length,
    };
  });
}

export function refreshClauseManifest({
  source,
  manifest,
  pages,
  normativeLevels,
  clauseAssignments = {},
}) {
  const coverage = validateSourceCoverage(source, pages);
  const { paragraphs } = collectNormativeSourceParagraphs({
    source,
    pages,
    normativeLevels,
  });
  const paragraphsByRange = new Map(
    paragraphs.map((paragraph) => [
      `${paragraph.startLine}-${paragraph.endLine}`,
      paragraph,
    ]),
  );
  const previousClauses = manifest.clauses ?? [];
  const clausesById = new Map(
    previousClauses.map((clause) => [clause.id, clause]),
  );
  if (clausesById.size !== previousClauses.length) {
    throw new Error("clause manifest contains duplicate stable IDs");
  }
  const unmatchedParagraphs = new Set(paragraphs);
  const matchedClauses = [];
  const matchedClauseIds = new Set();

  function matchClause(clause, paragraph) {
    if (matchedClauseIds.has(clause.id)) {
      throw new Error(`${clause.id} is assigned more than once`);
    }
    if (!unmatchedParagraphs.has(paragraph)) {
      throw new Error(
        `source paragraph ${paragraph.startLine}-${paragraph.endLine} is assigned more than once`,
      );
    }
    matchedClauseIds.add(clause.id);
    unmatchedParagraphs.delete(paragraph);
    matchedClauses.push({
      paragraph,
      clause: {
        ...clause,
        page: paragraph.page.page,
        level: manifestLevel(paragraph.levels),
        source: {
          startLine: paragraph.startLine,
          endLine: paragraph.endLine,
          sha256: paragraph.sha256,
        },
      },
    });
  }

  for (const [clauseId, range] of Object.entries(clauseAssignments)) {
    const clause = clausesById.get(clauseId);
    if (!clause) {
      throw new Error(
        `explicit assignment references unknown clause ${clauseId}`,
      );
    }
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      !Number.isInteger(range[0]) ||
      !Number.isInteger(range[1])
    ) {
      throw new Error(`${clauseId} has an invalid explicit source assignment`);
    }
    const paragraph = paragraphsByRange.get(`${range[0]}-${range[1]}`);
    if (!paragraph) {
      throw new Error(
        `${clauseId} explicit assignment does not select one BCP 14 paragraph`,
      );
    }
    matchClause(clause, paragraph);
  }

  for (const clause of previousClauses) {
    if (matchedClauseIds.has(clause.id)) continue;
    const candidates = [...unmatchedParagraphs].filter(
      (paragraph) => paragraph.sha256 === clause.source?.sha256,
    );
    if (candidates.length === 0) {
      throw new Error(
        `${clause.id} has no source paragraph identity match; add an explicit assignment`,
      );
    }
    if (candidates.length === 1) {
      matchClause(clause, candidates[0]);
      continue;
    }
    const priorRange = `${clause.source?.startLine}-${clause.source?.endLine}`;
    const sameRange = candidates.filter(
      (paragraph) =>
        `${paragraph.startLine}-${paragraph.endLine}` === priorRange,
    );
    if (sameRange.length !== 1) {
      throw new Error(
        `${clause.id} matches multiple source paragraphs; add an explicit assignment`,
      );
    }
    matchClause(clause, sameRange[0]);
  }

  const nextOrdinals = new Map();
  for (const clause of previousClauses) {
    const prefix = clause.id?.slice(0, -4);
    const ordinal = Number.parseInt(clause.id?.slice(-3), 10);
    if (!prefix || !Number.isInteger(ordinal)) {
      throw new Error(`invalid stable clause ID ${String(clause.id)}`);
    }
    nextOrdinals.set(prefix, Math.max(nextOrdinals.get(prefix) ?? 0, ordinal));
  }
  for (const paragraph of unmatchedParagraphs) {
    const prefix = paragraph.page.prefix;
    const nextOrdinal = (nextOrdinals.get(prefix) ?? 0) + 1;
    if (nextOrdinal > 999) {
      throw new Error(`${prefix} has exhausted three-digit clause ordinals`);
    }
    nextOrdinals.set(prefix, nextOrdinal);
    const id = `${prefix}-${String(nextOrdinal).padStart(3, "0")}`;
    matchedClauses.push({
      paragraph,
      clause: {
        id,
        page: paragraph.page.page,
        level: manifestLevel(paragraph.levels),
        source: {
          startLine: paragraph.startLine,
          endLine: paragraph.endLine,
          sha256: paragraph.sha256,
        },
      },
    });
  }
  matchedClauses.sort(
    (left, right) =>
      left.paragraph.startLine - right.paragraph.startLine ||
      left.paragraph.endLine - right.paragraph.endLine,
  );
  const clauses = matchedClauses.map(({ clause }) => clause);
  return {
    ...manifest,
    source: {
      ...manifest.source,
      sha256: sha256(source),
      lines: coverage.lineCount,
      bcp14Paragraphs: paragraphs.length,
      mixedLevelParagraphs: paragraphs.filter(
        (paragraph) => paragraph.levels.length > 1,
      ).length,
      unmappedBlankLines: coverage.unmappedBlankLines,
    },
    pages: pageManifestEntries(source, pages, clauses),
    clauses,
  };
}

export function buildInitialClauseManifest({
  source,
  sourcePath,
  sourceRepository,
  sourceCommit,
  protocolVersion,
  prefixes,
  pages,
  normativeLevels,
}) {
  const coverage = validateSourceCoverage(source, pages);
  const { paragraphs } = collectNormativeSourceParagraphs({
    source,
    pages,
    normativeLevels,
  });
  const ordinals = new Map();
  const clauses = paragraphs.map((paragraph) => {
    const nextOrdinal = (ordinals.get(paragraph.page.prefix) ?? 0) + 1;
    ordinals.set(paragraph.page.prefix, nextOrdinal);
    return {
      id: `${paragraph.page.prefix}-${String(nextOrdinal).padStart(3, "0")}`,
      page: paragraph.page.page,
      level: manifestLevel(paragraph.levels),
      source: {
        startLine: paragraph.startLine,
        endLine: paragraph.endLine,
        sha256: paragraph.sha256,
      },
    };
  });

  return {
    schemaVersion: 1,
    protocolVersion,
    source: {
      repository: sourceRepository,
      commit: sourceCommit,
      path: sourcePath,
      sha256: sha256(source),
      lines: coverage.lineCount,
      bcp14Paragraphs: paragraphs.length,
      mixedLevelParagraphs: paragraphs.filter(
        (paragraph) => paragraph.levels.length > 1,
      ).length,
      unmappedBlankLines: coverage.unmappedBlankLines,
    },
    prefixes,
    pages: pageManifestEntries(source, pages, clauses),
    clauses,
  };
}

export function validateManifestSource({
  source,
  manifest,
  pages,
  normativeLevels,
}) {
  const coverage = validateSourceCoverage(source, pages);
  const { tree, paragraphs } = collectNormativeSourceParagraphs({
    source,
    pages,
    normativeLevels,
  });
  const expectedSource = {
    sha256: sha256(source),
    lines: coverage.lineCount,
    bcp14Paragraphs: paragraphs.length,
    mixedLevelParagraphs: paragraphs.filter(
      (paragraph) => paragraph.levels.length > 1,
    ).length,
    unmappedBlankLines: coverage.unmappedBlankLines,
  };
  for (const [field, expected] of Object.entries(expectedSource)) {
    if (JSON.stringify(manifest.source?.[field]) !== JSON.stringify(expected)) {
      throw new Error(
        `clause manifest source ${field} differs from pinned source`,
      );
    }
  }

  const expectedPages = pageManifestEntries(
    source,
    pages,
    manifest.clauses ?? [],
  );
  if (JSON.stringify(manifest.pages) !== JSON.stringify(expectedPages)) {
    throw new Error("clause manifest pages differ from pinned source mapping");
  }

  const paragraphsByRange = new Map(
    paragraphs.map((paragraph) => [
      `${paragraph.startLine}-${paragraph.endLine}`,
      paragraph,
    ]),
  );
  const mappedRanges = new Set();
  const clausesByRange = new Map();
  for (const clause of manifest.clauses ?? []) {
    const key = `${clause.source?.startLine}-${clause.source?.endLine}`;
    if (mappedRanges.has(key)) {
      throw new Error(`duplicate clause source range ${key}`);
    }
    mappedRanges.add(key);
    const paragraph = paragraphsByRange.get(key);
    if (!paragraph) {
      throw new Error(`${clause.id} does not map to one source paragraph`);
    }
    if (
      clause.page !== paragraph.page.page ||
      clause.source.sha256 !== paragraph.sha256 ||
      JSON.stringify(normalizedManifestLevel(clause.level)) !==
        JSON.stringify(paragraph.levels)
    ) {
      throw new Error(`${clause.id} differs from its pinned source paragraph`);
    }
    clausesByRange.set(key, clause);
  }
  for (const paragraph of paragraphs) {
    const key = `${paragraph.startLine}-${paragraph.endLine}`;
    if (!mappedRanges.has(key)) {
      throw new Error(`source paragraph ${key} has no stable clause ID`);
    }
  }
  return { tree, paragraphs, clausesByRange };
}

function nodeContainsNormativeParagraph(node, keywordPattern) {
  if (node.type === "paragraph" && levelsInNode(node, keywordPattern).length) {
    return true;
  }
  return (node.children ?? []).some((child) =>
    nodeContainsNormativeParagraph(child, keywordPattern),
  );
}

function wrapperRange(paragraph, keywordPattern) {
  if (paragraph.parent?.type === "listItem") {
    return {
      startOffset: paragraph.parent.position.start.offset,
      endOffset: paragraph.parent.position.end.offset,
      isolateFromList: true,
    };
  }
  let endOffset = paragraph.endOffset;
  if (
    paragraph.parent?.type === "root" &&
    paragraph.sourceText.trimEnd().endsWith(":")
  ) {
    const index = paragraph.parent.children.indexOf(paragraph.node);
    const next = paragraph.parent.children[index + 1];
    if (
      next &&
      ["list", "table"].includes(next.type) &&
      !nodeContainsNormativeParagraph(next, keywordPattern)
    ) {
      endOffset = next.position.end.offset;
    }
  }
  return {
    startOffset: paragraph.startOffset,
    endOffset,
    isolateFromList: false,
  };
}

function replacementEdit(source, replacement) {
  const { startOffset, endOffset } = lineRangeOffsets(
    source,
    replacement.line,
    replacement.line,
  );
  const line = source.slice(startOffset, endOffset);
  const first = line.indexOf(replacement.from);
  const second = first < 0 ? -1 : line.indexOf(replacement.from, first + 1);
  if (first < 0 || second >= 0) {
    throw new Error(
      `source line ${replacement.line} must contain exactly one ${JSON.stringify(replacement.from)}`,
    );
  }
  return {
    startOffset: startOffset + first,
    endOffset: startOffset + first + replacement.from.length,
    value: replacement.to,
    order: 20,
  };
}

function injectionEdit(source, injection) {
  const { startOffset } = lineRangeOffsets(
    source,
    injection.line,
    injection.line,
  );
  return {
    startOffset,
    endOffset: startOffset,
    value: injection.value,
    order: 10,
  };
}

function applySegmentEdits(source, segmentStart, segmentEnd, page, edits) {
  let result = source.slice(segmentStart, segmentEnd);
  const relevant = edits
    .filter(
      (edit) =>
        (edit.page === undefined || edit.page === page) &&
        edit.startOffset >= segmentStart &&
        edit.endOffset <= segmentEnd,
    )
    .sort(
      (left, right) =>
        right.startOffset - left.startOffset ||
        right.endOffset - left.endOffset ||
        right.order - left.order,
    );
  for (const edit of relevant) {
    const start = edit.startOffset - segmentStart;
    const end = edit.endOffset - segmentStart;
    result = `${result.slice(0, start)}${edit.value}${result.slice(end)}`;
  }
  return result;
}

function pageFrontmatter(page) {
  return `---\ntitle: ${JSON.stringify(page.title)}\ndescription: ${JSON.stringify(page.description)}\n---\n\n`;
}

function clauseRangeLabel(pageManifest, sourceSegment) {
  const slug = pageManifest.page.split("/").at(-1);
  const clauseIds = sourceSegment.clauseIds ?? [];
  if (clauseIds.length === 0) return "No BCP 14 clauses";
  const clauseLink = (id) => `[${id}](./${slug}/#${id.toLowerCase()})`;
  if (clauseIds.length === 1) return clauseLink(clauseIds[0]);
  const ordinals = clauseIds.map((id) => Number.parseInt(id.slice(-3), 10));
  const isContiguousAscending = ordinals.every(
    (ordinal, index) => index === 0 || ordinal === ordinals[index - 1] + 1,
  );
  if (isContiguousAscending) {
    return `${clauseLink(clauseIds[0])}–${clauseLink(clauseIds.at(-1))}`;
  }
  return clauseIds.map(clauseLink).join(", ");
}

function renderIndex({ manifest, releaseStatus, releaseVersion }) {
  const mappedSegments = [];
  for (const page of manifest.pages) {
    page.sourceSegments.forEach((segment, index) => {
      mappedSegments.push({ page, segment, index });
    });
  }
  mappedSegments.sort(
    (left, right) => left.segment.startLine - right.segment.startLine,
  );
  const rows = mappedSegments.map(({ page, segment, index }) => {
    const slug = page.page.split("/").at(-1);
    return `| ${page.sectionMappings[index] ?? page.sectionMappings.join(", ")} | [${page.title}](./${slug}/) | ${segment.startLine}–${segment.endLine} | ${clauseRangeLabel(page, segment)} |`;
  });
  return `---
title: "MissionWeaveProtocol 0.1 specification"
description: "The complete local normative specification and pinned source map for MissionWeaveProtocol 0.1."
---

import NormativeReleaseFacts from "../../../../../components/NormativeReleaseFacts.astro";

# MissionWeaveProtocol 0.1 specification

This website publishes **${releaseStatus} ${releaseVersion}** as one unified normative release. The versioned prose, schemas, conformance artifacts, protocol pin, and six SDK pins are released together.

The interpretation of capitalized requirement terms is defined by [MWP-FND-001](./foundations/#mwp-fnd-001) under BCP 14. Clause identifiers remain stable references within this release.

<NormativeReleaseFacts />

## Pinned source map

The table maps every pinned protocol source segment to its local normative page. Blank source lines intentionally left between segments are recorded in the clause manifest.

| Original source section | Local normative page | Pinned source lines | Clause range |
| --- | --- | ---: | --- |
${rows.join("\n")}
`;
}

export function renderSpecification({
  source,
  manifest,
  pages,
  normativeLevels,
  explicitExclusionsByClauseId = {},
  releaseStatus,
  releaseVersion,
  replacements = [],
  injections = [],
}) {
  const { paragraphs, clausesByRange } = validateManifestSource({
    source,
    manifest,
    pages,
    normativeLevels,
  });
  const keywordPattern = normativeKeywordPattern(normativeLevels);
  const edits = [
    ...replacements.map((replacement) => replacementEdit(source, replacement)),
    ...injections.map((injection) => injectionEdit(source, injection)),
  ];
  for (const paragraph of paragraphs) {
    const clause = clausesByRange.get(
      `${paragraph.startLine}-${paragraph.endLine}`,
    );
    const range = wrapperRange(paragraph, keywordPattern);
    const level = normalizedManifestLevel(clause.level);
    const levelAttribute =
      level.length === 1
        ? `level=${JSON.stringify(level[0])}`
        : `level={${JSON.stringify(level)}}`;
    const explicitExclusions = explicitExclusionsByClauseId[clause.id] ?? [];
    const exclusionAttribute =
      explicitExclusions.length === 0
        ? ""
        : ` exclusions={${JSON.stringify(explicitExclusions)}}`;
    edits.push({
      page: paragraph.page.page,
      startOffset: range.startOffset,
      endOffset: range.startOffset,
      value: `${range.isolateFromList ? "\n" : ""}<NormativeClause id=${JSON.stringify(clause.id)} ${levelAttribute}${exclusionAttribute}>\n\n`,
      order: 30,
    });
    edits.push({
      page: paragraph.page.page,
      startOffset: range.endOffset,
      endOffset: range.endOffset,
      value: `\n\n</NormativeClause>${range.isolateFromList ? "\n" : ""}`,
      order: 0,
    });
  }

  const files = new Map();
  files.set(
    "reference/specification/index.mdx",
    renderIndex({ manifest, releaseStatus, releaseVersion }),
  );
  for (const page of pages) {
    const renderedSegments = page.sourceSegments.map(
      ([startLine, configuredEndLine]) => {
        const { startOffset, endOffset } = lineRangeOffsets(
          source,
          startLine,
          configuredEndLine,
        );
        return applySegmentEdits(
          source,
          startOffset,
          endOffset,
          page.page,
          edits,
        ).trimEnd();
      },
    );
    const separator = `

<InformativeBlock title="Pinned source continuation">

The next block resumes a later pinned source segment. See the [specification source map](./) for the intervening local page and exact line ranges.

</InformativeBlock>

`;
    const imports = [
      'import NormativeClause from "../../../../../components/NormativeClause.astro";',
    ];
    if (renderedSegments.length > 1) {
      imports.push(
        'import InformativeBlock from "../../../../../components/InformativeBlock.astro";',
      );
    }
    files.set(
      `${page.page}.mdx`,
      `${pageFrontmatter(page)}${imports.join("\n")}\n\n${renderedSegments.join(separator)}\n`,
    );
  }
  return { manifest, files };
}

export function specificationSha256(value) {
  return sha256(value);
}
