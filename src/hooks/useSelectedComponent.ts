import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import { useMemo, useState } from 'react';

const componentKey = (item: AgentSelectedComponentInfo) =>
  `${item.type}:${item.id}`;

// 会话输入框已选择组件
const useSelectedComponent = () => {
  // 已选中的组件列表
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);
  const [componentDetails, setComponentDetails] = useState<
    Record<string, Partial<AgentManualComponentInfo>>
  >({});
  const selectedComponentDetails = useMemo(
    () =>
      selectedComponentList.map((item) => ({
        ...item,
        ...componentDetails[componentKey(item)],
      })),
    [selectedComponentList, componentDetails],
  );

  // 选中配置组件
  const handleSelectComponent = (
    item: AgentSelectedComponentInfo | AgentManualComponentInfo,
  ) => {
    if ('name' in item && item.name) {
      setComponentDetails((previous) => ({
        ...previous,
        [componentKey(item)]: {
          name: item.name,
          icon: item.icon,
          description: item.description,
        },
      }));
    }
    setSelectedComponentList((previous) => {
      // 全局插件与其他组件可能使用相同数字 ID，必须同时匹配类型。
      const matches = (component: AgentSelectedComponentInfo) =>
        component.id === item.id && component.type === item.type;
      return previous.some(matches)
        ? previous.filter((component) => !matches(component))
        : [...previous, { id: item.id, type: item.type }];
    });
  };

  // 初始化选中的组件列表
  const initSelectedComponentList = (
    manualComponents?: AgentManualComponentInfo[],
  ) => {
    setComponentDetails(
      Object.fromEntries(
        (manualComponents || []).map((item) => [
          componentKey(item),
          { name: item.name, icon: item.icon, description: item.description },
        ]),
      ),
    );
    setSelectedComponentList(
      (manualComponents || [])
        .filter((item) => item.defaultSelected === DefaultSelectedEnum.Yes)
        .map((item) => ({ id: item.id, type: item.type })),
    );
  };

  return {
    selectedComponentList,
    selectedComponentDetails,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  };
};

export default useSelectedComponent;
