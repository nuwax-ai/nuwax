import SelectList from '@/components/custom/SelectList';
import {
  CompressOutlined,
  ExpandOutlined,
  ItalicOutlined,
  LockOutlined,
  MoreOutlined,
  StrikethroughOutlined,
  ThunderboltOutlined,
  UnderlineOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  Breadcrumb,
  Button,
  Dropdown,
  Input,
  InputNumber,
  Select,
  Space,
} from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
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
  OverlineSvg,
  PaddingBottomSvg,
  PaddingHorizontalSvg,
  PaddingLeftSvg,
  PaddingRightSvg,
  PaddingTopSvg,
  PaddingVerticalSvg,
  RadiusSvg,
  ResetSvg,
  ShadowSvg,
  TabularNumbersSvg,
} from './design.images.constants';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 像素值选项列表（根据图片中的下拉选项）
 */
const pixelOptions = [
  { label: '0px', value: '0px' },
  { label: '1px', value: '1px' },
  { label: '2px', value: '2px' },
  { label: '4px', value: '4px' },
  { label: '6px', value: '6px' },
  { label: '8px', value: '8px' },
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '40px', value: '40px' },
  { label: '44px', value: '44px' },
  { label: '48px', value: '48px' },
  { label: '56px', value: '56px' },
  { label: '64px', value: '64px' },
  { label: '80px', value: '80px' },
  { label: '96px', value: '96px' },
  { label: '100px', value: '100px' },
  { label: '112px', value: '112px' },
  { label: '128px', value: '128px' },
  { label: '144px', value: '144px' },
  { label: '160px', value: '160px' },
  { label: '176px', value: '176px' },
  { label: '192px', value: '192px' },
  { label: '208px', value: '208px' },
  { label: '224px', value: '224px' },
  { label: '240px', value: '240px' },
  { label: '256px', value: '256px' },
  { label: '288px', value: '288px' },
  { label: '320px', value: '320px' },
  { label: '384px', value: '384px' },
  { label: 'auto', value: 'auto' },
];

/**
 * Padding 像素值选项列表（不包含 auto）
 */
const paddingPixelOptions = pixelOptions.filter(
  (option) => option.value !== 'auto',
);

/**
 * Border Width 像素值选项列表（简化的选项：0px, 1px, 2px, 4px, 8px）
 */
const borderWidthOptions = [
  { label: '0px', value: '0px' },
  { label: '1px', value: '1px' },
  { label: '2px', value: '2px' },
  { label: '4px', value: '4px' },
  { label: '8px', value: '8px' },
];

/**
 * 属性面板组件 Props
 */
interface DesignViewerProps {
  /** 当前选中的元素名称 */
  elementName?: string;
  /** 父级路径（用于面包屑） */
  parentPath?: string;
  /** 图标值 */
  icon?: string;
  /** 颜色值 */
  color?: string;
  /** 背景值 */
  background?: string;
  /** 外边距配置 */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    vertical?: number;
    horizontal?: number;
  };
  /** 内边距配置 */
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    vertical?: number;
    horizontal?: number;
  };
  /** 边框配置 */
  border?: {
    width?: number;
    style?: string;
    color?: string;
  };
  /** 值变更回调 */
  onChange?: (key: string, value: any) => void;
}

/**
 * 设计查看器组件
 * 提供元素属性编辑面板，包括图标、颜色、背景、布局、尺寸和边框等配置
 */
