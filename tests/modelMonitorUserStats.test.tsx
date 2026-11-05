import ModelMonitor from '@/pages/SystemManagement/ModelMonitor';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ summary: vi.fn(), detail: vi.fn() }));
vi.mock('umi', () => ({
  useLocation: () => ({ state: null }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/services/systemManage', () => ({
  apiGetResourceStatSummary: h.summary,
  apiGetResourceStatDetail: h.detail,
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
}));
vi.mock('@/pages/SystemManagement/ModelMonitor/index.less', () => ({
  default: {},
}));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({ title, children }: any) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));
vi.mock('@/components/business-component/StatMetricCard', () => ({
  default: ({ items, loading }: any) =>
    loading ? (
      <p>loading metrics</p>
    ) : (
      <div>
        {items.map((item: any) => (
          <div key={item.label} aria-label={item.label}>
            {item.value}
          </div>
        ))}
      </div>
    ),
}));
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    DatePicker: {
      ...actual.DatePicker,
      RangePicker: ({ onChange }: any) => (
        <button
          type="button"
          onClick={() => onChange([dayjs('2026-11-01'), dayjs('2026-11-02')])}
        >
          change dates
        </button>
      ),
    },
  };
});
// 表格只隔离布局；页面真实控制数据、分页和筛选，防止依赖 ProTable 内部请求状态。
vi.mock('@/components/ProComponents', () => ({
  XProTable: ({ dataSource, pagination, loading, locale }: any) => (
    <section>
      {!loading &&
        dataSource.map((record: any) => (
          <p key={record.id}>{record.targetName}</p>
        ))}
      {!loading && dataSource.length === 0 && <p>{locale.emptyText}</p>}
      <p>page {pagination.current}</p>
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          pagination.onChange(pagination.current + 1, pagination.pageSize)
        }
      >
        next page
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => pagination.onChange(1, 30)}
      >
        page size 30
      </button>
    </section>
  ),
}));

const ok = (data: unknown) => ({ code: '0000', data });
const summary = () =>
  ok({
    consumption: {
      modelCallCount: 2,
      failedModelCallCount: 0,
      totalInputTokens: 10,
      totalCacheInputTokens: 3,
      totalOutputTokens: 7,
      totalAmount: 1,
    },
    sales: {
      modelCallCount: 90,
      totalInputTokens: 900,
      totalCacheInputTokens: 900,
      totalOutputTokens: 900,
      totalAmount: 900,
    },
  });
const detail = (id: string) =>
  ok({
    records: [
      {
        id: 1,
        targetName: id === '-1' ? 'platform-row' : `user-${id}`,
        userName: 'user',
        inputTokens: 10,
        cacheInputTokens: 3,
        outputTokens: 7,
      },
    ],
    total: 45,
  });
const queryButton = () =>
  screen.getByRole('button', { name: 'PC.Common.Global.query' });
const userInput = () =>
  screen.getByRole('textbox', { name: 'PC.Pages.ModelMonitor.userId' });
const queryUser = (id: string) => {
  fireEvent.change(userInput(), { target: { value: id } });
  fireEvent.click(queryButton());
};
async function openUserView() {
  render(<ModelMonitor />);
  await screen.findByText('platform-row');
  fireEvent.click(screen.getByText('PC.Pages.ModelMonitor.userStatsTitle'));
  expect(
    screen.getByText('PC.Pages.ModelMonitor.selectUserHint'),
  ).toBeInTheDocument();
}
beforeEach(() => {
  h.summary.mockReset().mockResolvedValue(summary());
  h.detail
    .mockReset()
    .mockImplementation((params: any) =>
      Promise.resolve(detail(params.userId)),
    );
});
afterEach(cleanup);

