/**
 * 能力弹窗·连接器「已连接」页签契约（工具栏已连接连接器头像组入口）：
 * - 头像组入口（defaultResourceType=connector + defaultConnectedView=true，
 *   经 openCapabilityWithType 重挂弹窗）：默认进入「已连接」聚合页签，
 *   列表走 providers?connected=true 全量口径（与 /expert-skill-connector 同口径）；
 * - 头像组入口但无已连接项：页签隐藏，初始聚合态由回落 effect 自动退回系统广场；
 * - 其他入口（不传 defaultConnectedView）：即使有已连接项也落默认系统广场页签；
 * - 点击「系统广场」页签退出聚合视图，切回 scope=official 列表。
 * 渲染整组件：services/umi/useSubscription/子弹窗全部 mock（vitest 不可用 umi request）；
 * i18n dict mock 为 key 回显。
 */
import CapabilityModal from '@/components/ChatInputHome/CapabilityModal';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiConnectorProviderPageList = vi.hoisted(() => vi.fn());
const apiConnectorConnectionCreate = vi.hoisted(() => vi.fn());

vi.mock('@/components/ChatInputHome/CapabilityModal/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/business-component/ExpertSummonModal/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock(
  '@/components/business-component/ConnectorDeviceAuthModal/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);
vi.mock('@/components/business-component/ConnectorListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 1 } }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/workspace', () => ({
  apiSpaceList: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/services/agentDev', () => ({
  apiUserUsedAgentList: vi.fn(),
  apiPublishedAgentInfo: vi.fn(),
  apiCollectAgent: vi.fn(),
  apiUnCollectAgent: vi.fn(),
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList: vi.fn(),
  apiPublishedSkillList: vi.fn(),
  apiPublishedCategoryList: vi.fn().mockResolvedValue({ data: [] }),
  apiPublishedSkillEnable: vi.fn(),
  apiPublishedSkillUnEnable: vi.fn(),
  apiPublishedSkillEnableList: vi
    .fn()
    .mockResolvedValue({ code: '0000', data: [] }),
  apiPublishedSkillCollect: vi.fn(),
  apiPublishedSkillUnCollect: vi.fn(),
}));

vi.mock('@/services/skill', () => ({
  apiPublishedSkillDetail: vi.fn(),
}));

vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList: vi.fn(),
  apiConnectorConnectionCreate,
  apiConnectorConnectionDelete: vi.fn(),
  apiConnectorConnectionList: vi.fn(),
  apiConnectorOauthAuthorize: vi.fn(),
  apiSystemConnectorProviderDetail: vi.fn(),
  apiConnectorConnectionToggleStatus: vi.fn(),
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    agentSubscriptionPlans: [],
    loadingAgentSubscriptionPlans: false,
    targetSubscriptionPlans: [],
    loadingTargetPricing: false,
    mySubscriptionInfo: undefined,
    loadingMySubscription: false,
    createSubscriptionOrder: vi.fn(),
    queryAgentSubscriptionPlans: vi.fn(),
    querySkillSubscriptionPlans: vi.fn(),
  }),
}));

vi.mock('@/components/business-component/ConnectorConnectModal', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));

/** 已连接连接器（connected 全量口径返回条目） */
const connectedRecord = {
  id: 31,
  service: 'github',
  displayName: 'GitHub 连接器',
  description: '代码仓库集成',
  connected: true,
  connectionEnabled: true,
  authType: 'oauth2',
};

/** 系统广场连接器（scope=official 分页口径返回条目） */
const systemRecord = {
  id: 32,
  service: 'feishu',
  displayName: '飞书连接器',
  description: '消息与文档集成',
  connected: false,
  authType: 'api_key',
};

beforeEach(() => {
  vi.clearAllMocks();
  // providers 按口径分流：connected=true 全量；system 走 scope=official 分页
  apiConnectorProviderPageList.mockImplementation((params: unknown) => {
    const query = params as { connected?: string };
    if (query?.connected === 'true') {
      return Promise.resolve({
        code: '0000',
        data: { records: [connectedRecord] },
      });
    }
    return Promise.resolve({
      code: '0000',
      data: { records: [systemRecord], pageNum: 1 },
    });
  });
});

afterEach(cleanup);

const renderConnectorModal = (defaultConnectedView?: boolean) =>
  render(
    <CapabilityModal
      open
      onClose={vi.fn()}
      onSelect={vi.fn()}
      defaultResourceType="connector"
      defaultConnectedView={defaultConnectedView}
    />,
  );

