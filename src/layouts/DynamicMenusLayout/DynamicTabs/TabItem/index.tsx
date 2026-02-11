import { SvgIcon } from '@/components/base';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TabItemProps {
  active: boolean;
  icon: string;
  text: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const TabItem: React.FC<TabItemProps & { isSecondMenuCollapsed?: boolean }> = ({
  active,
  icon,
  onClick,
  text,
  onMouseEnter,
  onMouseLeave,
  isSecondMenuCollapsed = false,
}) => {
  // 获取当前导航风格
  const { navigationStyle } = useUnifiedTheme();
  const isStyle2 = useMemo(
    () => navigationStyle === ThemeNavigationStyleType.STYLE2,
    [navigationStyle],
  );
  const navStyle: React.CSSProperties = useMemo(() => {
    return isStyle2
      ? {
          width: '58px',
          height: '58px',
        }
      : {
          width: '40px',
          height: '40px',
          padding: 0,
        };
  }, [isStyle2]);

  const RenderComponent: React.FC = () => {
    return (
      <div
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cx(
          'flex',
          'flex-col',
          'items-center',
          'content-center',
          'cursor-pointer',
          styles.box,
          { [styles.active]: active },
        )}
      >
        <div className={cx(styles['active-box'])} style={navStyle}>
          <div className={cx(styles['active-icon-container'])}>
            {icon &&
            (icon?.includes('.png') ||
              icon?.includes('.jpg') ||
              icon?.includes('.jpeg')) ? (
              <img className={cx(styles['icon-image'])} src={icon} />
            ) : (
              <SvgIcon name={icon || 'icons-nav-task-time'} />
            )}
          </div>
          <span
            className={cx(styles.text)}
            style={{
              display: isStyle2 ? 'block' : 'none',
            }}
          >
            {text}
          </span>
        </div>
      </div>
    );
  };

  // 当二级菜单收起时，不显示Tooltip，避免与悬浮菜单冲突
  if (isSecondMenuCollapsed || isStyle2) {
    return <RenderComponent />;
  }

  // 二级菜单展开时，正常显示Tooltip
  return (
    <Tooltip
      title={text}
      placement="right"
      color={'#fff'}
      styles={{
        body: { color: '#000' },
      }}
    >
      <RenderComponent />
    </Tooltip>
  );
};

export default TabItem;
