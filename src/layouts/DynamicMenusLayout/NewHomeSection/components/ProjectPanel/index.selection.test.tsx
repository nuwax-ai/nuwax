/**
 * ProjectPanel 选中关系组件测试。
 *
 * 守卫「路由会话 → 项目分组」的三条核心行为契约：
 * - 命中项目子会话：所属项目自动展开 + 子行高亮（child-active/aria-current）
 * - 自动展开只随命中变化触发一次：用户随后手动折叠不会被强制弹回
 * - 反查结果上报（onActiveChildResolved）：命中传会话 id、未命中/无路由/归档项目传 null
 */
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EVENT_TYPE } from '@/constants/event.constants';
import { apiUserProjectPin } from '@/services/userProjectApp';
import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import {
  emitConversationChanged,
  emitProjectChanged,
} from '@/utils/directorySyncEvents';
import eventBus from '@/utils/eventBus';

// vi.hoisted：mock 工厂随静态 import 提前执行，引用的 spy 必须先于 import 初始化
const {
  pageQueryMock,
  conversationsMock,
  conversationUpdateMock,
  conversationDeleteMock,
  pinMock,
  conversationDetailMock,
  conversationListMock,
} = vi.hoisted(() => ({
  pageQueryMock: vi.fn(),
  conversationsMock: vi.fn(),
  conversationUpdateMock: vi.fn(),
  conversationDeleteMock: vi.fn(),
  pinMock: vi.fn(),
  conversationDetailMock: vi.fn(),
  conversationListMock: vi.fn(),
}));

vi.mock('umi', () => ({
  useParams: () => ({}),
}));

vi.mock('@/services/userProjectApp', () => ({
  apiUserProjectPageQuery: pageQueryMock,
  apiUserProjectConversations: conversationsMock,
  apiUserProjectPin: vi.fn(),
  apiUserProjectArchive: vi.fn(),
  apiUserProjectCollect: vi.fn(),
  apiUserProjectUnCollect: vi.fn(),
  apiNormalProjectDelete: vi.fn(),
  apiNormalProjectUpdate: vi.fn(),
  apiUserAppDelete: vi.fn(),
  apiUserAppUpdate: vi.fn(),
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationUpdate: conversationUpdateMock,
  apiAgentConversationDelete: conversationDeleteMock,
  apiAgentConversation: conversationDetailMock,
  apiAgentConversationList: conversationListMock,
}));

