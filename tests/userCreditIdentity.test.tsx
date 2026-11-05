import CreditRecords from '@/pages/SystemManagement/SubscriptionCredits/CreditRecords';
import UserCredits from '@/pages/SystemManagement/SubscriptionCredits/UserCredits';
import DeductCreditModal from '@/pages/SystemManagement/SubscriptionCredits/UserCredits/DeductCreditModal';
import GrantCreditModal from '@/pages/SystemManagement/SubscriptionCredits/UserCredits/GrantCreditModal';
import '@/utils/setupDayjsPlugins';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  request: vi.fn(),
  push: vi.fn(),
  table: null as any,
  search: '',
  tenantId: '9223372036854775807' as string | number,
}));
vi.mock('umi', () => ({
  request: m.request,
  history: { push: m.push },
  useLocation: () => ({ search: m.search, pathname: '/credits' }),
  useModel: () => ({ tenantConfigInfo: { tenantId: m.tenantId } }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ children }: any) => children,
}));
vi.mock('@/components/ProComponents', () => ({
  XProTable: (props: any) => {
    m.table = props;
    return null;
  },
  TableActions: ({ actions, record }: any) =>
    actions.map((a: any) => (
      <button type="button" key={a.key} onClick={() => a.onClick(record)}>
        {a.key}
      </button>
    )),
}));
vi.mock('@/components/CustomFormModal', () => ({
  default: ({ open, onConfirm, children, loading }: any) =>
    open ? (
      <div>
        {children}
        <button type="button" disabled={loading} onClick={onConfirm}>
          submit
        </button>
      </div>
    ) : null,
}));
vi.mock('@/utils/form', () => ({
  customizeRequiredMark: (label: any) => label,
}));
vi.mock('@/utils/dateUtils', () => ({
  formatDateTimeYmdHms: (value: string) => value,
}));

