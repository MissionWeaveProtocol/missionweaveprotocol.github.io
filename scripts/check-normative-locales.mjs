import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

function parseRepositoryRoot(arguments_) {
  if (arguments_.length === 0) {
    return fileURLToPath(new URL("../", import.meta.url));
  }
  assert.deepEqual(
    arguments_.slice(0, 1),
    ["--repository-root"],
    "usage: check-normative-locales.mjs [--repository-root /absolute/path]",
  );
  assert.equal(arguments_.length, 2, "--repository-root requires one value");
  assert.equal(
    path.isAbsolute(arguments_[1]),
    true,
    "--repository-root must be absolute",
  );
  return path.resolve(arguments_[1]);
}

const repositoryRoot = parseRepositoryRoot(process.argv.slice(2));
const contentRoot = path.join(repositoryRoot, "src/content/docs");
const englishRoot = path.join(contentRoot, "0.1");
const policyPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/locale-policy.json",
);
const expectedKeywords = [
  "MUST",
  "MUST NOT",
  "REQUIRED",
  "SHALL",
  "SHALL NOT",
  "SHOULD",
  "SHOULD NOT",
  "RECOMMENDED",
  "NOT RECOMMENDED",
  "MAY",
  "OPTIONAL",
];
const expectedProtocolTerms = [
  "Agent",
  "Mission",
  "Group",
  "WorkItem",
  "Command",
  "Event",
  "Registry",
  "Admission Log",
  "First-Admission Record",
];
const failures = [];

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function collectContentFiles(directory, prefix = "") {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectContentFiles(candidate, relativePath)));
    } else if (entry.isFile() && /\.(?:md|mdx)$/u.test(entry.name)) {
      files.push(relativePath);
    }
  }
  return files;
}

function splitDocument(contents) {
  const match = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---\r?\n?/u.exec(
    contents,
  );
  if (!match) return { body: contents, data: {} };
  return {
    body: contents.slice(match[0].length),
    data: yaml.load(match.groups.frontmatter) ?? {},
  };
}

function normalizeBody(body) {
  return body.trim().replace(/\s+/gu, " ");
}

const readerTextProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMdx);
const nonReaderNodeTypes = new Set([
  "code",
  "inlineCode",
  "html",
  "mdxFlowExpression",
  "mdxTextExpression",
  "mdxjsEsm",
]);

function readerFacingText(body) {
  const tree = readerTextProcessor.parse(
    body.replace(/^\s*:::[^\n]*$/gmu, " "),
  );
  const values = [];
  function collect(node) {
    if (nonReaderNodeTypes.has(node.type)) return;
    if (node.type === "text") values.push(node.value);
    for (const child of node.children ?? []) collect(child);
  }
  collect(tree);
  return values.join(" ").replace(/\s+/gu, " ").trim();
}