describe('能力弹窗·连接器「已连接」页签（工具栏已连接头像组入口）', () => {
  it('头像组入口（defaultConnectedView）：默认进入「已连接」聚合页签并渲染已连接列表', async () => {
    renderConnectorModal(true);

    // 「已连接」页签出现且默认选中（列表首渲染在聚合态）
    const tab = await screen.findByRole('tab', {
      name: 'PC.Components.CapabilityModal.mainTabConnected',
    });
    expect(tab.getAttribute('aria-selected')).toBe('true');
    // 列表渲染已连接条目（ConnectorListView connected 场景）
    expect(await screen.findByText('GitHub 连接器')).toBeTruthy();
    // 聚合口径：providers 以 connected=true 全量拉取（页签判定 + 列表双链路）
    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith(
        expect.objectContaining({ connected: 'true' }),
      ),
    );
    // 聚合视图不触发系统广场列表
    expect(apiConnectorProviderPageList).not.toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'official' }),
    );
  });

  it('头像组入口但无已连接项：页签隐藏，回落系统广场列表', async () => {
    apiConnectorProviderPageList.mockImplementation((params: unknown) => {
      const query = params as { connected?: string };
      if (query?.connected === 'true') {
        return Promise.resolve({ code: '0000', data: { records: [] } });
      }
      return Promise.resolve({
        code: '0000',
        data: { records: [systemRecord], pageNum: 1 },
      });
    });
    renderConnectorModal(true);

    // 回落系统广场：列表渲染官方目录条目，系统广场页签选中
    expect(await screen.findByText('飞书连接器')).toBeTruthy();
    const systemTab = await screen.findByRole('tab', {
      name: 'PC.Components.CapabilityModal.mainTabSystem',
    });
    expect(systemTab.getAttribute('aria-selected')).toBe('true');
    // 「已连接」页签不展示（确无连接）
    expect(
      screen.queryByText('PC.Components.CapabilityModal.mainTabConnected'),
    ).toBeNull();
  });

  it('点击「系统广场」页签退出聚合视图，切回 scope=official 列表', async () => {
    renderConnectorModal(true);
    await screen.findByText('GitHub 连接器');

    fireEvent.click(
      screen.getByRole('tab', {
        name: 'PC.Components.CapabilityModal.mainTabSystem',
      }),
    );

    expect(await screen.findByText('飞书连接器')).toBeTruthy();
    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'official' }),
      ),
    );
    const connectedTab = screen.getByRole('tab', {
      name: 'PC.Components.CapabilityModal.mainTabConnected',
    });
    expect(connectedTab.getAttribute('aria-selected')).toBe('false');
  });

  it('其他入口（不传 defaultConnectedView）：即使有已连接项也落默认系统广场页签', async () => {
    renderConnectorModal();

    // 默认数据源页签选中，列表走 scope=official 官方目录
    const systemTab = await screen.findByRole('tab', {
      name: 'PC.Components.CapabilityModal.mainTabSystem',
    });
    expect(systemTab.getAttribute('aria-selected')).toBe('true');
    expect(await screen.findByText('飞书连接器')).toBeTruthy();
    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'official' }),
      ),
    );
    // 「已连接」页签照常可见（有数据），但未选中
    const connectedTab = screen.getByRole('tab', {
      name: 'PC.Components.CapabilityModal.mainTabConnected',
    });
    expect(connectedTab.getAttribute('aria-selected')).toBe('false');
  });

  it('键盘：↓ 聚焦首卡（高亮）后 Enter 触发卡内连接开关开启（no_auth 免鉴权直接建连）', async () => {
    // 系统广场返回免鉴权未连接条目：Enter=开启，无凭证直接建连可断言
    const noAuthRecord = {
      id: 33,
      service: 'web-search',
      displayName: '网页搜索连接器',
      description: '免鉴权直连',
      connected: false,
      authType: 'no_auth',
    };
    apiConnectorProviderPageList.mockImplementation((params: unknown) => {
      const query = params as { connected?: string };
      if (query?.connected === 'true') {
        return Promise.resolve({ code: '0000', data: { records: [] } });
      }
      return Promise.resolve({
        code: '0000',
        data: { records: [noAuthRecord], pageNum: 1 },
      });
    });
    apiConnectorConnectionCreate.mockResolvedValue({
      code: '0000',
      data: null,
    });

    renderConnectorModal();
    await screen.findByText('网页搜索连接器');

    // 打开默认聚焦弹窗根（无描边），↓ 逐项聚焦首卡（聚焦类注入）
    const root = document.querySelector<HTMLElement>('.root')!;
    await waitFor(() => {
      expect(document.activeElement).toBe(root);
    });
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(
        document
          .querySelector('[data-connector-key]')
          ?.classList.contains('capability-embed-card-focus'),
      ).toBe(true);
    });

    // Enter 触发卡内连接开关（连接器卡无整体 click）：no_auth 直接建连
    fireEvent.keyDown(root, { key: 'Enter' });
    await waitFor(() => {
      expect(apiConnectorConnectionCreate).toHaveBeenCalledWith(
        expect.objectContaining({ providerService: 'web-search' }),
      );
    });
  });
});
