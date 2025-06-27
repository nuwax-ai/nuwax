import Created from '@/components/Created';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import {
  COMPONENT_SETTING_ACTIONS,
  ENABLE_LIST,
} from '@/constants/space.constants';
import {
  apiAgentComponentAdd,
  apiAgentComponentDelete,
  apiAgentComponentList,
  apiAgentVariables,
} from '@/services/agentConfig';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  BindValueType,
} from '@/types/enums/agent';
import {
  AgentArrangeConfigEnum,
  ComponentSettingEnum,
  OpenCloseEnum,
} from '@/types/enums/space';
import type { AgentComponentInfo } from '@/types/interfaces/agent';
import type { AgentArrangeConfigProps } from '@/types/interfaces/agentConfig';
import type {
  BindConfigWithSub,
  CreatedNodeItem,
} from '@/types/interfaces/common';
import VariableList from './VariableList';
// import { CaretDownOutlined } from '@ant-design/icons';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import { useRequest } from 'ahooks';
import { CollapseProps, message } from 'antd';
import classNames from 'classnames';
import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useModel } from 'umi';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import CreateVariables from './CreateVariables';
// import CreateTrigger from './CreateTrigger';
import styles from './index.less';
import KnowledgeTextList from './KnowledgeTextList';
import LongMemoryContent from './LongMemoryContent';
// import TriggerContent from './TriggerContent';
import CollapseComponentList from '@/components/CollapseComponentList';
import { CREATED_TABS } from '@/constants/common.constants';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import ComponentSettingModal from './ComponentSettingModal';
import OpenRemarksEdit from './OpenRemarksEdit';

const cx = classNames.bind(styles);

/**
 * 智能体编排区域配置
 */