function copiedEnglishSentence(englishBody, localizedBody) {
  const localizedProse = readerFacingText(localizedBody);
  const sentences = readerFacingText(englishBody).split(/(?<=[.!?])\s+/u);
  return sentences.find((sentence) => {
    const asciiWords = sentence.match(/\b[A-Za-z][A-Za-z'-]*\b/gu) ?? [];
    return (
      sentence.length >= 60 &&
      asciiWords.length >= 8 &&
      localizedProse.includes(sentence)
    );
  });
}

function asciiWords(value) {
  return value.match(/\b[A-Za-z][A-Za-z'-]*\b/gu) ?? [];
}

function copiedEnglishRun(englishBody, localizedBody) {
  const englishText = readerFacingText(englishBody);
  const localizedProse = readerFacingText(localizedBody);
  const englishWords = asciiWords(englishText).map((word) =>
    word.toLowerCase(),
  );
  const englishSequence = ` ${englishWords.join(" ")} `;
  const candidateRuns = localizedProse.match(
    /\b[A-Za-z][A-Za-z'-]*(?:[\s,;:]+[A-Za-z][A-Za-z'-]*){3,}/gu,
  );
  for (const candidate of candidateRuns ?? []) {
    const words = asciiWords(candidate);
    for (let index = 0; index <= words.length - 4; index += 1) {
      const window = words.slice(index, index + 4);
      const lowercaseWordCount = window.filter(
        (word) => word === word.toLowerCase(),
      ).length;
      if (lowercaseWordCount < 2) continue;
      const normalized = window.map((word) => word.toLowerCase()).join(" ");
      if (englishSequence.includes(` ${normalized} `)) return window.join(" ");
    }
  }
  for (const connector of ["while"]) {
    const pattern = new RegExp(`\\b${connector}\\b`, "u");
    if (pattern.test(localizedProse) && pattern.test(englishText)) {
      return connector;
    }
  }
  return undefined;
}

function readAttribute(attributes, name) {
  const scalar = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(["'])(?<value>[^"']+)\\1`,
    "u",
  ).exec(attributes)?.groups?.value;
  if (scalar !== undefined) return scalar;
  const array = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*\\{(?<value>\\[[\\s\\S]*?\\])\\}`,
    "u",
  ).exec(attributes)?.groups?.value;
  if (array === undefined) return undefined;
  try {
    return JSON.parse(array);
  } catch {
    return undefined;
  }
}

function clauseSequence(body) {
  return [...body.matchAll(/<NormativeClause\b(?<attributes>[^>]*)>/gu)].map(
    (match) => ({
      id: readAttribute(match.groups.attributes, "id"),
      level: readAttribute(match.groups.attributes, "level"),
    }),
  );
}

function headingDepthSequence(body) {
  return [...body.matchAll(/^(#{1,6})\s+.+$/gmu)].map(
    (match) => match[1].length,
  );
}

function importSequence(body, documentPath) {
  return body
    .split("\n")
    .filter((line) => /^\s*import\s/u.test(line))
    .map((line) => line.trim().replace(/\s+/gu, " "))
    .map((line) => {
      const source = /\bfrom\s+(["'])(?<specifier>[^"']+)\1/u.exec(line)?.groups
        ?.specifier;
      if (source === undefined || !source.startsWith(".")) return line;
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(documentPath), source),
      );
      return line.replace(source, `<resolved:${resolved}>`);
    });
}

function informativeSequence(body) {
  const markers = [];
  for (const match of body.matchAll(
    /<InformativeBlock\b|^\s*:::\w+\[Informative[^\]]*\]/gmu,
  )) {
    markers.push(
      match[0].trim().startsWith("<") ? "InformativeBlock" : "directive",
    );
  }
  return markers;
}

function codeBlockCount(body) {
  let fence;
  let count = 0;
  for (const line of body.split("\n")) {
    const marker = line.trimStart().match(/^(?<fence>`{3,}|~{3,})/u)
      ?.groups?.fence;
    if (!marker) continue;
    if (!fence) {
      fence = marker;
      count += 1;
    } else if (marker[0] === fence[0] && marker.length >= fence.length) {
      fence = undefined;
    }
  }
  return count;
}

function fencedBlocks(body) {
  const blocks = [];
  const lines = body.split("\n");
  let current;
  for (const line of lines) {
    if (!current) {
      const opening = line.match(/^\s*(?<fence>`{3,}|~{3,})(?<info>.*)$/u);
      if (!opening) continue;
      current = {
        fence: opening.groups.fence,
        info: opening.groups.info.trim().split(/\s+/u)[0] ?? "",
        lines: [],
      };
      continue;
    }
    const closing = line.trimStart().match(/^(?<fence>`{3,}|~{3,})\s*$/u)
      ?.groups?.fence;
    if (
      closing &&
      closing[0] === current.fence[0] &&
      closing.length >= current.fence.length
    ) {
      blocks.push({
        info: current.info,
        body: current.lines.join("\n").trim(),
      });
      current = undefined;
      continue;
    }
    current.lines.push(line);
  }
  return blocks;
}

function isMachineIdentifierCatalog(block) {
  const tokens = block
    .replace(/[│┃┌┐└┘├┤┬┴┼─━┏┓┗┛┣┫┳┻╋]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every((token) =>
      /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/u.test(token),
    )
  );
}

function untranslatedReaderFacingTextBlock(englishBody, localizedBody) {
  const englishBlocks = fencedBlocks(englishBody);
  const localizedBlocks = fencedBlocks(localizedBody);
  for (
    let index = 0;
    index < Math.min(englishBlocks.length, localizedBlocks.length);
    index += 1
  ) {
    const english = englishBlocks[index];
    const localized = localizedBlocks[index];
    if (!new Set(["text", "mermaid"]).has(english.info)) continue;
    if (english.body !== localized.body) continue;
    if (isMachineIdentifierCatalog(english.body)) continue;
    return { index, body: english.body };
  }
  return undefined;
}

function orderedListMarkerSequence(body) {
  const withoutFences = body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/gu, " ");
  return [...withoutFences.matchAll(/^\s*(\d+)[.)]\s+/gmu)].map((match) =>
    Number.parseInt(match[1], 10),
  );
}

