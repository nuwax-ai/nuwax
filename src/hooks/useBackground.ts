import backgroundService from '@/services/backgroundService';
import { BackgroundImage } from '@/types/background';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * 背景管理Hook
 * 提供响应式的背景状态管理和操作方法
 *
 * @returns 背景管理相关的状态和方法
 */
export const useBackground = () => {
  // 当前背景图片
  const [currentBackground, setCurrentBackground] = useState<
    BackgroundImage | undefined
  >(backgroundService.getCurrentBackground());

  // 所有背景图片列表
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>(
    backgroundService.getBackgroundImages(),
  );

  // 背景图片数量
  const backgroundCount = useMemo(
    () => backgroundImages.length,
    [backgroundImages],
  );

  // 当前背景图片ID
  const currentBackgroundId = useMemo(
    () => currentBackground?.id,
    [currentBackground],
  );

  // 背景图片CSS样式
  const backgroundStyle = useMemo(
    () => backgroundService.getBackgroundStyle(),
    [currentBackground],
  );

  // 背景图片CSS变量值
  const backgroundCSSVariable = useMemo(
    () => backgroundService.getBackgroundCSSVariable(),
    [currentBackground],
  );

  // 设置背景图片
  const setBackground = useCallback((backgroundId: string) => {
    backgroundService.setBackground(backgroundId);
  }, []);

  // 随机切换背景
  const randomBackground = useCallback(() => {
    backgroundService.randomBackground();
  }, []);

  // 添加背景图片
  const addBackground = useCallback((background: BackgroundImage) => {
    backgroundService.addBackground(background);
  }, []);

  // 移除背景图片
  const removeBackground = useCallback((backgroundId: string) => {
    backgroundService.removeBackground(backgroundId);
  }, []);

  // 更新背景图片
  const updateBackground = useCallback(
    (backgroundId: string, updates: Partial<BackgroundImage>) => {
      backgroundService.updateBackground(backgroundId, updates);
    },
    [],
  );

  // 获取背景图片预览
  const getBackgroundPreview = useCallback((backgroundId: string) => {
    return backgroundService.getBackgroundPreview(backgroundId);
  }, []);

  // 检查背景图片是否存在
  const hasBackground = useCallback((backgroundId: string) => {
    return backgroundService.hasBackground(backgroundId);
  }, []);

  // 清空自定义背景图片
  const clearCustomBackgrounds = useCallback(() => {
    backgroundService.clearCustomBackgrounds();
  }, []);

  // 监听背景变化事件
  useEffect(() => {
    const handleBackgroundChanged = (background: BackgroundImage) => {
      setCurrentBackground(background);
    };

    const handleBackgroundsUpdated = (backgrounds: BackgroundImage[]) => {
      setBackgroundImages([...backgrounds]);
    };

    // 添加事件监听器
    backgroundService.addEventListener(
      'backgroundChanged',
      handleBackgroundChanged,
    );
    backgroundService.addEventListener(
      'backgroundsUpdated',
      handleBackgroundsUpdated,
    );

    // 清理事件监听器
    return () => {
      backgroundService.removeEventListener(
        'backgroundChanged',
        handleBackgroundChanged,
      );
      backgroundService.removeEventListener(
        'backgroundsUpdated',
        handleBackgroundsUpdated,
      );
    };
  }, []);

  return {
    // 状态
    currentBackground,
    currentBackgroundId,
    backgroundImages,
    backgroundCount,
    backgroundStyle,
    backgroundCSSVariable,

    // 方法
    setBackground,
    randomBackground,
    addBackground,
    removeBackground,
    updateBackground,
    getBackgroundPreview,
    hasBackground,
    clearCustomBackgrounds,
  };
};

export default useBackground;
