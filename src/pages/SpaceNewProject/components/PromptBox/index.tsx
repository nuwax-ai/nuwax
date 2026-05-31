import {
  ArrowRightOutlined,
  CompassOutlined,
  DesktopOutlined,
  DownOutlined,
  PlusOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input, Menu, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
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
      key: 'agent',
      label: '智能体',
      placeholder:
        '描述你想要的智能体，例如：帮我创建一个代码审查助手，能自动检测代码问题并给出优化建议',
    },
    {
      key: 'web',
      label: '网页应用',
      placeholder:
        '描述你想要的网页应用，例如：帮我开发一个颜值管理网站，支持上传照片智能评估颜值与肤质',
    },
    {
      key: 'skill',
      label: '技能',
      placeholder:
        '描述你想要的自定义技能，例如：帮我写一个根据经纬度查询当前天气状况的API接口',
    },
    {
      key: 'workflow',
      label: '工作流',
      placeholder:
        '描述你想要的工作流，例如：每日8点自动收集最新的AI前沿新闻并发送至我的微信群',
    },
    {
      key: 'plugin',
      label: '插件',
      placeholder:
        '描述你想要的插件工具，例如：帮我对接第三方图片转换的HTTP接口插件',
    },
  ];

  const [activeTab, setActiveTab] = useState<string>('agent');
  const [promptText, setPromptText] = useState<string>('');
  const [env, setEnv] = useState<string>('云端电脑');
  const [model, setModel] = useState<string>('Qwen3.6-Plus');

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const handleSend = () => {
    if (!promptText.trim()) {
      message.warning('请输入您的任务描述！');
      return;
    }
    onSubmit(activeTab, promptText);
  };

  const envMenu = (
    <Menu
      onClick={({ key }) => setEnv(key)}
      items={[
        { key: '云端电脑', label: '云端电脑 (推荐)' },
        { key: '本地开发', label: '本地开发环境' },
      ]}
    />
  );

  const modelMenu = (
    <Menu
      onClick={({ key }) => setModel(key)}
      items={[
        { key: 'Qwen3.6-Plus', label: 'Qwen3.6-Plus (默认)' },
        { key: 'DeepSeek-V3', label: 'DeepSeek-V3 (高性能)' },
        { key: 'GPT-4o', label: 'GPT-4o' },
      ]}
    />
  );

  return (
    <div className={cx(styles['prompt-box-card'])}>
      {/* Tabs list */}
      <div className={cx(styles['tabs-list'])}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={cx(styles['tab-item'], {
              [styles['tab-active']]: activeTab === tab.key,
            })}
            onClick={() => {
              setActiveTab(tab.key);
              setPromptText('');
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Input container */}
      <div className={cx(styles['input-area'])}>
        <Input.TextArea
          className={cx(styles['prompt-textarea'])}
          placeholder={currentTab.placeholder}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          bordered={false}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* Toolbar */}
        <div className={cx(styles['toolbar-container'])}>
          {/* Left tools */}
          <div className={cx(styles['left-tools'])}>
            <Button
              className={cx(styles['tool-btn'])}
              type="text"
              icon={<CompassOutlined />}
              title="提示词模板库"
            />
            <Button
              className={cx(styles['tool-btn'])}
              type="text"
              icon={<PlusOutlined />}
              title="添加上下文/附件"
            />
          </div>

          {/* Right settings & send */}
          <div className={cx(styles['right-tools'])}>
            <Dropdown overlay={envMenu} trigger={['click']}>
              <Button className={cx(styles['dropdown-trigger'])} type="text">
                <DesktopOutlined />
                <span>{env}</span>
                <DownOutlined className={cx(styles['caret'])} />
              </Button>
            </Dropdown>

            <div className={cx(styles['divider'])} />

            <Dropdown overlay={modelMenu} trigger={['click']}>
              <Button className={cx(styles['dropdown-trigger'])} type="text">
                <RobotOutlined />
                <span>{model}</span>
                <DownOutlined className={cx(styles['caret'])} />
              </Button>
            </Dropdown>

            <Button
              className={cx(styles['send-btn'], {
                [styles['send-btn-active']]: promptText.trim().length > 0,
              })}
              type="primary"
              shape="circle"
              icon={<ArrowRightOutlined />}
              onClick={handleSend}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBox;
