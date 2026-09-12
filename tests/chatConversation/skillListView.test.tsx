/**
 * 独立技能列表组件 SkillListView 契约：
 * - 四场景接口参数：system(category+kw)、team(spaceId/spaceIds、未传自拉
 *   空间聚合、category=Skill+justReturnSpaceData)、search(固定 spaceId=-1)、
 *   enabled(空 body 全量 + keyword 客户端过滤、条目一律 enabled)；
 * - 服务端分页触底追加；启用/取消启用闭环(targetId 寻址、就地回写+重拉)；
 * - 付费拦截门：免费直通；付费未订阅先详情复核,仍待订阅弹套餐弹窗不触发
 *   onSelect,复核已订阅回写后放行并带 subscribed;租户未开启订阅直通；
 * - 双变体：grid 两栏卡 / list 单栏行,渲染与功能一致。
 * services/umi/useSubscription/子弹窗全部 mock（vitest 不可用 umi request）。
 */
import type { SkillListViewProps } from '@/components/business-component/SkillListView';
import SkillListView from '@/components/business-component/SkillListView';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiPublishedSkillList = vi.hoisted(() => vi.fn());
const apiPublishedSkillEnableList = vi.hoisted(() => vi.fn());
const apiPublishedSkillEnable = vi.hoisted(() => vi.fn());
const apiPublishedSkillUnEnable = vi.hoisted(() => vi.fn());
const apiSpaceList = vi.hoisted(() => vi.fn());
const apiPublishedSkillDetail = vi.hoisted(() => vi.fn());
const querySkillSubscriptionPlans = vi.hoisted(() => vi.fn());
const createSubscriptionOrder = vi.hoisted(() => vi.fn());
const paymentModal = vi.hoisted(() => ({ props: {} as Record<string, any> }));
const tenantConfig = vi.hoisted(() => ({ enableSubscription: 1 }));

vi.mock('@/components/business-component/SkillListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: tenantConfig }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/square', () => ({
  apiPublishedSkillList,
  apiPublishedSkillEnableList,
  apiPublishedSkillEnable,
  apiPublishedSkillUnEnable,
}));

vi.mock('@/services/workspace', () => ({ apiSpaceList }));

vi.mock('@/services/skill', () => ({
  apiPublishedSkillDetail,
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    targetSubscriptionPlans: [],
    loadingTargetPricing: false,
    mySubscriptionInfo: undefined,
    loadingMySubscription: false,
    createSubscriptionOrder,
    querySkillSubscriptionPlans,
  }),
}));

vi.mock(
  '@/components/business-component/PaymentSubscriptionModal',
  async () => {
    const React = await import('react');
    return {
      default: (props: any) => {
        paymentModal.props = props;
        return props.open
          ? React.createElement('div', { 'data-testid': 'payment-modal' })
          : null;
      },
    };
  },
);
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));

const skill = (overloads: Record<string, unknown>) => ({
  description: '技能描述',
  icon: '',
  ...overloads,
});

/** 服务端分页响应（每页 pageSize 条,current/pages 判定 hasMore） */
const pageOf = (records: unknown[], current: number, pages: number) => ({
  code: '0000',
  data: { records, current, pages },
});

beforeEach(() => {
  vi.clearAllMocks();
  tenantConfig.enableSubscription = 1;
  paymentModal.props = {};
  apiSpaceList.mockResolvedValue({
    data: [
      { id: 1, name: '个人空间', type: 'Personal' },
      { id: 2, name: '团队空间', type: 'Team' },
    ],
  });
  apiPublishedSkillEnableList.mockResolvedValue({ code: '0000', data: [] });
  apiPublishedSkillEnable.mockResolvedValue({ code: '0000', data: null });
  apiPublishedSkillUnEnable.mockResolvedValue({ code: '0000', data: null });
});

afterEach(cleanup);

const renderView = ({ onSelect, ...rest }: Partial<SkillListViewProps>) =>
  render(
    <SkillListView type="system" {...rest} onSelect={onSelect ?? vi.fn()} />,
  );

/** 定位条目内启用开关 */
const switchOf = (key: string) =>
  document
    .querySelector(`[data-skill-key="${key}"]`)
    ?.querySelector<HTMLButtonElement>('[role="switch"]') ?? null;

