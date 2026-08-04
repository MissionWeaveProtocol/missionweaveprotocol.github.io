import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

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

function proseOnly(body) {
  return body
    .replace(/^\s*import\s.+$/gmu, " ")
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/gu, " ")
    .replace(/`[^`]*`/gu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/!?(?:\[(?<label>[^\]]+)\])\([^)]*\)/gu, "$<label>")
    .replace(/[#*_>|~{}[\]()-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function copiedEnglishSentence(englishBody, localizedBody) {
  const localizedProse = proseOnly(localizedBody);
  const sentences = proseOnly(englishBody).split(/(?<=[.!?])\s+/u);
  return sentences.find((sentence) => {
    const asciiWords = sentence.match(/\b[A-Za-z][A-Za-z'-]*\b/gu) ?? [];
    return (
      sentence.length >= 60 &&
      asciiWords.length >= 8 &&
      localizedProse.includes(sentence)
    );
  });
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

function isLocalTarget(target) {
  return (
    !/^[a-z][a-z0-9+.-]*:/iu.test(target) &&
    !target.startsWith("#") &&
    !target.startsWith("//")
  );
}

function localLinkSequence(body) {
  const links = [];
  for (const match of body.matchAll(
    /\]\((?<target>[^)\s]+)(?:\s+"[^"]*")?\)/gu,
  )) {
    if (isLocalTarget(match.groups.target)) links.push(match.groups.target);
  }
  for (const match of body.matchAll(
    /\b(?:href|src)\s*=\s*(["'])(?<target>[^"']+)\1/gu,
  )) {
    if (isLocalTarget(match.groups.target)) links.push(match.groups.target);
  }
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
    };
    const comparisons = [
      ["clauses", "NormativeClause sequence differs"],
      ["headings", "heading-depth sequence differs"],
      ["imports", "import sequence differs"],
      ["informative", "informative-block sequence differs"],
      ["keywords", "BCP 14 keyword sequence differs"],
      ["links", "local-link sequence differs"],
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
