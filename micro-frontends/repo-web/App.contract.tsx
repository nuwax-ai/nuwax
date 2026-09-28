import App from '@repo-app';
import { beginRepoRuntime, endRepoRuntime } from '@repo-host-runtime';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@repo-api', () => ({
  getSiteTitle: () => '',
  getTenantConfig: config.load,
}));
vi.mock('@repo-nav-hold', () => ({ installNavHold: () => () => undefined }));
vi.mock('@repo-SpaceGate', () => ({ default: () => null }));
vi.mock('@repo-SpacePage', () => ({ default: () => null }));
vi.mock('@repo-LibraryPortal', () => ({ default: () => null }));
vi.mock('@repo-FeedbackHost', () => ({ default: () => null }));
vi.mock('@repo-UploadStatusBar', () => ({ default: () => null }));
vi.mock('@repo-ImportBlockOverlay', () => ({ default: () => null }));
vi.mock('@repo-ExportBusyBar', () => ({ default: () => null }));

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
let mounted: Root | null = null;
let container: HTMLDivElement | null = null;
let resolveConfig: (value: { siteName: string; faviconUrl: string }) => void;

function mount(embedded: boolean) {
  config.load.mockReturnValue(
    new Promise((resolve) => {
      resolveConfig = resolve;
    }),
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  beginRepoRuntime(container, {}, embedded);
  mounted = createRoot(container);
  act(() =>
    mounted?.render(
      <MemoryRouter initialEntries={['/enter']}>
        <App />
      </MemoryRouter>,
    ),
  );
}

async function finishRequest() {
  await act(async () => {
    resolveConfig({
      siteName: '资料库站点',
      faviconUrl: 'https://repo.example/icon.png',
    });
    await Promise.resolve();
  });
}

afterEach(() => {
  act(() => mounted?.unmount());
  mounted = null;
  container?.remove();
  endRepoRuntime();
  document.head.querySelector('link[data-head-contract]')?.remove();
});

describe('资料库真实 App 的租户配置 head 边界', () => {
  it('内嵌实例卸载后迟到200不改宿主标题和favicon', async () => {
    document.title = '宿主';
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = 'https://host.example/icon.png';
    icon.setAttribute('data-head-contract', '');
    document.head.appendChild(icon);
    mount(true);
    act(() => mounted?.unmount());
    mounted = null;
    endRepoRuntime();
    await finishRequest();
    expect(document.title).toBe('宿主');
    expect(icon.href).toBe('https://host.example/icon.png');
  });

  it('独立实例卸载后迟到配置不改后续页面标题', async () => {
    document.title = '';
    mount(false);
    act(() => mounted?.unmount());
    mounted = null;
    endRepoRuntime();
    document.title = '后续页面';
    await finishRequest();
    expect(document.title).toBe('后续页面');
  });

  it('独立运行的当前实例继续使用租户站点标题', async () => {
    document.title = '';
    mount(false);
    await finishRequest();
    expect(document.title).toBe('资料库站点');
    document.head
      .querySelector('link[rel="icon"]')
      ?.setAttribute('data-head-contract', '');
  });
});