const AgentArrangeConfig: React.FC<AgentArrangeConfigProps> = ({
  agentId,
  agentConfigInfo,
  onChangeAgent,
}) => {
  // const [triggerChecked, setTriggerChecked] = useState<boolean>(false);
  // 触发器弹窗
  // const [openTriggerModel, setOpenTriggerModel] = useState<boolean>(false);
  // 插件弹窗
  const [openPluginModel, setOpenPluginModel] = useState<boolean>(false);
  // 变量弹窗
  const [openVariableModel, setOpenVariableModel] = useState<boolean>(false);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  const [experienceActiveKey, setExperienceActiveKey] = useState<
    AgentArrangeConfigEnum[]
  >([AgentArrangeConfigEnum.Opening_Remarks]);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();

  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');
  const { agentComponentList, setAgentComponentList } = useModel('spaceAgent');
  const { handleVariables } = useModel('conversationInfo');

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      agentComponentList?.filter(
        (item: AgentComponentInfo) => item.type === type,
      ) || []
    );
  };

  // 绑定的变量信息
  const variablesInfo = useMemo(() => {
    return agentComponentList?.find(
      (item: AgentComponentInfo) =>
        item.type === AgentComponentTypeEnum.Variable,
    ) as AgentComponentInfo;
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
    if (isExistComponent(AgentComponentTypeEnum.Trigger)) {
      skill.push(AgentArrangeConfigEnum.Trigger);
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

  const handleAgentComponentDel = async (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
    toolName?: string,
  ) => {
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
  };

  // 异步查询智能体配置组件列表
  const asyncFun = async () => {
    const { data } = await runAsync(agentId);

    setAgentComponentList(data);
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

  // 添加触发器
  // const handlerTriggerPlus = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   setOpenTriggerModel(true);
  // };

  // const handlerSuccessCreateTrigger = () => {
  //   setOpenTriggerModel(false);
  //   // 查询智能体配置组件列表
  //   run(agentId);
  // };

  // 添加变量
  const handlerVariablePlus = (e: MouseEvent) => {
    e.stopPropagation();
    setOpenVariableModel(true);
  };

  // 确定添加、更新变量
  const handleConfirmVariables = async () => {
    setOpenVariableModel(false);
    // 查询智能体配置组件列表
    asyncFun();
    // 查询智能体变量列表
    const { data } = await runVariables(agentId);
    // 处理变量参数
    handleVariables(data);
  };

  // 添加数据库表
  // const handlerDatabasePlus = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   setCheckTag(AgentComponentTypeEnum.Table);
  //   setShow(true);
  // };

  // 添加指令
  // const handlerDirectivePlus = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   console.log('handlerDirectivePlus');
  // };

  // const handlerChangeTrigger = (checked: boolean) => {
  //   setTriggerChecked(checked);
  // };

  // 插件设置
  const handlePluginSet = (id: number) => {
    const componentInfo = agentComponentList?.find(
      (info: AgentComponentInfo) => info.id === id,
    );

    const inputConfigArgs = componentInfo?.bindConfig?.inputArgBindConfigs;
    // 默认值：输入
    const _inputConfigArgs = inputConfigArgs?.map((info: BindConfigWithSub) => {
      if (!info.bindValueType) {
        info.bindValueType = BindValueType.Input;
      }
      return info;
    });
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
          type={AgentComponentTypeEnum.Plugin}
          list={filterList(AgentComponentTypeEnum.Plugin)}
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
    },
    {
      key: AgentArrangeConfigEnum.Workflow,
      label: '工作流',
      children: (
        <CollapseComponentList
          type={AgentComponentTypeEnum.Workflow}
          list={filterList(AgentComponentTypeEnum.Workflow)}
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
    },
    {
      key: AgentArrangeConfigEnum.MCP,
      label: 'MCP',
      children: (
        <CollapseComponentList
          type={AgentComponentTypeEnum.MCP}
          list={filterList(AgentComponentTypeEnum.MCP)}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加MCP"
          onClick={(e) => handlerComponentPlus(e, AgentComponentTypeEnum.MCP)}
        />
      ),
    },
    // {
    //   key: AgentArrangeConfigEnum.Trigger,
    //   label: '触发器',
    //   children: (
    //     <TriggerContent
    //       list={filterList(AgentComponentTypeEnum.Trigger)}
    //       checked={triggerChecked}
    //       onChange={handlerChangeTrigger}
    //       onDel={runAgentComponentDel}
    //     />
    //   ),
    //   extra: <TooltipIcon title="添加触发器" onClick={handlerTriggerPlus} />,
    // },
  ];
  // 知识库
  const KnowledgeList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Text,
      label: '文本',
      children: (
        <KnowledgeTextList
          list={filterList(AgentComponentTypeEnum.Knowledge)}
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
    },
    // {
    //   key: AgentArrangeConfigEnum.Table,
    //   label: '表格',
    //   children: (
    //     <p>
    //       用户上传表格后，支持按照表格的某列来匹配合适的行给智能体引用，同时也支持基于自然语言对数据库进行查询和计算
    //     </p>
    //   ),
    //   extra: <TooltipIcon title="添加知识库" onClick={handlerTablePlus} />,
    // },
  ];
  // 记忆
  const MemoryList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Variable,
      label: '变量',
      children: (
        <VariableList
          list={variablesInfo?.bindConfig?.variables || []}
          onClick={handlerVariablePlus}
        />
      ),
      extra: <TooltipIcon title="添加变量" onClick={handlerVariablePlus} />,
    },
    {
      key: AgentArrangeConfigEnum.Table,
      label: '数据表',
      children: (
        <CollapseComponentList
          type={AgentComponentTypeEnum.Table}
          list={filterList(AgentComponentTypeEnum.Table)}
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
    },
    // {
    //   key: AgentArrangeConfigEnum.Data_Base,
    //   label: '数据库',
    //   children: <p>以表格结构组织数据，可实现类似书签和图书管理等功能。</p>,
    //   extra: <TooltipIcon title="添加表" onClick={handlerDatabasePlus} />,
    // },
    {
      key: AgentArrangeConfigEnum.Long_Memory,
      label: '长期记忆',
      children: (
        <LongMemoryContent openLongMemory={agentConfigInfo?.openLongMemory} />
      ),
      extra: (
        <SelectList
          className={cx(styles.select)}
          size={'small'}
          value={agentConfigInfo?.openLongMemory}
          onChange={(value) =>
            onChangeAgent(value as OpenCloseEnum, 'openLongMemory')
          }
          options={ENABLE_LIST}
        />
      ),
    },
    // {
    //   key: AgentArrangeConfigEnum.File_Box,
    //   label: '文件盒子',
    //   children: (
    //     <p>
    //       现在文件盒已关闭，用户无法保存他们的文件。如果你想使用存储空间，请打开文件盒。
    //     </p>
    //   ),
    //   extra: (
    //     <SelectList
    //       className={styles.select}
    //       size={'small'}
    //       value={agentConfigInfo?.openLongMemory}
    //       onChange={onChangeAgent}
    //       options={ENABLE_LIST}
    //     />
    //   ),
    // },
  ];
  // 对话体验
  const ConversationalExperienceList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Opening_Remarks,
      label: '开场白',
      children: (
        <OpenRemarksEdit
          agentConfigInfo={agentConfigInfo}
          onChangeAgent={onChangeAgent}
        />
      ),
    },
    {
      key: AgentArrangeConfigEnum.User_Problem_Suggestion,
      label: '用户问题建议',
      children: <p>在每次智能体回复后，不会提供任何用户问题建议</p>,
      extra: (
        <SelectList
          className={cx(styles.select)}
          size={'small'}
          value={agentConfigInfo?.openSuggest}
          onChange={(value) =>
            onChangeAgent(value as OpenCloseEnum, 'openSuggest')
          }
          options={ENABLE_LIST}
        />
      ),
    },
    {
      key: AgentArrangeConfigEnum.Open_Scheduled_Task,
      label: '定时任务',
      children: <p>开启后，用户可以通过设置定时任务的方式让智能体执行任务</p>,
      extra: (
        <SelectList
          className={cx(styles.select)}
          size={'small'}
          value={agentConfigInfo?.openScheduledTask || OpenCloseEnum.Close}
          onChange={(value) =>
            onChangeAgent(value as OpenCloseEnum, 'openScheduledTask')
          }
          options={ENABLE_LIST}
        />
      ),
    },
    // {
    //   key: AgentArrangeConfigEnum.Shortcut_Instruction,
    //   label: '快捷指令',
    //   children: (
    //     <p>
    //       快捷指令是对话输入框上方的按钮，配置完成后，用户可以快速发起预设对话
    //     </p>
    //   ),
    //   extra: <TooltipIcon title="添加指令" onClick={handlerDirectivePlus} />,
    // },
  ];

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
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

  const getSettingActionList = useCallback(
    (type: AgentComponentTypeEnum | undefined) => {
      if (type === AgentComponentTypeEnum.MCP) {
        // MCP 不支持方法调用(调用方式)
        return COMPONENT_SETTING_ACTIONS.filter(
          (item) => item.type !== ComponentSettingEnum.Method_Call,
        );
      }
      return COMPONENT_SETTING_ACTIONS;
    },
    [],
  );

  return (
    <div className={classNames('overflow-y', 'flex-1', 'px-16', 'py-12')}>
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
      {/*添加触发器弹窗*/}
      {/*<CreateTrigger*/}
      {/*  agentId={agentId}*/}
      {/*  open={openTriggerModel}*/}
      {/*  title="创建触发器"*/}
      {/*  onCancel={() => setOpenTriggerModel(false)}*/}
      {/*  onConfirm={handlerSuccessCreateTrigger}*/}
      {/*/>*/}
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
        settingActionList={getSettingActionList(currentComponentInfo?.type)}
        onCancel={() => setOpenPluginModel(false)}
      />
    </div>
  );
};

export default AgentArrangeConfig;
