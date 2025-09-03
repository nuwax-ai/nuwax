import { STORAGE_KEYS } from '@/constants/theme.constants';
import { BackgroundImage } from '@/types/background';
import { layoutStyleManager } from '@/utils/backgroundStyle';

/**
 * 背景图片管理服务
 * 提供全局的背景图片管理功能，包括增删改查和事件监听
 */
class BackgroundService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private currentBackgroundId: string = '';

  // 背景图片列表定义
  private backgroundImages: BackgroundImage[] = [
    {
      id: 'bg-variant-1',
      name: '背景样式1',
      path: '/bg/bg-variant-1.png',
      preview: '/bg/bg-variant-1.png',
    },
    {
      id: 'bg-variant-2',
      name: '背景样式2',
      path: '/bg/bg-variant-2.png',
      preview: '/bg/bg-variant-2.png',
    },
    {
      id: 'bg-variant-3',
      name: '背景样式3',
      path: '/bg/bg-variant-3.png',
      preview: '/bg/bg-variant-3.png',
    },
    {
      id: 'bg-variant-4',
      name: '背景样式4',
      path: '/bg/bg-variant-4.png',
      preview: '/bg/bg-variant-4.png',
    },
    {
      id: 'bg-variant-5',
      name: '背景样式5',
      path: '/bg/bg-variant-5.png',
      preview: '/bg/bg-variant-5.png',
    },
    {
      id: 'bg-variant-6',
      name: '背景样式6',
      path: '/bg/bg-variant-6.png',
      preview: '/bg/bg-variant-6.png',
    },
    {
      id: 'bg-variant-7',
      name: '背景样式7',
      path: '/bg/bg-variant-7.png',
      preview: '/bg/bg-variant-7.png',
    },
    {
      id: 'bg-variant-8',
      name: '背景样式8',
      path: '/bg/bg-variant-8.png',
      preview: '/bg/bg-variant-8.png',
    },
  ];

  constructor() {
    // 从本地存储恢复背景设置
    this.restoreFromStorage();

    // 初始化时设置CSS变量
    const currentBg = this.getCurrentBackground();
    if (currentBg) {
      this.updateCSSVariable(currentBg);
    }
  }

  /**
   * 获取所有可用的背景图片
   */
  getBackgroundImages(): BackgroundImage[] {
    return [...this.backgroundImages];
  }

  /**
   * 获取当前背景图片
   */
  getCurrentBackground(): BackgroundImage | undefined {
    return this.backgroundImages.find(
      (bg) => bg.id === this.currentBackgroundId,
    );
  }

  /**
   * 获取当前背景图片ID
   */
  getCurrentBackgroundId(): string {
    return this.currentBackgroundId;
  }

  /**
   * 设置背景图片
   * @param backgroundId 背景图片ID
   * @param enableAutoLayoutStyle 是否自动联动切换导航栏深浅色，默认为true
   */
  setBackground(
    backgroundId: string,
    enableAutoLayoutStyle: boolean = true,
  ): void {
    if (this.currentBackgroundId === backgroundId) {
      return;
    }

    const background = this.backgroundImages.find(
      (bg) => bg.id === backgroundId,
    );
    if (!background) {
      console.warn(`Background image with id "${backgroundId}" not found`);
      return;
    }

    this.currentBackgroundId = backgroundId;
    this.saveToStorage();

    // 立即更新CSS变量，无需页面重新加载
    this.updateCSSVariable(background);

    // 自动联动切换导航栏深浅色
    if (enableAutoLayoutStyle) {
      this.syncLayoutStyleWithBackground(backgroundId);
    }

    this.notifyListeners('backgroundChanged', background);
  }

  /**
   * 获取背景图片的CSS样式对象
   */
  getBackgroundStyle(): React.CSSProperties {
    const currentBg = this.getCurrentBackground();
    if (!currentBg) {
      return {};
    }

    return {
      '--xagi-background-image': `url(${currentBg.path})`,
    } as React.CSSProperties;
  }

  /**
   * 获取背景图片的CSS变量值
   */
  getBackgroundCSSVariable(): string {
    const currentBg = this.getCurrentBackground();
    if (!currentBg) {
      return 'none';
    }
    return `url(${currentBg.path})`;
  }

  /**
   * 更新CSS变量
   * @param background 背景图片对象
   */
  private updateCSSVariable(background: BackgroundImage): void {
    try {
      // 更新CSS变量
      document.documentElement.style.setProperty(
        '--xagi-background-image',
        `url(${background.path})`,
      );

      // 触发自定义事件，通知其他组件背景已更新
      window.dispatchEvent(
        new CustomEvent('xagi-background-updated', {
          detail: {
            backgroundId: background.id,
            backgroundPath: background.path,
            backgroundName: background.name,
          },
        }),
      );
    } catch (error) {
      console.error('Failed to update CSS variable:', error);
    }
  }

  /**
   * 添加背景图片（动态添加）
   * @param background 背景图片对象
   */
  addBackground(background: BackgroundImage): void {
    // 检查是否已存在
    const existingIndex = this.backgroundImages.findIndex(
      (bg) => bg.id === background.id,
    );
    if (existingIndex >= 0) {
      this.backgroundImages[existingIndex] = background;
    } else {
      this.backgroundImages.push(background);
    }

    this.notifyListeners('backgroundsUpdated', this.backgroundImages);
  }

  /**
   * 移除背景图片
   * @param backgroundId 背景图片ID
   */
  removeBackground(backgroundId: string): void {
    const index = this.backgroundImages.findIndex(
      (bg) => bg.id === backgroundId,
    );
    if (index >= 0) {
      // 如果删除的是当前背景，切换到第一个可用的背景
      if (backgroundId === this.currentBackgroundId) {
        const remainingBackgrounds = this.backgroundImages.filter(
          (bg) => bg.id !== backgroundId,
        );
        if (remainingBackgrounds.length > 0) {
          this.setBackground(remainingBackgrounds[0].id);
        }
      }

      this.backgroundImages.splice(index, 1);
      this.notifyListeners('backgroundsUpdated', this.backgroundImages);
    }
  }

  /**
   * 更新背景图片信息
   * @param backgroundId 背景图片ID
   * @param updates 更新的字段
   */
  updateBackground(
    backgroundId: string,
    updates: Partial<BackgroundImage>,
  ): void {
    const index = this.backgroundImages.findIndex(
      (bg) => bg.id === backgroundId,
    );
    if (index >= 0) {
      this.backgroundImages[index] = {
        ...this.backgroundImages[index],
        ...updates,
      };
      this.notifyListeners('backgroundsUpdated', this.backgroundImages);

      // 如果更新的是当前背景，通知背景变化
      if (backgroundId === this.currentBackgroundId) {
        this.notifyListeners('backgroundChanged', this.backgroundImages[index]);
      }
    }
  }

  /**
   * 随机切换背景
   */
  randomBackground(): void {
    if (this.backgroundImages.length === 0) return;

    const currentIndex = this.backgroundImages.findIndex(
      (bg) => bg.id === this.currentBackgroundId,
    );
    const nextIndex = (currentIndex + 1) % this.backgroundImages.length;
    this.setBackground(this.backgroundImages[nextIndex].id);
  }

  /**
   * 根据背景图片自动同步布局风格（导航栏深浅色）
   * @param backgroundId 背景图片ID
   */
  private syncLayoutStyleWithBackground(backgroundId: string): void {
    try {
      // 将背景ID转换为布局风格管理器中的ID格式
      const layoutBackgroundId = backgroundId.replace('bg-', '');

      // 使用布局风格管理器设置背景，这会自动应用对应的布局风格
      layoutStyleManager.setBackground(layoutBackgroundId);

      console.log(`背景切换联动：${backgroundId} -> 自动切换导航栏深浅色`);
    } catch (error) {
      console.warn('背景切换联动失败:', error);
    }
  }

  /**
   * 根据布局风格查找匹配的背景图片
   * @param layoutStyle 布局风格 ('light' | 'dark')
   * @returns 匹配的背景图片ID，如果没有找到则返回null
   */
  findMatchingBackgroundByLayoutStyle(
    layoutStyle: 'light' | 'dark',
  ): string | null {
    try {
      // 获取所有背景配置
      const allBackgrounds = layoutStyleManager.getAllBackgrounds();

      // 查找匹配布局风格的第一个背景
      const matchingBackground = allBackgrounds.find(
        (bg) => bg.layoutStyle === layoutStyle,
      );

      if (matchingBackground) {
        // 将布局风格管理器ID格式转换为背景服务ID格式
        return `bg-${matchingBackground.id}`;
      }

      return null;
    } catch (error) {
      console.warn('查找匹配背景失败:', error);
      return null;
    }
  }

  /**
   * 检查当前背景是否与指定布局风格匹配
   * @param layoutStyle 布局风格 ('light' | 'dark')
   * @returns 是否匹配
   */
  isCurrentBackgroundMatchingLayoutStyle(
    layoutStyle: 'light' | 'dark',
  ): boolean {
    try {
      // 将当前背景ID转换为布局风格管理器中的ID格式
      const layoutBackgroundId = this.currentBackgroundId.replace('bg-', '');

      // 获取所有背景配置
      const allBackgrounds = layoutStyleManager.getAllBackgrounds();

      // 查找当前背景的配置
      const currentBackgroundConfig = allBackgrounds.find(
        (bg) => bg.id === layoutBackgroundId,
      );

      return currentBackgroundConfig?.layoutStyle === layoutStyle;
    } catch (error) {
      console.warn('检查背景匹配失败:', error);
      return false;
    }
  }

  /**
   * 根据布局风格自动切换匹配的背景图片
   * @param layoutStyle 布局风格 ('light' | 'dark')
   * @returns 是否成功切换了背景
   */
  autoSwitchBackgroundByLayoutStyle(layoutStyle: 'light' | 'dark'): boolean {
    try {
      // 检查当前背景是否已经匹配
      if (this.isCurrentBackgroundMatchingLayoutStyle(layoutStyle)) {
        console.log(`当前背景已匹配布局风格: ${layoutStyle}`);
        return false;
      }

      // 查找匹配的背景
      const matchingBackgroundId =
        this.findMatchingBackgroundByLayoutStyle(layoutStyle);

      if (matchingBackgroundId) {
        // 切换背景但不触发布局风格联动（避免循环）
        this.setBackground(matchingBackgroundId, false);
        console.log(
          `自动切换背景: ${matchingBackgroundId} 以匹配布局风格: ${layoutStyle}`,
        );
        return true;
      } else {
        console.warn(`未找到匹配布局风格 ${layoutStyle} 的背景图片`);
        return false;
      }
    } catch (error) {
      console.warn('自动切换背景失败:', error);
      return false;
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  removeEventListener(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 通知所有监听器
   * @param event 事件名称
   * @param data 事件数据
   */
  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in background service listener for event "${event}":`,
            error,
          );
        }
      });
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.BACKGROUND_ID,
        this.currentBackgroundId,
      );
    } catch (error) {
      console.error('Failed to save background to localStorage:', error);
    }
  }

  /**
   * 从本地存储恢复
   */
  private restoreFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKGROUND_ID);
      if (saved && this.backgroundImages.some((bg) => bg.id === saved)) {
        this.currentBackgroundId = saved;
      }
    } catch (error) {
      console.error('Failed to restore background from localStorage:', error);
    }
  }

  /**
   * 获取背景图片的预览URL
   * @param backgroundId 背景图片ID
   */
  getBackgroundPreview(backgroundId: string): string | undefined {
    const background = this.backgroundImages.find(
      (bg) => bg.id === backgroundId,
    );
    return background?.preview;
  }

  /**
   * 检查背景图片是否存在
   * @param backgroundId 背景图片ID
   */
  hasBackground(backgroundId: string): boolean {
    return this.backgroundImages.some((bg) => bg.id === backgroundId);
  }

  /**
   * 获取背景图片数量
   */
  getBackgroundCount(): number {
    return this.backgroundImages.length;
  }

  /**
   * 清空所有背景图片（保留默认背景）
   */
  clearCustomBackgrounds(): void {
    const defaultBackgrounds = this.backgroundImages.slice(0, 8); // 保留前8个默认背景
    this.backgroundImages.splice(
      0,
      this.backgroundImages.length,
      ...defaultBackgrounds,
    );

    // 如果当前背景被删除，切换到第一个默认背景
    if (!this.hasBackground(this.currentBackgroundId)) {
      this.setBackground(defaultBackgrounds[0].id);
    }

    this.notifyListeners('backgroundsUpdated', this.backgroundImages);
  }
}

// 创建全局单例实例
export const backgroundService = new BackgroundService();

// 导出类型和常量
export type { BackgroundImage };

// 导出便捷方法
export const {
  getBackgroundImages,
  getCurrentBackground,
  getCurrentBackgroundId,
  setBackground,
  getBackgroundStyle,
  getBackgroundCSSVariable,
  addBackground,
  removeBackground,
  updateBackground,
  randomBackground,
  addEventListener,
  removeEventListener,
  getBackgroundPreview,
  hasBackground,
  getBackgroundCount,
  clearCustomBackgrounds,
} = backgroundService;

export default backgroundService;
