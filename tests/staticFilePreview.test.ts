import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PPTX_PACKAGE_LIMITS } from '../src/utils/pptxPackage';
import { validateAndOrderPptxSlides } from '../src/utils/pptxSlideValidation';

const require = createRequire(import.meta.url);
const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8');
const html = source('public/static/file-preview.html').replace(
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  '',
);
const utils = source('public/static/file-preview/file-preview-utils.js');
const openui = source('public/static/file-preview/file-preview-openui.js');
const main = source('public/static/file-preview/file-preview.js');
const origin = 'https://preview.example';
const slideNames = [
  'ppt/slides/slide1.xml',
  'ppt/slides/slide2.xml',
  'ppt/slides/slide3.xml',
];
const slideOrder = [slideNames[2], slideNames[0], slideNames[1]];

interface StaticWindow extends Window {
  eval(script: string): unknown;
  close(): void;
  Event: typeof Event;
  PageTransitionEvent: typeof PageTransitionEvent;
  FileReader: typeof FileReader;
  MutationObserver: typeof MutationObserver;
  HTMLAnchorElement: typeof HTMLAnchorElement;
  URL: typeof URL;
  Blob: typeof Blob;
  startPreview(): Promise<void>;
  downloadFile(): Promise<void>;
  loadScript(src: string): Promise<void>;
  notifyParent(data: { type: string; error?: string; fileType?: string }): void;
}

// jsdom 未提供项目已安装的声明包；只声明此处使用的公开构造契约。
const { JSDOM } = require('jsdom') as {
  JSDOM: new (
    htmlSource: string,
    options: { url: string; runScripts: 'outside-only' },
  ) => { window: StaticWindow };
};

interface ResponseStub {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  body?: { cancel(): Promise<void> };
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
}

function response(overrides: Partial<ResponseStub> = {}): ResponseStub {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ code: '0000', data: { content: '/files/deck.pptx' } }),
    arrayBuffer: async () => new Uint8Array([11, 12, 13]).buffer,
    blob: async () => new Blob(['original download']),
    ...overrides,
  };
}

function deferred<T>() {
  let fulfill!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    fulfill = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, fulfill, reject };
}

async function flush() {
  for (let index = 0; index < 24; index++) await Promise.resolve();
}

interface RenderPlan {
  slides?: string[];
  wrappers?: number;
  load?: Promise<void>;
}

interface PreparedPptx {
  buffer: ArrayBuffer;
  slidePaths: string[];
  repairedParts: string[];
}

function expectNotice(notify: ReturnType<typeof vi.fn>, notice: unknown) {
  expect(notify.mock.calls).toEqual([[notice]]);
}

const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.restoreAllMocks();
});

