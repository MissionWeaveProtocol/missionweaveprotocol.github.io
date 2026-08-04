import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import {
  buildVerificationChecks,
  verifyPublishedCheck,
} from "./verify-published-site.mjs";

test("verification plan covers the normative publication surfaces", () => {
  const checks = buildVerificationChecks();
  const byPath = new Map(checks.map((check) => [check.path, check]));

  for (const sdk of ["python", "typescript", "go", "rust", "java", "cpp"]) {
    assert.equal(byPath.has(`/0.1/build/sdk/${sdk}/`), true);
  }
  for (const locale of ["zh-cn", "zh-tw", "ja", "es", "fr", "de"]) {
    assert.equal(byPath.has(`/${locale}/0.1/learn/`), true);
    assert.equal(
      byPath.has(
        `/${locale}/0.1/reference/specification/first-admission-and-historical-trust/`,
      ),
      true,
    );
  }
  for (const path of [
    "/learn/",
    "/build/sdk/python/",
    "/reference/specification/",
    "/docs/0.1/child-missions/",
    "/sdk/go/",
    "/reference/conformance/",
    "/artifacts/0.1/normative-release.json",
    "/artifacts/0.1/protocol/schemas/first-admission-record.schema.json",
  ]) {
    assert.equal(byPath.has(path), true, `missing ${path}`);
  }
  assert.equal(new Set(checks.map((check) => check.path)).size, checks.length);
});

test("HTTP verification follows redirects and validates the final response", async (t) => {
  const canonicalPath = "/0.1/learn/";
  const marker =
    '<link rel="canonical" href="https://example.test/0.1/learn/"/>';
  const server = createServer((request, response) => {
    if (request.url === "/learn/") {
      response.writeHead(302, { location: canonicalPath });
      response.end();
      return;
    }
    if (request.url === canonicalPath) {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<html><head>${marker}</head><body>Learn</body></html>`);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);

  await verifyPublishedCheck(`http://127.0.0.1:${address.port}`, {
    label: "Latest Learn alias",
    path: "/learn/",
    expectedPath: canonicalPath,
    contentType: "text/html",
    marker,
  });
});

test("HTTP verification follows Astro static redirect documents", async (t) => {
  const canonicalPath = "/0.1/learn/";
  const marker =
    '<link rel="canonical" href="https://example.test/0.1/learn/"/>';
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    if (request.url === "/learn/") {
      response.end(
        `<html><head><meta http-equiv="refresh" content="0;url=${canonicalPath}">${marker.replace("/>", ">")}</head></html>`,
      );
      return;
    }
    if (request.url === canonicalPath) {
      response.end(`<html><head>${marker}</head><body>Learn</body></html>`);
      return;
    }
    response.end("<html>not found</html>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);

  await verifyPublishedCheck(`http://127.0.0.1:${address.port}`, {
    label: "static Latest Learn alias",
    path: "/learn/",
    expectedPath: canonicalPath,
    contentType: "text/html",
    marker,
  });
});

test("HTTP verification rejects a wrong final route", async (t) => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html" });
    response.end("<html>wrong page</html>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);

  await assert.rejects(
    verifyPublishedCheck(`http://127.0.0.1:${address.port}`, {
      label: "broken alias",
      path: "/alias/",
      expectedPath: "/0.1/learn/",
      contentType: "text/html",
      marker: "expected marker",
    }),
    /final URL/u,
  );
});
