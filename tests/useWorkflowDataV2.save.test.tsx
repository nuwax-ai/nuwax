import { useWorkflowDataV2 } from '@/pages/Antv-X6/v2/hooks/useWorkflowDataV2';
import workflowServiceV2 from '@/pages/Antv-X6/v2/services/workflowV2';
import type { SaveWorkflowResponseV2 } from '@/pages/Antv-X6/v2/types';
import { NodeTypeEnumV2 } from '@/pages/Antv-X6/v2/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

// mock antd message to avoid DOM noise
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// mock umi request (workflowServiceV2内部依赖)
vi.mock('umi', () => ({
  request: vi.fn(),
}));

// mock workflowServiceV2 to avoid real network in hook init
vi.mock('@/pages/Antv-X6/v2/services/workflowV2', () => {
  const saveWorkflowFull = vi.fn();
  const getWorkflowDetails = vi.fn().mockResolvedValue({
    code: '0000',
    data: {
      nodes: [],
      name: '',
      description: '',
      spaceId: 0,
      startNode: null,
      endNode: null,
      extension: null,
      category: null,
      version: '',
    },
  });
  const isSuccess = vi.fn((r: any) => r?.code === '0000');
  return {
    default: {
      getWorkflowDetails,
      saveWorkflowFull,
      validateWorkflow: vi.fn(),
      publishWorkflow: vi.fn(),
      executeNode: vi.fn(),
      getVersionHistory: vi.fn(),
      restoreWorkflowVersion: vi.fn(),
      TEST_RUN_ENDPOINT: '',
      NODE_TEST_RUN_ENDPOINT: '',
      isSuccess,
      extractData: vi.fn(),
      SUCCESS_CODE: '0000',
    },
    saveWorkflowFullV2: saveWorkflowFull,
    getWorkflowDetailsV2: getWorkflowDetails,
    validateWorkflowV2: vi.fn(),
    publishWorkflowV2: vi.fn(),
    executeNodeV2: vi.fn(),
    TEST_RUN_ENDPOINT: '',
    NODE_TEST_RUN_ENDPOINT: '',
    isSuccessV2: isSuccess,
    extractDataV2: vi.fn(),
    SUCCESS_CODE: '0000',
  };
});

describe('useWorkflowDataV2 saveNow', () => {
  const successResponse: SaveWorkflowResponseV2 = {
    success: true,
    message: 'ok',
    version: 'v1',
  };

  test('skip save when isDirty is false', async () => {
    const saveSpy = vi
      .spyOn(workflowServiceV2, 'saveWorkflowFull')
      .mockResolvedValue({
        code: '0000',
        data: successResponse,
      });

    const { result } = renderHook(() =>
      useWorkflowDataV2({
        // 传 0 跳过初始化 refreshData 副作用，避免覆盖测试数据
        workflowId: 0,
      }),
    );

    await act(async () => {
      const ok = await result.current.saveNow();
      expect(ok).toBe(true);
    });

    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  test('success clears isDirty and sets version', async () => {
    const saveSpy = vi
      .spyOn(workflowServiceV2, 'saveWorkflowFull')
      .mockResolvedValue({
        code: '0000',
        data: successResponse,
      });

    const { result } = renderHook(() =>
      useWorkflowDataV2({
        workflowId: 0,
      }),
    );

    // mark dirty
    act(() => {
      result.current.addNode({
        id: 2,
        name: 'Start',
        type: 'Start' as any,
        icon: '',
        nodeConfig: {},
      } as any);
    });

    await act(async () => {
      const ok = await result.current.saveNow();
      expect(ok).toBe(true);
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.workflowData.lastSavedVersion).toBe('v1');
    saveSpy.mockRestore();
  });

  test('failure retries up to maxRetries then returns false', async () => {
    const saveSpy = vi
      .spyOn(workflowServiceV2, 'saveWorkflowFull')
      .mockRejectedValueOnce(new Error('netfail'))
      .mockRejectedValueOnce(new Error('netfail'))
      .mockRejectedValue(new Error('netfail'));
    vi.useFakeTimers();

    const onSaveError = vi.fn();
    const { result } = renderHook(() =>
      useWorkflowDataV2({
        workflowId: 0,
        onSaveError,
      }),
    );

    act(() => {
      result.current.addNode({
        id: 2,
        name: 'Start',
        type: 'Start' as any,
        icon: '',
        nodeConfig: {},
      } as any);
    });

    await act(async () => {
      const ok = await result.current.saveNow();
      expect(ok).toBe(false);
      await vi.runAllTimersAsync();
    });

    // 首次调用 + 重试 maxRetries(3) 次 = 4 次
    expect(saveSpy).toHaveBeenCalledTimes(4);
    expect(onSaveError).toHaveBeenCalled();
    expect(result.current.isDirty).toBe(true);
    saveSpy.mockRestore();
    vi.useRealTimers();
  });
});

describe('useWorkflowDataV2 exception edge sync', () => {
  test('exception edge updates exceptionHandleNodeIds instead of nextNodeIds', () => {
    const { result } = renderHook(() =>
      useWorkflowDataV2({
        workflowId: 0,
      }),
    );

    act(() => {
      result.current.addNode({
        id: 1,
        name: 'LLM',
        type: NodeTypeEnumV2.LLM,
        workflowId: 0,
        icon: '',
        nodeConfig: {},
      } as any);
      result.current.addNode({
        id: 2,
        name: 'Code',
        type: NodeTypeEnumV2.Code,
        workflowId: 0,
        icon: '',
        nodeConfig: {},
      } as any);
    });

    act(() => {
      result.current.addEdge({
        source: '1',
        target: '2',
        sourcePort: '1-exception',
        targetPort: '2-in',
      });
    });

    const sourceNode = result.current.getNodeById(1)!;

    expect(
      sourceNode.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds,
    ).toContain(2);
    expect(sourceNode.nextNodeIds?.includes(2)).toBeFalsy();
    expect(
      result.current.workflowData.edgeList.find(
        (e) => e.sourcePort === '1-exception' && e.target === '2',
      ),
    ).toBeTruthy();

    act(() => {
      result.current.deleteEdge('1', '2', '1-exception', '2-in');
    });

    const updatedSource = result.current.getNodeById(1)!;
    expect(
      updatedSource.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds,
    ).not.toContain(2);
    expect(
      result.current.workflowData.edgeList.find(
        (e) =>
          e.source === '1' &&
          e.target === '2' &&
          e.sourcePort === '1-exception',
      ),
    ).toBeFalsy();
  });
});
