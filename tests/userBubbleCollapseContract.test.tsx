import UserBubbleCollapse, {
  USER_BUBBLE_COLLAPSE_LINES,
  USER_BUBBLE_COLLAPSED_LINES,
} from '@/features/conversation/presentation-v2/react/UserBubbleCollapse';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => <span data-svg-icon={name} />,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const originalScrollHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollHeight',
);

const setBodyHeight = (height: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('ds-markdown-answer') ? height : 0;
    },
  });
};

const renderBubble = () =>
  render(
    <UserBubbleCollapse>
      <div className="ds-markdown">
        <div className="ds-markdown-answer">用户输入</div>
      </div>
    </UserBubbleCollapse>,
  );

afterEach(() => {
  if (originalScrollHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollHeight',
      originalScrollHeight,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  }
});

describe('用户气泡折叠产品阈值', () => {
  it('正文恰好 10 行时完整显示，第 11 行出现折叠入口且只露出 3 行', () => {
    expect(USER_BUBBLE_COLLAPSE_LINES).toBe(10);
    expect(USER_BUBBLE_COLLAPSED_LINES).toBe(3);

    setBodyHeight(10 * 24);
    const first = renderBubble();
    expect(screen.queryByTestId('v2-user-bubble-toggle')).toBeNull();
    first.unmount();

    setBodyHeight(11 * 24);
    renderBubble();
    const bubble = screen.getByTestId('v2-user-bubble-content');
    const body = bubble.querySelector<HTMLElement>('.ds-markdown-answer');
    const toggle = screen.getByTestId('v2-user-bubble-toggle');
    expect(bubble).toHaveAttribute('data-collapsed', 'true');
    expect(body?.style.maxHeight).toBe('72px');
    expect(body?.style.overflow).toBe('hidden');
    expect(
      toggle.querySelector('[data-svg-icon="icons-common-caret_down"]'),
    ).not.toBeNull();

    fireEvent.click(toggle);
    expect(bubble).not.toHaveAttribute('data-collapsed');
    expect(body?.style.maxHeight).toBe('');
  });
});
