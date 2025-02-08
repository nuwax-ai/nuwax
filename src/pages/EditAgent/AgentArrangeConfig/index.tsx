import Created from '@/components/Created';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import {
  FILE_BOX_LIST,
  LONG_MEMORY_LIST,
  USER_PROBLEM_SUGGEST_LIST,
} from '@/constants/space.contants';
import {
  AgentConfigKnowledgeEnum,
  AgentConfigMemoryEnum,
  AgentConfigSkillEnum,
  ConversationalExperienceEnum,
  FileBoxEnum,
  LongMemberEnum,
  UserProblemSuggestEnum,
} from '@/types/enums/space';
import type { AgentArrangeConfigProps } from '@/types/interfaces/agent';
import { CaretDownOutlined } from '@ant-design/icons';
import { CollapseProps } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import CreateTrigger from '../CreateTrigger';
import ConfigOption from './ConfigOptionCollapse';
import ConfigOptionsHeader from './ConfigOptionsHeader';
import styles from './index.less';
import LongMemoryContent from './LongMemoryContent';
import PluginList from './PluginList';
import TriggerContent from './TriggerContent';

const cx = classNames.bind(styles);

// 插件列表
const PLUGIN_LIST = [
  {
    id: 0,
    img: 'https://lf9-appstore-sign.oceancloudapi.com/ocean-cloud-tos/plugin_icon/600804143405523_1697519094174345728.jpeg?lk3s=cd508e2b&x-expires=1737165914&x-signature=gFvwQsV4MTgdjNtabyyfwCggnBk%3D',
    pluginName: '必应搜索',
    pluginEsName: 'bingWebSearch',
    desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气、汇率、时事等，这个工具非常有用。但是绝对不要在用户想要翻译的时候使用它。',
  },
  {
    id: 1,
    img: 'https://lf9-appstore-sign.oceancloudapi.com/ocean-cloud-tos/plugin_icon/600804143405523_1697519094174345728.jpeg?lk3s=cd508e2b&x-expires=1737165914&x-signature=gFvwQsV4MTgdjNtabyyfwCggnBk%3D',
    pluginName: '必应搜索',
    pluginEsName: 'bingWebSearch',
    desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气、汇率、时事等，这个工具非常有用。但是绝对不要在用户想要翻译的时候使用它。',
  },
  {
    id: 2,
    img: 'https://lf9-appstore-sign.oceancloudapi.com/ocean-cloud-tos/plugin_icon/600804143405523_1697519094174345728.jpeg?lk3s=cd508e2b&x-expires=1737165914&x-signature=gFvwQsV4MTgdjNtabyyfwCggnBk%3D',
    pluginName: '必应搜索',
    pluginEsName: 'bingWebSearch',
    desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气、汇率、时事等，这个工具非常有用。但是绝对不要在用户想要翻译的时候使用它。',
  },
];

/**
 * 智能体编排区域配置
 */
