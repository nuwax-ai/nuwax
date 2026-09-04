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
  terminal: 'PC.Pages.ConversationAgentTabPicker.terminalDesc',
  'version-control': 'PC.Pages.ConversationAgentTabPicker.versionControlDesc',
  'subscription-setting':
    'PC.Pages.ConversationAgentTabPicker.subscriptionSettingDesc',
  'subscription-stats':
    'PC.Pages.ConversationAgentTabPicker.subscriptionStatsDesc',
};

export interface ToolTabContentProps {
  /** 工具 ID */
  toolId: PreviewToolId;
}

/**
 * 工具类标签页占位内容
 * 后续可替换为各工具的实际面板
 */
const ToolTabContent: React.FC<ToolTabContentProps> = ({ toolId }) => (
  <div className={cx(styles.container)}>
    {/* 空状态 */}
    <Empty
      /** 空状态描述 */
      description={dict(TOOL_DESC_MAP[toolId])}
      /** 空状态图片 */
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  </div>
);

export default ToolTabContent;
