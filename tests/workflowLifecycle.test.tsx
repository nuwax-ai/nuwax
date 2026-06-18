/**
 * Workflow V3 生命周期测试
 *
 * 测试场景：
 * - 工作流初始化加载
 * - 加载失败处理与重试
 * - 工作流重置逻辑
 * - 组件卸载时的清理
 * - 刷新画布数据
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 依赖
const mockGetDetails = vi.fn();
const mockSetSpaceId = vi.fn();
const mockWorkflowProxyInitialize = vi.fn();
const mockWorkflowProxySetWorkflowInfo = vi.fn();
const mockWorkflowSaveServiceInitialize = vi.fn();
const mockWorkflowSaveServiceSetEditVersion = vi.fn();
const mockGetEdges = vi.fn();
const mockHandleInitLoading = vi.fn();

vi.mock('@/services/workflow', () => ({
  default: {
    getDetails: mockGetDetails,
  },
}));

vi.mock('umi', () => ({
  useModel: () => ({
    setSpaceId: mockSetSpaceId,
  }),
}));

vi.mock('@/pages/Antv-X6/v3/services/workflowProxyV3', () => ({
  workflowProxy: {
    initialize: mockWorkflowProxyInitialize,
    setWorkflowInfo: mockWorkflowProxySetWorkflowInfo,
  },
}));

vi.mock('@/pages/Antv-X6/v3/services/WorkflowSaveService', () => ({
  workflowSaveService: {
    initialize: mockWorkflowSaveServiceInitialize,
    setEditVersion: mockWorkflowSaveServiceSetEditVersion,
  },
}));

vi.mock('@/pages/Antv-X6/v3/utils/graphV3', () => ({
  getEdges: mockGetEdges,
}));

vi.mock('@/constants/codes.constants', () => ({
  default: { success: '0000' },
}));

vi.mock('@/utils/logger', () => ({
  workflowLogger: { log: vi.fn() },
}));

describe('Workflow V3 生命周期', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEdges.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkflowData = {
    id: 12345,
    name: 'Test Workflow',
    description: 'Test Description',
    spaceId: 1,
    nodes: [
      { id: 1, type: 'Start', name: '开始', nextNodeIds: [2] },
      { id: 2, type: 'LLM', name: '大模型', nextNodeIds: [3] },
      { id: 3, type: 'End', name: '结束', nextNodeIds: [] },
    ],
    modified: '2025-12-17T00:00:00Z',
    editVersion: 5,
    systemVariables: [],
  };

  // ============ 场景1：初始化加载 ============
  describe('初始化加载', () => {
    it('成功加载工作流数据并初始化代理', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });
      mockGetEdges.mockReturnValue([
        { source: '1', target: '2' },
        { source: '2', target: '3' },
      ]);

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.info).not.toBeNull();
      });

      // 验证加载状态
      expect(mockHandleInitLoading).toHaveBeenCalledWith(true);
      expect(mockHandleInitLoading).toHaveBeenCalledWith(false);

      // 验证数据初始化
      expect(result.current.info?.name).toBe('Test Workflow');
      expect(result.current.graphParams.nodeList).toHaveLength(3);
      expect(result.current.graphParams.edgeList).toHaveLength(2);

      // 验证代理初始化
      expect(mockWorkflowProxyInitialize).toHaveBeenCalledWith({
        workflowId: 12345,
        nodes: mockWorkflowData.nodes,
        edges: expect.any(Array),
        systemVariables: [],
        modified: '2025-12-17T00:00:00Z',
      });
      expect(mockWorkflowProxySetWorkflowInfo).toHaveBeenCalledWith(
        mockWorkflowData,
      );
      expect(mockWorkflowSaveServiceInitialize).toHaveBeenCalledWith(
        mockWorkflowData,
      );
      expect(mockSetSpaceId).toHaveBeenCalledWith(1);
    });

    it('加载失败时处理错误', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetDetails.mockRejectedValue(new Error('Network error'));

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(mockHandleInitLoading).toHaveBeenCalledWith(false);
      });

      expect(result.current.info).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch graph data:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('workflowId 为空时不发起请求', async () => {
      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 0,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(mockGetDetails).not.toHaveBeenCalled();
      });
    });

    it('防止 StrictMode 双重调用', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { rerender } = renderHook(
        ({ workflowId }) =>
          useWorkflowLifecycle({
            workflowId,
            handleInitLoading: mockHandleInitLoading,
          }),
        { initialProps: { workflowId: 12345 } },
      );

      await waitFor(() => {
        expect(mockGetDetails).toHaveBeenCalledTimes(1);
      });

      // 模拟 StrictMode 重新渲染
      rerender({ workflowId: 12345 });

      // 不应再次调用
      expect(mockGetDetails).toHaveBeenCalledTimes(1);
    });
  });

  // ============ 场景2：刷新画布数据 ============
  describe('刷新画布数据', () => {
    it('刷新成功后更新代理层数据', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.info).not.toBeNull();
      });

      // 清除初始化调用记录
      mockWorkflowProxyInitialize.mockClear();
      mockWorkflowSaveServiceInitialize.mockClear();
      mockWorkflowSaveServiceSetEditVersion.mockClear();

      // 模拟数据更新
      const updatedData = {
        ...mockWorkflowData,
        nodes: [
          ...mockWorkflowData.nodes,
          { id: 4, type: 'Code', name: '代码节点', nextNodeIds: [] },
        ],
        editVersion: 6,
      };
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: updatedData,
      });

      await act(async () => {
        await result.current.refreshGraphData();
      });

      // 验证代理重新初始化
      expect(mockWorkflowProxyInitialize).toHaveBeenCalled();
      expect(mockWorkflowSaveServiceInitialize).toHaveBeenCalled();
      expect(mockWorkflowSaveServiceSetEditVersion).toHaveBeenCalledWith(6);
    });

    it('刷新失败时处理错误', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.info).not.toBeNull();
      });

      // 模拟刷新失败
      mockGetDetails.mockRejectedValue(new Error('Refresh failed'));

      await act(async () => {
        await result.current.refreshGraphData();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh graph data:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ============ 场景3：修改工作流基础信息 ============
  describe('修改工作流基础信息', () => {
    it('更新名称和描述', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.info).not.toBeNull();
      });

      const mockCallback = vi.fn();

      act(() => {
        result.current.onConfirm(
          {
            name: 'Updated Name',
            description: 'Updated Description',
            icon: 'new-icon.png',
            extension: { size: 100 },
          },
          mockCallback,
        );
      });

      expect(result.current.info?.name).toBe('Updated Name');
      expect(result.current.info?.description).toBe('Updated Description');
      expect(result.current.info?.icon).toBe('new-icon.png');
      expect(mockCallback).toHaveBeenCalled();
    });

    it('部分更新时保留其他字段', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: mockWorkflowData,
      });

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.info).not.toBeNull();
      });

      act(() => {
        result.current.onConfirm({
          name: 'Only Name Updated',
          extension: { size: 100 },
        });
      });

      expect(result.current.info?.name).toBe('Only Name Updated');
      expect(result.current.info?.description).toBe('Test Description'); // 保留原值
    });
  });

  // ============ 场景4：数据提取与边计算 ============
  describe('数据提取与边计算', () => {
    it('从节点列表正确提取边数据', async () => {
      const nodesWithEdges = [
        { id: 1, type: 'Start', name: '开始', nextNodeIds: [2, 3] },
        { id: 2, type: 'LLM', name: 'LLM1', nextNodeIds: [4] },
        { id: 3, type: 'LLM', name: 'LLM2', nextNodeIds: [4] },
        { id: 4, type: 'End', name: '结束', nextNodeIds: [] },
      ];

      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: { ...mockWorkflowData, nodes: nodesWithEdges },
      });
      mockGetEdges.mockReturnValue([
        { source: '1', target: '2' },
        { source: '1', target: '3' },
        { source: '2', target: '4' },
        { source: '3', target: '4' },
      ]);

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.graphParams.edgeList).toHaveLength(4);
      });

      expect(result.current.graphParams.nodeList).toHaveLength(4);
    });

    it('节点列表为空时返回空边列表', async () => {
      mockGetDetails.mockResolvedValue({
        code: '0000',
        data: { ...mockWorkflowData, nodes: [] },
      });
      mockGetEdges.mockReturnValue([]);

      const { useWorkflowLifecycle } = await import(
        '@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle'
      );

      const { result } = renderHook(() =>
        useWorkflowLifecycle({
          workflowId: 12345,
          handleInitLoading: mockHandleInitLoading,
        }),
      );

      await waitFor(() => {
        expect(result.current.graphParams.nodeList).toHaveLength(0);
        expect(result.current.graphParams.edgeList).toHaveLength(0);
      });
    });
  });
});
