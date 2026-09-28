import PagePreviewIframe from '@/components/business-component/PagePreviewIframe';
import { observePreviewDocument } from '@/components/business-component/PagePreviewIframe/observePreviewDocument';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ title: vi.fn(), report: vi.fn() }));
vi.mock('umi', () => ({
  useModel: () => ({ previewPageTitle: '', setPreviewPageTitle: h.title }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentComponentPageResultUpdate: h.report,
}));
vi.mock('@/utils', () => ({ copyTextToClipboard: vi.fn() }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/business-component/PagePreviewIframe/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

const flush = async (ms = 600) => {
  await act(async () => {
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('预览文档常驻生命周期', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    h.title.mockReset();
    h.report.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.useRealTimers());

  it('普通预览不观察/序列化正文，仍响应标题变更', async () => {
    const data = { uri: 'https://example.com/app' };
    const { container, unmount } = render(
      <PagePreviewIframe pagePreviewData={data} />,
    );
    const iframe = container.querySelector('iframe')!;
    const doc = document.implementation.createHTMLDocument('Initial');
    doc.body.innerHTML = '<main>content</main>';
    Object.defineProperty(iframe, 'contentDocument', { value: doc });
    const htmlRead = vi.spyOn(doc.body, 'innerHTML', 'get');
    fireEvent.load(iframe);
    await flush();
    expect(h.title).toHaveBeenLastCalledWith('Initial');
    h.title.mockClear();
    doc.body.appendChild(doc.createElement('section'));
    await flush();
    expect(h.title).not.toHaveBeenCalled();
    doc.title = 'Updated';
    await flush();
    expect(h.title).toHaveBeenLastCalledWith('Updated');
    expect(htmlRead).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
    unmount();
  });

  it('隐藏缓存页暂停标题观察，恢复不重挂或重载 iframe', async () => {
    const data = { uri: 'https://example.com/app' };
    const { container, rerender, unmount } = render(
      <PagePreviewIframe pagePreviewData={data} />,
    );
    const iframe = container.querySelector('iframe')!;
    const doc = document.implementation.createHTMLDocument('Initial');
    Object.defineProperty(iframe, 'contentDocument', { value: doc });
    fireEvent.load(iframe);
    await flush();
    const srcWrite = vi.spyOn(iframe, 'src', 'set');
    h.title.mockClear();
    rerender(<PagePreviewIframe pagePreviewData={data} active={false} />);
    doc.title = 'Hidden update';
    await flush();
    expect(h.title).not.toHaveBeenCalled();
    rerender(<PagePreviewIframe pagePreviewData={data} active />);
    await flush();
    expect(h.title).toHaveBeenLastCalledWith('Hidden update');
    expect(container.querySelector('iframe')).toBe(iframe);
    expect(srcWrite).not.toHaveBeenCalled();
    unmount();
  });

  it('隐藏仍完整上报 navigate 业务正文，卸载释放待上报计时器', async () => {
    const data = {
      uri: 'https://example.com/app',
      method: 'browser_navigate_page' as const,
      data_type: 'html' as const,
      request_id: 'request-1',
    };
    const { container, unmount } = render(
      <PagePreviewIframe pagePreviewData={data} active={false} />,
    );
    const iframe = container.querySelector('iframe')!;
    const doc = document.implementation.createHTMLDocument('Hidden');
    doc.body.innerHTML = `<main>${'完整正文'.repeat(1000)}</main>`;
    Object.defineProperty(iframe, 'contentDocument', { value: doc });
    fireEvent.load(iframe);
    await flush();
    expect(h.report).toHaveBeenLastCalledWith({
      requestId: 'request-1',
      html: doc.body.innerHTML,
    });
    expect(h.title).not.toHaveBeenCalled();
    h.report.mockClear();
    doc.body.textContent = 'pending';
    await act(async () => {
      await Promise.resolve();
    });
    unmount();
    await flush();
    expect(h.report).not.toHaveBeenCalled();
  });

  it('重复 load 断开旧 Document 观察器，旧文档无法触发后续上报', async () => {
    const data = {
      uri: 'https://example.com/app',
      method: 'browser_navigate_page' as const,
      data_type: 'html' as const,
    };
    const { container, unmount } = render(
      <PagePreviewIframe pagePreviewData={data} />,
    );
    const iframe = container.querySelector('iframe')!;
    let doc = document.implementation.createHTMLDocument('First');
    const first = doc;
    Object.defineProperty(iframe, 'contentDocument', { get: () => doc });
    fireEvent.load(iframe);
    await flush();
    doc = document.implementation.createHTMLDocument('Second');
    doc.body.textContent = 'second';
    fireEvent.load(iframe);
    await flush();
    h.report.mockClear();
    first.body.textContent = 'old navigation';
    await flush();
    expect(h.report).not.toHaveBeenCalled();
    unmount();
  });

  it('observer 释放后取消标题和正文尾沿，重复清理幂等', async () => {
    const doc = document.implementation.createHTMLDocument('Pending');
    const observer = observePreviewDocument(doc, {
      visible: true,
      onTitle: h.title,
      onContent: h.report,
    });
    observer.disconnect();
    observer.disconnect();
    doc.title = 'After dispose';
    doc.body.textContent = 'After dispose';
    await flush();
    expect(h.title).not.toHaveBeenCalled();
    expect(h.report).not.toHaveBeenCalled();
  });
});
