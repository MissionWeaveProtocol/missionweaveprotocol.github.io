import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLocaleClauseSignatures,
  serializeLocaleClauseSignatures,
} from "./generate-locale-clause-signatures.mjs";

function parseRepositoryRoot(arguments_) {
  if (arguments_.length === 0) {
    return fileURLToPath(new URL("../", import.meta.url));
  }
  assert.deepEqual(
    arguments_.slice(0, 1),
    ["--repository-root"],
    "usage: check-locale-clause-signatures.mjs [--repository-root /absolute/path]",
  );
  assert.equal(arguments_.length, 2, "--repository-root requires one value");
  assert.equal(
    path.isAbsolute(arguments_[1]),
    true,
    "--repository-root must be absolute",
  );
  return path.resolve(arguments_[1]);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function documentKey(document) {
  return `${document.locale}:${document.route}`;
}

function isStringArray(value) {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function hasValidStructure(value) {
  if (
    !value ||
    typeof value !== "object" ||
    value.schemaVersion !== 1 ||
    typeof value.protocolVersion !== "string" ||
    typeof value.sourceLocale !== "string" ||
    !isStringArray(value.locales) ||
    value.locales.length === 0 ||
    new Set(value.locales).size !== value.locales.length ||
    !value.locales.includes(value.sourceLocale) ||
    !Array.isArray(value.documents)
  ) {
    return false;
  }

  const documentKeys = new Set();
  for (const document of value.documents) {
    if (
      !document ||
      typeof document !== "object" ||
      !value.locales.includes(document.locale) ||
      typeof document.route !== "string" ||
      !Array.isArray(document.clauses)
    ) {
      return false;
    }
    const key = documentKey(document);
    if (documentKeys.has(key)) return false;
    documentKeys.add(key);
    for (const clause of document.clauses) {
      if (
        !clause ||
        typeof clause !== "object" ||
        typeof clause.id !== "string" ||
        !(typeof clause.level === "string" || isStringArray(clause.level)) ||
        !isStringArray(clause.keywords) ||
        !isStringArray(clause.links) ||
        !isStringArray(clause.codeTokens) ||
        !isStringArray(clause.explicitExclusions)
      ) {
        return false;
      }
    }
  }
  return true;
}

const repositoryRoot = parseRepositoryRoot(process.argv.slice(2));
const signaturePath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/locale-clause-signatures.json",
);
const failures = [];
let actual;
try {
  actual = JSON.parse(await readFile(signaturePath, "utf8"));
} catch (error) {
  if (error?.code === "ENOENT") {
    failures.push("locale clause signatures are missing");
  } else if (error instanceof SyntaxError) {
    failures.push(
      `locale clause signatures are invalid JSON: ${error.message}`,
    );
  } else {
    throw error;
  }
}
if (actual !== undefined && !hasValidStructure(actual)) {
  failures.push("locale clause signatures have invalid structure");
  actual = undefined;
}

const expected = await buildLocaleClauseSignatures(repositoryRoot);
if (actual !== undefined) {
  if (
    (await serializeLocaleClauseSignatures(actual)) !==
    (await serializeLocaleClauseSignatures(expected))
  ) {
    failures.push(
      "locale clause signatures are stale; run npm run generate:locale-signatures",
    );
  }

  const documents = new Map(
    actual.documents.map((document) => [documentKey(document), document]),
  );
  const englishDocuments = actual.documents.filter(
    (document) => document.locale === actual.sourceLocale,
  );
  const englishRoutes = englishDocuments.map((document) => document.route);
  for (const locale of actual.locales.filter(
    (candidate) => candidate !== actual.sourceLocale,
  )) {
    const localizedRoutes = actual.documents
      .filter((document) => document.locale === locale)
      .map((document) => document.route);
    if (!same(localizedRoutes, englishRoutes)) {
      failures.push(`${locale}: semantic document route sequence differs`);
      continue;
    }
    for (const english of englishDocuments) {
      const localized = documents.get(`${locale}:${english.route}`);
      if (localized === undefined) {
        failures.push(`${locale}/${english.route}: semantic signature missing`);
        continue;
      }
      const englishIds = english.clauses.map((clause) => clause.id);
      const localizedIds = localized.clauses.map((clause) => clause.id);
      if (!same(localizedIds, englishIds)) {
        failures.push(`${locale}/${english.route}: clause ID sequence differs`);
        continue;
      }
      for (const [index, reference] of english.clauses.entries()) {
        const candidate = localized.clauses[index];
        const prefix = `${locale}/${english.route}#${reference.id}`;
        if (!same(candidate.level, reference.level)) {
          failures.push(`${prefix}: clause level differs`);
        }
        if (!same(candidate.keywords, reference.keywords)) {
          failures.push(`${prefix}: BCP 14 keyword sequence differs`);
        }
        if (!same(candidate.links, reference.links)) {
          failures.push(`${prefix}: local-clause target sequence differs`);
        }
        if (!same(candidate.codeTokens, reference.codeTokens)) {
          failures.push(`${prefix}: code-token sequence differs`);
        }
        if (!same(candidate.explicitExclusions, reference.explicitExclusions)) {
          failures.push(`${prefix}: explicit exclusion sequence differs`);
        }
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Locale clause signature violations:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Locale clause signatures passed ${actual.documents.length} locale documents across ${actual.locales.length} authorities.`,
);
