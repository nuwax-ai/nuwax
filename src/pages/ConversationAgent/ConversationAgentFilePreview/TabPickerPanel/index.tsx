import { dict } from '@/services/i18nRuntime';
import {
  BarChartOutlined,
  BranchesOutlined,
  CodeOutlined,
  DesktopOutlined,
  FormOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import type { PreviewToolId } from '../hooks/usePreviewTabs';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TabPickerItem {
  id: PreviewToolId;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

/** 开发工具 */
const DEV_TOOLS: TabPickerItem[] = [
  {
    id: 'preview',
    icon: <DesktopOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.preview',
    descKey: 'PC.Pages.ConversationAgentTabPicker.previewDesc',
  },
  {
    id: 'arrange',
    icon: <FormOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.arrange',
    descKey: 'PC.Pages.ConversationAgentTabPicker.arrangeDesc',
  },
  {
    id: 'editor',
    icon: <CodeOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.editor',
    descKey: 'PC.Pages.ConversationAgentTabPicker.editorDesc',
  },
  {
    id: 'terminal',
    icon: <ThunderboltOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.terminal',
    descKey: 'PC.Pages.ConversationAgentTabPicker.terminalDesc',
  },
  {
    id: 'version-control',
    icon: <BranchesOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.versionControl',
    descKey: 'PC.Pages.ConversationAgentTabPicker.versionControlDesc',
  },
];

/** 订阅 */
const SUBSCRIPTION_TOOLS: TabPickerItem[] = [
  {
    id: 'subscription-setting',
    icon: <SettingOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionSetting',
    descKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionSettingDesc',
  },
  {
    id: 'subscription-stats',
    icon: <BarChartOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionStats',
    descKey: 'PC.Pages.ConversationAgentTabPicker.subscriptionStatsDesc',
  },
];

export interface TabPickerPanelProps {
  onSelectTool: (toolId: PreviewToolId) => void;
  /** 作为页签内容区展示时占满容器 */
  embedded?: boolean;
}

interface TabPickerSectionProps {
  titleKey: string;
  descKey: string;
  items: TabPickerItem[];
  onSelectTool: (toolId: PreviewToolId) => void;
}

/** 单个分区：标题 + 说明 + 卡片网格 */
const TabPickerSection: React.FC<TabPickerSectionProps> = ({
  titleKey,
  descKey,
  items,
  onSelectTool,
}) => (
  <div className={cx(styles.section)}>
    <h4 className={cx(styles['section-title'])}>{dict(titleKey)}</h4>
    <p className={cx(styles['section-desc'])}>{dict(descKey)}</p>
    <div className={cx(styles['card-grid'])}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cx(styles.card)}
          onClick={() => onSelectTool(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectTool(item.id);
            }
          }}
        >
          <span className={cx(styles['card-icon'])}>{item.icon}</span>
          <div className={cx(styles['card-body'])}>
            <p className={cx(styles['card-title'])}>{dict(item.titleKey)}</p>
            <p className={cx(styles['card-desc'])}>{dict(item.descKey)}</p>
          </div>
          <span className={cx(styles['card-add'])} aria-hidden>
            <PlusOutlined />
          </span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * 标签页选择面板：展示开发工具、订阅卡片，选中后打开对应工具页签
 */
const TabPickerPanel: React.FC<TabPickerPanelProps> = ({
  onSelectTool,
  embedded = false,
}) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  /** 与 EditAgent AgentHeader 一致：租户未开启订阅时不展示订阅分区 */
  const showSubscriptionSection = tenantConfigInfo?.enableSubscription !== 0;

  return (
    <div
      className={cx(styles['tab-picker'], {
        [styles['tab-picker-embedded']]: embedded,
      })}
    >
      <TabPickerSection
        titleKey="PC.Pages.ConversationAgentTabPicker.devTools"
        descKey="PC.Pages.ConversationAgentTabPicker.devToolsDesc"
        items={DEV_TOOLS}
        onSelectTool={onSelectTool}
      />
      {showSubscriptionSection && (
        <TabPickerSection
          titleKey="PC.Pages.ConversationAgentTabPicker.subscription"
          descKey="PC.Pages.ConversationAgentTabPicker.subscriptionDesc"
          items={SUBSCRIPTION_TOOLS}
          onSelectTool={onSelectTool}
        />
      )}
    </div>
  );
};

export default TabPickerPanel;
