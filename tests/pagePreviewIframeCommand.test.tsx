/**
 * PagePreviewIframe 应用标签命令通道单测（commandKey）：
 * - 匹配 routePath 的 reload 命令 → 重挂 iframe（key 变化节点替换）；
 * - 匹配 routePath 的 copyLink 命令 → 复制当前 pageUrl（与详情页链接 icon 同源）；
 * - routePath 不匹配 → 无副作用；不传 commandKey → 不订阅，emit 无变化。
 */
import PagePreviewIframe from '@/components/business-component/PagePreviewIframe';
import eventBus, {
  EVENT_NAMES,
  type AppTabPreviewCommandPayload,
} from '@/utils/eventBus';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ copy: vi.fn() }));

vi.mock('umi', () => ({
  useModel: (ns: string) =>
    ns === 'chat' ? { previewPageTitle: '', setPreviewPageTitle: vi.fn() } : {},
}));

// t 供组件用；dict 供 @/constants/common.constants 模块顶层调用（SANDBOX 链）
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentComponentPageResultUpdate: vi.fn(),
}));

vi.mock('@/utils', () => ({ copyTextToClipboard: h.copy }));

vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));

vi.mock('@/components/business-component/PagePreviewIframe/index.less', () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

const emit = (payload: AppTabPreviewCommandPayload) =>
  act(() => {
    eventBus.emit(EVENT_NAMES.APP_TAB_PREVIEW_COMMAND, payload);
  });

describe('PagePreviewIframe commandKey 命令通道', () => {
  beforeEach(() => {
    h.copy.mockReset();
    eventBus.clear();
  });

  it('匹配 routePath 的 reload：iframe 销毁重建（key 重挂）', () => {
    const { container } = render(
      <PagePreviewIframe
        pagePreviewData={{ uri: 'https://example.com/app', params: {} }}
        commandKey="/user-app/5"
      />,
    );
    const before = container.querySelector('iframe');
    expect(before).toBeTruthy();
    emit({ routePath: '/user-app/5', action: 'reload' });
    // iframeKey 变化 → React 卸载旧 iframe 挂载新节点（引用替换）
    const after = container.querySelector('iframe');
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
    expect(h.copy).not.toHaveBeenCalled();
  });

  it('匹配 routePath 的 copyLink：复制当前 pageUrl', () => {
    render(
      <PagePreviewIframe
        pagePreviewData={{ uri: 'https://example.com/app', params: {} }}
        commandKey="/user-app/5"
      />,
    );
    emit({ routePath: '/user-app/5', action: 'copyLink' });
    expect(h.copy).toHaveBeenCalledTimes(1);
    expect(h.copy.mock.calls[0][0]).toBe('https://example.com/app');
  });

  it('routePath 不匹配：无副作用', () => {
    const { container } = render(
      <PagePreviewIframe
        pagePreviewData={{ uri: 'https://example.com/app', params: {} }}
        commandKey="/user-app/5"
      />,
    );
    const before = container.querySelector('iframe');
    emit({ routePath: '/agent/999', action: 'reload' });
    emit({ routePath: '/agent/999', action: 'copyLink' });
    expect(container.querySelector('iframe')).toBe(before);
    expect(h.copy).not.toHaveBeenCalled();
  });

  it('不传 commandKey：不订阅，emit 无变化无报错', () => {
    const { container } = render(
      <PagePreviewIframe
        pagePreviewData={{ uri: 'https://example.com/app', params: {} }}
      />,
    );
    const before = container.querySelector('iframe');
    emit({ routePath: '/user-app/5', action: 'reload' });
    emit({ routePath: '/user-app/5', action: 'copyLink' });
    expect(container.querySelector('iframe')).toBe(before);
    expect(h.copy).not.toHaveBeenCalled();
  });

  it('卸载后注销订阅：emit 不再触达已卸载实例', () => {
    const { unmount } = render(
      <PagePreviewIframe
        pagePreviewData={{ uri: 'https://example.com/app', params: {} }}
        commandKey="/user-app/5"
      />,
    );
    unmount();
    emit({ routePath: '/user-app/5', action: 'copyLink' });
    expect(h.copy).not.toHaveBeenCalled();
  });
});
