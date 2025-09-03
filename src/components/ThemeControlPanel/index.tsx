import BackgroundStyleSwitcher from '@/components/BackgroundStyleSwitcher';
import { ColorPicker, Popover } from 'antd';
import React from 'react';
import { useIntl } from 'umi';
import './index.less';

/**
 * 主题控制面板组件
 * 包含主题切换、语言切换、主题色选择器和背景风格切换器
 *
 * @param props 组件属性
 * @param props.isDarkMode 是否为暗色主题
 * @param props.toggleTheme 切换主题的回调函数
 * @param props.language 当前语言
 * @param props.toggleLanguage 切换语言的回调函数
 * @param props.primaryColor 当前主题色
 * @param props.setPrimaryColor 设置主题色的回调函数
 * @returns 主题控制面板组件
 */
interface ThemeControlPanelProps {
  /** 是否为暗色主题 */
  isDarkMode: boolean;
  /** 切换主题的回调函数 */
  toggleTheme: () => void;
  /** 当前语言 */
  language: string;
  /** 切换语言的回调函数 */
  toggleLanguage: () => void;
  /** 当前主题色 */
  primaryColor: string;
  /** 设置主题色的回调函数 */
  setPrimaryColor: (color: string) => void;
}

const ThemeControlPanel: React.FC<ThemeControlPanelProps> = ({
  isDarkMode,
  toggleTheme,
  language,
  toggleLanguage,
  primaryColor,
  setPrimaryColor,
}) => {
  const intl = useIntl();

  return (
    <div className="theme-control-panel">
      {/* 主题切换按钮 */}
      <a className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode
          ? intl.formatMessage({
              id: 'theme.light',
              defaultMessage: 'Light',
            })
          : intl.formatMessage({
              id: 'theme.dark',
              defaultMessage: 'Dark',
            })}
      </a>

      {/* 分隔符 */}
      <span className="divider">|</span>

      {/* 语言切换按钮 */}
      <a className="language-toggle" onClick={toggleLanguage}>
        {language === 'zh-CN'
          ? intl.formatMessage({ id: 'lang.en', defaultMessage: 'English' })
          : intl.formatMessage({
              id: 'lang.zh',
              defaultMessage: 'Chinese',
            })}
      </a>

      {/* 分隔符 */}
      <span className="divider">|</span>

      {/* 主题色选择器 */}
      <div className="color-picker">
        <ColorPicker
          value={primaryColor}
          onChangeComplete={(c) => setPrimaryColor(c.toHexString())}
        />
      </div>

      {/* 分隔符 */}
      <span className="divider">|</span>

      {/* 背景风格切换器 */}
      <div className="background-selector">
        <Popover
          content={
            <BackgroundStyleSwitcher
              size="small"
              showTitle={false}
              showBackgrounds={true}
              showStyleToggle={true}
            />
          }
          title={intl.formatMessage({
            id: 'theme.background.select',
            defaultMessage: '选择背景风格',
          })}
          trigger="click"
          placement="bottomRight"
        >
          <a className="background-toggle">
            {intl.formatMessage({
              id: 'theme.background',
              defaultMessage: '背景',
            })}
          </a>
        </Popover>
      </div>
    </div>
  );
};

export default ThemeControlPanel;
