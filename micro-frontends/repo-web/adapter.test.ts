import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scopeSelector, splitSelectorList } from './overlay/scope-styles.mjs';
import {
  beginRepoRuntime,
  captureRepoAuthRedirect,
  endRepoRuntime,
  getRepoHostSnapshot,
  getRepoMentionPosition,
  getRepoPortalRoot,
  getRepoPortalViewport,
  limitRepoPortalOffset,
  normalizeRepoPath,
  recordRepoNavigation,
  setRepoDocumentTitle,
  toRepoPortalPoint,
  toRepoPortalRect,
  updateRepoRuntime,
} from './overlay/src/hostRuntime';
import { initTreeBroadcast } from './overlay/src/lib/treeBroadcast';

afterEach(() => {
  endRepoRuntime();
  vi.unstubAllGlobals();
});

describe('资料库宿主路径契约', () => {
  it('限制在 /repo 路径，拒绝跨应用和路径折叠逃逸', () => {
    expect(normalizeRepoPath('/repo?nav=0#selection')).toBe(
      '/repo/?nav=0#selection',
    );
    expect(normalizeRepoPath('/repo/doc/test')).toBe('/repo/doc/test');
    expect(normalizeRepoPath('/repo-other')).toBeNull();
    expect(normalizeRepoPath('/repo/../home')).toBeNull();
    expect(normalizeRepoPath('https://other.example/repo/')).toBeNull();
  });

  it('隐藏时保持内部深链，业务导航不写宿主；重新激活接受本应用路径', () => {
    const onNavigate = vi.fn();
    beginRepoRuntime(
      document.createElement('div'),
      { path: '/repo/doc/a', onNavigate },
      true,
    );
    updateRepoRuntime({ active: false, path: '/home' });
    expect(getRepoHostSnapshot()).toMatchObject({
      active: false,
      path: '/repo/doc/a',
    });
    recordRepoNavigation('/repo/doc/b', false);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(getRepoHostSnapshot().path).toBe('/repo/doc/b');
    updateRepoRuntime({ active: true, path: '/repo/doc/a' });
    expect(getRepoHostSnapshot()).toMatchObject({
      active: true,
      path: '/repo/doc/a',
    });
  });

  it('业务导航与宿主回传同路径只发一次，query replace保留深链', () => {
    const onNavigate = vi.fn();
    beginRepoRuntime(
      document.createElement('div'),
      { path: '/repo/', onNavigate },
      true,
    );
    recordRepoNavigation('/repo/doc/a?nav=0', true);
    const command = getRepoHostSnapshot().command;
    updateRepoRuntime({ path: '/repo/doc/a?nav=0' });
    recordRepoNavigation('/repo/doc/a?nav=0', true);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('/repo/doc/a?nav=0', true);
    expect(getRepoHostSnapshot().command).toBe(command);
  });

  it('弹层归子根，嵌入标题保持宿主值，独立运行可以设置标题', () => {
    const root = document.createElement('div');
    document.title = '宿主';
    beginRepoRuntime(root, {}, true);
    expect(getRepoPortalRoot()).toBe(root);
    setRepoDocumentTitle('文档');
    expect(document.title).toBe('宿主');
    endRepoRuntime();
    expect(root.hasAttribute('data-repo-app-scope')).toBe(false);
    beginRepoRuntime(root, {}, false);
    setRepoDocumentTitle('独立文档');
    expect(document.title).toBe('独立文档');
  });

  it('隐藏实例认证失效交给宿主，旧实例迟到响应不清除新会话', () => {
    const expired = vi.fn();
    const nextExpired = vi.fn();
    const root = document.createElement('div');
    beginRepoRuntime(root, { onAuthExpired: expired, active: false }, true);
    const redirect = captureRepoAuthRedirect();
    redirect('https://sso.example/login');
    expect(expired).toHaveBeenCalledWith('https://sso.example/login');
    endRepoRuntime();
    redirect('/login');
    expect(expired).toHaveBeenCalledTimes(1);
    // 容器复用也必须用 generation 区分新账号实例。
    beginRepoRuntime(root, { onAuthExpired: nextExpired }, true);
    redirect('/login');
    expect(nextExpired).not.toHaveBeenCalled();
    captureRepoAuthRedirect()('/login');
    expect(nextExpired).toHaveBeenCalledWith('/login');
  });
});

