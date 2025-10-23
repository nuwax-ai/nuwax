import CollapseComponentList from '@/components/CollapseComponentList';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { CREATED_TABS } from '@/constants/common.constants';
import { COMPONENT_SETTING_ACTIONS } from '@/constants/space.constants';
import {
  apiAgentComponentAdd,
  apiAgentComponentDelete,
  apiAgentComponentEventUpdate,
  apiAgentComponentList,
  apiAgentVariables,
} from '@/services/agentConfig';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  EventListEnum,
  ExpandPageAreaEnum,
} from '@/types/enums/agent';
import {
  AgentArrangeConfigEnum,
  ComponentSettingEnum,
  OpenCloseEnum,
} from '@/types/enums/space';
import type {
  AgentComponentEventConfig,
  AgentComponentEventUpdateParams,
  AgentComponentInfo,
} from '@/types/interfaces/agent';
import type {
  AgentAddComponentBaseInfo,
  AgentArrangeConfigProps,
  DeleteComponentInfo,
  GroupMcpInfo,
} from '@/types/interfaces/agentConfig';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { PageArgConfig } from '@/types/interfaces/pageDev';
import { loopSetBindValueType } from '@/utils/deepNode';
import { useRequest } from 'ahooks';
import { CollapseProps, message, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useModel } from 'umi';
import ComponentSettingModal from './ComponentSettingModal';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import CreateVariables from './CreateVariables';
import EventBindModal from './EventBindModal';
import EventList from './EventList';
import styles from './index.less';
import KnowledgeTextList from './KnowledgeTextList';
import LongMemoryContent from './LongMemoryContent';
import McpGroupComponentItem from './McpGroupComponentItem';
import OpenRemarksEdit from './OpenRemarksEdit';
import PageSettingModal from './PageSettingModal';
import VariableList from './VariableList';

const cx = classNames.bind(styles);

/**
 * 智能体编排区域配置
 */
