import { describe, expect, it } from 'vitest';

import {
  appendOpenedTab,
  getAppTabNavPath,
  isAppTabActive,
  isAppTabLimitReached,
  MAX_OPENED_APP_TABS,
  pickNextActiveTab,
  removeOpenedTab,
  type OpenedAppTabInfo,
} from './openedAppTabs';

const makeTab = (
  routePath: string,
  overrides: Partial<OpenedAppTabInfo> = {},
): OpenedAppTabInfo => ({
  targetId: 1,
  name: '应用',
  icon: '',
  routePath,
  openedAt: 0,
  lastActiveAt: 0,
  ...overrides,
});

describe('appendOpenedTab', () => {
  it('新标签按打开顺序追加（双时间戳写入）', () => {
    const next = appendOpenedTab(
      [makeTab('/user-app/1', { openedAt: 100, lastActiveAt: 100 })],
      makeTab('/agent/2', { name: '网页应用' }),
      200,
    );
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({
      routePath: '/agent/2',
      name: '网页应用',
      openedAt: 200,
      lastActiveAt: 200,
    });
  });

  it('重复打开原位保留且仅刷新 lastActiveAt（显示序不变）', () => {
    const first = makeTab('/user-app/1', {
      openedAt: 100,
      lastActiveAt: 100,
      name: '旧名',
    });
    const second = makeTab('/user-app/2', {
      openedAt: 150,
      lastActiveAt: 150,
    });
    const next = appendOpenedTab(
      [first, second],
      makeTab('/user-app/1', { name: '新名' }),
      300,
    );
    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({
      routePath: '/user-app/1',
      name: '新名',
      openedAt: 100,
      lastActiveAt: 300,
    });
    expect(next[1].lastActiveAt).toBe(150);
  });
});

describe('removeOpenedTab', () => {
  it('存在的标签被移除', () => {
    const tabs = [makeTab('/user-app/1'), makeTab('/agent/2')];
    const next = removeOpenedTab(tabs, '/user-app/1');
    expect(next).toHaveLength(1);
    expect(next[0].routePath).toBe('/agent/2');
  });

  it('移除不存在的 routePath 保持原引用（防下游 effect 抖动）', () => {
    const tabs = [makeTab('/user-app/1')];
    expect(removeOpenedTab(tabs, '/agent/9')).toBe(tabs);
    expect(removeOpenedTab([], '/agent/9')).toEqual([]);
  });
});

describe('pickNextActiveTab', () => {
  it('按 lastActiveAt（而非 openedAt）取最近打开的剩余标签', () => {
    const tabs = [
      makeTab('/user-app/1', { openedAt: 100, lastActiveAt: 500 }),
      makeTab('/agent/2', { openedAt: 300, lastActiveAt: 400 }),
      makeTab('/user-app/3', { openedAt: 200, lastActiveAt: 600 }),
    ];
    // 关闭 /user-app/3（当前激活），剩余中最近打开的是 /user-app/1
    expect(pickNextActiveTab(tabs, '/user-app/3')?.routePath).toBe(
      '/user-app/1',
    );
  });

  it('无剩余标签返回 null', () => {
    expect(
      pickNextActiveTab([makeTab('/user-app/1')], '/user-app/1'),
    ).toBeNull();
    expect(pickNextActiveTab([], '/user-app/1')).toBeNull();
  });
});

describe('isAppTabActive', () => {
  it('路由精确命中标签', () => {
    const tabs = [makeTab('/user-app/1'), makeTab('/agent/2')];
    expect(isAppTabActive(tabs, '/user-app/1')).toBe(true);
    expect(isAppTabActive(tabs, '/agent/2')).toBe(true);
  });

  it('前缀相似或无关路由不命中', () => {
    const tabs = [makeTab('/user-app/1')];
    expect(isAppTabActive(tabs, '/user-app/12')).toBe(false);
    expect(isAppTabActive(tabs, '/nuwa-apps')).toBe(false);
    expect(isAppTabActive(tabs, '')).toBe(false);
    expect(isAppTabActive([], '/user-app/1')).toBe(false);
  });
});

describe('isAppTabLimitReached', () => {
  it('上限常量为 5', () => {
    expect(MAX_OPENED_APP_TABS).toBe(5);
  });

  it('已满 5 个时点新应用受限', () => {
    const tabs = [1, 2, 3, 4, 5].map((id) => makeTab(`/user-app/${id}`));
    expect(isAppTabLimitReached(tabs, '/agent/9')).toBe(true);
  });

  it('重复打开已存在标签不受限（原位刷新不新增）', () => {
    const tabs = [1, 2, 3, 4, 5].map((id) => makeTab(`/user-app/${id}`));
    expect(isAppTabLimitReached(tabs, '/user-app/3')).toBe(false);
  });

  it('未满 5 个时不受限', () => {
    const tabs = [1, 2, 3, 4].map((id) => makeTab(`/user-app/${id}`));
    expect(isAppTabLimitReached(tabs, '/agent/9')).toBe(false);
    expect(isAppTabLimitReached([], '/agent/9')).toBe(false);
  });
});

describe('getAppTabNavPath', () => {
  it('三方应用带 homepageUrl query（URL 编码）供 UserApp 页 iframe 直载', () => {
    expect(
      getAppTabNavPath({
        routePath: '/user-app/228',
        homepageUrl: 'http://www.baidu.com?a=1&b=2',
      }),
    ).toBe(
      `/user-app/228?homepageUrl=${encodeURIComponent(
        'http://www.baidu.com?a=1&b=2',
      )}`,
    );
  });

  it('无 homepageUrl 时跳纯 routePath（高亮让位仍按 pathname 精确匹配）', () => {
    expect(getAppTabNavPath({ routePath: '/agent/9' })).toBe('/agent/9');
    expect(
      getAppTabNavPath({ routePath: '/user-app/105', homepageUrl: '' }),
    ).toBe('/user-app/105');
  });
});
