import AuthMethod from '@/pages/SystemManagement/SystemConfig/AuthMethod';
import SensitiveWord from '@/pages/SystemManagement/SystemConfig/SensitiveWord';
import type { ProColumns } from '@ant-design/pro-components';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  sensitiveStatus: vi.fn(),
  sensitiveDelete: vi.fn(),
  authStatus: vi.fn(),
  authDelete: vi.fn(),
  autoRedirect: vi.fn(),
  reload: vi.fn(),
  success: vi.fn(),
  row: {} as Record<string, any>,
  handlers: {} as Record<string, (checked: boolean) => Promise<void>>,
  confirmDelete: undefined as (() => Promise<void>) | undefined,
}));

vi.mock('umi', () => ({
  useLocation: () => ({ state: null }),
  useModel: () => ({ hasPermission: () => true }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/sensitiveWord', () => ({
  apiSensitiveWordCreate: vi.fn(),
  apiSensitiveWordDelete: h.sensitiveDelete,
  apiSensitiveWordPage: vi.fn(),
  apiSensitiveWordUpdate: vi.fn(),
  apiSensitiveWordUpdateStatus: h.sensitiveStatus,
}));
vi.mock('@/services/authIdp', () => ({
  apiAuthIdpCreate: vi.fn(),
  apiAuthIdpDelete: h.authDelete,
  apiAuthIdpList: vi.fn(),
  apiAuthIdpUpdate: vi.fn(),
  apiAuthIdpUpdateStatus: h.authStatus,
  apiAuthIdpAutoRedirect: h.autoRedirect,
}));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ProComponents', () => ({
  TableActions: ({
    record,
    actions,
  }: {
    record: Record<string, any>;
    actions: {
      key: string;
      onClick: (record: Record<string, any>) => Promise<void>;
    }[];
  }) => (
    <button
      type="button"
      onClick={() => {
        h.confirmDelete = () =>
          actions.find((action) => action.key === 'delete')!.onClick(record);
      }}
    >
      删除
    </button>
  ),
  // 保留页面自己的列 render 和真实 Switch，仅隔离列表供数与整表刷新。
  XProTable: ({
    columns,
    actionRef,
  }: {
    columns: ProColumns<Record<string, any>>[];
    actionRef: React.MutableRefObject<unknown>;
  }) => {
    actionRef.current = { reload: h.reload };
    return (
      <div>
        {columns
          .filter(
            (column) =>
              ['status', 'enabled', 'autoRedirect'].includes(
                String(column.dataIndex),
              ) || column.valueType === 'option',
          )
          .map((column) => {
            const key = String(column.dataIndex);
            const node = column.render?.(null, h.row, 0, {} as any, {} as any);
            if (React.isValidElement(node)) {
              h.handlers[key] = (
                node.props as { onChange: (typeof h.handlers)[string] }
              ).onChange;
            }
            return (
              <div key={key} data-testid={key}>
                {React.isValidElement(node) ? node : null}
              </div>
            );
          })}
      </div>
    );
  },
}));
vi.mock(
  '@/pages/SystemManagement/SystemConfig/SensitiveWord/SensitiveWordFormModal',
  () => ({
    default: () => null,
  }),
);
vi.mock(
  '@/pages/SystemManagement/SystemConfig/AuthMethod/AuthMethodFormModal',
  () => ({
    default: () => null,
  }),
);
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return { ...original, message: { ...original.message, success: h.success } };
});

function deferred() {
  let reject!: (reason: unknown) => void;
  const promise = new Promise<never>((_, no) => {
    reject = no;
  });
  return { promise, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const request of [
    h.sensitiveStatus,
    h.sensitiveDelete,
    h.authStatus,
    h.authDelete,
    h.autoRedirect,
  ]) {
    request.mockReset().mockResolvedValue({ code: '0000', data: null });
  }
  h.handlers = {};
  h.confirmDelete = undefined;
});
afterEach(cleanup);

