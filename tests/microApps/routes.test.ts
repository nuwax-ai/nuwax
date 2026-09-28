import type { MenuItemDto } from '@/types/interfaces/menu';
import { OpenTypeEnum } from '@/types/menuPermission/menu-manage';
import {
  findMicroAppRoute,
  MICRO_APP_ROUTES,
  resolveMicroAppIframePath,
  resolveMicroAppMenuPath,
} from '@/utils/microAppRoutes';
import { describe, expect, it } from 'vitest';

const origin = 'http://localhost:3031';
const businessOrigin = 'https://testagent.xspaceagi.com';
const repoMenu = (overrides: Partial<MenuItemDto> = {}): MenuItemDto =>
  ({
    code: 'repo',
    path: `${origin}/repo/`,
    openType: OpenTypeEnum.CurrentTab,
    ...overrides,
  } as MenuItemDto);

describe('微应用业务路由', () => {
  it('按路径段识别两个应用和稳定入口，资源入口不冒充业务路由', () => {
    expect(findMicroAppRoute('/repo/doc/a?from=search#title')?.name).toBe(
      'nuwax-repo-web',
    );
    expect(findMicroAppRoute('/repo-entry/')?.name).toBe('nuwax-repo-web');
    expect(findMicroAppRoute('/instant-message/conversation/1')?.name).toBe(
      'nuwax-im-web',
    );
    expect(findMicroAppRoute('/message-entry')?.name).toBe('nuwax-im-web');
    expect(findMicroAppRoute('/repo-other')).toBeUndefined();
    expect(findMicroAppRoute('/repo-entry/doc/a')).toBeUndefined();
    expect(findMicroAppRoute('/micro-apps/repo/index.html')).toBeUndefined();
    expect(findMicroAppRoute('/msg')).toBeUndefined();
    expect(MICRO_APP_ROUTES.map((app) => app.entry)).toEqual([
      '/micro-apps/repo/index.html',
      '/micro-apps/message/index.html',
    ]);
  });

  it('同源/%siteUrl% 入口保存深链、query 和 hash', () => {
    expect(resolveMicroAppMenuPath(repoMenu(), origin, '')).toBe('/repo');
    expect(
      resolveMicroAppMenuPath(
        repoMenu({
          code: 'ziliaoku',
          path: '%siteUrl%/repo/doc/a?text=50%25#title',
        }),
        origin,
        '',
      ),
    ).toBe('/repo/doc/a?text=50%25#title');
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ code: 'custom', path: '/repo-entry?space=3#documents' }),
        origin,
        '',
      ),
    ).toBe('/repo?space=3#documents');
  });

  it('开发业务域须与配置 origin 一致，并同时校验应用 code 和业务路径', () => {
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ path: `${businessOrigin}/repo/` }),
        origin,
        businessOrigin,
      ),
    ).toBe('/repo');
    expect(
      resolveMicroAppMenuPath(
        repoMenu({
          code: 'message',
          path: `${businessOrigin}/instant-message?chat=4`,
        }),
        origin,
        businessOrigin,
      ),
    ).toBe('/instant-message?chat=4');
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ path: `${businessOrigin}/repo/` }),
        origin,
        '',
      ),
    ).toBeNull();
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ path: 'https://other.example/repo/' }),
        origin,
        businessOrigin,
      ),
    ).toBeNull();
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ code: 'third-party', path: `${businessOrigin}/repo/` }),
        origin,
        businessOrigin,
      ),
    ).toBeNull();
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ path: `${businessOrigin}/instant-message` }),
        origin,
        businessOrigin,
      ),
    ).toBeNull();
    expect(
      resolveMicroAppMenuPath(
        repoMenu({ path: `${businessOrigin}/third-party` }),
        origin,
        businessOrigin,
      ),
    ).toBeNull();
  });

  it('新标签、第三方链接与形似路径不被改写', () => {
    for (const path of [
      `${origin}/repo/`,
      '%siteUrl%/repo/',
      '/repo',
      `${businessOrigin}/repo/`,
    ]) {
      expect(
        resolveMicroAppMenuPath(
          repoMenu({ path, openType: OpenTypeEnum.NewTab }),
          origin,
          businessOrigin,
        ),
      ).toBeNull();
    }
    for (const path of [
      '//other.example/repo/',
      'https://testagent.xspaceagi.com.other.example/repo/',
      'javascript:/repo',
      '/repo-other',
      '/repo/../third-party',
    ]) {
      expect(
        resolveMicroAppMenuPath(repoMenu({ path }), origin, businessOrigin),
      ).toBeNull();
    }
  });

  it('旧 iframe 入口只迁移已确认菜单与可信目标，单次解码和刷新语义不丢失', () => {
    const url = `${businessOrigin}/repo/doc/a?text=50%25#heading`;
    expect(
      resolveMicroAppIframePath(
        `/open-iframe-page/repo?url=${encodeURIComponent(url)}&_refresh=42`,
        origin,
        businessOrigin,
      ),
    ).toBe('/repo/doc/a?text=50%25&_refresh=42#heading');
    expect(
      resolveMicroAppIframePath(
        `/open-iframe-page/message?url=${encodeURIComponent(
          `${businessOrigin}/instant-message`,
        )}`,
        origin,
        businessOrigin,
      ),
    ).toBe('/instant-message');
    for (const path of [
      `/open-iframe-page/repo?url=${encodeURIComponent(
        'https://other.example/repo',
      )}`,
      `/open-iframe-page/repo?url=${encodeURIComponent(
        `${businessOrigin}/third-party`,
      )}`,
      `/open-iframe-page/custom?url=${encodeURIComponent(`${origin}/repo`)}`,
      `/app/1/open-iframe-page/repo?url=${encodeURIComponent(
        `${origin}/repo`,
      )}`,
      '/open-iframe-page/repo',
    ]) {
      expect(
        resolveMicroAppIframePath(path, origin, businessOrigin),
      ).toBeNull();
    }
  });
});
