import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import type {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import { useCallback, useMemo, useState } from 'react';
import type { PluginCommandItem } from './MentionPopup/types';

/** 命令选择只追加；补齐底部组件栏元数据，让全局插件可见且可取消。 */
export function useSlashPlugins(
  manualComponents: AgentManualComponentInfo[] = [],
  selectedComponents: AgentSelectedComponentInfo[] = [],
  onSelectComponent?: (item: AgentSelectedComponentInfo) => void,
) {
  const [plugins, setPlugins] = useState<AgentManualComponentInfo[]>([]);
  const onPluginSelect = useCallback(
    (item: PluginCommandItem) => {
      if (!onSelectComponent) return;
      // 能力面板选中的连接器/专家/资料库经 componentType 透传，缺省仍为插件
      const component = {
        id: item.targetId,
        type: item.componentType ?? AgentComponentTypeEnum.Plugin,
      };
      setPlugins((prev) =>
        prev.some((plugin) => plugin.id === item.targetId)
          ? prev
          : [
              ...prev,
              {
                ...component,
                name: item.name,
                icon: item.icon ?? '',
                description: item.description ?? '',
                defaultSelected: DefaultSelectedEnum.No,
              },
            ],
      );
      if (
        !selectedComponents.some(
          (selected) =>
            selected.id === component.id && selected.type === component.type,
        )
      )
        onSelectComponent(component);
    },
    [selectedComponents, onSelectComponent],
  );
  const commandManualComponents = useMemo(
    () => [
      ...manualComponents,
      ...plugins.filter(
        (plugin) =>
          selectedComponents.some(
            (selected) =>
              selected.id === plugin.id && selected.type === plugin.type,
          ) &&
          !manualComponents.some(
            (manual) => manual.id === plugin.id && manual.type === plugin.type,
          ),
      ),
    ],
    [manualComponents, plugins, selectedComponents],
  );
  return {
    onPluginSelect: onSelectComponent ? onPluginSelect : undefined,
    commandManualComponents,
  };
}