const AgentArrangeConfig: React.FC<AgentArrangeConfigProps> = ({
  agentId,
  agentConfigInfo,
  onChangeAgent,
  onConfirmUpdateEventQuestions,
  onInsertSystemPrompt,
}) => {
  // 插件弹窗
  const [openPluginModel, setOpenPluginModel] = useState<boolean>(false);
  // 变量弹窗
  const [openVariableModel, setOpenVariableModel] = useState<boolean>(false);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 对话体验列表
  const [experienceActiveKey, setExperienceActiveKey] = useState<
    AgentArrangeConfigEnum[]
  >([]);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();
  // 正在删除组件列表
  const [deleteList, setDeleteList] = useState<DeleteComponentInfo[]>([]);
  // 打开、关闭组件选择弹窗
  const [show, setShow] = useState<boolean>(false);
  // 打开、关闭事件绑定弹窗
  const [openEventBindModel, setOpenEventBindModel] = useState<boolean>(false);
  // 打开、关闭页面设置弹窗
  const [openPageModel, setOpenPageModel] = useState<boolean>(false);
  // 智能体组件列表
  const { agentComponentList, setAgentComponentList } = useModel('spaceAgent');
  const { handleVariables } = useModel('conversationInfo');
  // 点击的当前事件配置
  const [currentEventConfig, setCurrentEventConfig] =
    useState<AgentComponentEventConfig>();

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      agentComponentList?.filter(
        (item: AgentComponentInfo) => item.type === type,
      ) || []
    );
  };

  // 分组 MCP 列表
  const groupMcpList: GroupMcpInfo[] = useMemo(() => {
    // 过滤出 MCP 类型的组件列表
    const mcpList = filterList(AgentComponentTypeEnum.MCP);

    // 使用 Map 来快速定位分组，减少查找时间复杂度
    const groupMap = new Map<string, GroupMcpInfo>();

    // 遍历列表，构建分组
    mcpList.forEach((item: AgentComponentInfo) => {
      const { targetId, icon, groupName, groupDescription } = item;
      const _targetId = targetId.toString();

      // 如果当前 targetId 对应的分组不存在，则创建新分组
      if (!groupMap.has(_targetId)) {
        groupMap.set(_targetId, {
          targetId,
          icon,
          groupName,
          groupDescription,
          children: [],
        });
      }

      // 获取对应的分组，并将当前项添加到分组的 children 中
      const group = groupMap.get(_targetId)!;
      group.children.push(item);
    });

    // 将 Map 中的分组转换为数组并返回
    return Array.from(groupMap.values());
  }, [agentComponentList]);

  // 绑定的变量信息
  const variablesInfo = useMemo(() => {
    return agentComponentList?.find(
      (item: AgentComponentInfo) =>
        item.type === AgentComponentTypeEnum.Variable,
    );
  }, [agentComponentList]);

  // 绑定的事件信息
  const eventsInfo = useMemo(() => {
    return agentComponentList?.find(
      (item: AgentComponentInfo) => item.type === AgentComponentTypeEnum.Event,
    );
  }, [agentComponentList]);

  // 所有页面组件列表
  const allPageComponentList = useMemo(() => {
    return (
      agentComponentList?.filter(
        (info: AgentComponentInfo) => info.type === AgentComponentTypeEnum.Page,
      ) || []
    );
  }, [agentComponentList]);

  // 绑定的页面参数配置信息
  const pageArgConfigs: PageArgConfig[] = useMemo(() => {
    const pageComponents =
      agentComponentList?.filter(
        (item: AgentComponentInfo) => item.type === AgentComponentTypeEnum.Page,
      ) || [];

    const _pageArgConfigs: PageArgConfig[] = [];
    pageComponents.forEach((item: AgentComponentInfo) => {
      _pageArgConfigs.push(...(item.bindConfig?.pageArgConfigs || []));
    });

    return _pageArgConfigs;
  }, [agentComponentList]);

  // 是否存在组件
  const isExistComponent = (type: AgentComponentTypeEnum) => {
    return agentComponentList?.some(
      (item: AgentComponentInfo) => item.type === type,
    );
  };

  // 技能列表 - 当前激活 tab 面板的 key
  const skillActiveKey = useMemo(() => {
    const skill: AgentArrangeConfigEnum[] = [];
    if (isExistComponent(AgentComponentTypeEnum.Plugin)) {
      skill.push(AgentArrangeConfigEnum.Plugin);
    }
    if (isExistComponent(AgentComponentTypeEnum.Workflow)) {
      skill.push(AgentArrangeConfigEnum.Workflow);
    }
    if (isExistComponent(AgentComponentTypeEnum.MCP)) {
      skill.push(AgentArrangeConfigEnum.MCP);
    }
    return skill;
  }, [agentComponentList]);

  // 知识 - 当前激活 tab 面板的 key
  const knowledgeActiveKey = useMemo(() => {
    if (isExistComponent(AgentComponentTypeEnum.Knowledge)) {
      return [AgentArrangeConfigEnum.Text];
    }
    return [];
  }, [agentComponentList]);

  // 记忆 - 当前激活 tab 面板的 key
  const memoryActiveKey = useMemo(() => {
    const keyList: AgentArrangeConfigEnum[] = [];
    if (isExistComponent(AgentComponentTypeEnum.Variable)) {
      keyList.push(AgentArrangeConfigEnum.Variable);
    }
    if (isExistComponent(AgentComponentTypeEnum.Table)) {
      keyList.push(AgentArrangeConfigEnum.Table);
    }

    return keyList;
  }, [agentComponentList]);

  // 界面配置列表 - 当前激活 tab 面板的 key
  const pageActiveKey = useMemo(() => {
    const keyList: AgentArrangeConfigEnum[] = [];
    // 页面
    if (isExistComponent(AgentComponentTypeEnum.Page)) {
      keyList.push(AgentArrangeConfigEnum.Page);
    }

    // 事件绑定
    if (isExistComponent(AgentComponentTypeEnum.Event)) {
      keyList.push(AgentArrangeConfigEnum.Page_Event_Binding);
    }

    // 开场白
    keyList.push(AgentArrangeConfigEnum.Opening_Remarks);
    return keyList;
  }, [agentComponentList]);

  // 查询智能体配置组件列表
  const { runAsync } = useRequest(apiAgentComponentList, {
    manual: true,
    debounceWait: 300,
  });

  // 删除智能体组件配置
  const { runAsync: runAgentComponentDel } = useRequest(
    apiAgentComponentDelete,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 查询智能体变量列表
  const { runAsync: runVariables } = useRequest(apiAgentVariables, {
    manual: true,
    debounceWait: 300,
  });

  // 删除智能体组件配置
  const handleAgentComponentDel = async (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
    toolName?: string,
  ) => {
    // 添加到正在删除列表
    const newDeleteList = [...deleteList, { id, targetId, type }];
    setDeleteList(newDeleteList);
    await runAgentComponentDel(id);
    message.success('已成功删除');
    const list =
      agentComponentList?.filter(
        (item: AgentComponentInfo) =>
          !(
            item.id === id &&
            item.type === type &&
            (item.bindConfig?.toolName || '') === (toolName || '')
          ),
      ) || [];
    setAgentComponentList(list);
    const newList =
      addComponents?.filter(
        (item) =>
          !(
            item.targetId === targetId &&
            item.type === type &&
            (item.toolName || '') === (toolName || '')
          ),
      ) || [];
    setAddComponents(newList);
    // 从正在删除列表中删除
    const _newDeleteList = deleteList.filter(
      (item) =>
        item.id !== id && item.targetId !== targetId && item.type !== type,
    );
    setDeleteList(_newDeleteList);

    // 删除最后一条页面组件配置时，删除页面路径配置
    if (
      type === AgentComponentTypeEnum.Page &&
      allPageComponentList?.length === 1
    ) {
      if (agentConfigInfo?.expandPageArea === ExpandPageAreaEnum.Yes) {
        onChangeAgent(ExpandPageAreaEnum.No, 'expandPageArea');
      }
    }
  };

  /**
   * 异步查询智能体配置组件列表
   * @param isOnlyQuery 如果为true，则只查询组件列表，不查询添加组件列表，默认为false
   */
  const asyncFun = async (isOnlyQuery: boolean = false) => {
    const { data } = await runAsync(agentId);

    setAgentComponentList(data);
    // 是否更新添加组件列表
    if (!isOnlyQuery) {
      const list =
        data?.map((item) => {
          const toolName =
            item.type === AgentComponentTypeEnum.MCP
              ? item.bindConfig?.toolName
              : '';
          return {
            type: item.type,
            targetId: item.targetId,
            status: AgentAddComponentStatusEnum.Added,
            toolName,
          };
        }) || [];
      setAddComponents(list);
    }
  };

  // 新增智能体插件、工作流、知识库组件配置
  const { run: runComponentAdd } = useRequest(apiAgentComponentAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: async () => {
      message.success('已成功添加');
      // 重新查询智能体配置组件列表
      await asyncFun();
    },
    onError: (_, params) => {
      // 从组件列表中删除正在loading状态的组件
      const { targetId, type } = params[0];
      setAddComponents((list) => {
        return list.filter(
          (item) => item.type === type && item.targetId !== targetId,
        );
      });
    },
  });

  useEffect(() => {
    asyncFun();
  }, [agentId]);

  // 添加插件、工作流、知识库、MCP等
  const handlerComponentPlus = (
    e: React.MouseEvent<HTMLElement>,
    type: AgentComponentTypeEnum,
  ) => {
    e.stopPropagation();
    setCheckTag(type);
    setShow(true);
  };

  // 添加变量
  const handlerVariablePlus = (e: MouseEvent) => {
    e.stopPropagation();
    setOpenVariableModel(true);
  };

  // 确定添加、更新变量
  const handleConfirmVariables = async () => {
    setOpenVariableModel(false);
    // 查询智能体配置组件列表
    asyncFun(true);
    // 查询智能体变量列表
    const { data } = await runVariables(agentId);
    // 处理变量参数
    handleVariables(data);
  };

  // 插件、工作流、MCP、数据表设置
  const handlePluginSet = (id: number) => {
    const componentInfo = agentComponentList?.find(
      (info: AgentComponentInfo) => info.id === id,
    );

    const inputConfigArgs = componentInfo?.bindConfig?.inputArgBindConfigs;
    // 使用递归函数设置默认值：输入，并处理嵌套的子配置
    const _inputConfigArgs = loopSetBindValueType(inputConfigArgs || []);
    if (componentInfo && componentInfo.bindConfig) {
      componentInfo.bindConfig.inputArgBindConfigs = _inputConfigArgs;
    }
    // 工作流组件，去掉属性配置（argBindConfigs属性是之前的，目前改为inputArgBindConfigs）
    if (componentInfo?.type === AgentComponentTypeEnum.Workflow) {
      componentInfo.bindConfig.argBindConfigs = null;
    }
    setCurrentComponentInfo(componentInfo);
    setOpenPluginModel(true);
  };

  // 技能列表
  const SkillList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Plugin,
      label: '插件',
      children: (
        <CollapseComponentList
          textClassName={cx(styles.text)}
          type={AgentComponentTypeEnum.Plugin}
          list={filterList(AgentComponentTypeEnum.Plugin)}
          deleteList={deleteList}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加插件"
          onClick={(e) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Plugin)
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Workflow,
      label: '工作流',
      children: (
        <CollapseComponentList
          textClassName={cx(styles.text)}
          type={AgentComponentTypeEnum.Workflow}
          list={filterList(AgentComponentTypeEnum.Workflow)}
          deleteList={deleteList}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加工作流"
          onClick={(e) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Workflow)
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.MCP,
      label: 'MCP',
      children: !groupMcpList?.length ? (
        <p className={cx(styles.text)}>
          智能体可以通过标准化协议（MCP）连接各类服务API并发起调用。
        </p>
      ) : (
        groupMcpList.map((item: GroupMcpInfo) => (
          <McpGroupComponentItem
            item={item}
            key={item.targetId}
            deleteList={deleteList}
            onSet={handlePluginSet}
            onDel={handleAgentComponentDel}
          />
        ))
      ),
      extra: (
        <TooltipIcon
          title="添加MCP"
          onClick={(e) => handlerComponentPlus(e, AgentComponentTypeEnum.MCP)}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
  ];

  // 知识库
  const KnowledgeList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Text,
      label: '文本',
      children: (
        <KnowledgeTextList
          textClassName={cx(styles.text)}
          list={filterList(AgentComponentTypeEnum.Knowledge)}
          deleteList={deleteList}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加知识库"
          onClick={(e) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Knowledge)
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
  ];

  // 记忆
  const MemoryList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Variable,
      label: '变量',
      children: (
        <VariableList
          textClassName={cx(styles.text)}
          list={variablesInfo?.bindConfig?.variables || []}
          onClick={handlerVariablePlus}
        />
      ),
      extra: <TooltipIcon title="添加变量" onClick={handlerVariablePlus} />,
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Table,
      label: '数据表',
      children: (
        <CollapseComponentList
          textClassName={cx(styles.text)}
          type={AgentComponentTypeEnum.Table}
          list={filterList(AgentComponentTypeEnum.Table)}
          deleteList={deleteList}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加数据表"
          onClick={(e) => handlerComponentPlus(e, AgentComponentTypeEnum.Table)}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Long_Memory,
      label: '长期记忆',
      children: (
        <LongMemoryContent
          textClassName={cx(styles.text)}
          openLongMemory={agentConfigInfo?.openLongMemory}
        />
      ),
      extra: (
        <Switch
          // 阻止冒泡事件
          value={agentConfigInfo?.openLongMemory === OpenCloseEnum.Open}
          onClick={(_, e: any) => {
            e.stopPropagation();
          }}
          onChange={(value) =>
            onChangeAgent(
              value
                ? OpenCloseEnum.Open
                : (OpenCloseEnum.Close as OpenCloseEnum),
              'openLongMemory',
            )
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
  ];

  // 对话体验
  const ConversationalExperienceList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.User_Problem_Suggestion,
      label: '用户问题建议',
      children: (
        <p className={cx(styles.text)}>
          {agentConfigInfo?.openSuggest === OpenCloseEnum.Open
            ? '在智能体回复后，根据 Prompt 提供多条用户提问建议'
            : '在每次智能体回复后，不会提供任何用户问题建议'}
        </p>
      ),
      extra: (
        <Switch
          // 阻止冒泡事件
          value={agentConfigInfo?.openSuggest === OpenCloseEnum.Open}
          onClick={(_, e: any) => {
            e.stopPropagation();
          }}
          onChange={(value) =>
            onChangeAgent(
              value ? OpenCloseEnum.Open : OpenCloseEnum.Close,
              'openSuggest',
            )
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Open_Scheduled_Task,
      label: '定时任务',
      children: (
        <p className={cx(styles.text)}>
          开启后，用户可以通过设置定时任务的方式让智能体执行任务
        </p>
      ),
      extra: (
        <Switch
          value={agentConfigInfo?.openScheduledTask === OpenCloseEnum.Open}
          // 阻止冒泡事件
          onClick={(_, e: any) => {
            e.stopPropagation();
          }}
          onChange={(value) =>
            onChangeAgent(
              value ? OpenCloseEnum.Open : OpenCloseEnum.Close,
              'openScheduledTask',
            )
          }
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
  ];

  // 界面配置 - 设置
  const handlePageSet = (id: number) => {
    const componentInfo = agentComponentList?.find(
      (info: AgentComponentInfo) => info.id === id,
    );
    setCurrentComponentInfo(componentInfo);
    setOpenPageModel(true);
  };

  // 添加事件绑定
  const handleAddEventBinding = (item?: AgentComponentEventConfig) => {
    setOpenEventBindModel(true);
    setCurrentEventConfig(item);
  };

  // 更新事件绑定配置
  const { runAsync: runEventUpdate } = useRequest(
    apiAgentComponentEventUpdate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 删除事件绑定
  const handleDeletEventBinding = async (index: number) => {
    const newEventConfigs = cloneDeep(eventsInfo?.bindConfig?.eventConfigs);
    newEventConfigs?.splice(index, 1);
    // 更新事件绑定信息
    const newEventsInfo = {
      id: eventsInfo?.id,
      bindConfig: {
        eventConfigs: newEventConfigs,
      },
    } as AgentComponentEventUpdateParams;
    await runEventUpdate(newEventsInfo);
    message.success('删除成功');
    // 重新查询智能体配置组件列表
    asyncFun(true);
  };

  /**
   * 点击事件绑定项
   * @param item 点击事件绑定项
   * @param action 操作事件类型
   * @param index 事件绑定项索引
   */
  const handleClickEventBindingItem = (
    item: AgentComponentEventConfig,
    action: EventListEnum,
    index: number,
  ) => {
    switch (action) {
      // 编辑
      case EventListEnum.Edit:
        handleAddEventBinding(item);
        break;
      // 插入到系统提示词
      case EventListEnum.InsertSystemPrompt:
        if (onInsertSystemPrompt) {
          // 格式化事件配置信息
          const eventText = `返回内容后面追加引用信息如下\n'<div class="event" event-type="${
            item.identification
          }" data="动态JSON参数">[#引用编号]</div>'\n
${item.identification}的动态JSON参数JsonSchema如下\n
  \`\`\`\n'
  ${
    item.argJsonSchema
      ? JSON.stringify(JSON.parse(item.argJsonSchema), null, 2)
      : '{\n "type": "object", "properties": {}, "required": []\n}'
  }
  \`\`\``;
          onInsertSystemPrompt(eventText);
          message.success('已插入到系统提示词');
        } else {
          message.warning('插入系统提示词功能不可用');
        }
        break;
      // 删除
      case EventListEnum.Delete:
        handleDeletEventBinding(index);
        break;
    }
  };

  // 界面配置列表
  const PageConfigList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Opening_Remarks,
      label: '开场白',
      children: (
        <OpenRemarksEdit
          agentConfigInfo={agentConfigInfo}
          pageArgConfigs={pageArgConfigs}
          onChangeAgent={onChangeAgent}
          onConfirmUpdateEventQuestions={onConfirmUpdateEventQuestions}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Page,
      label: '页面',
      children: (
        <CollapseComponentList
          textClassName={cx(styles.text)}
          type={AgentComponentTypeEnum.Page}
          list={allPageComponentList}
          deleteList={deleteList}
          onSet={handlePageSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加页面"
          onClick={(e) => handlerComponentPlus(e, AgentComponentTypeEnum.Page)}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Default_Expand_Page_Area,
      label: '展开页面区',
      children: (
        // 默认展开页面区”，当选中时，用户进入智能体详情或会话时为左右分栏，左边是对话框，右边是页面
        <p className={cx(styles.text)}>
          当给智能体绑定了页面后，打开该配置项时，会在智能体对话框旁边默认展开页面
        </p>
      ),
      extra: (
        <Tooltip title={!allPageComponentList?.length ? '请先添加页面' : ''}>
          <Switch
            disabled={!allPageComponentList?.length}
            value={agentConfigInfo?.expandPageArea === ExpandPageAreaEnum.Yes}
            // 阻止冒泡事件
            onClick={(_, e: any) => {
              e.stopPropagation();
            }}
            onChange={(value: boolean) =>
              onChangeAgent(
                value ? ExpandPageAreaEnum.Yes : ExpandPageAreaEnum.No,
                'expandPageArea',
              )
            }
          />
        </Tooltip>
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
    {
      key: AgentArrangeConfigEnum.Page_Event_Binding,
      label: '事件绑定',
      children: (
        // 事件绑定列表
        <EventList
          textClassName={cx(styles.text)}
          list={eventsInfo?.bindConfig?.eventConfigs || []}
          onClick={handleClickEventBindingItem}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加事件绑定"
          onClick={(e) => {
            e.stopPropagation();
            handleAddEventBinding();
          }}
        />
      ),
      classNames: {
        header: 'collapse-header',
        body: 'collapse-body',
      },
    },
  ];

  // 添加插件、工作流、知识库、数据库、MCP、页面
  const handleAddComponent = (info: AgentAddComponentBaseInfo) => {
    setAddComponents((list) => {
      return [
        ...list,
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Loading,
          toolName: info.toolName || '',
        },
      ];
    });
    runComponentAdd({
      agentId,
      type: info.targetType,
      targetId: info.targetId,
      toolName: info.toolName || '',
    });
  };

  const getSettingActionList = useCallback((type?: AgentComponentTypeEnum) => {
    if (type === AgentComponentTypeEnum.MCP) {
      // MCP 不支持方法调用(调用方式)、异步运行、卡片绑定
      return COMPONENT_SETTING_ACTIONS.filter(
        (item) =>
          ![
            ComponentSettingEnum.Method_Call,
            ComponentSettingEnum.Async_Run,
            ComponentSettingEnum.Card_Bind,
          ].includes(item.type),
      );
    }
    return COMPONENT_SETTING_ACTIONS;
  }, []);

  // 确认事件绑定
  const handleConfirmEventBinding = () => {
    setOpenEventBindModel(false);
    // 重新查询智能体配置组件列表
    asyncFun(true);
  };

  // 取消页面设置弹窗
  const handleCancelPageModel = () => {
    setOpenPageModel(false);
    // 重新查询智能体配置组件列表
    asyncFun(true);
  };

  return (
    <div className={classNames('overflow-y', 'flex-1', styles.container)}>
      <ConfigOptionsHeader title="技能" />
      <ConfigOptionCollapse
        items={SkillList}
        defaultActiveKey={skillActiveKey}
      />
      <ConfigOptionsHeader title="知识" />
      <ConfigOptionCollapse
        items={KnowledgeList}
        defaultActiveKey={knowledgeActiveKey}
      />
      <ConfigOptionsHeader title="记忆" />
      <ConfigOptionCollapse
        items={MemoryList}
        defaultActiveKey={memoryActiveKey}
      />
      <ConfigOptionsHeader title="对话体验" />
      <ConfigOptionCollapse
        items={ConversationalExperienceList}
        onChangeCollapse={setExperienceActiveKey}
        defaultActiveKey={experienceActiveKey}
      />
      <ConfigOptionsHeader title="界面配置" />
      <ConfigOptionCollapse
        items={PageConfigList}
        defaultActiveKey={pageActiveKey}
      />
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={show}
        onCancel={() => setShow(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
        tabs={CREATED_TABS.filter(
          (item) => item.key !== AgentComponentTypeEnum.Agent,
        )}
      />
      {/*创建变量弹窗*/}
      <CreateVariables
        open={openVariableModel}
        variablesInfo={variablesInfo}
        onCancel={() => setOpenVariableModel(false)}
        onConfirm={handleConfirmVariables}
      />
      {/*组件设置弹窗*/}
      <ComponentSettingModal
        open={openPluginModel}
        variables={variablesInfo?.bindConfig?.variables || []}
        currentComponentInfo={currentComponentInfo}
        devConversationId={agentConfigInfo?.devConversationId}
        settingActionList={getSettingActionList(currentComponentInfo?.type)}
        onCancel={() => setOpenPluginModel(false)}
      />
      {/*事件绑定弹窗*/}
      <EventBindModal
        open={openEventBindModel}
        // 事件绑定 - 更新 这里是当前事件配置
        eventsInfo={eventsInfo}
        currentEventConfig={currentEventConfig}
        pageArgConfigs={pageArgConfigs}
        onCancel={() => setOpenEventBindModel(false)}
        onConfirm={handleConfirmEventBinding}
      />
      {/*页面设置弹窗*/}
      <PageSettingModal
        open={openPageModel}
        currentComponentInfo={currentComponentInfo}
        allPageComponentList={allPageComponentList}
        onCancel={handleCancelPageModel}
      />
    </div>
  );
};

export default AgentArrangeConfig;
