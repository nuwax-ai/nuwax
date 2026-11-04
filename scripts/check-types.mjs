import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const tsExtensions = ['.ts', '.tsx', '.mts', '.cts'];
const infrastructureCodes = new Set([2307, 2688, 2591]);
const strictOptions = [
  'noImplicitAny',
  'noImplicitThis',
  'strictNullChecks',
  'strictFunctionTypes',
  'strictBindCallApply',
  'strictPropertyInitialization',
  'strictBuiltinIteratorReturn',
  'alwaysStrict',
  'useUnknownInCatchVariables',
];

export class TypecheckGateError extends Error {}

function fail(message) {
  throw new TypecheckGateError(message);
}

function slash(value) {
  return value.replaceAll('\\', '/');
}

function relativePath(value, label) {
  if (
    typeof value !== 'string' ||
    !value ||
    value !== slash(value) ||
    value.startsWith('/') ||
    /^[a-z]:/i.test(value) ||
    value
      .split('/')
      .some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    fail(`${label} must be a normalized repository-relative path`);
  }
  return value;
}

function readJson(filename) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    fail(`Cannot read JSON ${filename}: ${error.message}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Scope is explicit: directories recurse, files are exact, filePrefixes match paths. */
export function loadDomainConfig({
  projectRoot = scriptRoot,
  configPath = 'typecheck-domains.json',
} = {}) {
  const config = readJson(path.resolve(projectRoot, configPath));
  if (
    !isObject(config) ||
    config.schemaVersion !== 1 ||
    !isObject(config.domains) ||
    Object.keys(config.domains).length === 0 ||
    Object.keys(config).some(
      (key) => !['schemaVersion', 'domains'].includes(key),
    )
  ) {
    fail('Invalid typecheck domain configuration (schemaVersion must be 1)');
  }
  for (const [name, scope] of Object.entries(config.domains)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || name === 'all' || !isObject(scope)) {
      fail(`Invalid domain: ${name}`);
    }
    if (
      Object.keys(scope).some(
        (key) => !['directories', 'files', 'filePrefixes'].includes(key),
      )
    ) {
      fail(`Unknown scope option in domain ${name}`);
    }
    let entries = 0;
    for (const key of ['directories', 'files', 'filePrefixes']) {
      if (!Array.isArray(scope[key])) fail(`${name}.${key} must be an array`);
      const seen = new Set();
      for (const entry of scope[key]) {
        relativePath(entry, `${name}.${key}`);
        if (seen.has(entry)) fail(`Duplicate scope path: ${name}/${entry}`);
        if (
          key === 'files' &&
          !tsExtensions.some((extension) => entry.endsWith(extension))
        ) {
          fail(`Scope file must be TypeScript: ${entry}`);
        }
        seen.add(entry);
        entries += 1;
      }
    }
    if (!entries) fail(`Empty domain scope: ${name}`);
  }
  return config;
}

function selectedDomains(config, domain) {
  const names = domain === 'all' ? Object.keys(config.domains) : [domain];
  for (const name of names) {
    if (!Object.hasOwn(config.domains, name)) fail(`Unknown domain: ${name}`);
  }
  return names;
}

export function belongsToDomain(file, scope) {
  const normalized = slash(file);
  return (
    scope.files.includes(normalized) ||
    scope.directories.some((directory) =>
      normalized.startsWith(`${directory}/`),
    ) ||
    scope.filePrefixes.some((prefix) => normalized.startsWith(prefix))
  );
}

function diagnosticRecord(diagnostic, projectRoot) {
  const file = slash(path.relative(projectRoot, diagnostic.file.fileName));
  const position = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  return {
    file,
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    line: position.line + 1,
    column: position.character + 1,
  };
}

function display(record) {
  return `${record.file}:${record.line}:${record.column} TS${record.code} ${record.message}`;
}

function scopeFiles(projectRoot, scope, name) {
  const files = new Set();
  for (const directory of scope.directories) {
    const absolute = path.resolve(projectRoot, directory);
    if (!ts.sys.directoryExists(absolute))
      fail(`Missing scope directory: ${name}/${directory}`);
    const found = ts.sys.readDirectory(absolute, tsExtensions, [
      '**/node_modules/**',
    ]);
    if (!found.length)
      fail(`No TypeScript inputs in scope directory: ${name}/${directory}`);
    for (const filename of found) files.add(path.resolve(filename));
  }
  for (const file of scope.files) {
    const absolute = path.resolve(projectRoot, file);
    if (!ts.sys.fileExists(absolute))
      fail(`Missing scope file: ${name}/${file}`);
    files.add(absolute);
  }
  for (const prefix of scope.filePrefixes) {
    const absoluteDirectory = path.resolve(projectRoot, path.dirname(prefix));
    const found = ts.sys
      .readDirectory(absoluteDirectory, tsExtensions, ['**/node_modules/**'])
      .filter((file) =>
        slash(path.relative(projectRoot, file)).startsWith(prefix),
      );
    if (!found.length)
      fail(`No TypeScript inputs for scope prefix: ${name}/${prefix}`);
    for (const filename of found) files.add(path.resolve(filename));
  }
  return [...files].sort();
}

/** One full-project program preserves the existing compiler and import semantics. */
export function collectProjectDiagnostics({
  projectRoot = scriptRoot,
  domainConfig = loadDomainConfig({ projectRoot }),
  domain = 'all',
} = {}) {
  projectRoot = path.resolve(projectRoot);
  const domains = selectedDomains(domainConfig, domain);
  const generatedInputs = [
    'src/.umi/tsconfig.json',
    'src/.umi/typings.d.ts',
    'src/.umi/exports.ts',
  ];
  for (const generated of generatedInputs) {
    if (!ts.sys.fileExists(path.resolve(projectRoot, generated))) {
      fail(
        `Missing generated Umi input: ${generated}; run the existing setup step`,
      );
    }
  }
  const configFile = path.resolve(projectRoot, 'tsconfig.typecheck.json');
  const read = ts.readConfigFile(configFile, ts.sys.readFile);
  if (read.error)
    fail(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    projectRoot,
    undefined,
    configFile,
  );
  if (parsed.errors.length)
    fail(
      parsed.errors
        .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
        .join('\n'),
    );
  if (!parsed.fileNames.length) fail('The TypeScript project has no inputs');
  if (
    parsed.options.strict !== true ||
    parsed.options.noEmit !== true ||
    parsed.options.noCheck === true
  ) {
    fail(
      'Typecheck requires existing strict: true, noEmit: true, and noCheck disabled',
    );
  }
  for (const option of strictOptions) {
    if (parsed.options[option] === false)
      fail(`Typecheck strict option must not be disabled: ${option}`);
  }
  let program;
  try {
    program = ts.createProgram(
      [
        ...new Set([
          ...parsed.fileNames,
          ...generatedInputs
            .filter((file) => file.endsWith('.ts'))
            .map((file) => path.resolve(projectRoot, file)),
        ]),
      ],
      parsed.options,
    );
  } catch (error) {
    fail(`Cannot create TypeScript program: ${error.message}`);
  }
  const global = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ];
  if (global.length)
    fail(
      `TypeScript project diagnostics:\n${global
        .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
        .join('\n')}`,
    );
  const syntax = program.getSyntacticDiagnostics();
  if (syntax.length)
    fail(
      `TypeScript syntax diagnostics:\n${syntax
        .map((item) =>
          item.file
            ? display(diagnosticRecord(item, projectRoot))
            : ts.flattenDiagnosticMessageText(item.messageText, '\n'),
        )
        .join('\n')}`,
    );
  // A generated alias must not silently check another working tree. Shared
  // installed dependencies are allowed, including their pnpm realpaths.
  const externalSources = program.getSourceFiles().filter((file) => {
    const absolute = path.resolve(file.fileName);
    const relative = path.relative(projectRoot, absolute);
    const outside =
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative);
    return outside && !slash(absolute).includes('/node_modules/');
  });
  if (externalSources.length) {
    fail(
      `TypeScript program includes source outside this repository:\n${externalSources
        .map((file) => slash(file.fileName))
        .join('\n')}`,
    );
  }
  const inputs = new Set(
    program.getSourceFiles().map((file) => path.resolve(file.fileName)),
  );
  const scopedFiles = {};
  for (const name of domains) {
    const files = scopeFiles(projectRoot, domainConfig.domains[name], name);
    const missing = files.filter((file) => !inputs.has(file));
    if (missing.length)
      fail(
        `Domain ${name} files omitted from TypeScript program:\n${missing
          .map((file) => slash(path.relative(projectRoot, file)))
          .join('\n')}`,
      );
    scopedFiles[name] = files.map((file) =>
      slash(path.relative(projectRoot, file)),
    );
  }
  const rawDiagnostics = program.getSemanticDiagnostics();
  if (rawDiagnostics.some((item) => !item.file))
    fail('TypeScript returned a diagnostic without a file');
  const diagnostics = Object.fromEntries(domains.map((name) => [name, []]));
  let outsideDiagnosticCount = 0;
  for (const diagnostic of rawDiagnostics) {
    const record = diagnosticRecord(diagnostic, projectRoot);
    if (record.file.startsWith('src/.umi/')) {
      fail(`Invalid generated Umi input: ${display(record)}`);
    }
    let owned = false;
    for (const name of domains) {
      if (!belongsToDomain(record.file, domainConfig.domains[name])) continue;
      owned = true;
      if (infrastructureCodes.has(record.code)) {
        fail(`Environment diagnostic in ${name}: ${display(record)}`);
      }
      diagnostics[name].push(record);
    }
    if (!owned) outsideDiagnosticCount += 1;
  }
  return {
    typescriptVersion: ts.version,
    diagnostics,
    scopedFiles,
    outsideDiagnosticCount,
  };
}

export function runGate({ projectRoot = scriptRoot, domain = 'all' } = {}) {
  const collection = collectProjectDiagnostics({ projectRoot, domain });
  return {
    collection,
    passed: Object.values(collection.diagnostics).every(
      (records) => records.length === 0,
    ),
  };
}

export function runCli(args = process.argv.slice(2)) {
  let domain = 'all';
  let domainSet = false;
  try {
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === '--domain' && !domainSet && args[index + 1]) {
        domain = args[++index];
        domainSet = true;
      } else if (args[index] === '--help' && args.length === 1) {
        console.log('Usage: node scripts/check-types.mjs [--domain NAME|all]');
        return 0;
      } else {
        fail(`Unknown or incomplete argument: ${args[index]}`);
      }
    }
    const result = runGate({ domain });
    for (const [name, records] of Object.entries(
      result.collection.diagnostics,
    )) {
      console.log(
        `${name}: ${result.collection.scopedFiles[name].length} files checked, ${records.length} diagnostics`,
      );
    }
    console.log(
      `Outside selected domains: ${result.collection.outsideDiagnosticCount} diagnostics (not gated)`,
    );
    for (const [name, records] of Object.entries(
      result.collection.diagnostics,
    )) {
      for (const record of records)
        console.error(`${name}: ${display(record)}`);
    }
    console.log(
      result.passed
        ? 'Typecheck domain gate passed'
        : 'Typecheck domain gate failed',
    );
    return result.passed ? 0 : 1;
  } catch (error) {
    console.error(`Typecheck gate unavailable: ${error.message}`);
    return 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = runCli();
}
