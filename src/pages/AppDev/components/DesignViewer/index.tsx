import SelectList from '@/components/custom/SelectList';
import {
  ExpandAltOutlined,
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
    vertical: number;
    horizontal: number;
    isLinked?: boolean;
  };
  /** 内边距配置 */
  padding?: {
    vertical: number;
    horizontal: number;
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
  const [localMargin, setLocalMargin] = useState(margin);
  const [localPadding, setLocalPadding] = useState(padding);
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
  const [borderWidth, setBorderWidth] = useState(0);
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
   * 处理外边距变更
   */
  const handleMarginChange = (
    type: 'vertical' | 'horizontal',
    value: number | null,
  ) => {
    const newMargin = { ...localMargin };
    if (value !== null) {
      if (type === 'vertical') {
        newMargin.vertical = value;
      } else {
        newMargin.horizontal = value;
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
   * 处理内边距变更
   */
  const handlePaddingChange = (
    type: 'vertical' | 'horizontal',
    value: number | null,
  ) => {
    const newPadding = { ...localPadding };
    if (value !== null) {
      if (type === 'vertical') {
        newPadding.vertical = value;
      } else {
        newPadding.horizontal = value;
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
   * 展开/折叠布局输入框
   */
  const expandLayoutInputs = () => {
    // 这里可以实现展开为四个独立输入框的逻辑
    console.log('Expand layout inputs');
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
                    icon={
                      <svg
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.46967 9.09099L5 9.62132L6.06066 8.56066L5.53033 8.03033L3.56063 6.06063H10.125C11.989 6.06063 13.5 7.57167 13.5 9.43563C13.5 11.2996 11.989 12.8106 10.125 12.8106H4.5H3.75V14.3106H4.5H10.125C12.8174 14.3106 15 12.128 15 9.43563C15 6.74324 12.8174 4.56063 10.125 4.56063H3.56069L5.53033 2.59099L6.06066 2.06066L5 1L4.46967 1.53033L1.21967 4.78033C0.926777 5.07322 0.926777 5.5481 1.21967 5.84099L4.46967 9.09099Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    }
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'left',
                    })}
                    onClick={() => handleTextAlignChange('left')}
                    title="Left Align"
                  >
                    <svg
                      width="16"
                      height="12"
                      viewBox="0 0 16 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="0"
                        y="1"
                        width="12"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="5.25"
                        width="10"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="9.5"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'center',
                    })}
                    onClick={() => handleTextAlignChange('center')}
                    title="Center Align"
                  >
                    <svg
                      width="16"
                      height="12"
                      viewBox="0 0 16 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="1"
                        width="12"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="3"
                        y="5.25"
                        width="10"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="1"
                        y="9.5"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'right',
                    })}
                    onClick={() => handleTextAlignChange('right')}
                    title="Right Align"
                  >
                    <svg
                      width="16"
                      height="12"
                      viewBox="0 0 16 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="4"
                        y="1"
                        width="12"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="6"
                        y="5.25"
                        width="10"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="2"
                        y="9.5"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textAlign === 'justify',
                    })}
                    onClick={() => handleTextAlignChange('justify')}
                    title="Justify"
                  >
                    <svg
                      width="16"
                      height="12"
                      viewBox="0 0 16 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="0"
                        y="1"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="5.25"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                      <rect
                        x="0"
                        y="9.5"
                        width="14"
                        height="1.5"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
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
                    icon={<ItalicOutlined />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('strikethrough'),
                    })}
                    onClick={() => handleTextDecorationChange('strikethrough')}
                    icon={<StrikethroughOutlined />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('underline'),
                    })}
                    onClick={() => handleTextDecorationChange('underline')}
                    icon={<UnderlineOutlined />}
                  />
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.includes('overline'),
                    })}
                    onClick={() => handleTextDecorationChange('overline')}
                    title="Overline"
                  >
                    <svg
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                    >
                      <path
                        d="M11.2002 9.25C11.2002 7.48269 9.76731 6.0498 8 6.0498C6.23269 6.0498 4.7998 7.48269 4.7998 9.25C4.7998 11.0173 6.23269 12.4502 8 12.4502V14.25C5.23858 14.25 3 12.0114 3 9.25C3 6.48858 5.23858 4.25 8 4.25C10.7614 4.25 13 6.48858 13 9.25C13 12.0114 10.7614 14.25 8 14.25V12.4502C9.76731 12.4502 11.2002 11.0173 11.2002 9.25Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M3 1.25H13V2.75H3V1.25Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </Button>
                  <Button
                    className={cx(styles.toggleButton, {
                      [styles.active]: textDecoration.length === 0,
                    })}
                    onClick={() => {
                      setTextDecoration([]);
                      onChange?.('textDecoration', []);
                    }}
                  >
                    <svg
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                    >
                      <path
                        d="M8.00371 14.804C5.07771 14.804 3.23471 12.068 3.23471 7.774C3.23471 3.442 5.07771 0.706 8.00371 0.706C10.9297 0.706 12.7727 3.442 12.7727 7.774C12.7727 12.068 10.9297 14.804 8.00371 14.804ZM4.88771 7.774C4.88771 9.047 5.05871 10.149 5.40071 11.023L9.80871 3.1C9.31471 2.568 8.70671 2.264 8.00371 2.264C6.10371 2.264 4.88771 4.392 4.88771 7.774ZM6.17971 12.41C6.67371 12.942 7.30071 13.246 8.00371 13.246C9.90371 13.246 11.1197 11.118 11.1197 7.774C11.1197 6.463 10.9297 5.323 10.5877 4.43L6.17971 12.41Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </Button>
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
            <div className={cx(styles.layoutInputs)}>
              <div className={cx('flex items-center gap-4 flex-1')}>
                <InputNumber
                  className={cx('flex-1')}
                  value={localMargin.vertical}
                  onChange={(value) => handleMarginChange('vertical', value)}
                  prefix={
                    <div className={cx(styles.layoutIcon)}>
                      <svg
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                      >
                        <path
                          d="M14 1V15H12.5V1H14ZM5.00488 5.89746C5.05621 5.39333 5.48232 5 6 5H10L10.1025 5.00488C10.573 5.05278 10.9472 5.42703 10.9951 5.89746L11 6V10L10.9951 10.1025C10.9472 10.573 10.573 10.9472 10.1025 10.9951L10 11H6C5.48232 11 5.05621 10.6067 5.00488 10.1025L5 10V6L5.00488 5.89746ZM9.5 9.5V6.5H6.5L6.5 9.5H9.5ZM3.5 1L3.5 15H2L2 1H3.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  }
                  suffix="px"
                  controls={false}
                />
                <InputNumber
                  className={cx('flex-1')}
                  value={localMargin.horizontal}
                  onChange={(value) => handleMarginChange('horizontal', value)}
                  prefix={
                    <div className={cx(styles.layoutIcon)}>
                      <svg
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                      >
                        <path
                          d="M15 14H1V12.5H15V14ZM10.1025 5.00488C10.6067 5.05621 11 5.48232 11 6V10L10.9951 10.1025C10.9472 10.573 10.573 10.9472 10.1025 10.9951L10 11H6L5.89746 10.9951C5.42703 10.9472 5.05278 10.573 5.00488 10.1025L5 10V6C5 5.48232 5.39333 5.05621 5.89746 5.00488L6 5H10L10.1025 5.00488ZM6.5 9.5H9.5V6.5H6.5V9.5ZM15 3.5H1V2H15V3.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  }
                  suffix="px"
                  controls={false}
                />
              </div>
              <div className={cx(styles.layoutActions)}>
                <ExpandAltOutlined
                  className={cx(styles.actionIcon)}
                  onClick={expandLayoutInputs}
                />
                {localMargin.isLinked ? (
                  <LockOutlined
                    className={cx(styles.actionIcon, styles.active)}
                    onClick={toggleMarginLink}
                  />
                ) : (
                  <UnlockOutlined
                    className={cx(styles.actionIcon)}
                    onClick={toggleMarginLink}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Padding */}
          <div className={cx(styles.layoutSubSection)}>
            <div className={cx(styles.layoutLabel)}>Padding</div>
            <div className={cx(styles.layoutInputs)}>
              <div className={cx('flex items-center gap-4 flex-1')}>
                <InputNumber
                  className={cx('flex-1')}
                  value={localPadding.vertical}
                  onChange={(value) => handlePaddingChange('vertical', value)}
                  prefix={
                    <div className={cx(styles.layoutIcon)}>
                      <svg
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                      >
                        <path
                          d="M14.9951 14.1025C14.9438 14.6067 14.5177 15 14 15H2L1.89746 14.9951C1.42703 14.9472 1.05278 14.573 1.00488 14.1025L1 14V2L1.00488 1.89746C1.05278 1.42703 1.42703 1.05278 1.89746 1.00488L2 1H14C14.5177 1 14.9438 1.39333 14.9951 1.89746L15 2V14L14.9951 14.1025ZM2.5 2.5V13.5H13.5V2.5H2.5ZM4.2666 12.375V3.625H5.66699V12.375H4.2666ZM10.333 12.375V3.625H11.7334V12.375H10.333Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  }
                  suffix="px"
                  controls={false}
                />
                <InputNumber
                  className={cx('flex-1')}
                  value={localPadding.horizontal}
                  onChange={(value) => handlePaddingChange('horizontal', value)}
                  prefix={
                    <div className={cx(styles.layoutIcon)}>
                      <svg
                        height="16"
                        strokeLinejoin="round"
                        viewBox="0 0 16 16"
                        width="16"
                      >
                        <path
                          d="M14.1025 1.00488C14.6067 1.05621 15 1.48232 15 2V14L14.9951 14.1025C14.9472 14.573 14.573 14.9472 14.1025 14.9951L14 15H2L1.89746 14.9951C1.42703 14.9472 1.05278 14.573 1.00488 14.1025L1 14V2C1 1.48232 1.39333 1.05621 1.89746 1.00488L2 1H14L14.1025 1.00488ZM2.5 13.5H13.5V2.5H2.5V13.5ZM12.375 11.7334H3.625V10.333H12.375V11.7334ZM12.375 5.66699H3.625V4.2666H12.375V5.66699Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  }
                  suffix="px"
                  controls={false}
                />
              </div>
              <div className={cx(styles.layoutActions)}>
                <ExpandAltOutlined
                  className={cx(styles.actionIcon)}
                  onClick={expandLayoutInputs}
                />
                {localPadding.isLinked ? (
                  <LockOutlined
                    className={cx(styles.actionIcon, styles.active)}
                    onClick={togglePaddingLink}
                  />
                ) : (
                  <UnlockOutlined
                    className={cx(styles.actionIcon)}
                    onClick={togglePaddingLink}
                  />
                )}
              </div>
            </div>
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
          <div className={cx(styles.typographyRow)}>
            <div className={cx(styles.typographyInputGroup, styles.fullWidth)}>
              <div className={cx(styles.typographyInputLabel)}>
                Border Width
              </div>
              <div className={cx(styles.borderWidthContainer)}>
                <InputNumber
                  className={cx('w-full')}
                  value={borderWidth}
                  onChange={(value) => {
                    setBorderWidth(value || 0);
                    onChange?.('borderWidth', value || 0);
                  }}
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
                <ExpandAltOutlined
                  className={cx(styles.actionIcon, styles.expandIcon)}
                  onClick={() => {
                    // 展开为独立输入框的逻辑
                    console.log('Expand border width inputs');
                  }}
                />
              </div>
            </div>
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
                prefix={
                  <div className={cx(styles.layoutIcon)}>
                    <svg
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="transparent"
                      ></circle>
                      <path
                        opacity="0.33"
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5 1H7V3H5V1ZM5 5V3H3V5H1V7H3V9H1V11H3V13H5V15H7V13H9V15H11V13H13V11H15V9H13V7H15V5H13V3H11V1H9V3H7V5H5ZM5 7H3V5H5V7ZM7 7V5H9V7H7ZM7 9V7H5V9H3V11H5V13H7V11H9V13H11V11H13V9H11V7H13V5H11V3H9V5H11V7H9V9H7ZM9 9H11V11H9V9ZM7 9V11H5V9H7Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </div>
                }
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
                prefix={
                  <div className={cx(styles.layoutIcon)}>
                    <svg
                      height="16"
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width="16"
                    >
                      <path
                        d="M13.9658 3.25024H7.72168C5.82405 3.25024 4.28522 4.78817 4.28516 6.68579V14.5002H2.78516V6.68579C2.78522 3.95975 4.99562 1.75024 7.72168 1.75024H13.9658V3.25024Z"
                        fill="#666666"
                      ></path>
                    </svg>
                  </div>
                }
              />
            </div>
          </div>
        </div>

        {/* Shadow 配置 */}
        <div className={cx(styles.propertySection)}>
          <div className={cx(styles.propertyLabel)}>Shadow</div>
          <SelectList
            className={cx(styles.typographySelect, styles.shadowSelect)}
            value={shadowType}
            onChange={(value) => {
              setShadowType(value as string);
              onChange?.('shadowType', value);
            }}
            options={shadowOptions}
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
                    <g clipPath="url(#clip0_11223_26193)">
                      <path
                        opacity="0.33"
                        d="M15.25 12C15.25 13.7949 13.7949 15.25 12 15.25H4C2.20508 15.25 0.750002 13.7949 0.75 12V11.9492C1.63982 13.0724 3.00385 13.7499 4.47168 13.75H11.2832C12.8846 13.7499 14.3732 12.9417 15.25 11.6074V12Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      ></path>
                      <rect
                        x="0.75"
                        y="0.75"
                        width="14.5"
                        height="11.5"
                        rx="3.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      ></rect>
                    </g>
                    <defs>
                      <clipPath id="clip0_11223_26193">
                        <rect width="16" height="16" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                </svg>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DesignViewer;
