import { McpHeaderProps } from '@/types/interfaces/mcp';
import { jumpBack } from '@/utils/router';
import { LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建MCP服务header
const McpHeader: React.FC<McpHeaderProps> = ({
  spaceId,
  saveLoading,
  saveDeployLoading,
  onCancel,
  onSave,
  onSaveAndDeploy,
}) => {
  return (
    <header className={cx('flex', 'items-center', styles.header)}>
      <div
        className={cx('flex', 'items-center', 'cursor-pointer')}
        onClick={() => jumpBack(`/space/${spaceId}/mcp`)}
      >
        <LeftOutlined className={cx('hover-box')} />
        <span className={styles.name}>创建MCP服务</span>
      </div>

      <div className={cx('flex-1')}></div>
      <div className={cx('flex', 'items-center', styles['extra-box'])}>
        <Button onClick={onCancel}>取消</Button>
        <Button
          className={cx(styles['save-btn'])}
          onClick={onSave}
          loading={saveLoading}
        >
          保存
        </Button>
        <Button
          type="primary"
          onClick={onSaveAndDeploy}
          loading={saveDeployLoading}
        >
          保存并部署
        </Button>
      </div>
    </header>
  );
};

export default McpHeader;
