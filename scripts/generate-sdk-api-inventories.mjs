import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import ts from "typescript";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const matrixPath = path.join(
  repositoryRoot,
  "src/data/normative/0.1/sdk-runtime-matrix.json",
);
const inventoryRoot = path.join(repositoryRoot, "public/artifacts/0.1/sdks");
const repositoryDirectories = {
  python: "python-sdk",
  typescript: "typescript-sdk",
  go: "go-sdk",
  rust: "rust-sdk",
  java: "java-sdk",
  cpp: "cpp-sdk",
};
const requiredAdmissionTypes = [
  "AdmissionService",
  "AdmissionLog",
  "AdmissionCurrentKeyResolver",
  "TrustedAdmissionContext",
  "FirstAdmissionRecord",
  "PreparedFirstAdmission",
  "AdmittedSignedDocument",
];

function git(repo, args, encoding = "utf8") {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitPaths(repo, commit, prefix = ".") {
  return git(repo, ["ls-tree", "-r", "--name-only", commit, "--", prefix])
    .split("\n")
    .filter(Boolean)
    .sort();
}

function sourceAt(repo, commit, sourceFile) {
  return git(repo, ["show", `${commit}:${sourceFile}`]);
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareEntries(left, right) {
  return (
    compareStrings(left.qualifiedName, right.qualifiedName) ||
    compareStrings(left.sourceFile, right.sourceFile) ||
    left.line - right.line ||
    compareStrings(left.kind, right.kind)
  );
}

function entry(name, qualifiedName, kind, sourceFile, line) {
  return { name, qualifiedName, kind, sourceFile, line };
}

function isPublicName(name) {
  return /^[A-Za-z][A-Za-z0-9_]*$/u.test(name) && !name.startsWith("_");
}

function braceDelta(line) {
  return (line.match(/\{/gu)?.length ?? 0) - (line.match(/\}/gu)?.length ?? 0);
}

function parsePython(sourceFile, source) {
  const entries = [];
  const lines = source.split("\n");
  let currentClass;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const topLevelClass = line.match(/^class\s+([A-Za-z][A-Za-z0-9_]*)\b/u);
    const topLevelFunction = line.match(
      /^(?:async\s+)?def\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/u,
    );
    if (topLevelClass) {
      const name = topLevelClass[1];
      currentClass = name;
      if (isPublicName(name)) {
        entries.push(entry(name, name, "class", sourceFile, lineNumber));
      }
      continue;
    }
    if (topLevelFunction) {
      currentClass = undefined;
      const name = topLevelFunction[1];
      if (isPublicName(name)) {
        entries.push(entry(name, name, "function", sourceFile, lineNumber));
      }
      continue;
    }
    if (/^[^\s#@]/u.test(line)) currentClass = undefined;

    const constant = line.match(/^([A-Z][A-Z0-9_]*)\s*(?::[^=]+)?=/u);
    if (constant) {
      const name = constant[1];
      entries.push(entry(name, name, "constant", sourceFile, lineNumber));
    }
    if (currentClass) {
      const method = line.match(
        /^ {4}(?:async\s+)?def\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/u,
      );
      if (method && isPublicName(method[1])) {
        entries.push(
          entry(
            method[1],
            `${currentClass}.${method[1]}`,
            "method",
            sourceFile,
            lineNumber,
          ),
        );
      }
    }
  }
  return entries;
}

function parseTypeScript(sourceFile, source) {
  const entries = [];
  const parsed = ts.createSourceFile(
    sourceFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  function modifiers(node) {
    return ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
  }

  function hasModifier(node, kind) {
    return modifiers(node).some((modifier) => modifier.kind === kind);
  }

  function declarationName(node) {
    if (!node) return undefined;
    if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
    return undefined;
  }

  function lineNumber(node) {
    return parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
  }

  function add(name, qualifiedName, kind, node) {
    entries.push(
      entry(name, qualifiedName, kind, sourceFile, lineNumber(node)),
    );
  }

  function addMembers(containerName, members) {
    for (const member of members) {
      if (
        hasModifier(member, ts.SyntaxKind.PrivateKeyword) ||
        hasModifier(member, ts.SyntaxKind.ProtectedKeyword) ||
        (member.name && ts.isPrivateIdentifier(member.name))
      ) {
        continue;
      }
      if (ts.isConstructorDeclaration(member)) {
        add(
          "constructor",
          `${containerName}.constructor`,
          "constructor",
          member,
        );
        continue;
      }
      const name = declarationName(member.name);
      if (!name) continue;
      if (ts.isGetAccessorDeclaration(member)) {
        add(name, `${containerName}.${name}`, "getter", member);
      } else if (ts.isSetAccessorDeclaration(member)) {
        add(name, `${containerName}.${name}`, "setter", member);
      } else if (
        ts.isMethodDeclaration(member) ||
        ts.isMethodSignature(member)
      ) {
        add(name, `${containerName}.${name}`, "method", member);
      } else if (
        ts.isPropertyDeclaration(member) ||
        ts.isPropertySignature(member)
      ) {
        add(name, `${containerName}.${name}`, "property", member);
      }
    }
  }

  for (const statement of parsed.statements) {
    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;

    if (ts.isVariableStatement(statement)) {
      const kind =
        statement.declarationList.flags & ts.NodeFlags.Const
          ? "const"
          : "variable";
      for (const declaration of statement.declarationList.declarations) {
        const name = declarationName(declaration.name);
        if (name) add(name, name, kind, declaration);
      }
      continue;
    }

    const name = declarationName(statement.name);
    if (!name) continue;
    if (ts.isFunctionDeclaration(statement)) {
      add(name, name, "function", statement);
    } else if (ts.isTypeAliasDeclaration(statement)) {
      add(name, name, "type", statement);
    } else if (ts.isInterfaceDeclaration(statement)) {
      add(name, name, "interface", statement);
      addMembers(name, statement.members);
    } else if (ts.isClassDeclaration(statement)) {
      add(name, name, "class", statement);
      addMembers(name, statement.members);
    } else if (ts.isEnumDeclaration(statement)) {
      add(name, name, "enum", statement);
      for (const member of statement.members) {
        const memberName = declarationName(member.name);
        if (memberName) {
          add(memberName, `${name}.${memberName}`, "enum-member", member);
        }
      }
    }
  }
  return entries;
}

function parseGo(sourceFile, source) {
  const entries = [];
  const lines = source.split("\n");
  let declarationBlock;
  let braceDepth = 0;
  let container;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (container && braceDepth <= container.depth) container = undefined;
    if (declarationBlock) {
      if (/^\)/u.test(line)) {
        declarationBlock = undefined;
        continue;
      }
      const name = line.match(/^\s*([A-Z][A-Za-z0-9_]*)\b/u)?.[1];
      if (name) {
        entries.push(
          entry(name, name, declarationBlock, sourceFile, lineNumber),
        );
      }
      continue;
    }

    let topLevelDeclaration = false;
    const type = line.match(
      /^type\s+([A-Z][A-Za-z0-9_]*)\s+(struct|interface)\b/u,
    );
    if (type) {
      entries.push(entry(type[1], type[1], type[2], sourceFile, lineNumber));
      container = { name: type[1], kind: type[2], depth: braceDepth };
      topLevelDeclaration = true;
    }
    if (!topLevelDeclaration) {
      const alias = line.match(/^type\s+([A-Z][A-Za-z0-9_]*)\b/u);
      if (alias) {
        entries.push(entry(alias[1], alias[1], "type", sourceFile, lineNumber));
        topLevelDeclaration = true;
      }
    }
    if (!topLevelDeclaration) {
      const method = line.match(
        /^func\s+\(([^)]*)\)\s+([A-Z][A-Za-z0-9_]*)\s*\(/u,
      );
      if (method) {
        const receiver = method[1].match(
          /\*?([A-Za-z][A-Za-z0-9_]*)\s*$/u,
        )?.[1];
        assert.ok(
          receiver,
          `${sourceFile}:${lineNumber}: cannot parse Go receiver`,
        );
        if (/^[A-Z]/u.test(receiver)) {
          entries.push(
            entry(
              method[2],
              `${receiver}.${method[2]}`,
              "method",
              sourceFile,
              lineNumber,
            ),
          );
        }
        topLevelDeclaration = true;
      }
    }
    if (!topLevelDeclaration) {
      const fn = line.match(/^func\s+([A-Z][A-Za-z0-9_]*)\s*\(/u);
      if (fn) {
        entries.push(entry(fn[1], fn[1], "function", sourceFile, lineNumber));
        topLevelDeclaration = true;
      }
    }
    if (!topLevelDeclaration) {
      const declaration = line.match(/^(const|var)\s+([A-Z][A-Za-z0-9_]*)\b/u);
      if (declaration) {
        entries.push(
          entry(
            declaration[2],
            declaration[2],
            declaration[1] === "const" ? "constant" : "variable",
            sourceFile,
            lineNumber,
          ),
        );
        topLevelDeclaration = true;
      }
    }
    if (!topLevelDeclaration) {
      const block = line.match(/^(const|var)\s*\($/u);
      if (block) {
        declarationBlock = block[1] === "const" ? "constant" : "variable";
        topLevelDeclaration = true;
      }
    }

    if (
      !topLevelDeclaration &&
      container &&
      braceDepth === container.depth + 1
    ) {
      if (container.kind === "interface") {
        const method = line.match(
          /^\s*([A-Z][A-Za-z0-9_]*)\s*(?:\[[^\]]+\])?\s*\(/u,
        );
        if (method) {
          entries.push(
            entry(
              method[1],
              `${container.name}.${method[1]}`,
              "method",
              sourceFile,
              lineNumber,
            ),
          );
        }
      } else {
        const fields = line.match(
          /^\s*((?:[A-Z][A-Za-z0-9_]*\s*,\s*)*[A-Z][A-Za-z0-9_]*)\s+\S/u,
        )?.[1];
        if (fields) {
          for (const name of fields.split(",").map((value) => value.trim())) {
            entries.push(
              entry(
                name,
                `${container.name}.${name}`,
                "field",
                sourceFile,
                lineNumber,
              ),
            );
          }
        }
      }
    }
    braceDepth += braceDelta(line);
  }
  return entries;
}

function parseRust(sourceFile, source) {
  const entries = [];
  const lines = source.split("\n");
  let braceDepth = 0;
  let container;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (container && braceDepth <= container.depth) container = undefined;

    const declaration = line.match(
      /^\s*pub(?:\([^)]*\))?\s+(?:(?:async|const|unsafe)\s+)*(struct|enum|trait|type|fn|const|static)\s+([A-Za-z][A-Za-z0-9_]*)/u,
    );
    if (declaration && braceDepth === 0) {
      const [, kind, name] = declaration;
      entries.push(
        entry(
          name,
          name,
          kind === "fn" ? "function" : kind === "const" ? "constant" : kind,
          sourceFile,
          lineNumber,
        ),
      );
      if (kind === "trait") container = { name, kind, depth: braceDepth };
    }

    const implementation = line.match(
      /^\s*impl\s*(?:<[^>]+>\s*)?([A-Za-z][A-Za-z0-9_]*)\b[^\{]*\{/u,
    );
    if (implementation) {
      container = { name: implementation[1], kind: "impl", depth: braceDepth };
    }

    if (container && braceDepth === container.depth + 1) {
      const method = line.match(
        /^\s*(pub(?:\([^)]*\))?\s+)?(?:(?:async|const|unsafe)\s+)*fn\s+([A-Za-z][A-Za-z0-9_]*)\s*(?:<[^>]*>)?\s*\(/u,
      );
      if (method && (container.kind === "trait" || method[1])) {
        const name = method[2];
        entries.push(
          entry(
            name,
            `${container.name}.${name}`,
            "method",
            sourceFile,
            lineNumber,
          ),
        );
      }
    }
    braceDepth += braceDelta(line);
  }
  return entries;
}

function parseJava(sourceFile, source) {
  const entries = [];
  const lines = source.split("\n");
  let braceDepth = 0;
  let container;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (container && braceDepth <= container.depth) container = undefined;

    const declaration = line.match(
      /^\s*public\s+(?:(?:abstract|final|sealed|non-sealed)\s+)*(class|interface|enum|record)\s+([A-Za-z][A-Za-z0-9_]*)/u,
    );
    if (declaration) {
      const [, kind, name] = declaration;
      entries.push(entry(name, name, kind, sourceFile, lineNumber));
      container = { name, kind, depth: braceDepth };
    }

    if (container && braceDepth === container.depth + 1) {
      const constructor = line.match(
        /^\s*public\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/u,
      );
      if (constructor?.[1] === container.name) {
        entries.push(
          entry(
            constructor[1],
            `${container.name}.${constructor[1]}`,
            "constructor",
            sourceFile,
            lineNumber,
          ),
        );
      } else {
        const method = line.match(
          /^\s*(public\s+)?(?:(?:static|final|default|synchronized|abstract)\s+)*(?:<[^>]+>\s+)?(?:[A-Za-z_$][A-Za-z0-9_$.?<>,\[\]]*\s+)+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/u,
        );
        if (method && (container.kind === "interface" || method[1])) {
          const name = method[2];
          entries.push(
            entry(
              name,
              `${container.name}.${name}`,
              "method",
              sourceFile,
              lineNumber,
            ),
          );
        }
      }
    }
    braceDepth += braceDelta(line);
  }
  return entries;
}

function parseCpp(sourceFile, source) {
  const entries = [];
  const lines = source.split("\n");
  let braceDepth = 0;
  let container;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (container && braceDepth <= container.depth) container = undefined;

    const declaration = line.match(
      /^\s*(class|struct|enum(?:\s+class)?)\s+([A-Za-z][A-Za-z0-9_]*)\b/u,
    );
    if (declaration) {
      const [, kind, name] = declaration;
      entries.push(
        entry(
          name,
          name,
          kind.startsWith("enum") ? "enum" : kind,
          sourceFile,
          lineNumber,
        ),
      );
      if (["class", "struct"].includes(kind) && line.includes("{")) {
        container = {
          name,
          depth: braceDepth,
          public: kind === "struct",
        };
      }
    }
    const alias = line.match(/^\s*using\s+([A-Za-z][A-Za-z0-9_]*)\s*=/u);
    if (!container && alias) {
      entries.push(entry(alias[1], alias[1], "type", sourceFile, lineNumber));
    }
    const constant = line.match(
      /^\s*(?:inline\s+)?constexpr\s+[^;=]+\s+([A-Z][A-Z0-9_]*)\b/u,
    );
    if (!container && constant) {
      entries.push(
        entry(constant[1], constant[1], "constant", sourceFile, lineNumber),
      );
    }

    if (container && braceDepth === container.depth + 1) {
      if (/^\s*public\s*:/u.test(line)) container.public = true;
      if (/^\s*(?:private|protected)\s*:/u.test(line)) container.public = false;
      if (container.public) {
        const methodMatches = [
          ...line.matchAll(/(~?[A-Za-z_][A-Za-z0-9_]*)\s*\(/gu),
        ];
        const method = methodMatches.at(-1)?.[1];
        if (
          method &&
          !["if", "for", "while", "switch", "sizeof"].includes(method)
        ) {
          const name = method.startsWith("~") ? method.slice(1) : method;
          entries.push(
            entry(
              name,
              `${container.name}.${method}`,
              method === container.name || method === `~${container.name}`
                ? "constructor"
                : "method",
              sourceFile,
              lineNumber,
            ),
          );
        }
      }
    } else if (!container && line.includes("(") && /;\s*$/u.test(line)) {
      const functionMatches = [
        ...line.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/gu),
      ];
      const name = functionMatches.at(-1)?.[1];
      if (name && !["static_assert", "sizeof"].includes(name)) {
        entries.push(entry(name, name, "function", sourceFile, lineNumber));
      }
    }
    braceDepth += braceDelta(line);
  }
  return entries;
}

const parsers = {
  python: parsePython,
  typescript: parseTypeScript,
  go: parseGo,
  rust: parseRust,
  java: parseJava,
  cpp: parseCpp,
};

function typescriptSourceSelections(repo, commit) {
  const indexPath = "src/index.ts";
  const indexSource = sourceAt(repo, commit, indexPath);
  const selections = new Map([[indexPath, null]]);
  const modulePath = (specifier) => `src/${specifier}.ts`;

  for (const match of indexSource.matchAll(
    /export\s+\*\s+from\s+["']\.\/([^"']+)\.js["']\s*;/gu,
  )) {
    selections.set(modulePath(match[1]), null);
  }

  for (const match of indexSource.matchAll(
    /export\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']\.\/([^"']+)\.js["']\s*;/gu,
  )) {
    const sourceFile = modulePath(match[2]);
    if (selections.get(sourceFile) === null) continue;
    const exportedNames = selections.get(sourceFile) ?? new Set();
    for (const rawSpecifier of match[1].split(",")) {
      const specifier = rawSpecifier.trim();
      if (!specifier) continue;
      const parsed = specifier.match(
        /^(?:type\s+)?([A-Za-z_$][A-Za-z0-9_$]*)(?:\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*)?$/u,
      );
      assert.ok(parsed, `unsupported TypeScript export specifier ${specifier}`);
      exportedNames.add(parsed[1]);
    }
    selections.set(sourceFile, exportedNames);
  }

  return [...selections.entries()]
    .map(([sourceFile, exportedNames]) => ({ sourceFile, exportedNames }))
    .sort((left, right) => compareStrings(left.sourceFile, right.sourceFile));
}

function sourceSelectionsFor(sdk, repo) {
  const allPaths = gitPaths(repo, sdk.commit);
  if (sdk.id === "python") {
    return allPaths
      .filter((sourceFile) =>
        /^src\/missionweaveprotocol\/[A-Za-z0-9_]+\.py$/u.test(sourceFile),
      )
      .map((sourceFile) => ({ sourceFile, exportedNames: null }));
  }
  if (sdk.id === "typescript") {
    return typescriptSourceSelections(repo, sdk.commit);
  }
  if (sdk.id === "go") {
    return allPaths
      .filter(
        (sourceFile) =>
          /^[^/]+\.go$/u.test(sourceFile) && !sourceFile.endsWith("_test.go"),
      )
      .map((sourceFile) => ({ sourceFile, exportedNames: null }));
  }
  if (sdk.id === "rust") {
    const libPath = "src/lib.rs";
    const libSource = sourceAt(repo, sdk.commit, libPath);
    const modules = [...libSource.matchAll(/^mod\s+([a-z][a-z0-9_]*)\s*;/gmu)]
      .map((match) => `src/${match[1]}.rs`)
      .sort();
    return [libPath, ...modules]
      .sort()
      .map((sourceFile) => ({ sourceFile, exportedNames: null }));
  }
  if (sdk.id === "java") {
    return allPaths
      .filter((sourceFile) =>
        /^src\/main\/java\/org\/missionweaveprotocol\/sdk\/.+\.java$/u.test(
          sourceFile,
        ),
      )
      .map((sourceFile) => ({ sourceFile, exportedNames: null }));
  }
  if (sdk.id === "cpp") {
    return allPaths
      .filter((sourceFile) =>
        /^include\/missionweaveprotocol\/.+\.hpp$/u.test(sourceFile),
      )
      .map((sourceFile) => ({ sourceFile, exportedNames: null }));
  }
  assert.fail(`unsupported SDK ${sdk.id}`);
}

function deduplicateEntries(entries) {
  const byKey = new Map();
  for (const candidate of entries) {
    const key = [
      candidate.qualifiedName,
      candidate.kind,
      candidate.sourceFile,
      candidate.line,
    ].join("\0");
    byKey.set(key, candidate);
  }
  return [...byKey.values()].sort(compareEntries);
}

const sourcesRootValue = process.env.MW_SOURCES_ROOT;
assert.ok(sourcesRootValue, "MW_SOURCES_ROOT is required");
assert.equal(
  path.isAbsolute(sourcesRootValue),
  true,
  "MW_SOURCES_ROOT must be absolute",
);
const sourcesRoot = path.resolve(sourcesRootValue);
assert.equal((await stat(sourcesRoot)).isDirectory(), true);

const matrix = JSON.parse(await readFile(matrixPath, "utf8"));
await mkdir(inventoryRoot, { recursive: true });

for (const sdk of matrix.sdks) {
  const repo = path.join(sourcesRoot, repositoryDirectories[sdk.id]);
  assert.equal(
    (await stat(repo)).isDirectory(),
    true,
    `${sdk.id} source repository is missing: ${repo}`,
  );
  assert.equal(
    git(repo, ["rev-parse", `${sdk.commit}^{commit}`]).trim(),
    sdk.commit,
    `${sdk.id} source does not contain the exact pinned commit`,
  );

  const sourceSelections = sourceSelectionsFor(sdk, repo);
  const sourceFiles = sourceSelections.map(({ sourceFile }) => sourceFile);
  assert.ok(sourceFiles.length > 0, `${sdk.id} has no public API source files`);
  const entries = deduplicateEntries(
    sourceSelections.flatMap(({ sourceFile, exportedNames }) => {
      const parsed = parsers[sdk.id](
        sourceFile,
        sourceAt(repo, sdk.commit, sourceFile),
      );
      if (exportedNames === null) return parsed;
      return parsed.filter((candidate) =>
        exportedNames.has(candidate.qualifiedName.split(".", 1)[0]),
      );
    }),
  );
  const symbols = [
    ...new Set(entries.map((candidate) => candidate.name)),
  ].sort();
  for (const required of [
    ...requiredAdmissionTypes,
    ...Object.values(sdk.admissionOperations),
  ]) {
    assert.ok(
      symbols.includes(required),
      `${sdk.id}: missing public API ${required}`,
    );
  }

  const inventory = {
    schemaVersion: 1,
    sdk: sdk.id,
    name: sdk.name,
    repository: sdk.repository,
    commit: sdk.commit,
    package: sdk.package,
    toolchain: sdk.toolchain,
    sourceFiles,
    symbols,
    entries,
  };
  const inventoryPath = path.join(inventoryRoot, `${sdk.id}-api.json`);
  await writeFile(
    inventoryPath,
    await format(`${JSON.stringify(inventory, null, 2)}\n`, {
      filepath: inventoryPath,
    }),
  );
  console.log(
    `${sdk.name}: generated ${entries.length} public API entries from ${sourceFiles.length} exact-pinned source files.`,
  );
}
