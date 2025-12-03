import { ElementInfo } from '@/pages/AppDev/components/DesignViewer/messages';
import {
  mapTailwindBorderStyleToLocal,
  parseTailwindBorderWidth,
} from '@/pages/AppDev/components/DesignViewer/utils/tailwind-border';
import { getColorFromTailwindClass } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-color';
import { FONT_WEIGHT_REGEXP } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-fontWeight';
import { parseTailwindOpacity } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-opacity';
import { tailwindRadiusMap } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-radius';
import { tailwindShadowMap } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-shadow';
import { SpaceValueType } from '@/pages/AppDev/components/DesignViewer/utils/tailwind-space';
import { useState } from 'react';

export default () => {
  // 是否开启design模式
  const [iframeDesignMode, setIframeDesignMode] = useState<boolean>(false);
  // iframe是否加载完毕
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  /** 选中的元素, 用于标识当前选中的元素, 包含className, sourceInfo, tagName, textContent等信息*/
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(
    null,
  );
  // 字体颜色值
  const [localColor, setLocalColor] = useState<string>('Default');
  /** 背景颜色值 */
  const [localBackground, setLocalBackground] = useState<string>('Default');
  /** 外边距值 */
  const [localMargin, setLocalMargin] = useState<SpaceValueType>({
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  });
  /** 本地内边距 */
  const [localPadding, setLocalPadding] = useState<SpaceValueType>({
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  });
  /** 编辑中的文本内容 */
  const [localTextContent, setLocalTextContent] = useState<string>('');
  /** 编辑中的排版 */
  // const [localTypography, setLocalTypography] = useState('Default');
  /** 编辑中的字体粗细 */
  // fontWeight 存储 Tailwind 类名（如 'font-medium'）
  const [fontWeight, setFontWeight] = useState<string>('font-medium');
  /** 编辑中的字体大小 */
  const [fontSize, setFontSize] = useState<string>('Default');
  /** 编辑中的行高 */
  const [lineHeight, setLineHeight] = useState<string>('1.75rem');
  /** 编辑中的字母间距 */
  const [letterSpacing, setLetterSpacing] = useState<string>('0em');
  /** 编辑中的文本对齐方式 */
  const [textAlign, setTextAlign] = useState<
    'left' | 'center' | 'right' | 'justify' | 'reset' | ''
  >('');
  /** 编辑中的文本装饰 */
  // const [textDecoration, setTextDecoration] = useState<string[]>([]);
  /** 编辑中的边框样式 */
  // borderStyle 存储 Tailwind 类名（如 'border-solid'）或 'Default'
  const [borderStyle, setBorderStyle] = useState<string>('Default');
  /** 编辑中的边框颜色 */
  const [borderColor, setBorderColor] = useState<string>('Default');
  /** 编辑中的边框宽度 */
  const [localBorderWidth, setLocalBorderWidth] = useState<SpaceValueType>({
    top: '0', // 使用 Tailwind 边框宽度值
    right: '0',
    bottom: '0',
    left: '0',
  });
  /** 编辑中的透明度 */
  const [opacity, setOpacity] = useState<number>(100);
  /** 编辑中的圆角 */
  const [radius, setRadius] = useState<string>('None');
  /** 编辑中的阴影类型 */
  const [shadowType, setShadowType] = useState<string>('None');

  // 待处理的变更
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      type: 'style' | 'content';
      sourceInfo: any;
      newValue: string;
      originalValue?: string;
    }>
  >([]);

  /**
   * 从样式字符串中解析数值（支持px、em、rem等单位）
   * @param value 样式值字符串，如 "16px", "1rem", "0" 等
   * @returns 解析后的数值（字符串形式，保留单位）或 "0px"
   */
  const parseStyleValue = (value: string | null | undefined): string => {
    if (!value || value === '0' || value === '0px') return '0px';
    // 如果已经是带单位的字符串，直接返回
    if (typeof value === 'string' && /^\d+(\.\d+)?(px|em|rem|%)$/.test(value)) {
      return value;
    }
    // 如果是纯数字，添加px单位
    if (/^\d+(\.\d+)?$/.test(value)) {
      return `${value}px`;
    }
    return value || '0px';
  };

  /**
   * 从 Tailwind 类名中解析间距值
   * @param className Tailwind 类名，如 "p-4", "m-2", "px-8" 等
   * @returns 对应的 CSS 值，如 "1rem", "0.5rem" 等
   */
  const parseTailwindSpacing = (className: string): string => {
    // 匹配类名中的数字部分，如 "p-4" 中的 "4"
    const match = className.match(/-(\d+(?:\.\d+)?|px)$/);
    if (match) {
      const value = match[1];
      return value.toString();
    }
    return '0';
  };

  /**
   * 从计算样式对象中解析并更新本地状态
   * @param computedStyles 计算样式对象
   */
  const updateLocalStatesFromStyles = (computedStyles: {
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    color?: string;
    backgroundColor?: string;
  }) => {
    // 更新padding（只要存在任何一个padding属性就更新）
    if (
      computedStyles.paddingTop !== undefined ||
      computedStyles.paddingRight !== undefined ||
      computedStyles.paddingBottom !== undefined ||
      computedStyles.paddingLeft !== undefined
    ) {
      setLocalPadding({
        top: parseStyleValue(computedStyles.paddingTop),
        right: parseStyleValue(computedStyles.paddingRight),
        bottom: parseStyleValue(computedStyles.paddingBottom),
        left: parseStyleValue(computedStyles.paddingLeft),
      });
    }

    // 更新margin（只要存在任何一个margin属性就更新）
    if (
      computedStyles.marginTop !== undefined ||
      computedStyles.marginRight !== undefined ||
      computedStyles.marginBottom !== undefined ||
      computedStyles.marginLeft !== undefined
    ) {
      setLocalMargin({
        top: parseStyleValue(computedStyles.marginTop),
        right: parseStyleValue(computedStyles.marginRight),
        bottom: parseStyleValue(computedStyles.marginBottom),
        left: parseStyleValue(computedStyles.marginLeft),
      });
    }

    // 更新color
    if (computedStyles.color !== undefined) {
      setLocalColor(computedStyles.color);
    }

    // 更新background
    if (computedStyles.backgroundColor !== undefined) {
      // 这里可以根据需要处理背景色
      // setLocalBackground(computedStyles.backgroundColor);
    }
  };

  // 重置本地状态
  const resetLocalStates = () => {
    // 解析className中的 Tailwind 类名前，先重置本地状态
    setLocalColor('Default');
    setLocalBackground('Default');
    setShadowType('None');
    setRadius('None');
    setOpacity(100);
    setBorderStyle('Default');
    setBorderColor('Default');
    setFontSize('Default');
    setFontWeight('font-medium'); // 重置为默认字体粗细
    setLineHeight('1.75rem');
    setLetterSpacing('0em');
    setTextAlign('');
    setLocalBorderWidth({
      top: '0', // 使用 Tailwind 边框宽度值
      right: '0',
      bottom: '0',
      left: '0',
    });
    setLocalPadding({
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    });
    setLocalMargin({
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    });
    setLocalBorderWidth({
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
    });
  };

  /**
   * 从 Tailwind 类名中解析颜色值
   * @param className Tailwind 类名，如 "text-red-500", "bg-blue-600" 等
   * @returns 对应的颜色值（需要从实际 CSS 中获取，这里返回类名用于后续处理）
   */
  const parseTailwindColor = (className: string): string | null => {
    // 匹配颜色类名，如 "text-red-500", "bg-blue-600"
    const colorMatch = className.match(/^(text|bg)-(.+)$/);
    if (colorMatch) {
      return className; // 返回完整类名，后续可以从 CSS 中获取实际颜色值
    }
    return null;
  };

  /**
   * 从 Tailwind 阴影类名映射到本地阴影类型
   * @param className Tailwind 阴影类名，如 "shadow-sm", "shadow-lg" 等
   * @returns 对应的阴影类型值
   */
  const mapTailwindShadowToLocal = (className: string): string | null => {
    return tailwindShadowMap[className] || null;
  };

  /**
   * 从 Tailwind 圆角类名映射到本地圆角类型
   * @param className Tailwind 圆角类名，如 "rounded-sm", "rounded-lg" 等
   * @returns 对应的圆角类型值
   */
  const mapTailwindRadiusToLocal = (className: string): string | null => {
    return tailwindRadiusMap[className] || null;
  };

  /**
   * 从 Tailwind CSS 类名中解析样式并更新本地状态
   * @param className 元素的 className 字符串，可能包含多个 Tailwind 类名
   */
  const parseTailwindClassesAndUpdateStates = (className: string) => {
    // 重置本地状态
    resetLocalStates();

    if (!className) return;

    // 将 className 拆分成单个类名
    const classes = className.split(/\s+/).filter((c) => c.trim());

    // 初始化样式对象
    const styles: {
      paddingTop?: string;
      paddingRight?: string;
      paddingBottom?: string;
      paddingLeft?: string;
      marginTop?: string;
      marginRight?: string;
      marginBottom?: string;
      marginLeft?: string;
      color?: string;
      backgroundColor?: string;
    } = {};

    // 用于存储需要更新的其他属性
    let shadowValue: string | null = null;
    let radiusValue: string | null = null;
    let opacityValue: number | null = null;
    let borderWidthValue: string | null = null;
    let borderStyleValue: string | null = null;
    let fontWeightValue: string | null = null;
    // let borderColorValue: string | null = null;

    // 遍历每个类名，解析样式
    classes.forEach((cls) => {
      const value = parseTailwindSpacing(cls);
      // 解析 Padding 类名
      if (cls.startsWith('p-')) {
        styles.paddingTop = value;
        styles.paddingRight = value;
        styles.paddingBottom = value;
        styles.paddingLeft = value;
      } else if (cls.startsWith('px-')) {
        styles.paddingLeft = value;
        styles.paddingRight = value;
      } else if (cls.startsWith('py-')) {
        styles.paddingTop = value;
        styles.paddingBottom = value;
      } else if (cls.startsWith('pt-')) {
        styles.paddingTop = value;
      } else if (cls.startsWith('pr-')) {
        styles.paddingRight = value;
      } else if (cls.startsWith('pb-')) {
        styles.paddingBottom = value;
      } else if (cls.startsWith('pl-')) {
        styles.paddingLeft = value;
      }
      // 解析 Margin 类名
      else if (cls.startsWith('m-')) {
        styles.marginTop = value;
        styles.marginRight = value;
        styles.marginBottom = value;
        styles.marginLeft = value;
      } else if (cls.startsWith('mx-')) {
        styles.marginLeft = value;
        styles.marginRight = value;
      } else if (cls.startsWith('my-')) {
        styles.marginTop = value;
        styles.marginBottom = value;
      } else if (cls.startsWith('mt-')) {
        styles.marginTop = value;
      } else if (cls.startsWith('mr-')) {
        styles.marginRight = value;
      } else if (cls.startsWith('mb-')) {
        styles.marginBottom = value;
      } else if (cls.startsWith('ml-')) {
        styles.marginLeft = value;
      }
      // 解析 Shadow 类名
      else if (cls.startsWith('shadow')) {
        const mapped = mapTailwindShadowToLocal(cls);
        if (mapped) {
          shadowValue = mapped;
        }
      }
      // 解析 Radius 类名
      else if (cls.startsWith('rounded')) {
        const mapped = mapTailwindRadiusToLocal(cls);
        if (mapped) {
          radiusValue = mapped;
        }
      }
      // 解析 Opacity 类名
      else if (cls.startsWith('opacity-')) {
        const parsed = parseTailwindOpacity(cls);
        if (parsed !== null) {
          opacityValue = parsed;
        }
      }
      // 解析 Border Width 类名
      else if (cls.startsWith('border-') && /^border-(\d+|0|none)$/.test(cls)) {
        const parsed = parseTailwindBorderWidth(cls);
        if (parsed !== null) {
          borderWidthValue = parsed;
        }
      } else if (cls === 'border') {
        borderWidthValue = '1px';
      }
      // 解析 Border Style 类名
      else if (
        cls === 'border-solid' ||
        cls === 'border-dashed' ||
        cls === 'border-dotted' ||
        cls === 'border-none'
      ) {
        const mapped = mapTailwindBorderStyleToLocal(cls);
        if (mapped) {
          borderStyleValue = mapped;
        }
      }
      // 解析 Border Color 类名
      else if (
        cls.startsWith('border-') &&
        !cls.match(/^border-(\d+|0|none|solid|dashed|dotted)$/)
      ) {
        // border-{color} 格式，如 border-red-500
        const colorClass = cls;
        getColorFromTailwindClass(colorClass, (color) => {
          if (color) {
            setBorderColor(color);
          }
        });
      }
      // 解析颜色类名（需要从实际 CSS 中获取颜色值）
      else if (cls.startsWith('text-')) {
        // 尝试从 iframe 中获取实际颜色值
        const colorClass = parseTailwindColor(cls);
        if (colorClass) {
          // 这里可以尝试从 CSS 中获取实际颜色值
          // 暂时先保存类名，后续可以通过计算样式获取
          getColorFromTailwindClass(colorClass, (color) => {
            if (color) {
              setLocalColor(color);
            }
          });
        }
      } else if (cls.startsWith('bg-')) {
        const colorClass = parseTailwindColor(cls);
        if (colorClass) {
          getColorFromTailwindClass(colorClass, (color) => {
            if (color) {
              setLocalBackground(color);
            }
          });
        }
      }
      // 解析 Font Weight 类名
      else if (cls.startsWith('font-')) {
        // 匹配 font-thin, font-light, font-normal, font-medium, font-semibold, font-bold, font-extrabold, font-black
        if (FONT_WEIGHT_REGEXP.test(cls)) {
          fontWeightValue = cls;
        }
      }
    });

    // 如果有解析到的样式，更新状态
    if (Object.keys(styles).length > 0) {
      updateLocalStatesFromStyles(styles);
    }

    // 更新 Shadow
    if (shadowValue !== null) {
      setShadowType(shadowValue);
    }

    // 更新 Radius
    if (radiusValue !== null) {
      setRadius(radiusValue);
    }

    // 更新 Opacity
    if (opacityValue !== null) {
      setOpacity(opacityValue);
    }

    // 更新 Border Width
    if (borderWidthValue !== null) {
      setLocalBorderWidth((prev) => ({
        ...prev,
        top: borderWidthValue as string,
        right: borderWidthValue as string,
        bottom: borderWidthValue as string,
        left: borderWidthValue as string,
      }));
    }

    // 更新 Border Style
    if (borderStyleValue !== null) {
      setBorderStyle(borderStyleValue);
    }

    // 更新 Font Weight
    if (fontWeightValue !== null) {
      setFontWeight(fontWeightValue);
    }
  };

  return {
    iframeDesignMode,
    setIframeDesignMode,
    isIframeLoaded,
    setIsIframeLoaded,
    selectedElement,
    setSelectedElement,
    pendingChanges,
    setPendingChanges,
    localColor,
    setLocalColor,
    localBackground,
    setLocalBackground,
    localMargin,
    setLocalMargin,
    localPadding,
    setLocalPadding,
    localTextContent,
    setLocalTextContent,
    fontWeight,
    setFontWeight,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing,
    textAlign,
    setTextAlign,
    borderStyle,
    setBorderStyle,
    borderColor,
    setBorderColor,
    localBorderWidth,
    setLocalBorderWidth,
    opacity,
    setOpacity,
    radius,
    setRadius,
    shadowType,
    setShadowType,
    parseTailwindClassesAndUpdateStates,
  };
};
