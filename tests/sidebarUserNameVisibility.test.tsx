import { useSidebarUserNameVisibility } from '@/layouts/DynamicMenusLayout/SidebarNavLayout/useSidebarUserNameVisibility';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let rowWidth: number;
let avatarWidth: number;
let thresholdWidth: number;
let onResize: ResizeObserverCallback;
const disconnect = vi.fn();
const observe = vi.fn();

function AccountRow() {
  const { userRowRef, nameThresholdRef, showUserName } =
    useSidebarUserNameVisibility();
  return (
    <div
      ref={userRowRef}
      data-testid="account-row"
      title="完整的用户名"
      style={{ display: 'flex', columnGap: 10, padding: 2 }}
    >
      <div data-testid="avatar" />
      <span
        data-testid="name"
        style={{ display: showUserName ? undefined : 'none' }}
      >
        完整的用户名
      </span>
      <span
        ref={nameThresholdRef}
        data-testid="threshold"
        aria-hidden="true"
        style={{ position: 'absolute', width: '2em', height: 0 }}
      />
    </div>
  );
}

function resize() {
  act(() => onResize([], {} as ResizeObserver));
}

describe('账号栏姓名最小可读宽度', () => {
  beforeEach(() => {
    rowWidth = 76;
    avatarWidth = 34;
    thresholdWidth = 28;
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          onResize = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function () {
        const width =
          this.dataset.testid === 'account-row'
            ? rowWidth
            : this.dataset.testid === 'avatar'
            ? avatarWidth
            : this.dataset.testid === 'threshold'
            ? thresholdWidth
            : 0;
        return { width } as DOMRect;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('刚好容纳 2em 时保留姓名，小于阈值时整段隐藏', () => {
    render(<AccountRow />);
    expect(screen.getByTestId('name')).toBeVisible();
    rowWidth = 75.9;
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    expect(screen.getByTestId('avatar')).toBeVisible();
    expect(screen.getByTestId('account-row')).toHaveAttribute(
      'title',
      '完整的用户名',
    );
  });

  it('隐藏后继续按原间隔判定，反复测量不会在阈值附近抖动，扩宽后恢复', () => {
    rowWidth = 70;
    render(<AccountRow />);
    expect(screen.getByTestId('name')).not.toBeVisible();
    // 省下 10px 间隔并不意味着足以重新显示姓名。
    resize();
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    rowWidth = 76;
    resize();
    expect(screen.getByTestId('name')).toBeVisible();
  });

  it('观察字体标尺，字体放大时隐藏、字体缩小后重新显示', () => {
    render(<AccountRow />);
    thresholdWidth = 32;
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    thresholdWidth = 24;
    resize();
    expect(screen.getByTestId('name')).toBeVisible();
    expect(observe.mock.calls.map(([target]) => target)).toEqual([
      screen.getByTestId('account-row'),
      screen.getByTestId('avatar'),
      screen.getByTestId('threshold'),
    ]);
  });

  it('头像变宽或右侧操作挤占账号行时隐藏，操作减少后恢复', () => {
    render(<AccountRow />);
    avatarWidth = 36;
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    avatarWidth = 34;
    rowWidth = 74;
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    rowWidth = 90;
    resize();
    expect(screen.getByTestId('name')).toBeVisible();
  });

  it('未布局时保留默认显示，恢复有效测量后判断，并在卸载时清理', () => {
    thresholdWidth = 0;
    rowWidth = 0;
    const { unmount } = render(<AccountRow />);
    expect(screen.getByTestId('name')).toBeVisible();
    thresholdWidth = 28;
    rowWidth = 70;
    resize();
    expect(screen.getByTestId('name')).not.toBeVisible();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('无 ResizeObserver 时仍在窗口变化后复算', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<AccountRow />);
    rowWidth = 70;
    fireEvent(window, new Event('resize'));
    expect(screen.getByTestId('name')).not.toBeVisible();
  });
});
