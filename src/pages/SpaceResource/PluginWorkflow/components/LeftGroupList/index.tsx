import type { SelectionListItem } from '@/components/SelectionList';
import SelectionList from '@/components/SelectionList';
import { dict } from '@/services/i18nRuntime';
import { apiResourceGroupList } from '@/services/library';
import type {
  ComponentInfo,
  ResourceGroupInfo,
} from '@/types/interfaces/library';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface LeftGroupListProps {
  spaceId: number;
  value: number;
  onChange: (groupId: number) => void;
  componentList?: ComponentInfo[];
  className?: string;
}

const LeftGroupList: React.FC<LeftGroupListProps> = ({
  spaceId,
  value,
  onChange,
  componentList = [],
  className,
}) => {
  const [groupList, setGroupList] = useState<ResourceGroupInfo[]>([]);

  // 并行拉取工作流与插件的资源分组列表，并进行高效率去重合并
  useEffect(() => {
    if (!spaceId) return;

    Promise.all([
      apiResourceGroupList({ spaceId, type: 'Workflow' }),
      apiResourceGroupList({ spaceId, type: 'Plugin' }),
    ])
      .then(([resWorkflow, resPlugin]) => {
        const listW = resWorkflow.data || [];
        const listP = resPlugin.data || [];
        const combined = [...listW, ...listP];

        const seen = new Set<number>();
        const uniqueGroups = combined.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        setGroupList(uniqueGroups);
      })
      .catch(() => {
        // 静默降级以维持用户体验
      });
  }, [spaceId]);

  // 高灵敏实时统计每个资源分组下组件的物理真实总数
  const groupCounts = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    componentList.forEach((item) => {
      if (item.groupId !== undefined && item.groupId !== null) {
        map[item.groupId] = (map[item.groupId] || 0) + 1;
      }
    });
    return map;
  }, [componentList]);

  // 动态构建 SelectionList 所需的卡片选项数据
  const listOptions = useMemo<SelectionListItem<number>[]>(() => {
    const allOption: SelectionListItem<number> = {
      value: 0,
      label: dict('PC.Constants.Space.allTypes'),
      icon: null,
      description: String(componentList.length),
    };

    const groupOptions = groupList.map<SelectionListItem<number>>((group) => ({
      value: group.id,
      label: group.name,
      icon: group.icon || null,
      description: String(groupCounts[group.id] || 0),
    }));

    return [allOption, ...groupOptions];
  }, [groupList, componentList, groupCounts]);

  return (
    <div className={cx(styles['sidebar-container'], className)}>
      <SelectionList
        title={dict('PC.Constants.Space.componentLibrary')}
        list={listOptions}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default LeftGroupList;
