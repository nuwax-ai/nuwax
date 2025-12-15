import { LogDetailsContent } from '@/pages/SpaceLibraryLog/LogDetails';
import type { SpaceLogInfo } from '@/types/interfaces/agent';
import { Drawer } from 'antd';
import React, { memo, useMemo } from 'react';
import styles from './index.less';

/**
 * 日志详情抽屉
 * 说明：用于 ProTable 行点击后的侧滑详情展示。
 */
export interface LogDetailDrawerProps {
  open: boolean;
  loading: boolean;
  requestId?: string;
  executeResult?: SpaceLogInfo;
  onClose: () => void;
}

const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({
  open,
  loading,
  requestId,
  executeResult,
  onClose,
}) => {
  const drawerWidth = useMemo(() => {
    // 简单响应式：PC 720，移动端尽量占满
    if (typeof window === 'undefined') {
      return 720;
    }
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  return (
    <Drawer
      className={styles.drawer}
      title="日志详情"
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnClose
      rootStyle={{ overflow: 'hidden' }}
      styles={{
        body: { padding: 0 },
      }}
    >
      <LogDetailsContent
        loading={loading}
        requestId={requestId || ''}
        executeResult={executeResult}
      />
    </Drawer>
  );
};

export default memo(LogDetailDrawer);