describe('SkillListView·场景接口参数契约', () => {
  it('system：category 内容分类 + kw 透传（防抖后）', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'system', category: '翻译', keyword: '翻译技能' });

    await waitFor(() => expect(apiPublishedSkillList).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(apiPublishedSkillList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        category: '翻译',
        kw: '翻译技能',
      }),
    );
  });

  it('team·具体空间：spaceId + category=Skill + justReturnSpaceData', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'team', spaceId: 3 });

    await waitFor(() =>
      expect(apiPublishedSkillList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        kw: undefined,
        category: 'Skill',
        justReturnSpaceData: true,
        spaceId: 3,
      }),
    );
  });

  it('team·外部传入 spaceIds：按传入聚合,不自拉空间', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'team', spaceIds: [4, 5] });

    await waitFor(() =>
      expect(apiPublishedSkillList).toHaveBeenCalledWith(
        expect.objectContaining({ spaceIds: [4, 5] }),
      ),
    );
    expect(apiSpaceList).not.toHaveBeenCalled();
  });

  it('team·未传 spaceIds：自拉空间列表聚合（就绪前不查列表）', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'team' });

    await waitFor(() => expect(apiSpaceList).toHaveBeenCalled());
    await waitFor(() =>
      expect(apiPublishedSkillList).toHaveBeenCalledWith(
        expect.objectContaining({ spaceIds: [1, 2] }),
      ),
    );
  });

  it('search：固定 spaceId=-1,kw 可选', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf([], 1, 1));
    renderView({ type: 'search' });

    await waitFor(() =>
      expect(apiPublishedSkillList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        category: '',
        kw: undefined,
        spaceId: -1,
      }),
    );
  });

  it('enabled：空 body 全量,条目一律 enabled,keyword 客户端过滤', async () => {
    apiPublishedSkillEnableList.mockResolvedValue({
      code: '0000',
      data: [
        skill({ id: 21, targetId: 201, name: '翻译技能', enabled: false }),
        skill({ id: 22, targetId: 202, name: '写作技能' }),
      ],
    });
    const onSelect = vi.fn();
    renderView({ type: 'enabled', onSelect });

    await screen.findByText('翻译技能');
    // 不查分页接口；enable/list 空参
    expect(apiPublishedSkillList).not.toHaveBeenCalled();
    expect(apiPublishedSkillEnableList).toHaveBeenCalledWith();
    // 拉到的即已启用（不看条目级 enabled 字段）
    expect(switchOf('skill:enabled:21')?.getAttribute('aria-checked')).toBe(
      'true',
    );
    // 客户端关键字过滤（先卸载首棵树,避免 screen 查到旧容器）
    cleanup();
    renderView({ type: 'enabled', keyword: '写作' });
    await waitFor(() =>
      expect(apiPublishedSkillEnableList).toHaveBeenCalledTimes(2),
    );
    await waitFor(() => {
      expect(screen.queryByText('翻译技能')).toBeNull();
      expect(screen.getByText('写作技能')).toBeInTheDocument();
    });
  });
});

describe('SkillListView·分页与开关闭环', () => {
  it('服务端分页：触底追加下一页', async () => {
    apiPublishedSkillList
      .mockResolvedValueOnce(
        pageOf([skill({ id: 21, targetId: 201, name: '第一页技能' })], 1, 2),
      )
      .mockResolvedValueOnce(
        pageOf([skill({ id: 22, targetId: 202, name: '第二页技能' })], 2, 2),
      );
    const { container } = renderView({ type: 'system' });
    await screen.findByText('第一页技能');

    // 滚动容器触底 → 追加第二页
    const scroller = container.firstElementChild as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', { value: 500 });
    Object.defineProperty(scroller, 'clientHeight', { value: 480 });
    fireEvent.scroll(scroller);
    await screen.findByText('第二页技能');
    expect(apiPublishedSkillList).toHaveBeenCalledTimes(2);
  });

  it('启用开关：enable(targetId) 成功后就地回写 + 重拉 + onEnabledChange', async () => {
    apiPublishedSkillList.mockResolvedValue(
      pageOf([skill({ id: 21, targetId: 201, name: '待启用技能' })], 1, 1),
    );
    const onEnabledChange = vi.fn();
    renderView({
      type: 'system',
      onEnabledChange,
    });

    await screen.findByText('待启用技能');
    fireEvent.click(switchOf('skill:system:21')!);
    await waitFor(() =>
      expect(apiPublishedSkillEnable).toHaveBeenCalledWith(201),
    );
    await waitFor(() =>
      expect(switchOf('skill:system:21')?.getAttribute('aria-checked')).toBe(
        'true',
      ),
    );
    expect(onEnabledChange).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 201, enabled: true }),
      true,
    );
  });
});

