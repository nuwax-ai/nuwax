import ChatInputHome from '@/components/ChatInputHome';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import TabsList from './components/TabsList';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PromptBoxProps {
  onSubmit: (type: string, prompt: string) => void;
}

interface TabItem {
  key: string;
  label: string;
  placeholder: string;
}

const PromptBox: React.FC<PromptBoxProps> = ({ onSubmit }) => {
  const tabs: TabItem[] = [
    {
      key: AgentComponentTypeEnum.Agent,
      label: '智能体',
      placeholder:
        '描述你想要的智能体，例如：帮我创建一个代码审查助手，能自动检测代码问题并给出优化建议',
    },
    {
      key: AgentComponentTypeEnum.PageApp,
      label: '网页应用',
      placeholder:
        '描述你想要的网页应用，例如：帮我开发一个颜值管理网站，支持上传照片智能评估颜值与肤质',
    },
    {
      key: AgentComponentTypeEnum.Skill,
      label: '技能',
      placeholder:
        '描述你想要的自定义技能，例如：帮我写一个根据经纬度查询当前天气状况的API接口',
    },
    {
      key: AgentComponentTypeEnum.Plugin,
      label: '插件',
      placeholder:
        '描述你想要的插件工具，例如：帮我对接第三方图片转换的HTTP接口插件',
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(
    AgentComponentTypeEnum.Agent,
  );
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const handleSend = useCallback(
    (msg: string) => {
      if (!msg?.trim()) {
        message.warning('请输入您的任务描述！');
        return;
      }
      onSubmit(activeTabRef.current, msg);
    },
    [onSubmit],
  );

  return (
    <div className={cx(styles['prompt-box-card'])}>
      <ChatInputHome
        key={currentTab.key}
        onEnter={handleSend}
        placeholder={currentTab.placeholder}
        tabsSlot={
          <TabsList tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        }
      />
    </div>
  );
};

export default PromptBox;