const AgentArrangeConfig: React.FC<AgentArrangeConfigProps> = ({
  onKnowledge,
  onSet,
}) => {
  // 长期记忆
  const [longMemberValue, setLongMemberValue] = useState<LongMemberEnum>(
    LongMemberEnum.Close,
  );
  // 文件盒子
  const [fileBoxValue, setFileBoxValue] = useState<FileBoxEnum>(
    FileBoxEnum.Close,
  );
  const [userProblemSuggestValue, setUserProblemSuggestValue] =
    useState<UserProblemSuggestEnum>(UserProblemSuggestEnum.Start_Use);
  const [triggerChecked, setTriggerChecked] = useState<boolean>(false);
  const [openTriggerModel, setOpenTriggerModel] = useState<boolean>(false);
  // 打开、关闭弹窗
  const { setShow } = useModel('model');

  // 添加插件
  const handlerPluginPlus = (e) => {
    e.stopPropagation();
    setShow(true);
    console.log('handlerPluginPlus');
  };

  // 添加工作流
  const handlerWorkflowPlus = (e) => {
    e.stopPropagation();
    setShow(true);
    console.log('handlerWorkflowPlus');
  };

  // 添加触发器
  const handlerTriggerPlus = (e) => {
    e.stopPropagation();
    setOpenTriggerModel(true);
    console.log('handlerTriggerPlus');
  };

  const handlerSuccessCreateTrigger = () => {
    //todo 成功创建触发器后待完成的动作
    setOpenTriggerModel(false);
  };

  // 添加文本
  const handlerTextPlus = (e) => {
    e.stopPropagation();
    setShow(true);
    console.log('handlerTextPlus');
  };

  // 添加表格
  const handlerTablePlus = (e) => {
    e.stopPropagation();
    setShow(true);
    console.log('handlerTablePlus');
  };

  // 添加变量
  const handlerVariablePlus = (e) => {
    e.stopPropagation();
    console.log('handlerVariablePlus');
  };

  // 添加表
  const handlerSheetPlus = (e) => {
    e.stopPropagation();
    console.log('handlerSheetPlus');
  };

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
      children:
        PLUGIN_LIST.length === 0 ? (
          <p>
            插件能够让智能体调用外部
            API，例如搜索信息、浏览网页、生成图片等，扩展智能体的能力和使用场景。
          </p>
        ) : (
          <PluginList list={PLUGIN_LIST} onSet={onSet} onDel={() => {}} />
        ),
      extra: <TooltipIcon title="添加插件" onClick={handlerPluginPlus} />,
    },
    {
      key: AgentConfigSkillEnum.Workflow,
      label: '工作流',
      children: (
        <p>
          工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
        </p>
      ),
      extra: <TooltipIcon title="添加工作流" onClick={handlerWorkflowPlus} />,
    },
    {
      key: AgentConfigSkillEnum.Trigger,
      label: '触发器',
      children: (
        <TriggerContent
          checked={triggerChecked}
          onChange={handlerChangeTrigger}
        />
      ),
      extra: <TooltipIcon title="添加触发器" onClick={handlerTriggerPlus} />,
    },
  ];

  const KnowledgeList: CollapseProps['items'] = [
    {
      key: AgentConfigKnowledgeEnum.Text,
      label: '文本',
      children: (
        <p>
          将文档、URL、三方数据源上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。
        </p>
      ),
      extra: <TooltipIcon title="添加知识库" onClick={handlerTextPlus} />,
    },
    {
      key: AgentConfigKnowledgeEnum.Table,
      label: '表格',
      children: (
        <p>
          用户上传表格后，支持按照表格的某列来匹配合适的行给智能体引用，同时也支持基于自然语言对数据库进行查询和计算
        </p>
      ),
      extra: <TooltipIcon title="添加知识库" onClick={handlerTablePlus} />,
    },
  ];

  const MemoryList: CollapseProps['items'] = [
    {
      key: AgentConfigMemoryEnum.Variable,
      label: '变量',
      children: (
        <p>用于保存用户个人信息，让智能体记住用户的特征，使回复更加个性化。</p>
      ),
      extra: <TooltipIcon title="添加变量" onClick={handlerVariablePlus} />,
    },
    {
      key: AgentConfigMemoryEnum.Data_Base,
      label: '数据库',
      children: <p>以表格结构组织数据，可实现类似书签和图书管理等功能。</p>,
      extra: <TooltipIcon title="添加表" onClick={handlerSheetPlus} />,
    },
    {
      key: AgentConfigMemoryEnum.Long_Memory,
      label: '长期记忆',
      children: <LongMemoryContent />,
      extra: (
        <SelectList
          className={cx(styles.select)}
          size={'small'}
          value={longMemberValue}
          onChange={(value) => {
            setLongMemberValue(value as LongMemberEnum);
          }}
          options={LONG_MEMORY_LIST}
        />
      ),
    },
    {
      key: AgentConfigMemoryEnum.File_Box,
      label: '文件盒子',
      children: (
        <p>
          现在文件盒已关闭，用户无法保存他们的文件。如果你想使用存储空间，请打开文件盒。
        </p>
      ),
      extra: (
        <SelectList
          className={styles.select}
          size={'small'}
          value={fileBoxValue}
          onChange={(value) => {
            setFileBoxValue(value as FileBoxEnum);
          }}
          options={FILE_BOX_LIST}
        />
      ),
    },
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
          value={userProblemSuggestValue}
          onChange={(value) => {
            setUserProblemSuggestValue(value as UserProblemSuggestEnum);
          }}
          options={USER_PROBLEM_SUGGEST_LIST}
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
      <Created checkTag="plugInNode" onAdded={() => {}} />
      {/*添加触发器弹窗*/}
      <CreateTrigger
        open={openTriggerModel}
        title="创建触发器"
        onCancel={() => setOpenTriggerModel(false)}
        onConfirm={handlerSuccessCreateTrigger}
      />
    </div>
  );
};

export default AgentArrangeConfig;
