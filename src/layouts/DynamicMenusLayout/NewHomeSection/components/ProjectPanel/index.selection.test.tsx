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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';

// vi.hoisted：mock 工厂随静态 import 提前执行，引用的 spy 必须先于 import 初始化
const {
  pageQueryMock,
  conversationUpdateMock,
  conversationDeleteMock,
  pinMock,
} = vi.hoisted(() => ({
  pageQueryMock: vi.fn(),
  conversationUpdateMock: vi.fn(),
  conversationDeleteMock: vi.fn(),
  pinMock: vi.fn(),
}));

vi.mock('umi', () => ({
  useParams: () => ({}),
}));

vi.mock('@/services/userProjectApp', () => ({
  apiUserProjectTabPageQuery: pageQueryMock,
  apiUserProjectPin: vi.fn(),
  apiUserProjectArchive: vi.fn(),
  apiUserProjectDelete: vi.fn(),
  apiUserProjectUpdate: vi.fn(),
  apiUserAppDelete: vi.fn(),
  apiUserAppUpdate: vi.fn(),
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationUpdate: conversationUpdateMock,
  apiAgentConversationDelete: conversationDeleteMock,
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

import ProjectPanel from './index';

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

const defaultRecords = (): UserProjectTabItem[] => [
  buildRecord({
    projectId: 1,
    name: '项目一',
    conversations: [buildConversation(11), buildConversation(12)],
  }),
  buildRecord({
    projectId: 2,
    name: '项目二',
    conversations: [buildConversation(21)],
  }),
];

const respondPage = (records: UserProjectTabItem[]) => {
  pageQueryMock.mockResolvedValue({
    code: SUCCESS_CODE,
    data: { records, total: records.length },
  });
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
    conversationUpdateMock.mockReset();
    conversationDeleteMock.mockReset();
    pinMock.mockReset();
  });

  it('命中项目子会话：折叠态自动展开 + 子行高亮（child-active/aria-current）', async () => {
    respondPage(defaultRecords());
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
    respondPage(defaultRecords());
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
    respondPage(defaultRecords());
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
        conversations: [buildConversation(11)],
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
});
