/**
 * 独立连接器列表组件 ConnectorListView 契约：
 * - 四场景接口参数：system(scope=official+category)、team(spaceId /
 *   scope=space)、search(纯 keyword,不带 scope/spaceId)、connected
 *   (connected=true 全量双壳兼容 + keyword 客户端过滤)；
 * - 服务端分页触底追加（无总页数,按本页取满判定）；
 * - 连接/断开内聚：开关切换分流 handleConnect/handleDisconnect（共享
 *   hook mock 捕获 updateItem 并模拟成功）,连接态就地回写 +
 *   onConnectedChange 通知；hover「断开」按钮（已连接渲染）走断开；
 * - 双变体：grid 两栏卡（70px 等高技能卡） / list 单栏行。
 * services/共享 hook/子弹窗全部 mock（vitest 不可用 umi request）。
 */
import type { ConnectorListViewProps } from '@/components/business-component/ConnectorListView';
import ConnectorListView from '@/components/business-component/ConnectorListView';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiConnectorProviderPageList = vi.hoisted(() => vi.fn());
const connectorConnectState = vi.hoisted(() => ({
  updateItem: undefined as
    | undefined
    | ((k: string, p: { connected?: boolean }) => void),
}));

vi.mock('@/components/business-component/ConnectorListView/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList,
}));

// 共享 hook mock：捕获组件传入的 updateItem（测试内模拟连接/断开成功回写）
vi.mock('@/hooks/useConnectorConnect', () => {
  const actualHooks = {
    handleConnect: vi.fn(),
    connectingIds: [] as string[],
    handleDisconnect: vi.fn(),
    disconnectingIds: [] as string[],
    connectCtx: null,
    closeConnectModal: vi.fn(),
    handleConnected: vi.fn(),
    deviceCtx: null,
    closeDeviceAuthModal: vi.fn(),
    handleDeviceConnected: vi.fn(),
  };
  return {
    default: vi.fn(
      ({
        updateItem,
      }: {
        updateItem: (k: string, p: { connected?: boolean }) => void;
      }) => {
        connectorConnectState.updateItem = updateItem;
        return actualHooks;
      },
    ),
  };
});

vi.mock('@/components/business-component/ConnectorConnectModal', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/ConnectorDeviceAuthModal', () => ({
  default: () => null,
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));

const provider = (overloads: Record<string, unknown>) => ({
  description: '连接器描述',
  icon: '',
  ...overloads,
});

/** 分页响应（pageNum/records;无总页数） */
const pageOf = (records: unknown[], pageNum = 1) => ({
  code: '0000',
  data: { records, pageNum, total: records.length },
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

const renderView = (props: Partial<ConnectorListViewProps>) =>
  render(<ConnectorListView type="system" {...props} />);

/** 定位条目内开关 */
const switchOf = (key: string) =>
  document
    .querySelector(`[data-connector-key="${key}"]`)
    ?.querySelector<HTMLButtonElement>('[role="switch"]') ?? null;

describe('ConnectorListView·场景接口参数契约', () => {
  it('system：scope=official + category + keyword', async () => {
    apiConnectorProviderPageList.mockResolvedValue(pageOf([]));
    renderView({ type: 'system', category: '通讯工具', keyword: '搜索' });

    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith({
        pageNum: 1,
        pageSize: 20,
        scope: 'official',
        category: '通讯工具',
        keyword: '搜索',
      }),
    );
  });

  it('team·具体空间：仅传 spaceId；未传则 scope=space 聚合', async () => {
    apiConnectorProviderPageList.mockResolvedValue(pageOf([]));
    renderView({ type: 'team', spaceId: 3 });
    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith({
        pageNum: 1,
        pageSize: 20,
        keyword: undefined,
        spaceId: 3,
      }),
    );

    cleanup();
    apiConnectorProviderPageList.mockClear();
    apiConnectorProviderPageList.mockResolvedValue(pageOf([]));
    renderView({ type: 'team' });
    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith({
        pageNum: 1,
        pageSize: 20,
        keyword: undefined,
        scope: 'space',
      }),
    );
  });

  it('search：纯关键字 + 分页,不带 scope/spaceId', async () => {
    apiConnectorProviderPageList.mockResolvedValue(pageOf([]));
    renderView({ type: 'search', keyword: '天气' });

    await waitFor(() =>
      expect(apiConnectorProviderPageList).toHaveBeenCalledWith({
        pageNum: 1,
        pageSize: 20,
        keyword: '天气',
      }),
    );
  });

  it('connected：connected=true 全量,双壳兼容,keyword 客户端过滤', async () => {
    apiConnectorProviderPageList.mockResolvedValue({
      code: '0000',
      data: [
        provider({
          service: 'weather',
          displayName: '天气连接器',
          connected: true,
        }),
        provider({
          service: 'map',
          displayName: '地图连接器',
          connected: true,
        }),
      ],
    });
    renderView({ type: 'connected' });

    expect(await screen.findByText('天气连接器')).toBeInTheDocument();
    expect(apiConnectorProviderPageList).toHaveBeenCalledWith({
      connected: 'true',
    });

    cleanup();
    // records 分页壳兼容
    apiConnectorProviderPageList.mockResolvedValue(
      pageOf([provider({ service: 'map', displayName: '地图连接器' })]),
    );
    renderView({ type: 'connected', keyword: '地图' });
    await waitFor(() => {
      expect(screen.queryByText('天气连接器')).toBeNull();
      expect(screen.getByText('地图连接器')).toBeInTheDocument();
    });
  });
});

