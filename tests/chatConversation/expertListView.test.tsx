/**
 * 独立专家列表组件 ExpertListView 契约：
 * - 四场景接口参数：system(targetType=Agent+ChatBot+category+kw)、
 *   team(spaceId/spaceIds、未传自拉空间聚合、category=Agent+justReturnSpaceData)、
 *   search(固定 spaceId=-1)、used(used/list {type:'Agent'} 全量 + keyword
 *   客户端过滤、条目带 usedTime、targetId=agentId)；
 * - 服务端分页触底追加；
 * - 付费拦截门：免费直通；付费未订阅先详情复核,仍待订阅弹统一专家卡
 *   (内聚 Modal+ExpertSummonCard)不触发 onSelect,卡内召唤放行带 subscribed;
 *   复核已订阅回写后放行;租户未开启订阅直通;
 * - 双变体：grid 两栏卡(右上相对时间) / list 单栏行。
 * services/umi/ExpertSummonCard 全部 mock（vitest 不可用 umi request）。
 */
import type { ExpertListViewProps } from '@/components/business-component/ExpertListView';
import ExpertListView from '@/components/business-component/ExpertListView';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiPublishedAgentList = vi.hoisted(() => vi.fn());
const apiUserUsedAgentList = vi.hoisted(() => vi.fn());
const apiSpaceList = vi.hoisted(() => vi.fn());
const apiPublishedAgentInfo = vi.hoisted(() => vi.fn());
const summonCard = vi.hoisted(() => ({
  props: {} as Record<string, any>,
  open: false,
}));
const tenantConfig = vi.hoisted(() => ({ enableSubscription: 1 }));

vi.mock('@/components/business-component/ExpertListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: tenantConfig }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/agentDev', () => ({
  apiUserUsedAgentList,
  apiPublishedAgentInfo,
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList,
}));

vi.mock('@/services/workspace', () => ({ apiSpaceList }));

vi.mock('@/components/business-component/ExpertSummonCard', async () => {
  const React = await import('react');
  return {
    default: (props: any) => {
      summonCard.props = props;
      summonCard.open = !!props.expert;
      return props.expert ? (
        <div data-testid="summon-card">
          <button
            type="button"
            data-testid="summon-btn"
            onClick={() => props.onSummon(props.expert, true)}
          />
        </div>
      ) : null;
    },
  };
});

const agent = (overloads: Record<string, unknown>) => ({
  description: '专家描述',
  icon: '',
  statistics: { userCount: 12 },
  ...overloads,
});

const pageOf = (records: unknown[], current: number, pages: number) => ({
  code: '0000',
  data: { records, current, pages },
});

beforeEach(() => {
  vi.clearAllMocks();
  tenantConfig.enableSubscription = 1;
  summonCard.props = {};
  summonCard.open = false;
  apiSpaceList.mockResolvedValue({
    data: [
      { id: 1, name: '个人空间', type: 'Personal' },
      { id: 2, name: '团队空间', type: 'Team' },
    ],
  });
  apiUserUsedAgentList.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

const renderView = ({ onSelect, ...rest }: Partial<ExpertListViewProps>) =>
  render(
    <ExpertListView type="system" {...rest} onSelect={onSelect ?? vi.fn()} />,
  );

describe('ExpertListView·场景接口参数契约', () => {
  it('system：专家口径 targetType=Agent + ChatBot + category + kw', async () => {
    apiPublishedAgentList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'system', category: '写作', keyword: '架构' });

    await waitFor(() =>
      expect(apiPublishedAgentList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        category: '写作',
        kw: '架构',
        targetType: 'Agent',
        targetSubType: 'ChatBot',
      }),
    );
  });

  it('team·具体空间：spaceId + category=Agent + justReturnSpaceData', async () => {
    apiPublishedAgentList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'team', spaceId: 3 });

    await waitFor(() =>
      expect(apiPublishedAgentList).toHaveBeenCalledWith(
        expect.objectContaining({
          spaceId: 3,
          category: 'Agent',
          justReturnSpaceData: true,
          targetType: 'Agent',
          targetSubType: 'ChatBot',
        }),
      ),
    );
    expect(apiSpaceList).not.toHaveBeenCalled();
  });

  it('team·未传 spaceIds：自拉空间列表聚合（就绪前不查列表）', async () => {
    apiPublishedAgentList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'team' });

    await waitFor(() => expect(apiSpaceList).toHaveBeenCalled());
    await waitFor(() =>
      expect(apiPublishedAgentList).toHaveBeenCalledWith(
        expect.objectContaining({ spaceIds: [1, 2] }),
      ),
    );
  });

  it('search：固定 spaceId=-1 + 专家口径', async () => {
    apiPublishedAgentList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'search' });

    await waitFor(() =>
      expect(apiPublishedAgentList).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          category: '',
          spaceId: -1,
          targetType: 'Agent',
          targetSubType: 'ChatBot',
        }),
      ),
    );
  });

  it('used：{size,type:Agent} 全量,targetId=agentId + usedTime,keyword 客户端过滤', async () => {
    apiUserUsedAgentList.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 41,
          agentId: 401,
          name: '召唤专家',
          description: '最近召唤',
          icon: '',
          modified: new Date(Date.now() - 5 * 3_600_000).toISOString(),
          agentType: 'ChatBot',
        },
      ],
    });
    renderView({ type: 'used' });

    expect(await screen.findByText('召唤专家')).toBeInTheDocument();
    expect(apiUserUsedAgentList).toHaveBeenCalledWith({
      size: 20,
      type: 'Agent',
    });
    expect(apiPublishedAgentList).not.toHaveBeenCalled();

    cleanup();
    renderView({ type: 'used', keyword: '不存在的关键字' });
    await waitFor(() => {
      expect(screen.queryByText('召唤专家')).toBeNull();
    });
  });
});

