import SelectList from '@/components/custom/SelectList';
import {
  CompressOutlined,
  ExpandOutlined,
  LockOutlined,
  MoreOutlined,
  ThunderboltOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Dropdown, Input, Select, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import {
  AlignCenterSvg,
  AlignJustifySvg,
  AlignLeftSvg,
  AlignRightSvg,
  BorderBottomSvg,
  BorderColorSvg,
  BorderLeftSvg,
  BorderRightSvg,
  BorderTopSvg,
  BorderWidthSvg,
  MarginBottomSvg,
  MarginHorizontalSvg,
  MarginLeftSvg,
  MarginRightSvg,
  MarginTopSvg,
  MarginVerticalSvg,
  OpacitySvg,
  // OverlineSvg,
  PaddingBottomSvg,
  PaddingHorizontalSvg,
  PaddingLeftSvg,
  PaddingRightSvg,
  PaddingTopSvg,
  PaddingVerticalSvg,
  RadiusSvg,
  ResetSvg,
  ShadowSvg,
} from './design.images.constants';
import styles from './index.less';
import { ElementInfo } from './messages';
import {
  generateTailwindBorderStyleOptions,
  generateTailwindBorderWidthOptions,
} from './utils/tailwind-border';
import {
  generateFullTailwindColorOptions,
  getColorFromTailwindClass,
} from './utils/tailwind-color';
import { generateTailwindFontSizeOptions } from './utils/tailwind-fontSize';
import { generateTailwindOpacityOptions } from './utils/tailwind-opacity';
import {
  generateTailwindRadiusOptions,
  tailwindRadiusMap,
} from './utils/tailwind-radius';
import {
  generateTailwindShadowOptions,
  tailwindShadowMap,
} from './utils/tailwind-shadow';
import { generateTailwindSpacingPixelOptions } from './utils/tailwind-space';

const cx = classNames.bind(styles);

/**
 * 像素值选项列表 - 从 Tailwind CSS spacing 配置中获取
 * 基于 Tailwind CSS 默认 spacing 配置（用于 padding 和 margin）
 * 包含所有标准的 Tailwind spacing 值：0, 1px, 2px, 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 28px, 32px, 36px, 40px, 44px, 48px, 56px, 64px, 80px, 96px, 112px, 128px, 144px, 160px, 176px, 192px, 208px, 224px, 240px, 256px, 288px, 320px, 384px, auto
 */
const pixelOptions = generateTailwindSpacingPixelOptions(true);

/**
 * Padding 像素值选项列表（不包含 auto）
 */
const paddingPixelOptions = pixelOptions.filter(
  (option) => option.value !== 'auto',
);

/**
 * Border Width 选项列表 - 从 Tailwind CSS 边框宽度配置中获取
 * 基于 Tailwind CSS 默认边框宽度配置
 * 包含：0px (border-0), 1px (border), 2px (border-2), 4px (border-4), 8px (border-8)
 */
const borderWidthOptions = generateTailwindBorderWidthOptions();

/**
 * Tailwind CSS 颜色选项列表
 * 包含所有颜色和所有色阶（50-950）
 */
const colorOptions = generateFullTailwindColorOptions();

// Radius 选项 - 从 Tailwind CSS 生成
const radiusOptions = generateTailwindRadiusOptions();

// Shadow 选项 - 从 Tailwind CSS 生成
const shadowOptions = generateTailwindShadowOptions();

// Opacity 选项 - 从 Tailwind CSS 生成
const opacityOptions = generateTailwindOpacityOptions();

// Font Size 选项 - 从 Tailwind CSS 生成
const fontSizeOptions = generateTailwindFontSizeOptions();

// 更多操作菜单
const moreMenuItems = [
  { key: 'copy', label: '复制属性' },
  { key: 'reset', label: '重置' },
  { key: 'delete', label: '删除' },
];

// Typography 选项
// const typographyOptions = [
//   { label: 'Default', value: 'Default' },
//   { label: 'Sans Serif', value: 'Sans Serif' },
//   { label: 'Serif', value: 'Serif' },
//   { label: 'Monospace', value: 'Monospace' },
// ];

// Font Weight 选项
const fontWeightOptions = [
  { label: 'Thin', value: 'Thin' },
  { label: 'Light', value: 'Light' },
  { label: 'Regular', value: 'Regular' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Semi Bold', value: 'Semi Bold' },
  { label: 'Bold', value: 'Bold' },
  { label: 'Extra Bold', value: 'Extra Bold' },
];

// Line Height 选项
const lineHeightOptions = [
  { label: '0.75rem', value: '0.75rem' },
  { label: '1rem', value: '1rem' },
  { label: '1.25rem', value: '1.25rem' },
  { label: '1.5rem', value: '1.5rem' },
  { label: '1.75rem', value: '1.75rem' },
  { label: '2rem', value: '2rem' },
  { label: '2.25rem', value: '2.25rem' },
  { label: '2.5rem', value: '2.5rem' },
];

// Letter Spacing 选项
const letterSpacingOptions = [
  { label: '-0.05em', value: '-0.05em' },
  { label: '-0.025em', value: '-0.025em' },
  { label: '0em', value: '0em' },
  { label: '0.025em', value: '0.025em' },
  { label: '0.05em', value: '0.05em' },
  { label: '0.1em', value: '0.1em' },
];

/**
 * Border Style 选项列表 - 从 Tailwind CSS 边框样式配置中获取
 * 基于 Tailwind CSS 默认边框样式配置
 * 包含：None (border-none), Solid (border-solid), Dashed (border-dashed), Dotted (border-dotted), Double (border-double)
 */
const borderStyleOptions = generateTailwindBorderStyleOptions();

/**
 * 设计查看器组件
 * 提供元素属性编辑面板，包括图标、颜色、背景、布局、尺寸和边框等配置
 */
const DesignViewer: React.FC = () => {
  // 字体颜色值
  const [localColor, setLocalColor] = useState<string>('Default');
  /** 背景颜色值 */
  const [localBackground, setLocalBackground] = useState<string>('Default');
  /** 外边距值 */
  const [localMargin, setLocalMargin] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  }>({
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  });
  /** 本地内边距 */
  const [localPadding, setLocalPadding] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  }>({
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  });
  /** 是否锁定外边距 */
  const [isMarginLocked, setIsMarginLocked] = useState(true);
  /** 是否锁定内边距 */
  const [isPaddingLocked, setIsPaddingLocked] = useState(true);
  /** 是否展开外边距 */
  const [isMarginExpanded, setIsMarginExpanded] = useState(false);
  /** 是否展开内边距 */
  const [isPaddingExpanded, setIsPaddingExpanded] = useState(false);
  /** 编辑中的文本内容 */
  const [localTextContent, setLocalTextContent] = useState('');
  /** 编辑中的排版 */
  // const [localTypography, setLocalTypography] = useState('Default');
  /** 编辑中的字体粗细 */
  const [fontWeight, setFontWeight] = useState('Semi Bold');
  /** 编辑中的字体大小 */
  const [fontSize, setFontSize] = useState('lg');
  /** 编辑中的行高 */
  const [lineHeight, setLineHeight] = useState('1.75rem');
  /** 编辑中的字母间距 */
  const [letterSpacing, setLetterSpacing] = useState<string>('0em');
  /** 编辑中的文本对齐方式 */
  const [textAlign, setTextAlign] = useState<
    'left' | 'center' | 'right' | 'justify' | 'reset'
  >('center');
  /** 编辑中的文本装饰 */
  // const [textDecoration, setTextDecoration] = useState<string[]>([]);
  /** 编辑中的边框样式 */
  // borderStyle 存储 Tailwind 类名（如 'border-solid'）或 'Default'
  const [borderStyle, setBorderStyle] = useState<string>('Default');
  /** 编辑中的边框颜色 */
  const [borderColor, setBorderColor] = useState('Default');
  /** 编辑中的边框宽度 */
  const [localBorderWidth, setLocalBorderWidth] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  }>({
    top: '0', // 使用 Tailwind 边框宽度值
    right: '0',
    bottom: '0',
    left: '0',
  });
  /** 是否展开边框宽度 */
  const [isBorderWidthExpanded, setIsBorderWidthExpanded] =
    useState<boolean>(false);
  /** 编辑中的透明度 */
  const [opacity, setOpacity] = useState<number>(100);
  /** 编辑中的圆角 */
  const [radius, setRadius] = useState<string>('Small');
  /** 编辑中的阴影类型 */
  const [shadowType, setShadowType] = useState<string>('Default');

  /** 选中的元素, 用于标识当前选中的元素, 包含className, sourceInfo, tagName, textContent等信息*/
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(
    null,
  );
  // 编辑中的内容(textContent)
  const [editingContent, setEditingContent] = useState<string>('');
  // 编辑中的类
  const [editingClass, setEditingClass] = useState<string>('');

  const { iframeDesignMode, setIframeDesignMode, setPendingChanges } =
    useModel('appDev');

  /**
   * 判断当前选中的元素是否可以编辑「文本内容」
   *
   * 规则：
   * 1. 本身标签必须是可编辑文本的标签（不是 img/input 等）
   * 2. 如果元素内部还有子元素（不仅仅是纯文本），也认为不可编辑，避免误改一整块区域的文本
   *
   * @param element 当前选中的元素信息
   * @returns 是否可以编辑文本内容
   */
  const canEditTextContent = (element?: ElementInfo | null): boolean => {
    if (!element?.tagName) return false;

    // 如果包含子元素，认为是复杂结构，不允许直接改整块文本
    // 说明：hasChildElement 需要在 iframe 中选中元素时通过 element.childElementCount > 0 计算后传入
    if (!element.contenteditable) {
      return false;
    }

    const tag = element.tagName.toLowerCase();

    // 不能编辑文本的元素
    const nonEditableTags = [
      'img',
      'br',
      'hr',
      'input',
      'textarea',
      'select',
      'iframe',
      'video',
      'audio',
      'svg',
      'canvas',
      'embed',
      'object',
      'param',
      'source',
      'track',
      'area',
      'base',
      'col',
      'colgroup',
      'meta',
      'link',
      'script',
      'style',
      'noscript',
      'template',
    ];

    // 如果是不支持编辑的标签，返回 false
    if (nonEditableTags.includes(tag)) {
      return false;
    }

    // 其他标签通常可以编辑文本内容
    return true;
  };

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
      // return tailwindSpacingMap[value] || `${parseFloat(value) * 0.25}rem`;
    }
    // // 处理特殊值 "px"
    // if (className.endsWith('-px')) {
    //   return '1px';
    // }
    // // 处理 "0"
    // if (className.endsWith('-0')) {
    //   return '0px';
    // }
    return '0';
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
   * 从 Tailwind 透明度类名解析透明度百分比
   * @param className Tailwind 透明度类名，如 "opacity-50", "opacity-75" 等
   * @returns 透明度百分比 (0-100)
   */
  const parseTailwindOpacity = (className: string): number | null => {
    const match = className.match(/^opacity-(\d+)$/);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= 0 && value <= 100) {
        return value;
      }
    }
    return null;
  };

  /**
   * 从 Tailwind 边框宽度类名解析边框宽度
   * @param className Tailwind 边框宽度类名，如 "border-2", "border-4" 等
   * @returns 边框宽度值
   */
  const parseTailwindBorderWidth = (className: string): string | null => {
    if (className === 'border-0' || className === 'border-none') {
      return '0'; // 返回 Tailwind 边框宽度值
    }
    if (className === 'border') {
      return '1'; // border 默认是 1px，返回 Tailwind 边框宽度值 '1'
    }
    const match = className.match(/^border-(\d+)$/);
    if (match) {
      return match[1]; // 返回 Tailwind 边框宽度值（如 '2', '4', '8'）
    }
    return null;
  };

  /**
   * 从 Tailwind 边框样式类名映射到本地边框样式
   * @param className Tailwind 边框样式类名，如 "border-solid", "border-dashed" 等
   * @returns 对应的边框样式值
   */
  /**
   * 从 Tailwind 边框样式类名映射到本地边框样式值
   * @param className Tailwind 边框样式类名，如 "border-solid", "border-dashed" 等
   * @returns 对应的边框样式值（Tailwind 类名）
   */
  const mapTailwindBorderStyleToLocal = (className: string): string | null => {
    const styleMap: Record<string, string> = {
      'border-none': 'border-none',
      'border-solid': 'border-solid',
      'border-dashed': 'border-dashed',
      'border-dotted': 'border-dotted',
      'border-double': 'border-double',
    };
    return styleMap[className] || null;
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

  /**
   * 从 Tailwind CSS 类名中解析样式并更新本地状态
   * @param className 元素的 className 字符串，可能包含多个 Tailwind 类名
   */
  const parseTailwindClassesAndUpdateStates = (className: string) => {
    // 解析className中的 Tailwind 类名前，先重置本地状态
    setLocalColor('Default');
    setLocalBackground('Default');
    setShadowType('None');
    setRadius('None');
    setOpacity(100);
    setBorderStyle('Default');
    setBorderColor('Default');
    setFontSize('Default');
    setLineHeight('1.5');
    setLetterSpacing('0em');
    setTextAlign('left');
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

    if (!className) return;

    // 将 className 拆分成单个类名
    const classes = className.split(/\s+/).filter((c) => c.trim());

    console.log('classes555', classes);

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
              console.log('解析颜色类名（需要从实际 CSS 中获取颜色值）', color);
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
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'DESIGN_MODE_CHANGED':
          setIframeDesignMode(event.data.enabled);
          break;

        case 'ELEMENT_SELECTED':
          console.log('[Parent] Element selected - full payload:', payload);

          // 验证 sourceInfo 是否有效
          if (
            !payload.elementInfo?.sourceInfo ||
            !payload.elementInfo.sourceInfo.fileName ||
            payload.elementInfo.sourceInfo.lineNumber === 0
          ) {
            // console.warn(
            //   '[Parent] Invalid sourceInfo received:',
            //   payload.elementInfo?.sourceInfo
            // );
            // console.warn('[Parent] This may cause update operations to fail');
          }

          setSelectedElement(payload.elementInfo);
          setEditingContent(payload.elementInfo.textContent);
          setEditingClass(payload.elementInfo.className);

          // 判断元素是否可以编辑文本内容，如果可以则回显到 Text Content 编辑框
          if (canEditTextContent(payload.elementInfo)) {
            setLocalTextContent(payload.elementInfo.textContent || '');
          } else {
            // 如果不能编辑，清空 Text Content 编辑框
            setLocalTextContent('');
          }

          // 从 className 中解析 Tailwind CSS 类名并更新状态
          if (payload.elementInfo.className) {
            parseTailwindClassesAndUpdateStates(payload.elementInfo.className);
          }

          // 如果elementInfo包含computedStyles，直接使用（优先级高于 Tailwind 解析）
          if (payload.elementInfo.computedStyles) {
            updateLocalStatesFromStyles(payload.elementInfo.computedStyles);
          }
          break;

        case 'ELEMENT_DESELECTED':
          setSelectedElement(null);
          console.log('[Parent] Element deselected');
          break;

        case 'CONTENT_UPDATED':
          console.log('[Parent] Content updated:', payload);
          break;

        case 'STYLE_UPDATED':
          console.log('[Parent] Style updated:', payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Debounce hook
  const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedContent = useDebounce(editingContent, 300);
  const debouncedClass = useDebounce(editingClass, 300);

  // Upsert pending change
  const upsertPendingChange = (
    type: 'style' | 'content',
    newValue: string,
    originalValue?: string,
  ) => {
    if (!selectedElement) return;
    setPendingChanges((prev: any) => {
      const existingIndex = prev.findIndex(
        (item: any) =>
          item.type === type &&
          item.sourceInfo.fileName === selectedElement.sourceInfo.fileName &&
          item.sourceInfo.lineNumber === selectedElement.sourceInfo.lineNumber,
      );

      const newChange = {
        type,
        sourceInfo: selectedElement.sourceInfo,
        newValue,
        originalValue:
          originalValue ||
          (type === 'style'
            ? selectedElement.className
            : selectedElement.textContent),
      };

      if (existingIndex >= 0) {
        const newList = [...prev];
        newList[existingIndex] = newChange;
        return newList;
      } else {
        return [...prev, newChange];
      }
    });
  };

  // Real-time content update
  useEffect(() => {
    if (!selectedElement || debouncedContent === selectedElement.textContent)
      return;

    upsertPendingChange('content', debouncedContent);

    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'UPDATE_CONTENT',
          payload: {
            sourceInfo: selectedElement.sourceInfo,
            newContent: debouncedContent,
            persist: false,
          },
          timestamp: Date.now(),
        },
        '*',
      );
    }
  }, [debouncedContent]);

  // Real-time style update
  useEffect(() => {
    if (!selectedElement || debouncedClass === selectedElement.className)
      return;

    upsertPendingChange('style', debouncedClass);

    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'UPDATE_STYLE',
          payload: {
            sourceInfo: selectedElement.sourceInfo,
            newClass: debouncedClass,
            persist: false,
          },
          timestamp: Date.now(),
        },
        '*',
      );
    }
  }, [debouncedClass]);

  // Style Manager Logic
  const toggleStyle = (newStyle: string, categoryRegex: RegExp) => {
    let currentClasses = editingClass.split(' ').filter((c) => c.trim());

    // 获取字体大小相关的类名列表（从 fontSizeOptions 中提取）
    // fontSizeOptions 中的 value 是 'xs', 'sm' 等，需要转换为 'text-xs', 'text-sm' 等
    const fontSizeClasses = fontSizeOptions
      .filter((option) => option.value !== 'Default')
      .map((option) => `text-${option.value}`);

    // Remove existing class in the same category
    // 排除字体大小相关的类（如 text-xs, text-sm 等）
    currentClasses = currentClasses.filter((c) => {
      // 如果是字体大小相关的类，不进行过滤
      if (fontSizeClasses.includes(c) || c.includes('text-center')) {
        return true;
      }
      // 其他类按原来的逻辑过滤
      return !categoryRegex.test(c);
    });

    // Add new style if it's not empty (allows clearing style)
    if (newStyle) {
      currentClasses.push(newStyle);
    }

    setEditingClass(currentClasses.join(' '));
  };

  // const hasStyle = (style: string) => {
  //   return editingClass.split(' ').includes(style);
  // };

  /**
   * 处理Typography变更
   */
  // const handleTypographyChange = (value: string) => {
  //   setLocalTypography(value);
  //   onChange?.('typography', value);
  // };

  /**
   * 处理文本内容变更
   */
  const handleTextContentChange = (value: string) => {
    setLocalTextContent(value);
    // 同时更新 editingContent，用于实时更新到 iframe
    setEditingContent(value);
    // onChange?.('textContent', value);
  };

  /**
   * 处理颜色切换
   */
  const handleToggleColor = (prefix: string, color: string) => {
    const itemColor = colorOptions.find((item) => item.value === color);
    const styleClass = `${prefix}-${itemColor?.label}`;
    toggleStyle(styleClass, new RegExp(`^${prefix}-[a-z]+(-\\d+)?$`));
  };

  /**
   * 处理文本颜色变更
   */
  const handleColorChange = (color: string) => {
    setLocalColor(color);
    handleToggleColor('text', color);
  };

  /**
   * 处理边框颜色变更
   */
  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);
    handleToggleColor('border', color);
  };

  /**
   * 处理背景变更
   */
  const handleBackgroundChange = (color: string) => {
    setLocalBackground(color);
    handleToggleColor('bg', color);
  };

  /**
   * 处理外边距变更（四边独立）
   */
  const handleMarginChange = (
    type:
      | 'top'
      | 'right'
      | 'bottom'
      | 'left'
      | 'vertical'
      | 'horizontal'
      | 'all',
    value: string | null,
  ) => {
    const newMargin = { ...localMargin };
    if (value !== null) {
      let prefix = 'm';
      if (type === 'all') {
        // 统一设置所有边
        newMargin.top = value;
        newMargin.right = value;
        newMargin.bottom = value;
        newMargin.left = value;
      } else if (type === 'vertical') {
        prefix = 'my';
        newMargin.top = value;
        newMargin.bottom = value;
      } else if (type === 'horizontal') {
        prefix = 'mx';
        newMargin.left = value;
        newMargin.right = value;
      } else {
        switch (type) {
          case 'top':
            prefix = 'mt';
            break;
          case 'right':
            prefix = 'mr';
            break;
          case 'bottom':
            prefix = 'mb';
            break;
          case 'left':
            prefix = 'ml';
            break;
        }
        newMargin[type] = value;
      }
      setLocalMargin(newMargin);
      // onChange?.('margin', newMargin);

      // value 已经是 Tailwind spacing 值（如 '40'），直接使用
      // 正则表达式：精确匹配相同前缀的 margin 类名
      // 例如：m- 只匹配 m-*，不匹配 mx-*、my-*、mt-* 等
      // mx- 只匹配 mx-*，不匹配 m-*、my-*、mt-* 等
      const marginRegex =
        prefix === 'm'
          ? /^m-(?![xytrbl])/ // m- 后面不能是 x、y、t、r、b、l（避免匹配 mx-、my-、mt- 等）
          : new RegExp(`^${prefix}-`);
      console.log('marginRegex', value, marginRegex);
      toggleStyle(`${prefix}-${value}`, marginRegex);
    }
  };

  /**
   * 切换外边距链接状态
   */
  const toggleMarginLink = () => {
    setIsMarginLocked(!isMarginLocked);
  };

  /**
   * 切换外边距展开状态
   */
  const toggleMarginExpand = () => {
    setIsMarginExpanded(!isMarginExpanded);
  };

  /**
   * 处理内边距变更（四边独立）
   */
  const handlePaddingChange = (
    type:
      | 'top'
      | 'right'
      | 'bottom'
      | 'left'
      | 'vertical'
      | 'horizontal'
      | 'all',
    value: string | null,
  ) => {
    const newPadding = { ...localPadding };
    if (value !== null) {
      let prefix = 'p';
      if (type === 'all') {
        // 统一设置所有边
        newPadding.top = value;
        newPadding.right = value;
        newPadding.bottom = value;
        newPadding.left = value;
      } else if (type === 'vertical') {
        prefix = 'py';
        newPadding.top = value;
        newPadding.bottom = value;
      } else if (type === 'horizontal') {
        prefix = 'px';
        newPadding.left = value;
        newPadding.right = value;
      } else {
        switch (type) {
          case 'top':
            prefix = 'pt';
            break;
          case 'right':
            prefix = 'pr';
            break;
          case 'bottom':
            prefix = 'pb';
            break;
          case 'left':
            prefix = 'pl';
            break;
        }
        newPadding[type] = value;
      }
      setLocalPadding(newPadding);

      // value 已经是 Tailwind spacing 值（如 '40'），直接使用
      // 正则表达式：精确匹配相同前缀的 padding 类名
      // 例如：p- 只匹配 p-*，不匹配 px-*、py-*、pt-* 等
      // px- 只匹配 px-*，不匹配 p-*、py-*、pt-* 等
      const paddingRegex =
        prefix === 'p'
          ? /^p-(?![xytrbl])/ // p- 后面不能是 x、y、t、r、b、l（避免匹配 px-、py-、pt- 等）
          : new RegExp(`^${prefix}-`);
      toggleStyle(`${prefix}-${value}`, paddingRegex);
    }
  };

  /**
   * 切换内边距链接状态
   */
  const togglePaddingLink = () => {
    setIsPaddingLocked(!isPaddingLocked);
  };

  /**
   * 切换内边距展开状态
   */
  const togglePaddingExpand = () => {
    setIsPaddingExpanded(!isPaddingExpanded);
  };

  /**
   * 处理边框宽度变更（四边独立）
   */
  const handleBorderWidthChange = (
    type: 'top' | 'right' | 'bottom' | 'left' | 'all',
    value: string | null,
  ) => {
    const newBorderWidth = { ...localBorderWidth };
    if (value !== null) {
      if (type === 'all') {
        newBorderWidth.top = value;
        newBorderWidth.right = value;
        newBorderWidth.bottom = value;
        newBorderWidth.left = value;
      } else {
        newBorderWidth[type] = value;
      }
      setLocalBorderWidth(newBorderWidth);
      // onChange?.('borderWidth', newBorderWidth);
      // 正则表达式：精确匹配 border 和 border-数字 类名（如 border, border-0, border-2, border-4, border-8）
      // 注意：value 为 '1' 时，类名是 'border'（无数字后缀），其他值是 'border-数字'
      const borderClass = value === '1' ? 'border' : `border-${value}`;
      toggleStyle(borderClass, /^border(-\d+)?$/);
    }
  };

  /**
   * 切换边框宽度展开状态
   */
  const toggleBorderWidthExpand = () => {
    setIsBorderWidthExpanded(!isBorderWidthExpanded);
  };

  /**
   * 处理对齐方式变更
   */
  const handleTextAlignChange = (
    align: 'left' | 'center' | 'right' | 'justify' | 'reset',
  ) => {
    if (align === 'reset') {
      setTextAlign('left');
    } else {
      setTextAlign(align);
    }
    // onChange?.('textAlign', align === 'reset' ? 'left' : align);
  };

  /**
   * 处理文本装饰变更
   */
  // const handleTextDecorationChange = (decoration: string) => {
  //   const newDecorations = textDecoration.includes(decoration)
  //     ? textDecoration.filter((d) => d !== decoration)
  //     : [...textDecoration, decoration];
  //   // setTextDecoration(newDecorations);
  //   onChange?.('textDecoration', newDecorations);
  // };

  if (!iframeDesignMode || !selectedElement) {
    return null;
  }

  return (
    <div className={cx(styles.designViewer)}>
      {/* 面包屑导航 */}
      <div className={cx(styles.breadcrumbContainer)}>
        <Breadcrumb
          items={[
            {
              // 组件文件路径
              title: selectedElement?.sourceInfo?.fileName?.replace(
                /^\/app\/project_workspace\/[^/]+\//,
                '',
              ),
            },
            {
              title: (
                <Space>
                  <ThunderboltOutlined className={cx(styles.breadcrumbIcon)} />
                  {/* 元素标签名 */}
                  <span>{selectedElement?.tagName}</span>
                </Space>
              ),
            },
          ]}
        />
        <Dropdown
          menu={{ items: moreMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <MoreOutlined className={cx(styles.moreIcon)} />
        </Dropdown>
      </div>

      {/* 属性配置区域 */}
      <div className={cx(styles.propertiesContainer)}>
        {/* Text Content 配置 */}
        {canEditTextContent(selectedElement) && (
          <div className={cx(styles.propertySection)}>
            <div className={cx(styles.propertyLabel)}>Text Content</div>
            <Input.TextArea
              className={cx('w-full')}
              value={localTextContent}
              onChange={(e) => handleTextContentChange(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 4 }}
            />
          </div>
        )}

        {/* Typography 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Typography</div>
          {/* <SelectList
            className={cx(styles.propertyInput)}
            value={localTypography}
            onChange={(value) => handleTypographyChange(value as string)}
            options={typographyOptions}
          /> */}

          {/* Typography 详细设置 */}
          <div className={cx(styles.typographyDetails)}>
            {/* Font Weight 和 Font Size */}
            <div className={cx(styles.typographyRow)}>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>
                  Font Weight
                </div>
                <SelectList
                  className={cx(styles.typographySelect)}
                  value={fontWeight}
                  onChange={(value) => {
                    setFontWeight(value as string);
                    // onChange?.('fontWeight', value);
                  }}
                  options={fontWeightOptions}
                />
              </div>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>Font Size</div>
                <SelectList
                  className={cx(styles.typographySelect)}
                  value={fontSize}
                  onChange={(value) => {
                    setFontSize(value as string);
                    // onChange?.('fontSize', value);
                  }}
                  options={fontSizeOptions}
                />
              </div>
            </div>

            {/* Line Height 和 Letter Spacing */}
            <div className={cx(styles.typographyRow)}>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>
                  Line Height
                </div>
                <SelectList
                  className={cx(styles.typographySelect)}
                  value={lineHeight}
                  onChange={(value) => {
                    setLineHeight(value as string);
                    // onChange?.('lineHeight', value);
                  }}
                  options={lineHeightOptions}
                />
              </div>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>
                  Letter Spacing
                </div>
                <SelectList
                  className={cx(styles.typographySelect)}
                  value={letterSpacing}
                  onChange={(value) => {
                    setLetterSpacing(value as string);
                    // onChange?.('letterSpacing', value);
                  }}
                  options={letterSpacingOptions}
                />
              </div>
            </div>

            <div className={cx(styles.typographyRow)}>
              {/* Alignment */}
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>Alignment</div>
                <div className={cx(styles.buttonGroup)}>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'reset',
                    })}
                    onClick={() => handleTextAlignChange('reset')}
                    icon={<ResetSvg className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'left',
                    })}
                    onClick={() => handleTextAlignChange('left')}
                    icon={<AlignLeftSvg className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'center',
                    })}
                    onClick={() => handleTextAlignChange('center')}
                    icon={<AlignCenterSvg className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'right',
                    })}
                    onClick={() => handleTextAlignChange('right')}
                    icon={<AlignRightSvg className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'justify',
                    })}
                    onClick={() => handleTextAlignChange('justify')}
                    icon={<AlignJustifySvg className={cx(styles.layoutIcon)} />}
                  />
                </div>
              </div>
            </div>

            {/* 文本装饰 */}
            {/* <div className={cx(styles.typographyRow)}>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>
                  Decoration
                </div>
                <div className={cx(styles.buttonGroup)}>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('italic'),
                    })}
                    onClick={() => handleTextDecorationChange('italic')}
                    icon={<ItalicOutlined className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('strikethrough'),
                    })}
                    onClick={() => handleTextDecorationChange('strikethrough')}
                    icon={
                      <StrikethroughOutlined
                        className={cx(styles.layoutIcon)}
                      />
                    }
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('underline'),
                    })}
                    onClick={() => handleTextDecorationChange('underline')}
                    icon={
                      <UnderlineOutlined className={cx(styles.layoutIcon)} />
                    }
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('overline'),
                    })}
                    onClick={() => handleTextDecorationChange('overline')}
                    icon={<OverlineSvg className={cx(styles.layoutIcon)} />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.length === 0,
                    })}
                    onClick={() => {
                      setTextDecoration([]);
                      onChange?.('textDecoration', []);
                    }}
                    icon={
                      <TabularNumbersSvg className={cx(styles.layoutIcon)} />
                    }
                  />
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Color 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Color</div>
          <Select
            className={cx('w-full')}
            value={localColor}
            onChange={handleColorChange}
            options={colorOptions}
            prefix={
              localColor === 'Default' ? (
                <BorderColorSvg className={cx(styles.layoutIcon)} />
              ) : (
                <div
                  className={cx(styles.colorSwatch)}
                  style={{ background: localColor }}
                />
              )
            }
            optionRender={(option) => {
              return (
                <div className={cx('flex items-center gap-4')}>
                  <span
                    className={cx('radius-4')}
                    style={{
                      width: 16,
                      height: 16,
                      background: option.data.value,
                    }}
                  />
                  <span className={cx('flex-1', 'text-ellipsis')}>
                    {option.data.label}
                  </span>
                </div>
              );
            }}
          />
        </div>

        {/* Background 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Background</div>
          <Select
            className={cx('w-full')}
            value={localBackground}
            onChange={handleBackgroundChange}
            options={colorOptions}
            prefix={
              localBackground === 'Default' ? (
                <BorderColorSvg className={cx(styles.layoutIcon)} />
              ) : (
                <div
                  className={cx(styles.colorSwatch)}
                  style={{ background: localBackground }}
                />
              )
            }
            optionRender={(option) => {
              return (
                <div className={cx('flex items-center gap-4')}>
                  <span
                    className={cx('radius-4')}
                    style={{
                      width: 16,
                      height: 16,
                      background: option.data.value,
                    }}
                  />
                  <span className={cx('flex-1', 'text-ellipsis')}>
                    {option.data.label}
                  </span>
                </div>
              );
            }}
          />
        </div>

        {/* Layout 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Layout</div>

          {/* Margin */}
          <div className={cx(styles.layoutSubSection)}>
            <div className={cx(styles.layoutLabel)}>Margin</div>
            {!isMarginExpanded ? (
              // 折叠状态：根据锁定状态显示一个或两个输入框
              <div className={cx(styles.layoutInputs)}>
                {isMarginLocked ? (
                  // 锁定状态：显示一个输入框，统一设置所有边
                  <div className={cx('flex items-center flex-1')}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localMargin.top === 'string'
                          ? localMargin.top
                          : `${localMargin.top || 0}px`
                      }
                      onChange={(value) =>
                        handleMarginChange('all', value as string)
                      }
                      prefix={
                        <MarginHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={pixelOptions}
                    />
                  </div>
                ) : (
                  // 解锁状态：显示两个输入框，分别设置上下和左右
                  <div
                    className={cx('flex items-center flex-1', styles['gap-8'])}
                  >
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localMargin.top === 'string'
                          ? localMargin.top
                          : `${localMargin.top || 0}px`
                      }
                      onChange={(value) =>
                        handleMarginChange('vertical', value as string)
                      }
                      prefix={
                        <MarginHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={pixelOptions}
                    />
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localMargin.left === 'string'
                          ? localMargin.left
                          : `${localMargin.left || 0}px`
                      }
                      onChange={(value) =>
                        handleMarginChange('horizontal', value as string)
                      }
                      prefix={
                        <MarginVerticalSvg className={cx(styles.layoutIcon)} />
                      }
                      options={pixelOptions}
                    />
                  </div>
                )}
                <div className={cx(styles.layoutActions)}>
                  {!isMarginLocked && (
                    <Button
                      type="text"
                      icon={<ExpandOutlined />}
                      onClick={toggleMarginExpand}
                    />
                  )}
                  {isMarginLocked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={toggleMarginLink}
                      className={cx(styles.lockedButton)}
                    />
                  ) : (
                    <Button
                      type="text"
                      icon={<UnlockOutlined />}
                      onClick={toggleMarginLink}
                    />
                  )}
                </div>
              </div>
            ) : (
              // 展开状态：根据锁定状态显示一个或四个输入框
              <div className={cx(styles.layoutInputs)}>
                {isMarginLocked ? (
                  // 锁定状态：显示一个输入框，统一设置所有边
                  <div className={cx('flex items-center flex-1')}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localMargin.top === 'string'
                          ? localMargin.top
                          : `${localMargin.top || 0}px`
                      }
                      onChange={(value) =>
                        handleMarginChange('all', value as string)
                      }
                      prefix={
                        <MarginHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={pixelOptions}
                    />
                  </div>
                ) : (
                  // 解锁状态：显示四边独立输入框（两行两列）
                  <div className={cx(styles.expandedLayout)}>
                    <div className={cx(styles.expandedRow)}>
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localMargin.top === 'string'
                            ? localMargin.top
                            : `${localMargin.top || 0}px`
                        }
                        onChange={(value) =>
                          handleMarginChange('top', value as string)
                        }
                        prefix={
                          <MarginTopSvg className={cx(styles.layoutIcon)} />
                        }
                        options={pixelOptions}
                      />
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localMargin.bottom === 'string'
                            ? localMargin.bottom
                            : `${localMargin.bottom || 0}px`
                        }
                        onChange={(value) =>
                          handleMarginChange('bottom', value as string)
                        }
                        prefix={
                          <MarginBottomSvg className={cx(styles.layoutIcon)} />
                        }
                        options={pixelOptions}
                      />
                    </div>
                    <div className={cx(styles.expandedRow)}>
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localMargin.left === 'string'
                            ? localMargin.left
                            : `${localMargin.left || 0}px`
                        }
                        onChange={(value) =>
                          handleMarginChange('left', value as string)
                        }
                        prefix={
                          <MarginLeftSvg className={cx(styles.layoutIcon)} />
                        }
                        options={pixelOptions}
                      />
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localMargin.right === 'string'
                            ? localMargin.right
                            : `${localMargin.right || 0}px`
                        }
                        onChange={(value) =>
                          handleMarginChange('right', value as string)
                        }
                        prefix={
                          <MarginRightSvg className={cx(styles.layoutIcon)} />
                        }
                        options={pixelOptions}
                      />
                    </div>
                  </div>
                )}
                <div className={cx(styles.layoutActions)}>
                  {!isMarginLocked && (
                    <Button
                      type="text"
                      icon={<CompressOutlined />}
                      onClick={toggleMarginExpand}
                    />
                  )}
                  {isMarginLocked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={toggleMarginLink}
                      className={cx(styles.lockedButton)}
                    />
                  ) : (
                    <Button
                      type="text"
                      icon={<UnlockOutlined />}
                      onClick={toggleMarginLink}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Padding */}
          <div className={cx(styles.layoutSubSection)}>
            <div className={cx(styles.layoutLabel)}>Padding</div>
            {!isPaddingExpanded ? (
              // 折叠状态：根据锁定状态显示一个或两个下拉选择
              <div className={cx(styles.layoutInputs)}>
                {isPaddingLocked ? (
                  // 锁定状态：显示一个下拉选择，统一设置所有边
                  <div className={cx('flex items-center flex-1')}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localPadding.top === 'string'
                          ? localPadding.top
                          : `${localPadding.top || 0}px`
                      }
                      onChange={(value) =>
                        handlePaddingChange('all', value as string)
                      }
                      prefix={
                        <PaddingHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={paddingPixelOptions}
                    />
                  </div>
                ) : (
                  // 解锁状态：显示两个下拉选择，分别设置上下和左右
                  <div
                    className={cx('flex items-center flex-1', styles['gap-8'])}
                  >
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localPadding.top === 'string'
                          ? localPadding.top
                          : `${localPadding.top || 0}px`
                      }
                      onChange={(value) =>
                        handlePaddingChange('vertical', value as string)
                      }
                      prefix={
                        <PaddingHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={paddingPixelOptions}
                    />
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localPadding.left === 'string'
                          ? localPadding.left
                          : `${localPadding.left || 0}px`
                      }
                      onChange={(value) =>
                        handlePaddingChange('horizontal', value as string)
                      }
                      prefix={
                        <PaddingVerticalSvg className={cx(styles.layoutIcon)} />
                      }
                      options={paddingPixelOptions}
                    />
                  </div>
                )}
                <div className={cx(styles.layoutActions)}>
                  {!isPaddingLocked && (
                    <Button
                      type="text"
                      icon={<ExpandOutlined />}
                      onClick={togglePaddingExpand}
                    />
                  )}
                  {isPaddingLocked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={togglePaddingLink}
                      className={cx(styles.lockedButton)}
                    />
                  ) : (
                    <Button
                      type="text"
                      icon={<UnlockOutlined />}
                      onClick={togglePaddingLink}
                    />
                  )}
                </div>
              </div>
            ) : (
              // 展开状态：根据锁定状态显示一个或四个下拉选择
              <div className={cx(styles.layoutInputs)}>
                {isPaddingLocked ? (
                  // 锁定状态：显示一个下拉选择，统一设置所有边
                  <div className={cx('flex items-center flex-1')}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localPadding.top === 'string'
                          ? localPadding.top
                          : `${localPadding.top || 0}px`
                      }
                      onChange={(value) =>
                        handlePaddingChange('all', value as string)
                      }
                      prefix={
                        <PaddingHorizontalSvg
                          className={cx(styles.layoutIcon)}
                        />
                      }
                      options={paddingPixelOptions}
                    />
                  </div>
                ) : (
                  // 解锁状态：显示四边独立下拉选择（两行两列）
                  <div className={cx(styles.expandedLayout)}>
                    <div className={cx(styles.expandedRow)}>
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localPadding.top === 'string'
                            ? localPadding.top
                            : `${localPadding.top || 0}px`
                        }
                        onChange={(value) =>
                          handlePaddingChange('top', value as string)
                        }
                        prefix={
                          <PaddingTopSvg className={cx(styles.layoutIcon)} />
                        }
                        options={paddingPixelOptions}
                      />
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localPadding.bottom === 'string'
                            ? localPadding.bottom
                            : `${localPadding.bottom || 0}px`
                        }
                        onChange={(value) =>
                          handlePaddingChange('bottom', value as string)
                        }
                        prefix={
                          <PaddingBottomSvg className={cx(styles.layoutIcon)} />
                        }
                        options={paddingPixelOptions}
                      />
                    </div>
                    <div className={cx(styles.expandedRow)}>
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localPadding.left === 'string'
                            ? localPadding.left
                            : `${localPadding.left || 0}px`
                        }
                        onChange={(value) =>
                          handlePaddingChange('left', value as string)
                        }
                        prefix={
                          <PaddingLeftSvg className={cx(styles.layoutIcon)} />
                        }
                        options={paddingPixelOptions}
                      />
                      <SelectList
                        className={cx('flex-1')}
                        value={
                          typeof localPadding.right === 'string'
                            ? localPadding.right
                            : `${localPadding.right || 0}px`
                        }
                        onChange={(value) =>
                          handlePaddingChange('right', value as string)
                        }
                        prefix={
                          <PaddingRightSvg className={cx(styles.layoutIcon)} />
                        }
                        options={paddingPixelOptions}
                      />
                    </div>
                  </div>
                )}
                <div className={cx(styles.layoutActions)}>
                  {!isPaddingLocked && (
                    <Button
                      type="text"
                      icon={<CompressOutlined />}
                      onClick={togglePaddingExpand}
                    />
                  )}
                  {isPaddingLocked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={togglePaddingLink}
                      className={cx(styles.lockedButton)}
                    />
                  ) : (
                    <Button
                      type="text"
                      icon={<UnlockOutlined />}
                      onClick={togglePaddingLink}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Border 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Border</div>
          {/* Border Style 和 Border Color */}
          <div className={cx(styles.typographyRow)}>
            <div className={cx(styles.typographyInputGroup)}>
              <div className={cx(styles.typographyInputLabel)}>
                Border Color
              </div>
              <Select
                className={cx(styles.typographySelect)}
                value={borderColor}
                onChange={handleBorderColorChange}
                options={colorOptions}
                prefix={
                  borderColor === 'Default' ? (
                    <BorderColorSvg className={cx(styles.layoutIcon)} />
                  ) : (
                    <div
                      className={cx(styles.colorSwatch)}
                      style={{ background: borderColor }}
                    />
                  )
                }
                optionRender={(option) => {
                  return (
                    <div className={cx('flex items-center gap-4')}>
                      <span
                        className={cx('radius-4')}
                        style={{
                          width: 16,
                          height: 16,
                          background: option.data.value,
                        }}
                      />
                      <span className={cx('flex-1', 'text-ellipsis')}>
                        {option.data.label}
                      </span>
                    </div>
                  );
                }}
              />
            </div>
            <div className={cx(styles.typographyInputGroup)}>
              <div className={cx(styles.typographyInputLabel)}>
                Border Style
              </div>
              <SelectList
                className={cx(styles.typographySelect)}
                value={borderStyle}
                onChange={(value) => {
                  const styleValue = value as string;
                  setBorderStyle(styleValue);
                  // onChange?.('borderStyle', styleValue);

                  // 通过 toggleStyle 方法将 border 样式写入 editingClass
                  if (styleValue === 'Default') {
                    // 如果是 Default，移除所有边框样式类名
                    toggleStyle(
                      '',
                      /^border-(none|solid|dashed|dotted|double)$/,
                    );
                  } else {
                    // 使用 Tailwind 边框样式类名（value 已经是类名，如 'border-solid'）
                    toggleStyle(
                      styleValue,
                      /^border-(none|solid|dashed|dotted|double)$/,
                    );
                  }
                }}
                options={borderStyleOptions}
              />
            </div>
          </div>
          {/* Border Width */}
          <div className={cx(styles.layoutSubSection)}>
            <div className={cx(styles.layoutLabel)}>Border Width</div>
            {!isBorderWidthExpanded ? (
              // 折叠状态：显示单个下拉选择
              <div className={cx(styles.layoutInputs)}>
                <div className={cx('flex items-center gap-4 flex-1')}>
                  <SelectList
                    className={cx('flex-1')}
                    value={
                      typeof localBorderWidth.top === 'string'
                        ? localBorderWidth.top
                        : String(localBorderWidth.top || '0')
                    }
                    onChange={(value) =>
                      handleBorderWidthChange('all', value as string)
                    }
                    prefix={
                      <BorderWidthSvg className={cx(styles.layoutIcon)} />
                    }
                    options={borderWidthOptions}
                  />
                </div>
                <Button
                  type="text"
                  icon={<ExpandOutlined />}
                  onClick={toggleBorderWidthExpand}
                />
              </div>
            ) : (
              // 展开状态：显示四边独立下拉选择（两行两列）
              <div className={cx(styles.layoutInputs)}>
                <div className={cx(styles.expandedLayout)}>
                  <div className={cx(styles.expandedRow)}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localBorderWidth.top === 'string'
                          ? localBorderWidth.top
                          : String(localBorderWidth.top || '0')
                      }
                      onChange={(value) =>
                        handleBorderWidthChange('top', value as string)
                      }
                      prefix={
                        <BorderTopSvg className={cx(styles.layoutIcon)} />
                      }
                      options={borderWidthOptions}
                    />
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localBorderWidth.bottom === 'string'
                          ? localBorderWidth.bottom
                          : String(localBorderWidth.bottom || '0')
                      }
                      onChange={(value) =>
                        handleBorderWidthChange('bottom', value as string)
                      }
                      prefix={
                        <BorderBottomSvg className={cx(styles.layoutIcon)} />
                      }
                      options={borderWidthOptions}
                    />
                  </div>
                  <div className={cx(styles.expandedRow)}>
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localBorderWidth.left === 'string'
                          ? localBorderWidth.left
                          : String(localBorderWidth.left || '0')
                      }
                      onChange={(value) =>
                        handleBorderWidthChange('left', value as string)
                      }
                      prefix={
                        <BorderLeftSvg className={cx(styles.layoutIcon)} />
                      }
                      options={borderWidthOptions}
                    />
                    <SelectList
                      className={cx('flex-1')}
                      value={
                        typeof localBorderWidth.right === 'string'
                          ? localBorderWidth.right
                          : String(localBorderWidth.right || '0')
                      }
                      onChange={(value) =>
                        handleBorderWidthChange('right', value as string)
                      }
                      prefix={
                        <BorderRightSvg className={cx(styles.layoutIcon)} />
                      }
                      options={borderWidthOptions}
                    />
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<CompressOutlined />}
                  onClick={toggleBorderWidthExpand}
                />
              </div>
            )}
          </div>
        </div>

        {/* Appearance 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Appearance</div>
          <div className={cx(styles.typographyRow)}>
            {/* Opacity */}
            <div className={cx(styles.typographyInputGroup)}>
              <div className={cx(styles.typographyInputLabel)}>Opacity</div>
              <Select
                className={cx('w-full')}
                value={opacity}
                onChange={(value) => {
                  setOpacity(value);
                  // onChange?.('opacity', value);
                }}
                options={opacityOptions}
                prefix={<OpacitySvg className={cx(styles.layoutIcon)} />}
              />
            </div>
            {/* Radius */}
            <div className={cx(styles.typographyInputGroup)}>
              <div className={cx(styles.typographyInputLabel)}>Radius</div>
              <SelectList
                className={cx(styles.typographySelect)}
                value={radius}
                onChange={(value) => {
                  setRadius(value as string);
                  // onChange?.('radius', value);
                }}
                options={radiusOptions}
                prefix={<RadiusSvg className={cx(styles.layoutIcon)} />}
              />
            </div>
          </div>
        </div>

        {/* Shadow 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Shadow</div>
          <SelectList
            className={cx(styles.shadowSelect)}
            value={shadowType}
            onChange={(value) => {
              setShadowType(value as string);
              // onChange?.('shadowType', value);
            }}
            options={shadowOptions}
            prefix={<ShadowSvg className={cx(styles.layoutIcon)} />}
          />
        </div>
      </div>
    </div>
  );
};

export default DesignViewer;
