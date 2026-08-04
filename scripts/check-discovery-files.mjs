import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const llms = await readFile(
  new URL("../public/llms.txt", import.meta.url),
  "utf8",
);
const robots = await readFile(
  new URL("../public/robots.txt", import.meta.url),
  "utf8",
);

const origin = "https://missionweaveprotocol.github.io";
const requiredPaths = [
  "/0.1/learn/",
  "/0.1/build/",
  "/0.1/reference/specification/",
  "/0.1/build/sdk/python/",
  "/0.1/build/sdk/typescript/",
  "/0.1/build/sdk/go/",
  "/0.1/build/sdk/rust/",
  "/0.1/build/sdk/java/",
  "/0.1/build/sdk/cpp/",
  "/0.1/reference/conformance/structural/",
  "/0.1/reference/conformance/cryptography/",
  "/0.1/reference/conformance/admission/",
  "/0.1/reference/normative-release/",
  "/0.1/reference/artifacts-and-digests/",
  "/0.1/reference/errata/",
  "/artifacts/0.1/normative-release.json",
  "/artifacts/0.1/protocol/schemas/first-admission-record.schema.json",
];
const localeHomes = ["/", "/zh-cn/", "/zh-tw/", "/ja/", "/es/", "/fr/", "/de/"];

const failures = [];
for (const pathname of [...localeHomes, ...requiredPaths]) {
  const url = `${origin}${pathname}`;
  if (!llms.includes(url)) failures.push(`llms.txt is missing ${url}`);
}

for (const forbidden of [
  /github\.com\/[^\s]+\/(?:blob|tree)\/[^\s]+\/(?:README|docs|spec)\b/iu,
  /consult the protocol repository/iu,
  /repository documentation/iu,
]) {
  if (forbidden.test(llms)) {
    failures.push(`llms.txt contains prohibited dependency ${forbidden}`);
  }
}

const expectedRobots = [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${origin}/sitemap-index.xml`,
];
for (const line of expectedRobots) {
  if (!robots.split(/\r?\n/u).includes(line)) {
    failures.push(`robots.txt is missing ${line}`);
  }
}

assert.equal(
  failures.length,
  0,
  `Discovery file validation failed in ${projectRoot}:\n${failures
    .map((failure) => `  ${failure}`)
    .join("\n")}`,
);

console.log(
  `Discovery files passed ${requiredPaths.length} normative resources, ${localeHomes.length} locale homes, and ${expectedRobots.length} robots directives.`,
);
