import ModelMonitor from '@/pages/SystemManagement/ModelMonitor';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  summary: vi.fn(),
  detail: vi.fn(),
  rank: vi.fn(),
  trend: vi.fn(),
  users: vi.fn(),
}));
vi.mock('@ant-design/plots', () => ({
  Line: ({ data }: any) => (
    <output aria-label="trend chart">{JSON.stringify(data)}</output>
  ),
}));
vi.mock('umi', () => ({
  useLocation: () => ({ state: null }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/services/systemManage', () => ({
  apiGetResourceStatSummary: h.summary,
  apiGetResourceStatDetail: h.detail,
  apiGetUserTokenRank: h.rank,
  apiGetUserTokenTrend: h.trend,
  apiSearchUsageUsers: h.users,
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
const userPage = (records: unknown[], total = records.length) =>
  ok({ records, total });
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
  screen.getByRole('combobox', { name: 'PC.Pages.ModelMonitor.user' });
const selectUser = async (id: string) => {
  fireEvent.mouseDown(userInput());
  fireEvent.change(userInput(), { target: { value: `account-${id}` } });
  await screen.findByTitle(`account-${id}`);
};
const queryUser = async (id: string) => {
  await selectUser(id);
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
const tokenMetrics = {
  inputTokens: '10',
  cacheInputTokens: '3',
  outputTokens: '7',
  totalTokens: '20',
  creditAmount: '1.25',
  callCount: '2',
};
const rankRow = (userId = '9007199254740993') => ({
  rank: 9,
  userId,
  nickName: 'rank-user',
  status: -1,
  ...tokenMetrics,
});

beforeEach(() => {
  h.users.mockReset().mockImplementation(async ({ queryFilter }: any) =>
    userPage(
      ['101', '202', '303', '9007199254740993']
        .map((id) => ({
          id,
          userName: `account-${id}`,
          nickName: '',
        }))
        .filter((user) => user.userName.includes(queryFilter.userName)),
    ),
  );
  h.rank
    .mockReset()
    .mockResolvedValue(
      ok({ records: [rankRow()], total: 80, pageNum: 1, pageSize: 20 }),
    );
  h.trend.mockReset().mockResolvedValue(
    ok([
      { dt: '20261102', ...tokenMetrics, totalTokens: '9007199254740993' },
      { dt: '20261101', ...tokenMetrics },
    ]),
  );
  h.summary.mockReset().mockResolvedValue(summary());
  h.detail
    .mockReset()
    .mockImplementation((params: any) =>
      Promise.resolve(detail(params.userId)),
    );
});

async function openRanking() {
  render(<ModelMonitor />);
  await screen.findByText('platform-row');
  fireEvent.click(
    screen.getByRole('radio', { name: 'PC.Pages.ModelMonitor.rankingTitle' }),
  );
  await screen.findByText('rank-user');
}

describe('用户 Token 排名与每日趋势', () => {
  it('使用服务端排名与总数，翻页保持已提交日期，重新查询和重置回首页', async () => {
    await openRanking();
    expect(h.rank).toHaveBeenLastCalledWith(
      {
        dtStart: dayjs().startOf('month').format('YYYYMMDD'),
        dtEnd: dayjs().format('YYYYMMDD'),
        sortField: 'totalTokens',
        pageNum: 1,
        pageSize: 20,
      },
      expect.objectContaining({
        skipErrorHandler: true,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(
      within(screen.getByText('rank-user').closest('tr')!).getByText('9'),
    ).toBeInTheDocument();
    const applied = h.rank.mock.calls.at(-1)![0];
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    fireEvent.click(screen.getByTitle('2'));
    await waitFor(() =>
      expect(h.rank.mock.calls.at(-1)![0]).toEqual({ ...applied, pageNum: 2 }),
    );
    fireEvent.click(queryButton());
    await waitFor(() =>
      expect(h.rank.mock.calls.at(-1)![0]).toMatchObject({
        dtStart: '20261101',
        dtEnd: '20261102',
        pageNum: 1,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Common.Global.reset' }),
    );
    await waitFor(() => expect(h.rank.mock.calls.at(-1)![0]).toEqual(applied));
  });

  it('禁用用户仍能钻取；完整长 ID 和生效日期用于趋势，按日排序且保留精确数值', async () => {
    await openRanking();
    const applied = h.rank.mock.calls.at(-1)![0];
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.viewTrend' }),
    );
    const chart = await screen.findByLabelText('trend chart');
    expect(h.trend).toHaveBeenLastCalledWith(
      {
        userId: '9007199254740993',
        dtStart: applied.dtStart,
        dtEnd: applied.dtEnd,
      },
      expect.anything(),
    );
    expect(screen.getByTitle('rank-user')).toBeInTheDocument();
    expect(chart.textContent!.indexOf('2026-11-01')).toBeLessThan(
      chart.textContent!.indexOf('2026-11-02'),
    );
    expect(screen.getByText('9,007,199,254,740,993')).toBeInTheDocument();
    expect(screen.getAllByText('1.25')).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('radio', {
        name: 'PC.Pages.ModelMonitor.nonCacheInputTokens',
      }),
    );
    expect(JSON.parse(chart.textContent!)[0].exact).toBe('10');
    // 排名钻取不依赖旧汇总/模型明细接口是否可用。
    expect(h.detail).toHaveBeenCalledTimes(1);
  });

  it('拒绝使用已经舍入的数值 ID 定位用户', async () => {
    h.rank.mockResolvedValueOnce(
      ok({ records: [rankRow(9007199254740992 as any)], total: 1 }),
    );
    await openRanking();
    expect(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.viewTrend' }),
    ).toBeDisabled();
    expect(h.trend).not.toHaveBeenCalled();
  });

  it('排名切换日期或离开视图取消旧请求，迟到结果不能覆盖新排名', async () => {
    await openRanking();
    let resolve!: (data: unknown) => void;
    h.rank.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    fireEvent.click(queryButton());
    const signal = h.rank.mock.calls.at(-1)![1].signal;
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    fireEvent.click(queryButton());
    await screen.findByText('rank-user');
    expect(signal.aborted).toBe(true);
    await act(async () =>
      resolve(
        ok({
          records: [{ ...rankRow('101'), nickName: 'stale-rank' }],
          total: 1,
        }),
      ),
    );
    expect(screen.queryByText('stale-rank')).toBeNull();
    const activeSignal = h.rank.mock.calls.at(-1)![1].signal;
    fireEvent.click(
      screen.getByRole('radio', {
        name: 'PC.Pages.ModelMonitor.platformScope',
      }),
    );
    expect(activeSignal.aborted).toBe(true);
  });

  it('排名失败与合法空结果分开，重试消费网络拒绝', async () => {
    await openRanking();
    h.rank.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(queryButton());
    await screen.findByText('PC.Pages.ModelMonitor.queryFailed');
    expect(screen.queryByText('rank-user')).toBeNull();
    expect(
      screen.queryByText('PC.Pages.ModelMonitor.noConsumption'),
    ).toBeNull();
    h.rank.mockResolvedValueOnce(ok({ records: [], total: 0 }));
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.noConsumption');
  });

  it('选择用户同样可看趋势，换用户与日期丢弃迟到响应，草稿不会发请求', async () => {
    await openUserView();
    await queryUser('101');
    await screen.findByText('user-101');
    let resolve!: (data: unknown) => void;
    h.trend.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    fireEvent.click(
      screen.getByRole('radio', { name: 'PC.Pages.ModelMonitor.trendTitle' }),
    );
    await waitFor(() => expect(h.trend).toHaveBeenCalledTimes(1));
    const signal = h.trend.mock.calls[0][1].signal;
    await selectUser('202');
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    expect(h.trend).toHaveBeenCalledTimes(1);
    fireEvent.click(queryButton());
    await screen.findByLabelText('trend chart');
    expect(signal.aborted).toBe(true);
    expect(h.trend.mock.calls.at(-1)![0]).toEqual({
      userId: '202',
      dtStart: '20261101',
      dtEnd: '20261102',
    });
    await act(async () => resolve(ok([{ dt: '19990101', ...tokenMetrics }])));
    expect(screen.getByLabelText('trend chart')).not.toHaveTextContent('1999');
    const activeSignal = h.trend.mock.calls.at(-1)![1].signal;
    cleanup();
    expect(activeSignal.aborted).toBe(true);
  });

  it('趋势业务失败后可独立重试，空趋势不绘制零折线', async () => {
    await openRanking();
    h.trend.mockResolvedValueOnce({ code: '4000', data: [] });
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.viewTrend' }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.trendFailed');
    expect(screen.queryByLabelText('trend chart')).toBeNull();
    h.trend.mockResolvedValueOnce(ok([]));
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.noConsumption');
    expect(screen.queryByLabelText('trend chart')).toBeNull();
  });
});
afterEach(cleanup);

describe('下一版本用户 Token 消耗查询', () => {
  it('保留平台口径；用户视图未选用户不查询，消费汇总不混入销售', async () => {
    await openUserView();
    expect(h.detail.mock.calls[0][0]).toMatchObject({
      userId: '-1',
      type: 'SALES',
    });
    expect(h.detail).toHaveBeenCalledTimes(1);
    const id = '9007199254740993';
    await queryUser(id);
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
    await queryUser('101');
    await screen.findByText('user-101');
    const applied = h.detail.mock.calls.at(-1)![0];
    fireEvent.click(screen.getByRole('button', { name: 'change dates' }));
    fireEvent.click(screen.getByRole('button', { name: 'next page' }));
    await waitFor(() =>
      expect(h.detail.mock.calls.at(-1)![0]).toMatchObject({
        ...applied,
        pageNum: 2,
      }),
    );
    await screen.findByText('user-101');
    await selectUser('202');
    expect(screen.queryByText('user-101')).toBeNull();
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

  it('未匹配的搜索文字不视为已选用户，不发全量或猜测 ID 的统计查询', async () => {
    await openUserView();
    fireEvent.mouseDown(userInput());
    fireEvent.change(userInput(), { target: { value: 'missing-account' } });
    await waitFor(() =>
      expect(h.users.mock.calls.at(-1)![0]).toEqual({
        pageNo: 1,
        pageSize: 20,
        queryFilter: { userName: 'missing-account' },
      }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.noMatchingUser');
    expect(queryButton()).toBeDisabled();
    expect(h.detail).toHaveBeenCalledTimes(1);
  });

  it('清空选中用户立即清理统计对象和旧数据', async () => {
    await openUserView();
    await queryUser('101');
    await screen.findByText('user-101');
    expect(
      screen.getByText(/PC.Pages.ModelMonitor.activeUserQuery account-101/),
    ).toBeInTheDocument();
    fireEvent.mouseDown(document.querySelector('.ant-select-clear')!);
    expect(screen.queryByText('user-101')).toBeNull();
    expect(
      screen.queryByText(/PC.Pages.ModelMonitor.activeUserQuery/),
    ).toBeNull();
    expect(queryButton()).toBeDisabled();
    expect(h.detail).toHaveBeenCalledTimes(2);
  });

  it('唯一命中自动选中；多个命中必须从下拉选择，搜索新用户先清理原选择', async () => {
    await openUserView();
    await selectUser('101');
    expect(queryButton()).toBeEnabled();
    expect(h.detail).toHaveBeenCalledTimes(1);
    h.users.mockResolvedValueOnce(
      userPage([
        { id: '101', userName: 'account-101', nickName: '' },
        { id: '202', userName: 'account-202', nickName: '' },
      ]),
    );
    fireEvent.mouseDown(userInput());
    fireEvent.change(userInput(), { target: { value: 'shared-name' } });
    expect(queryButton()).toBeDisabled();
    await screen.findByText('account-101', {
      selector: '.ant-select-item-option-content > div',
    });
    const second = await screen.findByText('account-202', {
      selector: '.ant-select-item-option-content > div',
    });
    expect(queryButton()).toBeDisabled();
    fireEvent.click(second);
    expect(
      screen.getByText('account-202', {
        selector: '.ant-select-selection-item',
      }),
    ).toBeInTheDocument();
    fireEvent.click(queryButton());
    await screen.findByText('user-202');
    expect(h.summary.mock.calls.at(-1)![0].userId).toBe('202');
  });

  it('按服务端总数判断唯一命中，分页失败可重试并保留之前的候选用户', async () => {
    await openUserView();
    h.users.mockResolvedValueOnce(
      userPage([{ id: '101', userName: 'account-101', nickName: '' }], 21),
    );
    fireEvent.mouseDown(userInput());
    fireEvent.change(userInput(), { target: { value: 'account' } });
    await screen.findByText('account-101', {
      selector: '.ant-select-item-option-content > div',
    });
    expect(queryButton()).toBeDisabled();
    h.users.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.ModelMonitor.loadMoreUsers',
      }),
    );
    await screen.findByText('PC.Pages.ModelMonitor.userSearchFailed');
    expect(
      screen.getByText('account-101', {
        selector: '.ant-select-item-option-content > div',
      }),
    ).toBeVisible();
    h.users.mockResolvedValueOnce(
      userPage([{ id: '202', userName: 'account-202', nickName: '' }], 21),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    const second = await screen.findByText('account-202', {
      selector: '.ant-select-item-option-content > div',
    });
    expect(h.users.mock.calls.at(-1)![0]).toEqual({
      pageNo: 2,
      pageSize: 20,
      queryFilter: { userName: 'account' },
    });
    fireEvent.click(second);
    fireEvent.click(queryButton());
    await screen.findByText('user-202');
  });

  it('用户名和手机号搜索可切换；取消迟到结果，失败可重试并使用匹配用户的完整 ID', async () => {
    await openUserView();
    expect(h.users).not.toHaveBeenCalled();
    let resolve!: (value: unknown) => void;
    h.users.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }),
    );
    fireEvent.mouseDown(userInput());
    fireEvent.change(userInput(), { target: { value: 'account-101' } });
    await waitFor(() => expect(h.users).toHaveBeenCalledTimes(1));
    expect(h.users.mock.calls[0][0]).toMatchObject({
      queryFilter: { userName: 'account-101' },
    });
    const signal = h.users.mock.calls[0][1].signal;
    h.users.mockRejectedValueOnce(new Error('offline'));
    fireEvent.change(userInput(), { target: { value: '13800138000' } });
    await screen.findByText('PC.Pages.ModelMonitor.userSearchFailed');
    expect(h.users.mock.calls.at(-1)![0]).toMatchObject({
      queryFilter: { userName: '13800138000' },
    });
    expect(signal.aborted).toBe(true);
    await act(async () =>
      resolve(userPage([{ id: '101', userName: 'stale-user' }])),
    );
    expect(screen.queryByText('stale-user')).toBeNull();
    h.users.mockResolvedValueOnce(
      userPage([
        {
          id: '9007199254740993',
          userName: 'phone-user',
          nickName: '',
        },
      ]),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.ModelMonitor.retry' }),
    );
    await screen.findByTitle('phone-user');
    fireEvent.click(queryButton());
    await screen.findByText('user-9007199254740993');
    expect(h.summary.mock.calls.at(-1)![0].userId).toBe('9007199254740993');
  });

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
    await queryUser('101');
    await waitFor(() => expect(h.detail).toHaveBeenCalledTimes(2));
    const signal = h.detail.mock.calls.at(-1)![1].signal as AbortSignal;
    await queryUser('202');
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
    await queryUser('101');
    await screen.findByText('user-101');
    h.summary.mockRejectedValueOnce(new Error('offline'));
    await queryUser('202');
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
    await queryUser('303');
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
    await queryUser('101');
    await screen.findByText('user-101');
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Common.Global.reset' }),
    );
    await screen.findByText('platform-row');
    expect(screen.queryByRole('combobox')).toBeNull();
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