vi.mock('@/hooks/useHomePinnedProjectHandoff', () => ({
  default: () => ({ pin: pinMock }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

// vitest 下 plain .less 非 CSS Modules、默认导出 undefined（仓内既有坑）；
// 回显 key 本身，保住 [class*="child-active"] 这类按字面类名的断言
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// SvgIcon 自身 less 同病（xagi-svg-icon 取值炸），断言不涉及图标、整体替身
vi.mock('@/components/base/SvgIcon', () => ({
  default: () => null,
}));

import ProjectPanel, { type ProjectPanelHandle } from './index';

const buildConversation = (id: number, topic = `会话${id}`) =>
  ({
    id,
    topic,
    modified: '2026-09-12T06:00:00.000+00:00',
  } as unknown as ConversationInfo);

const buildRecord = (
  overrides: Partial<UserProjectTabItem> = {},
): UserProjectTabItem => ({
  projectId: 1,
  spaceId: 100,
  projectType: AgentComponentTypeEnum.NormalProject,
  name: '项目一',
  modified: '2026-09-12 10:00:00',
  created: '2026-09-12 09:00:00',
  ...overrides,
});

/** 统一接口不随列表回包 conversations：records 只带项目行，子会话由
 * conversationsMock 按 projectId 回（懒加载链路） */
const defaultRecords = (): UserProjectTabItem[] => [
  buildRecord({
    projectId: 1,
    name: '项目一',
  }),
  buildRecord({
    projectId: 2,
    name: '项目二',
  }),
];

const defaultConversations = (): Record<number, ConversationInfo[]> => ({
  1: [buildConversation(11), buildConversation(12)],
  2: [buildConversation(21)],
});

const respondPage = (
  records: UserProjectTabItem[],
  conversations: Record<number, ConversationInfo[]> = {},
) => {
  pageQueryMock.mockResolvedValue({
    code: SUCCESS_CODE,
    data: { records, total: records.length },
  });
  conversationsMock.mockImplementation((projectId: number) =>
    Promise.resolve({
      code: SUCCESS_CODE,
      data: conversations[projectId] ?? [],
    }),
  );
};

/** 取项目行的子会话容器（hidden 属性驱动折叠态） */
const childrenContainerOf = (projectName: string) => {
  const row = screen.getByText(projectName).closest('[class*="row"]');
  expect(row).toBeTruthy();
  const project = row!.closest('[class*="project"]');
  return project!.querySelector<HTMLElement>('[class*="children"]');
};

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** 多轮 rerender + flush：确认无 effect 依赖变化时折叠态稳定 */
async function actFlush(
  rerender: (ui: React.ReactElement) => void,
  rounds = 3,
) {
  for (let i = 0; i < rounds; i++) {
    rerender(<ProjectPanel compact activeConversationId={'11'} />);
    await act(async () => {
      await flush();
    });
  }
}

describe('ProjectPanel 选中关系', () => {
  beforeEach(() => {
    pageQueryMock.mockReset();
    conversationsMock.mockReset();
    conversationUpdateMock.mockReset();
    conversationDeleteMock.mockReset();
    pinMock.mockReset();
    conversationDetailMock.mockReset();
    // 切回核对探针默认回空列表（全部子会话「消失」→ 全量兜底），个别用例按需覆写
    conversationListMock.mockReset();
    conversationListMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [],
    });
  });

  it('命中项目子会话：折叠态自动展开 + 子行高亮（child-active/aria-current）', async () => {
    respondPage(defaultRecords(), defaultConversations());
    const { rerender } = render(
      <ProjectPanel compact activeConversationId={undefined} />,
    );
    await waitFor(() => expect(screen.getByText('项目一')).toBeTruthy());

    // 先手动折叠项目一，模拟「从别处带着折叠态等命中」场景
    fireEvent.click(screen.getByText('项目一'));
    await waitFor(() =>
      expect(childrenContainerOf('项目一')?.hidden).toBe(true),
    );

    // 路由进入会话 11：所属项目自动展开、子行高亮
    rerender(<ProjectPanel compact activeConversationId={'11'} />);
    await waitFor(() =>
      expect(childrenContainerOf('项目一')?.hidden).toBe(false),
    );

    const activeChild = screen
      .getAllByText('会话11')
      .find((el) => el.closest('[class*="child-active"]'));
    expect(activeChild).toBeTruthy();
    expect(
      document.querySelector('[class*="child-active"][aria-current="page"]'),
    ).toBeTruthy();
  });

  it('自动展开只触发一次：命中后手动折叠不被强制弹回', async () => {
    respondPage(defaultRecords(), defaultConversations());
    const { rerender } = render(
      <ProjectPanel compact activeConversationId={'11'} />,
    );
    await waitFor(() =>
      expect(childrenContainerOf('项目一')?.hidden).toBe(false),
    );

    // 命中态下用户手动折叠
    fireEvent.click(screen.getByText('项目一'));
    await waitFor(() =>
      expect(childrenContainerOf('项目一')?.hidden).toBe(true),
    );

    // 等待并触发若干轮重渲：activeChildProjectId 未变化，展开 effect 不应再跑
    await actFlush(rerender);

    expect(childrenContainerOf('项目一')?.hidden).toBe(true);
  });

  it('反查上报契约：命中传会话 id，未命中/无路由传 null', async () => {
    respondPage(defaultRecords(), defaultConversations());
    const onResolved = vi.fn();

    const { rerender } = render(
      <ProjectPanel compact onActiveChildResolved={onResolved} />,
    );
    await waitFor(() => expect(screen.getByText('项目一')).toBeTruthy());
    expect(onResolved).toHaveBeenLastCalledWith(null);

    rerender(
      <ProjectPanel
        compact
        activeConversationId={'21'}
        onActiveChildResolved={onResolved}
      />,
    );
    await waitFor(() => expect(onResolved).toHaveBeenLastCalledWith('21'));

    rerender(
      <ProjectPanel
        compact
        activeConversationId={'99'}
        onActiveChildResolved={onResolved}
      />,
    );
    await waitFor(() => expect(onResolved).toHaveBeenLastCalledWith(null));
  });

  it('归档项目不参与反查：其下会话命中也上报 null（回落任务列表高亮）', async () => {
    respondPage([
      buildRecord({
        projectId: 1,
        name: '已归档项目',
        archived: true,
      }),
    ]);
    const onResolved = vi.fn();

    render(
      <ProjectPanel
        compact
        activeConversationId={'11'}
        onActiveChildResolved={onResolved}
      />,
    );
    await waitFor(() => expect(pageQueryMock).toHaveBeenCalledTimes(1));

    // 归档项目不进可见列表 → 反查必不命中
    await waitFor(() => expect(onResolved).toHaveBeenLastCalledWith(null));
    expect(document.querySelector('[class*="child-active"]')).toBeNull();
  });

  it('跨页面会话改名后立即补丁项目子行', async () => {
    respondPage(defaultRecords(), defaultConversations());
    render(<ProjectPanel compact />);
    await waitFor(() => expect(screen.getByText('会话11')).toBeTruthy());

    act(() => {
      emitConversationChanged({
        operation: 'updated',
        conversationId: '11',
        patch: { topic: '跨页面新标题' },
        origin: 'test',
        reason: 'rename',
      });
    });

    expect(screen.getByText('跨页面新标题')).toBeTruthy();
  });

  it('子会话请求途中收到创建事件时丢弃旧响应并补拉一次', async () => {
    pageQueryMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: { records: [buildRecord()], total: 1 },
    });
    let resolveFirst: ((value: unknown) => void) | undefined;
    conversationsMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        code: SUCCESS_CODE,
        data: [buildConversation(11), buildConversation(13, '新建会话')],
      });

    render(<ProjectPanel compact />);
    await waitFor(() => expect(conversationsMock).toHaveBeenCalledTimes(1));

    act(() => {
      emitConversationChanged({
        operation: 'created',
        conversationId: '13',
        project: {
          projectId: '1',
          projectType: AgentComponentTypeEnum.NormalProject,
          spaceId: '100',
        },
        origin: 'test',
        reason: 'create',
      });
      resolveFirst?.({
        code: SUCCESS_CODE,
        data: [buildConversation(11, '旧响应会话')],
      });
    });

    await waitFor(() => expect(conversationsMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('新建会话')).toBeTruthy());
    expect(screen.queryByText('旧响应会话')).toBeNull();
  });

  it('/home 无空间参数时接收带 spaceId 的新项目事件', async () => {
    respondPage([buildRecord()], defaultConversations());
    render(<ProjectPanel compact />);
    await waitFor(() => expect(screen.getByText('项目一')).toBeTruthy());
    pageQueryMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: {
        records: [buildRecord(), buildRecord({ projectId: 3, name: '新项目' })],
        total: 2,
      },
    });

    act(() => {
      emitProjectChanged({
        operation: 'created',
        project: {
          projectId: '3',
          projectType: AgentComponentTypeEnum.NormalProject,
          spaceId: '100',
        },
        origin: 'test',
        reason: 'create',
      });
    });

    await waitFor(() => expect(screen.getByText('新项目')).toBeTruthy());
  });

  it('项目子会话接收结束事件并刷新状态', async () => {
    respondPage([buildRecord()], {
      1: [buildConversation(11, '执行任务')],
    });
    conversationsMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [
        {
          ...buildConversation(11, '执行任务'),
          taskStatus: TaskStatus.EXECUTING,
        },
      ],
    });
    conversationDetailMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: { taskStatus: TaskStatus.COMPLETE },
    });
    render(<ProjectPanel compact />);
    await waitFor(() =>
      expect(
        screen.getByText(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
        ),
      ).toBeTruthy(),
    );

    act(() => {
      eventBus.emit(EVENT_TYPE.ChatFinished, { conversationId: '11' });
    });

    await waitFor(() =>
      expect(
        screen.queryByText(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
        ),
      ).toBeNull(),
    );
  });

  it('返回单栏时核对项目和已展开子会话，发现跨端新增行', async () => {
    respondPage([buildRecord()], { 1: [buildConversation(11)] });
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    await waitFor(() => expect(screen.getByText('会话11')).toBeTruthy());

    pageQueryMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: {
        records: [
          buildRecord(),
          buildRecord({ projectId: 3, name: '跨端项目' }),
        ],
        total: 2,
      },
    });
    conversationsMock.mockImplementation((projectId: number) =>
      Promise.resolve({
        code: SUCCESS_CODE,
        data:
          projectId === 1
            ? [buildConversation(11), buildConversation(12, '跨端会话')]
            : [],
      }),
    );
    // 探针：11 无差异；跨端新增的 12 经 devTarget 归属命中项目 1 → 只重拉项目 1
    conversationListMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [
        buildConversation(11),
        {
          ...buildConversation(12, '跨端会话'),
          devTargetType: AgentComponentTypeEnum.NormalProject,
          devTargetId: '1',
        } as ConversationInfo,
      ],
    });

    act(() => ref.current?.revalidateVisible());

    await waitFor(() => expect(screen.getByText('跨端项目')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('跨端会话')).toBeTruthy());
  });

  it('切回核对探针：无差异时不再逐项目重拉子会话', async () => {
    respondPage([buildRecord()], { 1: [buildConversation(11)] });
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    await waitFor(() => expect(screen.getByText('会话11')).toBeTruthy());
    expect(conversationsMock).toHaveBeenCalledTimes(1);
    expect(ref.current?.hasExecutingChildren()).toBe(false);

    // 探针回包与已加载子会话指纹完全一致（常态切回：切走期间无变化）
    conversationListMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [buildConversation(11)],
    });
    act(() => ref.current?.revalidateVisible());

    await waitFor(() => expect(pageQueryMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(conversationListMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      await flush();
      await flush();
    });
    // 项目行重拉 + 探针各一次，子会话零重拉
    expect(conversationsMock).toHaveBeenCalledTimes(1);
  });

  it('切回核对探针：执行中→终态先 emit 本地补丁，仅重拉受影响项目', async () => {
    respondPage(
      [buildRecord({ projectId: 1 }), buildRecord({ projectId: 2 })],
      {
        1: [
          {
            ...buildConversation(11, '执行任务'),
            taskStatus: TaskStatus.EXECUTING,
          },
        ],
        2: [buildConversation(21)],
      },
    );
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    await waitFor(() =>
      expect(
        screen.getByText(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
        ),
      ).toBeTruthy(),
    );
    expect(ref.current?.hasExecutingChildren()).toBe(true);
    expect(conversationsMock).toHaveBeenCalledTimes(2);

    // 探针：11 已终态（21 无差异）；子会话重拉也回终态（emit 补丁与重拉双路收敛）
    conversationsMock.mockImplementation((projectId: number) =>
      Promise.resolve({
        code: SUCCESS_CODE,
        data:
          projectId === 1
            ? [
                {
                  ...buildConversation(11, '执行任务'),
                  taskStatus: TaskStatus.COMPLETE,
                },
              ]
            : [buildConversation(21)],
      }),
    );
    conversationListMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [
        {
          ...buildConversation(11, '执行任务'),
          taskStatus: TaskStatus.COMPLETE,
        },
        buildConversation(21),
      ],
    });
    act(() => ref.current?.revalidateVisible());

    // 「执行中」标记翻新（emit 终态补丁 + 受影响项目重拉）
    await waitFor(() =>
      expect(
        screen.queryByText(
          'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
        ),
      ).toBeNull(),
    );
    expect(ref.current?.hasExecutingChildren()).toBe(false);
    // 只重拉项目 1（差异项目），项目 2 无差异不重拉
    await waitFor(() => expect(conversationsMock).toHaveBeenCalledTimes(3));
    expect(conversationsMock).toHaveBeenLastCalledWith(
      1,
      AgentComponentTypeEnum.NormalProject,
    );
  });

  it('切回核对探针：出现未加载过的会话 id 时全量兜底发现新增行', async () => {
    respondPage([buildRecord()], { 1: [buildConversation(11)] });
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    await waitFor(() => expect(screen.getByText('会话11')).toBeTruthy());

    // 探针出现未知 id（切走期间新增会话，无法定位归属项目）→ 全量兜底重拉
    conversationsMock.mockImplementation(() =>
      Promise.resolve({
        code: SUCCESS_CODE,
        data: [buildConversation(11), buildConversation(12, '探针新会话')],
      }),
    );
    conversationListMock.mockResolvedValue({
      code: SUCCESS_CODE,
      data: [buildConversation(11), buildConversation(12, '探针新会话')],
    });
    act(() => ref.current?.revalidateVisible());

    await waitFor(() => expect(screen.getByText('探针新会话')).toBeTruthy());
  });

  it('项目刷新在途的改名事件不会被旧回包覆盖', async () => {
    respondPage([buildRecord()], { 1: [] });
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    await waitFor(() => expect(screen.getByText('项目一')).toBeTruthy());
    let resolveRefresh: ((value: unknown) => void) | undefined;
    pageQueryMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    act(() => ref.current?.revalidateVisible());
    await waitFor(() => expect(resolveRefresh).toBeDefined());
    act(() => {
      emitProjectChanged({
        operation: 'updated',
        project: {
          projectId: '1',
          projectType: AgentComponentTypeEnum.NormalProject,
          spaceId: '100',
        },
        patch: { name: '最新项目名' },
        origin: 'test',
        reason: 'rename',
      });
      resolveRefresh?.({
        code: SUCCESS_CODE,
        data: { records: [buildRecord()], total: 1 },
      });
    });

    await waitFor(() => expect(screen.getByText('最新项目名')).toBeTruthy());
    expect(screen.queryByText('项目一')).toBeNull();
  });

  it('置顶项目后本地列表立即聚拢置顶分组（无需刷新）', async () => {
    vi.mocked(apiUserProjectPin).mockResolvedValue({
      code: SUCCESS_CODE,
      data: null,
    } as never);
    // 首屏不带置顶；置顶成功后的收敛重拉回包里服务端已落置顶（读己之写）
    pageQueryMock
      .mockResolvedValueOnce({
        code: SUCCESS_CODE,
        data: {
          records: [
            buildRecord({ projectId: 1, name: '置顶甲', pinned: true }),
            buildRecord({ projectId: 2, name: '普通乙' }),
            buildRecord({ projectId: 3, name: '普通丙' }),
            buildRecord({ projectId: 4, name: '待置顶丁' }),
          ],
          total: 4,
        },
      })
      .mockResolvedValue({
        code: SUCCESS_CODE,
        data: {
          records: [
            buildRecord({ projectId: 1, name: '置顶甲', pinned: true }),
            buildRecord({ projectId: 2, name: '普通乙' }),
            buildRecord({ projectId: 3, name: '普通丙' }),
            buildRecord({ projectId: 4, name: '待置顶丁', pinned: true }),
          ],
          total: 4,
        },
      });
    render(<ProjectPanel />);
    await waitFor(() => expect(screen.getByText('待置顶丁')).toBeTruthy());

    // 打开「待置顶丁」行 ⋯ 菜单 → 点「置顶」
    const row = screen.getByText('待置顶丁').closest('[class*="row"]');
    expect(row).toBeTruthy();
    const moreButton = row!.querySelector<HTMLButtonElement>(
      'button[aria-label="PC.Components.ActionMenu.more"]',
    );
    expect(moreButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(moreButton!);
    });
    await act(async () => {
      fireEvent.click(
        screen.getByText('PC.Components.ConversationContextMenu.pin'),
      );
    });

    // 置顶成功后本地立即重排：置顶项相邻且居前，普通项目垫后
    await waitFor(() => {
      const order = screen
        .getAllByText(/^(置顶甲|普通乙|普通丙|待置顶丁)$/)
        .map((el) => el.textContent);
      expect(order).toEqual(['置顶甲', '待置顶丁', '普通乙', '普通丙']);
    });
  });

  it('置顶回包丢失但后端已提交：收敛重拉后自动聚拢（无需手动刷新）', async () => {
    // 模拟响应链路丢失：请求 reject → 前端当作失败，不落本地标记
    vi.mocked(apiUserProjectPin).mockRejectedValue(new Error('network lost'));
    const unpinned = {
      code: SUCCESS_CODE,
      data: {
        records: [
          buildRecord({ projectId: 1, name: '已置顶甲', pinned: true }),
          buildRecord({ projectId: 2, name: '待置顶乙' }),
        ],
        total: 2,
      },
    };
    const committed = {
      code: SUCCESS_CODE,
      data: {
        records: [
          buildRecord({ projectId: 1, name: '已置顶甲', pinned: true }),
          buildRecord({ projectId: 2, name: '待置顶乙', pinned: true }),
        ],
        total: 2,
      },
    };
    // 首屏看不到置顶；toggle 失败后的收敛重拉读到后端真值（已置顶）
    pageQueryMock
      .mockResolvedValueOnce(unpinned)
      .mockResolvedValueOnce(committed);
    render(<ProjectPanel />);
    await waitFor(() => expect(screen.getByText('待置顶乙')).toBeTruthy());
    expect(
      screen
        .getByText('待置顶乙')
        .closest('[class*="row"]')
        ?.querySelector('.anticon-pushpin'),
    ).toBeNull();

    const row = screen.getByText('待置顶乙').closest('[class*="row"]');
    await act(async () => {
      fireEvent.click(
        row!.querySelector<HTMLButtonElement>(
          'button[aria-label="PC.Components.ActionMenu.more"]',
        )!,
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getByText('PC.Components.ConversationContextMenu.pin'),
      );
    });

    // 失败路径不落乐观标记，但收敛重拉把服务端真值（已置顶、置顶排前）带回来
    await waitFor(() => {
      const order = screen
        .getAllByText(/^(已置顶甲|待置顶乙)$/)
        .map((el) => el.textContent);
      expect(order).toEqual(['已置顶甲', '待置顶乙']);
      expect(
        screen
          .getByText('待置顶乙')
          .closest('[class*="row"]')
          ?.querySelector('.anticon-pushpin'),
      ).toBeTruthy();
    });
  });

  it('同号异类项目（projectId 跨类型撞车）：置顶互不串标记、React key 不撞', async () => {
    vi.mocked(apiUserProjectPin).mockResolvedValue({
      code: SUCCESS_CODE,
      data: null,
    } as never);
    // 两个 projectId 同为 94 的不同类型项目：UserApp「全栈九四」+ NormalProject「常规九四」
    const records = (pinnedRegular94 = false) => [
      buildRecord({
        projectId: 94,
        projectType: AgentComponentTypeEnum.UserApp,
        name: '全栈九四',
      }),
      buildRecord({
        projectId: 94,
        projectType: AgentComponentTypeEnum.NormalProject,
        name: '常规九四',
        pinned: pinnedRegular94 || undefined,
      }),
      buildRecord({ projectId: 2, name: '普通二' }),
    ];
    // 首屏无置顶；置顶后收敛重拉回包读到已提交真值（读己之写）
    pageQueryMock
      .mockResolvedValueOnce({
        code: SUCCESS_CODE,
        data: { records: records(), total: 3 },
      })
      .mockResolvedValue({
        code: SUCCESS_CODE,
        data: { records: records(true), total: 3 },
      });
    render(<ProjectPanel />);
    await waitFor(() => expect(screen.getByText('常规九四')).toBeTruthy());
    // 两行都在（复合键 React key 不互斥）
    expect(screen.getByText('全栈九四')).toBeTruthy();
    expect(screen.getByText('普通二')).toBeTruthy();

    // 置顶「常规九四」：只它亮图钉+排前，「全栈九四」不受影响
    const row = screen.getByText('常规九四').closest('[class*="row"]');
    await act(async () => {
      fireEvent.click(
        row!.querySelector<HTMLButtonElement>(
          'button[aria-label="PC.Components.ActionMenu.more"]',
        )!,
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getByText('PC.Components.ConversationContextMenu.pin'),
      );
    });
    await waitFor(() => {
      const order = screen
        .getAllByText(/^(全栈九四|常规九四|普通二)$/)
        .map((el) => el.textContent);
      expect(order).toEqual(['常规九四', '全栈九四', '普通二']);
      expect(
        screen
          .getByText('常规九四')
          .closest('[class*="row"]')
          ?.querySelector('.anticon-pushpin'),
      ).toBeTruthy();
      expect(
        screen
          .getByText('全栈九四')
          .closest('[class*="row"]')
          ?.querySelector('.anticon-pushpin'),
      ).toBeNull();
    });
  });
});
