import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  syncWebInfo: vi.fn(),
  info: {} as { appVersion?: string; gitHash?: string },
  disposeWeb: vi.fn(),
  disposeDrag: vi.fn(),
  disposePreference: vi.fn(),
  disposeUnread: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    meta: { syncWebInfo: (...args: unknown[]) => mocks.syncWebInfo(...args) },
  },
}));
vi.mock('@/services/imEventBridge', () => ({
  subscribeNativeImUnread: () => mocks.disposeUnread,
}));
vi.mock('@/services/titlebarDragGesture', () => ({
  initTitlebarDragGesture: () => mocks.disposeDrag,
}));
vi.mock('./imNotificationPreference', () => ({
  initImNotificationPreference: () => mocks.disposePreference,
}));
vi.mock('./pageBuildInfo', () => ({ getPageBuildInfo: () => mocks.info }));
vi.mock('./webUpdateService', () => ({
  initWebUpdateCheck: () => mocks.disposeWeb,
}));
vi.mock('./clientUpdateService', () => ({
  download: vi.fn(),
  install: vi.fn(),
  isAvailable: vi.fn(),
}));
vi.mock('./ClientVersionBadge', () => ({ default: () => null }));
vi.mock('./WebVersionBadge', () => ({ default: () => null }));
vi.mock('./DesktopShellPreviewChrome', () => ({ default: () => null }));

import { APP_VERSION } from '@/constants/version';
import { initClientShell } from './index';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.info = {};
});
afterEach(() => vi.restoreAllMocks());

describe('initClientShell page version report', () => {
  it('reports the initially loaded HTML version instead of a later version.json', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mocks.info = { appVersion: '1.1.0', gitHash: 'aaaaaaa' };
    const cleanup = initClientShell();
    expect(mocks.syncWebInfo).toHaveBeenCalledTimes(1);
    expect(mocks.syncWebInfo).toHaveBeenCalledWith({
      appVersion: '1.1.0',
      gitHash: 'aaaaaaa',
    });
    expect(fetchMock).not.toHaveBeenCalled();
    cleanup();
    expect(mocks.disposeWeb).toHaveBeenCalledOnce();
    expect(mocks.disposeDrag).toHaveBeenCalledOnce();
    expect(mocks.disposePreference).toHaveBeenCalledOnce();
    expect(mocks.disposeUnread).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('uses APP_VERSION for older documents and leaves their git hash unknown', () => {
    const cleanup = initClientShell();
    expect(mocks.syncWebInfo).toHaveBeenCalledTimes(1);
    expect(mocks.syncWebInfo).toHaveBeenCalledWith({
      appVersion: APP_VERSION,
    });
    cleanup();
  });
});
