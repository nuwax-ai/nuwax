import { ReactComponent as AlignCenterSvg } from '@/assets/icons/design/align_center.svg';
import { ReactComponent as AlignJustifySvg } from '@/assets/icons/design/align_justify.svg';
import { ReactComponent as AlignLeftSvg } from '@/assets/icons/design/align_left.svg';
import { ReactComponent as AlignRightSvg } from '@/assets/icons/design/align_right.svg';
import { ReactComponent as MarginBottomSvg } from '@/assets/icons/design/margin_bottom.svg';
import { ReactComponent as MarginHorizontalSvg } from '@/assets/icons/design/margin_horizontal.svg';
import { ReactComponent as MarginLeftSvg } from '@/assets/icons/design/margin_left.svg';
import { ReactComponent as MarginRightSvg } from '@/assets/icons/design/margin_right.svg';
import { ReactComponent as MarginTopSvg } from '@/assets/icons/design/margin_top.svg';
import { ReactComponent as MarginVerticalSvg } from '@/assets/icons/design/margin_vertical.svg';
import { ReactComponent as OpacitySvg } from '@/assets/icons/design/opacity.svg';
import { ReactComponent as OverlineSvg } from '@/assets/icons/design/overline.svg';
import { ReactComponent as PaddingBottomSvg } from '@/assets/icons/design/padding_bottom.svg';
import { ReactComponent as PaddingHorizontalSvg } from '@/assets/icons/design/padding_horizontal.svg';
import { ReactComponent as PaddingLeftSvg } from '@/assets/icons/design/padding_left.svg';
import { ReactComponent as PaddingRightSvg } from '@/assets/icons/design/padding_right.svg';
import { ReactComponent as PaddingTopSvg } from '@/assets/icons/design/padding_top.svg';
import { ReactComponent as PaddingVerticalSvg } from '@/assets/icons/design/padding_vertical.svg';
import { ReactComponent as RadiusSvg } from '@/assets/icons/design/radius.svg';
import { ReactComponent as ResetSvg } from '@/assets/icons/design/reset.svg';
import { ReactComponent as ShadowSvg } from '@/assets/icons/design/shadow.svg';
import { ReactComponent as TabularNumbersSvg } from '@/assets/icons/design/tabular_numbers.svg';
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
import styles from './index.less';

