import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  PREVIEW_TOOL_DEFINITIONS,
  type PreviewToolId,
} from '../previewToolDefinitions';
import styles from './index.less';

const cx = classNames.bind(styles);

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
      description={dict(PREVIEW_TOOL_DEFINITIONS[toolId].descriptionKey)}
      /** 空状态图片 */
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  </div>
);

export default ToolTabContent;
