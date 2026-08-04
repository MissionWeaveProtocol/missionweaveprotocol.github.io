import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { load as loadYaml } from "js-yaml";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

const defaultContentRoot = fileURLToPath(
  new URL("../src/content/docs/", import.meta.url),
);
const contentRoot = process.env.MISSIONWEAVE_LOCAL_DOCS_ROOT
  ? path.resolve(process.env.MISSIONWEAVE_LOCAL_DOCS_ROOT)
  : defaultContentRoot;
const contentExtensions = new Set([".md", ".mdx"]);
const prohibitedPaths = [
  /\/readme(?:\.md)?(?:\/|$)/iu,
  /\/docs(?:\/|$)/iu,
  /\/spec\/protocol\.md(?:\/|$)/iu,
  /\/conformance\/readme\.md(?:\/|$)/iu,
  /\/cryptography\/readme\.md(?:\/|$)/iu,
  /\/admission\/readme\.md(?:\/|$)/iu,
];
const failures = new Set();

async function collectContentFiles(directory, prefix = "") {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectContentFiles(absolutePath, relativePath)));
    } else if (contentExtensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

const navigationAttributePattern =
  /\b(?:href|link)\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*"([^"]+)"\s*\}|\{\s*'([^']+)'\s*\}|([^\s>]+))/giu;

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

function estreeContainsJsx(value) {
  if (Array.isArray(value)) return value.some(estreeContainsJsx);
  if (!value || typeof value !== "object") return false;
  if (value.type === "JSXElement" || value.type === "JSXFragment") return true;

  return Object.entries(value).some(
    ([key, child]) =>
      key !== "loc" && key !== "range" && estreeContainsJsx(child),
  );
}

function visitDestinations(node, visitor) {
  if (
    (node?.type === "link" || node?.type === "definition") &&
    typeof node.url === "string"
  ) {
    visitor({
      line: node.position?.start?.line ?? 1,
      url: node.url,
    });
  }

  if (node?.type === "html" && typeof node.value === "string") {
    navigationAttributePattern.lastIndex = 0;
    let match;
    while ((match = navigationAttributePattern.exec(node.value)) !== null) {
      const prefix = node.value.slice(0, match.index);
      visitor({
        line:
          (node.position?.start?.line ?? 1) +
          (prefix.match(/\n/gu)?.length ?? 0),
        url: match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5],
      });
    }
  }

  if (
    (node?.type === "mdxFlowExpression" ||
      node?.type === "mdxTextExpression") &&
    estreeContainsJsx(node.data?.estree)
  ) {
    visitor({
      line: node.position?.start?.line ?? 1,
      error: "unresolved MDX JSX expression",
    });
  }

  if (node?.type === "mdxjsEsm" && estreeContainsJsx(node.data?.estree)) {
    visitor({
      line: node.position?.start?.line ?? 1,
      error: "unresolved MDX JSX in ESM",
    });
  }

  if (Array.isArray(node?.attributes)) {
    const nativeElement =
      typeof node.name === "string" && /^[a-z][a-z0-9-]*$/u.test(node.name);

    for (const attribute of node.attributes) {
      if (attribute?.type === "mdxJsxExpressionAttribute") {
        visitor({
          line: attribute.position?.start?.line ?? 1,
          error: "unresolved MDX spread attributes",
        });
        continue;
      }

      if (
        attribute?.type === "mdxJsxAttribute" &&
        attribute.value?.type === "mdxJsxAttributeValueExpression" &&
        estreeContainsJsx(attribute.value.data?.estree)
      ) {
        visitor({
          line: attribute.position?.start?.line ?? 1,
          error: "unresolved MDX JSX expression",
        });
        continue;
      }

      const attributeName =
        nativeElement && typeof attribute?.name === "string"
          ? attribute.name.toLowerCase()
          : attribute?.name;
      if (
        attribute?.type !== "mdxJsxAttribute" ||
        (attributeName !== "href" && attributeName !== "link")
      ) {
        continue;
      }

      let url;
      let staticValue = false;
      if (typeof attribute.value === "string") {
        url = attribute.value;
        staticValue = true;
      } else {
        const expression = attribute.value?.data?.estree?.body?.[0]?.expression;
        const templateDestination = staticTemplateDestination(expression);
        if (typeof expression?.value === "string") {
          url = expression.value;
          staticValue = true;
        } else if (templateDestination !== undefined) {
          url = templateDestination;
          staticValue = true;
        } else if (attribute.value?.type === "mdxJsxAttributeValueExpression") {
          visitor({
            line: attribute.position?.start?.line ?? 1,
            error: `unresolved MDX ${attributeName} expression`,
          });
        }
      }

      if (staticValue) {
        visitor({
          line: attribute.position?.start?.line ?? 1,
          url,
        });
      }
    }
  }

  if (Array.isArray(node?.children)) {
    for (const child of node.children) visitDestinations(child, visitor);
  }
}

function visitFrontmatterDestinations(contents, visitor) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);
  if (!match) return;

  const frontmatter = match[1];
  const data = loadYaml(frontmatter);

  function visitValue(value) {
    if (Array.isArray(value)) {
      for (const item of value) visitValue(item);
      return;
    }
    if (!value || typeof value !== "object") return;

    for (const [key, child] of Object.entries(value)) {
      if (
        (key === "link" || key === "href" || key === "url") &&
        typeof child === "string"
      ) {
        const offset = frontmatter.indexOf(child);
        visitor({
          line:
            offset < 0
              ? 1
              : 2 + (frontmatter.slice(0, offset).match(/\n/gu)?.length ?? 0),
          url: child,
        });
      } else {
        visitValue(child);
      }
    }
  }

  visitValue(data);
}

function decodedPathname(url) {
  try {
    return decodeURIComponent(url.pathname);
  } catch {
    return url.pathname;
  }
}

function prohibitedGitHubDocumentation(urlText) {
  let url;
  try {
    const normalizedUrl = urlText.trim();
    const candidate = normalizedUrl.startsWith("//")
      ? `https:${normalizedUrl}`
      : normalizedUrl;
    url = new URL(candidate);
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.+$/u, "");
  if (hostname !== "github.com" && hostname !== "www.github.com") return false;

  const pathSegments = decodedPathname(url).split("/").filter(Boolean);
  if (pathSegments.length <= 2) return false;

  const repositoryPath = `/${pathSegments.slice(2).join("/")}`;
  return prohibitedPaths.some((pattern) => pattern.test(repositoryPath));
}

const contentFiles = await collectContentFiles(contentRoot);

for (const relativePath of contentFiles) {
  const contents = await readFile(path.join(contentRoot, relativePath), "utf8");
  const processor = unified().use(remarkParse).use(remarkGfm);
  if (path.extname(relativePath) === ".mdx") processor.use(remarkMdx);
  const tree = processor.parse(contents);

  const inspectDestination = (destination) => {
    if (destination.error) {
      failures.add(`${relativePath}:${destination.line}: ${destination.error}`);
      return;
    }

    if (!prohibitedGitHubDocumentation(destination.url)) return;

    failures.add(`${relativePath}:${destination.line}: ${destination.url}`);
  };

  visitFrontmatterDestinations(contents, inspectDestination);
  visitDestinations(tree, inspectDestination);
}

if (failures.size > 0) {
  console.error("Local documentation link check failed:");
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `Local documentation links passed ${contentFiles.length} content files with no prohibited GitHub documentation dependencies.`,
);
