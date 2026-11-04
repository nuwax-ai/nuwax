/**
 * 主站首屏与独立 IM HTML 共用；本文件随 overlay 进入独立构建及缓存指纹。
 * 函数会序列化进首屏脚本，必须自包含，不依赖模块外部变量。
 */
export function getImEntryRedirect(href, mobile) {
  try {
    const current = new URL(href);
    if (current.protocol !== 'http:' && current.protocol !== 'https:')
      return null;
    const path = current.pathname;
    if (mobile) {
      if (path !== '/instant-message' && path !== '/instant-message/')
        return null;
      const incoming = new URLSearchParams(current.search);
      if (
        !['invite', 'convId', 'userId', 'agentId', 'groupNo', 'spaceId'].some(
          (key) => incoming.has(key),
        )
      ) {
        return null;
      }
      // 原始 query 全量透传；第二个 raw # 会被 uni-router 并入最后一个业务参数，
      // 所以 PC 锚点只放进独立 metadata，不能截断 query 中本来就非法的 %23。
      return (
        current.origin +
        '/m/#/subpackages/pages/im-invite/im-invite' +
        current.search +
        (current.hash
          ? '&__imEntryHash=' + encodeURIComponent(current.hash)
          : '')
      );
    }
    // 仅供经过主站首屏脚本的旧 M 链接兼容；独立 H5 入口不执行此脚本。
    if (path !== '/m' && path !== '/m/') return null;
    const body = current.hash.slice(1);
    const fragmentAt = body.indexOf('#');
    const fragment = fragmentAt >= 0 ? body.slice(fragmentAt) : '';
    const route = fragmentAt >= 0 ? body.slice(0, fragmentAt) : body;
    const queryAt = route.indexOf('?');
    const hashPath = queryAt >= 0 ? route.slice(0, queryAt) : route;
    const hashQuery = queryAt >= 0 ? route.slice(queryAt + 1) : '';
    // 与 H5 authBrowserQuery 一致：hash 参数优先，外层 search 作为后备。
    const query = [hashQuery, current.search.slice(1)]
      .filter(Boolean)
      .join('&');
    if (hashPath === '/subpackages/pages/im-invite/im-invite') {
      return (
        current.origin +
        '/instant-message/' +
        (query ? '?' + query : '') +
        fragment
      );
    }
    const params = new URLSearchParams(query);
    if (hashPath === '/pages/message/chat') {
      const convId = params.get('convId');
      if (!convId) return null;
      return (
        current.origin +
        '/instant-message/?convId=' +
        encodeURIComponent(convId)
      );
    }
    if (hashPath === '/subpackages/pages/im-join-group/im-join-group') {
      const groupNo = params.get('groupNo');
      if (!groupNo) return null;
      // groupNo 直达会自动申请，invite 保留移动加群页原本的确认步骤。
      return (
        current.origin +
        '/instant-message/?invite=' +
        encodeURIComponent(groupNo)
      );
    }
    return null;
  } catch {
    return null;
  }
}

/** 返回 true 时不能挂载独立 IM，防止跳转提交前启动会话请求。 */
export function redirectStandaloneImEntry(browser) {
  if (browser.__POWERED_BY_QIANKUN__) return false;
  const target = getImEntryRedirect(
    browser.location.href,
    /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(browser.navigator.userAgent),
  );
  if (!target) return false;
  if (browser.__NUWAX_IM_ENTRY_REDIRECT__ !== target) {
    browser.__NUWAX_IM_ENTRY_REDIRECT__ = target;
    browser.location.replace(target);
  }
  return true;
}

/** HTML 先跳转，模块入口复用同一 guard；不得引用独立构建之外的主站源码。 */
export function getImEntryRedirectScript() {
  return `(function () {
    const getImEntryRedirect = (${getImEntryRedirect.toString()});
    const redirectStandaloneImEntry = (${redirectStandaloneImEntry.toString()});
    redirectStandaloneImEntry(window);
  })();`;
}
