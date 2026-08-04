import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format } from "prettier";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

const mdxProcessor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

function parseRepositoryRoot(arguments_) {
  if (arguments_.length === 0) {
    return fileURLToPath(new URL("../", import.meta.url));
  }
  assert.deepEqual(
    arguments_.slice(0, 1),
    ["--repository-root"],
    "usage: generate-locale-clause-signatures.mjs [--repository-root /absolute/path]",
  );
  assert.equal(arguments_.length, 2, "--repository-root requires one value");
  assert.equal(
    path.isAbsolute(arguments_[1]),
    true,
    "--repository-root must be absolute",
  );
  return path.resolve(arguments_[1]);
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
  return JSON.parse(array);
}

function keywordSequence(body, keywords) {
  const alternatives = [...keywords]
    .sort((left, right) => right.length - left.length)
    .map((keyword) => keyword.replaceAll(" ", "\\s+"));
  const pattern = new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gu");
  return [...body.matchAll(pattern)].map((match) =>
    match[0].replace(/\s+/gu, " "),
  );
}

function inlineCodeSequence(body) {
  return [...body.matchAll(/`(?<value>[^`\n]+)`/gu)].map(
    (match) => match.groups.value,
  );
}

function isLocalTarget(target) {
  return !/^[a-z][a-z0-9+.-]*:/iu.test(target) && !target.startsWith("//");
}

function normalizeLocalTarget(target, documentPath, locale) {
  const match = /^(?<pathname>[^?#]*)(?<suffix>[?#].*)?$/u.exec(target);
  const pathname = match.groups.pathname;
  const suffix = match.groups.suffix ?? "";
  const localePrefix = locale === "en" ? "" : `${locale}/`;
  if (pathname === "") {
    const canonicalDocumentPath = documentPath.startsWith(localePrefix)
      ? documentPath.slice(localePrefix.length)
      : documentPath;
    return `${canonicalDocumentPath}${suffix}`;
  }
  const resolved = pathname.startsWith("/")
    ? pathname.slice(1)
    : path.posix.normalize(
        path.posix.join(path.posix.dirname(documentPath), pathname),
      );
  const canonical = resolved.startsWith(localePrefix)
    ? resolved.slice(localePrefix.length)
    : resolved;
  return `${canonical}${suffix}`;
}

function visit(node, visitor) {
  visitor(node);
  if (Array.isArray(node?.children)) {
    for (const child of node.children) visit(child, visitor);
  }
}

function mdxAttribute(node, name) {
  return node.attributes?.find(
    (attribute) =>
      attribute.type === "mdxJsxAttribute" && attribute.name === name,
  );
}

function estreeContainsJsx(value) {
  if (Array.isArray(value)) return value.some(estreeContainsJsx);
  if (!value || typeof value !== "object") return false;
  if (value.type === "JSXElement" || value.type === "JSXFragment") return true;
  return Object.entries(value).some(
    ([key, child]) =>
      key !== "loc" && key !== "range" && estreeContainsJsx(child),
  );
}

function isImportMetaEnvBaseUrl(expression) {
  return (
    expression?.type === "MemberExpression" &&
    expression.computed === false &&
    expression.property?.type === "Identifier" &&
    expression.property.name === "BASE_URL" &&
    expression.object?.type === "MemberExpression" &&
    expression.object.computed === false &&
    expression.object.property?.type === "Identifier" &&
    expression.object.property.name === "env" &&
    expression.object.object?.type === "MetaProperty" &&
    expression.object.object.meta?.name === "import" &&
    expression.object.object.property?.name === "meta"
  );
}

function staticTemplateDestination(expression) {
  if (
    expression?.type !== "TemplateLiteral" ||
    expression.quasis?.length !== expression.expressions?.length + 1 ||
    expression.quasis.some(
      (quasi) => typeof quasi?.value?.cooked !== "string",
    ) ||
    expression.expressions.some((child) => !isImportMetaEnvBaseUrl(child))
  ) {
    return undefined;
  }

  let destination = expression.quasis[0].value.cooked;
  for (let index = 0; index < expression.expressions.length; index += 1) {
    destination += `/${expression.quasis[index + 1].value.cooked}`;
  }
  return destination;
}

function mdxAttributeTarget(attribute, documentPath, clauseId) {
  if (typeof attribute.value === "string") return attribute.value;
  const expression = attribute.value?.data?.estree?.body?.[0]?.expression;
  if (typeof expression?.value === "string") return expression.value;
  const templateDestination = staticTemplateDestination(expression);
  assert.notEqual(
    templateDestination,
    undefined,
    `${documentPath}#${clauseId}: unresolved MDX ${attribute.name} expression`,
  );
  return templateDestination;
}

