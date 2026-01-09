/**
 * useFileOperations Hook 测试
 * 验证 hooks 聚合逻辑
 */

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFileOperations } from '../../hooks/useFileOperations';

// Mock 依赖的 hooks (如果需要深度测试，可以不 mock，这里主要测试聚合逻辑)
// 为了确保独立性，我们这里选择集成测试的方式，即真实调用子 hooks，但 mock API 请求

// Mock services
vi.mock('@/services/vncDesktop', () => ({
  apiGetStaticFileList: vi.fn(),
  apiRestartPod: vi.fn(),
  apiRestartAgent: vi.fn(),
  apiKeepalivePod: vi.fn(),
  apiEnsurePod: vi.fn(),
}));

// Mock eventBus
vi.mock('@/utils/eventBus', () => ({
  default: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe('useFileOperations', () => {
  it('should aggregate fileTreeState and vncDesktopState', () => {
    const { result } = renderHook(() => useFileOperations());

    // 验证结构
    expect(result.current.fileTreeState).toBeDefined();
    expect(result.current.vncDesktopState).toBeDefined();

    // 验证扁平化导出的方法是否存在
    expect(typeof result.current.openDesktopView).toBe('function');
    expect(typeof result.current.openPreviewView).toBe('function');
    expect(typeof result.current.handleRefreshFileList).toBe('function');

    // 验证初始状态
    expect(result.current.fileTreeState.isFileTreeVisible).toBe(false);
    expect(result.current.vncDesktopState.vncContainerInfo).toBeNull();
  });

  it('should share state between hooks where needed', () => {
    const { result } = renderHook(() => useFileOperations());

    // 测试 openPreviewChangeState 是否能正确影响状态
    act(() => {
      result.current.fileTreeState.openPreviewChangeState('desktop');
    });

    expect(result.current.viewModeRef.current).toBe('desktop');
    // Check if file tree visibility is updated (logic in useFileTree)
    expect(result.current.fileTreeState.isFileTreeVisible).toBe(true);
  });
});