async function createPage(
  options: {
    query?: string;
    fetch?: ReturnType<typeof vi.fn>;
    plans?: RenderPlan[];
    autoLoadScripts?: boolean;
    resizeObserver?: boolean;
    includeMain?: boolean;
  } = {},
) {
  const { window: win } = new JSDOM(html, {
    url: `${origin}/static/file-preview.html?${
      options.query ?? 'sk=share-key'
    }`,
    runScripts: 'outside-only',
  });
  cleanups.push(() => win.close());
  // 等待 jsdom 自己的初始化事件，再 eval 经典脚本，避免测试产生双重启动。
  if (win.document.readyState === 'loading') {
    await new Promise<void>((done) => {
      win.document.addEventListener('DOMContentLoaded', () => done(), {
        once: true,
      });
    });
  }
  const raw = new Uint8Array([11, 12, 13]).buffer;
  const prepared = new Uint8Array([91, 92, 93, 94]).buffer;
  const fetch =
    options.fetch ??
    vi.fn(async (url: string) =>
      url.includes('/share/detail/')
        ? response()
        : response({ arrayBuffer: async () => raw }),
    );
  Object.defineProperty(win, 'fetch', { value: fetch, configurable: true });
  Object.defineProperty(win, 'console', {
    value: { ...console, error: vi.fn(), warn: vi.fn() },
  });
  const createObjectURL = vi.fn<(blob: Blob) => string>(
    () => 'blob:original-file',
  );
  const revokeObjectURL = vi.fn();
  Object.defineProperty(win.URL, 'createObjectURL', { value: createObjectURL });
  Object.defineProperty(win.URL, 'revokeObjectURL', { value: revokeObjectURL });
  const downloads: Array<{ name: string; href: string }> = [];
  vi.spyOn(win.HTMLAnchorElement.prototype, 'click').mockImplementation(
    function click(this: HTMLAnchorElement) {
      downloads.push({ name: this.download, href: this.href });
    },
  );

  const timers = new Map<number, { callback: () => void; delay: number }>();
  let nextTimer = 0;
  Object.defineProperty(win, 'setTimeout', {
    value: (callback: () => void, delay: number) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
  });
  Object.defineProperty(win, 'clearTimeout', {
    value: (id: number) => timers.delete(id),
  });
  const observers: TestResizeObserver[] = [];
  class TestResizeObserver implements ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(private readonly callback: ResizeObserverCallback) {
      observers.push(this);
    }
    fire() {
      this.callback([], this);
    }
  }
  Object.defineProperty(win, 'ResizeObserver', {
    value: options.resizeObserver === false ? undefined : TestResizeObserver,
  });
  const container = win.document.getElementById('previewContainer')!;
  let width = 800;
  let height = 600;
  Object.defineProperties(container, {
    clientWidth: { get: () => width },
    clientHeight: { get: () => height },
  });

  const plans = [...(options.plans ?? [])];
  const instances: Array<ReturnType<typeof makePreviewer>> = [];
  function makePreviewer(host: HTMLElement, plan: RenderPlan) {
    const wrapper = win.document.createElement('div');
    wrapper.className = 'pptx-preview-wrapper';
    host.appendChild(wrapper);
    const slides = plan.slides ?? slideNames;
    const renderSlide = vi.fn((index: number) => {
      if (index >= (plan.wrappers ?? slides.length)) return;
      const slide = win.document.createElement('div');
      slide.className = 'pptx-preview-slide-wrapper';
      slide.textContent = slides[index];
      wrapper.appendChild(slide);
    });
    return {
      wrapper,
      pptx: { slides: slides.map((name) => ({ name })) },
      load: vi.fn(() => plan.load ?? Promise.resolve()),
      // 新接入必须绕过会吞解析错误的旧 preview() 入口。
      preview: vi.fn(() => {
        throw new Error('Old UMD preview() must not be used');
      }),
      htmlRender: { renderSlide },
      destroy: vi.fn(() => wrapper.remove()),
    };
  }
  const init = vi.fn<
    (
      host: HTMLElement,
      size: { width: number; height: number; mode: string },
    ) => ReturnType<typeof makePreviewer>
  >((host) => {
    const previewer = makePreviewer(host, plans.shift() ?? {});
    instances.push(previewer);
    return previewer;
  });
  const prepare = vi.fn<
    (
      buffer: ArrayBuffer,
      options: { signal?: AbortSignal },
    ) => Promise<PreparedPptx>
  >(async () => ({
    buffer: prepared,
    slidePaths: [...slideOrder],
    repairedParts: ['[Content_Types].xml'],
  }));
  Object.defineProperty(win, 'NuwaxPptxPreview', {
    value: {
      init,
      preparePptxForPreview: prepare,
      DEFAULT_PPTX_PACKAGE_LIMITS,
      validateAndOrderPptxSlides,
    },
  });

  win.eval(utils);
  win.eval(openui);
  const notify = vi.fn();
  win.notifyParent = notify;
  const scriptLoads: string[] = [];
  const scriptObserver = new win.MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (node.nodeName !== 'SCRIPT') continue;
        const script = node as HTMLScriptElement;
        scriptLoads.push(script.src);
        if (options.autoLoadScripts !== false) {
          script.dispatchEvent(new win.Event('load'));
        }
      }
    }
  });
  scriptObserver.observe(win.document.head, { childList: true });
  cleanups.push(() => scriptObserver.disconnect());
  if (options.includeMain !== false) win.eval(main);

  const node = (id: string) => win.document.getElementById(id)!;
  const hidden = (id: string) => node(id).classList.contains('hidden');
  const pages = () =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-pptx-slide-path]'),
    ).map((slide) => slide.dataset.pptxSlidePath);
  const setSize = (nextWidth: number, nextHeight = height) => {
    width = nextWidth;
    height = nextHeight;
  };
  const fireResize = () => {
    if (options.resizeObserver === false) {
      win.dispatchEvent(new win.Event('resize'));
    } else {
      observers.at(-1)!.fire();
    }
  };
  const runTimers = async () => {
    const pending = [...timers];
    timers.clear();
    pending.forEach(([, { callback }]) => callback());
    await flush();
  };
  const blobBytes = (blob: Blob) =>
    new Promise<number[]>((done, reject) => {
      const reader = new win.FileReader();
      reader.onload = () =>
        done([...new Uint8Array(reader.result as ArrayBuffer)]);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  return {
    win,
    raw,
    prepared,
    fetch,
    prepare,
    init,
    instances,
    observers,
    container,
    notify,
    downloads,
    createObjectURL,
    revokeObjectURL,
    scriptLoads,
    timers,
    node,
    hidden,
    pages,
    setSize,
    fireResize,
    runTimers,
    blobBytes,
  };
}

describe('静态 PPTX 分享页', () => {
  it('按分享详情解析 URL，用 prepare/load 渲染并恢复演示文稿页序', async () => {
    const fetch = vi.fn(async (url: string) =>
      url.includes('/share/detail/')
        ? response({
            json: async () => ({
              code: '0000',
              data: { content: '/files/deck.pptx?existing=kept&sk=old' },
            }),
          })
        : response(),
    );
    const page = await createPage({
      query:
        'sk=share-key&dl=1&_ticket=ignored&fileUrl=' +
        encodeURIComponent(`${origin}/wrong.pptx`) +
        '&docUrl=' +
        encodeURIComponent(`${origin}/also-wrong.pptx`),
      fetch,
    });
    await page.win.startPreview();

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      `${origin}/api/agent/conversation/share/detail/share-key`,
      `${origin}/files/deck.pptx?existing=kept&sk=share-key`,
    ]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-cache',
        signal: expect.anything(),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        credentials: 'same-origin',
        cache: 'no-cache',
      }),
    );
    expect(page.prepare).toHaveBeenCalledOnce();
    expect(page.prepare.mock.calls[0][0]).toBeInstanceOf(ArrayBuffer);
    expect(page.init).toHaveBeenCalledWith(expect.anything(), {
      width: 800,
      height: 600,
      mode: 'list',
    });
    expect(page.instances[0].load).toHaveBeenCalledWith(page.prepared);
    expect(page.instances[0].preview).not.toHaveBeenCalled();
    expect(page.instances[0].htmlRender.renderSlide.mock.calls).toEqual([
      [0],
      [1],
      [2],
    ]);
    expect(page.pages()).toEqual(slideOrder);
    expect(page.scriptLoads).toHaveLength(1);
    expect(page.scriptLoads[0]).toContain(
      '/static/file-preview/file-preview-pptx.js',
    );
    expect(page.scriptLoads[0]).not.toContain('pptx-preview.umd.js');
    expect(page.hidden('loadingOverlay')).toBe(true);
    expect(page.hidden('errorOverlay')).toBe(true);
    expect(page.hidden('previewDownloadBtn')).toBe(false);
    expectNotice(page.notify, {
      type: 'preview_success',
      fileType: 'pptx',
    });
  });

  it.each([
    ['HTTP', response({ ok: false, status: 503 }), '503'],
    [
      '业务错误',
      response({
        json: async () => ({ code: '4001', message: 'Share expired' }),
      }),
      'Share expired',
    ],
    [
      '缺少 content',
      response({ json: async () => ({ code: '0000', data: {} }) }),
      'sharing link has expired',
    ],
  ])('分享详情%s失败进入统一错误态', async (_label, detail, message) => {
    const page = await createPage({ fetch: vi.fn().mockResolvedValue(detail) });
    await page.win.startPreview();
    expect(page.fetch).toHaveBeenCalledOnce();
    expect(page.hidden('loadingOverlay')).toBe(true);
    expect(page.hidden('errorOverlay')).toBe(false);
    expect(page.node('errorText').textContent).toContain(message);
    expect(page.hidden('errorDownloadBtn')).toBe(true);
    expect(page.prepare).not.toHaveBeenCalled();
    expectNotice(page.notify, {
      type: 'preview_error',
      error: expect.stringContaining(message),
    });
  });

  it('PPT 下载 HTTP 失败不会被当作预览成功', async () => {
    const page = await createPage({
      fetch: vi
        .fn()
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(response({ ok: false, status: 403 })),
    });
    await page.win.startPreview();
    expect(page.prepare).not.toHaveBeenCalled();
    expect(page.node('errorText').textContent).toContain('403');
    expectNotice(page.notify, {
      type: 'preview_error',
      error: expect.stringContaining('403'),
    });
  });

  it('Content-Length 超过预算时取消读取，不调用 prepare', async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const arrayBuffer = vi.fn();
    const page = await createPage({
      fetch: vi
        .fn()
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(
          response({
            headers: {
              get: () =>
                `${DEFAULT_PPTX_PACKAGE_LIMITS.maxCompressedBytes + 1}`,
            },
            body: { cancel },
            arrayBuffer,
          }),
        ),
    });
    await page.win.startPreview();
    expect(cancel).toHaveBeenCalledOnce();
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(page.prepare).not.toHaveBeenCalled();
    expect(page.node('errorText').textContent).toContain('size limit');
    expect(page.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'preview_success' }),
    );
  });

  it.each([
    ['零页', { slides: [] }],
    ['少页', { slides: slideNames.slice(0, 2) }],
    ['重复页面', { slides: [slideNames[0], slideNames[0], slideNames[2]] }],
    ['缺少页面 DOM', { wrappers: 2 }],
    [
      '页路径不匹配',
      { slides: [slideNames[0], slideNames[1], 'ppt/slides/slide4.xml'] },
    ],
    ['额外页', { slides: [...slideNames, 'ppt/slides/slide4.xml'] }],
  ])('真实页校验拒绝%s，不发送 success', async (_label, plan) => {
    const page = await createPage({ plans: [plan] });
    await page.win.startPreview();
    expect(page.hidden('errorOverlay')).toBe(false);
    expect(page.node('errorText').textContent).toContain(
      'Some slides could not be rendered',
    );
    expect(page.container.children).toHaveLength(0);
    expect(page.instances[0].destroy).toHaveBeenCalledOnce();
    expectNotice(page.notify, {
      type: 'preview_error',
      error: expect.stringContaining('Some slides'),
    });
  });

  it('准备结果的空页面列表也不能成功', async () => {
    const page = await createPage({ plans: [{ slides: [] }] });
    page.prepare.mockResolvedValue({
      buffer: page.prepared,
      slidePaths: [],
      repairedParts: [],
    });
    await page.win.startPreview();
    expect(page.hidden('errorOverlay')).toBe(false);
    expect(page.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'preview_success' }),
    );
  });

  it('runtime script 加载失败后，重试重新查分享并等待新 script 加载', async () => {
    const page = await createPage({ autoLoadScripts: false });
    const first = page.win.startPreview();
    await flush();
    const failedScript = page.win.document.scripts[0];
    failedScript.dispatchEvent(new page.win.Event('error'));
    await first;
    expect(page.hidden('errorOverlay')).toBe(false);
    expect(page.fetch).toHaveBeenCalledOnce();
    expect(page.prepare).not.toHaveBeenCalled();
    expect(page.win.document.scripts).toHaveLength(0);

    const retry = page.win.startPreview();
    await flush();
    expect(page.fetch).toHaveBeenCalledTimes(2);
    expect(page.win.document.scripts).toHaveLength(1);
    expect(page.win.document.scripts[0]).not.toBe(failedScript);
    expect(page.init).not.toHaveBeenCalled();
    page.win.document.scripts[0].dispatchEvent(new page.win.Event('load'));
    await retry;
    expect(page.fetch).toHaveBeenCalledTimes(3);
    expect(page.prepare).toHaveBeenCalledOnce();
    expect(page.pages()).toEqual(slideOrder);
    expect(page.hidden('errorOverlay')).toBe(true);
    expect(page.notify.mock.calls.map(([notice]) => notice.type)).toEqual([
      'preview_error',
      'preview_success',
    ]);
  });

  it('普通 ticket 预览保留 URL 原有参数，错误态仍允许原件下载', async () => {
    const fileUrl = `${origin}/files/private.pptx?existing=kept`;
    const page = await createPage({
      query: `fileUrl=${encodeURIComponent(
        fileUrl,
      )}&_ticket=preview-ticket&_sk=download-key`,
    });
    page.prepare.mockRejectedValue(
      Object.assign(new Error('missing slide'), { code: 'damaged' }),
    );
    await page.win.startPreview();
    expect(page.fetch).toHaveBeenCalledOnce();
    expect(page.fetch).toHaveBeenCalledWith(
      `${fileUrl}&_ticket=preview-ticket`,
      expect.objectContaining({
        credentials: 'same-origin',
        cache: 'no-cache',
      }),
    );
    expect(page.hidden('previewDownloadBtn')).toBe(true);
    expect(page.hidden('errorDownloadBtn')).toBe(false);
    await page.win.downloadFile();
    expect(page.fetch).toHaveBeenCalledOnce();
    expect(await page.blobBytes(page.createObjectURL.mock.calls[0][0])).toEqual(
      [11, 12, 13],
    );
    expect(page.downloads[0].name).toBe('private.pptx');
  });

  it.each(['成功', '准备失败'])(
    'dl=1 在%s时下载缓存原件，不下载修复 buffer',
    async (state) => {
      const page = await createPage({ query: 'sk=share-key&dl=1' });
      if (state === '准备失败') {
        page.prepare.mockRejectedValue(
          Object.assign(new Error('invalid master'), { code: 'damaged' }),
        );
      }
      await page.win.startPreview();
      expect(
        page.hidden(
          state === '成功' ? 'previewDownloadBtn' : 'errorDownloadBtn',
        ),
      ).toBe(false);
      await page.win.downloadFile();
      expect(page.fetch).toHaveBeenCalledTimes(2);
      expect(page.createObjectURL).toHaveBeenCalledOnce();
      const originalBlob = page.createObjectURL.mock.calls[0][0] as Blob;
      expect(await page.blobBytes(originalBlob)).toEqual([11, 12, 13]);
      expect(originalBlob.size).toBe(3);
      expect(page.downloads).toEqual([
        { name: 'deck.pptx', href: 'blob:original-file' },
      ]);
      expect(page.revokeObjectURL).toHaveBeenCalledWith('blob:original-file');
    },
  );

  it.each(['成功', '准备失败'])(
    '未设置 dl=1 时%s态均不暴露下载',
    async (state) => {
      const page = await createPage();
      if (state === '准备失败')
        page.prepare.mockRejectedValue(new Error('failed'));
      await page.win.startPreview();
      expect(page.hidden('previewDownloadBtn')).toBe(true);
      expect(page.hidden('errorDownloadBtn')).toBe(true);
      await page.win.downloadFile();
      expect(page.fetch).toHaveBeenCalledTimes(2);
      expect(page.createObjectURL).not.toHaveBeenCalled();
      expect(page.downloads).toHaveLength(0);
    },
  );

  it.each(['返回成功', '返回错误'])(
    '重试后旧分享详情%s不会覆盖新预览',
    async (outcome) => {
      const old = deferred<ResponseStub>();
      const page = await createPage({
        fetch: vi
          .fn()
          .mockImplementationOnce(() => old.promise)
          .mockImplementation(async (url: string) =>
            url.includes('/share/detail/') ? response() : response(),
          ),
      });
      const first = page.win.startPreview();
      const firstSignal = page.fetch.mock.calls[0][1].signal as AbortSignal;
      await page.win.startPreview();
      expect(firstSignal.aborted).toBe(true);
      if (outcome === '返回成功') {
        old.fulfill(
          response({
            json: async () => ({
              code: '0000',
              data: { content: '/files/old.pptx' },
            }),
          }),
        );
      } else {
        old.reject(new Error('old detail failed'));
      }
      await first;
      expect(page.fetch).toHaveBeenCalledTimes(3);
      expect(page.fetch.mock.calls[1][1].cache).toBe('no-cache');
      expect(page.prepare).toHaveBeenCalledOnce();
      expect(page.pages()).toEqual(slideOrder);
      expect(page.hidden('errorOverlay')).toBe(true);
      expectNotice(page.notify, { type: 'preview_success', fileType: 'pptx' });
    },
  );

  it.each(['返回成功', '返回错误'])(
    '重试后旧文件请求%s不会提交',
    async (outcome) => {
      const old = deferred<ResponseStub>();
      const page = await createPage({
        fetch: vi
          .fn()
          .mockResolvedValueOnce(response())
          .mockImplementationOnce(() => old.promise)
          .mockResolvedValue(response()),
      });
      const first = page.win.startPreview();
      await flush();
      expect(page.fetch).toHaveBeenCalledTimes(2);
      const signal = page.fetch.mock.calls[1][1].signal as AbortSignal;
      await page.win.startPreview();
      expect(signal.aborted).toBe(true);
      if (outcome === '返回成功') old.fulfill(response());
      else old.reject(new Error('old file failed'));
      await first;
      expect(page.fetch).toHaveBeenCalledTimes(4);
      expect(page.prepare).toHaveBeenCalledOnce();
      expect(page.pages()).toEqual(slideOrder);
      expect(page.hidden('errorOverlay')).toBe(true);
      expectNotice(page.notify, { type: 'preview_success', fileType: 'pptx' });
    },
  );

  it('重试后旧 prepare 晚返回不会创建解析实例', async () => {
    const old = deferred<PreparedPptx>();
    const page = await createPage();
    page.prepare.mockImplementationOnce(() => old.promise);
    const first = page.win.startPreview();
    await flush();
    expect(page.prepare).toHaveBeenCalledOnce();
    const signal = page.prepare.mock.calls[0][1].signal as AbortSignal;
    await page.win.startPreview();
    expect(signal.aborted).toBe(true);
    old.fulfill({
      buffer: page.prepared,
      slidePaths: slideOrder,
      repairedParts: [],
    });
    await first;
    expect(page.init).toHaveBeenCalledOnce();
    expectNotice(page.notify, { type: 'preview_success', fileType: 'pptx' });
  });

  it.each([true, false])(
    '缩放通过 RO=%s 复用 raw/prepare 缓存并保留顺序和滚动',
    async (resizeObserver) => {
      const page = await createPage({ resizeObserver });
      await page.win.startPreview();
      page.container.scrollTop = 42;
      page.instances[0].wrapper.scrollTop = 73;
      if (resizeObserver) {
        expect(page.observers[0].observe).toHaveBeenCalledWith(page.container);
        page.win.dispatchEvent(new page.win.Event('resize'));
        expect(page.timers.size).toBe(0);
      }
      page.setSize(900);
      page.fireResize();
      page.setSize(920, 640);
      page.fireResize();
      expect(page.timers.size).toBe(1);
      expect([...page.timers.values()][0].delay).toBe(150);
      await page.runTimers();
      expect(page.init).toHaveBeenCalledTimes(2);
      expect(page.init.mock.calls[1][1]).toEqual({
        width: 920,
        height: 640,
        mode: 'list',
      });
      expect(page.fetch).toHaveBeenCalledTimes(2);
      expect(page.prepare).toHaveBeenCalledOnce();
      expect(page.instances[1].load).toHaveBeenCalledWith(page.prepared);
      expect(page.pages()).toEqual(slideOrder);
      expect(page.container.scrollTop).toBe(42);
      expect(page.instances[1].wrapper.scrollTop).toBe(73);
      expect(page.instances[0].destroy).toHaveBeenCalledOnce();
      page.fireResize();
      expect(page.timers.size).toBe(0);
    },
  );

  it.each(['成功', '失败'])(
    '旧缩放解析晚%s不能覆盖新的缩放结果',
    async (outcome) => {
      const old = deferred<void>();
      const page = await createPage({ plans: [{}, { load: old.promise }, {}] });
      await page.win.startPreview();
      page.setSize(900);
      page.fireResize();
      await page.runTimers();
      expect(page.init).toHaveBeenCalledTimes(2);
      page.setSize(1000);
      page.fireResize();
      await page.runTimers();
      expect(page.init).toHaveBeenCalledTimes(3);
      const latest = page.instances[2].wrapper;
      expect(page.container.contains(latest)).toBe(true);
      if (outcome === '成功') old.fulfill();
      else old.reject(new Error('old resize failed'));
      await flush();
      expect(page.container.contains(latest)).toBe(true);
      expect(page.instances[1].destroy).toHaveBeenCalledOnce();
      expect(page.instances[1].htmlRender.renderSlide).not.toHaveBeenCalled();
      expect(page.hidden('errorOverlay')).toBe(true);
      expect(page.pages()).toEqual(slideOrder);
      expectNotice(page.notify, { type: 'preview_success', fileType: 'pptx' });
    },
  );

  it('pagehide 取消等待中的文件请求，晚返回不会渲染或通知成功', async () => {
    const pending = deferred<ResponseStub>();
    const page = await createPage({
      fetch: vi
        .fn()
        .mockResolvedValueOnce(response())
        .mockImplementationOnce(() => pending.promise),
    });
    const task = page.win.startPreview();
    await flush();
    const signal = page.fetch.mock.calls[1][1].signal as AbortSignal;
    page.win.dispatchEvent(new page.win.Event('pagehide'));
    expect(signal.aborted).toBe(true);
    pending.fulfill(response());
    await task;
    expect(page.init).not.toHaveBeenCalled();
    expect(page.prepare).not.toHaveBeenCalled();
    expect(page.notify).not.toHaveBeenCalled();
  });

  it('pagehide 销毁预览、清掉缩放任务，bfcache pageshow 重新检查分享', async () => {
    const page = await createPage();
    await page.win.startPreview();
    page.setSize(900);
    page.fireResize();
    expect(page.timers.size).toBe(1);
    page.win.dispatchEvent(new page.win.Event('pagehide'));
    expect(page.observers[0].disconnect).toHaveBeenCalledOnce();
    expect(page.instances[0].destroy).toHaveBeenCalledOnce();
    expect(page.timers.size).toBe(0);
    page.win.dispatchEvent(
      new page.win.PageTransitionEvent('pageshow', { persisted: true }),
    );
    await flush();
    expect(page.fetch).toHaveBeenCalledTimes(4);
    expect(page.prepare).toHaveBeenCalledTimes(2);
    expect(page.init).toHaveBeenCalledTimes(2);
    expect(page.pages()).toEqual(slideOrder);
  });

  it.each(['fetch 成功', 'fetch 失败', 'blob 成功', 'blob 失败'])(
    '重试使旧下载%s失效',
    async (outcome) => {
      const oldResponse = deferred<ResponseStub>();
      const oldBlob = deferred<Blob>();
      const blob = vi.fn(() => oldBlob.promise);
      const page = await createPage({
        query: 'sk=share-key&dl=1',
        fetch: vi
          .fn()
          .mockResolvedValueOnce(response())
          .mockResolvedValueOnce(response({ ok: false, status: 503 }))
          .mockImplementationOnce(() => oldResponse.promise)
          .mockResolvedValue(response()),
      });
      await page.win.startPreview();
      const downloading = page.win.downloadFile();
      const downloadSignal = page.fetch.mock.calls[2][1].signal as AbortSignal;
      if (outcome.startsWith('blob')) {
        oldResponse.fulfill(response({ blob }));
        await flush();
        expect(blob).toHaveBeenCalledOnce();
      }
      await page.win.startPreview();
      expect(downloadSignal.aborted).toBe(true);
      if (outcome === 'fetch 成功') oldResponse.fulfill(response({ blob }));
      if (outcome === 'fetch 失败')
        oldResponse.reject(new Error('old download fetch failed'));
      if (outcome === 'blob 成功')
        oldBlob.fulfill(new page.win.Blob(['old file']));
      if (outcome === 'blob 失败')
        oldBlob.reject(new Error('old download blob failed'));
      await downloading;
      expect(page.downloads).toHaveLength(0);
      expect(page.createObjectURL).not.toHaveBeenCalled();
      expect(page.hidden('errorOverlay')).toBe(true);
      expect(page.node('errorDownloadBtn')).toHaveProperty('disabled', false);
      expect(page.pages()).toEqual(slideOrder);
      expect(page.notify.mock.calls.map(([item]) => item.type)).toEqual([
        'preview_error',
        'preview_success',
      ]);
      if (outcome.startsWith('fetch')) expect(blob).not.toHaveBeenCalled();
    },
  );

  it('pagehide 也取消进行中的原件下载', async () => {
    const pending = deferred<ResponseStub>();
    const page = await createPage({
      query: 'sk=share-key&dl=1',
      fetch: vi
        .fn()
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(response({ ok: false, status: 503 }))
        .mockImplementationOnce(() => pending.promise),
    });
    await page.win.startPreview();
    const task = page.win.downloadFile();
    const signal = page.fetch.mock.calls[2][1].signal as AbortSignal;
    page.win.dispatchEvent(new page.win.Event('pagehide'));
    expect(signal.aborted).toBe(true);
    pending.fulfill(response());
    await task;
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(page.downloads).toHaveLength(0);
  });
});