describe('ExpertListView·分页', () => {
  it('服务端分页：触底追加下一页', async () => {
    apiPublishedAgentList
      .mockResolvedValueOnce(
        pageOf([agent({ id: 11, targetId: 101, name: '第一页专家' })], 1, 2),
      )
      .mockResolvedValueOnce(
        pageOf([agent({ id: 12, targetId: 102, name: '第二页专家' })], 2, 2),
      );
    const { container } = renderView({ type: 'system' });
    await screen.findByText('第一页专家');

    const scroller = container.firstElementChild as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', { value: 500 });
    Object.defineProperty(scroller, 'clientHeight', { value: 480 });
    fireEvent.scroll(scroller);
    await screen.findByText('第二页专家');
    expect(apiPublishedAgentList).toHaveBeenCalledTimes(2);
  });
});

describe('ExpertListView·付费拦截门（选择前置）', () => {
  it('免费专家：直接触发 onSelect', async () => {
    apiPublishedAgentList.mockResolvedValue(
      pageOf([agent({ id: 11, targetId: 101, name: '免费专家' })], 1, 1),
    );
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });
    fireEvent.click(await screen.findByText('免费专家'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(apiPublishedAgentInfo).not.toHaveBeenCalled();
  });

  it('付费未订阅：详情复核仍待订阅 → 弹统一专家卡,不触发 onSelect', async () => {
    apiPublishedAgentList.mockResolvedValue(
      pageOf(
        [
          agent({
            id: 11,
            targetId: 101,
            name: '付费专家',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    apiPublishedAgentInfo.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: false },
    });
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('付费专家'));
    await waitFor(() =>
      expect(apiPublishedAgentInfo).toHaveBeenCalledWith(101),
    );
    // 内聚的统一专家卡弹窗打开（专家信息 + 召唤回调挂接）
    await waitFor(() => expect(summonCard.open).toBe(true));
    expect(summonCard.props.expert).toMatchObject({
      targetId: 101,
      name: '付费专家',
      userCount: 12,
      paymentRequired: true,
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('统一专家卡内召唤放行：onSelect 带 subscribed=true', async () => {
    apiPublishedAgentList.mockResolvedValue(
      pageOf(
        [
          agent({
            id: 11,
            targetId: 101,
            name: '付费专家',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    apiPublishedAgentInfo.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: false },
    });
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('付费专家'));
    const card = await screen.findByTestId('summon-card');
    fireEvent.click(card.querySelector('[data-testid="summon-btn"]')!);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      targetId: 101,
      subscribed: true,
    });
  });

  it('列表未订阅但复核已订阅：回写后放行并带 subscribed', async () => {
    apiPublishedAgentList.mockResolvedValue(
      pageOf(
        [
          agent({
            id: 11,
            targetId: 101,
            name: '复核通过专家',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    apiPublishedAgentInfo.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: true },
    });
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('复核通过专家'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      targetId: 101,
      subscribed: true,
    });
    expect(summonCard.open).toBe(false);
  });

  it('租户未开启订阅：付费未订阅也直通', async () => {
    tenantConfig.enableSubscription = 0;
    apiPublishedAgentList.mockResolvedValue(
      pageOf(
        [
          agent({
            id: 11,
            targetId: 101,
            name: '付费专家',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('付费专家'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(apiPublishedAgentInfo).not.toHaveBeenCalled();
  });
});

describe('ExpertListView·双变体渲染', () => {
  it('grid 默认：两栏卡（名称/描述 + 右上相对时间）', async () => {
    apiUserUsedAgentList.mockResolvedValue({
      code: '0000',
      data: [
        {
          id: 41,
          agentId: 401,
          name: '召唤专家',
          description: '最近召唤',
          modified: new Date(Date.now() - 5 * 3_600_000).toISOString(),
          agentType: 'ChatBot',
        },
      ],
    });
    renderView({ type: 'used' });
    const card = await waitFor(() => {
      const el = document.querySelector('[data-expert-key="expert:used:41"]');
      expect(el?.className).toContain('card');
      return el!;
    });
    // 相对时间（5 小时前 → hoursAgo 文案）
    expect(card.textContent).toContain('PC.Utils.Common.hoursAgo');
  });

  it('list 变体：单栏行,选择回调一致', async () => {
    apiPublishedAgentList.mockResolvedValue(
      pageOf([agent({ id: 11, targetId: 101, name: '变体专家' })], 1, 1),
    );
    const onSelect = vi.fn();
    renderView({ type: 'system', variant: 'list', onSelect });
    const row = await waitFor(() => {
      const el = document.querySelector('[data-expert-key="expert:system:11"]');
      expect(el?.className).toContain('list-row');
      return el!;
    });
    expect(row.textContent).toContain('变体专家');
    fireEvent.click(row);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });
});