const cx = classNames.bind(styles);

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
    isLinked?: boolean;
  };
  /** 内边距配置 */
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    vertical?: number;
    horizontal?: number;
    isLinked?: boolean;
  };
  /** 尺寸配置 */
  size?: {
    width: number;
    height: number;
    isLinked?: boolean;
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
  margin = { vertical: 0, horizontal: 0, isLinked: true },
  padding = { vertical: 0, horizontal: 0, isLinked: true },
  onChange,
}) => {
  // 本地状态管理
  const [localColor, setLocalColor] = useState(color);
  const [localBackground, setLocalBackground] = useState(background);
  const [localMargin, setLocalMargin] = useState({
    top: margin?.top ?? margin?.vertical ?? 0,
    right: margin?.right ?? margin?.horizontal ?? 0,
    bottom: margin?.bottom ?? margin?.vertical ?? 0,
    left: margin?.left ?? margin?.horizontal ?? 0,
    isLinked: margin?.isLinked ?? true,
  });
  const [localPadding, setLocalPadding] = useState({
    top: padding?.top ?? padding?.vertical ?? 0,
    right: padding?.right ?? padding?.horizontal ?? 0,
    bottom: padding?.bottom ?? padding?.vertical ?? 0,
    left: padding?.left ?? padding?.horizontal ?? 0,
    isLinked: padding?.isLinked ?? true,
  });
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
  const [localBorderWidth, setLocalBorderWidth] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    type: 'top' | 'right' | 'bottom' | 'left' | 'vertical' | 'horizontal',
    value: number | null,
  ) => {
    const newMargin = { ...localMargin };
    if (value !== null) {
      if (type === 'vertical') {
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
    const newMargin = { ...localMargin, isLinked: !localMargin.isLinked };
    setLocalMargin(newMargin);
    onChange?.('margin', newMargin);
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
    type: 'top' | 'right' | 'bottom' | 'left' | 'vertical' | 'horizontal',
    value: number | null,
  ) => {
    const newPadding = { ...localPadding };
    if (value !== null) {
      if (type === 'vertical') {
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
    const newPadding = { ...localPadding, isLinked: !localPadding.isLinked };
    setLocalPadding(newPadding);
    onChange?.('padding', newPadding);
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
    value: number | null,
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
              // 折叠状态：显示上下和左右两个输入框
              <div className={cx(styles.layoutInputs)}>
                <div
                  className={cx('flex items-center flex-1', styles['gap-8'])}
                >
                  <InputNumber
                    className={cx('flex-1')}
                    value={localMargin.top}
                    onChange={(value) => handleMarginChange('vertical', value)}
                    prefix={
                      <MarginHorizontalSvg className={cx(styles.layoutIcon)} />
                    }
                    suffix="px"
                    controls={false}
                  />
                  <InputNumber
                    className={cx('flex-1')}
                    value={localMargin.left}
                    onChange={(value) =>
                      handleMarginChange('horizontal', value)
                    }
                    prefix={
                      <MarginVerticalSvg className={cx(styles.layoutIcon)} />
                    }
                    suffix="px"
                    controls={false}
                  />
                </div>
                <div className={cx(styles.layoutActions)}>
                  <Button
                    type="text"
                    icon={<ExpandOutlined />}
                    onClick={toggleMarginExpand}
                  />
                  {localMargin.isLinked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={toggleMarginLink}
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
              // 展开状态：显示四边独立输入框（两行两列）
              <div className={cx(styles.layoutInputs)}>
                <div className={cx(styles.expandedLayout)}>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localMargin.top}
                      onChange={(value) => handleMarginChange('top', value)}
                      prefix={
                        <MarginTopSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localMargin.bottom}
                      onChange={(value) => handleMarginChange('bottom', value)}
                      prefix={
                        <MarginBottomSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localMargin.left}
                      onChange={(value) => handleMarginChange('left', value)}
                      prefix={
                        <MarginLeftSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localMargin.right}
                      onChange={(value) => handleMarginChange('right', value)}
                      prefix={
                        <MarginRightSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                </div>
                <div className={cx(styles.layoutActions)}>
                  <Button
                    type="text"
                    icon={<CompressOutlined />}
                    onClick={toggleMarginExpand}
                  />
                  {localMargin.isLinked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={toggleMarginLink}
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
              // 折叠状态：显示上下和左右两个输入框
              <div className={cx(styles.layoutInputs)}>
                <div
                  className={cx('flex items-center flex-1', styles['gap-8'])}
                >
                  <InputNumber
                    className={cx('flex-1')}
                    value={localPadding.top}
                    onChange={(value) => handlePaddingChange('vertical', value)}
                    prefix={
                      <PaddingHorizontalSvg className={cx(styles.layoutIcon)} />
                    }
                    suffix="px"
                    controls={false}
                  />
                  <InputNumber
                    className={cx('flex-1')}
                    value={localPadding.left}
                    onChange={(value) =>
                      handlePaddingChange('horizontal', value)
                    }
                    prefix={
                      <PaddingVerticalSvg className={cx(styles.layoutIcon)} />
                    }
                    suffix="px"
                    controls={false}
                  />
                </div>
                <div className={cx(styles.layoutActions)}>
                  <Button
                    type="text"
                    icon={<ExpandOutlined />}
                    onClick={togglePaddingExpand}
                  />
                  {localPadding.isLinked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={togglePaddingLink}
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
              // 展开状态：显示四边独立输入框（两行两列）
              <div className={cx(styles.layoutInputs)}>
                <div className={cx(styles.expandedLayout)}>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localPadding.top}
                      onChange={(value) => handlePaddingChange('top', value)}
                      prefix={
                        <PaddingTopSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localPadding.bottom}
                      onChange={(value) => handlePaddingChange('bottom', value)}
                      prefix={
                        <PaddingBottomSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localPadding.left}
                      onChange={(value) => handlePaddingChange('left', value)}
                      prefix={
                        <PaddingLeftSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localPadding.right}
                      onChange={(value) => handlePaddingChange('right', value)}
                      prefix={
                        <PaddingRightSvg className={cx(styles.layoutIcon)} />
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                </div>
                <div className={cx(styles.layoutActions)}>
                  <Button
                    type="text"
                    icon={<CompressOutlined />}
                    onClick={togglePaddingExpand}
                  />
                  {localPadding.isLinked ? (
                    <Button
                      type="text"
                      icon={<LockOutlined />}
                      onClick={togglePaddingLink}
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
                prefix={
                  <div className={cx(styles.layoutIcon)}>
                    <svg
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_11223_26136)">
                          <rect
                            x="0.75"
                            y="0.75"
                            width="14.5"
                            height="14.5"
                            rx="3.25"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          ></rect>
                          <path
                            opacity="0.33"
                            d="M3 15L1.5 14.5L1 13H3V15ZM7 15H5V13H7V15ZM11 15H9V13H11V15ZM14.5 14.5L13 15V13H15L14.5 14.5ZM5 13H3V11H5V13ZM9 13H7V11H9V13ZM13 13H11V11H13V13ZM3 11H1V9H3V11ZM7 11H5V9H7V11ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM5 9H3V7H5V9ZM9 9H7V7H9V9ZM13 9H11V7H13V9ZM3 7H1V5H3V7ZM7 7H5V5H7V7ZM11 7H9V5H11V7ZM15 7H13V5H15V7ZM5 5H3V3H5V5ZM9 5H7V3H9V5ZM13 5H11V3H13V5ZM3 3H1L1.5 1.5L3 1V3ZM7 3H5V1H7V3ZM11 3H9V1H11V3ZM14.5 1.5L15 3H13V1L14.5 1.5Z"
                            fill="currentColor"
                          ></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_11223_26136">
                            <rect width="16" height="16" fill="white"></rect>
                          </clipPath>
                        </defs>
                      </svg>
                    </svg>
                  </div>
                }
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
              // 折叠状态：显示单个输入框
              <div className={cx(styles.layoutInputs)}>
                <div className={cx('flex items-center gap-4 flex-1')}>
                  <InputNumber
                    className={cx('flex-1')}
                    value={localBorderWidth.top}
                    onChange={(value) => handleBorderWidthChange('all', value)}
                    prefix={
                      <div className={cx(styles.layoutIcon)}>
                        <svg
                          height="16"
                          strokeLinejoin="round"
                          viewBox="0 0 16 16"
                          width="16"
                        >
                          <path
                            d="M15 14.5H1V9.5H15V14.5ZM2.5 13H13.5V11H2.5V13ZM15 8.5H1V4.5H15V8.5ZM2.5 7H13.5V6H2.5V7ZM15 3.5H1V2H15V3.5Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </div>
                    }
                    suffix="px"
                    controls={false}
                    placeholder="0px"
                  />
                </div>
                <Button
                  type="text"
                  icon={<CompressOutlined />}
                  onClick={toggleBorderWidthExpand}
                />
              </div>
            ) : (
              // 展开状态：显示四边独立输入框（两行两列）
              <div className={cx(styles.layoutInputs)}>
                <div className={cx(styles.expandedLayout)}>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localBorderWidth.top}
                      onChange={(value) =>
                        handleBorderWidthChange('top', value)
                      }
                      prefix={
                        <div className={cx(styles.layoutIcon)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="12"
                              height="12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <rect
                              x="2"
                              y="2"
                              width="12"
                              height="2"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localBorderWidth.bottom}
                      onChange={(value) =>
                        handleBorderWidthChange('bottom', value)
                      }
                      prefix={
                        <div className={cx(styles.layoutIcon)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="12"
                              height="12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <rect
                              x="2"
                              y="12"
                              width="12"
                              height="2"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                  <div className={cx(styles.expandedRow)}>
                    <InputNumber
                      className={cx('flex-1')}
                      value={localBorderWidth.left}
                      onChange={(value) =>
                        handleBorderWidthChange('left', value)
                      }
                      prefix={
                        <div className={cx(styles.layoutIcon)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="12"
                              height="12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <rect
                              x="2"
                              y="2"
                              width="2"
                              height="12"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      }
                      suffix="px"
                      controls={false}
                    />
                    <InputNumber
                      className={cx('flex-1')}
                      value={localBorderWidth.right}
                      onChange={(value) =>
                        handleBorderWidthChange('right', value)
                      }
                      prefix={
                        <div className={cx(styles.layoutIcon)}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="12"
                              height="12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <rect
                              x="12"
                              y="2"
                              width="2"
                              height="12"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      }
                      suffix="px"
                      controls={false}
                    />
                  </div>
                </div>
                <Button
                  type="text"
                  icon={<ExpandOutlined />}
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
