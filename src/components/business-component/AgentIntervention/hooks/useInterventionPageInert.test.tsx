import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterventionPageInert } from './useInterventionPageInert';

/**
 * jsdom 无 IntersectionObserver：桩成可手动触发的假实现，
 * 借 last 实例在用例里控制「可见/不可见」事件。
 */
class FakeIntersectionObserver {
  static last: FakeIntersectionObserver | null = null;
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    FakeIntersectionObserver.last = this;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  emit(isIntersecting: boolean) {
    this.cb(
      [{ isIntersecting } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/**
 * 构造挂载树：
 * body > [outside, app > [sidebar, chain > [dialog]]]
 * dialog 为 ref 目标；outside / sidebar 是祖先链旁支，应被 inert。
 */
const buildTree = () => {
  const outside = document.createElement('button');
  outside.dataset.probe = 'outside';
  const app = document.createElement('div');
  app.dataset.probe = 'app';
  const sidebar = document.createElement('button');
  sidebar.dataset.probe = 'sidebar';
  const chain = document.createElement('div');
  chain.dataset.probe = 'chain';
  const dialog = document.createElement('div');
  dialog.dataset.probe = 'dialog';
  chain.appendChild(dialog);
  app.append(sidebar, chain);
  document.body.append(outside, app);
  return { outside, app, sidebar, chain, dialog };
};

const probe = (name: string) =>
  document.querySelector(`[data-probe="${name}"]`) as HTMLElement;

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  FakeIntersectionObserver.last = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useInterventionPageInert', () => {
  it('激活且可见时：祖先链旁支全部 inert，链自身与对话框不受影响', () => {
    const { dialog } = buildTree();
    renderHook(() => useInterventionPageInert(true, { current: dialog }));
    FakeIntersectionObserver.last?.emit(true);

    expect(probe('outside')).toHaveAttribute('inert');
    expect(probe('sidebar')).toHaveAttribute('inert');
    expect(probe('dialog')).not.toHaveAttribute('inert');
    expect(probe('chain')).not.toHaveAttribute('inert');
    expect(probe('app')).not.toHaveAttribute('inert');
  });

  it('不可见时不挂拦截；恢复可见补挂、再次隐藏拆挂（后台保活会话语义）', () => {
    const { dialog } = buildTree();
    renderHook(() => useInterventionPageInert(true, { current: dialog }));

    FakeIntersectionObserver.last?.emit(false);
    expect(probe('outside')).not.toHaveAttribute('inert');

    FakeIntersectionObserver.last?.emit(true);
    expect(probe('outside')).toHaveAttribute('inert');

    FakeIntersectionObserver.last?.emit(false);
    expect(probe('outside')).not.toHaveAttribute('inert');
  });

  it('卸载时还原；他方预置的 inert 保留不被误摘', () => {
    const { dialog, outside } = buildTree();
    const preset = document.createElement('div');
    preset.dataset.probe = 'preset';
    document.body.appendChild(preset);
    preset.setAttribute('inert', '');

    const { unmount } = renderHook(() =>
      useInterventionPageInert(true, { current: dialog }),
    );
    FakeIntersectionObserver.last?.emit(true);
    expect(outside).toHaveAttribute('inert');

    unmount();
    expect(outside).not.toHaveAttribute('inert');
    expect(preset).toHaveAttribute('inert');
  });

  it('环境无 IntersectionObserver 时退化为立即挂拦截', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { dialog, outside } = buildTree();
    const { unmount } = renderHook(() =>
      useInterventionPageInert(true, { current: dialog }),
    );

    expect(outside).toHaveAttribute('inert');
    unmount();
    expect(outside).not.toHaveAttribute('inert');
  });

  it('active=false 时不做任何事', () => {
    const { dialog, outside } = buildTree();
    renderHook(() => useInterventionPageInert(false, { current: dialog }));

    FakeIntersectionObserver.last?.emit(true);
    expect(outside).not.toHaveAttribute('inert');
  });
});
