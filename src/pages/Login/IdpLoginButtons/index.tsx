import { dict } from '@/services/i18nRuntime';
import type { AuthIdpLoginItem } from '@/types/interfaces/authIdp';
import { Button, Divider, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface IdpLoginButtonsProps {
  /** 已按 UA 过滤后的可用登录方式 */
  items: AuthIdpLoginItem[];
  onSelect: (item: AuthIdpLoginItem) => void;
  disabled?: boolean;
  /** 同排末尾的附加登录入口 */
  trailingAction?: React.ReactNode;
}

/**
 * 登录页「其他登录方式」：图标按钮通过悬停或聚焦展示名称，点击后整页跳转 IdP。
 */
const IdpLoginButtons: React.FC<IdpLoginButtonsProps> = ({
  items,
  onSelect,
  disabled,
  trailingAction,
}) => {
  if (!items.length && !trailingAction) return null;
  return (
    <div className={cx(styles.container)}>
      <Divider plain className={cx(styles.divider)}>
        {dict('PC.Pages.Login.otherLoginMethods')}
      </Divider>
      <div className={cx(styles.list)}>
        {items.map((item) => (
          <Tooltip key={item.id} title={item.name} trigger={['hover', 'focus']}>
            <Button
              aria-label={item.name}
              disabled={disabled}
              className={cx(styles.item)}
              icon={
                item.icon ? (
                  <img className={cx(styles.icon)} src={item.icon} alt="" />
                ) : (
                  <span className={cx(styles.fallback)}>
                    {item.name?.slice(0, 1)}
                  </span>
                )
              }
              onClick={() => onSelect(item)}
            />
          </Tooltip>
        ))}
        {trailingAction && (
          <div className={cx(styles.trailingAction)}>
            {items.length > 0 && (
              <Divider type="vertical" className={cx(styles.actionDivider)} />
            )}
            {trailingAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdpLoginButtons;
