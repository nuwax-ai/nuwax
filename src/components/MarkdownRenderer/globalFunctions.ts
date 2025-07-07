import { message } from 'antd';

/**
 * 全局函数管理器
 * 负责注册和清理 markdown 渲染所需的全局函数
 */
export class GlobalFunctionManager {
  private static instance: GlobalFunctionManager;
  private registeredFunctions: Set<string> = new Set();
  private copyCallbacks: Set<() => void> = new Set();
  private showDefaultCopyMessage: boolean = true;

  private constructor() {}

  public static getInstance(): GlobalFunctionManager {
    if (!GlobalFunctionManager.instance) {
      GlobalFunctionManager.instance = new GlobalFunctionManager();
    }
    return GlobalFunctionManager.instance;
  }

  /**
   * 注册全局复制函数
   */
  public registerClipboardHandler(): void {
    if (this.registeredFunctions.has('handleClipboard')) return;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const globalManager = this;

    // 传统复制方法（降级方案）
    function fallbackCopyTextToClipboard(
      text: string,
      callback?: (context: string) => void,
    ) {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 避免在iOS上出现缩放
      textArea.style.fontSize = '16px';
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          // 优先调用传入的回调，如果没有则调用默认提示
          if (callback) {
            callback(text);
          } else {
            globalManager.triggerCopyCallbacks();
          }
        } else {
          message.error('复制失败');
        }
      } catch (err) {
        console.error('复制失败:', err);
        message.error('复制失败');
      }

