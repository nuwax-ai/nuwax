import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { t } from '@/services/i18nRuntime';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceItemProps {
  /** 资源名称 */
  name: string;
  /** 资源ID */
  targetId: number;
  /** 点击添加按钮的回调函数 */
  onAdd?: (targetId: number) => void;
  /** 点击移除按钮的回调函数 */
  onDelete?: (targetId: number) => void;
  /** 是否已添加（用于显示已添加状态） */
  isAdded?: boolean;
}

/**
 * 沙盒配置专用资源项组件
 * 仅展示名称，支持添加和移除操作
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  name,
  targetId,
  onAdd,
  onDelete,
  isAdded = false,
}) => {
  return (
    <div className={cx(styles['resource-item'])}>
      <div className={cx(styles['name-wrapper'])}>
        <EllipsisTooltip className={cx(styles['name-text'])} text={name} />
      </div>
      <div className={cx(styles['action-wrapper'])}>
        {onAdd && (
          <Button
            type="default"
            size="small"
            disabled={isAdded}
            className={cx(styles.btn)}
            onClick={() => onAdd(targetId)}
          >
            {isAdded
              ? t('PC.Pages.SystemMenuDataPermissionModal.itemAdded')
              : t('PC.Pages.SystemMenuDataPermissionModal.itemAdd')}
          </Button>
        )}
        {onDelete && (
          <Button
            type="default"
            size="small"
            className={cx(styles.btn)}
            onClick={() => onDelete(targetId)}
          >
            {t('PC.Pages.SystemMenuDataPermissionModal.itemRemove')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResourceItem;
