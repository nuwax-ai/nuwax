import { dict } from '@/services/i18nRuntime';
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
        <LeftOutlined className={cx('hover-box', styles.icon)} />
        <span className={styles.name}>
          {dict('PC.Pages.SpaceMcpCreate.createMcpService')}
        </span>
      </div>

      <div className={cx('flex-1')}></div>
      <div className={cx('flex', 'items-center', styles['extra-box'])}>
        <Button onClick={onCancel}>{dict('PC.Common.Global.cancel')}</Button>
        <Button
          className={cx(styles['save-btn'])}
          onClick={onSave}
          loading={saveLoading}
        >
          {dict('PC.Pages.SpaceMcpEdit.save')}
        </Button>
        <Button
          type="primary"
          onClick={onSaveAndDeploy}
          loading={saveDeployLoading}
        >
          {dict('PC.Pages.SpaceMcpEdit.saveAndDeploy')}
        </Button>
      </div>
    </header>
  );
};

export default McpHeader;
