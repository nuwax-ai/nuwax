import ConversationPanelActions from '@/components/business-component/ConversationPanelActions';
import ResizableSplit from '@/components/ResizableSplit';
import { getSplitBounds } from '@/components/ResizableSplit/splitBounds';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: (props: any) => (
    <button aria-label={props.ariaLabel} onClick={props.onClick}>
      {props.icon}
    </button>
  ),
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/ResizableSplit/ResizeDivider', () => ({
  default: () => null,
}));

describe('shared conversation panel contracts', () => {
  it('routes the five panel controls independently and keeps progress clicks inside the capsule trigger', () => {
    const handlers = Array.from({ length: 5 }, () => vi.fn());
    render(
      <ConversationPanelActions
        progress={{ onClick: handlers[0] }}
        detail={{ onClick: handlers[1] }}
        files={{ onClick: handlers[2] }}
        terminal={{ onClick: handlers[3] }}
        desktop={{ onClick: handlers[4] }}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0].closest('[data-capsule-panel-trigger]')).not.toBeNull();
    buttons.forEach((button) => fireEvent.click(button));
    handlers.forEach((handler) => expect(handler).toHaveBeenCalledTimes(1));
  });
  it('omits unsupported controls instead of presenting dead buttons', () => {
    render(<ConversationPanelActions terminal={{ onClick: vi.fn() }} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByLabelText(
        'PC.Components.ConversationBottomConsole.tabTerminal',
      ),
    ).toBeTruthy();
  });
  it('keeps a hidden file tree mounted while allocating the full width to the workspace', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { rerender } = render(
      <ResizableSplit
        left={<input aria-label="tree-search" defaultValue="keep" />}
        right={<div>workspace</div>}
      />,
    );
    fireEvent.change(screen.getByLabelText('tree-search'), {
      target: { value: 'preserve' },
    });
    rerender(
      <ResizableSplit
        leftHidden
        left={<input aria-label="tree-search" defaultValue="keep" />}
        right={<div>workspace</div>}
      />,
    );
    const input = screen.getByLabelText('tree-search') as HTMLInputElement;
    expect(input.value).toBe('preserve');
    expect(input.parentElement?.style.display).toBe('none');
    expect(screen.getByText('workspace').parentElement?.style.width).toBe(
      '100%',
    );
    vi.unstubAllGlobals();
  });
  it('stacks both visible panes in a very narrow workspace without remounting them', () => {
    const width = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(400);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private update: () => void) {}
        observe() {
          this.update();
        }
        disconnect() {}
      },
    );
    const { container } = render(
      <ResizableSplit
        stackBelowWidth={580}
        left={<div>chat</div>}
        right={<div>work</div>}
      />,
    );
    expect((container.firstChild as HTMLElement).style.flexDirection).toBe(
      'column',
    );
    expect(screen.getByText('chat').parentElement?.style.width).toBe('100%');
    expect(screen.getByText('work').parentElement?.style.height).toBe('50%');
    width.mockRestore();
    vi.unstubAllGlobals();
  });
  it.each([0, 240, 600, 849])(
    'keeps both minimums within a %s px narrow container',
    (width) => {
      const { minLeft, minRight } = getSplitBounds(width, 430, 420);
      expect(minLeft).toBeGreaterThanOrEqual(0);
      expect(minRight).toBeGreaterThanOrEqual(0);
      expect(minLeft + minRight).toBeCloseTo(width);
      if (width > 0) {
        expect(minLeft).toBeGreaterThan(0);
        expect(minRight).toBeGreaterThan(0);
      }
    },
  );
  it('retains the requested minimums when the viewport fits both panes', () => {
    expect(getSplitBounds(1200, 430, 420)).toEqual({
      minLeft: 430,
      minRight: 420,
    });
  });
});