describe('系统配置操作失败后重试', () => {
  it.each([
    {
      page: SensitiveWord,
      field: 'status',
      initial: 0,
      target: true,
      request: h.sensitiveStatus,
      payload: { id: 1, status: 1 },
    },
    {
      page: SensitiveWord,
      field: 'status',
      initial: 1,
      target: false,
      request: h.sensitiveStatus,
      payload: { id: 1, status: 0 },
    },
    {
      page: AuthMethod,
      field: 'enabled',
      initial: 0,
      target: true,
      request: h.authStatus,
      payload: { id: 1, enabled: 1 },
    },
    {
      page: AuthMethod,
      field: 'enabled',
      initial: 1,
      target: false,
      request: h.authStatus,
      payload: { id: 1, enabled: 0 },
    },
    {
      page: AuthMethod,
      field: 'autoRedirect',
      initial: 0,
      target: true,
      request: h.autoRedirect,
      payload: { id: 1 },
    },
    {
      page: AuthMethod,
      field: 'autoRedirect',
      initial: 1,
      target: false,
      request: h.autoRedirect,
      payload: { id: null },
    },
  ])(
    '$field 从 $initial 切换被拒绝时消费异常，恢复开关并可重试',
    async ({ page: Page, field, initial, target, request, payload }) => {
      h.row = {
        id: 1,
        status: 0,
        enabled: 1,
        autoRedirect: 0,
        [field]: initial,
      };
      const failed = deferred();
      request.mockReturnValueOnce(failed.promise);
      render(<Page />);
      const toggle = () =>
        screen.getByTestId(field).querySelector('[role="switch"]')!;
      expect(toggle()).toHaveAttribute('aria-checked', String(initial === 1));

      let completion!: Promise<void>;
      act(() => {
        completion = h.handlers[field](target);
      });
      expect(toggle()).toBeDisabled();
      expect(request).toHaveBeenCalledWith(payload);
      // 提前消费断言 Promise，修前可得到明确红测而不是全局 unhandledRejection。
      const consumed = expect(completion).resolves.toBeUndefined();
      await act(async () => {
        failed.reject(new Error('业务请求被拒绝'));
        await consumed;
      });
      expect(toggle()).toBeEnabled();
      expect(toggle()).toHaveAttribute('aria-checked', String(initial === 1));
      expect(h.success).not.toHaveBeenCalled();
      expect(h.reload).not.toHaveBeenCalled();

      await act(async () => {
        await expect(h.handlers[field](target)).resolves.toBeUndefined();
      });
      expect(request).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenLastCalledWith(payload);
      expect(toggle()).toBeEnabled();
      expect(h.success).toHaveBeenCalledTimes(1);
      expect(h.reload).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    { page: SensitiveWord, name: '敏感词', request: h.sensitiveDelete },
    { page: AuthMethod, name: '登录方式', request: h.authDelete },
  ])(
    '$name 删除被拒绝时保留记录，再次确认可重试',
    async ({ page: Page, request }) => {
      h.row = { id: 1, status: 0, enabled: 1, autoRedirect: 0 };
      request.mockRejectedValueOnce(new Error('记录无法删除'));
      render(<Page />);
      fireEvent.click(screen.getByRole('button', { name: '删除' }));
      await act(async () => {
        await expect(h.confirmDelete!()).resolves.toBeUndefined();
      });
      expect(request).toHaveBeenCalledWith(1);
      expect(screen.getByRole('button', { name: '删除' })).toBeEnabled();
      expect(h.success).not.toHaveBeenCalled();
      expect(h.reload).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: '删除' }));
      await act(async () => {
        await expect(h.confirmDelete!()).resolves.toBeUndefined();
      });
      expect(request).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenLastCalledWith(1);
      expect(h.success).toHaveBeenCalledTimes(1);
      expect(h.reload).toHaveBeenCalledTimes(1);
    },
  );
});
