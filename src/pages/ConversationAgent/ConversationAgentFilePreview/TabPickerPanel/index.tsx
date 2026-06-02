import { dict } from '@/services/i18nRuntime';
import {
  ApiOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import type { PreviewToolId } from '../hooks/usePreviewTabs';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TabPickerItem {
  id: PreviewToolId;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

const DEV_TOOLS: TabPickerItem[] = [
  {
    id: 'preview',
    icon: <DesktopOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.preview',
    descKey: 'PC.Pages.ConversationAgentTabPicker.previewDesc',
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

const INTEGRATED_SERVICES: TabPickerItem[] = [
  {
    id: 'integration-mgmt',
    icon: <ApiOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.integrationMgmt',
    descKey: 'PC.Pages.ConversationAgentTabPicker.integrationMgmtDesc',
  },
  {
    id: 'env-vars',
    icon: <SettingOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.envVars',
    descKey: 'PC.Pages.ConversationAgentTabPicker.envVarsDesc',
  },
  {
    id: 'database',
    icon: <DatabaseOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.database',
    descKey: 'PC.Pages.ConversationAgentTabPicker.databaseDesc',
  },
  {
    id: 'auth',
    icon: <SafetyCertificateOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.auth',
    descKey: 'PC.Pages.ConversationAgentTabPicker.authDesc',
  },
  {
    id: 'object-storage',
    icon: <AppstoreOutlined />,
    titleKey: 'PC.Pages.ConversationAgentTabPicker.objectStorage',
    descKey: 'PC.Pages.ConversationAgentTabPicker.objectStorageDesc',
  },
];

export interface TabPickerPanelProps {
  onSelectTool: (toolId: PreviewToolId) => void;
  /** 作为页签内容区展示时占满容器 */
  embedded?: boolean;
}

/**
 * 标签页选择面板
 * 展示开发工具与集成服务卡片，选中后打开对应工具页签
 */
const TabPickerPanel: React.FC<TabPickerPanelProps> = ({
  onSelectTool,
  embedded = false,
}) => {
  const renderSection = (
    titleKey: string,
    descKey: string,
    items: TabPickerItem[],
  ) => (
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
            <span className={cx(styles['card-add'])}>
              <PlusOutlined />
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={cx(styles['tab-picker'], {
        [styles['tab-picker-embedded']]: embedded,
      })}
    >
      {renderSection(
        'PC.Pages.ConversationAgentTabPicker.devTools',
        'PC.Pages.ConversationAgentTabPicker.devToolsDesc',
        DEV_TOOLS,
      )}
      {renderSection(
        'PC.Pages.ConversationAgentTabPicker.integratedServices',
        'PC.Pages.ConversationAgentTabPicker.integratedServicesDesc',
        INTEGRATED_SERVICES,
      )}
      <div className={cx(styles.section)}>
        <h4 className={cx(styles['section-title'])}>
          {dict('PC.Pages.ConversationAgentTabPicker.hosting')}
        </h4>
        <p className={cx(styles['section-desc'])}>
          {dict('PC.Pages.ConversationAgentTabPicker.hostingDesc')}
        </p>
      </div>
    </div>
  );
};

export default TabPickerPanel;
