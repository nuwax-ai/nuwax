import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import {
  getImEntryRedirectScript,
  redirectStandaloneImEntry,
} from '../../micro-frontends/message/overlay/imEntryRedirect.js';
import { getImEntryRedirect } from './imEntryRedirect';

const origin = 'https://agent.nuwax.com:8443';
const mobileEntry = origin + '/m/#/subpackages/pages/im-invite/im-invite';

describe('IM 首屏参数和路径边界', () => {
  it.each(['invite', 'convId', 'userId', 'agentId', 'groupNo', 'spaceId'])(
    '手机把 %s 原样交给完整的 H5 承接路由',
    (key) => {
      const query = '?' + key + '=9007199254740993';
      expect(
        getImEntryRedirect(origin + '/instant-message/' + query, true),
      ).toBe(mobileEntry + query);
    },
  );

  it('保留全部 query、重复键、原始编码和尾部 hash，组合参数由 H5 决定', () => {
    const suffix = '?invite=00-1+2&convId=7&x=%252B%2B%E7%BE%A4&x=2#pane';
    expect(getImEntryRedirect(origin + '/instant-message' + suffix, true)).toBe(
      mobileEntry + suffix,
    );
    expect(
      getImEntryRedirect(origin + '/instant-message/?invite=&spaceId=x', true),
    ).toBe(mobileEntry + '?invite=&spaceId=x');
  });

  it.each([
    '/instant-message',
    '/instant-message/?unknown=1',
    '/instant-message-other?invite=123',
    '/instant-message/assets/?convId=3',
    '/repo/instant-message?convId=3',
    '/agent/12?redirect=/instant-message&convId=3',
    '/invite/space/abc?invite=123',
    '/m/#/subpackages/pages/im-invite/im-invite?convId=3',
  ])('手机不接管无参数入口或无关路径 %s', (path) => {
    expect(getImEntryRedirect(origin + path, true)).toBeNull();
  });

  it.each([
    'file:///instant-message?convId=3',
    'javascript:alert(1)',
    'invalid',
  ])('拒绝非 HTTP(S) 或非法 URL %s', (href) =>
    expect(getImEntryRedirect(href, true)).toBeNull(),
  );

  it('主站旧 M 承接页兼容保留原始 query/hash，hash 参数优先于外层', () => {
    expect(
      getImEntryRedirect(
        origin +
          '/m/?spaceId=1140&convId=8#/subpackages/pages/im-invite/im-invite?convId=9&invite=%252B#pane',
        false,
      ),
    ).toBe(
      origin +
        '/instant-message/?convId=9&invite=%252B&spaceId=1140&convId=8#pane',
    );
  });

  it('主站旧 M 聊天页用 convId；加群页用 invite 保留确认步骤', () => {
    expect(
      getImEntryRedirect(
        origin +
          '/m/#/pages/message/chat?convId=88&spaceId=9&name=%E7%BE%A4#pane',
        false,
      ),
    ).toBe(origin + '/instant-message/?convId=88');
    expect(
      getImEntryRedirect(
        origin +
          '/m/#/subpackages/pages/im-join-group/im-join-group?groupNo=001-2',
        false,
      ),
    ).toBe(origin + '/instant-message/?invite=001-2');
  });

  it.each([
    '/m/#/subpackages/pages/im-invite?invite=123',
    '/m/#/subpackages/pages/im-join-group?groupNo=123',
    '/m/#/pages/message/chat',
    '/m/#/subpackages/pages/agent-detail/agent-detail?id=3',
    '/m/#/subpackages/pages/space-invite/space-invite?code=abc',
    '/something/m/#/subpackages/pages/im-invite/im-invite?convId=1',
    '/instant-message/?convId=1',
  ])('桌面不误接其它页面 %s', (path) => {
    expect(getImEntryRedirect(origin + path, false)).toBeNull();
  });
});

function entryWindow(href: string, mobile = true, embedded = false) {
  return {
    location: { href, replace: vi.fn() },
    navigator: {
      userAgent: mobile ? 'Mozilla/5.0 (iPhone) Mobile' : 'Desktop',
    },
    __POWERED_BY_QIANKUN__: embedded,
  };
}

describe('独立 IM 首屏脚本与模块 guard', () => {
  it('HTML 序列化脚本可独立执行；模块 guard 返回跳转态且不重复导航', () => {
    const browser = entryWindow(origin + '/instant-message/?invite=00-1#pane');
    runInNewContext(getImEntryRedirectScript(), {
      window: browser,
      URL,
      URLSearchParams,
    });
    expect(browser.location.replace).toHaveBeenCalledWith(
      mobileEntry + '?invite=00-1#pane',
    );
    expect(redirectStandaloneImEntry(browser)).toBe(true);
    expect(browser.location.replace).toHaveBeenCalledTimes(1);
  });

  it('没有 HTML 预跳转时，模块 guard 仍阻止独立 IM 启动并执行导航', () => {
    const browser = entryWindow(origin + '/instant-message/?convId=7');
    expect(redirectStandaloneImEntry(browser)).toBe(true);
    expect(browser.location.replace).toHaveBeenCalledWith(
      mobileEntry + '?convId=7',
    );
  });

  it.each([
    [origin + '/instant-message/?convId=7', true, true],
    [origin + '/instant-message/?convId=7', false, false],
    [origin + '/instant-message/', true, false],
    [origin + '/micro-apps/message/index.html?convId=7', true, false],
  ])(
    '不重定向 qiankun、桌面、裸入口或资源入口 %s/%s/%s',
    (href, mobile, embedded) => {
      const browser = entryWindow(href, mobile, embedded);
      runInNewContext(getImEntryRedirectScript(), {
        window: browser,
        URL,
        URLSearchParams,
      });
      expect(redirectStandaloneImEntry(browser)).toBe(false);
      expect(browser.location.replace).not.toHaveBeenCalled();
    },
  );
});
