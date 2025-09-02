import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './NavigationStylePanel.less';

const cx = classNames.bind(styles);

interface NavigationStyle {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface NavigationStylePanelProps {
  isNavigationDarkMode: boolean;
  onNavigationThemeToggle: () => void;
}

const NavigationStylePanel: React.FC<NavigationStylePanelProps> = ({
  isNavigationDarkMode,
  onNavigationThemeToggle,
}) => {
  // 导航栏风格配置
  const navigationStyles: NavigationStyle[] = [
    {
      id: 'nav-style-1',
      name: '风格1',
      description: '当前默认风格',
      isDefault: true,
    },
    {
      id: 'nav-style-2',
      name: '风格2',
      description: '简洁风格',
    },
  ];

  // 导航栏风格状态管理
  const [currentNavigationStyle, setCurrentNavigationStyle] =
    useState<string>('nav-style-1');

  // 处理导航栏风格切换
  const handleNavigationStyleChange = (styleId: string) => {
    setCurrentNavigationStyle(styleId);
    // 这里可以添加导航栏风格切换的逻辑
    console.log('切换导航栏风格:', styleId);
  };

  return (
    <div className={cx(styles.navigationStylePanel)}>
      <h3 className={cx(styles.panelTitle)}>导航栏</h3>

      {/* 导航栏风格样式选择 */}
      <div className={cx(styles.navigationStyleOptions)}>
        <h4>风格样式</h4>
        <div className={cx(styles.styleOptions)}>
          {navigationStyles.map((style) => (
            <div
              key={style.id}
              className={cx(styles.styleOption, {
                [styles.active]: currentNavigationStyle === style.id,
              })}
              onClick={() => handleNavigationStyleChange(style.id)}
              title={style.description}
            >
              <div className={cx(styles.stylePreview)}>
                <div className={cx(styles.navbarPreview, styles.lightNavbar)}>
                  <div className={cx(styles.navbarContent)}>
                    <div className={cx(styles.navbarItem)}></div>
                    <div className={cx(styles.navbarItem)}></div>
                    <div className={cx(styles.navbarItem)}></div>
                  </div>
                </div>
              </div>
              <div className={cx(styles.styleLabel)}>{style.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 导航栏深浅色选择 */}
      <div className={cx(styles.navigationColorOptions)}>
        <h4>深浅色</h4>
        <div className={cx(styles.styleOptions)}>
          {/* 浅色模式 */}
          <div
            className={cx(styles.styleOption, {
              [styles.active]: !isNavigationDarkMode,
            })}
            onClick={() => !isNavigationDarkMode || onNavigationThemeToggle()}
          >
            <div className={cx(styles.stylePreview)}>
              <div className={cx(styles.navbarPreview, styles.lightNavbar)}>
                <div className={cx(styles.navbarContent)}>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                </div>
              </div>
            </div>
            <div className={cx(styles.styleLabel)}>浅色</div>
          </div>

          {/* 深色模式 */}
          <div
            className={cx(styles.styleOption, {
              [styles.active]: isNavigationDarkMode,
            })}
            onClick={() => isNavigationDarkMode || onNavigationThemeToggle()}
          >
            <div className={cx(styles.stylePreview)}>
              <div className={cx(styles.navbarPreview, styles.darkNavbar)}>
                <div className={cx(styles.navbarContent)}>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                  <div className={cx(styles.navbarItem)}></div>
                </div>
              </div>
            </div>
            <div className={cx(styles.styleLabel)}>深色</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationStylePanel;