function localLinkSequences(contents, documentPath, locale) {
  const tree = mdxProcessor.parse(contents);
  const definitions = new Map();
  visit(tree, (node) => {
    if (node.type === "definition") {
      assert.equal(
        definitions.has(node.identifier),
        false,
        `${documentPath}: duplicate Markdown link definition ${node.identifier}`,
      );
      definitions.set(node.identifier, node.url);
    }
  });

  const sequences = new Map();
  visit(tree, (node) => {
    if (
      (node.type !== "mdxJsxFlowElement" &&
        node.type !== "mdxJsxTextElement") ||
      node.name !== "NormativeClause"
    ) {
      return;
    }
    const id = mdxAttribute(node, "id")?.value;
    assert.equal(
      typeof id,
      "string",
      `${documentPath}: NormativeClause missing literal id`,
    );
    assert.equal(
      sequences.has(id),
      false,
      `${documentPath}: duplicate NormativeClause AST id ${id}`,
    );
    const links = [];
    visit(node, (child) => {
      let target;
      if (child.type === "link") {
        target = child.url;
      } else if (child.type === "linkReference") {
        target = definitions.get(child.identifier);
        assert.notEqual(
          target,
          undefined,
          `${documentPath}#${id}: unresolved Markdown link reference ${child.identifier}`,
        );
      } else if (
        child.type === "mdxFlowExpression" ||
        child.type === "mdxTextExpression"
      ) {
        assert.equal(
          estreeContainsJsx(child.data?.estree),
          false,
          `${documentPath}#${id}: unresolved MDX JSX expression`,
        );
      } else if (Array.isArray(child.attributes)) {
        assert.equal(
          child.attributes.some(
            (attribute) => attribute.type === "mdxJsxExpressionAttribute",
          ),
          false,
          `${documentPath}#${id}: unresolved MDX spread attributes`,
        );
        const navigationAttributes = child.attributes.filter(
          (attribute) =>
            attribute.type === "mdxJsxAttribute" &&
            (attribute.name === "href" || attribute.name === "src"),
        );
        for (const attribute of navigationAttributes) {
          target = mdxAttributeTarget(attribute, documentPath, id);
          if (isLocalTarget(target)) {
            links.push(normalizeLocalTarget(target, documentPath, locale));
          }
        }
        return;
      }
      if (typeof target === "string" && isLocalTarget(target)) {
        links.push(normalizeLocalTarget(target, documentPath, locale));
      }
    });
    sequences.set(id, links);
  });
  return sequences;
}

async function collectClauseDocumentPaths(localeRoot) {
  const relativePaths = [];
  for (const relativePath of await collectContentFiles(localeRoot)) {
    const contents = await readFile(
      path.join(localeRoot, relativePath),
      "utf8",
    );
    if (contents.includes("<NormativeClause")) {
      relativePaths.push(relativePath);
    }
  }
  return relativePaths;
}

