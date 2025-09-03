import BackgroundImagePanel from '@/components/business-component/ThemeConfig/BackgroundImagePanel';
import NavigationStylePanel from '@/components/business-component/ThemeConfig/NavigationStylePanel';
import ThemeColorPanel from '@/components/business-component/ThemeConfig/ThemeColorPanel';
import { backgroundConfigs } from '@/constants/theme.constants';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useLayoutStyle } from '@/hooks/useLayoutStyle';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { TenantThemeConfig } from '@/types/tenant';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
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
  tenantThemeConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const {
    primaryColor,
    setPrimaryColor,
    backgroundImages,
    backgroundImageId,
    setBackgroundImage,
  } = useGlobalSettings();

  // 集成导航风格管理
  const { layoutStyle, setLayoutStyle } = useLayoutStyle();

  // 导航栏深浅色状态管理（独立于Ant Design主题）
  const [isNavigationDarkMode, setIsNavigationDarkMode] = useState<boolean>(
    layoutStyle === ThemeLayoutColorStyle.DARK,
  );

  // 同步布局风格状态到导航深浅色状态
  useEffect(() => {
    setIsNavigationDarkMode(layoutStyle === ThemeLayoutColorStyle.DARK);
  }, [layoutStyle]);

  // 根据背景图片ID获取对应的布局风格
  const getLayoutStyleByBackgroundId = (
    backgroundId: string,
  ): ThemeLayoutColorStyle => {
    // 直接使用背景ID查找配置（现在ID格式已统一）
    const backgroundConfig = backgroundConfigs.find(
      (config) => config.id === backgroundId,
    );
    return backgroundConfig?.layoutStyle || ThemeLayoutColorStyle.LIGHT;
  };

  // 处理导航风格变更
  const handleNavigationStyleChange = (styleId: string) => {
    console.log('主题切换面板收到导航风格变更:', styleId);
  };

  // 背景图片切换处理（带联动逻辑）
  const handleBackgroundChange = (backgroundId: string) => {
    // 设置背景图片
    setBackgroundImage(backgroundId);

    // 根据背景图片自动切换导航栏深浅色
    const newLayoutStyle = getLayoutStyleByBackgroundId(backgroundId);
    setLayoutStyle(newLayoutStyle);
    setIsNavigationDarkMode(newLayoutStyle === ThemeLayoutColorStyle.DARK);

    // 显示联动提示
    const backgroundConfig = backgroundConfigs.find(
      (config) => config.id === backgroundId,
    );
    if (backgroundConfig) {
      message.info(
        `已自动切换为${
          newLayoutStyle === ThemeLayoutColorStyle.DARK ? '深色' : '浅色'
        }导航栏`,
      );
    }
  };

  // 切换导航栏深浅色（集成到布局风格管理，带背景自动匹配）
  const handleNavigationThemeToggle = () => {
    const newLayoutStyle =
      layoutStyle === ThemeLayoutColorStyle.DARK
        ? ThemeLayoutColorStyle.LIGHT
        : ThemeLayoutColorStyle.DARK;
    setLayoutStyle(newLayoutStyle);
    setIsNavigationDarkMode(newLayoutStyle === ThemeLayoutColorStyle.DARK);

    // 检查当前背景是否与新的导航栏深浅色匹配
    const currentBackgroundLayoutStyle =
      getLayoutStyleByBackgroundId(backgroundImageId);

    if (currentBackgroundLayoutStyle !== newLayoutStyle) {
      // 当前背景不匹配，自动切换到匹配的背景
      const matchingBackgroundId = backgroundConfigs.find(
        (config) => config.layoutStyle === newLayoutStyle,
      );

      if (matchingBackgroundId) {
        // 切换背景但不触发布局风格联动（避免循环）
        setBackgroundImage(matchingBackgroundId.id);

        // 显示背景自动匹配提示
        message.info(
          `已自动切换为${matchingBackgroundId.name}以匹配${
            newLayoutStyle === ThemeLayoutColorStyle.DARK ? '深色' : '浅色'
          }导航栏`,
        );
      }
    }
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>主题切换</div>
      <div className={cx(styles.content)}>
        {/* 垂直布局的主题配置区域 */}
        <div className={cx(styles.configContainer)}>
          <div className={cx(styles.configItem)}>
            <ThemeColorPanel
              currentColor={primaryColor}
              onColorChange={setPrimaryColor}
              enableCustomColor={false}
            />
          </div>
          <div className={cx(styles.configItem)}>
            <NavigationStylePanel
              isNavigationDarkMode={isNavigationDarkMode}
              onNavigationThemeToggle={handleNavigationThemeToggle}
              onNavigationStyleChange={handleNavigationStyleChange}
            />
          </div>
          <div className={cx(styles.configItem)}>
            <BackgroundImagePanel
              backgroundImages={backgroundImages}
              currentBackground={backgroundImageId}
              onBackgroundChange={handleBackgroundChange}
              enableCustomUpload={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitchPanel;
