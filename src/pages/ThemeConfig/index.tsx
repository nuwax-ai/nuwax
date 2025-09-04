import BackgroundImagePanel from '@/components/business-component/ThemeConfig/BackgroundImagePanel';
import NavigationStylePanel from '@/components/business-component/ThemeConfig/NavigationStylePanel';
import ThemeColorPanel from '@/components/business-component/ThemeConfig/ThemeColorPanel';
import { backgroundConfigs, STORAGE_KEYS } from '@/constants/theme.constants';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useExtraColors, useLayoutStyle } from '@/hooks/useLayoutStyle';
import { apiSystemConfigUpdate } from '@/services/systemManage';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { ThemeConfigData } from '@/types/interfaces/systemManage';
import { layoutStyleManager } from '@/utils/backgroundStyle';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

// 使用统一的存储键名

const cx = classNames.bind(styles);

/**
 * 主题配置页面
 * 提供主题色、导航栏风格和背景图片的配置功能
 *
 * 特点：
 * - 所有切换都是临时预览效果，不会立即保存到本地缓存
 * - 用户需要点击"保存配置"按钮才会真正保存到后端和本地缓存
 * - 支持完整的自定义功能（自定义颜色、背景图片上传等）
 * - 用于正式的配置管理，需要用户确认后保存
 */
const ThemeConfig: React.FC = () => {
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
    setNavigationStyle,
    layoutStyle,
    setLayoutStyle,
    getCurrentConfigSource,
  } = useLayoutStyle();

  // 获取额外的颜色（包括自定义颜色）
  const extraColors = useExtraColors();

  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

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

  // 从租户配置和本地存储恢复配置
  useEffect(() => {
    try {
      // 使用布局样式管理器的公共方法获取主题配置
      const themeConfig: ThemeConfigData | null =
        layoutStyleManager.getThemeConfigData();

      // 应用恢复的配置
      if (themeConfig) {
        console.log('主题配置页面恢复配置:', themeConfig);

        // 恢复主题色
        if (
          themeConfig.selectedThemeColor &&
          themeConfig.selectedThemeColor !== primaryColor
        ) {
          setPrimaryColor(themeConfig.selectedThemeColor);
        }

        // 恢复背景图片
        if (
          themeConfig.selectedBackgroundId &&
          themeConfig.selectedBackgroundId !== backgroundImageId
        ) {
          setBackgroundImage(themeConfig.selectedBackgroundId);
        }

        // 恢复导航风格
        if (
          themeConfig.navigationStyleId &&
          themeConfig.navigationStyleId !== navigationStyle
        ) {
          setNavigationStyle(themeConfig.navigationStyleId as any);
        }

        // 恢复导航深浅色
        if (
          themeConfig.navigationStyle &&
          themeConfig.navigationStyle !== layoutStyle
        ) {
          const layoutStyleEnum =
            themeConfig.navigationStyle === 'dark'
              ? ThemeLayoutColorStyle.DARK
              : ThemeLayoutColorStyle.LIGHT;
          setLayoutStyle(layoutStyleEnum);
        }
      }
    } catch (error) {
      console.warn('Failed to restore theme config:', error);
    }
  }, [tenantConfigInfo]);

  // 处理导航风格变更（临时预览，不立即保存）
  const handleNavigationStyleChange = (styleId: string) => {
    console.log('主题配置页面收到导航风格变更（临时预览）:', styleId);
    // 这里只是临时预览，不立即保存到本地缓存
    // 用户需要点击"保存配置"按钮才会真正保存
  };

  // 背景图片切换处理（临时预览，不立即保存）
  const handleBackgroundChange = (backgroundId: string) => {
    // 设置背景图片（临时预览）
    setBackgroundImage(backgroundId);

    // 根据背景图片自动切换导航栏深浅色（临时预览）
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
        }导航栏（预览效果）`,
      );
    }

    // 注意：这里不保存到本地缓存，只是临时预览
    // 用户需要点击"保存配置"按钮才会真正保存
  };

  // 切换导航栏深浅色（临时预览，不立即保存）
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
      // 当前背景不匹配，自动切换到匹配的背景（临时预览）
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
          }导航栏（预览效果）`,
        );
      }
    }

    // 注意：这里不保存到本地缓存，只是临时预览
    // 用户需要点击"保存配置"按钮才会真正保存
  };

  // 保存配置到后端
  const handleSave = async () => {
    try {
      const themeConfig: ThemeConfigData = {
        selectedThemeColor: primaryColor,
        selectedBackgroundId: backgroundImageId,
        antdTheme: isDarkMode
          ? ThemeLayoutColorStyle.DARK
          : ThemeLayoutColorStyle.LIGHT, // Ant Design主题
        navigationStyle: layoutStyle, // 导航栏深浅色（使用布局风格）
        navigationStyleId: navigationStyle, // 导航风格 ID（style1 或 style2）
        timestamp: Date.now(),
      };

      // 保存到后端
      await apiSystemConfigUpdate({
        templateConfig: JSON.stringify(themeConfig),
      });

      // 同时保存到本地存储作为缓存
      localStorage.setItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
        JSON.stringify(themeConfig),
      );

      message.success('主题配置保存成功');
      console.log('保存的配置:', themeConfig);
    } catch (error) {
      console.error('Save theme config error:', error);
      message.error('保存失败，请重试');
    }
  };

  // 重置为默认配置 (暂时注释掉，因为重置按钮被隐藏)
  // const handleReset = () => {
  //   setPrimaryColor('#5147ff'); // 默认蓝色
  //   setBackgroundImage('bg-variant-1'); // 默认背景
  //   localStorage.removeItem('user-theme-config');
  //   message.info('已重置为默认配置');
  // };

  // 获取当前配置来源
  const configSource = getCurrentConfigSource();
  const getConfigSourceText = (source: string) => {
    switch (source) {
      case 'local':
        return '本地配置（用户自定义）';
      case 'tenant':
        return '租户配置（默认主题）';
      case 'default':
        return '系统默认配置';
      default:
        return '未知配置';
    }
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>主题配置</div>
      <div className={cx(styles.configSource)}>
        <span className={cx(styles.configSourceLabel)}>当前配置来源：</span>
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
              onColorChange={setPrimaryColor}
              extraColors={extraColors}
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
            />
          </div>
        </div>
      </div>
      {/* 底部操作区域 */}
      <div className={cx(styles.footer)}>
        <Button type="primary" size="large" onClick={handleSave}>
          保存配置
        </Button>
        {/* <Button size="large" style={{ marginLeft: 12 }} onClick={handleReset}>
            重置默认
          </Button> */}
      </div>
    </div>
  );
};

export default ThemeConfig;
