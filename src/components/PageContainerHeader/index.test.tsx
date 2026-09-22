import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PageContainerHeader from './index';

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

describe('PageContainerHeader', () => {
  it('渲染标题、标题附加区、中间区与右侧操作区', () => {
    render(
      <PageContainerHeader
        title="MCP管理"
        titlePrefix={<button type="button">返回</button>}
        titleExtra={<button type="button">全部</button>}
        middle={<button type="button">自定义服务</button>}
        actions={<button type="button">创建MCP服务</button>}
        aria-label="页面标题栏"
      />,
    );

    expect(screen.getByRole('banner', { name: '页面标题栏' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'MCP管理', level: 3 }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: '返回' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '全部' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '自定义服务' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '创建MCP服务' })).toBeTruthy();
  });

  it('缺少左侧或右侧插槽时不渲染空容器', () => {
    const { container, rerender } = render(
      <PageContainerHeader actions={<button type="button">刷新</button>} />,
    );
    expect(container.querySelector('.leading')).toBeNull();
    expect(container.querySelector('.actions')).toBeTruthy();

    rerender(<PageContainerHeader title="标题" />);
    expect(container.querySelector('.leading')).toBeTruthy();
    expect(container.querySelector('.actions')).toBeNull();
  });
});
