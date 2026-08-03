import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseRepositoryRoot(argv) {
  if (argv.length === 0) {
    return fileURLToPath(new URL("../", import.meta.url));
  }
  if (
    argv.length !== 2 ||
    argv[0] !== "--repository-root" ||
    !path.isAbsolute(argv[1])
  ) {
    throw new Error(
      "usage: check-normative-clauses.mjs [--repository-root /absolute/path]",
    );
  }
  return path.resolve(argv[1]);
}

const repositoryRoot = parseRepositoryRoot(process.argv.slice(2));
const contentRoot = path.join(repositoryRoot, "src/content/docs/0.1");
const manifestPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/clauses.json",
);
const terminologyPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/terminology.json",
);
const requiredComponents = [
  "src/components/NormativeClause.astro",
  "src/components/InformativeBlock.astro",
  "src/components/NormativeReleaseFacts.astro",
];
const expectedPrefixes = {
  "MWP-FND": "foundations",
  "MWP-IDN": "identity, Registry, sessions",
  "MWP-SDV": "Signed Document verification",
  "MWP-ADM": "First Admission and Historical Trust",
  "MWP-MSN": "Missions, Groups, Membership, Conversations, and child Missions",
  "MWP-WRK":
    "WorkItems, scheduling, execution, recovery, Artifacts, and replay",
  "MWP-AUT": "authorization, budgets, and side effects",
  "MWP-EVT": "Commands, Events, and WebSocket binding",
  "MWP-EXT": "extensions, errors, controls, compatibility, and conformance",
};
const terminology = JSON.parse(await readFile(terminologyPath, "utf8"));
const normativeLevels = terminology.normativeKeywords;
const keywordAlternatives = [...normativeLevels].sort(
  (left, right) => right.length - left.length,
);
const clauseIdPattern = /^MWP-(?:FND|IDN|SDV|ADM|MSN|WRK|AUT|EVT|EXT)-\d{3}$/u;
const normativeKeywordPattern = new RegExp(
  `\\b(?:${keywordAlternatives.join("|")})\\b`,
  "gu",
);
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

async function collectMdxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMdxFiles(candidate)));
    else if (entry.isFile() && entry.name.endsWith(".mdx"))
      files.push(candidate);
  }
  return files.sort();
}

function lineNumberAt(contents, index) {
  return contents.slice(0, index).split("\n").length;
}

function readAttribute(attributes, name) {
  const match = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(["'])(?<value>[^"']+)\\1`,
    "u",
  ).exec(attributes);
  return match?.groups?.value;
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeLevels(value) {
  const levels = typeof value === "string" ? [value] : value;
  if (
    !Array.isArray(levels) ||
    levels.length === 0 ||
    unique(levels).length !== levels.length ||
    levels.some((level) => !normativeLevels.includes(level))
  ) {
    return undefined;
  }
  return levels;
}

function readDeclaredLevels(attributes) {
  const scalar = readAttribute(attributes, "level");
  const arrayMatch = /(?:^|\s)level\s*=\s*\{(?<value>\[[\s\S]*?\])\}/u.exec(
    attributes,
  );
  if ((scalar ? 1 : 0) + (arrayMatch ? 1 : 0) !== 1) return undefined;
  if (scalar) return normalizeLevels(scalar);
  try {
    return normalizeLevels(JSON.parse(arrayMatch.groups.value));
  } catch {
    return undefined;
  }
}

function replaceWithSpaces(value) {
  return value.replace(/[^\n]/gu, " ");
}

function maskMarkdownNonProse(contents, { maskJsxTags = false } = {}) {
  const lines = contents.match(/.*(?:\n|$)/gu) ?? [];
  let inFrontmatter = lines[0]?.trim() === "---";
  let frontmatterLine = 0;
  let fence;
  let masked = "";

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (inFrontmatter) {
      masked += replaceWithSpaces(line);
      frontmatterLine += 1;
      if (frontmatterLine > 1 && trimmed.trim() === "---") {
        inFrontmatter = false;
      }
      continue;
    }

    const fenceMatch = /^(?<marker>`{3,}|~{3,})/u.exec(trimmed);
    if (fence) {
      masked += replaceWithSpaces(line);
      if (
        fenceMatch &&
        fenceMatch.groups.marker[0] === fence[0] &&
        fenceMatch.groups.marker.length >= fence.length
      ) {
        fence = undefined;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch.groups.marker;
      masked += replaceWithSpaces(line);
      continue;
    }
    if (/^\s*(?:import|export)\b/u.test(line)) {
      masked += replaceWithSpaces(line);
      continue;
    }
    masked += line;
  }

  masked = masked.replace(/<!--[\s\S]*?-->/gu, replaceWithSpaces);
  masked = masked.replace(/(`+)[\s\S]*?\1/gu, replaceWithSpaces);
  masked = masked.replace(
    /\]\([^\n)]*\)/gu,
    (value) => `]${replaceWithSpaces(value.slice(1))}`,
  );
  if (maskJsxTags) {
    masked = masked.replace(/<[^>]+>/gu, replaceWithSpaces);
  }
  return masked;
}