function clauseSignatures(
  contents,
  documentPath,
  locale,
  keywords,
  allowedExclusions,
) {
  const linksByClauseId = localLinkSequences(contents, documentPath, locale);
  const signatures = [];
  for (const match of contents.matchAll(
    /<NormativeClause\b(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/NormativeClause>/gu,
  )) {
    const id = readAttribute(match.groups.attributes, "id");
    const level = readAttribute(match.groups.attributes, "level");
    const explicitExclusions =
      readAttribute(match.groups.attributes, "exclusions") ?? [];
    assert.equal(
      typeof id,
      "string",
      `${documentPath}: NormativeClause missing id`,
    );
    assert.equal(
      typeof level === "string" || Array.isArray(level),
      true,
      `${documentPath}#${id}: NormativeClause missing level`,
    );
    assert.equal(
      Array.isArray(explicitExclusions) &&
        new Set(explicitExclusions).size === explicitExclusions.length &&
        explicitExclusions.every((entry) => allowedExclusions.has(entry)),
      true,
      `${documentPath}#${id}: invalid explicit exclusions`,
    );
    const clauseKeywords = keywordSequence(match.groups.body, keywords);
    signatures.push({
      id,
      level,
      keywords: clauseKeywords,
      links: linksByClauseId.get(id),
      codeTokens: inlineCodeSequence(match.groups.body),
      explicitExclusions,
    });
  }
  assert.equal(
    signatures.length,
    linksByClauseId.size,
    `${documentPath}: NormativeClause syntax trees differ from signature extraction`,
  );
  return signatures;
}

function withoutExtension(relativePath) {
  return relativePath.replace(/\.(?:md|mdx)$/u, "");
}

export async function buildLocaleClauseSignatures(repositoryRoot) {
  const contentRoot = path.join(repositoryRoot, "src/content/docs");
  const policy = JSON.parse(
    await readFile(
      path.join(repositoryRoot, "src/data/normative/0.1/locale-policy.json"),
      "utf8",
    ),
  );
  const localeNames = [
    policy.sourceLocale,
    ...policy.locales.map((locale) => locale.directory),
  ];
  const allowedExclusions = new Set(policy.explicitExclusionIds);
  const exclusionsByClauseId = policy.explicitExclusionsByClauseId;
  const englishRoot = path.join(contentRoot, "0.1");

  const documents = [];
  for (const locale of localeNames) {
    const localeRoot =
      locale === policy.sourceLocale
        ? englishRoot
        : path.join(contentRoot, locale, "0.1");
    const relativePaths = await collectClauseDocumentPaths(localeRoot);
    const seenClauseIds = new Set();
    for (const relativePath of relativePaths) {
      const documentPath =
        locale === policy.sourceLocale
          ? `0.1/${relativePath}`
          : `${locale}/0.1/${relativePath}`;
      const contents = await readFile(
        path.join(localeRoot, relativePath),
        "utf8",
      );
      const clauses = clauseSignatures(
        contents,
        documentPath,
        locale,
        policy.normativeKeywords,
        allowedExclusions,
      );
      for (const clause of clauses) {
        assert.equal(
          seenClauseIds.has(clause.id),
          false,
          `${locale}: duplicate clause id ${clause.id}`,
        );
        if (locale === policy.sourceLocale) {
          assert.deepEqual(
            clause.explicitExclusions,
            exclusionsByClauseId[clause.id] ?? [],
            `${documentPath}#${clause.id}: explicit exclusions differ from locale policy`,
          );
        }
        seenClauseIds.add(clause.id);
      }
      documents.push({
        locale,
        route: withoutExtension(relativePath),
        clauses,
      });
    }
    for (const clauseId of Object.keys(exclusionsByClauseId)) {
      assert.equal(
        seenClauseIds.has(clauseId),
        true,
        `${locale}: explicit-exclusion clause ${clauseId} is missing`,
      );
    }
  }

  return {
    schemaVersion: 1,
    protocolVersion: "0.1",
    sourceLocale: policy.sourceLocale,
    locales: localeNames,
    documents,
  };
}

export async function serializeLocaleClauseSignatures(signatures) {
  return format(JSON.stringify(signatures), { parser: "json" });
}

async function main() {
  const repositoryRoot = parseRepositoryRoot(process.argv.slice(2));
  const outputPath = path.join(
    repositoryRoot,
    "src/data/normative/0.1/locale-clause-signatures.json",
  );
  const signatures = await buildLocaleClauseSignatures(repositoryRoot);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    await serializeLocaleClauseSignatures(signatures),
  );
  console.log(
    `Generated locale clause signatures for ${signatures.documents.length} locale documents.`,
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
