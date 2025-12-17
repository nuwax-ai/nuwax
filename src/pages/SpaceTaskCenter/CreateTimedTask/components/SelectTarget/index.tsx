import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import TooltipIcon from '@/components/custom/TooltipIcon';
import McpCollapseComponentList from '@/components/McpCollapseComponentList';
import { MCP_COLLAPSE_COMPONENT_LIST } from '@/constants/mcp.constants';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { McpConfigComponentInfo } from '@/types/interfaces/mcp';
import { CollapseProps } from 'antd';
import { useState } from 'react';

export interface SelectTargetProps {
  value?: {
    targetId: string;
    targetType: AgentComponentTypeEnum.Workflow | AgentComponentTypeEnum.Agent;
  };
  onChange?: (
    value: {
      targetId: string;
      targetType:
        | AgentComponentTypeEnum.Workflow
        | AgentComponentTypeEnum.Agent;
    } | null,
  ) => void;
}

const SelectTarget: React.FC<SelectTargetProps> = ({ value, onChange }) => {
  // 当前激活的折叠面板的key
  const [collapseActiveKey, setCollapseActiveKey] = useState<string[]>(
    value?.targetType
      ? [value.targetType]
      : [AgentComponentTypeEnum.Workflow, AgentComponentTypeEnum.Agent],
  );

  // 当前选中的类型，默认工作流/智能体
  const [selectedTypes, setSelectedTypes] = useState<AgentComponentTypeEnum[]>(
    value?.targetType
      ? [value.targetType]
      : [AgentComponentTypeEnum.Workflow, AgentComponentTypeEnum.Agent],
  );

  // MCP服务配置组件列表
  const [mcpConfigComponentList, setMcpConfigComponentList] = useState<
    McpConfigComponentInfo[]
  >([]);

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      mcpConfigComponentList?.filter(
        (item: McpConfigComponentInfo) => item.type === type,
      ) || []
    );
  };

  // 处于loading或added状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  /**
   * 删除组件
   * @param targetId: 关联的组件ID
   * @param type: 组件类型
   */
  const handleComponentDel = async () => {
    // 设置MCP服务配置组件列表和处于loading或added状态的组件列表为空
    setMcpConfigComponentList([]);

    // 设置处于loading或added状态的组件列表为空
    setAddComponents([]);

    // 当前激活的折叠面板的key
    setCollapseActiveKey([
      AgentComponentTypeEnum.Workflow,
      AgentComponentTypeEnum.Agent,
    ]);

    // 当前选中的类型
    setSelectedTypes([
      AgentComponentTypeEnum.Workflow,
      AgentComponentTypeEnum.Agent,
    ]);

    onChange?.(null);
  };
  // 选中的头部的tag
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    value?.targetType || AgentComponentTypeEnum.Plugin,
  );

  // 打开添加组件的弹窗
  const [openAddComponent, setOpenAddComponent] = useState<boolean>(false);

  // 添加智能体、插件、工作流、知识库、数据表等
  const handlerComponentPlus = (
    e: React.MouseEvent<HTMLElement>,
    type: AgentComponentTypeEnum,
  ) => {
    e.stopPropagation();
    setCheckTag(type);
    setOpenAddComponent(true);
  };

  // 折叠面板列表
  const collapseList: CollapseProps['items'] =
    MCP_COLLAPSE_COMPONENT_LIST.filter((item) =>
      selectedTypes.includes(item.type),
    ).map((item) => ({
      key: item.type,
      label: item.label,
      children: (
        <McpCollapseComponentList
          type={item.type}
          list={filterList(item.type)}
          onDel={handleComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title={`添加${item.label}`}
          onClick={(e) => handlerComponentPlus(e, item.type)}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    }));

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    // 设置处于loading或added状态的组件列表
    setAddComponents(() => {
      return [
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Added,
        },
      ];
    });
    // MCP服务配置组件列表
    setMcpConfigComponentList(() => {
      return [
        {
          name: info.name,
          icon: info.icon,
          description: info.description,
          type: info.targetType,
          targetId: info.targetId,
          targetConfig: '',
        },
      ];
    });

    // 展开的折叠面板的key
    setCollapseActiveKey(() => {
      return [info.targetType];
    });

    // 选中的类型
    setSelectedTypes(() => {
      return [info.targetType];
    });

    onChange?.({
      targetId: info.targetId.toString(),
      targetType: info.targetType as
        | AgentComponentTypeEnum.Workflow
        | AgentComponentTypeEnum.Agent,
    });
  };

  return (
    <>
      <ConfigOptionCollapse
        items={collapseList}
        defaultActiveKey={collapseActiveKey}
      />

      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        // 隐藏顶部
        hideTop={[
          AgentComponentTypeEnum.Workflow,
          AgentComponentTypeEnum.Agent,
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Plugin,
        ]}
        open={openAddComponent}
        onCancel={() => setOpenAddComponent(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
      />
    </>
  );
};

export default SelectTarget;