function normativeLevelsIn(contents) {
  return unique(
    [...contents.matchAll(normativeKeywordPattern)].map((match) => match[0]),
  );
}

function maskRange(contents, start, end) {
  return (
    contents.slice(0, start) +
    contents.slice(start, end).replace(/[^\n]/gu, " ") +
    contents.slice(end)
  );
}

for (const component of requiredComponents) {
  if (!(await exists(path.join(repositoryRoot, component)))) {
    failures.push(`missing required component: ${component}`);
  }
}

let manifest;
if (!(await exists(manifestPath))) {
  failures.push(
    "missing normative clause manifest: src/data/normative/0.1/clauses.json",
  );
} else {
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    failures.push(`invalid normative clause manifest JSON: ${error.message}`);
  }
}

const manifestClauses = new Map();
if (manifest) {
  if (manifest.schemaVersion !== 1) {
    failures.push("clause manifest schemaVersion must be 1");
  }
  if (manifest.protocolVersion !== "0.1") {
    failures.push("clause manifest protocolVersion must be 0.1");
  }
  if (
    manifest.source?.path !== "public/artifacts/0.1/protocol/spec/PROTOCOL.md"
  ) {
    failures.push(
      "clause manifest source path differs from the vendored protocol",
    );
  }
  if (JSON.stringify(manifest.prefixes) !== JSON.stringify(expectedPrefixes)) {
    failures.push("clause manifest prefixes differ from the normative plan");
  }
  if (!Array.isArray(manifest.clauses)) {
    failures.push("clause manifest clauses must be an array");
  } else {
    for (const [index, clause] of manifest.clauses.entries()) {
      const label = `clause manifest entry ${index + 1}`;
      if (!clauseIdPattern.test(clause?.id ?? "")) {
        failures.push(
          `${label} has malformed id: ${clause?.id ?? "<missing>"}`,
        );
        continue;
      }
      if (manifestClauses.has(clause.id)) {
        failures.push(`duplicate clause manifest id: ${clause.id}`);
        continue;
      }
      const levels = normalizeLevels(clause.level);
      if (!levels) {
        failures.push(`${clause.id} has invalid normative level set`);
      }
      if (typeof clause.page !== "string" || clause.page.length === 0) {
        failures.push(`${clause.id} has no version-relative page`);
      }
      if (
        !Number.isInteger(clause.source?.startLine) ||
        !Number.isInteger(clause.source?.endLine) ||
        clause.source.startLine < 1 ||
        clause.source.endLine < clause.source.startLine ||
        !/^sha256:[0-9a-f]{64}$/u.test(clause.source?.sha256 ?? "")
      ) {
        failures.push(`${clause.id} has invalid source paragraph identity`);
      }
      manifestClauses.set(clause.id, clause);
    }
  }
}

let mdxFiles = [];
if (await exists(contentRoot)) {
  mdxFiles = await collectMdxFiles(contentRoot);
}

