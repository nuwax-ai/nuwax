import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';

/** 项目管理列表行（tab/page-query 实测契约：主键 projectId） */
export type ProjectListItem = Omit<UserProjectTabItem, 'projectId'> & {
  id: number;
};

/**
 * 归一、按类型过滤并去重项目行。
 *
 * 2026-09-11 实测后端会忽略 queryFilter.projectType，因此「全部」并发请求
 * 会收到重复记录，单类型 tab 也会混入其他类型。这里保留客户端防线。
 */
export const normalizeProjectRows = (
  rows: UserProjectTabItem[],
  projectType?: AgentComponentTypeEnum,
): ProjectListItem[] => {
  const uniqueRows = new Map<string, ProjectListItem>();

  rows.forEach((row) => {
    if (projectType && row.projectType !== projectType) return;
    const { projectId, ...rest } = row;
    uniqueRows.set(`${row.projectType}-${projectId}`, {
      ...rest,
      id: projectId,
    });
  });

  return [...uniqueRows.values()].sort((a, b) =>
    (b.modified || '').localeCompare(a.modified || ''),
  );
};
