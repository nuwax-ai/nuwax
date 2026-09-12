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
import {
  backgroundConfigs,
  STORAGE_KEYS,
  THEME_BACKGROUND_CONFIGS,
} from '@/constants/theme.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import {
  isNuwaClawDefaultThemeActive,
  NUWACLAW_PRIMARY,
} from '@/services/nuwaClawTheme';
import unifiedThemeService from '@/services/unifiedThemeService';
import { BackgroundImage } from '@/types/background';
import { ThemeLayoutColorStyle, ThemeNavigationStyleType } from '@/types/enums/theme';
import { TenantThemeConfig } from '@/types/tenant';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import styles from './ThemeSwitchPanel.less';

const cx = classNames.bind(styles);

/**
 * 单栏（style3）锁定的背景：背景列表第一个纯色（无图）背景。
 * 单栏风格下背景不可修改（2026-09-12 需求；服务层 updateData 同款不变量兜底），
 * 仅切入单栏时若背景不同给出一次性联动提示。
 */
const singleColumnDefaultBackground = THEME_BACKGROUND_CONFIGS.find(
  (bg) => !bg.url,
);

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

  const setHasUserSwitchThemeFlag = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME, '1');
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
      setHasUserSwitchThemeFlag();
    } catch (error) {
      console.error('Failed to update theme color:', error);
      message.error(
        dict('PC.Layouts.Setting.ThemeSwitchPanel.colorUpdateFailed'),
      );
    }
  };

  // 处理背景图变更
  const handleBackgroundChange = async (backgroundId: string) => {
    // 单栏风格锁定纯色背景（2026-09-12 需求）：背景面板已置灰，此处兜底拦截
    if (navigationStyle === ThemeNavigationStyleType.STYLE3) {
      message.info(
        dict('PC.Components.ThemeConfigBackgroundImagePanel.lockedHint'),
      );
      return;
    }
    try {
      // updateBackground 方法内部会自动处理布局风格联动
      await updateBackground(backgroundId);

      // 显示联动提示
      const backgroundConfig = backgroundConfigs.find(
        (bg) => bg.id === backgroundId,
      );
      if (backgroundConfig) {
        const layoutStyle = backgroundConfig.layoutStyle;
        const themeLabel =
          layoutStyle === ThemeLayoutColorStyle.DARK
            ? dict('PC.Layouts.Setting.ThemeSwitchPanel.dark')
            : dict('PC.Layouts.Setting.ThemeSwitchPanel.light');
        message.info(
          dict('PC.Layouts.Setting.ThemeSwitchPanel.autoSwitchNav', themeLabel),
        );
        setHasUserSwitchThemeFlag();
      }
    } catch (error) {
      console.error('Failed to update background image:', error);
      message.error(
        dict('PC.Layouts.Setting.ThemeSwitchPanel.backgroundUpdateFailed'),
      );
    }
  };

  // 处理导航风格变更
  const handleNavigationStyleChange = async (styleId: string) => {
    // 切入单栏前先记下当前背景：服务层不变量会把单栏背景收敛到纯色（2026-09-12
    // 需求：单栏只能第一个纯色背景、不允许修改），此处仅负责补一条联动提示
    const previousBackgroundId =
      styleId === ThemeNavigationStyleType.STYLE3
        ? unifiedThemeService.getCurrentData().backgroundId
        : undefined;
    try {
      await updateNavigationStyle(styleId as any);
      setHasUserSwitchThemeFlag();
      if (
        previousBackgroundId &&
        singleColumnDefaultBackground &&
        previousBackgroundId !== singleColumnDefaultBackground.id
      ) {
        message.info(
          dict(
            'PC.Layouts.Setting.ThemeSwitchPanel.autoSwitchBackground',
            singleColumnDefaultBackground.name,
            dict('PC.Layouts.Setting.ThemeSwitchPanel.light'),
          ),
        );
      }
    } catch (error) {
      console.error('Failed to update navigation style:', error);
      message.error(
        dict('PC.Layouts.Setting.ThemeSwitchPanel.navStyleUpdateFailed'),
      );
    }
  };

  // 处理导航深浅色切换
  const handleNavigationThemeToggle = async () => {
    try {
      await toggleNavigationTheme();
      // 单栏锁定纯色背景（2026-09-12 需求）：跳过「深浅色不匹配自动换背景」
      // 联动，背景恒为纯色（服务层不变量同样兜底）
      if (navigationStyle === ThemeNavigationStyleType.STYLE3) {
        return;
      }
      const themeData = unifiedThemeService.getCurrentData();
      // 检查当前背景是否与新的导航栏深浅色匹配
      const currentBackgroundLayoutStyle = getLayoutStyleByBackgroundId(
        themeData.backgroundId,
      );

      if (currentBackgroundLayoutStyle !== themeData.layoutStyle) {
        // 当前背景不匹配，自动切换到匹配的背景
        const matchingBackground = backgroundConfigs.find(
          (config) => config.layoutStyle === themeData.layoutStyle,
        );

        if (matchingBackground) {
          // 立即应用背景图预览效果（不保存到localStorage）
          try {
            await updateBackground(matchingBackground.id);
          } catch (error) {
            console.warn('Failed to preview background image:', error);
          }

          // 显示背景自动匹配提示
          const themeLabel =
            themeData.layoutStyle === ThemeLayoutColorStyle.DARK
              ? dict('PC.Layouts.Setting.ThemeSwitchPanel.dark')
              : dict('PC.Layouts.Setting.ThemeSwitchPanel.light');
          message.info(
            dict(
              'PC.Layouts.Setting.ThemeSwitchPanel.autoSwitchBackground',
              matchingBackground.name,
              themeLabel,
            ),
          );
          setHasUserSwitchThemeFlag();
        }
      }
    } catch (error) {
      console.error('Failed to switch navigation theme:', error);
      message.error(
        dict('PC.Layouts.Setting.ThemeSwitchPanel.navThemeToggleFailed'),
      );
    }
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>
        {dict('PC.Layouts.Setting.ThemeSwitchPanel.title')}
      </div>
      <div className={cx(styles.content, 'scroll-container')}>
        {/* 垂直布局的主题配置区域 */}
        <div className={cx(styles.configContainer)}>
          <div className={cx(styles.configItem)}>
            <ThemeColorPanel
              // 桌面端默认即女娲主题（配置层主色仍是平台默认紫），面板需展示
              // 「生效主色」才能正确高亮「女娲蓝」选项；显式定制后主色跟随
              // 用户选择（灰白 solid 布局已改挂背景维度，不再反向绑架主色）
              currentColor={
                isNuwaClawDefaultThemeActive() ? NUWACLAW_PRIMARY : primaryColor
              }
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
              // 单栏风格锁定纯色背景（2026-09-12 需求）：面板置灰不可选
              disabled={navigationStyle === ThemeNavigationStyleType.STYLE3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitchPanel;
