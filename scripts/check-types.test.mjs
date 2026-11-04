import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  belongsToDomain,
  collectProjectDiagnostics,
  loadDomainConfig,
  runGate,
} from './check-types.mjs';

const scope = (directory) => ({
  directories: [directory],
  files: [],
  filePrefixes: [],
});
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nuwax-typecheck-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, value) => {
    const filename = path.join(root, file);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(
      filename,
      typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`,
    );
  };
  write('src/.umi/tsconfig.json', {
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2022'],
      types: [],
    },
  });
  write('src/.umi/typings.d.ts', '// generated fixture declarations\n');
  write('src/.umi/exports.ts', 'export {};\n');
  write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/**/*.ts'],
  });
  write('src/nodes/example.ts', 'export const name: string = "valid";\n');
  write(
    'src/conversation/example.ts',
    'export const valid: string = "hello";\n',
  );
  write('typecheck-domains.json', {
    schemaVersion: 1,
    domains: {
      nodes: scope('src/nodes'),
      conversation: scope('src/conversation'),
    },
  });
  const collect = (domain = 'all') =>
    collectProjectDiagnostics({
      projectRoot: root,
      domainConfig: loadDomainConfig({ projectRoot: root }),
      domain,
    });
  return { root, write, collect };
}

test('scope directories use boundaries, exact files and path prefixes remain explicit', () => {
  const config = {
    directories: ['src/nodes'],
    files: ['tests/a.ts'],
    filePrefixes: ['tests/workflow'],
  };
  assert.equal(belongsToDomain('src\\nodes\\a.ts', config), true);
  assert.equal(belongsToDomain('src/nodes-next/a.ts', config), false);
  assert.equal(belongsToDomain('tests/a.ts', config), true);
  assert.equal(belongsToDomain('tests/a.tsx', config), false);
  assert.equal(belongsToDomain('tests/workflowSave.test.ts', config), true);
});

test('real TypeScript errors fail until repaired and fail again on recurrence', (t) => {
  const f = fixture(t);
  const files = fs.readdirSync(f.root);
  assert.equal(runGate({ projectRoot: f.root }).passed, true);
  f.write('src/nodes/example.ts', 'export const name: string = 1;\n');
  const failed = runGate({ projectRoot: f.root });
  assert.equal(failed.passed, false);
  assert.equal(failed.collection.diagnostics.nodes[0].code, 2322);
  assert.equal(
    failed.collection.diagnostics.nodes[0].file,
    'src/nodes/example.ts',
  );
  const otherDomain = runGate({ projectRoot: f.root, domain: 'conversation' });
  assert.equal(otherDomain.passed, true);
  assert.equal(otherDomain.collection.outsideDiagnosticCount, 1);
  f.write('src/nodes/example.ts', 'export const name: string = "fixed";\n');
  assert.equal(runGate({ projectRoot: f.root }).passed, true);
  f.write('src/nodes/example.ts', 'export const name: string = 1;\n');
  assert.equal(runGate({ projectRoot: f.root, domain: 'nodes' }).passed, false);
  assert.deepEqual(fs.readdirSync(f.root), files);
});

test('selected domain ignores unrelated legacy missing modules, but gates its own missing modules', (t) => {
  const f = fixture(t);
  f.write(
    'src/conversation/example.ts',
    'import { value } from "missing-module"; export { value };\n',
  );
  const result = runGate({ projectRoot: f.root, domain: 'nodes' });
  assert.equal(result.passed, true);
  assert.equal(result.collection.outsideDiagnosticCount, 1);
  assert.throws(
    () => runGate({ projectRoot: f.root, domain: 'conversation' }),
    /Environment diagnostic/,
  );
});

test('domain ownership cannot be omitted by config includes or excludes', (t) => {
  const f = fixture(t);
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/conversation/**/*.ts'],
  });
  assert.throws(
    () => f.collect('nodes'),
    /files omitted from TypeScript program/,
  );
});

test('missing generated config or declarations fail the gate', (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.root, 'src/.umi/exports.ts'));
  assert.throws(
    () => runGate({ projectRoot: f.root }),
    /Missing generated Umi input/,
  );
  f.write('src/.umi/exports.ts', 'export {};\n');
  fs.unlinkSync(path.join(f.root, 'src/.umi/typings.d.ts'));
  assert.throws(
    () => runGate({ projectRoot: f.root }),
    /Missing generated Umi input/,
  );
  fs.rmSync(path.join(f.root, 'src/.umi'), { recursive: true });
  assert.throws(() => f.collect(), /Missing generated Umi input/);
});

test('generated exports must load and compile even when business roots exclude generated sources', (t) => {
  const f = fixture(t);
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/nodes/**/*.ts', 'src/conversation/**/*.ts'],
  });
  f.write(
    'src/.umi/exports.ts',
    'export { value } from "./missing-generated-plugin";\n',
  );
  assert.throws(
    () => runGate({ projectRoot: f.root }),
    /Invalid generated Umi input/,
  );
});

test('imports of another working tree source or declarations are rejected, while shared dependencies are allowed', (t) => {
  const f = fixture(t);
  const externalRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'nuwax-typecheck-other-'),
  );
  t.after(() => fs.rmSync(externalRoot, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(externalRoot, 'other.ts'),
    'export const value: number = 1;\n',
  );
  fs.writeFileSync(
    path.join(externalRoot, 'decl.d.ts'),
    'export declare const value: number;\n',
  );
  for (const file of ['other', 'decl']) {
    const reference = path.join(externalRoot, file).replaceAll('\\', '/');
    f.write(
      'src/nodes/example.ts',
      `import { value } from ${JSON.stringify(
        reference,
      )}; export const actual: number = value;\n`,
    );
    assert.throws(
      () => f.collect('nodes'),
      /includes source outside this repository/,
    );
  }
  const packageDirectory = path.join(
    externalRoot,
    'node_modules',
    'fixture-package',
  );
  fs.mkdirSync(packageDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(packageDirectory, 'index.ts'),
    'export const value: number = 1;\n',
  );
  const reference = path.join(packageDirectory, 'index').replaceAll('\\', '/');
  f.write(
    'src/nodes/example.ts',
    `import { value } from ${JSON.stringify(
      reference,
    )}; export const actual: number = value;\n`,
  );
  assert.equal(f.collect('nodes').diagnostics.nodes.length, 0);
});

test('malformed or absent domain config and unknown domains fail closed', (t) => {
  const f = fixture(t);
  assert.throws(() => f.collect('unknown'), /Unknown domain/);
  for (const config of [
    '{broken',
    { schemaVersion: 2, domains: {} },
    {
      schemaVersion: 1,
      domains: { nodes: { ...scope('src/nodes'), files: ['../secret.ts'] } },
    },
    {
      schemaVersion: 1,
      domains: { nodes: { directories: [], files: [], filePrefixes: [] } },
    },
  ]) {
    f.write('typecheck-domains.json', config);
    assert.throws(() => loadDomainConfig({ projectRoot: f.root }));
  }
  fs.unlinkSync(path.join(f.root, 'typecheck-domains.json'));
  assert.throws(
    () => loadDomainConfig({ projectRoot: f.root }),
    /Cannot read JSON/,
  );
});

test('malformed, missing, empty-input and weakened TypeScript configs fail closed', (t) => {
  const f = fixture(t);
  for (const config of [
    '{broken',
    { extends: './missing-config.json' },
    { extends: './src/.umi/tsconfig.json', include: [] },
    {
      extends: './src/.umi/tsconfig.json',
      compilerOptions: { strict: false },
      include: ['src/**/*.ts'],
    },
    {
      extends: './src/.umi/tsconfig.json',
      compilerOptions: { noEmit: false },
      include: ['src/**/*.ts'],
    },
    {
      extends: './src/.umi/tsconfig.json',
      compilerOptions: { noImplicitAny: false },
      include: ['src/**/*.ts'],
    },
    {
      extends: './src/.umi/tsconfig.json',
      compilerOptions: { strictBuiltinIteratorReturn: false },
      include: ['src/**/*.ts'],
    },
    {
      extends: './src/.umi/tsconfig.json',
      compilerOptions: { noCheck: true },
      include: ['src/**/*.ts'],
    },
  ]) {
    f.write('tsconfig.typecheck.json', config);
    assert.throws(() => f.collect());
  }
  fs.unlinkSync(path.join(f.root, 'tsconfig.typecheck.json'));
  assert.throws(() => f.collect());
});

test('project option, global and syntax errors fail regardless of selected domain', (t) => {
  const f = fixture(t);
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    compilerOptions: { module: 'CommonJS' },
    include: ['src/**/*.ts'],
  });
  assert.throws(() => f.collect(), /TypeScript project diagnostics/);
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    compilerOptions: { noLib: true, lib: [] },
    include: ['src/**/*.ts'],
  });
  assert.throws(() => f.collect(), /TypeScript project diagnostics/);
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/**/*.ts'],
  });
  f.write('src/conversation/example.ts', 'export const broken = ;\n');
  assert.throws(() => f.collect('nodes'), /TypeScript syntax diagnostics/);
});
