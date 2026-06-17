/**
 * 导航风格调试工具
 * 用于诊断 navigationStyle 相关的问题
 */

import { unifiedThemeService } from '@/services/unifiedThemeService';
import { ThemeNavigationStyleType } from '@/types/enums/theme';

export class NavigationStyleDebugger {
  /**
   * 打印当前导航风格状态
   */
  static printCurrentState(): void {
    const currentData = unifiedThemeService.getCurrentData();
    const currentStyle = currentData.navigationStyle;
    const currentConfigKey = `${currentData.layoutStyle}-${currentData.navigationStyle}`;

    console.group('🔍 NavigationStyle Debug Info');
    console.log('Current navigation style:', currentStyle);
    console.log('Current config key:', currentConfigKey);
    console.log('Is STYLE1:', currentStyle === ThemeNavigationStyleType.STYLE1);
    console.log('Is STYLE2:', currentStyle === ThemeNavigationStyleType.STYLE2);
    console.log(
      'Text to display:',
      currentStyle === ThemeNavigationStyleType.STYLE2,
    );
    console.groupEnd();
  }

  /**
   * 切换导航风格并打印状态
   */
  static async toggleAndDebug(): Promise<void> {
    console.group('🔄 Switch Navigation Style');
    console.log('State before switch:');
    this.printCurrentState();

    // 使用统一主题服务切换导航风格
    const currentData = unifiedThemeService.getCurrentData();
    const newStyle =
      currentData.navigationStyle === ThemeNavigationStyleType.STYLE1
        ? ThemeNavigationStyleType.STYLE2
        : ThemeNavigationStyleType.STYLE1;
    await unifiedThemeService.updateNavigationStyle(newStyle);

    console.log('State after switch:');
    this.printCurrentState();
    console.groupEnd();
  }

  /**
   * 检查 DOM 元素状态
   */
  static checkDOMElements(): void {
    console.group('🌐 DOM Element Check');

    // 检查所有 TabItem 元素
    const tabItems = document.querySelectorAll('[class*="box"]');
    console.log('Number of TabItem elements found:', tabItems.length);

    tabItems.forEach((item, index) => {
      const textElement = item.querySelector('[class*="text"]');
      const computedStyle = textElement
        ? window.getComputedStyle(textElement)
        : null;

      console.log(`TabItem ${index + 1}:`, {
        element: item,
        textElement: textElement,
        display: computedStyle?.display,
        visibility: computedStyle?.visibility,
        opacity: computedStyle?.opacity,
        hasStyle1: item.classList.contains('style1'),
        hasStyle2: item.classList.contains('style2'),
      });
    });

    console.groupEnd();
  }

  /**
   * 完整的诊断报告
   */
  static fullDiagnosis(): void {
    console.group('📊 NavigationStyle Full Diagnosis');
    this.printCurrentState();
    this.checkDOMElements();
    console.groupEnd();
  }
}

// 在开发环境下暴露到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).NavigationStyleDebugger = NavigationStyleDebugger;
}
