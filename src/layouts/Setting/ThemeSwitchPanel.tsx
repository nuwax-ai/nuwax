/**
 * 主题切换面板组件（重构版本）
 * 使用统一的主题数据管理，保持原有UI结构不变
 *
 * 重构特点：
 * - 不新做组件样式，仅重构数据存取逻辑
 * - 统一管理主题、导航栏、背景图、语言状态
 * - 配置优先级：用户设置 > 租户信息设置 > 默认配置
 * - 保持现有组件接口不变
 */

import BackgroundImagePanel from '@/components/business-component/ThemeConfig/BackgroundImagePanel';
import NavigationStylePanel from '@/components/business-component/ThemeConfig/NavigationStylePanel';
import ThemeColorPanel from '@/components/business-component/ThemeConfig/ThemeColorPanel';
import { backgroundConfigs } from '@/constants/theme.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import unifiedThemeService from '@/services/unifiedThemeService';
import { BackgroundImage } from '@/types/background';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { TenantThemeConfig } from '@/types/tenant';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './ThemeSwitchPanel.less';

const cx = classNames.bind(styles);

interface ThemeSwitchPanelProps {
  /** 租户主题配置 */
  tenantThemeConfig: TenantThemeConfig;
}

/**
 * 主题切换面板组件
 * 提供主题色、导航栏风格和背景图片的快速切换功能
 *
 * 重构特点：
 * - 使用统一的主题数据管理服务
 * - 保持原有的UI布局和交互体验
 * - 所有操作立即生效并按优先级保存
 * - 支持用户设置 > 租户信息 > 默认配置的优先级
 */
const ThemeSwitchPanel: React.FC<ThemeSwitchPanelProps> = ({
  tenantThemeConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  // 使用统一主题管理
  const {
    primaryColor,
    backgroundId,
    navigationStyle,
    isNavigationDark,
    extraColors,
    updatePrimaryColor,
    updateBackground,
    updateNavigationStyle,
    toggleNavigationTheme,
  } = useUnifiedTheme();

  // 转换背景配置为组件需要的格式
  const backgroundImages: BackgroundImage[] = useMemo(() => {
    return backgroundConfigs.map((config) => ({
      id: config.id,
      name: config.name,
      path: config.url,
      preview: config.url,
    }));
  }, []);

  // 根据背景图片ID获取对应的布局风格
  const getLayoutStyleByBackgroundId = (
    backgroundId: string,
  ): ThemeLayoutColorStyle => {
    const backgroundConfig = backgroundConfigs.find(
      (config) => config.id === backgroundId,
    );
    return backgroundConfig?.layoutStyle || ThemeLayoutColorStyle.LIGHT;
  };

  // 处理主题色变更
  const handleColorChange = async (color: string) => {
    try {
      await updatePrimaryColor(color);
    } catch (error) {
      console.error('更新主题色失败:', error);
      message.error('主题色更新失败');
    }
  };

  // 处理背景图变更
  const handleBackgroundChange = async (backgroundId: string) => {
    try {
      // updateBackground 方法内部会自动处理布局风格联动
      await updateBackground(backgroundId);

      // 显示联动提示
      const backgroundConfig = backgroundConfigs.find(
        (bg) => bg.id === backgroundId,
      );
      if (backgroundConfig) {
        const layoutStyle = backgroundConfig.layoutStyle;
        message.info(
          `已自动切换为${
            layoutStyle === ThemeLayoutColorStyle.DARK ? '深色' : '浅色'
          }导航栏`,
        );
      }
    } catch (error) {
      console.error('更新背景图失败:', error);
      message.error('背景图更新失败');
    }
  };

  // 处理导航风格变更
  const handleNavigationStyleChange = async (styleId: string) => {
    try {
      await updateNavigationStyle(styleId as any);
    } catch (error) {
      console.error('更新导航风格失败:', error);
      message.error('导航风格更新失败');
    }
  };

  // 处理导航深浅色切换
  const handleNavigationThemeToggle = async () => {
    try {
      await toggleNavigationTheme();
      const themeData = unifiedThemeService.getCurrentData();
      // 检查当前背景是否与新的导航栏深浅色匹配
      const currentBackgroundLayoutStyle = getLayoutStyleByBackgroundId(
        themeData.backgroundId,
      );

      if (currentBackgroundLayoutStyle !== themeData.layoutStyle) {
        // 当前背景不匹配，自动切换到匹配的背景（临时预览）
        const matchingBackground = backgroundConfigs.find(
          (config) => config.layoutStyle === themeData.layoutStyle,
        );

        if (matchingBackground) {
          // 立即应用背景图预览效果（不保存到localStorage）
          try {
            await updateBackground(matchingBackground.id);
          } catch (error) {
            console.warn('预览背景图失败:', error);
          }

          // 显示背景自动匹配提示
          message.info(
            `已自动切换为${matchingBackground.name}以匹配${
              themeData.layoutStyle === ThemeLayoutColorStyle.DARK
                ? '深色'
                : '浅色'
            }导航栏`,
          );
        }
      }
    } catch (error) {
      console.error('切换导航主题失败:', error);
      message.error('导航主题切换失败');
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
              onColorChange={handleColorChange}
              extraColors={extraColors} // 显示从租户配置获取的额外颜色
              enableCustomColor={false}
            />
          </div>

          <div className={cx(styles.configItem)}>
            <NavigationStylePanel
              isNavigationDarkMode={isNavigationDark}
              onNavigationThemeToggle={handleNavigationThemeToggle}
              onNavigationStyleChange={handleNavigationStyleChange}
              currentNavigationStyle={navigationStyle}
            />
          </div>

          <div className={cx(styles.configItem)}>
            <BackgroundImagePanel
              backgroundImages={backgroundImages}
              currentBackground={backgroundId}
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
