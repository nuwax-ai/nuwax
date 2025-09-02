import { useBackgroundStyle } from '@/utils/backgroundStyle';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
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
  // 可选：如果需要外部获取当前选中的导航风格
  onNavigationStyleChange?: (styleId: string) => void;
}

const NavigationStylePanel: React.FC<NavigationStylePanelProps> = ({
  isNavigationDarkMode,
  onNavigationThemeToggle,
  onNavigationStyleChange,
}) => {
  // 使用全局导航风格管理
  const { navigationStyle, setNavigationStyle, layoutStyle, setLayoutStyle } =
    useBackgroundStyle();

  // 导航栏风格配置
  const navigationStyles: NavigationStyle[] = [
    {
      id: 'style1',
      name: '风格1',
      description: '紧凑模式：60px宽度，无文字显示，页面容器有外边距和圆角',
      isDefault: true,
    },
    {
      id: 'style2',
      name: '风格2',
      description: '展开模式：88px宽度，显示文字，页面容器无外边距和圆角',
    },
  ];

  // 导航栏风格状态管理（使用全局状态）
  const [currentNavigationStyle, setCurrentNavigationStyle] =
    useState<string>(navigationStyle);

  // 同步全局导航风格状态
  useEffect(() => {
    setCurrentNavigationStyle(navigationStyle);
  }, [navigationStyle]);

  // 处理导航栏风格切换
  const handleNavigationStyleChange = (styleId: string) => {
    const newStyleId = styleId as 'style1' | 'style2';
    setCurrentNavigationStyle(styleId);

    // 更新全局导航风格状态
    setNavigationStyle(newStyleId);

    // 通知外部组件（如果需要）
    onNavigationStyleChange?.(styleId);

    console.log(
      'NavigationStylePanel - 切换导航栏风格:',
      styleId,
      '-> 实际应用:',
      newStyleId,
    );
    console.log('NavigationStylePanel - 当前布局风格:', layoutStyle);
  };

  // 处理深浅色风格切换（集成到导航深浅色管理中）
  const handleColorStyleToggle = () => {
    // 同时管理导航深浅色和全局布局深浅色
    onNavigationThemeToggle();
    console.log('NavigationStylePanel - 切换深浅色风格');
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
              className={cx(styles.styleOption)}
              onClick={() => handleNavigationStyleChange(style.id)}
              title={style.description}
            >
              <div
                className={cx(styles.stylePreview, {
                  [styles.active]: currentNavigationStyle === style.id,
                })}
              >
                <div
                  className={cx(
                    styles.navbarPreview,
                    // 根据风格动态调整预览样式
                    style.id === 'style1'
                      ? styles.compactNavbar
                      : styles.expandedNavbar,
                  )}
                >
                  <div className={cx(styles.navbarContent)}>
                    <div className={cx(styles.navbarItem)}></div>
                    <div className={cx(styles.navbarItem)}></div>
                    <div className={cx(styles.navbarItem)}></div>
                    {/* 风格2显示文字提示 */}
                    {style.id === 'style2' && (
                      <div className={cx(styles.styleText)}>有文字</div>
                    )}
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
          <div className={cx(styles.styleOption)}>
            <div
              className={cx(styles.stylePreview, {
                [styles.active]: !isNavigationDarkMode,
              })}
              onClick={() => !isNavigationDarkMode || handleColorStyleToggle()}
            >
              <div className={cx(styles.navbarPreview, styles.lightNavbar)}>
                <div className={cx(styles.navbarContent)}></div>
              </div>
            </div>
            <div className={cx(styles.styleLabel)}>浅色</div>
          </div>

          {/* 深色模式 */}
          <div className={cx(styles.styleOption)}>
            <div
              className={cx(styles.stylePreview, {
                [styles.active]: isNavigationDarkMode,
              })}
              onClick={() => isNavigationDarkMode || handleColorStyleToggle()}
            >
              <div className={cx(styles.navbarPreview, styles.darkNavbar)}>
                <div className={cx(styles.navbarContent)}></div>
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
