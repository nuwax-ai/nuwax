import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { isPermissionDeniedError } from '@/utils/requestError';
import { Empty } from 'antd';
import React from 'react';
import styles from './index.less';

interface AppPageStateProps {
  error?: unknown;
  emptyDescription?: string;
  errorDescription?: string;
}

/** 应用页面共用状态：权限拒绝、加载失败与成功空数据在内容区居中展示。 */
const AppPageState: React.FC<AppPageStateProps> = ({
  error,
  emptyDescription,
  errorDescription,
}) => {
  const permissionDenied = isPermissionDeniedError(error);
  return (
    <div className={styles.pageState} role="status">
      {error ? (
        <AppDevEmptyState
          type={permissionDenied ? 'permission-denied' : 'error'}
          description={permissionDenied ? undefined : errorDescription}
          style={{ width: '100%', height: 'auto', minHeight: 0 }}
        />
      ) : (
        <Empty description={emptyDescription} />
      )}
    </div>
  );
};

export default AppPageState;
