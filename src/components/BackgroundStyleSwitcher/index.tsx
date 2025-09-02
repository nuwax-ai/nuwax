/**
 * 背景风格切换组件
 * 提供背景图选择和深浅色风格切换功能
 */
import useGlobalSettings from '@/hooks/useGlobalSettings';
import { BgColorsOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';
import './index.less';

const { Title, Text } = Typography;

interface BackgroundStyleSwitcherProps {
  /**
   * 组件尺寸
   */
  size?: 'small' | 'default' | 'large';
  /**
   * 是否显示标题
   */
  showTitle?: boolean;
  /**
   * 是否显示背景图选择
   */
  showBackgrounds?: boolean;
  /**
   * 是否显示风格切换
   */
  showStyleToggle?: boolean;
}

const BackgroundStyleSwitcher: React.FC<BackgroundStyleSwitcherProps> = ({
  size = 'default',
  showTitle = true,
  showBackgrounds = true,
  showStyleToggle = true,
}) => {
  const {
    isDarkMode,
    backgroundImages,
    backgroundImageId,
    setBackgroundImage,
    setTheme,
  } = useGlobalSettings();

  const handleBackgroundChange = (backgroundId: string) => {
    setBackgroundImage(backgroundId);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'middle';
    }
  };

  return (
    <div
      className={`background-style-switcher background-style-switcher-${size}`}
    >
      {showTitle && (
        <div className="switcher-header">
          <Title level={4}>
            <BgColorsOutlined /> 背景风格切换
          </Title>
        </div>
      )}

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 背景图选择 */}
        {showBackgrounds && (
          <Card size="small" title="背景图选择" className="background-selector">
            <div className="background-grid">
              {backgroundImages.map((bg) => (
                <div
                  key={bg.id}
                  className={`background-preview ${
                    backgroundImageId === bg.id ? 'selected' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${bg.preview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#f0f0f0',
                  }}
                  onClick={() => handleBackgroundChange(bg.id)}
                  title={bg.name}
                >
                  <div className="background-overlay">
                    <div className="background-info">
                      <div className="background-name">{bg.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 风格切换 */}
        {showStyleToggle && (
          <Card size="small" title="风格切换" className="style-toggle">
            <Space>
              <Button
                type={!isDarkMode ? 'primary' : 'default'}
                size={getButtonSize()}
                onClick={() => setTheme('light')}
                icon={<SettingOutlined />}
              >
                浅色风格
              </Button>
              <Button
                type={isDarkMode ? 'primary' : 'default'}
                size={getButtonSize()}
                onClick={() => setTheme('dark')}
                icon={<BgColorsOutlined />}
              >
                深色风格
              </Button>
            </Space>
            <div className="current-style-info">
              <Text type="secondary">
                当前风格: {isDarkMode ? '深色' : '浅色'}
              </Text>
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default BackgroundStyleSwitcher;
