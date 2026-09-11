import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import { describe, expect, it } from 'vitest';
import { normalizeProjectRows } from './projectRows';

const row = (
  projectId: number,
  projectType: AgentComponentTypeEnum,
  modified: string,
): UserProjectTabItem =>
  ({
    projectId,
    projectType,
    modified,
    name: `项目${projectId}`,
  } as UserProjectTabItem);

describe('项目管理列表归一', () => {
  it('合并重复接口响应时按项目类型和 ID 去重并按更新时间排序', () => {
    const normal = row(
      32,
      AgentComponentTypeEnum.NormalProject,
      '2026-09-10T10:00:00',
    );
    const app = row(29, AgentComponentTypeEnum.UserApp, '2026-09-11T10:00:00');

    expect(normalizeProjectRows([normal, app, normal, app])).toEqual([
      expect.objectContaining({ id: 29 }),
      expect.objectContaining({ id: 32 }),
    ]);
  });

  it('单类型 tab 在后端未过滤时仍只保留目标类型', () => {
    const rows = [
      row(32, AgentComponentTypeEnum.NormalProject, '2026-09-10T10:00:00'),
      row(29, AgentComponentTypeEnum.UserApp, '2026-09-11T10:00:00'),
    ];

    expect(
      normalizeProjectRows(rows, AgentComponentTypeEnum.NormalProject),
    ).toEqual([
      expect.objectContaining({
        id: 32,
        projectType: AgentComponentTypeEnum.NormalProject,
      }),
    ]);
  });
});
