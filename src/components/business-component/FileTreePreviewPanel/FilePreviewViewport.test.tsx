import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import FilePreviewViewport from './FilePreviewViewport';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
    {},
  ] as any);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(2000);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('正文晚于预览容器到达时仍恢复滚动位置，用户滚回顶部也会记忆', async () => {
  const onChange = vi.fn();
  const props = {
    identity: '383:readme.md:preview',
    active: true,
    position: { 'root:0': { top: 640, left: 20 } },
    onPositionChange: onChange,
  };
  const { rerender, getByTestId } = render(
    <FilePreviewViewport {...props}>{null}</FilePreviewViewport>,
  );
  rerender(
    <FilePreviewViewport {...props}>
      <div data-testid="body" />
    </FilePreviewViewport>,
  );
  await waitFor(() => expect(getByTestId('body').scrollTop).toBe(640));
  expect(getByTestId('body').scrollLeft).toBe(20);
  getByTestId('body').scrollTop = 0;
  fireEvent.scroll(getByTestId('body'));
  expect(onChange).toHaveBeenLastCalledWith({ 'root:0': { top: 0, left: 20 } });
});

it('隐藏页面的滚动归零不会擦掉阅读位置', () => {
  const onChange = vi.fn();
  const { rerender, getByTestId } = render(
    <FilePreviewViewport
      identity="383:file:preview"
      active
      onPositionChange={onChange}
    >
      <div data-testid="body" />
    </FilePreviewViewport>,
  );
  getByTestId('body').scrollTop = 480;
  fireEvent.scroll(getByTestId('body'));
  expect(onChange).toHaveBeenCalledOnce();
  rerender(
    <FilePreviewViewport
      identity="383:file:preview"
      active={false}
      onPositionChange={onChange}
    >
      <div data-testid="body" />
    </FilePreviewViewport>,
  );
  getByTestId('body').scrollTop = 0;
  fireEvent.scroll(getByTestId('body'));
  expect(onChange).toHaveBeenCalledOnce();
});

it('刷新替换正文滚动节点后仍停留在原位置', async () => {
  const onChange = vi.fn();
  const props = {
    identity: '383:file:preview',
    active: true,
    onPositionChange: onChange,
  };
  const { rerender, getByTestId } = render(
    <FilePreviewViewport {...props}>
      <div key="old" data-testid="body" />
    </FilePreviewViewport>,
  );
  getByTestId('body').scrollTop = 720;
  fireEvent.scroll(getByTestId('body'));
  rerender(
    <FilePreviewViewport {...props}>
      <div key="new" data-testid="body" />
    </FilePreviewViewport>,
  );
  await waitFor(() => expect(getByTestId('body').scrollTop).toBe(720));
});

it('同源 HTML iframe 的文档滚动可记录并在重新加载后恢复', () => {
  const onChange = vi.fn();
  const { container } = render(
    <FilePreviewViewport
      identity="383:file:preview"
      active
      onPositionChange={onChange}
    >
      <iframe title="HTML Preview" />
    </FilePreviewViewport>,
  );
  const frame = container.querySelector('iframe')!;
  const doc = frame.contentDocument!;
  Object.defineProperty(doc, 'scrollingElement', {
    configurable: true,
    value: doc.documentElement,
  });
  Object.defineProperty(doc.documentElement, 'clientHeight', {
    configurable: true,
    value: 200,
  });
  Object.defineProperty(doc.documentElement, 'scrollHeight', {
    configurable: true,
    value: 2000,
  });
  doc.documentElement.scrollTop = 900;
  fireEvent.scroll(doc);
  expect(onChange).toHaveBeenLastCalledWith({
    'frame0:': { top: 900, left: 0 },
  });
  doc.documentElement.scrollTop = 0;
  fireEvent.load(frame);
  expect(doc.documentElement.scrollTop).toBe(900);
});
