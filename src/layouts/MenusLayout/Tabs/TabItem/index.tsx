import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import type { TabItemProps } from '@/types/interfaces/layouts';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const TabItem: React.FC<TabItemProps & { isSecondMenuCollapsed?: boolean }> = ({
  active,
  type,
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

  // 当二级菜单收起时，不显示Tooltip，避免与悬浮菜单冲突
  if (isSecondMenuCollapsed || isStyle2) {
    return (
      <div
        onClick={() => onClick(type)}
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
          <div className={cx(styles['active-icon-container'])}>{icon}</div>
          <span
            className={cx(styles.text)}
            style={{
              display: isStyle2 ? 'block' : 'none',
              // transform: navigationStyle === 'style2' ? 'translateY(0)' : 'translateY(-5px)'
            }}
          >
            {text}
          </span>
        </div>
      </div>
    );
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
      <div
        onClick={() => onClick(type)}
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
          <div className={cx(styles['active-icon-container'])}>{icon}</div>
          <span
            className={cx(styles.text)}
            style={{
              display:
                navigationStyle === ThemeNavigationStyleType.STYLE2
                  ? 'block'
                  : 'none',
              // transform:
              //   navigationStyle === 'style2'
              //     ? 'translateY(0)'
              //     : 'translateY(-5px)',
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </Tooltip>
  );
};

export default TabItem;
