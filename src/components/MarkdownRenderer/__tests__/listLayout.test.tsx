import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('../index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('../ds-markdown.css', () => ({}));
vi.mock('ds-markdown/katex.css', () => ({}));
vi.mock('@/components/MarkdownCustomProcess', () => ({ default: () => null }));
vi.mock('@/components/MarkdownCustomProcessGroup', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/MarkdownCustomThink', () => ({ default: () => null }));
vi.mock('@/components/ChatView/ChatBottomDebug', () => ({
  default: () => null,
}));
vi.mock('umi', () => ({
  history: { push: vi.fn() },
  useModel: () => ({ isAppSidebarMode: false }),
}));

import { stripCustomTags } from '@/features/conversation/presentation-v2/parseMessageSegments';
import { PureMarkdownRenderer } from '../index';

afterEach(cleanup);

describe('真实 Markdown 渲染链路的列表边界', () => {
  it.each([
    ['ul', '- 项目一\n- 项目二'],
    ['ol', '1. 项目一\n2. 项目二'],
  ])('残留 HTML 包装后的 %s 在流式与终态正文中保持列表', async (tag, items) => {
    const raw = `<div>补充说明：\n${items}\n</div>`;
    const { container, rerender } = render(
      <PureMarkdownRenderer id="list" disableTyping>
        {raw}
      </PureMarkdownRenderer>,
    );
    await waitFor(() =>
      expect(container.querySelectorAll(`${tag} > li`)).toHaveLength(2),
    );
    rerender(
      <PureMarkdownRenderer id="list-final" disableTyping>
        {stripCustomTags(raw)}
      </PureMarkdownRenderer>,
    );
    await waitFor(() =>
      expect(container.querySelectorAll(`${tag} > li`)).toHaveLength(2),
    );
    expect(
      Array.from(container.querySelectorAll('li'), (item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['项目一', '项目二']);
  });
});
