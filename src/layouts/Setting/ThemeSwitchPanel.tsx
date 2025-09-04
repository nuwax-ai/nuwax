import BackgroundImagePanel from '@/components/business-component/ThemeConfig/BackgroundImagePanel';
import NavigationStylePanel from '@/components/business-component/ThemeConfig/NavigationStylePanel';
import ThemeColorPanel from '@/components/business-component/ThemeConfig/ThemeColorPanel';
import { backgroundConfigs, STORAGE_KEYS } from '@/constants/theme.constants';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useExtraColors, useLayoutStyle } from '@/hooks/useLayoutStyle';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { ThemeConfigData } from '@/types/interfaces/systemManage';
import { TenantThemeConfig } from '@/types/tenant';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './ThemeSwitchPanel.less';

const cx = classNames.bind(styles);

interface ThemeSwitchPanelProps {
  /** 租户主题配置 */
  tenantThemeConfig: TenantThemeConfig;
}

/**
 * 主题切换面板组件
 * 提供主题色、导航栏风格和背景图片的切换功能
 *
 * 与ThemeConfig页面的区别：
 * - ThemeConfig: 所有切换都是临时预览，需要点击"保存配置"按钮才真正保存
 * - ThemeSwitchPanel: 所有切换立即生效并直接写入本地缓存，无需保存按钮
 *
 * 特点：
 * - 不支持自定义颜色上传和背景图片上传
 * - 所有操作立即生效并保存到本地缓存
 * - 仅更新本地缓存，不提交到后端
 * - 用于快速切换和体验不同主题效果
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
    isDarkMode,
  } = useGlobalSettings();

  // 集成导航风格管理
  const {
    navigationStyle,
    layoutStyle,
    setLayoutStyle,
    setNavigationStyle,
    getCurrentConfigSource,
  } = useLayoutStyle();

  // 获取租户配置信息（暂未使用，保留以备后续扩展）
  const { tenantConfigInfo } = useModel('tenantConfigInfo'); // eslint-disable-line @typescript-eslint/no-unused-vars

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

  // 更新本地主题缓存（立即生效，不保存到后端）
  // 这是临时预览功能的核心：所有切换都会立即写入本地缓存
  // 用户可以在设置面板中实时预览效果，无需点击保存按钮
  const updateLocalThemeCache = (config = {}) => {
    try {
      const themeConfig: ThemeConfigData = {
        selectedThemeColor: primaryColor,
        selectedBackgroundId: backgroundImageId,
        antdTheme: isDarkMode
          ? ThemeLayoutColorStyle.DARK
          : ThemeLayoutColorStyle.LIGHT,
        navigationStyle: layoutStyle,
        navigationStyleId: navigationStyle,
        timestamp: Date.now(),
        ...config,
      };

      // 立即保存到本地存储，实现实时预览效果
      // 注意：这里不调用后端API，仅用于临时预览
      localStorage.setItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
        JSON.stringify(themeConfig),
      );

      console.log('🎨 主题切换面板更新本地缓存（立即生效）:', themeConfig);
    } catch (error) {
      console.error('❌ Update local theme cache error:', error);
    }
  };

  // 处理导航风格变更（立即生效，仅本地缓存）
  const handleNavigationStyleChange = (styleId: string) => {
    console.log('主题切换面板收到导航风格变更:', styleId);
    // 直接设置导航风格并更新本地缓存
    setNavigationStyle(styleId as any);
    // 更新本地缓存
    setTimeout(
      () => updateLocalThemeCache({ navigationStyleId: styleId }),
      100,
    );
  };

  // 处理主题色变更（仅本地缓存）
  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    // 更新本地缓存
    updateLocalThemeCache({
      selectedThemeColor: color,
    });
  };

  // 背景图片切换处理（带联动逻辑，仅本地缓存）
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

    // 更新本地缓存
    setTimeout(
      () =>
        updateLocalThemeCache({ selectedBackgroundId: backgroundConfig?.id }),
      100,
    );
  };

  // 切换导航栏深浅色（集成到布局风格管理，带背景自动匹配，仅本地缓存）
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

    // 延迟更新本地缓存，等待状态更新完成
    setTimeout(
      () =>
        updateLocalThemeCache({
          selectedBackgroundId: matchingBackgroundId?.id,
        }),
      100,
    );
  };

  // 获取额外的颜色（包括自定义颜色）
  const extraColors = useExtraColors();

  // 获取当前配置来源
  const configSource = getCurrentConfigSource();
  const getConfigSourceText = (source: string) => {
    switch (source) {
      case 'local':
        return '本地配置';
      case 'tenant':
        return '租户配置';
      case 'default':
        return '默认配置';
      default:
        return '未知';
    }
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>主题切换</div>
      <div className={cx(styles.configSource)}>
        <span className={cx(styles.configSourceLabel)}>配置来源：</span>
        <span
          className={cx(styles.configSourceValue, {
            [styles.local]: configSource === 'local',
            [styles.tenant]: configSource === 'tenant',
            [styles.default]: configSource === 'default',
          })}
        >
          {getConfigSourceText(configSource)}
        </span>
      </div>
      <div className={cx(styles.content)}>
        {/* 垂直布局的主题配置区域 */}
        <div className={cx(styles.configContainer)}>
          <div className={cx(styles.configItem)}>
            <ThemeColorPanel
              currentColor={primaryColor}
              onColorChange={handleColorChange}
              extraColors={extraColors}
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
