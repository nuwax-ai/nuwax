import SelectList from '@/components/custom/SelectList';
import {
  CompressOutlined,
  ExpandOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Input, message, Select, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import {
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
  ShadowSvg,
} from './design.images.constants';
import styles from './index.less';
import { ElementInfo } from './messages';
import { FILENAME_REGEXP, toggleStyleAttributeType } from './utils';
import {
  BORDER_COLOR_REGEXP,
  BORDER_STYLE_REGEXP,
  generateTailwindBorderStyleOptions,
  generateTailwindBorderWidthOptions,
  mapTailwindBorderStyleToLocal,
  parseTailwindBorderWidth,
} from './utils/tailwind-border';
import {
  generateFullTailwindColorOptions,
  getColorClassRegexp,
  getColorFromTailwindClass,
} from './utils/tailwind-color';
import {
  FONT_SIZE_REGEXP,
  generateTailwindFontSizeOptions,
} from './utils/tailwind-fontSize';
import {
  FONT_WEIGHT_REGEXP,
  generateTailwindFontWeightOptions,
} from './utils/tailwind-fontWeight';
import {
  convertEmToLetterSpacingClass,
  generateTailwindLetterSpacingOptions,
  LETTER_SPACING_REGEXP,
} from './utils/tailwind-letterSpacing';
import {
  convertRemToLineHeightClass,
  generateTailwindLineHeightOptions,
  LINE_HEIGHT_REGEXP,
} from './utils/tailwind-lineHeight';
import {
  convertNumberToOpacityClass,
  generateTailwindOpacityOptions,
  OPACITY_REGEXP,
  parseTailwindOpacity,
} from './utils/tailwind-opacity';
import {
  convertLabelToRadiusClass,
  generateTailwindRadiusOptions,
  RADIUS_REGEXP,
  tailwindRadiusMap,
} from './utils/tailwind-radius';
import {
  convertLabelToShadowClass,
  generateTailwindShadowOptions,
  SHADOW_REGEXP,
  tailwindShadowMap,
} from './utils/tailwind-shadow';
import {
  generateTailwindSpacingPixelOptions,
  getPaddingOrMarginSpace,
  PaddingOrMarginType,
  parseStyleValue,
  parseTailwindSpacing,
  SpaceValueType,
} from './utils/tailwind-space';
import {
  convertLabelToTextAlignClass,
  TEXT_ALIGN_OPTIONS,
  TEXT_ALIGN_REGEXP,
} from './utils/tailwind-textAlign';

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
// const moreMenuItems = [
//   { key: 'copy', label: '复制属性' },
//   { key: 'reset', label: '重置' },
//   { key: 'delete', label: '删除' },
// ];

// Typography 选项
// const typographyOptions = [
//   { label: 'Default', value: 'Default' },
//   { label: 'Sans Serif', value: 'Sans Serif' },
//   { label: 'Serif', value: 'Serif' },
//   { label: 'Monospace', value: 'Monospace' },
// ];

/**
 * Font Weight 选项列表 - 从 Tailwind CSS 字体粗细配置中获取
 * 基于 Tailwind CSS 默认字体粗细配置
 * 包含：Thin (font-thin), Extra Light (font-extralight), Light (font-light), Regular (font-normal), Medium (font-medium), Semi Bold (font-semibold), Bold (font-bold), Extra Bold (font-extrabold), Black (font-black)
 */
const fontWeightOptions = generateTailwindFontWeightOptions();

// Line Height 选项 - 从 Tailwind CSS 行高配置中获取
const lineHeightOptions = generateTailwindLineHeightOptions();

/**
 * Letter Spacing 选项列表 - 从 Tailwind CSS 字母间距配置中获取
 * 基于 Tailwind CSS 默认字母间距配置
 * 包含：None, -0.05em (tracking-tighter), -0.025em (tracking-tight), 0em (tracking-normal), 0.025em (tracking-wide), 0.05em (tracking-wider), 0.1em (tracking-widest)
 */
const letterSpacingOptions = generateTailwindLetterSpacingOptions();

/**
 * Border Style 选项列表 - 从 Tailwind CSS 边框样式配置中获取
 * 基于 Tailwind CSS 默认边框样式配置
 * 包含：None (border-none), Solid (border-solid), Dashed (border-dashed), Dotted (border-dotted), Double (border-double)
 */
const borderStyleOptions = generateTailwindBorderStyleOptions();

interface DesignViewerProps {
  /** 添加选中元素到会话回调 */
  onAddToChat: (content: string) => void;
}

/**
 * 设计查看器组件
 * 提供元素属性编辑面板，包括图标、颜色、背景、布局、尺寸和边框等配置
 */
const DesignViewer: React.FC<DesignViewerProps> = ({ onAddToChat }) => {
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
  /** 是否锁定外边距 */
  const [isMarginLocked, setIsMarginLocked] = useState<boolean>(true);
  /** 是否锁定内边距 */
  const [isPaddingLocked, setIsPaddingLocked] = useState<boolean>(true);
  /** 是否展开外边距 */
  const [isMarginExpanded, setIsMarginExpanded] = useState<boolean>(false);
  /** 是否展开内边距 */
  const [isPaddingExpanded, setIsPaddingExpanded] = useState<boolean>(false);
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
  /** 是否展开边框宽度 */
  const [isBorderWidthExpanded, setIsBorderWidthExpanded] =
    useState<boolean>(false);
  /** 编辑中的透明度 */
  const [opacity, setOpacity] = useState<number>(100);
  /** 编辑中的圆角 */
  const [radius, setRadius] = useState<string>('None');
  /** 编辑中的阴影类型 */
  const [shadowType, setShadowType] = useState<string>('None');

  /** 选中的元素, 用于标识当前选中的元素, 包含className, sourceInfo, tagName, textContent等信息*/
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(
    null,
  );
  // 编辑中的类
  const [editingClass, setEditingClass] = useState<string>('');

  const {
    iframeDesignMode,
    setIframeDesignMode,
    pendingChanges,
    setPendingChanges,
  } = useModel('appDev');

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
    if (!element.isStaticText) {
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

  // 关闭设计模式
  const closeDesignMode = () => {
    // 关闭设计模式，防止用户在设计模式下修改元素，导致添加到会话的内容不准确
    setIframeDesignMode(false);
    // 清空选中元素
    setSelectedElement(null);
    // 清空文本内容
    setLocalTextContent('');
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'TOGGLE_DESIGN_MODE',
          enabled: false,
          timestamp: Date.now(),
        },
        '*',
      );
    }
  };

  // 监听从iframe发送的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'DESIGN_MODE_CHANGED':
          setIframeDesignMode(event.data.enabled);
          break;

        case 'ELEMENT_SELECTED':
          {
            console.log('[Parent] Element selected - full payload:', payload);

            // 验证 sourceInfo 是否有效
            if (
              !payload.elementInfo?.sourceInfo ||
              !payload.elementInfo.sourceInfo.fileName ||
              payload.elementInfo.sourceInfo.lineNumber === 0
            ) {
              return;
            }

            const elementInfo = payload.elementInfo;
            const { isStaticText, textContent, className } = elementInfo;
            setSelectedElement(elementInfo);
            setEditingClass(className);

            // 判断元素是否可以编辑文本内容，如果可以则回显到 Text Content 编辑框
            if (isStaticText) {
              setLocalTextContent(textContent || '');
            } else {
              // 如果不能编辑，清空 Text Content 编辑框
              setLocalTextContent('');
            }

            // 从 className 中解析 Tailwind CSS 类名并更新状态
            if (className) {
              parseTailwindClassesAndUpdateStates(className);
            }

            // 如果elementInfo包含computedStyles，直接使用（优先级高于 Tailwind 解析）
            // if (payload.elementInfo.computedStyles) {
            //   updateLocalStatesFromStyles(payload.elementInfo.computedStyles);
            // }
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
        case 'ADD_TO_CHAT':
          {
            if (pendingChanges?.length > 0) {
              message.error('请先保存或重置修改, 再添加选中元素到会话');
              return;
            }
            if (payload?.context?.sourceInfo) {
              // 关闭设计模式，防止用户在设计模式下修改元素，导致添加到会话的内容不准确
              closeDesignMode();
              const { fileName, lineNumber, columnNumber } =
                payload?.context?.sourceInfo;
              const _fileName = fileName?.replace(FILENAME_REGEXP, '');
              const content = `${_fileName}(${lineNumber}-${columnNumber})`;
              const addToChatContent = `\n\`\`\`\n${content}\n\`\`\`\n`;
              onAddToChat(addToChatContent);
            } else {
              message.error('sourceInfo is not valid');
            }
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pendingChanges]);

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

  // 处理内容更新
  const handleContentUpdate = (newContent: string) => {
    if (!selectedElement) {
      return;
    }
    upsertPendingChange('content', newContent);

    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'UPDATE_CONTENT',
          payload: {
            sourceInfo: selectedElement?.sourceInfo,
            newContent,
            persist: false,
          },
          timestamp: Date.now(),
        },
        '*',
      );
    }
  };

  // 处理样式更新
  const handleStyleUpdate = (newClass: string) => {
    upsertPendingChange('style', newClass);

    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'UPDATE_STYLE',
          payload: {
            sourceInfo: selectedElement?.sourceInfo,
            newClass,
            persist: false,
          },
          timestamp: Date.now(),
        },
        '*',
      );
    }
  };

  // Style Manager Logic
  const toggleStyle = (
    newStyle: string,
    regex: RegExp,
    attribute?: toggleStyleAttributeType,
  ) => {
    const currentClasses = editingClass.split(' ').filter((c) => c.trim());

    // 获取字体大小相关的类名列表（从 fontSizeOptions 中提取）
    // fontSizeOptions 中的 value 是 'xs', 'sm' 等，需要转换为 'text-xs', 'text-sm' 等
    const fontSizeClasses = fontSizeOptions
      .filter((option) => option.value !== 'Default')
      .map((option) => `text-${option.value}`);

    // Remove existing class in the same category
    const filterCurrentClasses = currentClasses.filter((c) => {
      // 如果是字体大小相关的操作
      if (attribute === 'fontSize') {
        // 先测试是否匹配字体大小正则
        const matchesFontSize = regex.test(c);
        // 保留 text-center 等非字体大小的 text- 类名
        if (
          c === 'text-center' ||
          (c.startsWith('text-') && !matchesFontSize)
        ) {
          return true;
        }
        // 过滤掉匹配正则的字体大小类名（如 text-lg, text-sm, text-3xl 等）
        return !matchesFontSize;
      } else if (attribute === 'textAlign') {
        // 先测试是否匹配文本对齐正则
        const matchesTextAlign = regex.test(c);
        // 如果匹配文本对齐正则（如 text-left, text-center, text-right, text-justify），过滤掉
        // 这样当选择新的 textAlign 时，旧的会被清除，新的会被添加
        // 当选择 reset 时，所有 textAlign 类名都会被清除
        if (matchesTextAlign) {
          return false;
        }
        // 保留非文本对齐的 text- 类名（如字体大小、颜色等）
        // 以及字体大小类名和其他非 text- 开头的类名
        return true;
      } else {
        // 非字体大小操作：排除字体大小相关的类（如 text-xs, text-sm 等）
        if (fontSizeClasses.includes(c) || c.includes('text-center')) {
          return true;
        }
        // 其他类按原来的逻辑过滤
        return !regex.test(c);
      }
    });

    // Add new style if it's not empty (allows clearing style)
    if (newStyle) {
      filterCurrentClasses.push(newStyle);
    }

    const finalClasses = filterCurrentClasses.join(' ');
    setEditingClass(finalClasses);
    // 更新样式到 iframe 中
    handleStyleUpdate(finalClasses);
  };

  /**
   * 处理Typography变更
   */
  // const handleTypographyChange = (value: string) => {
  //   setLocalTypography(value);
  //   onChange?.('typography', value);
  // };

  /**
   * 处理字体粗细变更
   */
  const handleFontWeightChange = (value: React.Key) => {
    const weightValue = value as string;
    setFontWeight(weightValue);
    // 通过 toggleStyle 方法将 font weight 样式写入 editingClass
    // value 已经是 Tailwind 字体粗细类名（如 'font-semibold'）
    toggleStyle(weightValue, FONT_WEIGHT_REGEXP);
  };

  /**
   * 处理字体大小变更
   */
  const handleFontSizeChange = (value: React.Key) => {
    const sizeValue = value as string;
    setFontSize(sizeValue);

    // 通过 toggleStyle 方法将 font size 样式写入 editingClass
    if (sizeValue === 'Default') {
      // 如果是 Default，移除所有字体大小类名
      // 字体大小类名格式是 text-xs, text-sm, text-base 等
      toggleStyle('', FONT_SIZE_REGEXP, 'fontSize');
    } else {
      // 将 value（如 'lg'）转换为 Tailwind 类名（如 'text-lg'）
      const fontSizeClass = `text-${sizeValue}`;
      toggleStyle(fontSizeClass, FONT_SIZE_REGEXP, 'fontSize');
    }
  };

  /**
   * 处理行高变更
   */
  const handleLineHeightChange = (value: React.Key) => {
    const heightValue = value as string;
    setLineHeight(heightValue);

    // 通过 toggleStyle 方法将 line height 样式写入 editingClass
    // if (heightValue === 'None') {
    //   // 如果是 None，移除所有行高类名
    //   toggleStyle('', LINE_HEIGHT_REGEXP);
    // } else {
    // value 是 rem 值（如 '1.5rem'），需要转换为 Tailwind 类名（如 'leading-6'）
    const lineHeightClass = convertRemToLineHeightClass(heightValue);
    if (lineHeightClass) {
      toggleStyle(lineHeightClass, LINE_HEIGHT_REGEXP);
    } else {
      // 如果找不到对应的类名，移除所有行高类名
      toggleStyle('', LINE_HEIGHT_REGEXP);
    }
    // }
  };

  /**
   * 处理字母间距变更
   */
  const handleLetterSpacingChange = (value: React.Key) => {
    const spacingValue = value as string;
    setLetterSpacing(spacingValue);

    // 通过 toggleStyle 方法将 letter spacing 样式写入 editingClass
    if (spacingValue === 'None') {
      // 如果是 None，移除所有字母间距类名
      toggleStyle('', LETTER_SPACING_REGEXP);
    } else {
      // value 是 em 值（如 '0.05em'），需要转换为 Tailwind 类名（如 'tracking-wider'）
      const letterSpacingClass = convertEmToLetterSpacingClass(spacingValue);
      if (letterSpacingClass) {
        toggleStyle(letterSpacingClass, LETTER_SPACING_REGEXP);
      } else {
        // 如果找不到对应的类名，移除所有字母间距类名
        toggleStyle('', LETTER_SPACING_REGEXP);
      }
    }
  };

  /**
   * 处理透明度变更
   */
  const handleOpacityChange = (value: number) => {
    setOpacity(value);

    // 通过 toggleStyle 方法将 opacity 样式写入 editingClass
    // value 是数字值（如 50），需要转换为 Tailwind 类名（如 'opacity-50'）
    const opacityClass = convertNumberToOpacityClass(value);
    if (opacityClass) {
      toggleStyle(opacityClass, OPACITY_REGEXP);
    } else {
      // 如果找不到对应的类名，移除所有透明度类名
      toggleStyle('', OPACITY_REGEXP);
    }
  };

  /**
   * 处理圆角变更
   */
  const handleRadiusChange = (value: React.Key) => {
    const radiusValue = value as string;
    setRadius(radiusValue);

    // 通过 toggleStyle 方法将 radius 样式写入 editingClass
    if (radiusValue === 'Default' || radiusValue === 'None') {
      // 如果是 Default 或 None，移除所有圆角类名
      toggleStyle('', RADIUS_REGEXP);
    } else {
      // value 是用户友好的标签（如 'Small'），需要转换为 Tailwind 类名（如 'rounded-sm'）
      const radiusClass = convertLabelToRadiusClass(radiusValue);
      if (radiusClass) {
        toggleStyle(radiusClass, RADIUS_REGEXP);
      } else {
        // 如果找不到对应的类名，移除所有圆角类名
        toggleStyle('', RADIUS_REGEXP);
      }
    }
  };

  /**
   * 处理阴影变更
   */
  const handleShadowChange = (value: React.Key) => {
    const shadowValue = value as string;
    setShadowType(shadowValue);

    // 通过 toggleStyle 方法将 shadow 样式写入 editingClass
    if (shadowValue === 'Default' || shadowValue === 'None') {
      // 如果是 Default 或 None，移除所有阴影类名
      toggleStyle('', SHADOW_REGEXP);
    } else {
      // value 是用户友好的标签（如 'Small'），需要转换为 Tailwind 类名（如 'shadow-sm'）
      const shadowClass = convertLabelToShadowClass(shadowValue);
      if (shadowClass) {
        toggleStyle(shadowClass, SHADOW_REGEXP);
      } else {
        // 如果找不到对应的类名，移除所有阴影类名
        toggleStyle('', SHADOW_REGEXP);
      }
    }
  };

  /**
   * 处理文本内容变更
   */
  const handleTextContentChange = (value: string) => {
    setLocalTextContent(value);
    // 更新内容到 iframe 中
    handleContentUpdate(value);
  };

  /**
   * 处理颜色切换
   */
  const handleToggleColor = (prefix: string, color: string) => {
    const colorClassRegexp = getColorClassRegexp(prefix);
    // 如果选择的是 Default，直接移除所有该前缀的颜色样式
    // 颜色类名格式包括：
    // - {prefix}-transparent
    // - {prefix}-black
    // - {prefix}-white
    // - {prefix}-{colorName}-{shade}，如 text-red-500, bg-blue-600
    if (color === 'Default') {
      // 匹配所有颜色类名，但不匹配其他样式类名
      // 例如 text- 前缀：匹配 text-red-500, text-white 等，但不匹配 text-xs, text-center 等
      // 例如 bg- 前缀：匹配 bg-blue-600, bg-white 等
      // 例如 border- 前缀：已在 handleBorderColorChange 中特殊处理
      toggleStyle('', colorClassRegexp);
    } else {
      const itemColor = colorOptions.find((item) => item.value === color);
      const styleClass = `${prefix}-${itemColor?.label}`;
      toggleStyle(styleClass, colorClassRegexp);
    }
  };

  /**
   * 处理文本颜色变更
   */
  const handleColorChange = (color: string) => {
    setLocalColor(color);
    handleToggleColor('text', color);
  };

  /**
   * 处理背景变更
   */
  const handleBackgroundChange = (color: string) => {
    setLocalBackground(color);
    handleToggleColor('bg', color);
  };

  /**
   * 处理边框颜色变更
   */
  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);

    // 如果选择的是 Default，直接移除所有 border color 相关的样式
    // border color 的类名格式包括：
    // - border-transparent
    // - border-black
    // - border-white
    // - border-{colorName}-{shade}，如 border-red-500
    // 正则表达式匹配所有 border color 类名，但不匹配 border-solid, border-2 等（border style 和 border width）
    if (color === 'Default') {
      // 匹配 border-transparent, border-black, border-white, border-{colorName}-{shade}
      // 排除 border-solid, border-dashed 等（border style）
      // 排除 border-0, border-2, border-4, border-8 等（border width）
      toggleStyle('', BORDER_COLOR_REGEXP);
    } else {
      handleToggleColor('border', color);
    }
  };

  /**
   * 处理边框样式变更
   */
  const handleBorderStyleChange = (value: React.Key) => {
    const styleValue = value as string;
    setBorderStyle(styleValue);

    // 通过 toggleStyle 方法将 border 样式写入 editingClass
    if (styleValue === 'Default') {
      // 如果是 Default，移除所有边框样式类名
      toggleStyle('', BORDER_STYLE_REGEXP);
    } else {
      // 使用 Tailwind 边框样式类名（value 已经是类名，如 'border-solid'）
      toggleStyle(styleValue, BORDER_STYLE_REGEXP);
    }
  };

  /**
   * 处理外边距变更（四边独立）
   */
  const handleMarginChange = (
    type: PaddingOrMarginType,
    value: string | null,
  ) => {
    if (value !== null) {
      const { spaceObject: newMargin, prefix } = getPaddingOrMarginSpace(
        type,
        value,
        'margin',
        localMargin,
      );
      setLocalMargin(newMargin);

      // value 已经是 Tailwind spacing 值（如 '40'），直接使用
      // 正则表达式：精确匹配相同前缀的 margin 类名
      // 例如：m- 只匹配 m-*，不匹配 mx-*、my-*、mt-* 等
      // mx- 只匹配 mx-*，不匹配 m-*、my-*、mt-* 等
      const marginRegex =
        prefix === 'm'
          ? /^m-(?![xytrbl])/ // m- 后面不能是 x、y、t、r、b、l（避免匹配 mx-、my-、mt- 等）
          : new RegExp(`^${prefix}-`);
      toggleStyle(`${prefix}-${value}`, marginRegex);
    }
  };

  /**
   * 处理内边距变更（四边独立）
   */
  const handlePaddingChange = (
    type: PaddingOrMarginType,
    value: string | null,
  ) => {
    if (value !== null) {
      const { spaceObject: newPadding, prefix } = getPaddingOrMarginSpace(
        type,
        value,
        'padding',
        localPadding,
      );
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
   * 处理文本对齐变更
   */
  const handleTextAlignChange = (
    align: 'left' | 'center' | 'right' | 'justify' | 'reset',
  ) => {
    if (align === 'reset') {
      setTextAlign('');
      // 移除所有文本对齐类名
      toggleStyle('', TEXT_ALIGN_REGEXP, 'textAlign');
    } else {
      setTextAlign(align);
      // 通过 toggleStyle 方法将 text align 样式写入 editingClass
      // value 是用户友好的标签（如 'left'），需要转换为 Tailwind 类名（如 'text-left'）
      const textAlignClass = convertLabelToTextAlignClass(align);
      if (textAlignClass) {
        toggleStyle(textAlignClass, TEXT_ALIGN_REGEXP, 'textAlign');
      } else {
        // 如果找不到对应的类名，移除所有文本对齐类名
        toggleStyle('', TEXT_ALIGN_REGEXP, 'textAlign');
      }
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
   * 切换边框宽度展开状态
   */
  const toggleBorderWidthExpand = () => {
    setIsBorderWidthExpanded(!isBorderWidthExpanded);
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
                FILENAME_REGEXP,
                '',
              ),
            },
            {
              title: (
                // 元素标签名
                <span>{selectedElement?.tagName}</span>
              ),
            },
          ]}
        />
        {/* <Dropdown
          menu={{ items: moreMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <MoreOutlined className={cx(styles.moreIcon)} />
        </Dropdown> */}
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
                  onChange={handleFontWeightChange}
                  options={fontWeightOptions}
                />
              </div>
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>Font Size</div>
                <SelectList
                  className={cx(styles.typographySelect)}
                  value={fontSize}
                  onChange={handleFontSizeChange}
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
                  onChange={handleLineHeightChange}
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
                  onChange={handleLetterSpacingChange}
                  options={letterSpacingOptions}
                />
              </div>
            </div>

            <div className={cx(styles.typographyRow)}>
              {/* Alignment */}
              <div className={cx(styles.typographyInputGroup)}>
                <div className={cx(styles.typographyInputLabel)}>Alignment</div>
                <div className={cx(styles.buttonGroup)}>
                  {TEXT_ALIGN_OPTIONS.map((option) => (
                    <Tooltip title={option.label} key={option.type}>
                      <Button
                        className={cx(styles.toggleButton, {
                          [styles.active]: textAlign === option.type,
                        })}
                        onClick={() =>
                          handleTextAlignChange(
                            option.type as
                              | 'reset'
                              | 'left'
                              | 'center'
                              | 'right'
                              | 'justify',
                          )
                        }
                        icon={option.icon}
                      />
                    </Tooltip>
                  ))}
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
                onChange={handleBorderStyleChange}
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
                onChange={handleOpacityChange}
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
                onChange={handleRadiusChange}
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
            onChange={handleShadowChange}
            options={shadowOptions}
            prefix={<ShadowSvg className={cx(styles.layoutIcon)} />}
          />
        </div>
      </div>
    </div>
  );
};

export default DesignViewer;
