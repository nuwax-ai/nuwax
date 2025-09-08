import BackgroundImagePanel from '@/components/business-component/ThemeConfig/BackgroundImagePanel';
import NavigationStylePanel from '@/components/business-component/ThemeConfig/NavigationStylePanel';
import ThemeColorPanel from '@/components/business-component/ThemeConfig/ThemeColorPanel';
import { backgroundConfigs } from '@/constants/theme.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { apiSystemConfigUpdate } from '@/services/systemManage';
import { BackgroundImage } from '@/types/background';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { ThemeConfigData } from '@/types/interfaces/systemManage';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

// 使用统一的存储键名

const cx = classNames.bind(styles);

/**
 * 主题配置页面（重构版本）
 * 提供主题色、导航栏风格和背景图片的配置功能
 *
 * 重构特点：
 * - 使用统一的主题数据管理服务
 * - 所有切换都是临时预览效果，不会立即保存到本地缓存
 * - 用户需要点击"保存配置"按钮才会真正保存到后端和本地缓存
 * - 支持完整的自定义功能（自定义颜色、背景图片上传等）
 * - 配置优先级：用户设置 > 租户信息设置 > 默认配置
 */
const ThemeConfig: React.FC = () => {
  // 使用统一主题管理
  const {
    primaryColor,
    backgroundId,
    navigationStyle,
    layoutStyle,
    isNavigationDark,
    extraColors,
    updatePrimaryColor,
    updateBackground,
    updateNavigationStyle,
    updateLayoutStyle,
  } = useUnifiedTheme();

  // 预览状态管理（临时预览，不立即保存）
  const [previewPrimaryColor, setPreviewPrimaryColor] = useState(primaryColor);
  const [previewBackgroundId, setPreviewBackgroundId] = useState(backgroundId);
  const [previewNavigationStyle, setPreviewNavigationStyle] =
    useState(navigationStyle);
  const [previewLayoutStyle, setPreviewLayoutStyle] = useState(layoutStyle);
  const [previewIsNavigationDark, setPreviewIsNavigationDark] =
    useState(isNavigationDark);

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

  // 处理主题色变更（临时预览，但实时显示效果）
  const handleColorChange = async (color: string) => {
    setPreviewPrimaryColor(color);

    // 立即应用主题色预览效果（不保存到localStorage）
    try {
      await updatePrimaryColor(color, { saveToStorage: false });
    } catch (error) {
      console.warn('预览主题色失败:', error);
    }
  };

  // 处理导航风格变更（临时预览，但实时显示效果）
  const handleNavigationStyleChange = async (styleId: string) => {
    setPreviewNavigationStyle(styleId as any);

    // 立即应用导航风格预览效果（不保存到localStorage）
    // 使用批量更新确保导航风格和布局风格同步应用
    try {
      // 导入 unifiedThemeService 进行批量更新
      const { unifiedThemeService } = await import(
        '@/services/unifiedThemeService'
      );

      // 批量更新导航风格和布局风格，确保CSS变量同步
      await unifiedThemeService.updateData(
        {
          navigationStyle: styleId as any,
          layoutStyle: previewLayoutStyle,
        },
        { saveToStorage: false },
      );
    } catch (error) {
      console.warn('预览导航风格失败:', error);
    }
  };

  // 背景图片切换处理（临时预览，但实时显示效果）
  const handleBackgroundChange = async (backgroundId: string) => {
    // 设置背景图片（临时预览）
    setPreviewBackgroundId(backgroundId);

    // 根据背景图片自动切换导航栏深浅色（临时预览）
    const newLayoutStyle = getLayoutStyleByBackgroundId(backgroundId);
    setPreviewLayoutStyle(newLayoutStyle);
    setPreviewIsNavigationDark(newLayoutStyle === ThemeLayoutColorStyle.DARK);

    // 立即应用背景图预览效果（不保存到localStorage）
    try {
      await updateBackground(backgroundId, { saveToStorage: false });
    } catch (error) {
      console.warn('预览背景图失败:', error);
    }

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
  };

  // 切换导航栏深浅色（临时预览，但实时显示效果）
  const handleNavigationThemeToggle = async () => {
    const newLayoutStyle =
      previewLayoutStyle === ThemeLayoutColorStyle.DARK
        ? ThemeLayoutColorStyle.LIGHT
        : ThemeLayoutColorStyle.DARK;
    setPreviewLayoutStyle(newLayoutStyle);
    setPreviewIsNavigationDark(newLayoutStyle === ThemeLayoutColorStyle.DARK);

    // 立即应用布局风格预览效果（不保存到localStorage）
    try {
      await updateLayoutStyle(newLayoutStyle, { saveToStorage: false });
    } catch (error) {
      console.warn('预览布局风格失败:', error);
    }

    // 检查当前背景是否与新的导航栏深浅色匹配
    const currentBackgroundLayoutStyle =
      getLayoutStyleByBackgroundId(previewBackgroundId);

    if (currentBackgroundLayoutStyle !== newLayoutStyle) {
      // 当前背景不匹配，自动切换到匹配的背景（临时预览）
      const matchingBackground = backgroundConfigs.find(
        (config) => config.layoutStyle === newLayoutStyle,
      );

      if (matchingBackground) {
        // 切换背景但不触发布局风格联动（避免循环）
        setPreviewBackgroundId(matchingBackground.id);

        // 立即应用背景图预览效果（不保存到localStorage）
        try {
          await updateBackground(matchingBackground.id, {
            saveToStorage: false,
          });
        } catch (error) {
          console.warn('预览背景图失败:', error);
        }

        // 显示背景自动匹配提示
        message.info(
          `已自动切换为${matchingBackground.name}以匹配${
            newLayoutStyle === ThemeLayoutColorStyle.DARK ? '深色' : '浅色'
          }导航栏（预览效果）`,
        );
      }
    }
  };

  // 保存配置到后端
  const handleSave = async () => {
    try {
      // 首先使用统一主题服务保存预览的配置
      await updatePrimaryColor(previewPrimaryColor);
      await updateBackground(previewBackgroundId);
      await updateNavigationStyle(previewNavigationStyle);
      await updateLayoutStyle(previewLayoutStyle);

      // 构建后端所需的数据格式
      const themeConfig: ThemeConfigData = {
        primaryColor: previewPrimaryColor,
        backgroundId: previewBackgroundId,
        antdTheme: previewLayoutStyle, // 这里应该使用实际的 Ant Design 主题状态
        layoutStyle: previewLayoutStyle, // 导航栏深浅色
        navigationStyle: previewNavigationStyle, // 导航风格 ID
        timestamp: Date.now(),
      };

      // 保存到后端
      await apiSystemConfigUpdate({
        templateConfig: JSON.stringify(themeConfig),
      });

      message.success('主题配置保存成功');
      console.log('保存的配置:', themeConfig);

      // 页面刷新后检查
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Save theme config error:', error);
      message.error('保存失败，请重试');
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    setPreviewPrimaryColor('#5147ff'); // 默认蓝色
    setPreviewBackgroundId('bg-variant-1'); // 默认背景
    setPreviewNavigationStyle('style1' as any);
    setPreviewLayoutStyle(ThemeLayoutColorStyle.LIGHT);
    setPreviewIsNavigationDark(false);
    message.info('已重置为默认配置（预览效果）');
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.title)}>主题配置</div>
      <div className={cx(styles.content)}>
        {/* 垂直布局的主题配置区域 */}
        <div className={cx(styles.configContainer)}>
          <div className={cx(styles.configItem)}>
            <ThemeColorPanel
              currentColor={previewPrimaryColor}
              onColorChange={handleColorChange}
              extraColors={extraColors}
            />
          </div>
          <div className={cx(styles.configItem)}>
            <NavigationStylePanel
              isNavigationDarkMode={previewIsNavigationDark}
              onNavigationThemeToggle={handleNavigationThemeToggle}
              onNavigationStyleChange={handleNavigationStyleChange}
              currentNavigationStyle={previewNavigationStyle}
            />
          </div>
          <div className={cx(styles.configItem)}>
            <BackgroundImagePanel
              backgroundImages={backgroundImages}
              currentBackground={previewBackgroundId}
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
        <Button size="large" style={{ marginLeft: 12 }} onClick={handleReset}>
          重置默认
        </Button>
      </div>
    </div>
  );
};

export default ThemeConfig;
