import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const checker = fileURLToPath(
  new URL("./check-local-documentation-links.mjs", import.meta.url),
);

function runChecker(contentRoot) {
  return spawnSync(process.execPath, [checker], {
    encoding: "utf8",
    env: {
      ...process.env,
      MISSIONWEAVE_LOCAL_DOCS_ROOT: contentRoot,
    },
  });
}

const fixtureRoot = await mkdtemp(
  path.join(tmpdir(), "missionweaveprotocol-local-docs-"),
);

try {
  const forbiddenRoot = path.join(fixtureRoot, "forbidden");
  await writeFile(
    `${forbiddenRoot}.mdx`,
    [
      "---",
      "title: Forbidden fixtures",
      "actions:",
      "  - link: //github.com/acme/protocol/conformance/README.md",
      '  - link: "https://github.com/acme/protocol/schemas/\\',
      '      README.md"',
      '  - link: " //github.com/acme/protocol/security/README.md"',
      "---",
      "",
      "[inline](https://github.com/acme/protocol/blob/main/spec/PROTOCOL.md)",
      "[reference][docs]",
      "",
      "[docs]: //github.com/acme/protocol/docs/guide.md",
      "",
      '<a href="https://github.com./acme/protocol/README">HTML</a>',
      "",
      '<Card link={"https://www.github.com/acme/protocol/admission/README.md"} />',
      "",
      "<Card link={`https://github.com/acme/protocol/docs/runtime.md`} />",
      "",
      '<Card link={"https://github.com/acme/protocol/" + "docs/dynamic.md"} />',
      "",
      '<a {...{href: "https://github.com/acme/protocol/README.md"}}>Spread</a>',
      "",
      '{true && <a href="https://github.com/acme/protocol/docs/embedded.md">Embedded</a>}',
      "",
      '<a HREF="https://github.com/acme/protocol/docs/uppercase.md">Uppercase</a>',
      "",
      "https://github.com/acme/protocol/cryptography/README.md",
      "",
    ].join("\n"),
  );

  const forbidden = runChecker(fixtureRoot);
  assert.equal(
    forbidden.status,
    1,
    `expected prohibited links to fail, got status ${forbidden.status}\n${forbidden.stdout}\n${forbidden.stderr}`,
  );
  for (const expected of [
    "conformance/README.md",
    "schemas/README.md",
    "security/README.md",
    "spec/PROTOCOL.md",
    "//github.com/acme/protocol/docs/guide.md",
    "https://github.com./acme/protocol/README",
    "admission/README.md",
    "docs/runtime.md",
    "unresolved MDX link expression",
    "unresolved MDX spread attributes",
    "unresolved MDX JSX expression",
    "docs/uppercase.md",
    "cryptography/README.md",
  ]) {
    assert.match(
      forbidden.stderr,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"),
    );
  }

  await rm(`${forbiddenRoot}.mdx`);
  const nestedExpression = path.join(fixtureRoot, "nested-expression.mdx");
  await writeFile(
    nestedExpression,
    '<Wrapper content={<a href="https://github.com/acme/protocol/docs/nested.md">Nested</a>} />\n',
  );
  const nested = runChecker(fixtureRoot);
  assert.equal(
    nested.status,
    1,
    `expected JSX nested in an attribute expression to fail\n${nested.stdout}\n${nested.stderr}`,
  );
  assert.match(nested.stderr, /unresolved MDX JSX expression/u);
  await rm(nestedExpression);

  const esmExpression = path.join(fixtureRoot, "esm-expression.mdx");
  await writeFile(
    esmExpression,
    [
      "export const ExternalDocs = () => (",
      '  <a href="https://github.com/acme/protocol/docs/esm.md">Docs</a>',
      ");",
      "",
      "<ExternalDocs />",
      "",
    ].join("\n"),
  );
  const esm = runChecker(fixtureRoot);
  assert.equal(
    esm.status,
    1,
    `expected JSX in MDX ESM to fail\n${esm.stdout}\n${esm.stderr}`,
  );
  assert.match(esm.stderr, /unresolved MDX JSX in ESM/u);
  await rm(esmExpression);

  await writeFile(
    path.join(fixtureRoot, "allowed.md"),
    [
      "<!-- valid Markdown HTML comment -->",
      "[repository named docs](https://github.com/acme/docs)",
      "[commit in repository named docs](https://github.com/acme/docs/commit/0123456789abcdef)",
      "[source file](https://github.com/acme/protocol/blob/main/src/READMEParser.ts)",
      "[raw artifact](https://raw.githubusercontent.com/acme/protocol/main/docs/guide.md)",
      "[issue](https://github.com/acme/protocol/issues/42)",
      "[pull request](https://github.com/acme/protocol/pull/43)",
      "",
    ].join("\n"),
  );
  await writeFile(
    path.join(fixtureRoot, "allowed.mdx"),
    "<a href={`${import.meta.env.BASE_URL}artifacts/0.1/protocol/CONTEXT.md`}>artifact</a>\n",
  );

  const allowed = runChecker(fixtureRoot);
  assert.equal(
    allowed.status,
    0,
    `expected allowed provenance links to pass\n${allowed.stdout}\n${allowed.stderr}`,
  );
} finally {
  await rm(fixtureRoot, { force: true, recursive: true });
}

console.log(
  "Local documentation link checker tests passed forbidden link forms and allowed provenance paths.",
);
