import { dict } from '@/services/i18nRuntime';
import type { AuthIdpLoginItem } from '@/types/interfaces/authIdp';
import { Button, Divider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface IdpLoginButtonsProps {
  /** 已按 UA 过滤后的可用登录方式 */
  items: AuthIdpLoginItem[];
  onSelect: (item: AuthIdpLoginItem) => void;
}

/**
 * 登录页「其他登录方式」：分隔线 + 图标名称按钮，点击后由页面整页跳转 IdP。
 */
const IdpLoginButtons: React.FC<IdpLoginButtonsProps> = ({
  items,
  onSelect,
}) => {
  if (!items.length) return null;
  return (
    <div className={cx(styles.container)}>
      <Divider plain className={cx(styles.divider)}>
        {dict('PC.Pages.Login.otherLoginMethods')}
      </Divider>
      <div className={cx(styles.list)}>
        {items.map((item) => (
          <Button
            key={item.id}
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
          >
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default IdpLoginButtons;
