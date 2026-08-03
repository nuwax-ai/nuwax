import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const hostSource = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'public/static/file-preview/file-preview-openui.js',
  ),
  'utf8',
);
const bootstrapSource = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'public/static/openui-runtime/file-path-bootstrap.js',
  ),
  'utf8',
);

const nodeDigest = (value: string) =>
  `sha256:${createHash('sha256').update(value).digest('hex')}`;

async function fallbackDigest(value: string): Promise<string> {
  const context = vm.createContext({
    crypto: {},
    Math,
    Promise,
    Uint8Array,
    Uint32Array,
    URL,
  });
  vm.runInContext(hostSource, context);
  return vm.runInContext(`sha256Digest(${JSON.stringify(value)})`, context);
}

async function runBootstrap(options: { ok: boolean; nested?: boolean }) {
  const messages: Array<Record<string, unknown>> = [];
  const parent = {
    postMessage(message: Record<string, unknown>) {
      messages.push(message);
    },
  };
  const windowObject: Record<string, unknown> = {
    location: {
      origin: 'https://example.test',
      search: '?nonce=test-nonce&file_path=%2F7%2Fdata%2Fdemo.openui.json',
    },
    matchMedia: () => ({ matches: true }),
    postMessage(message: Record<string, unknown>) {
      messages.push(message);
    },
  };
  windowObject.parent = options.nested ? parent : windowObject;
  const artifact = { title: 'Demo', artifactId: 'demo' };
  const context = vm.createContext({
    document: { documentElement: { lang: 'zh-CN' }, title: '' },
    fetch: async () => ({
      ok: options.ok,
      status: options.ok ? 200 : 403,
      json: async () => artifact,
    }),
    navigator: { language: 'zh-CN' },
    URLSearchParams,
    window: windowObject,
  });
  vm.runInContext(bootstrapSource, context);
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  return messages;
}

function createDirectHost() {
  const messages: Array<Record<string, unknown>> = [];
  const listeners: Array<(event: unknown) => void> = [];
  let expiredCount = 0;
  const appendedScripts: string[] = [];
  const windowObject = {
    location: {
      href: 'https://example.test/static/file-preview.html?nonce=test-nonce',
      origin: 'https://example.test',
    },
    parent: null as unknown,
    history: { replaceState() {} },
    matchMedia: () => ({ matches: true }),
    addEventListener(type: string, listener: (event: unknown) => void) {
      if (type === 'message') listeners.push(listener);
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      if (type !== 'message') return;
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    postMessage(message: Record<string, unknown>) {
      messages.push(message);
      for (const listener of [...listeners]) {
        listener({ source: windowObject, data: message });
      }
    },
  };
  windowObject.parent = windowObject;
  const appendScript = (node: { src?: string; onload?: () => void }) => {
    if (!node.src) return;
    appendedScripts.push(node.src);
    node.onload?.();
  };
  const context = vm.createContext({
    container: { innerHTML: '' },
    crypto: { randomUUID: () => 'fallback-nonce' },
    document: {
      body: { appendChild: appendScript },
      createElement: () => ({}),
      documentElement: { lang: 'zh-CN' },
      head: { appendChild() {} },
      title: '',
    },
    expire: () => {
      expiredCount += 1;
    },
    Math,
    navigator: { language: 'zh-CN' },
    Promise,
    registerPreviewer: () => {},
    Uint8Array,
    Uint32Array,
    URL,
    window: windowObject,
  });
  vm.runInContext(hostSource, context);
  const start = () =>
    vm.runInContext(
      "loadOpenUiRuntimeDirect('/7/data/demo.openui.json', container, true, registerPreviewer, expire)",
      context,
    ) as Promise<void>;
  return {
    appendedScripts,
    expiredCount: () => expiredCount,
    messages,
    post: windowObject.postMessage.bind(windowObject),
    start,
  };
}

describe('OpenUI static runtime behavior', () => {
  it.each(['abc', '女娲 OpenUI 🚀', '\ud800'])(
    'computes SHA-256 without Web Crypto for %j',
    async (value) => {
      await expect(fallbackDigest(value)).resolves.toBe(nodeDigest(value));
    },
  );

  it('relays a top-level artifact to the host instead of racing OPENUI_LOAD', async () => {
    const messages = await runBootstrap({ ok: true });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      type: 'OPENUI_FP_ARTIFACT',
      nonce: 'test-nonce',
    });
    expect(messages.some((message) => message.type === 'OPENUI_LOAD')).toBe(
      false,
    );
  });

  it('relays top-level fetch failures so file-preview can show an error', async () => {
    const messages = await runBootstrap({ ok: false });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      type: 'OPENUI_FP_ERROR',
      nonce: 'test-nonce',
    });
  });

  it('keeps the same artifact relay contract for nested PC previews', async () => {
    const messages = await runBootstrap({ ok: true, nested: true });

    expect(messages[0]).toMatchObject({ type: 'OPENUI_FP_ARTIFACT' });
  });

  it('waits for a validated artifact and OPENUI_READY before sending OPENUI_LOAD', async () => {
    const host = createDirectHost();
    const loading = host.start();
    host.post({
      type: 'OPENUI_READY',
      protocolVersion: 'nuwax.openui-runtime/v1',
      nonce: 'test-nonce',
    });
    expect(
      host.messages.some((message) => message.type === 'OPENUI_LOAD'),
    ).toBe(false);

    host.post({
      type: 'OPENUI_FP_ARTIFACT',
      protocolVersion: 'nuwax.openui-runtime/v1',
      nonce: 'test-nonce',
      artifact: {
        type: 'nuwax.openui-file',
        schemaVersion: 'nuwax.openui-file/v1',
        artifactId: 'demo',
        title: 'Demo',
        document: { source: 'abc', digest: nodeDigest('abc') },
      },
    });
    await loading;
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(host.appendedScripts.some((src) => src.includes('runtime.js'))).toBe(
      true,
    );
    expect(
      host.messages.filter((message) => message.type === 'OPENUI_LOAD'),
    ).toHaveLength(1);
  });

  it('surfaces top-level artifact failures without starting Runtime', () => {
    const host = createDirectHost();
    void host.start();
    host.post({
      type: 'OPENUI_FP_ERROR',
      protocolVersion: 'nuwax.openui-runtime/v1',
      nonce: 'test-nonce',
      message: '403',
    });

    expect(host.expiredCount()).toBe(1);
    expect(host.appendedScripts.some((src) => src.includes('runtime.js'))).toBe(
      false,
    );
  });
});
