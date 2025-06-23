import McpCollapseComponentList from '@/components/McpCollapseComponentList';
import TooltipIcon from '@/components/TooltipIcon';
import { MCP_COLLAPSE_COMPONENT_LIST } from '@/constants/mcp.constants';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { AgentArrangeConfigEnum } from '@/types/enums/space';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { McpConfigComponentInfo } from '@/types/interfaces/mcp';
import { CollapseProps, Form } from 'antd';
import { useMemo, useRef, useState } from 'react';

const useMcp = () => {
  const [form] = Form.useForm();
  // icon图片地址
  const [imageUrl, setImageUrl] = useState<string>('');
  // MCP服务配置组件列表
  const [mcpConfigComponentList, setMcpConfigComponentList] = useState<
    McpConfigComponentInfo[]
  >([]);
  // 处于loading或added状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveDeployLoading, setSaveDeployLoading] = useState(false);
  // 选中的头部的tag
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 打开添加组件的弹窗
  const [openAddComponent, setOpenAddComponent] = useState<boolean>(false);
  // 是否部署
  const withDeployRef = useRef<boolean>(false);

  // 保存MCP服务
  const handleSave = (withDeploy: boolean = false) => {
    withDeployRef.current = withDeploy;
    form.submit();
  };

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      mcpConfigComponentList?.filter(
        (item: McpConfigComponentInfo) => item.type === type,
      ) || []
    );
  };

  /**
   * 删除组件
   * @param targetId: 关联的组件ID
   * @param type: 组件类型
   */
  const handleComponentDel = async (
    targetId: number,
    type: AgentComponentTypeEnum,
  ) => {
    // 从mcpConfigComponentList中删除组件
    const list = mcpConfigComponentList?.filter(
      (item: McpConfigComponentInfo) =>
        !(item.targetId === targetId && item.type === type),
    );
    setMcpConfigComponentList(list);
    const newList =
      addComponents?.filter(
        (item) => !(item.targetId === targetId && item.type === type),
      ) || [];
    setAddComponents(newList);
  };

  // 添加插件、工作流、知识库等
  const handlerComponentPlus = (
    e: React.MouseEvent<HTMLElement>,
    type: AgentComponentTypeEnum,
  ) => {
    e.stopPropagation();
    setCheckTag(type);
    setOpenAddComponent(true);
  };

  // 是否存在组件
  const isExistComponent = (type: AgentComponentTypeEnum) => {
    return mcpConfigComponentList?.some(
      (item: McpConfigComponentInfo) => item.type === type,
    );
  };

  // 折叠面板 - 当前激活 tab 面板的 key
  const collapseActiveKey = useMemo(() => {
    const list: AgentArrangeConfigEnum[] = [];
    if (isExistComponent(AgentComponentTypeEnum.Plugin)) {
      list.push(AgentArrangeConfigEnum.Plugin);
    }
    if (isExistComponent(AgentComponentTypeEnum.Workflow)) {
      list.push(AgentArrangeConfigEnum.Workflow);
    }
    if (isExistComponent(AgentComponentTypeEnum.Knowledge)) {
      list.push(AgentArrangeConfigEnum.Knowledge);
    }
    if (isExistComponent(AgentComponentTypeEnum.Table)) {
      list.push(AgentArrangeConfigEnum.Table);
    }
    return list;
  }, [mcpConfigComponentList]);

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    setAddComponents((list) => {
      return [
        ...list,
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Added,
        },
      ];
    });
    // MCP服务配置组件列表
    setMcpConfigComponentList((list) => {
      const newItem = {
        name: info.name,
        icon: info.icon,
        description: info.description,
        type: info.targetType,
        targetId: info.targetId,
        targetConfig: '',
      };
      return [...list, newItem];
    });
  };

  // 折叠面板列表
  const collapseList: CollapseProps['items'] = MCP_COLLAPSE_COMPONENT_LIST?.map(
    (item) => ({
      key: item.type,
      label: item.label,
      children: (
        <McpCollapseComponentList
          textClassName="px-16"
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
    }),
  );

  return {
    form,
    imageUrl,
    setImageUrl,
    saveLoading,
    setSaveLoading,
    saveDeployLoading,
    setSaveDeployLoading,
    checkTag,
    openAddComponent,
    setOpenAddComponent,
    mcpConfigComponentList,
    setMcpConfigComponentList,
    addComponents,
    setAddComponents,
    collapseActiveKey,
    handleAddComponent,
    handleSave,
    withDeployRef,
    collapseList,
  };
};

export default useMcp;