      document.body.removeChild(textArea);
    }

    window.handleClipboard = function (
      element: HTMLElement,
      callback?: (context: string) => void,
    ) {
      // 优先从 data-code 属性获取代码内容
      let textContent = element.getAttribute('data-code') || '';

      // 如果没有 data-code 属性，尝试从DOM结构中获取
      if (!textContent) {
        const codeElement = element
          ?.closest('.code-block-wrapper')
          ?.querySelector('.code-content');
        textContent = codeElement?.textContent || '';
      }

      // HTML解码
      textContent = textContent
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      if (!textContent) {
        message.error('复制失败：未找到代码内容');
        return;
      }

      // 使用现代剪贴板API或降级到传统方法
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textContent).then(
          () => {
            // 优先调用传入的回调，如果没有则调用默认提示
            if (callback) {
              callback(textContent);
            } else {
              globalManager.triggerCopyCallbacks();
            }
          },
          (err) => {
            console.error('复制失败:', err);
            message.error('复制失败');
            // 降级到传统复制方法
            fallbackCopyTextToClipboard(textContent, callback);
          },
        );
      } else {
        // 降级到传统复制方法
        fallbackCopyTextToClipboard(textContent, callback);
      }
    };

    this.registeredFunctions.add('handleClipboard');
  }

  /**
   * 注册图片放大查看函数
   */
  public registerImageModal(): void {
    if (this.registeredFunctions.has('showImageInModal')) return;

    const imageOverlay = 'image-overlay';

    window.showImageInModal = function (imgSrc: string) {
      const overlay = document.createElement('div');
      overlay.className = imageOverlay;
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        cursor: pointer;
      `;

      const zoomedImg = document.createElement('img');
      zoomedImg.src = imgSrc;
      zoomedImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        cursor: zoom-in;
      `;

      overlay.appendChild(zoomedImg);
      document.body.appendChild(overlay);

      // 监听滚轮事件进行缩放
      overlay.addEventListener('wheel', (e) => {
        e.preventDefault();
        const transform = window.getComputedStyle(zoomedImg).transform;
        const matrix = new DOMMatrix(transform);
        const currentScale = matrix.a;
        const newScale = e.deltaY < 0 ? currentScale + 0.3 : currentScale - 0.4;
        const clampedScale = Math.max(0.1, Math.min(5, newScale));
        zoomedImg.style.transform = `scale(${clampedScale})`;
      });

      // 显示动画
      setTimeout(() => {
        overlay.style.opacity = '1';
        zoomedImg.style.transform = 'scale(1)';
      }, 10);

      // 点击关闭
      overlay.addEventListener('click', function () {
        overlay.style.opacity = '0';
        zoomedImg.style.transform = 'scale(0.9)';
        setTimeout(() => {
          overlay?.remove();
        }, 300);
      });
    };

    this.registeredFunctions.add('showImageInModal');
  }

  /**
   * 注册代码折叠函数
   */
  public registerCodeCollapse(): void {
    if (this.registeredFunctions.has('toggleCodeCollapse')) return;

    window.toggleCodeCollapse = function (button: HTMLElement) {
      const wrapper = button.closest('.code-block-wrapper');
      const codeBody = wrapper?.querySelector('.code-body');
      const collapseText = button.querySelector('.collapse-text');

      if (wrapper && codeBody && collapseText) {
        const isCollapsed = wrapper.classList.contains('collapsed');

        if (isCollapsed) {
          wrapper.classList.remove('collapsed');
          collapseText.textContent = '折叠';
        } else {
          wrapper.classList.add('collapsed');
          collapseText.textContent = '展开';
        }
      }
    };

    this.registeredFunctions.add('toggleCodeCollapse');
  }

  /**
   * 注册所有默认全局函数
   */
  public registerAllFunctions(
    options: {
      handleClipboard?: boolean;
      showImageInModal?: boolean;
      toggleCodeCollapse?: boolean;
    } = {},
  ): void {
    const {
      handleClipboard = true,
      showImageInModal = true,
      toggleCodeCollapse = true,
    } = options;

    if (handleClipboard) {
      this.registerClipboardHandler();
    }

    if (showImageInModal) {
      this.registerImageModal();
    }

    if (toggleCodeCollapse) {
      this.registerCodeCollapse();
    }
  }

  /**
   * 清理指定的全局函数
   */
  public cleanup(functionNames?: string[]): void {
    const functionsToClean =
      functionNames || Array.from(this.registeredFunctions);

    functionsToClean.forEach((funcName) => {
      if (funcName in window) {
        delete (window as any)[funcName];
        this.registeredFunctions.delete(funcName);
      }
    });
  }

  /**
   * 清理所有注册的全局函数
   */
  public cleanupAll(): void {
    this.cleanup();
  }

  /**
   * 获取已注册的函数列表
   */
  public getRegisteredFunctions(): string[] {
    return Array.from(this.registeredFunctions);
  }

  /**
   * 添加复制回调
   */
  public addCopyCallback(callback: () => void): void {
    this.copyCallbacks.add(callback);
  }

  /**
   * 移除复制回调
   */
  public removeCopyCallback(callback: () => void): void {
    this.copyCallbacks.delete(callback);
  }

  /**
   * 触发所有复制回调
   */
  public triggerCopyCallbacks(): void {
    // 如果有注册的回调，就执行回调
    if (this.copyCallbacks.size > 0) {
      this.copyCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error('复制回调执行失败:', error);
        }
      });
    } else if (this.showDefaultCopyMessage) {
      // 如果没有回调且允许显示默认消息，则显示默认成功消息
      message.success('复制成功');
    }
  }

  /**
   * 设置是否显示默认的复制成功消息
   */
  public setShowDefaultCopyMessage(show: boolean): void {
    this.showDefaultCopyMessage = show;
  }

  /**
   * 获取当前回调数量
   */
  public getCopyCallbackCount(): number {
    return this.copyCallbacks.size;
  }
}

// 导出单例实例
export const globalFunctionManager = GlobalFunctionManager.getInstance();

// 全局函数声明
declare global {
  interface Window {
    handleClipboard: (
      span: HTMLElement,
      callback?: (context: string) => void,
    ) => void;
    showImageInModal: (src: string) => void;
    toggleCodeCollapse: (button: HTMLElement) => void;
  }
}