const contentClauses = new Map();
for (const file of mdxFiles) {
  const contents = await readFile(file, "utf8");
  const structuralContents = maskMarkdownNonProse(contents);
  const relativeFile = path
    .relative(repositoryRoot, file)
    .split(path.sep)
    .join("/");
  const page = path
    .relative(contentRoot, file)
    .split(path.sep)
    .join("/")
    .replace(/\.mdx$/u, "")
    .replace(/\/index$/u, "");
  const clausePattern =
    /<NormativeClause\b(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/NormativeClause>/gu;
  const matches = [...structuralContents.matchAll(clausePattern)];
  const openingTags =
    structuralContents.match(/<NormativeClause\b/gu)?.length ?? 0;
  const closingTags =
    structuralContents.match(/<\/NormativeClause>/gu)?.length ?? 0;
  if (openingTags !== matches.length || closingTags !== matches.length) {
    failures.push(`${relativeFile}: malformed NormativeClause structure`);
  }

  let outsideContents = structuralContents;
  for (const match of matches.toReversed()) {
    outsideContents = maskRange(
      outsideContents,
      match.index,
      match.index + match[0].length,
    );
  }
  outsideContents = maskMarkdownNonProse(outsideContents, {
    maskJsxTags: true,
  });

  for (const keyword of outsideContents.matchAll(normativeKeywordPattern)) {
    failures.push(
      `${relativeFile}:${lineNumberAt(contents, keyword.index)}: BCP 14 keyword ${keyword[0]} appears outside NormativeClause`,
    );
  }

  for (const match of matches) {
    const line = lineNumberAt(contents, match.index);
    if (/\{\s*\.\.\./u.test(match.groups.attributes)) {
      failures.push(
        `${relativeFile}:${line}: NormativeClause attributes may not use spreads`,
      );
    }
    const id = readAttribute(match.groups.attributes, "id");
    const declaredLevels = readDeclaredLevels(match.groups.attributes);
    if (!clauseIdPattern.test(id ?? "")) {
      failures.push(
        `${relativeFile}:${line}: malformed normative clause id: ${id ?? "<missing>"}`,
      );
      continue;
    }
    if (contentClauses.has(id)) {
      failures.push(
        `${relativeFile}:${line}: duplicate normative clause id: ${id}`,
      );
      continue;
    }
    if (!declaredLevels) {
      failures.push(
        `${relativeFile}:${line}: ${id} has invalid level attribute`,
      );
    }
    const bodyLevels = normativeLevelsIn(
      maskMarkdownNonProse(match.groups.body, { maskJsxTags: true }),
    );
    if (bodyLevels.length === 0) {
      failures.push(
        `${relativeFile}:${line}: ${id} contains no BCP 14 keyword`,
      );
    } else if (
      declaredLevels &&
      JSON.stringify(bodyLevels) !== JSON.stringify(declaredLevels)
    ) {
      failures.push(
        `${relativeFile}:${line}: ${id} declared levels differ from its BCP 14 keywords`,
      );
    }
    const manifestClause = manifestClauses.get(id);
    if (!manifestClause) {
      failures.push(
        `${relativeFile}:${line}: ${id} is not listed in clauses.json`,
      );
    } else {
      if (
        declaredLevels &&
        JSON.stringify(normalizeLevels(manifestClause.level)) !==
          JSON.stringify(declaredLevels)
      ) {
        failures.push(
          `${relativeFile}:${line}: ${id} levels differ from clauses.json`,
        );
      }
      if (manifestClause.page !== page) {
        failures.push(
          `${relativeFile}:${line}: ${id} page differs from clauses.json`,
        );
      }
    }
    contentClauses.set(id, { file: relativeFile, line });
  }
}

for (const id of manifestClauses.keys()) {
  if (!contentClauses.has(id)) {
    failures.push(
      `${id} is listed in clauses.json but absent from English MDX`,
    );
  }
}

if (failures.length > 0) {
  console.error("Normative clause check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Normative clauses passed ${contentClauses.size} stable IDs across ${mdxFiles.length} English MDX files.`,
);