describe('SkillListView·付费拦截门（选择前置）', () => {
  it('免费技能：直接触发 onSelect', async () => {
    apiPublishedSkillList.mockResolvedValue(
      pageOf([skill({ id: 21, targetId: 201, name: '免费技能' })], 1, 1),
    );
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });
    fireEvent.click(await screen.findByText('免费技能'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(apiPublishedSkillDetail).not.toHaveBeenCalled();
  });

  it('付费未订阅：详情复核仍待订阅 → 弹套餐弹窗,不触发 onSelect', async () => {
    apiPublishedSkillList.mockResolvedValue(
      pageOf(
        [
          skill({
            id: 21,
            targetId: 201,
            name: '付费技能',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    apiPublishedSkillDetail.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: false },
    });
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('付费技能'));
    await waitFor(() =>
      expect(apiPublishedSkillDetail).toHaveBeenCalledWith(201),
    );
    await waitFor(() =>
      expect(querySkillSubscriptionPlans).toHaveBeenCalledWith(201),
    );
    expect(paymentModal.props.open).toBe(true);
    expect(paymentModal.props.targetType).toBe('Skill');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('列表未订阅但复核已订阅：回写后放行并带 subscribed', async () => {
    apiPublishedSkillList.mockResolvedValue(
      pageOf(
        [
          skill({
            id: 21,
            targetId: 201,
            name: '复核通过技能',
            paymentRequired: true,
            subscribed: false,
          }),
        ],
        1,
        1,
      ),
    );
    apiPublishedSkillDetail.mockResolvedValue({
      code: '0000',
      data: { paymentRequired: true, subscribed: true },
    });
    const onSelect = vi.fn();
    renderView({ type: 'system', onSelect });

    fireEvent.click(await screen.findByText('复核通过技能'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      targetId: 201,
      subscribed: true,
    });
    expect(paymentModal.props.open).toBeFalsy();
  });

  it('租户未开启订阅：付费未订阅也直通', async () => {
    tenantConfig.enableSubscription = 0;
    apiPublishedSkillList.mockResolvedValue(
      pageOf(
        [
          skill({
            id: 21,
            targetId: 201,
            name: '付费技能',
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

    fireEvent.click(await screen.findByText('付费技能'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(apiPublishedSkillDetail).not.toHaveBeenCalled();
  });
});

describe('SkillListView·双变体渲染', () => {
  const fixture = () => [
    skill({ id: 21, targetId: 201, name: '变体技能', enabled: true }),
  ];

  it('grid 默认：两栏卡（圆形图标+名称/单行描述+开关）', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf(fixture(), 1, 1));
    renderView({ type: 'system' });
    const card = await waitFor(() => {
      const el = document.querySelector('[data-skill-key="skill:system:21"]');
      expect(el?.className).toContain('card');
      return el!;
    });
    expect(card.querySelector('[role="switch"]')).toBeTruthy();
    expect(card.textContent).toContain('变体技能');
  });

  it('list 变体：单栏行（名称与描述同行+开关），选择回调一致', async () => {
    apiPublishedSkillList.mockResolvedValue(pageOf(fixture(), 1, 1));
    const onSelect = vi.fn();
    renderView({ type: 'system', variant: 'list', onSelect });
    const row = await waitFor(() => {
      const el = document.querySelector('[data-skill-key="skill:system:21"]');
      expect(el?.className).toContain('list-row');
      return el!;
    });
    expect(row.querySelector('[role="switch"]')).toBeTruthy();
    expect(row.textContent).toContain('变体技能');
    fireEvent.click(row);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });
});