describe('静态动态脚本加载', () => {
  it('并发加载复用同一 Promise，load 后重复调用不会插入新 script', async () => {
    const page = await createPage({
      autoLoadScripts: false,
      includeMain: false,
    });
    const first = page.win.loadScript(
      '/static/file-preview/file-preview-pptx.js?v=test',
    );
    const second = page.win.loadScript(
      '/static/file-preview/file-preview-pptx.js?v=test',
    );
    expect(second).toBe(first);
    expect(page.win.document.scripts).toHaveLength(1);
    let settled = false;
    void first.then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);
    page.win.document.scripts[0].dispatchEvent(new page.win.Event('load'));
    await Promise.all([first, second]);
    expect(settled).toBe(true);
    expect(
      page.win.loadScript('/static/file-preview/file-preview-pptx.js?v=test'),
    ).toBe(first);
    expect(page.win.document.scripts).toHaveLength(1);
  });

  it('script error 移除失败标签和缓存，下一次重试等待新的加载', async () => {
    const page = await createPage({
      autoLoadScripts: false,
      includeMain: false,
    });
    const first = page.win.loadScript(
      '/static/file-preview/file-preview-pptx.js?v=test',
    );
    const rejected = expect(first).rejects.toThrow('Failed to load');
    page.win.document.scripts[0].dispatchEvent(new page.win.Event('error'));
    await rejected;
    expect(page.win.document.scripts).toHaveLength(0);
    const retry = page.win.loadScript(
      '/static/file-preview/file-preview-pptx.js?v=test',
    );
    expect(retry).not.toBe(first);
    expect(page.win.document.scripts).toHaveLength(1);
    let settled = false;
    void retry.then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);
    page.win.document.scripts[0].dispatchEvent(new page.win.Event('load'));
    await retry;
    expect(settled).toBe(true);
  });

  it('共享已有的未加载 script 时不会提前宣告加载完成', async () => {
    const page = await createPage({
      autoLoadScripts: false,
      includeMain: false,
    });
    const existing = page.win.document.createElement('script');
    existing.src = `${origin}/static/file-preview/file-preview-pptx.js?v=test`;
    page.win.document.head.appendChild(existing);
    const task = page.win.loadScript(
      '/static/file-preview/file-preview-pptx.js?v=test',
    );
    let settled = false;
    void task.then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);
    expect(page.win.document.scripts).toHaveLength(1);
    existing.dispatchEvent(new page.win.Event('load'));
    await task;
    expect(settled).toBe(true);
  });
});
