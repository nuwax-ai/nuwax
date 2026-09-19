import { describe, expect, it } from 'vitest';

import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import {
  appendProjectsPage,
  findProjectKeyByConversation,
  hasMoreProjects,
  mergeFlagIds,
  PROJECT_PAGE_SIZE,
  projectKeyOf,
  remainingProjects,
  toProjectItem,
} from './projectPagination';

const buildRecord = (
  overrides: Partial<UserProjectTabItem> = {},
): UserProjectTabItem => ({
  projectId: 1,
  spaceId: 100,
  projectType: AgentComponentTypeEnum.NormalProject,
  name: '项目A',
  modified: '2026-09-12 10:00:00',
  created: '2026-09-12 09:00:00',
  ...overrides,
});

const buildConversation = (
  overrides: Record<string, unknown> = {},
): ConversationInfo =>
  ({
    id: 11,
    topic: '会话主题',
    modified: '2026-09-12 10:30:00',
    agent: { name: '智能体甲' },
    ...overrides,
  } as unknown as ConversationInfo);

describe('toProjectItem', () => {
  it('映射 tab 记录行字段并透传子项会话', () => {
    const conversation = buildConversation({
      taskStatus: TaskStatus.EXECUTING,
    });
    const item = toProjectItem(
      buildRecord({
        icon: 'x.svg',
        sandboxId: 7,
        devAgentId: 9,
        owner: false,
        pinned: true,
        conversations: [conversation],
      }),
      '新会话',
    );
    expect(item.id).toBe(1);
    expect(item.name).toBe('项目A');
    expect(item.icon).toBe('x.svg');
    expect(item.sandboxId).toBe(7);
    expect(item.devAgentId).toBe(9);
    // 当前用户是否创建者布尔透传（=== false 判参与者，undefined 走现状）
    expect(item.owner).toBe(false);
    expect(item.children).toHaveLength(1);
    expect(item.children?.[0]).toMatchObject({
      id: 11,
      name: '会话主题',
      taskStatus: TaskStatus.EXECUTING,
      conversation,
    });
  });

  it('子项名称回退链：空主题 → 智能体名 → 兜底文案', () => {
    const withTopic = toProjectItem(
      buildRecord({ conversations: [buildConversation()] }),
      '新会话',
    );
    const withoutTopic = toProjectItem(
      buildRecord({
        conversations: [buildConversation({ topic: '' })],
      }),
      '新会话',
    );
    const withoutAgent = toProjectItem(
      buildRecord({
        conversations: [buildConversation({ topic: '', agent: undefined })],
      }),
      '新会话',
    );
    expect(withTopic.children?.[0].name).toBe('会话主题');
    expect(withoutTopic.children?.[0].name).toBe('智能体甲');
    expect(withoutAgent.children?.[0].name).toBe('新会话');
  });

  it('conversations 缺失时 children 为 undefined（统一接口未回包，待懒加载补齐）', () => {
    const item = toProjectItem(buildRecord(), '新会话');
    expect(item.children).toBeUndefined();
  });
});

describe('appendProjectsPage', () => {
  it('按复合键去重追加并保持顺序', () => {
    const first = [
      toProjectItem(buildRecord({ projectId: 1, name: '一' }), '新会话'),
      toProjectItem(buildRecord({ projectId: 2, name: '二' }), '新会话'),
    ];
    const second = [
      toProjectItem(buildRecord({ projectId: 2, name: '二重复' }), '新会话'),
      toProjectItem(buildRecord({ projectId: 3, name: '三' }), '新会话'),
    ];
    const merged = appendProjectsPage(first, second);
    expect(merged.map((item) => item.id)).toEqual([1, 2, 3]);
    // 重复项不覆盖已加载内容
    expect(merged[1].name).toBe('二');
  });

  it('同号异类项目不去重（projectId 跨类型撞车，复合键不同即两个项目）', () => {
    const first = [
      toProjectItem(
        buildRecord({
          projectId: 94,
          projectType: AgentComponentTypeEnum.UserApp,
          name: '全栈',
        }),
        '新会话',
      ),
    ];
    const second = [
      toProjectItem(
        buildRecord({
          projectId: 94,
          projectType: AgentComponentTypeEnum.NormalProject,
          name: '常规',
        }),
        '新会话',
      ),
    ];
    const merged = appendProjectsPage(first, second);
    expect(merged).toHaveLength(2);
    expect(merged.map((item) => projectKeyOf(item))).toEqual([
      'UserApp:94',
      'NormalProject:94',
    ]);
  });

  it('空入参保持原列表', () => {
    const first = [toProjectItem(buildRecord(), '新会话')];
    expect(appendProjectsPage(first, [])).toEqual(first);
    expect(appendProjectsPage([], [])).toEqual([]);
  });
});

describe('mergeFlagIds', () => {
  it('并集合并不丢失既有标记', () => {
    expect(mergeFlagIds(new Set(['a', 'b']), new Set(['b', 'c']))).toEqual(
      new Set(['a', 'b', 'c']),
    );
  });
});

describe('hasMoreProjects / remainingProjects', () => {
  it('未加载完为 true，加载完或 total 缺失为 false', () => {
    expect(hasMoreProjects(PROJECT_PAGE_SIZE, 35)).toBe(true);
    expect(hasMoreProjects(35, 35)).toBe(false);
    expect(hasMoreProjects(40, 35)).toBe(false);
    expect(hasMoreProjects(20, 0)).toBe(false);
  });

  it('剩余数向下钳 0', () => {
    expect(remainingProjects(20, 35)).toBe(15);
    expect(remainingProjects(35, 35)).toBe(0);
    expect(remainingProjects(40, 35)).toBe(0);
  });
});

describe('findProjectKeyByConversation', () => {
  const projects = [
    toProjectItem(
      buildRecord({
        projectId: 1,
        conversations: [buildConversation({ id: 11 })],
      }),
      '新会话',
    ),
    toProjectItem(
      buildRecord({
        projectId: 2,
        conversations: [
          buildConversation({ id: 21 }),
          buildConversation({ id: 22 }),
        ],
      }),
      '新会话',
    ),
    toProjectItem(buildRecord({ projectId: 3 }), '新会话'),
  ];

  it('命中子会话返回所属项目复合键（数字 id 与路由字符串比对）', () => {
    expect(findProjectKeyByConversation(projects, '11')).toBe(
      'NormalProject:1',
    );
    expect(findProjectKeyByConversation(projects, '21')).toBe(
      'NormalProject:2',
    );
    expect(findProjectKeyByConversation(projects, '22')).toBe(
      'NormalProject:2',
    );
  });

  it('未命中（独立任务/无子会话项目）返回 null', () => {
    expect(findProjectKeyByConversation(projects, '99')).toBeNull();
    expect(findProjectKeyByConversation(projects, undefined)).toBeNull();
    expect(findProjectKeyByConversation(projects, '')).toBeNull();
  });

  it('空项目列表返回 null', () => {
    expect(findProjectKeyByConversation([], '11')).toBeNull();
  });
});

describe('projectKeyOf', () => {
  it('复合键含 projectType，类型缺省回落 NormalProject', () => {
    expect(projectKeyOf({ id: 94, projectType: 'UserApp' })).toBe('UserApp:94');
    expect(projectKeyOf({ id: 94 })).toBe('NormalProject:94');
  });
});