function clauseBody(body, clauseId) {
  for (const match of body.matchAll(
    /<NormativeClause\b(?<attributes>[^>]*)>/gu,
  )) {
    if (readAttribute(match.groups.attributes, "id") !== clauseId) continue;
    const start = match.index + match[0].length;
    const end = body.indexOf("</NormativeClause>", start);
    return end < 0 ? body.slice(start) : body.slice(start, end);
  }
  return "";
}

function sixStageMarkerSequence(body) {
  return orderedListMarkerSequence(clauseBody(body, "MWP-SDV-015"));
}

function readerListTableStructure(body) {
  const tree = readerTextProcessor.parse(
    body.replace(/^\s*:::[^\n]*$/gmu, " "),
  );
  const structure = [];
  function collect(node) {
    if (node.type === "list") {
      structure.push({
        type: "list",
        ordered: node.ordered,
        start: node.ordered ? (node.start ?? 1) : undefined,
        items: node.children.length,
      });
    }
    if (node.type === "table") {
      structure.push({
        type: "table",
        align: node.align,
        cells: node.children.map((row) => row.children.length),
      });
    }
    for (const child of node.children ?? []) collect(child);
  }
  collect(tree);
  return structure;
}

function isLocalTarget(target) {
  return (
    !/^[a-z][a-z0-9+.-]*:/iu.test(target) &&
    !target.startsWith("#") &&
    !target.startsWith("//")
  );
}

