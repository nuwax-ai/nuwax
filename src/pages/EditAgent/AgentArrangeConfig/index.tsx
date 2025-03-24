import Created from '@/components/Created';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import { ENABLE_LIST } from '@/constants/space.constants';
import {
  apiAgentComponentAdd,
  apiAgentComponentDelete,
  apiAgentComponentList,
} from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentArrangeConfigEnum, OpenCloseEnum } from '@/types/enums/space';
import type { AgentComponentInfo } from '@/types/interfaces/agent';
import type { AgentArrangeConfigProps } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import VariableList from './VariableList';
// import { CaretDownOutlined } from '@ant-design/icons';
import { CollapseProps, message } from 'antd';
import classNames from 'classnames';
import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import ConfigOptionCollapse from './ConfigOptionCollapse';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import CreateVariables from './CreateVariables';
// import CreateTrigger from './CreateTrigger';
import styles from './index.less';
import KnowledgeTextList from './KnowledgeList';
import LongMemoryContent from './LongMemoryContent';
import PluginList from './PluginList';
// import TriggerContent from './TriggerContent';
import OpenRemarksEdit from './OpenRemarksEdit';
import WorkflowList from './WorkflowList';

const cx = classNames.bind(styles);

/**
 * 智能体编排区域配置
 */
const AgentArrangeConfig: React.FC<AgentArrangeConfigProps> = ({
  spaceId,
  agentId,
  agentConfigInfo,
  onChangeEnable,
  onSet,
}) => {
  // const [triggerChecked, setTriggerChecked] = useState<boolean>(false);
  // 触发器弹窗
  // const [openTriggerModel, setOpenTriggerModel] = useState<boolean>(false);
  // 变量弹窗
  const [openVariableModel, setOpenVariableModel] = useState<boolean>(false);
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );

  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return agentComponentList?.filter((item) => item.type === type) || [];
  };

  // 绑定的变量信息
  const variablesInfo = useMemo(() => {
    return agentComponentList?.find(
      (item) => item.type === AgentComponentTypeEnum.Variable,
    ) as AgentComponentInfo;
  }, [agentComponentList]);

  // 技能列表 - 当前激活 tab 面板的 key
  const skillActiveKey = useMemo(() => {
    const skill: AgentArrangeConfigEnum[] = [];
    for (let i = 0; i < agentComponentList.length; i++) {
      if (agentComponentList[i].type === AgentComponentTypeEnum.Plugin) {
        if (!skill.includes(AgentArrangeConfigEnum.Plugin)) {
          skill.push(AgentArrangeConfigEnum.Plugin);
        }
        continue;
      }
      if (agentComponentList[i].type === AgentComponentTypeEnum.Workflow) {
        if (!skill.includes(AgentArrangeConfigEnum.Workflow)) {
          skill.push(AgentArrangeConfigEnum.Workflow);
        }
        continue;
      }
      if (agentComponentList[i].type === AgentComponentTypeEnum.Trigger) {
        if (!skill.includes(AgentArrangeConfigEnum.Trigger)) {
          skill.push(AgentArrangeConfigEnum.Trigger);
        }
      }
    }
    return skill;
  }, [agentComponentList]);

  // 知识 - 当前激活 tab 面板的 key
  const knowledgeActiveKey = useMemo(() => {
    const index = agentComponentList?.findIndex(
      (item) => item.type === AgentComponentTypeEnum.Knowledge,
    );
    return index > -1 ? [AgentArrangeConfigEnum.Text] : [];
  }, [agentComponentList]);

  // 记忆 - 当前激活 tab 面板的 key
  const memoryActiveKey = useMemo(() => {
    const index = agentComponentList?.findIndex(
      (item) => item.type === AgentComponentTypeEnum.Variable,
    );
    return index > -1 ? [AgentArrangeConfigEnum.Variable] : [];
  }, [agentComponentList]);

  // 查询智能体配置组件列表
  const { run } = useRequest(apiAgentComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentComponentInfo[]) => {
      setAgentComponentList(result);
    },
  });

  // 已选中的智能体组件id
  const checkedIds = useMemo(() => {
    return (
      agentComponentList
        ?.filter((item) => item.type === checkTag)
        ?.map((item) => item.targetId) || []
    );
  }, [agentComponentList, checkTag]);

  // 删除智能体组件配置
  const { run: runAgentComponentDel } = useRequest(apiAgentComponentDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      message.success('已成功删除插件');
      const id = params[0];
      const list = agentComponentList.filter((item) => item.id !== id);
      setAgentComponentList(list);
    },
  });

  // 新增智能体插件、工作流、知识库组件配置
  const { run: runComponentAdd } = useRequest(apiAgentComponentAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      setShow(false);
      message.success('已成功添加');
      // 查询智能体配置组件列表
      run(agentId);
    },
  });

  useEffect(() => {
    if (agentId) {
      run(agentId);
    }
  }, [agentId]);

  // 添加插件、工作流、知识库等
  const handlerComponentPlus = (
    e: MouseEvent,
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
  const handleConfirmVariables = () => {
    setOpenVariableModel(false);
    // 查询智能体配置组件列表
    run(agentId);
  };

  // 添加数据库表
  // const handlerDatabasePlus = (e: MouseEvent) => {
  //   e.stopPropagation();
  //   setCheckTag(AgentComponentTypeEnum.Database);
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

  // 技能列表
  const SkillList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Plugin,
      label: '插件',
      children: (
        <PluginList
          list={filterList(AgentComponentTypeEnum.Plugin)}
          onSet={onSet}
          onDel={runAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加插件"
          onClick={(e: MouseEvent) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Plugin)
          }
        />
      ),
    },
    {
      key: AgentArrangeConfigEnum.Workflow,
      label: '工作流',
      children: (
        <WorkflowList
          list={filterList(AgentComponentTypeEnum.Workflow)}
          onDel={runAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加工作流"
          onClick={(e: MouseEvent) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Workflow)
          }
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

  const KnowledgeList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Text,
      label: '文本',
      children: (
        <KnowledgeTextList
          list={filterList(AgentComponentTypeEnum.Knowledge)}
          onDel={runAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加知识库"
          onClick={(e: MouseEvent) =>
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
            onChangeEnable(value as OpenCloseEnum, 'openLongMemory')
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
    //       onChange={onChangeEnable}
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
      children: <OpenRemarksEdit agentConfigInfo={agentConfigInfo} />,
    },
    {
      key: AgentArrangeConfigEnum.User_Problem_Suggestion,
      label: '用户问题建议',
      children: <p>在每次智能体回复后，不会提供任何用户问题建议</p>,
      extra: (
        <SelectList
          className={styles.select}
          size={'small'}
          value={agentConfigInfo?.openSuggest}
          onChange={(value) =>
            onChangeEnable(value as OpenCloseEnum, 'openSuggest')
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
    runComponentAdd({
      agentId,
      type: info.targetType,
      targetId: info.targetId,
    });
  };

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
        defaultActiveKey={[AgentArrangeConfigEnum.Opening_Remarks]}
      />
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={show}
        onCancel={() => setShow(false)}
        spaceId={spaceId}
        checkTag={checkTag}
        hasIds={checkedIds}
        onAdded={handleAddComponent}
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
    </div>
  );
};

export default AgentArrangeConfig;
