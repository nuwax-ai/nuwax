import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarkdownCustomThink from '../index';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

// less 映射为「类名即 key」，便于断言 is-expanded 等状态类
vi.mock('@/components/MarkdownCustomThink/index.less', () => ({
  default: new Proxy({}, { get: (_t, key: string) => key }),
}));

const contentClassNameOf = () => {
  // 组件输出：外层 div(header) 与 div(think-content>think-content-inner) 互为兄弟，
  // think-content 类名是 think-content-inner 类名的前缀，需取 inner 的父节点
  const inner = document.querySelector('[class*="think-content-inner"]');
  return inner?.parentElement?.className || '';
};

describe('MarkdownCustomThink', () => {
  it('流式活动思考块默认展开，显示正在思考与实时内容', () => {
    render(
      <MarkdownCustomThink
        content="正在进行的思考内容"
        status="thinking"
        autoCollapse={false}
        defaultCollapsed={false}
      />,
    );

    expect(
      screen.getByText('PC.Components.MarkdownCustomThink.thinking'),
    ).toBeInTheDocument();
    expect(screen.getByText(/正在进行的思考内容/)).toBeInTheDocument();
    expect(contentClassNameOf()).toContain('is-expanded');
  });

  it('被超越（autoCollapse 翻转）后自动收起为已思考摘要', () => {
    const { rerender } = render(
      <MarkdownCustomThink
        content="思考完成"
        status="finished"
        autoCollapse={false}
        defaultCollapsed={false}
      />,
    );
    expect(contentClassNameOf()).toContain('is-expanded');

    rerender(
      <MarkdownCustomThink
        content="思考完成"
        status="finished"
        autoCollapse
        defaultCollapsed={false}
      />,
    );
    expect(
      screen.getByText('PC.Components.MarkdownCustomThink.thought'),
    ).toBeInTheDocument();
    expect(contentClassNameOf()).not.toContain('is-expanded');
  });

  it('历史消息（defaultCollapsed）初始收起，点击头部可展开', () => {
    render(
      <MarkdownCustomThink
        content="历史思考"
        status="finished"
        defaultCollapsed
      />,
    );

    expect(contentClassNameOf()).not.toContain('is-expanded');

    fireEvent.click(
      screen.getByText('PC.Components.MarkdownCustomThink.thought'),
    );
    expect(contentClassNameOf()).toContain('is-expanded');
    expect(screen.getByText(/历史思考/)).toBeInTheDocument();
  });

  it('已带 autoCollapse 重挂载时直接以收起态挂载，无展开闪烁', () => {
    render(
      <MarkdownCustomThink
        content="被超越的思考"
        status="finished"
        autoCollapse
        defaultCollapsed={false}
      />,
    );
    expect(contentClassNameOf()).not.toContain('is-expanded');
  });

  it('显示思考字数统计', () => {
    render(
      <MarkdownCustomThink
        content="12345678"
        status="finished"
        defaultCollapsed
      />,
    );
    expect(
      screen.getByText(/8\s*PC\.Components\.MarkdownCustomThink\.chars/),
    ).toBeInTheDocument();
  });
});