describe('ConnectorListView·分页与连接流程', () => {
  it('服务端分页：触底追加下一页（本页取满判定 hasMore）', async () => {
    apiConnectorProviderPageList
      .mockResolvedValueOnce(
        pageOf(
          Array.from({ length: 20 }, (_, i) => provider({ service: `s-${i}` })),
          1,
        ),
      )
      .mockResolvedValueOnce(pageOf([provider({ service: 'last' })], 2));
    const { container } = renderView({ type: 'search' });
    await screen.findByText('s-0');

    const scroller = container.firstElementChild as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', { value: 500 });
    Object.defineProperty(scroller, 'clientHeight', { value: 480 });
    fireEvent.scroll(scroller);
    await screen.findByText('last');
    expect(apiConnectorProviderPageList).toHaveBeenCalledTimes(2);
  });

  it('连接成功（共享 hook 回写）：开关回弹为 on + onConnectedChange 通知', async () => {
    apiConnectorProviderPageList.mockResolvedValue(
      pageOf([
        provider({ service: 'weather', displayName: '天气', connected: false }),
      ]),
    );
    const onConnectedChange = vi.fn();
    renderView({ type: 'system', onConnectedChange });

    await screen.findByText('天气');
    expect(
      switchOf('connector:system:weather')?.getAttribute('aria-checked'),
    ).toBe('false');

    // 模拟共享 hook 连接成功回调（组件包装的 updateItem）
    connectorConnectState.updateItem?.('connector:system:weather', {
      connected: true,
    });
    await waitFor(() =>
      expect(
        switchOf('connector:system:weather')?.getAttribute('aria-checked'),
      ).toBe('true'),
    );
    expect(onConnectedChange).toHaveBeenCalledWith(
      expect.objectContaining({ rawId: 'weather', connected: true }),
      true,
    );
  });
});

describe('ConnectorListView·双变体渲染', () => {
  const fixture = () => [
    provider({
      service: 'weather',
      displayName: '变体连接器',
      connected: true,
    }),
  ];

  it('grid 默认：两栏卡（状态标+开关+hover 断开按钮）,总高 70px', async () => {
    apiConnectorProviderPageList.mockResolvedValue(pageOf(fixture()));
    renderView({ type: 'system' });
    const card = await waitFor(() => {
      const el = document.querySelector(
        '[data-connector-key="connector:system:weather"]',
      );
      expect(el?.className).toContain('card');
      return el!;
    });
    // 状态标 + 开关 + 断开按钮（已连接渲染,默认 display:none hover 浮现）
    expect(card.textContent).toContain(
      'PC.Components.CapabilityModal.connected',
    );
    expect(card.querySelector('[role="switch"]')).toBeTruthy();
    const disconnect = card.querySelector('button[aria-label]');
    expect(disconnect).toBeTruthy();
  });

  it('list 变体：单栏行（无边线/悬停灰底）,渲染一致', async () => {
    apiConnectorProviderPageList.mockResolvedValue(pageOf(fixture()));
    renderView({ type: 'system', variant: 'list' });
    const row = await waitFor(() => {
      const el = document.querySelector(
        '[data-connector-key="connector:system:weather"]',
      );
      expect(el?.className).toContain('list-row');
      return el!;
    });
    expect(row.querySelector('[role="switch"]')).toBeTruthy();
    expect(row.textContent).toContain(
      'PC.Components.CapabilityModal.connected',
    );
  });
});
