import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cliPath = new URL("../dist/cli.js", import.meta.url);

test("metadata corpus commands appear in help", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    cliPath.pathname,
    "--help",
  ]);

  assert.match(stdout, /corpus init/);
  assert.match(stdout, /corpus repos/);
  assert.match(stdout, /corpus prs/);
  assert.match(stdout, /corpus delete-pr/);
  assert.match(stdout, /corpus delete-repo/);
  assert.match(stdout, /--limit/);
  assert.doesNotMatch(stdout, new RegExp("corpus\\s+index"));
  assert.doesNotMatch(stdout, new RegExp("corpus\\s+search"));
});

test("corpus prs requires a repository", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "corpus",
      "prs",
      "--db",
      "file:test.db",
    ]),
    /corpus prs requires a repository/,
  );
});

test("corpus commands reject unexpected extra positionals", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "corpus",
      "init",
      "typo",
      "--db",
      "file:test.db",
    ]),
    /corpus init does not accept extra positional arguments/,
  );

  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "corpus",
      "repos",
      "extra",
      "--db",
      "file:test.db",
    ]),
    /corpus repos does not accept extra positional arguments/,
  );

  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "corpus",
      "delete-pr",
      "owner/name",
      "123",
      "stale",
      "--db",
      "file:test.db",
    ]),
    /corpus delete-pr does not accept extra positional arguments/,
  );

  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "corpus",
      "delete-repo",
      "owner/name",
      "stale",
      "--db",
      "file:test.db",
    ]),
    /corpus delete-repo does not accept extra positional arguments/,
  );
});

test("existing commands still reject unexpected positionals", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [
      cliPath.pathname,
      "generate",
      "unexpected",
    ]),
    /Unexpected argument/,
  );
});
