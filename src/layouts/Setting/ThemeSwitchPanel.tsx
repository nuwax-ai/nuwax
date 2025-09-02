import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { TenantThemeConfig } from '@/types/tenant';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './ThemeSwitchPanel.less';

const cx = classNames.bind(styles);

interface ThemeSwitchPanelProps {
  /** 租户主题配置 */
  tenantThemeConfig: TenantThemeConfig;
}

/**
 * 主题切换面板组件
 * 提供主题色、导航栏风格和背景图片的切换功能
 * 与ThemeConfig页面UI一致，但不支持自定义功能
 */
const ThemeSwitchPanel: React.FC<ThemeSwitchPanelProps> = ({
  tenantThemeConfig,
}) => {
  const {
    primaryColor,
    setPrimaryColor,
    backgroundImageId,
    setBackgroundImage,
    isDarkMode,
    toggleTheme,
  } = useGlobalSettings();

  // 导航栏风格状态管理
  const [currentNavigationStyle, setCurrentNavigationStyle] = useState<string>(
    tenantThemeConfig.defaultNavigationStyleId,
  );

  // 处理主题色切换
  const handleThemeColorChange = (color: string) => {
    setPrimaryColor(color);
  };

  // 处理背景图片切换
  const handleBackgroundChange = (backgroundId: string) => {
    setBackgroundImage(backgroundId);
  };

  // 处理导航栏风格切换
  const handleNavigationStyleChange = (styleId: string) => {
    setCurrentNavigationStyle(styleId);
    // 这里可以添加导航栏风格切换的逻辑
    console.log('切换导航栏风格:', styleId);
  };

  return (
    <div className={cx(styles.themeSwitchPanel)}>
      <h3 className={cx(styles.panelTitle)}>主题切换</h3>

      {/* 主题色选择 */}
      <div className={cx(styles.themeColorSection)}>
        <h4>主题色</h4>
        <div className={cx(styles.themeColorGrid)}>
          {tenantThemeConfig.themeColors.map((themeColor) => (
            <div
              key={themeColor.color}
              className={cx(styles.colorPreviewItemContainer)}
            >
              <div
                className={cx(styles.colorPreviewItem, {
                  [styles.active]: primaryColor === themeColor.color,
                })}
                onClick={() => handleThemeColorChange(themeColor.color)}
                title={themeColor.name}
                style={
                  {
                    '--hover-border-color': themeColor.color,
                  } as React.CSSProperties
                }
              >
                <span
                  className={cx(styles.colorPreviewItemSolid)}
                  style={{ backgroundColor: themeColor.color }}
                ></span>
              </div>
              <span
                className={cx(styles.colorPreviewItemText)}
                style={{
                  opacity: primaryColor === themeColor.color ? 1 : 0,
                }}
              >
                {themeColor.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 导航栏风格选择 */}
      <div className={cx(styles.navigationStyleSection)}>
        <h4>导航栏</h4>

        {/* 导航栏风格样式选择 */}
        <div className={cx(styles.navigationStyleOptions)}>
          <h5>风格样式</h5>
          <div className={cx(styles.styleOptions)}>
            {tenantThemeConfig.navigationStyles.map((style) => (
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
        {tenantThemeConfig.supportDarkMode && (
          <div className={cx(styles.navigationColorOptions)}>
            <h5>深浅色</h5>
            <div className={cx(styles.styleOptions)}>
              {/* 浅色模式 */}
              <div
                className={cx(styles.styleOption, {
                  [styles.active]: !isDarkMode,
                })}
                onClick={() => !isDarkMode || toggleTheme()}
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
                  [styles.active]: isDarkMode,
                })}
                onClick={() => isDarkMode || toggleTheme()}
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
        )}
      </div>

      {/* 背景图片选择 */}
      <div className={cx(styles.backgroundImageSection)}>
        <h4>背景图片</h4>
        <div className={cx(styles.backgroundGrid)}>
          {tenantThemeConfig.backgroundImages.map((bg) => (
            <div
              key={bg.id}
              className={cx(styles.backgroundOption, {
                [styles.active]: (backgroundImageId || '') === bg.id,
              })}
              onClick={() => handleBackgroundChange(bg.id)}
              title={bg.name}
            >
              <div
                className={cx(styles.backgroundPreview)}
                style={{ backgroundImage: `url(${bg.preview})` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitchPanel;
