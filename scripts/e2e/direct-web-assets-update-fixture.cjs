/**
 * A/B 版本验收：真实 Chromium / Electron webview + 当前源码服务与徽标。
 * 隔离临时产物与 Electron profile；桥与登录标记为夹具，不验证真实账号/安装包。
 * node scripts/e2e/direct-web-assets-update-fixture.cjs serve
 * NUWAX_WEB_UPDATE_ORIGIN=http://127.0.0.1:PORT node scripts/e2e/direct-web-assets-update-fixture.cjs electron
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const shell =
  process.env.NUWAX_SHELL_ROOT ||
  path.resolve(root, '../nuwa-electron-shell/crates/agent-electron-client');
const fromFrontend = createRequire(path.join(root, 'package.json'));
const fromShell = createRequire(path.join(shell, 'package.json'));
const HASH_A = 'aaaaaaa111';
const HASH_B = 'bbbbbbb222';
const CSS_A = 'p__Home__index.aaaa1111.chunk.css';
const CSS_B = 'p__Home__index.bbbb2222.chunk.css';

async function serve() {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), 'nuwax-web-assets-update-'),
  );
  const a = path.join(temp, 'a');
  const b = path.join(temp, 'b');
  const snap = path.join(temp, 'snapshot');
  await Promise.all([fs.mkdir(a), fs.mkdir(b)]);
  const badge = path.join(
    root,
    'src/features/client-shell/WebVersionBadge.tsx',
  );
  const service = path.join(
    root,
    'src/features/client-shell/webUpdateService.ts',
  );
  const buildInfo = path.join(
    root,
    'src/features/client-shell/pageBuildInfo.ts',
  );
  await fromFrontend('esbuild').build({
    stdin: {
      resolveDir: root,
      loader: 'tsx',
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
import WebVersionBadge from ${JSON.stringify(badge)};
import ClientVersionBadge from ${JSON.stringify(
        path.join(root, 'src/features/client-shell/ClientVersionBadge.tsx'),
      )};
import {start as startClient, stop as stopClient} from ${JSON.stringify(
        path.join(root, 'src/features/client-shell/clientUpdateService.ts'),
      )};
import {getLatestWebBuildInfo, initWebUpdateCheck, subscribeWebUpdate} from ${JSON.stringify(
        service,
      )};
import {getPageBuildInfo} from ${JSON.stringify(buildInfo)};
window.fixtureBuildInfo=getPageBuildInfo(); window.fixtureEvents=[];
window.fixtureLatestWebBuildInfo=getLatestWebBuildInfo;
const dispose=initWebUpdateCheck();
subscribeWebUpdate(available=>window.fixtureEvents.push({available,at:Date.now()}));
window.addEventListener('pagehide',dispose,{once:true});
window.fixtureSetClientStatus=status=>{window.fixtureClientState={hostVersion:'3.0.11-beta.6',status,...(status==='not-available'?{}:{version:'3.0.12'})};stopClient();startClient();};
createRoot(document.getElementById('header')).render(<><span>女娲 Nuwax</span><ClientVersionBadge/><WebVersionBadge/></>);
window.fixtureLoadLazyCss=()=>new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=window.fixtureCss;link.onload=()=>resolve(true);link.onerror=reject;document.head.appendChild(link);});
window.fixtureForeground=()=>document.dispatchEvent(new Event('visibilitychange'));`,
    },
    outfile: path.join(a, 'app.1234abcd.js'),
    bundle: true,
    platform: 'browser',
    nodePaths: [path.join(root, 'node_modules')],
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
      {
        name: 'fixture-host',
        setup(build) {
          build.onResolve({ filter: /^@\/utils\/hostBridge$/ }, (args) => ({
            path: args.path,
            namespace: 'fixture',
          }));
          build.onResolve({ filter: /^@\/services\/i18nRuntime$/ }, (args) => ({
            path: args.path,
            namespace: 'fixture',
          }));
          build.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
            loader: 'js',
            contents: args.path.includes('i18nRuntime')
              ? `export const dict=k=>({'PC.Components.WebUpdate.refreshHint':'网页已更新，点击刷新','PC.Components.WebUpdate.current':'当前','PC.Components.WebUpdate.latest':'最新','PC.Components.WebUpdate.version':'版本号','PC.Components.WebUpdate.buildAt':'构建时间','PC.Components.ClientUpdate.update':'更新','PC.Components.ClientUpdate.download':'下载更新','PC.Components.ClientUpdate.versionLabel':'客户端版本'})[k]||k;`
              : `export const hasHostBridge=()=>!!window.NuwaClawBridge;
export const isDesktopHost=()=>!!window.NuwaClawBridge;
export const getHostProduct=()=>window.NuwaClawBridge?.host?.getProduct?.()||null;
export const hostBridge={host:{getProduct:()=>window.NuwaClawBridge?.host?.getProduct?.()||null},auth:{getContext:async()=>window.NuwaClawBridge?.auth?.getContext?.()||null},updater:{getState:async()=>window.NuwaClawBridge?.updater?.getState?.()||null,download:async()=>({success:true}),install:async()=>({success:false})}};`,
          }));
        },
      },
    ],
  });
  await fs.copyFile(
    path.join(a, 'app.1234abcd.js'),
    path.join(b, 'app.1234abcd.js'),
  );
  const css =
    '.fixture-model-icon{width:14px;height:14px;vertical-align:middle}.fixture-input{width:440px;height:80px;border:1px solid #ddd;border-radius:16px;padding:16px;font-size:16px}.fixture-toolbar{display:flex;gap:20px;align-items:center;margin-top:12px}';
  function html(hash, filename) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="nuwax-build-git-hash" content="${hash}"><meta name="nuwax-build-version" content="1.2.0"><style>:root{--xagi-color-primary-bg:#f0f3ff;--xagi-color-primary:#5262ff;--xagi-color-text-secondary:rgba(0,0,0,.65);--xagi-color-text-tertiary:rgba(0,0,0,.45);--xagi-color-border-secondary:#f0f0f0}body{font-family:system-ui;margin:32px;background:#f8f9fa}#header{display:flex;align-items:center;height:40px;margin-bottom:32px}main{background:white;padding:24px;border-radius:20px;width:520px}h1{font-size:22px}</style></head><body><div id="header"></div><main><h1>发版后旧页面资源验收</h1><textarea class="fixture-input" placeholder="正在编辑的内容"></textarea><div class="fixture-toolbar"><img id="model-icon" class="fixture-model-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Ccircle cx='128' cy='128' r='128' fill='%234e64ff'/%3E%3C/svg%3E"><span>deepseek-v4-flash</span></div></main><script>window.fixtureCss=${JSON.stringify(
      '/' + filename,
    )};window.fixtureClientState={hostVersion:'3.0.11-beta.6',status:'idle'};const fixtureMode=new URLSearchParams(location.search).get('host');if(fixtureMode==='direct'||fixtureMode==='loopback'){window.NuwaClawBridge={host:{getProduct:()=> 'nuwax'},auth:{getContext:async()=>{window.fixtureContextRequested=true;return {loadMode:fixtureMode}}},updater:{getState:async()=>window.fixtureClientState}};}</script><script src="/app.1234abcd.js"></script></body></html>`;
  }
  for (const [dir, hash, filename] of [
    [a, HASH_A, CSS_A],
    [b, HASH_B, CSS_B],
  ]) {
    await fs.writeFile(path.join(dir, 'index.html'), html(hash, filename));
    await fs.writeFile(path.join(dir, filename), css);
    const { writeDistVersion } = require(path.join(
      root,
      'scripts/write-dist-version.js',
    ));
    writeDistVersion({
      root,
      distDir: dir,
      resolveGitHash: () => hash,
      buildAt:
        hash === HASH_A
          ? '2026-10-09T00:00:00.000Z'
          : '2026-10-09T01:00:00.000Z',
    });
  }
  const { snapshot, merge } = await import(
    pathToFileURL(path.join(root, 'scripts/deploy-asset-retention.mjs'))
  );
  process.env.DIST_RETENTION = '1';
  snapshot({ distDir: a, snapshotDir: snap });
  merge({ distDir: b, snapshotDir: snap });
  assert.equal(await fs.readFile(path.join(b, CSS_A), 'utf8'), css);
  let active = a;
  const requests = [];
  const evidence = { temp, checks: [], requests };
  const save = () =>
    fs.writeFile(
      path.join(temp, 'evidence.json'),
      JSON.stringify(evidence, null, 2),
    );
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/__fixture/reset') {
        active = a;
        res.end('A');
        return;
      }
      if (url.pathname === '/__fixture/publish') {
        active = b;
        res.end('B');
        return;
      }
      if (url.pathname === '/__fixture/state') {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({ active: active === a ? 'A' : 'B', temp, requests }),
        );
        return;
      }
      if (url.pathname === '/__fixture/evidence' && req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        evidence.checks.push(JSON.parse(Buffer.concat(chunks).toString()));
        await save();
        res.end('OK');
        return;
      }
      const filename =
        url.pathname === '/host.html'
          ? null
          : url.pathname.startsWith('/home')
          ? 'index.html'
          : url.pathname.slice(1);
      if (url.pathname === '/host.html') {
        const mode =
          url.searchParams.get('mode') === 'loopback' ? 'loopback' : 'direct';
        res.setHeader('Content-Type', 'text/html');
        res.end(
          `<!doctype html><style>html,body,webview{height:100%;width:100%;margin:0}webview{display:flex}</style><webview id="guest" src="/home?host=${mode}&amp;workspace=42#conversation-7"></webview>`,
        );
        return;
      }
      if (!filename || filename.includes('..')) {
        res.writeHead(404).end();
        return;
      }
      const data = await fs.readFile(path.join(active, filename));
      const type = filename.endsWith('.css')
        ? 'text/css'
        : filename.endsWith('.js')
        ? 'application/javascript'
        : filename.endsWith('.json')
        ? 'application/json'
        : 'text/html';
      res.setHeader('Content-Type', type);
      res.setHeader(
        'Cache-Control',
        type === 'text/html' || filename === 'version.json'
          ? 'no-store'
          : 'public, max-age=2592000',
      );
      requests.push({
        path: url.pathname,
        generation: active === a ? 'A' : 'B',
        type,
        referer: req.headers.referer,
      });
      res.end(data);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  await save();
  console.log(
    JSON.stringify({
      origin: `http://127.0.0.1:${server.address().port}`,
      temp,
    }),
  );
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}

async function launchElectron() {
  const origin = process.env.NUWAX_WEB_UPDATE_ORIGIN;
  assert.ok(origin, 'NUWAX_WEB_UPDATE_ORIGIN required');
  const env = { ...process.env, NUWAX_WEB_UPDATE_ELECTRON: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(fromShell('electron'), [__filename], {
    env,
    stdio: 'inherit',
  });
  const watchdog = setTimeout(() => child.kill('SIGTERM'), 60000);
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  clearTimeout(watchdog);
}

async function electron() {
  const { app, BrowserWindow, webContents } = require('electron');
  const origin = process.env.NUWAX_WEB_UPDATE_ORIGIN;
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), 'nuwax-web-update-electron-'),
  );
  app.setPath('userData', path.join(temp, 'profile'));
  app.commandLine.appendSwitch('no-proxy-server');
  let win;
  let failed = false;
  const waitFor = async (check, label) => {
    const end = Date.now() + 15000;
    while (Date.now() < end) {
      try {
        if (await check()) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw new Error(`Timeout: ${label}`);
  };
  try {
    await app.whenReady();
    await fetch(origin + '/__fixture/reset');
    win = new BrowserWindow({
      width: 820,
      height: 650,
      show: false,
      webPreferences: {
        webviewTag: true,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    await win.loadURL(origin + '/host.html');
    win.showInactive();
    const guest = async () =>
      webContents.fromId(
        await win.webContents.executeJavaScript(
          'document.querySelector("webview").getWebContentsId()',
        ),
      );
    const evaluate = async (code) => (await guest()).executeJavaScript(code);
    await waitFor(
      () =>
        evaluate(
          `window.fixtureBuildInfo?.gitHash === '${HASH_A}' && window.fixtureEvents?.length>0`,
        ),
      'A initialized',
    );
    await waitFor(
      async () =>
        (
          await (await fetch(origin + '/__fixture/state')).json()
        ).requests.some(
          (r) => r.path === '/version.json' && r.generation === 'A',
        ),
      'initial A version check',
    );
    const address = await evaluate('location.href');
    await evaluate(
      'localStorage.setItem("nuwax-update-fixture-login","preserved");document.cookie="nuwax_update_fixture_session=preserved;path=/"',
    );
    const before = (
      await (await fetch(origin + '/__fixture/state')).json()
    ).requests.filter((r) => r.path === '/home').length;
    await fetch(origin + '/__fixture/publish');
    await evaluate('window.fixtureLoadLazyCss()');
    assert.equal(
      await evaluate(
        'getComputedStyle(document.querySelector("#model-icon")).width',
      ),
      '14px',
    );
    await evaluate('window.fixtureForeground()');
    await waitFor(
      () =>
        evaluate(
          'Boolean(document.querySelector("#header > button[aria-label=更新]"))',
        ),
      'web update badge',
    );
    assert.equal(await evaluate('window.fixtureBuildInfo.gitHash'), HASH_A);
    assert.equal(
      (await (await fetch(origin + '/__fixture/state')).json()).requests.filter(
        (r) => r.path === '/home',
      ).length,
      before,
      'no automatic page reload',
    );
    await evaluate('window.fixtureSetClientStatus("available")');
    await waitFor(
      () =>
        evaluate(
          '!document.querySelector("#header > button[aria-label=更新]") && document.querySelector("#header > span[role=button]")?.textContent.trim()==="更新"',
        ),
      'client update takes priority',
    );
    await evaluate('window.fixtureSetClientStatus("not-available")');
    await waitFor(
      () =>
        evaluate(
          'Boolean(document.querySelector("#header > button[aria-label=更新]"))',
        ),
      'web update restored',
    );
    const buttonPosition = await evaluate(
      '(()=>{const r=document.querySelector("#header > button[aria-label=更新]").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()',
    );
    (await guest()).sendInputEvent({ type: 'mouseMove', ...buttonPosition });
    await waitFor(
      () =>
        evaluate('Boolean(document.querySelector(".ant-popover-inner dl"))'),
      'web comparison hover card',
    );
    const comparison = await evaluate(
      'document.querySelector(".ant-popover-inner").textContent',
    );
    assert.ok(comparison.includes(HASH_A));
    assert.ok(comparison.includes(HASH_B));
    assert.deepEqual(
      await evaluate(
        'Array.from(document.querySelectorAll(".ant-popover-inner time"), time => time.dateTime)',
      ),
      ['2026-10-09T00:00:00.000Z', '2026-10-09T01:00:00.000Z'],
    );
    assert.ok(comparison.includes('当前') && comparison.includes('最新'));
    await evaluate(
      'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',
    );
    await fs.writeFile(
      path.join(temp, 'update-badge.png'),
      (await (await guest()).capturePage()).toPNG(),
    );
    await evaluate(
      'document.querySelector("#header > button[aria-label=更新]").click()',
    );
    await waitFor(
      () => evaluate(`window.fixtureBuildInfo?.gitHash === '${HASH_B}'`),
      'user click loads B',
    );
    assert.equal(await evaluate('location.href'), address);
    assert.equal(
      await evaluate('localStorage.getItem("nuwax-update-fixture-login")'),
      'preserved',
    );
    assert.ok(
      await evaluate(
        'document.cookie.includes("nuwax_update_fixture_session=preserved")',
      ),
    );
    await evaluate('window.fixtureLoadLazyCss()');
    assert.equal(
      await evaluate(
        'getComputedStyle(document.querySelector("#model-icon")).width',
      ),
      '14px',
    );
    await waitFor(
      () =>
        evaluate(`window.fixtureLatestWebBuildInfo()?.gitHash === '${HASH_B}'`),
      'B version check completed',
    );
    assert.equal(
      await evaluate(
        'Boolean(document.querySelector("#header > button[aria-label=更新]"))',
      ),
      false,
    );
    const versionRequestsBeforeLoopback = (
      await (await fetch(origin + '/__fixture/state')).json()
    ).requests.filter((r) => r.path === '/version.json').length;
    await fetch(origin + '/__fixture/reset');
    await win.loadURL(origin + '/host.html?mode=loopback');
    await waitFor(
      () =>
        evaluate(
          `window.fixtureBuildInfo?.gitHash === '${HASH_A}' && window.fixtureContextRequested`,
        ),
      'loopback initialized',
    );
    await fetch(origin + '/__fixture/publish');
    await evaluate('window.fixtureLoadLazyCss()');
    await evaluate('window.fixtureForeground()');
    assert.equal(
      await evaluate(
        'Boolean(document.querySelector("#header > button[aria-label=更新]"))',
      ),
      false,
    );
    assert.equal(
      (await (await fetch(origin + '/__fixture/state')).json()).requests.filter(
        (r) => r.path === '/version.json',
      ).length,
      versionRequestsBeforeLoopback,
      'loopback must not check web version',
    );
    const result = {
      surface: 'Electron webview',
      electron: process.versions.electron,
      temp,
      checks: [
        'A CSS retained after B publish',
        'A marker remains fixed',
        'update badge appears without reload',
        'client update takes priority, then restores the web update',
        'hover card compares current/latest version, gitHash and build time',
        'user click loads B',
        'address/cookie/localStorage preserved',
        'B hides matching badge',
        'loopback never checks or shows web updates after B publish',
      ],
    };
    await fs.writeFile(
      path.join(temp, 'evidence.json'),
      JSON.stringify(result, null, 2),
    );
    await fetch(origin + '/__fixture/evidence', {
      method: 'POST',
      body: JSON.stringify(result),
    });
    console.log('WEB_UPDATE_ELECTRON_OK ' + JSON.stringify(result));
  } catch (error) {
    console.error(error);
    failed = true;
  } finally {
    if (win && !win.isDestroyed()) win.destroy();
    if (failed) app.exit(1);
    else app.quit();
  }
}

if (process.env.NUWAX_WEB_UPDATE_ELECTRON) electron();
else if (process.argv[2] === 'electron')
  launchElectron().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
else if (process.argv[2] === 'serve')
  serve().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
else
  console.error(
    'Usage: node scripts/e2e/direct-web-assets-update-fixture.cjs serve|electron',
  );
