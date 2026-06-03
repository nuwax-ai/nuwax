import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { PreviewToolId } from '../hooks/usePreviewTabs';
import styles from './index.less';

const cx = classNames.bind(styles);

const TOOL_DESC_MAP: Record<PreviewToolId, string> = {
  preview: 'PC.Pages.ConversationAgentTabPicker.previewDesc',
  arrange: 'PC.Pages.ConversationAgentTabPicker.arrangeDesc',
  editor: 'PC.Pages.ConversationAgentTabPicker.editorDesc',
  terminal: 'PC.Pages.ConversationAgentTabPicker.terminalDesc',
  'version-control': 'PC.Pages.ConversationAgentTabPicker.versionControlDesc',
  'subscription-setting':
    'PC.Pages.ConversationAgentTabPicker.subscriptionSettingDesc',
  'subscription-stats':
    'PC.Pages.ConversationAgentTabPicker.subscriptionStatsDesc',
};

export interface ToolTabContentProps {
  toolId: PreviewToolId;
}

/**
 * 工具类标签页占位内容
 * 后续可替换为各工具的实际面板
 */
const ToolTabContent: React.FC<ToolTabContentProps> = ({ toolId }) => (
  <div className={cx(styles.container)}>
    <Empty
      description={dict(TOOL_DESC_MAP[toolId])}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  </div>
);

export default ToolTabContent;
