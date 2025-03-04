import Created from '@/components/Created';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import { ENABLE_LIST } from '@/constants/space.contants';
import VariableList from '@/pages/EditAgent/AgentArrangeConfig/VariableList';
import {
  apiAgentComponentAdd,
  apiAgentComponentDelete,
  apiAgentComponentList,
} from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { KnowledgeDataTypeEnum } from '@/types/enums/library';
import {
  AgentConfigMemoryEnum,
  AgentConfigSkillEnum,
  ConversationalExperienceEnum,
  OpenCloseEnum,
} from '@/types/enums/space';
import type { AgentComponentInfo } from '@/types/interfaces/agent';
import type { AgentArrangeConfigProps } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { CaretDownOutlined } from '@ant-design/icons';
import { CollapseProps, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import ConfigOption from './ConfigOptionCollapse';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import CreateTrigger from './CreateTrigger';
import styles from './index.less';
import LongMemoryContent from './LongMemoryContent';
import PluginList from './PluginList';
import TriggerContent from './TriggerContent';
import WorkflowList from './WorkflowList';

const cx = classNames.bind(styles);

/**
 * 智能体编排区域配置
 */
const AgentArrangeConfig: React.FC<AgentArrangeConfigProps> = ({
  spaceId,
  agentId,
  agentConfigInfo,
  onKnowledge,
  onChangeEnable,
  onSet,
}) => {
  const [triggerChecked, setTriggerChecked] = useState<boolean>(false);
  const [openTriggerModel, setOpenTriggerModel] = useState<boolean>(false);
  // 智能体模型组件列表
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );

  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');

  const filterList = (
    list: AgentComponentInfo[],
    type: AgentComponentTypeEnum,
  ) => {
    return list?.filter((item) => item.type === type) || [];
  };

  // 查询智能体配置组件列表
  const { run } = useRequest(apiAgentComponentList, {
    manual: true,
    debounceWait: 300,
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
  const { run: runPluginComponentDel } = useRequest(apiAgentComponentDelete, {
    manual: true,
    debounceWait: 300,
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
    debounceWait: 300,
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

  // 添加插件
  const handlerPluginPlus = (e) => {
    e.stopPropagation();
    setCheckTag(AgentComponentTypeEnum.Plugin);
    setShow(true);
  };

  // 添加工作流
  const handlerWorkflowPlus = (e) => {
    e.stopPropagation();
    setCheckTag(AgentComponentTypeEnum.Workflow);
    setShow(true);
  };

  // 添加触发器
  const handlerTriggerPlus = (e) => {
    e.stopPropagation();
    setOpenTriggerModel(true);
  };

  const handlerSuccessCreateTrigger = () => {
    //todo 成功创建触发器后待完成的动作
    setOpenTriggerModel(false);
  };

  // 添加文本
  const handlerTextPlus = (e) => {
    e.stopPropagation();
    setCheckTag(AgentComponentTypeEnum.Knowledge);
    setShow(true);
  };

  // 添加变量
  const handlerVariablePlus = (e) => {
    e.stopPropagation();
    console.log('handlerVariablePlus');
  };

  // 添加数据库表
  // const handlerDatabasePlus = (e) => {
  //   e.stopPropagation();
  //   setCheckTag(AgentComponentTypeEnum.Database);
  //   setShow(true);
  // };

  // 添加指令
  const handlerDirectivePlus = (e) => {
    e.stopPropagation();
    console.log('handlerDirectivePlus');
  };

  const handlerChangeTrigger = (checked: boolean) => {
    setTriggerChecked(checked);
  };

  const SkillList: CollapseProps['items'] = [
    {
      key: AgentConfigSkillEnum.Plugin,
      label: '插件',
      children: (
        <PluginList
          list={filterList(agentComponentList, AgentComponentTypeEnum.Plugin)}
          onSet={onSet}
          onDel={runPluginComponentDel}
        />
      ),
      extra: <TooltipIcon title="添加插件" onClick={handlerPluginPlus} />,
    },
    {
      key: AgentConfigSkillEnum.Workflow,
      label: '工作流',
      children: (
        <WorkflowList
          list={filterList(agentComponentList, AgentComponentTypeEnum.Workflow)}
          onDel={runPluginComponentDel}
        />
      ),
      extra: <TooltipIcon title="添加工作流" onClick={handlerWorkflowPlus} />,
    },
    {
      key: AgentConfigSkillEnum.Trigger,
      label: '触发器',
      children: (
        <TriggerContent
          list={filterList(agentComponentList, AgentComponentTypeEnum.Trigger)}
          checked={triggerChecked}
          onChange={handlerChangeTrigger}
          onDel={runPluginComponentDel}
        />
      ),
      extra: <TooltipIcon title="添加触发器" onClick={handlerTriggerPlus} />,
    },
  ];

  const KnowledgeList: CollapseProps['items'] = [
    {
      key: KnowledgeDataTypeEnum.Text,
      label: '文本',
      children: (
        <p>
          将文档、URL、三方数据源上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。
        </p>
      ),
      extra: <TooltipIcon title="添加知识库" onClick={handlerTextPlus} />,
    },
    // {
    //   key: KnowledgeDataTypeEnum.Table,
    //   label: '表格',
    //   children: (
    //     <p>
    //       用户上传表格后，支持按照表格的某列来匹配合适的行给智能体引用，同时也支持基于自然语言对数据库进行查询和计算
    //     </p>
    //   ),
    //   extra: <TooltipIcon title="添加知识库" onClick={handlerTablePlus} />,
    // },
  ];

  const MemoryList: CollapseProps['items'] = [
    {
      key: AgentConfigMemoryEnum.Variable,
      label: '变量',
      children: (
        <VariableList
          list={filterList(agentComponentList, AgentComponentTypeEnum.Variable)}
        />
      ),
      extra: <TooltipIcon title="添加变量" onClick={handlerVariablePlus} />,
    },
    // {
    //   key: AgentConfigMemoryEnum.Data_Base,
    //   label: '数据库',
    //   children: <p>以表格结构组织数据，可实现类似书签和图书管理等功能。</p>,
    //   extra: <TooltipIcon title="添加表" onClick={handlerDatabasePlus} />,
    // },
    {
      key: AgentConfigMemoryEnum.Long_Memory,
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
    //   key: AgentConfigMemoryEnum.File_Box,
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

  const ConversationalExperienceList: CollapseProps['items'] = [
    {
      key: ConversationalExperienceEnum.Opening_Remarks,
      label: '开场白',
      children: <p>这里是开场白内容</p>,
    },
    {
      key: ConversationalExperienceEnum.User_Problem_Suggestion,
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
    {
      key: ConversationalExperienceEnum.Shortcut_Instruction,
      label: '快捷指令',
      children: (
        <p>
          快捷指令是对话输入框上方的按钮，配置完成后，用户可以快速发起预设对话
        </p>
      ),
      extra: <TooltipIcon title="添加指令" onClick={handlerDirectivePlus} />,
    },
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
      <ConfigOption items={SkillList} />
      <ConfigOptionsHeader title="知识">
        <span
          className={cx(
            'cursor-pointer',
            'hover-box',
            styles['knowledge-extra'],
          )}
          onClick={onKnowledge}
        >
          按需调用 <CaretDownOutlined />
        </span>
      </ConfigOptionsHeader>
      <ConfigOption items={KnowledgeList} />
      <ConfigOptionsHeader title="记忆" />
      <ConfigOption items={MemoryList} />
      <ConfigOptionsHeader title="对话体验" />
      <ConfigOption items={ConversationalExperienceList} />
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
      <CreateTrigger
        agentId={agentId}
        open={openTriggerModel}
        title="创建触发器"
        onCancel={() => setOpenTriggerModel(false)}
        onConfirm={handlerSuccessCreateTrigger}
      />
    </div>
  );
};

export default AgentArrangeConfig;
