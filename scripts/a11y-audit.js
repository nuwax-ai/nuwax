#!/usr/bin/env node
/**
 * Runs an axe-core accessibility snapshot against production-like routes.
 */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const cwd = process.cwd();
const distDir = path.resolve(cwd, 'dist');
const reportDir = path.resolve(cwd, 'reports', 'a11y');
const versionFile = path.resolve(cwd, 'src', 'constants', 'version.ts');
const pnpmCommand = 'pnpm';
const defaultPages = ['/login', '/', '/home', '/square'];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const readOptionalFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const restoreOptionalFile = (filePath, originalContent) => {
  if (originalContent === null) {
    fs.rmSync(filePath, { force: true });
    return;
  }
  fs.writeFileSync(filePath, originalContent);
};

const quoteWindowsArg = (arg) => {
  const value = String(arg);
  return /[\s&()^|<>]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const spawnCommand = process.platform === 'win32' ? 'cmd.exe' : command;
    const spawnArgs =
      process.platform === 'win32'
        ? ['/d', '/c', [command, ...args.map(quoteWindowsArg)].join(' ')]
        : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd,
      env: process.env,
      shell: false,
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let stdout = '';
    let stderr = '';

    if (options.capture) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0 && !options.allowFailure) {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
  });

const createStaticServer = () => {
  const indexPath = path.join(distDir, 'index.html');

  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const safePath = decodeURIComponent(requestUrl.pathname).replace(
      /^\/+/,
      '',
    );
    const candidatePath = path.resolve(distDir, safePath);
    const isInsideDist =
      candidatePath === distDir ||
      candidatePath.startsWith(`${distDir}${path.sep}`);
    const filePath = isInsideDist ? candidatePath : indexPath;

    const sendFile = (resolvedPath) => {
      const extension = path.extname(resolvedPath);
      response.setHeader(
        'Content-Type',
        mimeTypes[extension] || 'application/octet-stream',
      );
      fs.createReadStream(resolvedPath)
        .on('error', () => {
          response.writeHead(404);
          response.end('Not found');
        })
        .pipe(response);
    };

    fs.stat(filePath, (error, stat) => {
      if (!error && stat.isFile()) {
        sendFile(filePath);
        return;
      }
      sendFile(indexPath);
    });
  });
};

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

const parsePages = () => {
  if (!process.env.A11Y_PAGES) {
    return defaultPages;
  }
  return process.env.A11Y_PAGES.split(',')
    .map((page) => page.trim())
    .filter(Boolean);
};

const summarize = (axeResults) => {
  const pages = Array.isArray(axeResults) ? axeResults : [axeResults];
  const violations = pages.flatMap((page) =>
    (page.violations || []).map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes?.length || 0,
      url: page.url,
    })),
  );

  return {
    pages: pages.length,
    violations: violations.length,
    affectedNodes: violations.reduce(
      (sum, violation) => sum + violation.nodes,
      0,
    ),
    topViolations: violations.slice(0, 10),
  };
};

const main = async () => {
  const pages = parsePages();
  const externalBaseUrl = process.env.A11Y_BASE_URL;
  const shouldBuild = !externalBaseUrl && process.env.A11Y_SKIP_BUILD !== '1';
  const originalVersionFile = readOptionalFile(versionFile);
  let server;

  try {
    if (shouldBuild) {
      await run(pnpmCommand, ['run', 'build:prod']);
    }

    const baseUrl =
      externalBaseUrl || (await listen((server = createStaticServer())));
    const urls = pages.map((page) => new URL(page, baseUrl).href);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `axe-${timestamp}.json`);
    const loadDelay = process.env.A11Y_LOAD_DELAY || '1500';
    const timeout = process.env.A11Y_TIMEOUT || '90';
    const tags = process.env.A11Y_TAGS || 'wcag2a,wcag2aa,best-practice';
    const browserArgs = [
      ...(process.env.A11Y_CHROME_PATH
        ? ['--chrome-path', process.env.A11Y_CHROME_PATH]
        : []),
      ...(process.env.A11Y_CHROMEDRIVER_PATH
        ? ['--chromedriver-path', process.env.A11Y_CHROMEDRIVER_PATH]
        : []),
      ...(process.env.A11Y_CHROME_OPTIONS
        ? ['--chrome-options', process.env.A11Y_CHROME_OPTIONS]
        : []),
    ];

    fs.mkdirSync(reportDir, { recursive: true });

    const axeResult = await run(
      pnpmCommand,
      [
        'exec',
        'axe',
        ...urls,
        '--stdout',
        '--exit',
        '--tags',
        tags,
        '--load-delay',
        loadDelay,
        '--timeout',
        timeout,
        ...browserArgs,
      ],
      { allowFailure: true, capture: true },
    );

    let axeJson;
    try {
      axeJson = JSON.parse(axeResult.stdout);
    } catch (error) {
      const failureReport = {
        generatedAt: new Date().toISOString(),
        pages: urls,
        error: 'Failed to parse axe JSON output.',
        stdout: axeResult.stdout,
        stderr: axeResult.stderr,
      };
      fs.writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
      console.error(
        `A11y audit failed before producing valid JSON: ${reportPath}`,
      );
      process.exitCode = axeResult.code || 1;
      return;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      pages: urls,
      tags,
      loadDelayMs: Number(loadDelay),
      timeoutSeconds: Number(timeout),
      summary: summarize(axeJson),
      results: axeJson,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`A11y report written to ${path.relative(cwd, reportPath)}`);
    console.log(
      `Violations: ${report.summary.violations}; affected nodes: ${report.summary.affectedNodes}`,
    );

    process.exitCode = axeResult.code;
  } finally {
    if (server) {
      await closeServer(server);
    }
    if (shouldBuild) {
      restoreOptionalFile(versionFile, originalVersionFile);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
