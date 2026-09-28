import ResizableSplit from '@/components/ResizableSplit';
import { render } from '@testing-library/react';
import React, { useEffect } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const MountedProbe: React.FC<{ onUnmount: () => void }> = ({ onUnmount }) => {
  useEffect(() => onUnmount, [onUnmount]);
  return <div data-testid="kept-right">right</div>;
};

describe('ResizableSplit rightHidden', () => {
  it('隐藏右侧布局时保留子树挂载并让左侧占满', () => {
    const onUnmount = vi.fn();
    const view = render(
      <ResizableSplit
        left={<div data-testid="left">left</div>}
        right={<MountedProbe onUnmount={onUnmount} />}
      />,
    );

    view.rerender(
      <ResizableSplit
        left={<div data-testid="left">left</div>}
        right={<MountedProbe onUnmount={onUnmount} />}
        rightHidden
      />,
    );

    expect(view.getByTestId('kept-right')).toBeInTheDocument();
    expect(view.getByTestId('kept-right').parentElement).toHaveStyle({
      display: 'none',
    });
    expect(view.getByTestId('left').parentElement).toHaveStyle({
      width: '100%',
    });
    expect(onUnmount).not.toHaveBeenCalled();
  });

  it('同宽度下增大右栏最小宽度时重新约束位置并保持右侧子树', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1200);
    const onUnmount = vi.fn();
    const view = render(
      <ResizableSplit
        defaultLeftWidth={60}
        minLeftWidth={430}
        minRightWidth={440}
        left={<div data-testid="left">left</div>}
        right={<MountedProbe onUnmount={onUnmount} />}
      />,
    );

    expect(view.getByTestId('left').parentElement).toHaveStyle({
      width: '60%',
    });

    view.rerender(
      <ResizableSplit
        defaultLeftWidth={60}
        minLeftWidth={430}
        minRightWidth={720}
        left={<div data-testid="left">left</div>}
        right={<MountedProbe onUnmount={onUnmount} />}
      />,
    );

    expect(view.getByTestId('left').parentElement).toHaveStyle({
      width: '40%',
    });
    expect(view.getByTestId('kept-right').parentElement).toHaveStyle({
      width: '60%',
    });
    expect(onUnmount).not.toHaveBeenCalled();
  });
});
