import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  messageScopedStyles,
  scopeSelector,
  splitSelectorList,
} from './overlay/scope-styles.mjs';
import {
  beginMessageRuntime,
  endMessageRuntime,
  getMessageElementById,
  getMessageHostSnapshot,
  getMessageInputRoot,
  getMessagePortalRoot,
  isMessageActive,
  normalizeMessagePath,
  redirectMessageAuth,
  toMessagePortalPoint,
  updateMessageRuntime,
} from './overlay/src/hostRuntime';

afterEach(() => {
  endMessageRuntime();
  document.body.innerHTML = '';
});

describe('消息宿主运行时边界', () => {
  it('接受本应用深链，拒绝其它模块和折叠逃逸路径', () => {
    expect(normalizeMessagePath('/instant-message?chat=4#message')).toBe(
      '/instant-message?chat=4#message',
    );
    expect(normalizeMessagePath('/instant-message/conversation/4')).toBe(
      '/instant-message/conversation/4',
    );
    expect(normalizeMessagePath('/instant-message-other')).toBeNull();
    expect(normalizeMessagePath('/instant-message/../repo')).toBeNull();
    expect(normalizeMessagePath('/repo/doc/a')).toBeNull();
  });

  it('隐藏不接其它路径，不满足已读active；返回恢复原消息路径', () => {
    beginMessageRuntime(
      document.createElement('div'),
      { path: '/instant-message?chat=4' },
      true,
    );
    updateMessageRuntime({ active: false, path: '/repo/doc/a' });
    expect(isMessageActive()).toBe(false);
    expect(getMessageHostSnapshot().path).toBe('/instant-message?chat=4');
    updateMessageRuntime({ active: true, path: '/instant-message?chat=5' });
    expect(isMessageActive()).toBe(true);
    expect(getMessageHostSnapshot().path).toBe('/instant-message?chat=5');
  });

  it('弹层、输入和启动骨架限定到消息根，不碰宿主同名元素', () => {
    const hostBoot = document.createElement('div');
    hostBoot.id = 'boot-skeleton';
    const root = document.createElement('div');
    const appBoot = document.createElement('div');
    appBoot.id = 'boot-skeleton';
    root.appendChild(appBoot);
    document.body.append(hostBoot, root);
    beginMessageRuntime(root, {}, true);
    expect(getMessagePortalRoot()).toBe(root);
    expect(getMessageInputRoot()).toBe(root);
    expect(getMessageElementById('boot-skeleton')).toBe(appBoot);
    getMessageElementById('boot-skeleton')?.remove();
    expect(document.getElementById('boot-skeleton')).toBe(hostBoot);
    endMessageRuntime();
    expect(root.hasAttribute('data-message-app-scope')).toBe(false);
  });

  it('失效走宿主回调，不误用应用内部路由回调', () => {
    const onAuthExpired = vi.fn();
    const onNavigate = vi.fn();
    beginMessageRuntime(
      document.createElement('div'),
      { onAuthExpired, onNavigate },
      true,
    );
    redirectMessageAuth('https://sso.example/login');
    expect(onAuthExpired).toHaveBeenCalledWith('https://sso.example/login');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('图片右键菜单扣除内嵌根的视口偏移和边框，跟随根容器移动', () => {
    const root = document.createElement('div');
    const rect = { left: 220, top: 72 };
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(
      () => rect as DOMRect,
    );
    Object.defineProperties(root, {
      clientLeft: { value: 2 },
      clientTop: { value: 3 },
    });
    beginMessageRuntime(root, {}, true);
    expect(toMessagePortalPoint(302, 135)).toEqual({ x: 80, y: 60 });
    rect.left = 260;
    rect.top = 92;
    expect(toMessagePortalPoint(342, 155)).toEqual({ x: 80, y: 60 });
  });

  it('独立消息页图片菜单保留视口坐标，不受应用根位置影响', () => {
    const root = document.createElement('div');
    const readRect = vi
      .spyOn(root, 'getBoundingClientRect')
      .mockReturnValue({ left: 220, top: 72 } as DOMRect);
    beginMessageRuntime(root, {}, false);
    expect(toMessagePortalPoint(302, 135)).toEqual({ x: 302, y: 135 });
    expect(readRect).not.toHaveBeenCalled();
  });
});

describe('消息样式边界', () => {
  it('根重置收敛在子根，antd覆盖跟随私有prefix，选择器内部逗号不拆断', () => {
    expect(scopeSelector('body')).toBe('[data-message-app-scope]');
    expect(scopeSelector('.bubble .ant-image')).toBe(
      '[data-message-app-scope] .bubble .nuwax-im-image',
    );
    expect(splitSelectorList(':is(.one,.two), [data-label="a,b"]')).toEqual([
      ':is(.one,.two)',
      ' [data-label="a,b"]',
    ]);
  });

  it('动画和视口尺寸隔离，不改keyframe子规则', () => {
    const frame = { name: 'keyframes', params: 'pulse' };
    const rules = [
      { selector: '.chat-layout' },
      { selector: 'from', parent: { type: 'atrule', name: 'keyframes' } },
    ];
    const declarations = [
      { prop: 'animation', value: 'pulse 1s linear' },
      { prop: 'height', value: '100vh' },
    ];
    messageScopedStyles().Once({
      walkAtRules: (visit) => visit(frame),
      walkRules: (visit) => rules.forEach(visit),
      walkDecls: (visit) => declarations.forEach(visit),
    });
    expect(frame.params).toBe('message-app-pulse');
    expect(rules[0].selector).toBe('[data-message-app-scope] .chat-layout');
    expect(rules[1].selector).toBe('from');
    expect(declarations[0].value).toBe('message-app-pulse 1s linear');
    expect(declarations[1].value).toBe('100cqh');
  });
});