const DesignViewer: React.FC<DesignViewerProps> = ({
  elementName = 'Sparkles',
  parentPath = 'Page',
  color = 'primary',
  background = 'Default',
  margin = { vertical: 0, horizontal: 0 },
  padding = { vertical: 0, horizontal: 0 },
  onChange,
}) => {
  // 本地状态管理
  const [localColor, setLocalColor] = useState(color);
  const [localBackground, setLocalBackground] = useState(background);
  const [localMargin, setLocalMargin] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  }>({
    top: margin?.top ?? margin?.vertical ?? '0px',
    right: margin?.right ?? margin?.horizontal ?? '0px',
    bottom: margin?.bottom ?? margin?.vertical ?? '0px',
    left: margin?.left ?? margin?.horizontal ?? '0px',
  });
  const [localPadding, setLocalPadding] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
  }>({
    top: padding?.top ?? padding?.vertical ?? '0px',
    right: padding?.right ?? padding?.horizontal ?? '0px',
    bottom: padding?.bottom ?? padding?.vertical ?? '0px',
    left: padding?.left ?? padding?.horizontal ?? '0px',
  });
  const [isMarginLocked, setIsMarginLocked] = useState(true);
  const [isPaddingLocked, setIsPaddingLocked] = useState(true);
  const [isMarginExpanded, setIsMarginExpanded] = useState(false);
  const [isPaddingExpanded, setIsPaddingExpanded] = useState(false);
  const [localTextContent, setLocalTextContent] = useState('');
  const [localTypography, setLocalTypography] = useState('body');
  const [fontWeight, setFontWeight] = useState('Semi Bold');
  const [fontSize, setFontSize] = useState('lg');
  const [lineHeight, setLineHeight] = useState('1.75rem');
  const [letterSpacing, setLetterSpacing] = useState('0em');
  const [textAlign, setTextAlign] = useState<
    'left' | 'center' | 'right' | 'justify' | 'reset'
  >('center');
  const [textDecoration, setTextDecoration] = useState<string[]>([]);
  const [borderStyle, setBorderStyle] = useState('Default');
  const [borderColor, setBorderColor] = useState('Default');
  const [localBorderWidth, setLocalBorderWidth] = useState<{
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
    isOpen: boolean;
  }>({
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
    isOpen: true,
  });
  const [isBorderWidthExpanded, setIsBorderWidthExpanded] = useState(false);
  const [opacity, setOpacity] = useState(40);
  const [radius, setRadius] = useState('Small');
  const [shadowType, setShadowType] = useState('Default');

  /**
   * 处理Typography变更
   */
  const handleTypographyChange = (value: string) => {
    setLocalTypography(value);
    onChange?.('typography', value);
  };
  /**
   * 处理文本内容变更
   */
  const handleTextContentChange = (value: string) => {
    setLocalTextContent(value);
    onChange?.('textContent', value);
  };

  /**
   * 处理颜色变更
   */
  const handleColorChange = (color: string) => {
    setLocalColor(color);
    onChange?.('color', color);
  };

  /**
   * 处理背景变更
   */
  const handleBackgroundChange = (value: string) => {
    setLocalBackground(value);
    onChange?.('background', value);
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
      if (type === 'all') {
        // 统一设置所有边
        newMargin.top = value;
        newMargin.right = value;
        newMargin.bottom = value;
        newMargin.left = value;
      } else if (type === 'vertical') {
        newMargin.top = value;
        newMargin.bottom = value;
      } else if (type === 'horizontal') {
        newMargin.left = value;
        newMargin.right = value;
      } else {
        newMargin[type] = value;
      }
      setLocalMargin(newMargin);
      onChange?.('margin', newMargin);
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
      if (type === 'all') {
        // 统一设置所有边
        newPadding.top = value;
        newPadding.right = value;
        newPadding.bottom = value;
        newPadding.left = value;
      } else if (type === 'vertical') {
        newPadding.top = value;
        newPadding.bottom = value;
      } else if (type === 'horizontal') {
        newPadding.left = value;
        newPadding.right = value;
      } else {
        newPadding[type] = value;
      }
      setLocalPadding(newPadding);
      onChange?.('padding', newPadding);
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
      onChange?.('borderWidth', newBorderWidth);
    }
  };

  /**
   * 切换边框宽度展开状态
   */
  const toggleBorderWidthExpand = () => {
    setIsBorderWidthExpanded(!isBorderWidthExpanded);
  };

  // 颜色选项
  const colorOptions = [
    { label: 'primary', value: '#1890ff' },
    { label: 'secondary', value: '#8c8c8c' },
    { label: 'success', value: '#52c41a' },
    { label: 'warning', value: '#faad14' },
    { label: 'error', value: '#ff4d4f' },
  ];

  // 背景选项
  const backgroundOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'Transparent', value: 'Transparent' },
    { label: 'White', value: '#fff' },
    { label: 'Gray', value: '#8c8c8c' },
  ];

  // 更多操作菜单
  const moreMenuItems = [
    { key: 'copy', label: '复制属性' },
    { key: 'reset', label: '重置' },
    { key: 'delete', label: '删除' },
  ];

  // Typography 选项
  const typographyOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'Sans Serif', value: 'Sans Serif' },
    { label: 'Serif', value: 'Serif' },
    { label: 'Monospace', value: 'Monospace' },
  ];

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

  // Font Size 选项
  const fontSizeOptions = [
    { label: 'xs', value: 'xs' },
    { label: 'sm', value: 'sm' },
    { label: 'md', value: 'md' },
    { label: 'lg', value: 'lg' },
    { label: 'xl', value: 'xl' },
    { label: '2xl', value: '2xl' },
    { label: '3xl', value: '3xl' },
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

  // Border Style 选项
  const borderStyleOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'None', value: 'None' },
    { label: 'Solid', value: 'Solid' },
    { label: 'Dashed', value: 'Dashed' },
    { label: 'Dotted', value: 'Dotted' },
  ];

  // Border Color 选项
  const borderColorOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'Black', value: '#000000' },
    { label: 'White', value: '#ffffff' },
    { label: 'Gray', value: '#8c8c8c' },
  ];

  // Radius 选项
  const radiusOptions = [
    { label: 'None', value: 'None' },
    { label: 'Small', value: 'Small' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Large', value: 'Large' },
    { label: 'Full', value: 'Full' },
  ];

  // Shadow 选项
  const shadowOptions = [
    { label: 'Default', value: 'Default' },
    { label: 'Small', value: 'Small' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Large', value: 'Large' },
    { label: 'None', value: 'None' },
  ];

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
    onChange?.('textAlign', align === 'reset' ? 'left' : align);
  };

  /**
   * 处理文本装饰变更
   */
  const handleTextDecorationChange = (decoration: string) => {
    const newDecorations = textDecoration.includes(decoration)
      ? textDecoration.filter((d) => d !== decoration)
      : [...textDecoration, decoration];
    setTextDecoration(newDecorations);
    onChange?.('textDecoration', newDecorations);
  };

  return (
    <div className={cx(styles.designViewer)}>
      {/* 面包屑导航 */}
      <div className={cx(styles.breadcrumbContainer)}>
        <Breadcrumb
          items={[
            {
              title: parentPath,
            },
            {
              title: (
                <Space>
                  <ThunderboltOutlined className={cx(styles.breadcrumbIcon)} />
                  <span>{elementName}</span>
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
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Text Content</div>
          <Input.TextArea
            className={cx('w-full')}
            value={localTextContent}
            onChange={(e) => handleTextContentChange(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 4 }}
          />
        </div>

        {/* Typography 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Typography</div>
          <SelectList
            className={cx(styles.propertyInput)}
            value={localTypography}
            onChange={(value) => handleTypographyChange(value as string)}
            options={typographyOptions}
          />

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
                    onChange?.('fontWeight', value);
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
                    onChange?.('fontSize', value);
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
                    onChange?.('lineHeight', value);
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
                    onChange?.('letterSpacing', value);
                  }}
                  options={letterSpacingOptions}
                />
              </div>
            </div>

            {/* Alignment */}
            <div className={cx(styles.typographyRow)}>
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
            </div>
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
              <div
                className={cx(styles.colorSwatch)}
                style={{ background: localColor }}
              />
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
            options={backgroundOptions}
            prefix={
              <div
                className={cx(styles.colorSwatch)}
                style={{ background: localBackground }}
              />
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
              <SelectList
                className={cx(styles.typographySelect)}
                value={borderStyle}
                prefix={<BorderColorSvg className={cx(styles.layoutIcon)} />}
                onChange={(value) => {
                  setBorderStyle(value as string);
                  onChange?.('borderStyle', value);
                }}
                options={borderStyleOptions}
              />
            </div>
            <div className={cx(styles.typographyInputGroup)}>
              <div className={cx(styles.typographyInputLabel)}>
                Border Style
              </div>
              <SelectList
                className={cx(styles.typographySelect)}
                value={borderColor}
                onChange={(value) => {
                  setBorderColor(value as string);
                  onChange?.('borderColor', value);
                }}
                options={borderColorOptions}
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
                        : `${localBorderWidth.top || 0}px`
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
                          : `${localBorderWidth.top || 0}px`
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
                          : `${localBorderWidth.bottom || 0}px`
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
                          : `${localBorderWidth.left || 0}px`
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
                          : `${localBorderWidth.right || 0}px`
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
              <InputNumber
                className={cx('w-full')}
                value={opacity}
                onChange={(value) => {
                  setOpacity(value || 0);
                  onChange?.('opacity', value || 0);
                }}
                prefix={<OpacitySvg className={cx(styles.layoutIcon)} />}
                suffix="%"
                min={0}
                max={100}
                controls={false}
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
                  onChange?.('radius', value);
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
              onChange?.('shadowType', value);
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
