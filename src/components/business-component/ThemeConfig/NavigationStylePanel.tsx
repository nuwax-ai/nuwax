import { t } from '@/services/i18nRuntime';
import { isNuwaClaw } from '@/utils/nuwaClawBridge';
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
  /** 当前导航栏是否为深色模式 */
  isNavigationDarkMode: boolean;
  /** 导航栏深浅色切换回调 */
  onNavigationThemeToggle: () => void;
  /** 导航风格变更回调 */
  onNavigationStyleChange?: (styleId: string) => void;
  /** 当前导航风格（可选，如果不提供则使用内部状态） */
  currentNavigationStyle?: string;
  /** 可选的导航风格集合（默认全量；租户管理页只透传经典两档，不透出单栏） */
  availableStyles?: string[];
}

/** 全量导航风格（词表 key 骨架；词条在组件体内取，跟随语言切换刷新） */
const ALL_NAVIGATION_STYLE_KEYS = [
  {
    id: 'style1',
    nameKey: 'PC.Components.ThemeConfigNavigationStylePanel.style1Name',
    descriptionKey:
      'PC.Components.ThemeConfigNavigationStylePanel.style1Description',
  },
  {
    id: 'style2',
    nameKey: 'PC.Components.ThemeConfigNavigationStylePanel.style2Name',
    descriptionKey:
      'PC.Components.ThemeConfigNavigationStylePanel.style2Description',
  },
  {
    id: 'style3',
    nameKey: 'PC.Components.ThemeConfigNavigationStylePanel.style3Name',
    descriptionKey:
      'PC.Components.ThemeConfigNavigationStylePanel.style3Description',
    isDefault: true,
  },
] as const;

const NavigationStylePanel: React.FC<NavigationStylePanelProps> = ({
  isNavigationDarkMode,
  onNavigationThemeToggle,
  onNavigationStyleChange,
  currentNavigationStyle = 'style3',
  availableStyles,
}) => {
  // 桌面端（nuwaclaw webview）锁定单栏布局：沉浸式折叠/壳同步机制只按单栏维护，
  // 风格切换整节隐藏，仅保留导航深浅色切换
  const isNavStyleLocked = isNuwaClaw();

  // 导航栏风格配置（渲染期取词 + 按可选集合过滤）
  const navigationStyles: NavigationStyle[] = ALL_NAVIGATION_STYLE_KEYS.map(
    ({ nameKey, descriptionKey, ...skeleton }) => ({
      ...skeleton,
      name: t(nameKey),
      description: t(descriptionKey),
    }),
  ).filter((style) => !availableStyles || availableStyles.includes(style.id));

  // 导航栏风格状态管理（使用传入的值或默认值）
  const [localNavigationStyle, setLocalNavigationStyle] = useState<string>(
    currentNavigationStyle,
  );

  // 处理导航栏风格切换
  const handleNavigationStyleChange = (styleId: string) => {
    setLocalNavigationStyle(styleId);

    // 通知外部组件
    onNavigationStyleChange?.(styleId);

    console.log('NavigationStylePanel - switch navigation style:', styleId);
  };

  // 处理深浅色风格切换（集成到导航深浅色管理中）
  const handleColorStyleToggle = () => {
    // 同时管理导航深浅色和全局布局深浅色
    onNavigationThemeToggle();
    console.log('NavigationStylePanel - switch light/dark mode');
  };

  return (
    <div className={cx(styles.navigationStylePanel)}>
      <h3 className={cx(styles.panelTitle)}>
        {t('PC.Components.ThemeConfigNavigationStylePanel.panelTitle')}
      </h3>

      {/* 导航栏风格样式选择（桌面端锁定单栏，整节隐藏） */}
      {!isNavStyleLocked && (
        <div className={cx(styles.navigationStyleOptions)}>
          <h4>
            {t(
              'PC.Components.ThemeConfigNavigationStylePanel.styleSectionTitle',
            )}
          </h4>
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
                    [styles.active]: localNavigationStyle === style.id,
                  })}
                >
                  <div
                    className={cx(
                      styles.navbarPreview,
                      // 根据风格动态调整预览样式
                      style.id === 'style1'
                        ? styles.compactNavbar
                        : style.id === 'style2'
                        ? styles.expandedNavbar
                        : styles.sidebarNavbar,
                    )}
                  >
                    {style.id === 'style3' ? (
                      // 单栏（风格3）：纯 CSS 缩略示意——左列会话侧栏
                      <div className={cx(styles.navbarContent)}>
                        <div className={cx(styles.sidebarMockCol)}>
                          <div className={cx(styles.sidebarMockLogo)} />
                          <div className={cx(styles.sidebarMockRow)} />
                          <div className={cx(styles.sidebarMockRow)} />
                          <div className={cx(styles.sidebarMockRow)} />
                        </div>
                      </div>
                    ) : (
                      <div className={cx(styles.navbarContent)}></div>
                    )}
                  </div>
                  <div className={cx(styles.styleLabel)}>{style.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 导航栏深浅色选择 */}
      <div className={cx(styles.navigationColorOptions)}>
        <h4>
          {t('PC.Components.ThemeConfigNavigationStylePanel.colorSectionTitle')}
        </h4>
        <div className={cx(styles.colorOptions)}>
          {/* 浅色模式 */}
          <div className={cx(styles.colorOption)}>
            <div
              className={cx(styles.colorPreview, {
                [styles.active]: !isNavigationDarkMode,
              })}
              onClick={() => isNavigationDarkMode && handleColorStyleToggle()}
            >
              <div className={cx(styles.colorItem, styles.lightNavbar)}>
                <div className={cx(styles.colorItemContent)}></div>
              </div>
            </div>
            <div className={cx(styles.colorLabel)}>
              {t('PC.Components.ThemeConfigNavigationStylePanel.lightMode')}
            </div>
          </div>

          {/* 深色模式 */}
          <div className={cx(styles.colorOption)}>
            <div
              className={cx(styles.colorPreview, {
                [styles.active]: isNavigationDarkMode,
              })}
              onClick={() => !isNavigationDarkMode && handleColorStyleToggle()}
            >
              <div className={cx(styles.colorItem, styles.darkNavbar)}>
                <div className={cx(styles.colorItemContent)}></div>
              </div>
            </div>
            <div className={cx(styles.colorLabel)}>
              {t('PC.Components.ThemeConfigNavigationStylePanel.darkMode')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationStylePanel;
