import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';
import {
  belongsToDomain,
  buildBaseline,
  collectProjectDiagnostics,
  compareBaseline,
  loadBaseline,
  loadDomainConfig,
  normalizeMessage,
  pruneBaseline,
  runGate,
} from './check-types.mjs';

const scope = (directory) => ({
  directories: [directory],
  files: [],
  filePrefixes: [],
});
const diagnostic = (overrides = {}) => ({
  file: 'src/nodes/example.ts',
  code: 2322,
  message: "Type 'number' is not assignable to type 'string'.",
  line: 1,
  column: 7,
  ...overrides,
});
const collection = (records = [diagnostic()], domain = 'nodes') => ({
  typescriptVersion: ts.version,
  diagnostics: { [domain]: records },
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
  write('src/nodes/example.ts', 'export const name: string = 1;\n');
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
  const seed = () => {
    const baseline = buildBaseline(collect());
    write('typecheck-baseline.json', baseline);
    return baseline;
  };
  return { root, write, collect, seed };
}

test('baseline keys retain full messages and counts, but omit moving locations', () => {
  const initial = collection([diagnostic(), diagnostic({ line: 3 })]);
  const baseline = buildBaseline(initial);
  assert.deepEqual(baseline.domains.nodes, [
    {
      file: diagnostic().file,
      code: 2322,
      message: diagnostic().message,
      count: 2,
    },
  ]);
  const moved = collection([
    diagnostic({ line: 100, column: 12 }),
    diagnostic({ line: 101 }),
  ]);
  assert.equal(compareBaseline(moved, baseline).passed, true);
  const increased = compareBaseline(
    collection([...moved.diagnostics.nodes, diagnostic()]),
    baseline,
  );
  assert.equal(increased.added[0].count, 1);
  assert.deepEqual(increased.added[0].locations[0], { line: 100, column: 12 });
});

test('same error code with changed message, file, or code creates new debt', () => {
  const baseline = buildBaseline(collection());
  for (const overrides of [
    { message: 'Different full message.' },
    { file: 'src/nodes/new.ts' },
    { code: 2345 },
  ]) {
    const result = compareBaseline(
      collection([diagnostic(overrides)]),
      baseline,
    );
    assert.equal(result.added.length, 1);
    assert.equal(result.stale.length, 1);
  }
});

test('dependency and repository references normalize across macOS and Windows', () => {
  const mac =
    'import("/Users/a/project/node_modules/.pnpm/@antv+x6@3.1.7/node_modules/@antv/x6/lib/model/animation").Animation in File "/Users/a/project/src/nodes/a.ts"';
  const windows =
    'import("C:\\Users\\b\\project\\node_modules\\.pnpm\\@antv+x6@3.1.7\\node_modules\\@antv\\x6\\lib\\model\\animation").Animation in File "C:\\Users\\b\\project\\src\\nodes\\a.ts"';
  assert.equal(
    normalizeMessage(mac, '/Users/a/project'),
    normalizeMessage(windows, 'C:\\Users\\b\\project'),
  );
  assert.equal(
    normalizeMessage(
      "import('/a shared/dependencies/node_modules/pkg/index').Type",
      '/repo',
    ),
    "import('node_modules/pkg/index').Type",
  );
  assert.equal(
    normalizeMessage('first\r\nsecond\rthird', '/repo'),
    'first\nsecond\nthird',
  );
});

test('ordinary type strings retain backslashes and cannot merge diagnostic keys', () => {
  const backward = normalizeMessage(
    "Type 'a\\b' is not assignable to type 'target'.",
    '/repo',
  );
  const forward = normalizeMessage(
    "Type 'a/b' is not assignable to type 'target'.",
    '/repo',
  );
  assert.notEqual(backward, forward);
  assert.equal(backward, "Type 'a\\b' is not assignable to type 'target'.");
  for (const text of [
    "Type '\"C:\\repo\\x\"' is not assignable to type 'target'.",
    "Type '\"C:/repo/x\"' is not assignable to type 'target'.",
    'Type \'"C:\\deps\\node_modules\\pkg\\value"\' is not assignable.',
  ]) {
    assert.equal(normalizeMessage(text, 'C:\\repo'), text);
  }
  const baseline = buildBaseline(
    collection([diagnostic({ message: backward })]),
  );
  assert.equal(
    compareBaseline(collection([diagnostic({ message: forward })]), baseline)
      .added.length,
    1,
  );
  assert.equal(
    normalizeMessage(
      "Type 'relative\\node_modules\\literal' is not assignable.",
      '/repo',
    ),
    "Type 'relative\\node_modules\\literal' is not assignable.",
  );
  assert.equal(
    normalizeMessage(
      'File "C:\\repo\\src\\a folder\\b.ts" has a type error.',
      'C:\\repo',
    ),
    'File "src/a folder/b.ts" has a type error.',
  );
});

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

test('comparison and prune isolate selected domains and preserve other domains', () => {
  const initial = {
    typescriptVersion: ts.version,
    diagnostics: {
      nodes: [diagnostic()],
      conversation: [diagnostic({ file: 'src/conversation/a.ts' })],
    },
  };
  const baseline = buildBaseline(initial);
  assert.equal(compareBaseline(collection(), baseline).passed, true);
  const next = pruneBaseline(collection([]), baseline);
  assert.deepEqual(next.domains.nodes, []);
  assert.deepEqual(next.domains.conversation, baseline.domains.conversation);
  assert.notEqual(next.domains, baseline.domains);
});

test('prune only removes debt, reducing counts requires review, and resurrection is new debt', () => {
  const baseline = buildBaseline(collection([diagnostic(), diagnostic()]));
  const result = compareBaseline(collection(), baseline);
  assert.equal(result.passed, false);
  assert.equal(result.stale[0].count, 1);
  const next = pruneBaseline(collection(), baseline);
  assert.equal(next.domains.nodes[0].count, 1);
  assert.equal(
    compareBaseline(collection([diagnostic(), diagnostic()]), next).added[0]
      .count,
    1,
  );
  assert.throws(
    () => pruneBaseline(collection([diagnostic({ message: 'new' })]), baseline),
    /Refusing to prune/,
  );
});

test('real TypeScript errors are accepted only by an exact reviewed baseline; default is read-only', (t) => {
  const f = fixture(t);
  const baseline = f.seed();
  assert.equal(baseline.domains.nodes[0].code, 2322);
  const before = fs.readFileSync(
    path.join(f.root, 'typecheck-baseline.json'),
    'utf8',
  );
  assert.equal(runGate({ projectRoot: f.root }).passed, true);
  assert.equal(
    fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    before,
  );
  f.write('src/nodes/example.ts', '\n\nexport const name: string = 1;\n');
  assert.equal(runGate({ projectRoot: f.root, domain: 'nodes' }).passed, true);
  f.write(
    'src/nodes/example.ts',
    'export const name: string = 1; export const other: string = 2;\n',
  );
  const result = runGate({ projectRoot: f.root });
  assert.equal(result.passed, false);
  assert.equal(result.comparison.added[0].count, 1);
});

test('real TypeScript cleanup fails stale, prune removes it, and recurrence fails', (t) => {
  const f = fixture(t);
  f.seed();
  f.write('src/nodes/example.ts', 'export const name: string = "fixed";\n');
  const stale = runGate({ projectRoot: f.root });
  assert.equal(stale.passed, false);
  assert.equal(stale.comparison.stale.length, 1);
  const result = runGate({ projectRoot: f.root, domain: 'nodes', prune: true });
  assert.equal(result.passed, true);
  assert.equal(result.pruned, true);
  assert.deepEqual(
    JSON.parse(
      fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    ).domains.nodes,
    [],
  );
  f.write('src/nodes/example.ts', 'export const name: string = 1;\n');
  assert.equal(runGate({ projectRoot: f.root }).passed, false);
});

test('prune refuses new diagnostics before any write', (t) => {
  const f = fixture(t);
  f.seed();
  const before = fs.readFileSync(
    path.join(f.root, 'typecheck-baseline.json'),
    'utf8',
  );
  f.write(
    'src/nodes/example.ts',
    'export const name: string = 1; export const other: boolean = 2;\n',
  );
  assert.throws(
    () => runGate({ projectRoot: f.root, prune: true }),
    /Refusing to prune/,
  );
  assert.equal(
    fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    before,
  );
  assert.equal(
    fs.readdirSync(f.root).some((file) => file.includes('.tmp-')),
    false,
  );
});

test('selected domain ignores unrelated legacy missing modules, but gates its own missing modules', (t) => {
  const f = fixture(t);
  f.seed();
  f.write(
    'src/conversation/example.ts',
    'import { value } from "missing-module"; export { value };\n',
  );
  const result = runGate({ projectRoot: f.root, domain: 'nodes' });
  assert.equal(result.passed, true);
  assert.equal(result.collection.outsideDiagnosticCount, 1);
  assert.throws(
    () => runGate({ projectRoot: f.root, domain: 'conversation' }),
    /Unbaselinable environment diagnostic/,
  );
});

test('domain ownership cannot be omitted by config includes or excludes', (t) => {
  const f = fixture(t);
  f.seed();
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/conversation/**/*.ts'],
  });
  assert.throws(
    () => f.collect('nodes'),
    /files omitted from TypeScript program/,
  );
});

