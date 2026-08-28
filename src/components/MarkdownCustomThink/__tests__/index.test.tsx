import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  it('思考中渲染单行滚动条带：正在思考 + 计时 + 流动内容，无多行展开区', () => {
    render(
      <MarkdownCustomThink
        content="正在进行的思考内容"
        status="thinking"
        autoCollapse={false}
        defaultCollapsed={false}
      />,
    );

    // 单行 ticker：标签含「正在思考 · 0s」计时
    expect(
      screen.getByText(/PC\.Components\.MarkdownCustomThink\.thinking/),
    ).toBeInTheDocument();
    expect(screen.getByText(/·\s*0s/)).toBeInTheDocument();
    // 内容在单行条带文本中
    expect(screen.getByText(/正在进行的思考内容/)).toBeInTheDocument();
    expect(
      document.querySelector('[class*="think-ticker-viewport"]'),
    ).toBeInTheDocument();
    // 思考中不做多行预览：不渲染 think-content 展开区
    expect(document.querySelector('[class*="think-content-inner"]')).toBeNull();
  });

  it('思考计时每秒递增', () => {
    vi.useFakeTimers();
    try {
      render(
        <MarkdownCustomThink
          content="思考"
          status="thinking"
          autoCollapse={false}
          defaultCollapsed={false}
        />,
      );
      expect(screen.getByText(/·\s*0s/)).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText(/·\s*3s/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('思考收口后回到「已思考」折叠形态（ticker 消失）', () => {
    const { rerender } = render(
      <MarkdownCustomThink
        content="思考完成"
        status="thinking"
        autoCollapse={false}
        defaultCollapsed={false}
      />,
    );
    expect(
      document.querySelector('[class*="think-ticker"]'),
    ).toBeInTheDocument();

    rerender(
      <MarkdownCustomThink
        content="思考完成"
        status="finished"
        autoCollapse={false}
        defaultCollapsed={false}
      />,
    );
    expect(document.querySelector('[class*="think-ticker"]')).toBeNull();
    expect(
      screen.getByText('PC.Components.MarkdownCustomThink.thought'),
    ).toBeInTheDocument();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('收起态不显示字数统计（按反馈移除）', () => {
    render(
      <MarkdownCustomThink
        content="12345678"
        status="finished"
        defaultCollapsed
      />,
    );
    expect(
      screen.queryByText(/PC\.Components\.MarkdownCustomThink\.chars/),
    ).not.toBeInTheDocument();
  });
});