describe('下一版本用户 Token 消耗查询', () => {
  it('保留平台口径；用户视图未输入 ID 不查询，消费汇总不混入销售', async () => {
    await openUserView();
    expect(h.detail.mock.calls[0][0]).toMatchObject({
      userId: '-1',
      type: 'SALES',
    });
    expect(h.detail).toHaveBeenCalledTimes(1);
    const id = '9007199254740993';
    queryUser(id);
    await screen.findByText(`user-${id}`);
    expect(h.summary).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: id }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(h.detail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        userId: id,
        type: 'CONSUMPTION',
        targetType: 'Model',
        pageNum: 1,
      }),
      expect.anything(),
    );
    expect(
      screen.getByLabelText('PC.Pages.ModelMonitor.totalTokens'),
    ).toHaveTextContent('20');
    expect(
      screen.getByLabelText('PC.Pages.ModelMonitor.totalInputTokens'),
    ).toHaveTextContent('13');
    expect(
      screen.getByLabelText('PC.Pages.ModelMonitor.modelCallCount'),
    ).toHaveTextContent('2');
  });

  it('翻页使用生效条件，修改草稿不串到下一页，重新查询回第一页', async () => {
    await openUserView();
    queryUser('101');
    await screen.findByText('user-101');
    const applied = h.detail.mock.calls.at(-1)![0];
    fireEvent.change(userInput(), { target: { value: '202' } });
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    fireEvent.click(screen.getByRole('button', { name: 'next page' }));
    await waitFor(() =>
      expect(h.detail.mock.calls.at(-1)![0]).toMatchObject({
        ...applied,
        pageNum: 2,
      }),
    );
    await screen.findByText('user-101');
    fireEvent.click(queryButton());
    await screen.findByText('user-202');
    expect(h.detail.mock.calls.at(-1)![0]).toMatchObject({
      userId: '202',
      dtStart: '20261101',
      dtEnd: '20261102',
      pageNum: 1,
    });
    fireEvent.click(screen.getByRole('button', { name: 'page size 30' }));
    await waitFor(() =>
      expect(h.detail.mock.calls.at(-1)![0]).toMatchObject({
        userId: '202',
        pageNum: 1,
        pageSize: 30,
      }),
    );
  });

  it.each(['', '-1', 'abc', '1.5', '0', '9223372036854775808'])(
    '拒绝无效 ID %s，不发全量或截断后的用户查询',
    async (id) => {
      await openUserView();
      queryUser(id);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'PC.Pages.ModelMonitor.invalidUserId',
      );
      expect(h.detail).toHaveBeenCalledTimes(1);
    },
  );

  it('切用户取消旧请求；即使旧请求忽略取消并迟到，也不覆盖新用户', async () => {
    await openUserView();
    let resolveSummary!: (value: unknown) => void;
    let resolveDetail!: (value: unknown) => void;
    h.summary.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSummary = resolve;
      }),
    );
    h.detail.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
    );
    queryUser('101');
    await waitFor(() => expect(h.detail).toHaveBeenCalledTimes(2));
    const signal = h.detail.mock.calls.at(-1)![1].signal as AbortSignal;
    queryUser('202');
    await screen.findByText('user-202');
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolveSummary(summary());
      resolveDetail(detail('101'));
    });
    expect(screen.queryByText('user-101')).toBeNull();
    expect(screen.getByText('user-202')).toBeInTheDocument();
  });

  it('查询失败清空旧数据并可重试，不把失败展示成零消耗', async () => {
    await openUserView();
    queryUser('101');
    await screen.findByText('user-101');
    h.summary.mockRejectedValueOnce(new Error('offline'));
    queryUser('202');
    await screen.findByText('PC.Pages.ModelMonitor.queryFailed');
    expect(screen.queryByText('user-101')).toBeNull();
    expect(
      screen.queryByLabelText('PC.Pages.ModelMonitor.totalTokens'),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    await screen.findByText('user-202');
    expect(screen.queryByText('PC.Pages.ModelMonitor.queryFailed')).toBeNull();
  });

  it('业务失败同样可重试；成功且无消费才展示零和空明细', async () => {
    await openUserView();
    h.detail.mockResolvedValueOnce({ code: '4000', data: null });
    queryUser('303');
    await screen.findByText('PC.Pages.ModelMonitor.queryFailed');
    h.summary.mockResolvedValueOnce(
      ok({ consumption: null, sales: { totalInputTokens: 900 } }),
    );
    h.detail.mockResolvedValueOnce(ok({ records: [], total: 0 }));
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.noConsumption');
    expect(
      screen.getByLabelText('PC.Pages.ModelMonitor.totalTokens'),
    ).toHaveTextContent(/^0$/);
  });

  it('重置回平台统计并清理用户筛选，卸载取消在途请求', async () => {
    await openUserView();
    queryUser('101');
    await screen.findByText('user-101');
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Common.Global.reset' }),
    );
    await screen.findByText('platform-row');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(h.detail.mock.calls.at(-1)![0]).toMatchObject({
      userId: '-1',
      type: 'SALES',
      pageNum: 1,
    });
    const signal = h.detail.mock.calls.at(-1)![1].signal as AbortSignal;
    cleanup();
    expect(signal.aborted).toBe(true);
  });
});
