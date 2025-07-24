import type { ThemeConfig } from 'antd/es/config-provider';
import type { AliasToken, ComponentTokenMap } from 'antd/es/theme/interface';

import themeTokens from './themeTokens';
type ButtonToken = Partial<ComponentTokenMap['Button'] | AliasToken>;
type SelectToken = Partial<ComponentTokenMap['Select'] | AliasToken>;
type InputToken = Partial<ComponentTokenMap['Input'] | AliasToken>;

type MenuToken = Partial<ComponentTokenMap['Menu'] | AliasToken>;
type DatePickerToken = Partial<ComponentTokenMap['DatePicker'] | AliasToken>;
type FormToken = Partial<ComponentTokenMap['Form'] | AliasToken>;
type MessageToken = Partial<ComponentTokenMap['Message'] | AliasToken>;
type NotificationToken = Partial<
  ComponentTokenMap['Notification'] | AliasToken
>;
type ModalToken = Partial<ComponentTokenMap['Modal'] | AliasToken>;
type CardToken = Partial<ComponentTokenMap['Card'] | AliasToken>;
type TableToken = Partial<ComponentTokenMap['Table'] | AliasToken>;
type SegmentedToken = Partial<ComponentTokenMap['Segmented'] | AliasToken>;

// 2. 定义组件级别的主题配置
const componentThemes: ThemeConfig['components'] = {
  // Button 组件
  Button: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    fontWeight: 400,
    primaryShadow: 'none',
    defaultShadow: 'none',
    dangerShadow: 'none',
    // 按钮特定配置
    paddingInline: 15,
    paddingBlock: 4,
    onlyIconSize: 16,
    groupBorderColor: 'transparent',
  } as ButtonToken,

  // Input 组件
  Input: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    paddingInline: 11,
    paddingBlock: 4,
    activeBorderColor: themeTokens.colorPrimary,
    hoverBorderColor: '#7B6EFF',
    activeShadow: '0 0 0 2px rgba(81, 71, 255, 0.2)',
    errorActiveShadow: '0 0 0 2px rgba(255, 77, 79, 0.2)',
    warningActiveShadow: '0 0 0 2px rgba(255, 140, 0, 0.2)',
  } as InputToken,

  // Select 组件
  Select: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    optionSelectedBg: 'rgba(81, 71, 255, 0.1)',
    optionActiveBg: 'rgba(81, 71, 255, 0.05)',
    optionSelectedColor: themeTokens.colorPrimary,
    optionPadding: '5px 12px',
    showArrowPaddingInlineEnd: 18,
  } as SelectToken,

  // Table 组件
  Table: {
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    headerBg: '#fafafa',
    headerColor: '#666666',
    headerSortActiveBg: '#f0f0f0',
    headerSortHoverBg: '#f5f5f5',
    bodySortBg: '#fafafa',
    rowHoverBg: 'rgba(81, 71, 255, 0.03)',
    rowSelectedBg: 'rgba(81, 71, 255, 0.05)',
    rowSelectedHoverBg: 'rgba(81, 71, 255, 0.08)',
    rowExpandedBg: '#fbfbfb',
    cellPaddingBlock: 16,
    cellPaddingInline: 16,
    cellPaddingBlockMD: 12,
    cellPaddingInlineMD: 12,
    cellPaddingBlockSM: 8,
    cellPaddingInlineSM: 8,
  } as TableToken,

  // Card 组件
  Card: {
    borderRadius: themeTokens.borderRadiusLG,
    paddingLG: themeTokens.paddingLG,
    padding: themeTokens.padding,
    paddingSM: themeTokens.paddingSM,
    headerBg: 'transparent',
    headerFontSize: themeTokens.fontSizeLG,
    headerFontSizeSM: themeTokens.fontSize,
    headerHeight: 56,
    headerHeightSM: 36,
    actionsBg: '#fafafa',
    actionsLiMargin: '12px 0',
    tabsMarginBottom: -17,
  } as CardToken,

  // Modal 组件
  Modal: {
    borderRadius: themeTokens.borderRadiusLG,
    padding: themeTokens.paddingLG,
    paddingLG: themeTokens.paddingLG,
    titleFontSize: themeTokens.fontSizeLG,
    titleLineHeight: 1.6,
    contentBg: '#ffffff',
    headerBg: '#ffffff',
    footerBg: 'transparent',
    maskBg: 'rgba(0, 0, 0, 0.45)',
  } as ModalToken,

  // Message 组件
  Message: {
    contentBg: '#ffffff',
    contentPadding: '12px 16px',
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    zIndexPopup: 1010,
  } as MessageToken,

  // Notification 组件
  Notification: {
    borderRadius: themeTokens.borderRadius,
    padding: themeTokens.padding,
    paddingLG: themeTokens.paddingLG,
    width: 384,
    zIndexPopup: 1010,
  } as NotificationToken,

  // DatePicker 组件
  DatePicker: {
    colorPrimary: themeTokens.colorPrimary,
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    cellActiveWithRangeBg: 'rgba(81, 71, 255, 0.1)',
    cellHoverWithRangeBg: 'rgba(81, 71, 255, 0.05)',
    cellRangeBorderColor: 'transparent',
    cellBgDisabled: '#f5f5f5',
    timeColumnWidth: 56,
    timeColumnHeight: 224,
    timeCellHeight: 28,
  } as DatePickerToken,

  // Form 组件
  Form: {
    labelFontSize: themeTokens.fontSize,
    labelColor: '#000000d9',
    labelRequiredMarkColor: themeTokens.colorError,
    labelColonMarginInlineStart: 2,
    labelColonMarginInlineEnd: 8,
    itemMarginBottom: 24,
    verticalLabelPadding: '0 0 8px',
    verticalLabelMargin: 0,
  } as FormToken,

  // Menu 组件
  Menu: {
    borderRadius: themeTokens.borderRadius,
    fontSize: themeTokens.fontSize,
    itemBg: 'transparent',
    itemColor: '#000000d9',
    itemHoverBg: 'rgba(0, 0, 0, 0.06)',
    itemHoverColor: '#000000d9',
    itemSelectedBg: 'rgba(81, 71, 255, 0.1)',
    itemSelectedColor: themeTokens.colorPrimary,
    itemActiveBg: 'rgba(81, 71, 255, 0.15)',
    subMenuItemBg: 'transparent',
    itemMarginBlock: 4,
    itemMarginInline: 4,
    itemPaddingInline: 12,
    itemHeight: 40,
    collapsedWidth: 80,
    iconSize: 14,
    iconMarginInlineEnd: 10,
  } as MenuToken,

  // Segmented 组件
  Segmented: {
    borderRadius: themeTokens.borderRadius,
    controlHeight: themeTokens.controlHeight,
    fontSize: themeTokens.fontSize,
    itemSelectedBg: '#fff',
    itemSelectedColor: themeTokens.colorPrimary,
    trackBg: '#f9f9f9',
  } as SegmentedToken,
};

export default componentThemes;
