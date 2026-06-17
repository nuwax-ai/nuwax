import {
  extractDataV2,
  getWorkflowDetailsV2,
  isSuccessV2,
  publishWorkflowV2,
  saveWorkflowFullV2,
  validateWorkflowV2,
} from '@/pages/Antv-X6/v2/services/workflowV2';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const requestMock = vi.fn();

vi.mock('umi', () => ({
  request: (...args: any[]) => requestMock(...args),
}));

describe('workflowV2 service', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  test('getWorkflowDetailsV2 调用 GET 接口', async () => {
    requestMock.mockResolvedValue({ code: '0000', data: { id: 1 } });
    const res = await getWorkflowDetailsV2(1);
    expect(requestMock).toHaveBeenCalledWith('/api/workflow/1', {
      method: 'GET',
    });
    expect(res.data).toEqual({ id: 1 });
  });

  test('saveWorkflowFullV2 调用 POST 接口并返回数据', async () => {
    requestMock.mockResolvedValue({ code: '0000', data: { version: 'v1' } });
    const payload = { workflowId: 1, nodes: [] } as any;
    const res = await saveWorkflowFullV2(payload);
    expect(requestMock).toHaveBeenCalledWith('/api/workflow/v2/save', {
      method: 'POST',
      data: payload,
    });
    expect(res.data.version).toBe('v1');
  });

  test('validate/publish 路径与方法正确', async () => {
    requestMock.mockResolvedValue({ code: '0000', data: [] });
    await validateWorkflowV2(2);
    expect(requestMock).toHaveBeenCalledWith('/api/workflow/valid/2', {
      method: 'GET',
    });

    const publishData = { workflowId: 3, name: 'wf' };
    await publishWorkflowV2(publishData);
    expect(requestMock).toHaveBeenCalledWith('/api/workflow/publish', {
      method: 'POST',
      data: publishData,
    });
  });

  test('isSuccessV2 和 extractDataV2 基于 code 判断', () => {
    const ok = { code: '0000', data: { a: 1 } };
    const fail = { code: '1001', data: { a: 0 } };
    expect(isSuccessV2(ok as any)).toBe(true);
    expect(isSuccessV2(fail as any)).toBe(false);
    expect(extractDataV2(ok as any)).toEqual({ a: 1 });
    expect(extractDataV2(fail as any)).toBeNull();
  });
});