test('missing generated config or declarations fail before baseline pruning writes', (t) => {
  const f = fixture(t);
  f.seed();
  const before = fs.readFileSync(
    path.join(f.root, 'typecheck-baseline.json'),
    'utf8',
  );
  fs.unlinkSync(path.join(f.root, 'src/.umi/exports.ts'));
  assert.throws(
    () => runGate({ projectRoot: f.root, prune: true }),
    /Missing generated Umi input/,
  );
  assert.equal(
    fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    before,
  );
  f.write('src/.umi/exports.ts', 'export {};\n');
  fs.unlinkSync(path.join(f.root, 'src/.umi/typings.d.ts'));
  assert.throws(
    () => runGate({ projectRoot: f.root, prune: true }),
    /Missing generated Umi input/,
  );
  assert.equal(
    fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    before,
  );
  fs.rmSync(path.join(f.root, 'src/.umi'), { recursive: true });
  assert.throws(() => f.collect(), /Missing generated Umi input/);
});

test('generated exports must load and compile even when business roots exclude generated sources', (t) => {
  const f = fixture(t);
  f.seed();
  const before = fs.readFileSync(
    path.join(f.root, 'typecheck-baseline.json'),
    'utf8',
  );
  f.write('tsconfig.typecheck.json', {
    extends: './src/.umi/tsconfig.json',
    include: ['src/nodes/**/*.ts', 'src/conversation/**/*.ts'],
  });
  f.write(
    'src/.umi/exports.ts',
    'export { value } from "./missing-generated-plugin";\n',
  );
  assert.throws(
    () => runGate({ projectRoot: f.root, prune: true }),
    /Invalid generated Umi input/,
  );
  assert.equal(
    fs.readFileSync(path.join(f.root, 'typecheck-baseline.json'), 'utf8'),
    before,
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

test('project option, global and syntax errors cannot be baselined', (t) => {
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

test('baseline schema, exact compiler version and full domain coverage are enforced', (t) => {
  const f = fixture(t);
  const baseline = f.seed();
  const domainConfig = loadDomainConfig({ projectRoot: f.root });
  for (const bad of [
    { ...baseline, typescriptVersion: '0.0.0' },
    { ...baseline, domains: { nodes: baseline.domains.nodes } },
    {
      ...baseline,
      domains: {
        ...baseline.domains,
        nodes: [...baseline.domains.nodes, ...baseline.domains.nodes],
      },
    },
    {
      ...baseline,
      domains: {
        ...baseline.domains,
        nodes: [{ ...baseline.domains.nodes[0], code: 2307 }],
      },
    },
  ]) {
    f.write('typecheck-baseline.json', bad);
    assert.throws(() => loadBaseline({ projectRoot: f.root, domainConfig }));
  }
  fs.unlinkSync(path.join(f.root, 'typecheck-baseline.json'));
  assert.throws(() => runGate({ projectRoot: f.root }), /Cannot read JSON/);
});