const id = '9007199254740993';
const cursor = '9223372036854775806';
const row = {
  userId: id,
  totalCredit: 0,
  user: { username: 'tester', phone: '', email: '' },
};
beforeEach(() => {
  m.table = null;
  m.search = '';
  m.tenantId = '9223372036854775807';
  m.push.mockReset();
  m.request.mockReset().mockImplementation(async (url: string) => ({
    code: '0000',
    data: url.endsWith('/summary/list')
      ? { records: [row], total: 1 }
      : url.endsWith('/flow/list')
      ? []
      : null,
  }));
  vi.spyOn(message, 'error').mockReturnValue(undefined as any);
  vi.spyOn(message, 'success').mockReturnValue(undefined as any);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('积分查询精确定位用户', () => {
  it('长 ID 原样查询、跳转流水，零积分记录保留', async () => {
    render(<UserCredits />);
    const result = await m.table.request({
      userId: ' ' + id + ' ',
      current: 2,
      pageSize: 30,
    });
    expect(m.request).toHaveBeenCalledWith(
      '/api/system/credit/summary/list',
      expect.objectContaining({
        params: {
          userId: id,
          usernamePhoneOrEmail: undefined,
          pageNum: 2,
          pageSize: 30,
        },
      }),
    );
    expect(result).toMatchObject({ success: true, data: [row], total: 1 });
    const columns = m.table.columns;
    expect(
      columns.find((c: any) => c.dataIndex === 'totalCredit').render(null, row),
    ).toBe(0);
    render(columns.find((c: any) => c.key === 'actions').render(null, row));
    fireEvent.click(screen.getByText('viewCreditRecords'));
    expect(m.push).toHaveBeenCalledWith(
      '/system/subscription-credits/credit-records?userId=' + id,
    );
  });

  it.each(['1e3', '-1', '1.5', '9223372036854775808', Number(id)])(
    '非法或已舍入 ID %s 不变成全部用户查询',
    async (value) => {
      render(<UserCredits />);
      expect(await m.table.request({ userId: value })).toMatchObject({
        success: false,
      });
      expect(m.request).not.toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledWith(
        'PC.Pages.SystemUserCredits.invalidUserId',
      );
    },
  );

  it('空筛选仍可查询，安全整数账号兼容，已舍入的行不能跳转', async () => {
    render(<UserCredits />);
    await m.table.request({ userId: '  ' });
    expect(m.request.mock.calls[0][1].params.userId).toBeUndefined();
    await m.table.request({ userId: 123 });
    expect(m.request.mock.calls[1][1].params.userId).toBe('123');
    render(
      m.table.columns
        .find((c: any) => c.key === 'actions')
        .render(null, { ...row, userId: Number(id) }),
    );
    fireEvent.click(screen.getByText('viewCreditRecords'));
    expect(m.push).not.toHaveBeenCalled();
  });

  it('流水 URL、查询和下一页游标均保留 int64；前后余额 0 不显示成缺失', async () => {
    m.search = '?userId=' + id;
    m.request.mockResolvedValue({
      code: '0000',
      data: [{ id: cursor, userId: id, beforeAmount: 0, afterAmount: 0 }],
    });
    render(<CreditRecords />);
    expect(m.table.form.initialValues.userId).toBe(id);
    await act(async () => {
      await m.table.request({ userId: id, current: 1, pageSize: 15 });
    });
    await act(async () => {
      await m.table.request({ userId: id, current: 2, pageSize: 15 });
    });
    expect(m.request.mock.calls[1][1].params).toMatchObject({
      userId: id,
      lastId: cursor,
      pageSize: 15,
    });
    for (const key of ['beforeAmount', 'afterAmount'])
      expect(
        m.table.columns
          .find((c: any) => c.dataIndex === key)
          .render(null, { beforeAmount: 0, afterAmount: 0 }),
      ).toBe(0);
    await act(async () => {
      await m.table.request({ userId: '123', current: 1 });
    });
    expect(m.request.mock.calls[2][1].params.lastId).toBeUndefined();
  });

  it('错误流水 URL 保留错误筛选并拒绝请求，不降级为查询全部', async () => {
    m.search = '?userId=bad-id';
    render(<CreditRecords />);
    expect(m.table.form.initialValues.userId).toBe('bad-id');
    await act(async () => {
      expect(
        await m.table.request({ userId: m.table.form.initialValues.userId }),
      ).toMatchObject({ success: false });
    });
    expect(m.request).not.toHaveBeenCalled();
  });
});

describe.each([
  ['发放', GrantCreditModal, '/api/system/credit/add'],
  ['扣减', DeductCreditModal, '/api/system/credit/deduct'],
] as const)('%s积分保持操作身份', (_label, Modal, endpoint) => {
  it('用户与租户长 ID 不转 Number 后提交', async () => {
    const onClose = vi.fn(),
      onSuccess = vi.fn();
    render(
      <Modal open userRecord={row} onClose={onClose} onSuccess={onSuccess} />,
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(m.request).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          data: expect.objectContaining({
            userId: id,
            tenantId: m.tenantId,
            amount: 10,
          }),
        }),
      ),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each(['user', 'tenant'] as const)(
    '已舍入的 %s ID 拒绝写入',
    async (identity) => {
      if (identity === 'tenant') m.tenantId = Number(id);
      render(
        <Modal
          open
          userRecord={
            identity === 'user' ? { ...row, userId: Number(id) } : row
          }
          onClose={vi.fn()}
        />,
      );
      fireEvent.change(screen.getByRole('spinbutton'), {
        target: { value: '10' },
      });
      fireEvent.click(screen.getByText('submit'));
      await waitFor(() =>
        expect(message.error).toHaveBeenCalledWith(
          'PC.Pages.SystemUserCredits.invalidOperationIdentity',
        ),
      );
      expect(m.request).not.toHaveBeenCalled();
    },
  );

  it('请求拒绝或业务失败不报告成功、不关闭，修正后可以手动再提交', async () => {
    const onClose = vi.fn(),
      onSuccess = vi.fn();
    m.request
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ code: '5000' })
      .mockResolvedValueOnce({ code: '0000' });
    render(
      <Modal open userRecord={row} onClose={onClose} onSuccess={onSuccess} />,
    );
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '10' },
    });
    const button = screen.getByText('submit');
    fireEvent.click(button);
    await waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(m.request).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
    expect(message.success).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(
      m.request.mock.calls.every(([, opts]) => opts.data.userId === id),
    ).toBe(true);
  });
});
