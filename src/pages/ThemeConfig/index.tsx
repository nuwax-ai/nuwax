import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
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

  // 导航栏深浅色状态管理（独立于Ant Design主题）
  const [isNavigationDarkMode, setIsNavigationDarkMode] =
    useState<boolean>(false);

  // 切换导航栏深浅色
  const handleNavigationThemeToggle = () => {
    setIsNavigationDarkMode(!isNavigationDarkMode);
  };

  // 保存配置到本地存储
  const handleSave = async () => {
    try {
      const themeConfig = {
        selectedThemeColor: primaryColor,
        selectedBackgroundId: backgroundImageId,
        antdTheme: isDarkMode ? 'dark' : 'light', // Ant Design主题
        navigationStyle: isNavigationDarkMode ? 'dark' : 'light', // 导航栏深浅色（独立）
        navigationStyleId: 'nav-style-1', // 默认风格，实际应该从组件状态获取
        timestamp: Date.now(),
      };

      localStorage.setItem('user-theme-config', JSON.stringify(themeConfig));
      message.success('主题配置保存成功');
    } catch (error) {
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
            />
          </div>
          <div className={cx(styles.configItem)}>
            <BackgroundImagePanel
              backgroundImages={backgroundImages}
              currentBackground={backgroundImageId}
              onBackgroundChange={setBackgroundImage}
            />
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
    </div>
  );
};

export default ThemeConfig;
