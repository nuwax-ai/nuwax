import { dict } from '@/services/i18nRuntime';
import {
  AppstoreOutlined,
  CloudOutlined,
  FileProtectOutlined,
  MailOutlined,
  MessageOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  ScanOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Segmented } from 'antd';
import React, { useState } from 'react';
import SubscribedAgents from './components/SubscribedAgents';
import SubscribedCredits from './components/SubscribedCredits';
import SubscribedSkills from './components/SubscribedSkills';
import styles from './index.less';

const TAB_KEYS = {
  agents: 'agents',
  skills: 'skills',
  credits: 'credits',
} as const;

// Mock 增强数据
const MOCK_AGENTS = [
  {
    id: 1,
    name: '智能文档摘要',
    provider: 'AI Labs · 文本处理',
    price: 19.9,
    expireAt: '2026-05-28',
    status: 'active' as const,
    iconColor: '#3b82f6',
    icon: <CloudOutlined />,
  },
  {
    id: 2,
    name: 'AI绘画助手',
    provider: 'CreativeAI · 图像处理',
    price: 29.9,
    expireAt: '2026-06-15',
    status: 'active' as const,
    iconColor: '#8b5cf6',
    icon: <PictureOutlined />,
  },
  {
    id: 3,
    name: '智能客服对话',
    provider: 'ChatBot · 对话生成',
    price: 9.9,
    expireAt: '2026-04-30',
    status: 'expired' as const,
    iconColor: '#ec4899',
    icon: <MessageOutlined />,
  },
  {
    id: 4,
    name: '合同审查助手',
    provider: 'LegalAI · 法律合规',
    price: 39.9,
    expireAt: '2026-07-01',
    status: 'active' as const,
    iconColor: '#10b981',
    icon: <FileProtectOutlined />,
  },
  {
    id: 5,
    name: '数据可视化生成',
    provider: 'DataViz · 数据分析',
    price: 14.9,
    expireAt: '2026-05-10',
    status: 'active' as const,
    iconColor: '#f59e0b',
    icon: <AppstoreOutlined />,
  },
  {
    id: 6,
    name: '邮件智能撰写',
    provider: 'MailGen · 办公效率',
    price: 24.9,
    expireAt: '2026-08-20',
    status: 'active' as const,
    iconColor: '#06b6d4',
    icon: <MailOutlined />,
  },
];

const MOCK_SKILLS = [
  {
    id: 1,
    name: '语音合成',
    provider: 'TTS · 音视频',
    buyout: true,
    buyoutPrice: 199,
    status: 'active' as const,
    themeColor: '#8b5cf6',
    icon: <PlayCircleOutlined />,
  },
  {
    id: 2,
    name: '图像识别',
    provider: 'CV · 视觉',
    buyout: true,
    buyoutPrice: 149,
    status: 'active' as const,
    themeColor: '#f59e0b',
    icon: <ScanOutlined />,
  },
  {
    id: 3,
    name: '翻译服务',
    provider: 'NLP · 多语言',
    buyout: false,
    price: 29.9,
    expireAt: '2026-06-15',
    status: 'active' as const,
    themeColor: '#06b6d4',
    icon: <TranslationOutlined />,
  },
  {
    id: 4,
    name: '数据采集',
    provider: 'Scraper · 数据',
    buyout: false,
    price: 19.9,
    expireAt: '2026-05-10',
    status: 'active' as const,
    themeColor: '#ec4899',
    icon: <MessageOutlined />,
  },
  {
    id: 5,
    name: 'PDF处理',
    provider: 'DocAI · 办公',
    buyout: false,
    price: 9.9,
    expireAt: '2026-04-20',
    status: 'expired' as const,
    themeColor: '#6366f1',
    icon: <FileProtectOutlined />,
  },
];

const MOCK_CREDITS = [
  {
    id: 1,
    name: '积分包C',
    purchaseDate: '2025-08-20',
    totalCredits: 5000,
    consumed: 2100,
    expireAt: '2026-08-20',
    amount: 499,
    remaining: 2900,
    status: 'normal' as const,
    themeColor: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
  },
  {
    id: 2,
    name: '积分包B',
    purchaseDate: '2025-06-10',
    totalCredits: 2000,
    consumed: 1850,
    expireAt: '2026-06-10',
    amount: 199,
    remaining: 150,
    status: 'low' as const,
    themeColor: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
  },
  {
    id: 3,
    name: '积分包A',
    purchaseDate: '2025-03-05',
    totalCredits: 1000,
    consumed: 1000,
    expireAt: '2026-03-05',
    amount: 99,
    remaining: 0,
    status: 'empty' as const,
    themeColor: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
  },
];

const SubscribedContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.agents);

  return (
    <div className={styles['subscribed-section']}>
      <div className={styles['subscribed-title']}>
        {dict('PC.Pages.MorePage.MySubscriptions.subscribedContent')}
      </div>

      <div className={styles['tabs-container']}>
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as string)}
          options={[
            {
              value: TAB_KEYS.agents,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabAgents'),
            },
            {
              value: TAB_KEYS.skills,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabSkills'),
            },
            {
              value: TAB_KEYS.credits,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabCredits'),
            },
          ]}
        />
      </div>

      <div className={styles['content-area']}>
        {activeTab === TAB_KEYS.agents && (
          <SubscribedAgents data={MOCK_AGENTS} />
        )}
        {activeTab === TAB_KEYS.skills && (
          <SubscribedSkills data={MOCK_SKILLS} />
        )}
        {activeTab === TAB_KEYS.credits && (
          <SubscribedCredits data={MOCK_CREDITS} />
        )}
      </div>
    </div>
  );
};

export default SubscribedContent;
