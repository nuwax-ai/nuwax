import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// 用真实上游源码应用宿主补丁，验证实际 store；不依赖预先生成的构建缓存。
const root = process.cwd();
let temporary: string;
let adapted: any;
beforeAll(async () => {
  temporary = mkdtempSync(path.join(tmpdir(), 'pc-im-navigation-'));
  cpSync(
    path.join(root, 'submodules/nuwax-im/nuwax-im-web/src'),
    path.join(temporary, 'nuwax-im-web/src'),
    { recursive: true },
  );
  execFileSync(
    'git',
    ['apply', '--include=nuwax-im-web/src/store/chat.ts', '-'],
    {
      cwd: temporary,
      input: readFileSync(
        path.join(root, 'micro-frontends/message/adapter.patch'),
      ),
    },
  );
  cpSync(
    path.join(root, 'micro-frontends/message/overlay/src'),
    path.join(temporary, 'nuwax-im-web/src'),
    { recursive: true },
  );
  const entry = path.join(temporary, 'entry.ts');
  writeFileSync(
    entry,
    `export {useChatStore,disposeImEmbeddedSession} from './nuwax-im-web/src/store/chat'; export {beginMessageRuntime,updateMessageRuntime,endMessageRuntime} from './nuwax-im-web/src/hostRuntime';`,
  );
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    plugins: [
      {
        name: 'unused-http-parser',
        setup(plugin) {
          plugin.onResolve({ filter: /^json-bigint$/ }, () => ({
            path: 'json-bigint',
            namespace: 'mock-http',
          }));
          plugin.onLoad({ filter: /.*/, namespace: 'mock-http' }, () => ({
            contents: 'export default () => JSON;',
          }));
        },
      },
    ],
    define: { 'import.meta.env': '{"DEV":false,"VITE_IM_AUTH_MODE":"mock"}' },
  });
  const filename = path.join(
    root,
    'node_modules/.cache/pc-bugs-im-navigation.cjs',
  );
  const require = createRequire(path.join(root, 'package.json'));
  const Module = require('node:module');
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(
    path.join(root, 'node_modules/.cache'),
  );
  module._compile(result.outputFiles[0].text, filename);
  adapted = module.exports;
}, 15000);
afterAll(() => {
  adapted?.disposeImEmbeddedSession();
  adapted?.endMessageRuntime();
  if (temporary) rmSync(temporary, { recursive: true, force: true });
});
beforeEach(() =>
  adapted.beginMessageRuntime(
    document.createElement('div'),
    { path: '/instant-message?agentId=1', navigationRevision: 0, active: true },
    true,
  ),
);

describe('已挂载 IM 的电脑直达', () => {
  it('首次消费去重、后续明确导航可重入，慢旧请求不覆盖最后目标', async () => {
    let resolveFirst!: (id: string) => void;
    const create = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((done) => {
            resolveFirst = done;
          }),
      )
      .mockResolvedValue('conv-2');
    const select = vi.fn().mockResolvedValue(undefined);
    adapted.useChatStore.setState({
      userId: 'tester',
      convListPhase: 'ready',
      convs: [],
      createP2pWithAgent: create,
      selectConv: select,
    });
    const first = adapted.useChatStore.getState().openHostDirectConversation();
    adapted.updateMessageRuntime({
      path: '/instant-message?agentId=2',
      navigationRevision: 1,
      active: true,
    });
    await adapted.useChatStore.getState().openHostDirectConversation();
    resolveFirst('conv-1');
    await first;
    expect(create.mock.calls.map((call) => call[0])).toEqual(['1', '2']);
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('conv-2');
    await adapted.useChatStore.getState().openHostDirectConversation();
    expect(create).toHaveBeenCalledTimes(2);
    adapted.updateMessageRuntime({
      path: '/instant-message?agentId=2',
      navigationRevision: 2,
      active: true,
    });
    await adapted.useChatStore.getState().openHostDirectConversation();
    expect(create).toHaveBeenCalledTimes(3);
  });
  it('当前请求失败沿用提示并回退，过期请求失败不提示', async () => {
    let reject!: (error: Error) => void;
    const create = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          }),
      )
      .mockRejectedValueOnce(new Error('denied'));
    const select = vi.fn().mockResolvedValue(undefined);
    adapted.useChatStore.setState({
      userId: 'tester',
      convListPhase: 'ready',
      convs: [],
      activeConvId: null,
      directOpenNotice: null,
      createP2pWithAgent: create,
      selectConv: select,
    });
    adapted.updateMessageRuntime({
      path: '/instant-message?agentId=3',
      navigationRevision: 3,
      active: true,
    });
    const first = adapted.useChatStore.getState().openHostDirectConversation();
    adapted.updateMessageRuntime({
      path: '/instant-message?agentId=4',
      navigationRevision: 4,
      active: true,
    });
    const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await adapted.useChatStore.getState().openHostDirectConversation();
    const notice = adapted.useChatStore.getState().directOpenNotice;
    expect(notice?.level).toBe('error');
    reject(new Error('old'));
    await first;
    expect(adapted.useChatStore.getState().directOpenNotice).toBe(notice);
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
