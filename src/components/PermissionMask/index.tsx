import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

interface PermissionMaskProps {
  /** 蒙层显示的文本内容 */
  text?: string;
  /** 外部容器类名 */
  className?: string;
  /** 是否可见 */
  visible?: boolean;
}

/**
 * 权限蒙层组件
 * 用于覆盖在目标容器之上，显示无权限等提示信息
 */
const PermissionMask: React.FC<PermissionMaskProps> = ({
  text = dict('PC.Components.PermissionMask.noAgentPermission'),
  className,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <div className={classNames(styles['permission-mask'], className)}>
      <span className={styles['permission-text']}>{text}</span>
    </div>
  );
};

export default PermissionMask;
