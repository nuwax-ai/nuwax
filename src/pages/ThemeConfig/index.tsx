import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { backgroundConfigs, useBackgroundStyle } from '@/utils/backgroundStyle';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import BackgroundImagePanel from './components/BackgroundImagePanel';
import NavigationStylePanel from './components/NavigationStylePanel';
import ThemeColorPanel from './components/ThemeColorPanel';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主题配置页面
 * 提供主题色、导航栏风格和背景图片的配置功能
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
  const { navigationStyle, setNavigationStyle, layoutStyle, setLayoutStyle } =
    useBackgroundStyle();

  // 导航栏深浅色状态管理（独立于Ant Design主题）
  const [isNavigationDarkMode, setIsNavigationDarkMode] = useState<boolean>(
    layoutStyle === 'dark',
  );

  // 同步布局风格状态到导航深浅色状态
  useEffect(() => {
    setIsNavigationDarkMode(layoutStyle === 'dark');
  }, [layoutStyle]);

  // 根据背景图片ID获取对应的布局风格
  const getLayoutStyleByBackgroundId = (
    backgroundId: string,
  ): 'light' | 'dark' => {
    const backgroundConfig = backgroundConfigs.find(
      (config) => config.id === backgroundId,
    );
    return backgroundConfig?.layoutStyle || 'light';
  };

  // 从本地存储恢复配置
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('user-theme-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);

        // 恢复导航风格
        if (
          config.navigationStyleId &&
          (config.navigationStyleId === 'style1' ||
            config.navigationStyleId === 'style2')
        ) {
          if (config.navigationStyleId !== navigationStyle) {
            setNavigationStyle(config.navigationStyleId);
          }
        }

        // 恢复导航深浅色
        if (config.navigationStyle) {
          const navLayoutStyle =
            config.navigationStyle === 'dark' ? 'dark' : 'light';
          if (navLayoutStyle !== layoutStyle) {
            setLayoutStyle(navLayoutStyle);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore theme config from storage:', error);
    }
  }, []);

  // 处理导航风格变更
  const handleNavigationStyleChange = (styleId: string) => {
    console.log('主题配置页面收到导航风格变更:', styleId);
  };

  // 背景图片切换处理（带联动逻辑）
  const handleBackgroundChange = (backgroundId: string) => {
    // 设置背景图片
    setBackgroundImage(backgroundId);

    // 根据背景图片自动切换导航栏深浅色
    const newLayoutStyle = getLayoutStyleByBackgroundId(backgroundId);
    setLayoutStyle(newLayoutStyle);
    setIsNavigationDarkMode(newLayoutStyle === 'dark');

    // 显示联动提示
    const backgroundConfig = backgroundConfigs.find(
      (config) => config.id === backgroundId,
    );
    if (backgroundConfig) {
      message.info(
        `已自动切换为${newLayoutStyle === 'dark' ? '深色' : '浅色'}导航栏`,
      );
    }
  };

  // 切换导航栏深浅色（集成到布局风格管理）
  const handleNavigationThemeToggle = () => {
    const newLayoutStyle = layoutStyle === 'light' ? 'dark' : 'light';
    setLayoutStyle(newLayoutStyle);
    setIsNavigationDarkMode(newLayoutStyle === 'dark');
  };

  // 保存配置到本地存储
  const handleSave = async () => {
    try {
      const themeConfig = {
        selectedThemeColor: primaryColor,
        selectedBackgroundId: backgroundImageId,
        antdTheme: isDarkMode ? 'dark' : 'light', // Ant Design主题
        navigationStyle: layoutStyle, // 导航栏深浅色（使用布局风格）
        navigationStyleId: navigationStyle, // 导航风格 ID（style1 或 style2）
        timestamp: Date.now(),
      };

      localStorage.setItem('user-theme-config', JSON.stringify(themeConfig));
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

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>主题配置</div>
      <div className={cx(styles.content)}>
        {/* 垂直布局的主题配置区域 */}
        <div className={cx(styles.configContainer)}>
          <div className={cx(styles.configItem)}>
            <ThemeColorPanel
              currentColor={primaryColor}
              onColorChange={setPrimaryColor}
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