describe('资料库弹层坐标边界', () => {
  it('按当前子根位置和边框换算鼠标与元素锚点', () => {
    const root = document.createElement('div');
    const rect = { left: 220, top: 72 };
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(
      () => rect as DOMRect,
    );
    Object.defineProperties(root, {
      clientLeft: { value: 2 },
      clientTop: { value: 3 },
      clientWidth: { value: 400 },
      clientHeight: { value: 300 },
    });
    beginRepoRuntime(root, {}, true);
    expect(getRepoPortalViewport()).toEqual({
      left: 222,
      top: 75,
      width: 400,
      height: 300,
    });
    expect(toRepoPortalPoint(302, 135)).toEqual({ left: 80, top: 60 });
    expect(
      toRepoPortalRect({ left: 302, right: 342, top: 135, bottom: 155 }),
    ).toEqual({
      left: 80,
      right: 120,
      top: 60,
      bottom: 80,
      width: 40,
      height: 20,
    });
    rect.left = 260;
    expect(toRepoPortalPoint(342, 135)).toEqual({ left: 80, top: 60 });
    expect(limitRepoPortalOffset(350, 190, 'x')).toBe(210);
    expect(limitRepoPortalOffset(200, 320, 'y')).toBe(0);
  });

  it('提及靠近右下角时在子根内向上显示并限制宽度', () => {
    const root = document.createElement('div');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      left: 220,
      top: 72,
    } as DOMRect);
    Object.defineProperties(root, {
      clientWidth: { value: 400 },
      clientHeight: { value: 300 },
    });
    beginRepoRuntime(root, {}, true);
    expect(
      getRepoMentionPosition(
        { left: 600, right: 610, top: 352, bottom: 362 },
        180,
        120,
      ),
    ).toEqual({ left: 212, top: 156 });
  });

  it('独立运行保持视口坐标和原有菜单定位', () => {
    const root = document.createElement('div');
    const readRect = vi.spyOn(root, 'getBoundingClientRect');
    beginRepoRuntime(root, {}, false);
    expect(toRepoPortalPoint(302, 135)).toEqual({ left: 302, top: 135 });
    expect(
      getRepoMentionPosition(
        { left: 20, right: 30, top: 40, bottom: 60 },
        100,
        80,
      ),
    ).toEqual({ left: 20, top: 64 });
    expect(readRect).not.toHaveBeenCalled();
  });
});

describe('资料库静态样式作用域', () => {
  it('保留复合选择器和属性值的逗号', () => {
    expect(splitSelectorList('button:is(.a,.b), [data-label="a,b"]')).toEqual([
      'button:is(.a,.b)',
      ' [data-label="a,b"]',
    ]);
    expect(scopeSelector(':root')).toBe('[data-repo-app-scope]');
    expect(scopeSelector('body.sheet-fxbar-dragging *')).toBe(
      '[data-repo-app-scope].sheet-fxbar-dragging *',
    );
    expect(scopeSelector('button')).toBe('[data-repo-app-scope] button');
    expect(scopeSelector('[data-repo-app-scope] > .portal')).toBe(
      '[data-repo-app-scope] > .portal',
    );
  });
});

describe('目录树广播实例清理', () => {
  const channels: Array<{
    onmessage: null | ((event: MessageEvent) => void);
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  }> = [];

  beforeEach(() => {
    channels.length = 0;
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        onmessage = null;
        postMessage = vi.fn();
        close = vi.fn();
        constructor() {
          channels.push(this);
        }
      },
    );
  });

  it('卸载关闭通道与监听，重挂不复用已关闭实例', () => {
    const dispose = initTreeBroadcast();
    expect(initTreeBroadcast()).toBe(dispose);
    window.dispatchEvent(
      new CustomEvent('repo:tree-changed', { detail: { spaceId: 7 } }),
    );
    expect(channels[0].postMessage).toHaveBeenCalledTimes(1);
    expect(channels[0].postMessage).toHaveBeenCalledWith({ spaceId: 7 });
    dispose();
    expect(channels[0].close).toHaveBeenCalledOnce();
    window.dispatchEvent(new CustomEvent('repo:tree-changed'));
    expect(channels[0].postMessage).toHaveBeenCalledOnce();
    const nextDispose = initTreeBroadcast();
    expect(channels).toHaveLength(2);
    nextDispose();
  });
});
