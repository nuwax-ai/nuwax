import useGlobalSettings from '@/hooks/useGlobalSettings';
import { getTexts } from '@/utils/locales';
import {
  GlobalOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Drawer,
  FloatButton,
  Row,
  Space,
  Switch,
  theme,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import './index.less';

const { Title, Text } = Typography;
const { useToken } = theme;

/**
 * 全局设置组件
 * 提供主题切换、语言切换等功能
 */
const GlobalSettings: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const {
    theme: currentTheme,
    language,
    isDarkMode,
    isChineseLanguage,
    toggleTheme,
    toggleLanguage,
  } = useGlobalSettings();

  const { token } = useToken();
  const texts = getTexts(language);

  // 显示设置抽屉
  const showDrawer = () => {
    setDrawerVisible(true);
  };

  // 隐藏设置抽屉
  const hideDrawer = () => {
    setDrawerVisible(false);
  };

  console.log('token', token);
  console.log('currentTheme', currentTheme);

  return (
    <>
      {/* 悬浮设置按钮 */}
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        style={{
          right: 24,
          bottom: 24,
        }}
        onClick={showDrawer}
        tooltip={texts.globalSettings}
      />

      {/* 设置抽屉 */}
      <Drawer
        title={
          <Space>
            <SettingOutlined />
            {texts.globalSettings}
          </Space>
        }
        placement="right"
        onClose={hideDrawer}
        open={drawerVisible}
        width={360}
        className="global-settings-drawer"
      >
        <div className="settings-content">
          {/* 外观设置 */}
          <div className="setting-section">
            <Title level={5} className="section-title">
              <SunOutlined />
              <span style={{ marginLeft: 8 }}>{texts.appearance}</span>
            </Title>

            {/* 主题切换 */}
            <Row
              align="middle"
              justify="space-between"
              className="setting-item"
            >
              <Col>
                <Space direction="vertical" size={2}>
                  <Text strong>{texts.theme}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {isDarkMode ? texts.darkTheme : texts.lightTheme}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  size="default"
                />
              </Col>
            </Row>

            <Divider />

            {/* 语言切换 */}
            <Row
              align="middle"
              justify="space-between"
              className="setting-item"
            >
              <Col>
                <Space direction="vertical" size={2}>
                  <Text strong>{texts.language}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {isChineseLanguage ? texts.chinese : texts.english}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Switch
                  checked={!isChineseLanguage}
                  onChange={toggleLanguage}
                  checkedChildren={<TranslationOutlined />}
                  unCheckedChildren={<GlobalOutlined />}
                  size="default"
                />
              </Col>
            </Row>
          </div>

          {/* 快速切换按钮 */}
          <div className="setting-section">
            <Title level={5} className="section-title">
              {texts.settings}
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                type="default"
                block
                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {texts.toggleTheme}
              </Button>

              <Button
                type="default"
                block
                icon={<TranslationOutlined />}
                onClick={toggleLanguage}
                style={{
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {texts.toggleLanguage}
              </Button>
            </Space>
          </div>

          {/* 设置信息 */}
          <div className="setting-section">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {texts.theme}: {isDarkMode ? texts.darkTheme : texts.lightTheme}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {texts.language}:{' '}
                {isChineseLanguage ? texts.chinese : texts.english}
              </Text>
            </Space>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default GlobalSettings;