function localLinkSequence(body) {
  const links = [];
  const tree = readerTextProcessor.parse(
    body.replace(/^\s*:::[^\n]*$/gmu, " "),
  );
  function append(target) {
    if (typeof target === "string" && isLocalTarget(target)) {
      links.push(target);
    }
  }
  function collect(node) {
    if (node.type === "image") append(node.url);
    if (node.type === "link") {
      for (const child of node.children ?? []) collect(child);
      append(node.url);
      return;
    }
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      for (const attribute of node.attributes ?? []) {
        if (
          attribute.type === "mdxJsxAttribute" &&
          new Set(["href", "src"]).has(attribute.name)
        ) {
          append(attribute.value);
        }
      }
    }
    if (node.type === "html") {
      for (const match of node.value.matchAll(
        /\b(?:href|src)\s*=\s*(["'])(?<target>[^"']+)\1/gu,
      )) {
        append(match.groups.target);
      }
    }
    for (const child of node.children ?? []) collect(child);
  }
  collect(tree);
  return links;
}

function normativeKeywordSequence(body, keywords) {
  const alternatives = [...keywords]
    .sort((left, right) => right.length - left.length)
    .map((keyword) => keyword.replaceAll(" ", "\\s+"));
  const pattern = new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gu");
  return [...body.matchAll(pattern)].map((match) =>
    match[0].replace(/\s+/gu, " "),
  );
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

let policy;
try {
  policy = JSON.parse(await readFile(policyPath, "utf8"));
} catch (error) {
  if (error?.code === "ENOENT") {
    assert.fail(`missing locale policy: ${policyPath}`);
  }
  throw error;
}
assert.equal(policy.schemaVersion, 1, "locale policy schemaVersion must be 1");
assert.equal(
  policy.sourceLocale,
  "en",
  "locale policy sourceLocale must be en",
);
assert.deepEqual(
  policy.normativeKeywords,
  expectedKeywords,
  "locale policy normativeKeywords differ from the BCP 14 policy",
);
assert.deepEqual(
  policy.protocolTerms,
  expectedProtocolTerms,
  "locale policy protocolTerms differ from the canonical wire terms",
);
assert.equal(policy.locales.length, 6, "locale policy must define six locales");
const localeDirectories = policy.locales.map((locale) => locale.directory);
assert.deepEqual(
  localeDirectories,
  ["zh-cn", "zh-tw", "ja", "es", "fr", "de"],
  "locale policy directories differ from the normative locale order",
);

const englishFiles = await collectContentFiles(englishRoot);
for (const relativePath of englishFiles) {
  const englishFile = path.join(englishRoot, relativePath);
  const english = splitDocument(await readFile(englishFile, "utf8"));
  const expected = {
    clauses: clauseSequence(english.body),
    codeBlocks: codeBlockCount(english.body),
    headings: headingDepthSequence(english.body),
    imports: importSequence(english.body, `0.1/${relativePath}`),
    informative: informativeSequence(english.body),
    keywords: normativeKeywordSequence(english.body, policy.normativeKeywords),
    links: localLinkSequence(english.body),
    readerStructure: readerListTableStructure(english.body),
    sixStageMarkers: sixStageMarkerSequence(english.body),
  };

  for (const locale of policy.locales) {
    const localizedRelativePath = `${locale.directory}/0.1/${relativePath}`;
    const localizedFile = path.join(contentRoot, localizedRelativePath);
    if (!(await exists(localizedFile))) {
      failures.push(`${localizedRelativePath}: missing translation source`);
      continue;
    }
    const localized = splitDocument(await readFile(localizedFile, "utf8"));
    if (normalizeBody(localized.body) === normalizeBody(english.body)) {
      failures.push(`${localizedRelativePath}: body is identical to English`);
    }
    const copiedSentence = copiedEnglishSentence(english.body, localized.body);
    if (copiedSentence !== undefined) {
      failures.push(
        `${localizedRelativePath}: contains untranslated English prose: ${JSON.stringify(copiedSentence.slice(0, 120))}`,
      );
    }
    const copiedRun = copiedEnglishRun(english.body, localized.body);
    if (copiedRun !== undefined) {
      failures.push(
        `${localizedRelativePath}: contains untranslated English run: ${JSON.stringify(copiedRun)}`,
      );
    }
    const untranslatedTextBlock = untranslatedReaderFacingTextBlock(
      english.body,
      localized.body,
    );
    if (untranslatedTextBlock !== undefined) {
      failures.push(
        `${localizedRelativePath}: untranslated reader-facing text block ${untranslatedTextBlock.index + 1}: ${JSON.stringify(untranslatedTextBlock.body.slice(0, 120))}`,
      );
    }
    for (const field of [
      "normativeVersion",
      "normativeStatus",
      "clausePrefix",
    ]) {
      if (localized.data[field] !== english.data[field]) {
        failures.push(`${localizedRelativePath}: frontmatter ${field} differs`);
      }
    }
    const actual = {
      clauses: clauseSequence(localized.body),
      codeBlocks: codeBlockCount(localized.body),
      headings: headingDepthSequence(localized.body),
      imports: importSequence(localized.body, localizedRelativePath),
      informative: informativeSequence(localized.body),
      keywords: normativeKeywordSequence(
        localized.body,
        policy.normativeKeywords,
      ),
      links: localLinkSequence(localized.body),
      readerStructure: readerListTableStructure(localized.body),
      sixStageMarkers: sixStageMarkerSequence(localized.body),
    };
    const comparisons = [
      ["clauses", "NormativeClause sequence differs"],
      ["headings", "heading-depth sequence differs"],
      ["imports", "import sequence differs"],
      ["informative", "informative-block sequence differs"],
      ["keywords", "BCP 14 keyword sequence differs"],
      ["links", "local-link sequence differs"],
      ["readerStructure", "reader list/table structure differs"],
      ["sixStageMarkers", "ordered-list marker sequence differs"],
    ];
    for (const [field, message] of comparisons) {
      if (!same(actual[field], expected[field])) {
        failures.push(`${localizedRelativePath}: ${message}`);
      }
    }
    if (actual.codeBlocks !== expected.codeBlocks) {
      failures.push(
        `${localizedRelativePath}: code-block count differs (${actual.codeBlocks} != ${expected.codeBlocks})`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Normative locale parity violations:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Normative locale parity passed ${englishFiles.length} versioned paths across ${policy.locales.length} localized authorities.`,
);
