/**
 * 工具栏组件
 */
import {
  FullscreenOutlined,
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import React from 'react';
import styles from './Toolbar.less';

interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
}) => {
  return (
    <div className={styles.toolbar}>
      <Space>
        <Tooltip title="放大">
          <Button icon={<ZoomInOutlined />} onClick={onZoomIn} />
        </Tooltip>
        <Tooltip title="缩小">
          <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} />
        </Tooltip>
        <Tooltip title="适应画布">
          <Button icon={<FullscreenOutlined />} onClick={onFitView} />
        </Tooltip>
        <Tooltip title="重置">
          <Button icon={<ReloadOutlined />} onClick={onReset} />
        </Tooltip>
      </Space>
    </div>
  );
};

export default Toolbar;
