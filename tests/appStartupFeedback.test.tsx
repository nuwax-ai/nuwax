import AppStartup, {
  STARTUP_WAIT_NOTICE_MS,
} from '@/components/business-component/AppStartup';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/business-component/AppStartup/index.less', () => ({
  default: {},
}));

describe('首屏启动反馈', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('立即反馈加载，15s 后明确等待过久但不自动重试', () => {
    const reload = vi.fn();
    render(<AppStartup onReload={reload} />);
    expect(screen.getByRole('status')).toHaveTextContent('正在加载应用');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(STARTUP_WAIT_NOTICE_MS - 1));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status')).toHaveTextContent('加载耗时较长');
    expect(reload).not.toHaveBeenCalled();
  });

  it('失败立即显示安全文案和重试，不依赖错误原文', () => {
    render(<AppStartup failed />);
    expect(screen.getByRole('alert')).toHaveTextContent('暂时无法完成初始化');
    expect(screen.getByRole('button')).toBeEnabled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('重试只触发一次整文档重新加载，不清除已有 token', () => {
    localStorage.setItem('ACCESS_TOKEN', 'existing-token');
    const reload = vi.fn();
    render(<AppStartup failed onReload={reload} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(reload).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    expect(localStorage.getItem('ACCESS_TOKEN')).toBe('existing-token');
  });

  it('请求自然恢复后卸载清理计时器，不触发重试', () => {
    const reload = vi.fn();
    const { unmount } = render(<AppStartup onReload={reload} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(STARTUP_WAIT_NOTICE_MS));
    expect(reload).not.toHaveBeenCalled();
  });
});
