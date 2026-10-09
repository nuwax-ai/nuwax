/**
 * 项目列表标题旁筛选条
 *
 * 布局对齐 SpaceDevelop：标题后先归档下拉（SelectList），再收藏切换（ButtonToggle）。
 * 取值对应 page-query 的 archivedFilter / collectedFilter。
 */
import ButtonToggle from '@/components/ButtonToggle';
import SelectList from '@/components/custom/SelectList';
import { dict } from '@/services/i18nRuntime';
import React, { useMemo } from 'react';

/** 收藏过滤：all=全部；only=仅收藏 */
export type CollectedFilter = 'all' | 'only';

/** 归档过滤：all=全部；exclude=排除归档；only=仅归档 */
export type ArchivedFilter = 'all' | 'exclude' | 'only';

export const DEFAULT_COLLECTED_FILTER: CollectedFilter = 'all';
export const DEFAULT_ARCHIVED_FILTER: ArchivedFilter = 'all';

export interface ProjectListFilterBarProps {
  /** 归档过滤值 */
  archivedFilter: ArchivedFilter;
  /** 收藏过滤值 */
  collectedFilter: CollectedFilter;
  /** 归档过滤变更 */
  onArchivedFilterChange: (value: ArchivedFilter) => void;
  /** 收藏过滤变更 */
  onCollectedFilterChange: (value: CollectedFilter) => void;
}

const ProjectListFilterBar: React.FC<ProjectListFilterBarProps> = ({
  archivedFilter,
  collectedFilter,
  onArchivedFilterChange,
  onCollectedFilterChange,
}) => {
  const archivedOptions = useMemo(
    () => [
      {
        value: 'all',
        label: dict('PC.Common.Global.all'),
      },
      {
        value: 'exclude',
        label: dict('PC.Pages.SpaceProjectManage.filterUnarchived'),
      },
      {
        value: 'only',
        label: dict('PC.Pages.SpaceProjectManage.filterArchivedOnly'),
      },
    ],
    [],
  );

  const collectedOptions = useMemo(
    () => [
      {
        value: 'all',
        label: dict('PC.Common.Global.all'),
      },
      {
        value: 'only',
        label: dict('PC.Pages.SpaceProjectManage.filterCollectedOnly'),
      },
    ],
    [],
  );

  return (
    <>
      <SelectList
        value={archivedFilter}
        options={archivedOptions}
        onChange={(value) => onArchivedFilterChange(value as ArchivedFilter)}
        size="middle"
      />
      <ButtonToggle
        options={collectedOptions}
        value={collectedFilter}
        onChange={(value) => onCollectedFilterChange(value as CollectedFilter)}
      />
    </>
  );
};

export default ProjectListFilterBar;
