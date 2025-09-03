import SvgIcon from '@/components/base/SvgIcon';
import { THEME_COLOR_CONFIGS } from '@/constants/theme.constants';
import { ColorPicker } from 'antd';
import { Color } from 'antd/es/color-picker';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './ThemeColorPanel.less';

const cx = classNames.bind(styles);

interface ThemeColorPanelProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ThemeColorPanel: React.FC<ThemeColorPanelProps> = ({
  currentColor,
  onColorChange,
}) => {
  // 使用统一的主题色配置
  const presetColors = THEME_COLOR_CONFIGS;

  const handleColorChange = (color: Color, hex: string) => {
    onColorChange(hex);
  };

  const handlePresetColorClick = (color: string) => {
    onColorChange(color);
  };

  const [customColor] = useState<string>('#CBCED6');

  return (
    <div className={cx(styles.themeColorPanel)}>
      <h3 className={cx(styles.panelTitle)}>主题色</h3>

      {/* 预设颜色选择 */}
      <div className={cx(styles.presetColorsSection)}>
        <div className={cx(styles.presetColorsGrid)}>
          {presetColors.map((item) => (
            <div
              className={cx(styles.colorPreviewItemContainer)}
              key={item.color}
            >
              <div
                className={cx(styles.colorPreviewItem, {
                  [styles.active]: currentColor === item.color,
                })}
                onClick={() => handlePresetColorClick(item.color)}
                title={item.name}
                style={
                  {
                    '--hover-border-color': item.color,
                  } as React.CSSProperties
                }
              >
                <span
                  className={cx(styles.colorPreviewItemSolid)}
                  style={{ backgroundColor: item.color }}
                ></span>
              </div>
              <span
                className={cx(styles.colorPreviewItemText)}
                style={{
                  opacity: currentColor === item.color ? 1 : 0,
                }}
              >
                {item.name}
              </span>
            </div>
          ))}
          {/* 自定义颜色选择器 */}
          <div className={cx(styles.colorPreviewItemContainer)}>
            <div
              className={cx(styles.colorPreviewItem, styles.customColorSection)}
              style={
                {
                  '--hover-border-color': customColor,
                } as React.CSSProperties
              }
            >
              <ColorPicker
                value={customColor}
                onChange={handleColorChange}
                size="large"
                format="hex"
                className={cx(styles.customColorPicker)}
                showText={() => (
                  <SvgIcon
                    name="icons-common-straw"
                    className={cx(styles.customColorPickerIcon)}
                  />
                )}
              />
            </div>
            <span
              className={cx(styles.colorPreviewItemText)}
              style={{
                opacity: currentColor === customColor ? 1 : 0,
              }}
            >
              自定义
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeColorPanel;
