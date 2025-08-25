import { useBackground } from '@/hooks/useBackground';
import {
  PictureOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, Popover, Radio, Space, Tooltip } from 'antd';
import React, { useState } from 'react';
import './index.less';

/**
 * 背景快速切换组件
 * 提供简洁的背景切换界面，可以在任何地方使用
 */
const BackgroundQuickSwitch: React.FC<{
  /** 是否显示设置按钮 */
  showSettings?: boolean;
  /** 是否显示随机切换按钮 */
  showRandom?: boolean;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 按钮类型 */
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}> = ({
  showSettings = true,
  showRandom = true,
  size = 'middle',
  type = 'default',
  style,
  className,
}) => {
  const {
    backgroundImages,
    currentBackground,
    setBackground,
    randomBackground,
  } = useBackground();
  const [popoverVisible, setPopoverVisible] = useState(false);

  // 背景选择器内容
  const backgroundSelector = (
    <div className="background-quick-switch-popover">
      <div className="popover-title">选择背景</div>
      <Radio.Group
        value={currentBackground?.id}
        onChange={(e) => {
          setBackground(e.target.value);
          setPopoverVisible(false);
        }}
      >
        <Space direction="vertical" size="small">
          {backgroundImages.map((bg) => (
            <Radio key={bg.id} value={bg.id}>
              <div className="bg-option">
                <div className="bg-preview">
                  <img
                    src={bg.preview}
                    alt={bg.name}
                    className="bg-preview-img"
                  />
                </div>
                <span className="bg-name">{bg.name}</span>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );

  return (
    <div className={`background-quick-switch ${className || ''}`} style={style}>
      <Space>
        {/* 背景选择器 */}
        <Popover
          content={backgroundSelector}
          title="选择背景图片"
          trigger="click"
          placement="bottomRight"
          open={popoverVisible}
          onOpenChange={setPopoverVisible}
        >
          <Button
            icon={<PictureOutlined />}
            size={size}
            type={type}
            title="切换背景"
          >
            背景
          </Button>
        </Popover>

        {/* 随机切换按钮 */}
        {showRandom && (
          <Tooltip title="随机切换背景">
            <Button
              icon={<SwapOutlined />}
              size={size}
              type={type}
              onClick={randomBackground}
            />
          </Tooltip>
        )}

        {/* 设置按钮 */}
        {showSettings && (
          <Tooltip title="背景管理">
            <Button
              icon={<SettingOutlined />}
              size={size}
              type={type}
              onClick={() => {
                // 这里可以打开背景管理页面或模态框
                // 可以通过路由跳转或全局状态管理
                console.log('打开背景管理');
              }}
            />
          </Tooltip>
        )}
      </Space>
    </div>
  );
};

export default BackgroundQuickSwitch;
