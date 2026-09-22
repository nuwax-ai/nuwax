import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceLayout from './index';

vi.mock('umi', () => ({
  history: { back: vi.fn() },
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

vi.mock('@/components/PageContainerHeader/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: (props: React.HTMLAttributes<HTMLButtonElement>) => (
    <button type="button" aria-label="返回" {...props} />
  ),
}));

describe('WorkspaceLayout', () => {
  it('把既有标题栏插槽统一映射到 PageContainerHeader', () => {
    render(
      <WorkspaceLayout
        title="用户管理"
        titleLeftSlot={<span>前缀</span>}
        leftSlot={<button type="button">筛选</button>}
        centerSlot={<button type="button">中间页签</button>}
        rightSlot={<button type="button">新增用户</button>}
      >
        <div>页面内容</div>
      </WorkspaceLayout>,
    );

    expect(
      screen.getByRole('heading', { name: '用户管理', level: 3 }),
    ).toBeTruthy();
    expect(screen.getByText('前缀')).toBeTruthy();
    expect(screen.getByRole('button', { name: '筛选' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '中间页签' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '新增用户' })).toBeTruthy();
    expect(screen.getByText('页面内容')).toBeTruthy();
  });

  it('保留返回按钮回调', () => {
    const onBack = vi.fn();
    render(<WorkspaceLayout title="详情" back onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
