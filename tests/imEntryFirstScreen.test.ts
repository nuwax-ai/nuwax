import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({ defineConfig: (config: unknown) => config }));
vi.mock('../scripts/pdf-character-maps', () => ({
  readPdfCharacterMaps: () => ({}),
}));

import config from '../config/config';

const origin = 'https://agent.nuwax.com';
const scripts = config.headScripts as Array<{ content?: string }>;
const script = scripts.find((entry) =>
  entry.content?.includes('const imEntryRedirect'),
)!.content!;

function firstScreen(path: string, mobile: boolean, development = false) {
  const location = Object.assign(new URL(origin + path), { replace: vi.fn() });
  runInNewContext(script, {
    window: { location },
    navigator: { userAgent: mobile ? 'iPhone Mobile' : 'Desktop' },
    URL,
    URLSearchParams,
    console,
    process: { env: { NODE_ENV: development ? 'development' : 'production' } },
  });
  return location.replace;
}

describe('主站实际首屏分流配置', () => {
  it('IM 携完整参数进入新 H5 路由', () => {
    expect(
      firstScreen('/instant-message/?invite=%252B&convId=7#pane', true),
    ).toHaveBeenCalledWith(
      origin +
        '/m/#/subpackages/pages/im-invite/im-invite?invite=%252B&convId=7&__imEntryHash=%23pane',
    );
  });

  it('团队邀请仍优先，不被 query 里的 IM 参数接管', () => {
    expect(
      firstScreen('/invite/space/abc?convId=7', true),
    ).toHaveBeenCalledWith(
      origin +
        '/m/#/subpackages/pages/space-invite/space-invite?convId=7&code=abc',
    );
  });

  it.each([
    [
      '/agent/12',
      true,
      '/m/#/subpackages/pages/agent-detail/agent-detail?id=12',
    ],
    [
      '/m/#/subpackages/pages/agent-detail/agent-detail?id=12',
      false,
      '/agent/12',
    ],
  ] as const)('既有智能体分流保持 %s', (path, mobile, target) => {
    expect(firstScreen(path, mobile)).toHaveBeenCalledWith(origin + target);
  });

  it('相似路径不能被 IM 分流误接，沿用通用 M 首页回退', () => {
    expect(
      firstScreen('/instant-message-other?invite=123', true),
    ).toHaveBeenCalledWith(origin + '/m/');
  });

  it('开发环境继续跳过主站首屏分流', () => {
    expect(
      firstScreen('/instant-message/?convId=7', true, true),
    ).not.toHaveBeenCalled();
  });
});
