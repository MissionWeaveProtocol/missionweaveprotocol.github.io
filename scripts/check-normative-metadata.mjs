import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const contentRoot = path.join(repositoryRoot, "src/content/docs");
const localeDirectories = ["", "zh-cn", "zh-tw", "ja", "es", "fr", "de"];
const clausePrefixes = new Map([
  ["reference/specification/foundations.mdx", "MWP-FND"],
  ["reference/specification/identity-registry-and-sessions.mdx", "MWP-IDN"],
  ["reference/specification/signed-documents-and-trust.mdx", "MWP-SDV"],
  [
    "reference/specification/first-admission-and-historical-trust.mdx",
    "MWP-ADM",
  ],
  ["reference/specification/missions-groups-and-membership.mdx", "MWP-MSN"],
  ["reference/specification/work-scheduling-and-recovery.mdx", "MWP-WRK"],
  ["reference/specification/authorization-and-budgets.mdx", "MWP-AUT"],
  ["reference/specification/commands-events-and-ordering.mdx", "MWP-EVT"],
  ["reference/specification/errors-extensions-and-security.mdx", "MWP-EXT"],
]);

const collect = async (directory, prefix = "") => {
  const files = [];
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(candidate, relative)));
    } else if (entry.isFile() && /\.mdx?$/u.test(entry.name)) {
      files.push(relative);
    }
  }
  return files;
};

const parseFrontmatter = (contents, relativePath) => {
  const match = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---\r?\n?/u.exec(
    contents,
  );
  if (!match) throw new Error(`${relativePath}: missing frontmatter`);
  return yaml.load(match.groups.frontmatter) ?? {};
};

const failures = [];
let checked = 0;
let prefixed = 0;

for (const locale of localeDirectories) {
  const versionRoot = path.join(contentRoot, locale, "0.1");
  const files = await collect(versionRoot);
  for (const relativePath of files) {
    const displayPath = path.posix.join(locale || "en", "0.1", relativePath);
    const frontmatter = parseFrontmatter(
      await readFile(path.join(versionRoot, relativePath), "utf8"),
      displayPath,
    );
    checked += 1;

    if (frontmatter.normativeVersion !== "0.1") {
      failures.push(`${displayPath}: normativeVersion must be 0.1`);
    }
    if (frontmatter.normativeStatus !== "normative") {
      failures.push(`${displayPath}: normativeStatus must be normative`);
    }

    const expectedPrefix = clausePrefixes.get(relativePath);
    if (expectedPrefix) {
      prefixed += 1;
      if (frontmatter.clausePrefix !== expectedPrefix) {
        failures.push(`${displayPath}: clausePrefix must be ${expectedPrefix}`);
      }
    } else if (frontmatter.clausePrefix !== undefined) {
      failures.push(`${displayPath}: unexpected clausePrefix`);
    }
  }
}

if (checked !== 434) {
  failures.push(`expected 434 versioned locale documents, found ${checked}`);
}
if (prefixed !== 63) {
  failures.push(
    `expected 63 prefixed specification documents, found ${prefixed}`,
  );
}

if (failures.length > 0) {
  for (const failure of failures.slice(0, 40)) console.error(`- ${failure}`);
  if (failures.length > 40) {
    console.error(`- ... ${failures.length - 40} additional failures`);
  }
  throw new Error(
    `Normative metadata check failed with ${failures.length} issue(s).`,
  );
}

console.log(
  `Normative metadata passed ${checked} versioned documents and ${prefixed} clause-prefix declarations across ${localeDirectories.length} authorities.`,
);
