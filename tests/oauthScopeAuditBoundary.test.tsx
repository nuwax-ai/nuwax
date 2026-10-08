import OAuth2ScopeAudit from '@/pages/SystemManagement/OAuth2ScopeAudit';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  OAuth2ScopeApplyStatusEnum,
  type OAuth2ScopeApplyInfo,
} from '@/types/interfaces/oauth2Scope';
import type { ProColumns } from '@ant-design/pro-components';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  approve: vi.fn(),
  reject: vi.fn(),
  reload: vi.fn(),
  success: vi.fn(),
  row: {} as OAuth2ScopeApplyInfo,
  confirmApprove: undefined as (() => Promise<void>) | undefined,
  openReject: undefined as (() => void) | undefined,
  finishReject: undefined as
    | ((values: { reason: string }) => Promise<boolean>)
    | undefined,
}));

vi.mock('umi', () => ({
  useLocation: () => ({ state: null }),
  useModel: () => ({ hasPermission: () => true }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/oauth2Scope', () => ({
  apiOAuth2ScopeApplyPage: vi.fn(),
  apiOAuth2ScopeApprove: h.approve,
  apiOAuth2ScopeReject: h.reject,
}));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ProComponents', () => ({
  TableActions: ({
    record,
    actions,
  }: {
    record: OAuth2ScopeApplyInfo;
    actions: {
      key: string;
      onClick: (record: OAuth2ScopeApplyInfo) => void | Promise<void>;
    }[];
  }) => {
    // 调用页面交给真实确认框的 handler，隔离确认框动画和表格供数。
    h.confirmApprove = () =>
      actions
        .find((action) => action.key === 'approve')!
        .onClick(record) as Promise<void>;
    h.openReject = () => {
      actions.find((action) => action.key === 'reject')!.onClick(record);
    };
    return <span>{record.projectName}</span>;
  },
  XProTable: ({
    columns,
    actionRef,
  }: {
    columns: ProColumns<OAuth2ScopeApplyInfo>[];
    actionRef: React.MutableRefObject<unknown>;
  }) => {
    actionRef.current = { reload: h.reload };
    const operation = columns.find((column) => column.valueType === 'option');
    return (
      <div>
        {
          operation?.render?.(
            null,
            h.row,
            0,
            {} as any,
            {} as any,
          ) as React.ReactNode
        }
      </div>
    );
  },
  XModalForm: ({
    open,
    onFinish,
  }: {
    open: boolean;
    onFinish: (values: { reason: string }) => Promise<boolean>;
  }) => {
    h.finishReject = onFinish;
    return open ? <div data-testid="reject-modal" /> : null;
  },
}));
vi.mock('@ant-design/pro-components', () => ({ ProFormTextArea: () => null }));
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return { ...original, message: { ...original.message, success: h.success } };
});

beforeEach(() => {
  vi.clearAllMocks();
  h.approve.mockReset().mockResolvedValue({ code: '0000', data: null });
  h.reject.mockReset().mockResolvedValue({ code: '0000', data: null });
  h.row = {
    id: 17,
    projectId: 42,
    projectType: AgentComponentTypeEnum.ThirdApp,
    projectName: '待审核应用',
    clientId: 'audit-boundary-client',
    applyUserId: 5,
    oldScopes: ['profile'],
    scopes: ['profile', 'chat:read'],
    status: OAuth2ScopeApplyStatusEnum.Pending,
    created: '2026-10-08T00:00:00Z',
  };
  h.confirmApprove = undefined;
  h.openReject = undefined;
  h.finishReject = undefined;
});
afterEach(cleanup);

describe('scope 审核失败后重试', () => {
  it('通过请求被拒绝时消费异常、不提示成功或刷新，再次确认可成功', async () => {
    let reject!: (reason: unknown) => void;
    h.approve.mockReturnValueOnce(
      new Promise<never>((_, no) => {
        reject = no;
      }),
    );
    render(<OAuth2ScopeAudit />);

    let completion!: Promise<void>;
    act(() => {
      completion = h.confirmApprove!();
    });
    expect(h.approve).toHaveBeenCalledWith(17);
    // 先消费断言 Promise；修前明确失败，不遗留测试自己的未处理拒绝。
    const consumed = expect(completion).resolves.toBeUndefined();
    await act(async () => {
      reject(new Error('审核申请状态已变更'));
      await consumed;
    });
    expect(h.success).not.toHaveBeenCalled();
    expect(h.reload).not.toHaveBeenCalled();
    expect(screen.getByText('待审核应用')).toBeInTheDocument();

    await act(async () => {
      await expect(h.confirmApprove!()).resolves.toBeUndefined();
    });
    expect(h.approve).toHaveBeenCalledTimes(2);
    expect(h.approve).toHaveBeenLastCalledWith(17);
    expect(h.success).toHaveBeenCalledTimes(1);
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it('拒绝请求失败时返回 false 并保留弹窗，同一原因重试成功才关闭刷新', async () => {
    h.reject.mockRejectedValueOnce(new Error('暂时不能审核'));
    render(<OAuth2ScopeAudit />);
    act(() => h.openReject!());
    expect(screen.getByTestId('reject-modal')).toBeInTheDocument();
    const values = { reason: '  范围说明不足  ' };

    await act(async () => {
      await expect(h.finishReject!(values)).resolves.toBe(false);
    });
    expect(h.reject).toHaveBeenCalledWith(17, '范围说明不足');
    expect(screen.getByTestId('reject-modal')).toBeInTheDocument();
    expect(h.success).not.toHaveBeenCalled();
    expect(h.reload).not.toHaveBeenCalled();

    await act(async () => {
      await expect(h.finishReject!(values)).resolves.toBe(true);
    });
    expect(h.reject).toHaveBeenCalledTimes(2);
    expect(h.reject).toHaveBeenLastCalledWith(17, '范围说明不足');
    expect(screen.queryByTestId('reject-modal')).not.toBeInTheDocument();
    expect(h.success).toHaveBeenCalledTimes(1);
    expect(h.reload).toHaveBeenCalledTimes(1);
  });
});
