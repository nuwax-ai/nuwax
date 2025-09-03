# 主题配置页面设计文档

## 概述

本文档描述了智能体平台前端的主题配置页面设计，基于现有 system 路由下的 SystemConfig 页面架构实现。系统复用现有的权限方案和文件上传功能，专注于主题配置的 UI 组件实现，严格参照 UI 设计图(@系统管理.png)的视觉设计和交互模式。

### 核心设计原则

1. **UI 设计参照**：严格按照@系统管理.png 和@风格切换.png 的设计实现
2. **架构复用**：基于现有 SystemConfig 页面的 Tab 架构扩展
3. **功能集成**：复用现有权限系统和文件上传服务
4. **组件复用**：集成现有 ThemeControlPanel 和 BackgroundStyleSwitcher 组件
5. **本地存储**：使用 localStorage 进行配置持久化，无需后端支持

## 技术架构

### 基于现有 SystemConfig 的页面架构集成

参照现有的`/system/config`页面架构，在 SYSTEM_SETTING_TABS 中新增 ThemeConfig 作为新的 Tab：

``mermaid graph TB subgraph "现有 SystemConfig 页面结构" A1[/system/config] --> A2[SystemConfig 页面] A2 --> A3[SYSTEM_SETTING_TABS] A3 --> A4[BaseConfig - 基础配置] A3 --> A5[ModelSetting - 默认模型设置] A3 --> A6[AgentSetting - 站点智能体设置] A3 --> A7[DomainBind - 域名绑定] A3 --> A8[ThemeConfig - 主题配置（新增）] end

    subgraph "主题配置Tab组件结构"
        A8 --> B1[主题色配置区域]
        A8 --> B2[背景图配置区域]
        A8 --> B3[导航栏风格配置区域]
        A8 --> B4[保存重置操作区域]
    end

    subgraph "现有系统集成"
        C1[useGlobalSettings Hook] --> B1
        C1 --> B2
        C1 --> B3
        C2[ThemeControlPanel 组件] --> B1
        C3[BackgroundStyleSwitcher 组件] --> B2
        C4[现有权限系统] --> A2
        C5[localStorage 本地存储] --> B4
    end

```

### 页面交互流程

基于现有SystemConfig页面的交互模式，主题配置的操作流程：

``mermaid
sequenceDiagram
    participant U as 用户
    participant S as SystemConfig页面
    participant T as ThemeConfigTab
    participant G as useGlobalSettings
    participant L as localStorage

    U->>S: 访问 /system/config
    S->>S: 加载现有SYSTEM_SETTING_TABS
    U->>T: 点击"主题配置"Tab
    T->>L: 获取本地存储的主题配置
    L->>T: 返回配置数据
    T->>G: 集成useGlobalSettings
    T->>T: 渲染UI设计图风格的主题配置UI

    U->>T: 修改主题配置(主题色/背景图/导航栏风格)
    T->>G: 实时应用到useGlobalSettings
    T->>T: 实时预览效果

    U->>T: 点击保存配置
    T->>L: 保存到localStorage
    T->>G: 永久应用配置到全局设置
```

## UI 组件设计

### SYSTEM_SETTING_TABS 的扩展

基于现有的`SYSTEM_SETTING_TABS`结构，新增主题配置 Tab：

``typescript // src/constants/system.constants.tsx - 扩展现有的 SYSTEM_SETTING_TABS export const SYSTEM_SETTING_TABS: TabsProps['items'] = [ // ... 现有 Tab { key: 'BaseConfig', label: '基础配置', }, { key: 'ModelSetting', label: '默认模型设置', }, { key: 'AgentSetting', label: '站点智能体设置', }, { key: 'DomainBind', label: '域名绑定', }, // 新增主题配置 Tab { key: 'ThemeConfig', label: '主题配置', }, ];

```

### 主题配置页面组件

基于现有SystemConfig页面的组件架构，参照UI设计图实现：

``typescript
// src/pages/SystemConfig/ThemeTab/index.tsx
import React from 'react';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { Row, Col, Card, Button, message } from 'antd';
import ThemeColorPanel from './components/ThemeColorPanel';
import BackgroundImagePanel from './components/BackgroundImagePanel';
import NavigationStylePanel from './components/NavigationStylePanel';
import styles from './index.less';

const ThemeConfigTab: React.FC = () => {
  const {
    primaryColor,
    setPrimaryColor,
    backgroundImages,
    backgroundImageId,
    setBackgroundImage,
    isDarkMode,
    toggleTheme
  } = useGlobalSettings();

  // 保存配置到本地存储
  const handleSave = async () => {
    try {
      const themeConfig = {
        selectedThemeColor: primaryColor,
        selectedBackgroundId: backgroundImageId,
        navigationStyle: isDarkMode ? 'dark' : 'light',
        timestamp: Date.now()
      };

      localStorage.setItem('user-theme-config', JSON.stringify(themeConfig));
      message.success('主题配置保存成功');
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 重置为默认配置
  const handleReset = () => {
    setPrimaryColor('#1890ff'); // 默认蓝色
    setBackgroundImage('bg-variant-1'); // 默认背景
    localStorage.removeItem('user-theme-config');
    message.info('已重置为默认配置');
  };

  return (
    <div className={styles.themeConfigContainer}>
      {/* 基于@系统管理.png的三列布局 */}
      <Row gutter={[24, 24]} className={styles.configRow}>
        <Col span={8}>
          <ThemeColorPanel
            currentColor={primaryColor}
            onColorChange={setPrimaryColor}
          />
        </Col>

        <Col span={8}>
          <BackgroundImagePanel
            backgroundImages={backgroundImages}
            currentBackground={backgroundImageId}
            onBackgroundChange={setBackgroundImage}
          />
        </Col>

        <Col span={8}>
          <NavigationStylePanel
            isDarkMode={isDarkMode}
            onThemeToggle={toggleTheme}
          />
        </Col>
      </Row>

      {/* 底部操作区域 */}
      <div className={styles.actionSection}>
        <div className={styles.actionButtons}>
          <Button type="primary" size="large" onClick={handleSave}>
            保存配置
          </Button>
          <Button size="large" onClick={handleReset}>
            重置默认
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThemeConfigTab;
```

### 主题色配置面板

基于现有 ThemeControlPanel 的 ColorPicker 实现：

``typescript // src/pages/SystemConfig/ThemeTab/components/ThemeColorPanel.tsx import React from 'react'; import { ColorPicker, Card } from 'antd'; import type { Color } from 'antd/es/color-picker'; import styles from './ThemeColorPanel.less';

// 预设颜色配置 const PRESET_COLORS = [ { name: '蓝色', value: '#5147ff' }, { name: '紫色', value: '#722ed1' }, { name: '青色', value: '#13c2c2' }, { name: '绿色', value: '#52c41a' }, { name: '橙色', value: '#fa8c16' }, { name: '红色', value: '#f5222d' } ];

interface ThemeColorPanelProps { currentColor: string; onColorChange: (color: string) => void; }

const ThemeColorPanel: React.FC<ThemeColorPanelProps> = ({ currentColor, onColorChange }) => { const handleColorChange = (value: Color) => { onColorChange(value.toHexString()); };

return ( <Card title="主题色配置" className={styles.themeColorPanel}> {/_ 预设颜色网格 _/} <div className={styles.presetColorsSection}> <h4>系统预设</h4> <div className={styles.presetColorsGrid}> {PRESET_COLORS.map(color => ( <div key={color.value} className={`${styles.colorPreviewItem} ${ currentColor === color.value ? styles.active : '' }`} style={{ backgroundColor: color.value }} onClick={() => onColorChange(color.value)} title={color.name} /> ))} </div> </div>

      {/* 自定义颜色选择器 */}
      <div className={styles.customColorSection}>
        <h4>自定义颜色</h4>
        <ColorPicker
          value={currentColor}
          onChangeComplete={handleColorChange}
          showText
          size="large"
        />
      </div>

      {/* 当前颜色预览 */}
      <div className={styles.currentColorPreview}>
        <h4>当前选中</h4>
        <div
          className={styles.currentColorDisplay}
          style={{ backgroundColor: currentColor }}
        >
          <span>{currentColor}</span>
        </div>
      </div>
    </Card>

); };

export default ThemeColorPanel;

```

### 背景图配置面板

集成现有BackgroundStyleSwitcher组件：

``typescript
// src/pages/SystemConfig/ThemeTab/components/BackgroundImagePanel.tsx
import React from 'react';
import { Card, Empty } from 'antd';
import { BackgroundImage } from '@/types/global';
import styles from './BackgroundImagePanel.less';

interface BackgroundImagePanelProps {
  backgroundImages: BackgroundImage[];
  currentBackground: string;
  onBackgroundChange: (backgroundId: string) => void;
}

const BackgroundImagePanel: React.FC<BackgroundImagePanelProps> = ({
  backgroundImages,
  currentBackground,
  onBackgroundChange
}) => {
  return (
    <Card title="背景图配置" className={styles.backgroundImagePanel}>
      {/* 无背景选项 */}
      <div className={styles.noneBackgroundSection}>
        <div
          className={`${styles.backgroundOption} ${
            currentBackground === 'none' ? styles.active : ''
          }`}
          onClick={() => onBackgroundChange('none')}
        >
          <div className={styles.noneBackground}>
            <span>无背景</span>
          </div>
        </div>
      </div>

      {/* 系统背景选项网格 */}
      <div className={styles.systemBackgroundsSection}>
        <h4>系统背景</h4>
        {backgroundImages.length > 0 ? (
          <div className={styles.backgroundGrid}>
            {backgroundImages.map(bg => (
              <div
                key={bg.id}
                className={`${styles.backgroundOption} ${
                  currentBackground === bg.id ? styles.active : ''
                }`}
                onClick={() => onBackgroundChange(bg.id)}
              >
                <div
                  className={styles.backgroundPreview}
                  style={{ backgroundImage: `url(${bg.preview})` }}
                  title={bg.name}
                />
                <span className={styles.backgroundName}>{bg.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="暂无可用背景图"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Card>
  );
};

export default BackgroundImagePanel;
```

### 导航栏风格配置面板

集成主题切换功能：

``typescript // src/pages/SystemConfig/ThemeTab/components/NavigationStylePanel.tsx import React from 'react'; import { Card, Switch, Radio, Space } from 'antd'; import { SunOutlined, MoonOutlined } from '@ant-design/icons'; import styles from './NavigationStylePanel.less';

interface NavigationStylePanelProps { isDarkMode: boolean; onThemeToggle: () => void; }

const NavigationStylePanel: React.FC<NavigationStylePanelProps> = ({ isDarkMode, onThemeToggle }) => { return ( <Card title="导航栏风格" className={styles.navigationStylePanel}> {/_ 主题模式切换 _/} <div className={styles.themeToggleSection}> <h4>主题模式</h4> <div className={styles.themeToggleControl}> <Space align="center" size="large"> <SunOutlined className={!isDarkMode ? styles.activeIcon : styles.inactiveIcon} /> <Switch 
              checked={isDarkMode}
              onChange={onThemeToggle}
              size="default"
            /> <MoonOutlined className={isDarkMode ? styles.activeIcon : styles.inactiveIcon} /> </Space> </div> <div className={styles.themeModeText}> 当前模式：{isDarkMode ? '暗色模式' : '明亮模式'} </div> </div>

      {/* 导航栏布局选择 */}
      <div className={styles.navigationLayoutSection}>
        <h4>导航栏布局</h4>
        <Radio.Group
          value="default"
          className={styles.layoutOptions}
        >
          <Space direction="vertical">
            <Radio value="default">默认布局</Radio>
            <Radio value="compact" disabled>紧凑布局（暂未开放）</Radio>
          </Space>
        </Radio.Group>
      </div>

      {/* 智能适应说明 */}
      <div className={styles.autoStyleSection}>
        <h4>智能适应</h4>
        <div className={styles.autoStyleDescription}>
          导航栏风格将根据所选背景图的明暗风格自动调整
        </div>
      </div>
    </Card>

); };

export default NavigationStylePanel;

```

## 本地存储架构

### 基于useGlobalSettings的集成

扩展现有的useGlobalSettings Hook支持主题配置持久化：

``typescript
// 扩展useGlobalSettings Hook
export const useGlobalSettings = () => {
  // ... 现有逻辑

  // 主题配置状态
  const [themeConfig, setThemeConfig] = useState({
    selectedThemeColor: primaryColor,
    selectedBackgroundId: backgroundImageId,
    navigationStyle: isDarkMode ? 'dark' : 'light'
  });

  // 从localStorage加载主题配置
  useEffect(() * => {
    const savedConfig = localStorage.getItem('user-theme-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setPrimaryColor(config.selectedThemeColor || '#1890ff');
        setBackgroundImage(config.selectedBackgroundId || 'bg-variant-1');
        if (config.navigationStyle === 'dark' && !isDarkMode) {
          toggleTheme();
        }
      } catch (error) {
        console.error('加载主题配置失败:', error);
      }
    }
  }, []);

  // 保存主题配置到localStorage
  const saveThemeConfig = useCallback((config: any) => {
    setThemeConfig(config);
    localStorage.setItem('user-theme-config', JSON.stringify(config));

    // 触发现有的全局事件
    const event = new CustomEvent('xagi-global-settings-changed', {
      detail: { type: 'theme-config-updated', data: config }
    });
    window.dispatchEvent(event);
  }, []);

  return {
    // ... 现有返回值
    themeConfig,
    saveThemeConfig
  };
};
```

### CSS 变量映射

| 深浅色模式 | CSS 变量 | 深色值 | 浅色值 |
| --- | --- | --- | --- |
| 一级菜单文字色 | --xagi-nav-first-menu-color-text | rgba(255,255,255,1) | rgba(0,0,0,1) |
| 一级菜单次要文字色 | --xagi-nav-first-menu-color-text-secondary | rgba(255,255,255,0.8) | rgba(0,0,0,0.8) |
| 二级菜单文字色 | --xagi-nav-second-menu-color-text | rgba(255,255,255,1) | rgba(0,0,0,1) |
| 二级菜单次要文字色 | --xagi-nav-second-menu-color-text-secondary | rgba(255,255,255,0.8) | rgba(0,0,0,0.8) |

### 背景图与导航栏联动机制

基于现有 backgroundService 实现：

``mermaid flowchart TD A[用户选择背景图] --> B[调用 setBackgroundImage 方法] B --> C[backgroundService.setBackground] C --> D[保存设置到 localStorage] D --> E[触发全局事件 xagi-global-settings-changed] E --> F[页面延时 300ms 重载]

    C --> G{预设背景图？}
    G -->|是| H[backgroundConfigs获取style属性]
    G -->|否| I[用户自定义背景]

    H --> J[backgroundStyleManager.applyStyle]
    J --> K[更新导航栏CSS变量]

    I --> L[不进行自动联动]

    K --> M[CSS变量生效]
    L --> M

```

## 错误处理与用户反馈

### 表单验证

``typescript
// 本地数据校验
const validateThemeConfig = (config: any): string[] => {
  const errors: string[] = [];

  // 主题色校验
  if (config.selectedThemeColor && !/^#[0-9A-Fa-f]{6}$/.test(config.selectedThemeColor)) {
    errors.push('主题色格式不正确');
  }

  // 背景图校验
  if (config.selectedBackgroundId && typeof config.selectedBackgroundId !== 'string') {
    errors.push('背景图ID格式不正确');
  }

  return errors;
};

// 成功反馈
const handleSuccess = {
  configSaved: () => message.success('主题配置保存成功！'),
  configReset: () => message.info('已重置为默认配置')
};
```

## 测试

### 单元测试

```typescript
// 主题配置组件测试
describe('ThemeConfigTab', () => {
  it('应该正确渲染三列布局', () => {
    render(<ThemeConfigTab />);
    expect(screen.getByText('主题色配置')).toBeInTheDocument();
    expect(screen.getByText('背景图配置')).toBeInTheDocument();
    expect(screen.getByText('导航栏风格')).toBeInTheDocument();
  });

  it('应该正确保存到localStorage', async () => {
    const { getByRole } = render(<ThemeConfigTab />);

    fireEvent.click(getByRole('button', { name: '保存配置' }));

    const savedConfig = localStorage.getItem('user-theme-config');
    expect(savedConfig).toBeTruthy();
    expect(JSON.parse(savedConfig!)).toMatchObject({
      selectedThemeColor: expect.any(String),
      selectedBackgroundId: expect.any(String),
      navigationStyle: expect.any(String)
    });
  });
});

        N[--xagi-nav-first-menu-color-text]
        O[--xagi-nav-second-menu-color-text]
        P[--xagi-nav-*-color-text-secondary]
        Q[--xagi-nav-*-color-text-tertiary]
    end

    M --> N
    M --> O
    M --> P
    M --> Q
```

#### 实际调用链路

基于 useGlobalSettings Hook 的实现：

```
// 设置背景图片的完整流程
const setBackgroundImage = (backgroundImageId: string) => {
  // 1. 更新backgroundService状态
  backgroundService.setBackground(backgroundImageId);

  // 2. 更新全局设置
  saveSettings({ ...settings, backgroundImageId });

  // 3. 页面重载以应用新背景和样式
  setTimeout(() => {
    window.location.reload();
  }, 300);
};
```

### 导航栏配置区域

#### 配置维度

| 配置类型     | 选项           | CSS 变量映射                    |
| ------------ | -------------- | ------------------------------- |
| 深浅色切换   | 深色/浅色      | --xagi-nav-\*-color-text 系列   |
| 导航栏风格   | 风格 1/风格 2  | --xagi-nav-\*-style 相关        |
| 一级菜单宽度 | 60px/88px 可调 | --xagi-nav-first-menu-width     |
| 字体大小     | 可调节数值     | --xagi-nav-first-menu-font-size |

#### CSS 变量映射表

| 深浅色模式 | CSS 变量 | 深色值 | 浅色值 |
| --- | --- | --- | --- |
| 一级菜单文字色 | --xagi-nav-first-menu-color-text | rgba(255,255,255,1) | rgba(0,0,0,1) |
| 一级菜单次要文字色 | --xagi-nav-first-menu-color-text-secondary | rgba(255,255,255,0.8) | rgba(0,0,0,0.8) |
| 二级菜单文字色 | --xagi-nav-second-menu-color-text | rgba(255,255,255,1) | rgba(0,0,0,1) |
| 二级菜单次要文字色 | --xagi-nav-second-menu-color-text-secondary | rgba(255,255,255,0.8) | rgba(0,0,0,0.8) |
| 二级菜单三级文字色 | --xagi-nav-second-menu-color-text-tertiary | rgba(255,255,255,0.55) | rgba(0,0,0,0.55) |

## 状态管理

### 基于 UmiJS Model 的状态管理架构

完全遵循 UmiJS Max 框架的 model 状态管理模式，与现有系统保持一致的架构风格：

#### UmiJS Model 集成策略

基于现有项目中的 model 使用模式（如`src/models/layout.ts`、`src/models/workflow.ts`等），设计新的主题配置 model：

```
// src/models/themeConfig.ts - 系统管理员主题配置Model
import { useState, useCallback, useRef } from 'react';
import { useRequest } from 'umi';

/**
 * 系统主题管理Model - 遵循现有UmiJS Model模式
 * 参考layout.ts和workflow.ts的设计模式
 */
const useThemeConfig = () => {
  // 系统配置数据状态
  const [systemConfig, setSystemConfig] = useState<SystemThemeConfigDTO>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 主题色管理状态
  const [availableColors, setAvailableColors] = useState<Array<ColorConfig>>([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<Array<BackgroundConfig>>([]);

  // 使用useRequest处理API调用 - 遵循项目惯例
  const { run: runSystemConfigQuery } = useRequest(
    '/api/admin/theme-config',
    {
      manual: true,
      debounceInterval: 300, // 遵循项目中300ms防抖惯例
      onSuccess: (result: SystemThemeConfigDTO) => {
        setSystemConfig(result);
        setAvailableColors(result.customColors || []);
        setAvailableBackgrounds(result.customBackgrounds || []);

        // 同步到现有backgroundService和useGlobalSettings
        syncToExistingServices(result);
      },
      onError: (error) => {
        setError('获取系统主题配置失败');
        console.error('系统主题配置加载失败:', error);
      }
    }
  );

  // 添加主题色 - 使用useRequest模式
  const { run: runAddColor, loading: addColorLoading } = useRequest(
    (colorData: Omit<ColorConfig, 'id'>) => ({
      url: '/api/admin/theme-config/colors',
      method: 'POST',
      data: colorData
    }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result, params) => {
        // 更新本地状态
        setAvailableColors(prev => [...prev, result.data]);

        // 触发现有全局事件系统
        const event = new CustomEvent('xagi-global-settings-changed', {
          detail: { type: 'system-colors-updated', data: result.data }
        });
        window.dispatchEvent(event);

        message.success('主题色添加成功');
      },
      onError: () => {
        setError('添加主题色失败');
      }
    }
  );

  // 添加背景图 - 集成backgroundService
  const { run: runAddBackground, loading: addBackgroundLoading } = useRequest(
    (backgroundData: { background: Omit<BackgroundConfig, 'id'>; file: File }) => {
      const formData = new FormData();
      formData.append('file', backgroundData.file);
      formData.append('name', backgroundData.background.name);
      formData.append('style', backgroundData.background.style);
      formData.append('description', backgroundData.background.description || '');

      return {
        url: '/api/admin/theme-config/backgrounds',
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      };
    },
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result, params) => {
        // 更新本地状态
        setAvailableBackgrounds(prev => [...prev, result.data]);

        // 同步到现有backgroundService
        backgroundService.addBackground({
          id: result.data.id,
          name: result.data.name,
          path: result.data.url,
          preview: result.data.thumbnailUrl
        });

        // 更新backgroundConfigs以支持风格联动
        backgroundConfigs.push({
          id: result.data.id,
          name: result.data.name,
          url: result.data.url,
          style: result.data.style,
          description: result.data.description
        });

        // 触发全局事件
        const event = new CustomEvent('xagi-global-settings-changed', {
          detail: { type: 'system-backgrounds-updated', data: result.data }
        });
        window.dispatchEvent(event);

        message.success('背景图添加成功');
      },
      onError: () => {
        setError('添加背景图失败');
      }
    }
  );

  // 同步到现有服务的方法
  const syncToExistingServices = useCallback((config: SystemThemeConfigDTO) => {
    // 1. 同步颜色到现有系统
    config.customColors?.forEach(color => {
      // 可以扩展useGlobalSettings支持的颜色选项
    });

    // 2. 同步背景到backgroundService
    config.customBackgrounds?.forEach(bg => {
      backgroundService.addBackground({
        id: bg.id,
        name: bg.name,
        path: bg.url,
        preview: bg.thumbnailUrl
      });

      // 同步到backgroundConfigs以支持风格联动
      if (!backgroundConfigs.find(cfg => cfg.id === bg.id)) {
        backgroundConfigs.push({
          id: bg.id,
          name: bg.name,
          url: bg.url,
          style: bg.style,
          description: bg.description
        });
      }
    });
  }, []);

  // 初始化加载 - 参考现有model的初始化模式
  const initializeSystemConfig = useCallback(() => {
    runSystemConfigQuery();
  }, [runSystemConfigQuery]);

  // 遵循现有项目的返回值模式
  return {
    // 状态数据
    systemConfig,
    availableColors,
    availableBackgrounds,
    loading,
    error,

    // 操作方法
    addColor: runAddColor,
    addBackground: runAddBackground,
    initializeSystemConfig,

    // 加载状态
    addColorLoading,
    addBackgroundLoading,
  };
};

export default useThemeConfig;
```

### 系统管理层 Hook 设计

```

```

```

## 错误处理与用户反馈

### 表单验证错误处理

```

// 表单校验错误处理 const handleFormErrors = (errors: any) => { Object.keys(errors).forEach(field => { const error = errors[field]; if (error && error.message) { message.error(`${field}: ${error.message}`); } }); };

// 网络请求错误处理 const handleNetworkError = (error: any) => { if (error.code === 'NETWORK_ERROR') { message.error('网络连接失败，请检查网络后重试'); } else if (error.code === 'TIMEOUT') { message.error('请求超时，请重试'); } else { message.error('操作失败，请重试'); } };

```

### 成功反馈

```

// 成功操作反馈 const handleSuccess = { configSaved: () => { message.success('主题配置保存成功！'); }, configReset: () => { message.info('已重置为默认配置'); } };

```

## 测试策略

### 单元测试

```

// 主题配置 Hook 测试 describe('useTenantThemeConfig', () => { it('应该正确加载租户信息', async () => { // Mock API 响应 const mockResponse = { success: true, data: { themeConfig: { availableThemeColors: [{ id: '1', name: '蓝色', value: '#1890ff' }], availableBackgrounds: [{ id: '1', name: '默认', url: '/bg1.jpg' }] } } };

    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() => useTenantThemeConfig());

    await act(async () => {
      await result.current.fetchTenantInfo();
    });

    expect(result.current.tenantInfo.themeConfig.availableThemeColors).toHaveLength(1);

});

it('应该正确保存租户配置', async () => { const { result } = renderHook(() => useTenantThemeConfig());

    const formData = {
      themeColorType: 'system' as const,
      selectedThemeColorId: '1',
      backgroundType: 'system' as const,
      selectedBackgroundId: '1',
      navigationStyle: 'light' as const,
      navigationLayout: 'style1' as const
    };

    await act(async () => {
      await result.current.saveTenantThemeConfig(formData);
    });

    expect(fetch).toHaveBeenCalledWith('/api/tenant/update', expect.any(Object));

}); });

```

## 基于现有接口的扩展方案

### 现有租户信息接口扩展

不创建新接口，只需在现有租户信息接口中扩展themeConfig字段：

```

// 现有租户信息接口需要扩展的字段 interface TenantInfoExtendedFields { // 在现有租户信息中新增主题配置字段 themeConfig?: { // 系统管理员配置的可选主题色 availableThemeColors?: Array<{ id: string; name: string; // 主题色名称 value: string; // HEX 颜色值 isDefault: boolean; // 是否为默认 }>;

    // 系统管理员配置的可选背景图
    availableBackgrounds?: Array<{
      id: string;
      name: string;           // 背景图名称
      url: string;            // 背景图URL
      preview: string;        // 缩略图URL
      style: 'light' | 'dark' | 'auto'; // 风格类别
      isDefault: boolean;     // 是否为默认
    }>;

    // 租户当前选择的配置
    currentSelection?: {
      selectedThemeColor?: string;         // 选中的主题色
      selectedBackgroundId?: string;       // 选中的背景图ID
      navigationStyle?: 'light' | 'dark'; // 导航栏风格
    };

}; }

// 提交主题配置时的请求字段（扩展到现有更新接口） interface UpdateTenantThemeRequest { // 在现有租户更新接口中新增字段 themeConfig: { selectedThemeColor?: string; selectedBackgroundId?: string; navigationStyle?: 'light' | 'dark'; }; }

```

### 前端表单字段定义

基于现有租户信息的扩展字段，设计主题配置表单：

```

// 租户主题配置表单字段 interface ThemeConfigFormFields { // 主题色配置 themeColorType: 'system' | 'custom'; // 必填，主题色类型 selectedThemeColorId?: string; // 选中的系统主题色 ID customThemeColor?: string; // 自定义主题色值（HEX 格式）

// 背景图配置 backgroundType: 'system' | 'none'; // 必填，背景类型 selectedBackgroundId?: string; // 选中的系统背景图 ID

// 导航栏样式配置 navigationStyle: 'auto' | 'light' | 'dark'; // 必填，导航栏风格 }

```

## 清单检查

### 设计方案检查

- [x] UI设计图参照：严格按照@系统管理.png和@风格切换.png实现
- [x] 架构集成：基于现有SystemConfig页面的Tab架构扩展
- [x] 组件复用：集成现有ThemeControlPanel和BackgroundStyleSwitcher
- [x] 接口扩展：不创建新接口，只扩展现有租户接口
- [x] 权限复用：复用现有系统管理权限和文件上传服务
- [x] 状态管理：集成现有useGlobalSettings Hook

### 技术实现检查

- [x] 三列布局：主题色、背景图、导航栏风格配置区域
- [x] 实时预览：通过useGlobalSettings实时应用配置效果
- [x] 数据持久化：保存到现有租户接口的themeConfig字段
- [x] 错误处理：完善的表单校验和网络错误处理
- [x] 响应式设计：支持桌面和移动端显示
    message: '请输入有效的HEX颜色值（如：#1890ff）'
  },
  backgroundType: {
    required: true,
    enum: ['system', 'none'],
    message: '请选择背景类型'
  },
  selectedBackgroundId: {
    requiredIf: (form: TenantThemeConfigFormFields) => form.backgroundType === 'system',
    message: '请选择背景图片'
  },
  navigationStyle: {
    required: true,
    enum: ['auto', 'light', 'dark'],
    message: '请选择导航栏风格'
  },
  navigationLayout: {
    required: true,
    enum: ['style1', 'style2'],
    message: '请选择导航栏布局'
  },
  navigationWidth: {
    type: 'number',
    min: 200,
    max: 400,
    message: '导航栏宽度范围：200-400px'
  },
  navigationFontSize: {
    type: 'number',
    min: 12,
    max: 20,
    message: '字体大小范围：12-20px'
  }
};
```

### 表单数据转换

#### 前端表单数据到后端请求数据的转换

``````typescript
// 表单数据转换为租户更新请求
const transformFormToTenantUpdate = (formData: TenantThemeConfigFormFields) => {
  return {
    // 基于现有租户更新接口，在其中添加 themeConfig 字段
    themeConfig: {
      selectedThemeColorId: formData.themeColorType === 'system' ? formData.selectedThemeColorId : undefined,
      selectedBackgroundId: formData.backgroundType === 'system' ? formData.selectedBackgroundId : undefined,
      customThemeColor: formData.themeColorType === 'custom' ? formData.customThemeColor : undefined,
      navigation: {
        style: formData.navigationStyle,
        layout: formData.navigationLayout,
        width: formData.navigationWidth,
        fontSize: formData.navigationFontSize
      }
    }
  };
};

// 租户信息到表单数据的转换
const transformTenantInfoToForm = (tenantInfo: any): TenantThemeConfigFormFields => {
  const themeConfig = tenantInfo.themeConfig;

  return {
    themeColorType: themeConfig?.customThemeColor ? 'custom' : 'system',
    selectedThemeColorId: themeConfig?.selectedThemeColorId,
    customThemeColor: themeConfig?.customThemeColor,
    backgroundType: themeConfig?.selectedBackgroundId ? 'system' : 'none',
    selectedBackgroundId: themeConfig?.selectedBackgroundId,
    navigationStyle: themeConfig?.navigation?.style || 'auto',
    navigationLayout: themeConfig?.navigation?.layout || 'style1',
    navigationWidth: themeConfig?.navigation?.width,
    navigationFontSize: themeConfig?.navigation?.fontSize
  };
};
```



```



      name: string;                    // 背景名称
      url: string;                     // 背景图片URL
      thumbnailUrl: string;            // 缩略图URL
      style: 'light' | 'dark';         // 适合的导航栏风格
      description?: string;            // 背景描述
      isDefault: boolean;              // 是否为系统默认背景
      enabled: boolean;                // 是否启用
      sortOrder: number;               // 排序顺序
      fileSize: number;                // 文件大小(字节)
      dimensions: {                    // 图片尺寸
        width: number;
        height: number;
      };
      createdAt: string;               // 创建时间
    }>;

    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}
```

### 用户个人层接口规范

#### 1. 获取可用主题选项

**接口地址**：`GET /api/user/theme-options`

**说明**：返回当前用户可选择的主题配置选项（来自系统管理员配置）

**响应数据**：

`````typescript
interface GetAvailableThemeOptionsResponse {
  success: boolean;
  data: {
    colors: Array<{
      id: string;
      name: string;
      value: string;
      description?: string;
    }>;
    backgrounds: Array<{
      id: string;
      name: string;
      thumbnailUrl: string;
      style: 'light' | 'dark';
      description?: string;
    }>;
  };
  message?: string;
}
```

### 前端表单字段定义

#### 系统管理员表单字段

`````typescript
// 主题色添加表单
interface ThemeColorForm {
  name: string;                        // 颜色名称，最大50字符
  value: string;                       // HEX颜色值，格式校验：/^#[0-9A-Fa-f]{6}$/
  description?: string;                // 描述，最大200字符
  isDefault?: boolean;                 // 是否设为默认
}

// 背景图添加表单
interface BackgroundImageForm {
  name: string;                        // 背景名称，最大50字符
  file: File;                          // 图片文件
  style: 'light' | 'dark';            // 导航栏适配风格
  description?: string;                // 描述，最大200字符
  isDefault?: boolean;                 // 是否设为默认
}

// 表单校验规则
const systemFormRules = {
  colorName: [
    { required: true, message: '请输入颜色名称' },
    { max: 50, message: '颜色名称不超过50个字符' }
  ],
  colorValue: [
    { required: true, message: '请选择颜色值' },
    { pattern: /^#[0-9A-Fa-f]{6}$/, message: '请输入正确的颜色格式' }
  ],
  backgroundName: [
    { required: true, message: '请输入背景名称' },
    { max: 50, message: '背景名称不超过50个字符' }
  ],
  backgroundFile: [
    { required: true, message: '请上传背景图片' }
  ],
  backgroundStyle: [
    { required: true, message: '请选择导航栏适配风格' }
  ]
};
```

#### 用户个人表单字段

`````typescript
// 用户个人主题配置表单
interface UserPersonalThemeForm {
  selectedColorId: string;             // 选中的主题色ID
  selectedBackgroundId: string;        // 选中的背景图ID

  navigation: {
    colorMode: 'auto' | 'light' | 'dark'; // 导航栏颜色模式
    style: 'style1' | 'style2';        // 导航栏风格
    collapsedWidth: number;             // 折叠宽度，范围：48-80
    expandedWidth: number;              // 展开宽度，范围：80-120
    fontSize: number;                   // 字体大小，范围：12-18
  };
}

// 用户表单校验规则
const userFormRules = {
  selectedColorId: [
    { required: true, message: '请选择主题色' }
  ],
  selectedBackgroundId: [
    { required: true, message: '请选择背景图' }
  ],
  collapsedWidth: [
    { type: 'number', min: 48, max: 80, message: '折叠宽度范围：48-80px' }
  ],
  expandedWidth: [
    { type: 'number', min: 80, max: 120, message: '展开宽度范围：80-120px' }
  ],
  fontSize: [
    { type: 'number', min: 12, max: 18, message: '字体大小范围：12-18px' }
  ]
};
```

### 文件上传规范

#### 前端文件校验

`````typescript
// 文件上传校验规则
interface FileUploadValidation {
  // 支持的文件类型
  allowedTypes: string[];
  // 最大文件大小（字节）
  maxSize: number;
  // 图片尺寸要求
  dimensions?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
}

// 背景图片上传配置
const backgroundUploadConfig: FileUploadValidation = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: 2 * 1024 * 1024, // 2MB
  dimensions: {
    minWidth: 1920,
    maxWidth: 3840,
    minHeight: 1080,
    maxHeight: 2160
  }
};

// 文件校验函数
const validateUploadFile = (file: File, config: FileUploadValidation): string[] => {
  const errors: string[] = [];

  // 文件类型校验
  if (!config.allowedTypes.includes(file.type)) {
    errors.push(`不支持的文件类型，请上传：${config.allowedTypes.join(', ')}`);
  }

  // 文件大小校验
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`文件大小不能超过${maxSizeMB}MB`);
  }

  return errors;
};
```

### 错误处理规范

`````typescript
// 统一错误响应格式
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;                      // 错误代码
    message: string;                   // 错误信息
    details?: any;                     // 详细错误信息
  };
}

// 常见错误代码定义
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',        // 参数校验失败
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',           // 文件过大
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE', // 不支持的文件类型
  DUPLICATE_NAME: 'DUPLICATE_NAME',            // 名称重复
  NOT_FOUND: 'NOT_FOUND',                      // 资源未找到
  PERMISSION_DENIED: 'PERMISSION_DENIED',      // 权限不足
  SERVER_ERROR: 'SERVER_ERROR'                // 服务器内部错误
};
```

## 用户交互设计

### 交互流程

基于表单提交和后端交互的流程：

`````mermaid
sequenceDiagram
    participant U as 用户
    participant F as 主题配置表单
    participant S as ThemeConfigService
    participant B as 后端接口
    participant A as 应用系统

    Note over U,A: 系统初始化
    U->>S: 进入系统
    S->>B: GET /api/tenant/theme-config
    B->>S: 返回租户主题配置
    S->>A: applyThemeConfiguration()
    A->>U: 显示应用了配置的界面

    Note over U,A: 用户修改配置
    U->>F: 打开主题配置页面
    F->>F: 加载当前配置到表单

    U->>F: 修改主题色
    F->>F: 更新表单数据

    U->>F: 上传背景图
    F->>B: POST /api/tenant/theme-config/background-upload
    B->>F: 返回文件URL
    F->>F: 更新表单数据

    U->>F: 调整导航栏设置
    F->>F: 更新表单数据

    U->>F: 提交配置
    F->>F: 表单验证
    F->>S: transformFormToDTO()
    S->>B: POST /api/tenant/theme-config
    B->>S: 返回保存结果

    alt 保存成功
        S->>A: applyThemeConfiguration(新配置)
        A->>U: 显示成功提示，应用新主题
    else 保存失败
        S->>U: 显示错误信息
    end
```

### 初始化逻辑

`````typescript
// 系统初始化时的主题加载逻辑
const initializeTheme = async () => {
  try {
    // 1. 获取租户ID（从登录信息或路由参数）
    const tenantId = getCurrentTenantId();

    // 2. 获取租户主题配置
    const themeConfig = await themeConfigService.getTenantThemeConfig(tenantId);

    // 3. 应用主题配置到系统
    themeConfigService.applyThemeConfiguration(themeConfig);

    console.log('主题初始化完成:', themeConfig);
  } catch (error) {
    console.error('主题初始化失败，使用默认主题:', error);

    // 失败时使用默认主题
    const defaultConfig = DEFAULT_THEME_CONFIG;
    themeConfigService.applyThemeConfiguration(defaultConfig);
  }
};

// 在应用启动时调用
initializeTheme();
```

### 实时预览机制

完全基于现有CSS变量系统和useGlobalSettings的实时预览：

`````mermaid
graph LR
    A[配置变更] --> B[防抖处理]
    B --> C[调用现有useGlobalSettings方法]
    C --> D[触发xagi-global-settings-changed事件]
    D --> E[app.tsx监听器自动更新]
    E --> F[实时UI更新]

    subgraph "现有系统集成"
        G[setPrimaryColor] --> H[更新localStorage]
        I[setBackgroundImage] --> J[backgroundService.setBackground]
        K[直接更新CSS变量] --> L[导航栏即时生效]
    end

    C --> G
    C --> I
    C --> K

    subgraph "CSS变量系统（已存在）"
        M[--xagi-primary-color]
        N[--xagi-nav-*-color-*]
        O[--xagi-background-*]
    end

    E --> M
    E --> N
    E --> O
```

#### 预览实现代码

基于现有系统的预览模式实现：

`````typescript
// 预览模式状态管理 - 与现有useGlobalSettings集成
const usePreviewMode = () => {
  const {
    setPrimaryColor,
    setBackgroundImage,
    settings
  } = useGlobalSettings(); // 使用现有Hook

  const [previewMode, setPreviewMode] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<Record<string, string>>({});

  const enablePreview = useCallback(() => {
    // 保存当前配置（从useGlobalSettings获取）
    const current = {
      primaryColor: settings.primaryColor || '#5147ff',
      backgroundImageId: settings.backgroundImageId || 'variant-1',
      // 从CSS变量读取导航栏设置
      navTextColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-nav-first-menu-color-text'),
      navWidth: getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-nav-collapsed-width'),
      navFontSize: getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-nav-font-size'),
    };
    setOriginalConfig(current);
    setPreviewMode(true);
  }, [settings]);

  const disablePreview = useCallback(() => {
    // 恢复原始配置 - 使用现有方法
    if (originalConfig.primaryColor) {
      setPrimaryColor(originalConfig.primaryColor);
    }
    if (originalConfig.backgroundImageId) {
      setBackgroundImage(originalConfig.backgroundImageId);
    }

    // 恢复导航栏CSS变量
    if (originalConfig.navTextColor) {
      document.documentElement.style.setProperty(
        '--xagi-nav-first-menu-color-text',
        originalConfig.navTextColor
      );
    }
    if (originalConfig.navWidth) {
      document.documentElement.style.setProperty(
        '--xagi-nav-collapsed-width',
        originalConfig.navWidth
      );
    }
    if (originalConfig.navFontSize) {
      document.documentElement.style.setProperty(
        '--xagi-nav-font-size',
        originalConfig.navFontSize
      );
    }

    setPreviewMode(false);
  }, [originalConfig, setPrimaryColor, setBackgroundImage]);

  const applyPreviewConfig = useCallback((config: {
    primaryColor?: string;
    backgroundImageId?: string;
    navigation?: any;
  }) => {
    if (!previewMode) return;

    // 使用现有方法应用预览配置
    if (config.primaryColor) {
      setPrimaryColor(config.primaryColor);
    }
    if (config.backgroundImageId) {
      setBackgroundImage(config.backgroundImageId);
    }
    if (config.navigation) {
      applyNavigationPreview(config.navigation);
    }
  }, [previewMode, setPrimaryColor, setBackgroundImage]);

  return {
    previewMode,
    enablePreview,
    disablePreview,
    applyPreviewConfig
  };
};

// 导航栏预览应用
const applyNavigationPreview = (navConfig: any) => {
  const variables: Record<string, string> = {};

  if (navConfig.colorMode === 'dark') {
    variables['--xagi-nav-first-menu-color-text'] = 'rgba(255, 255, 255, 1)';
    variables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(255, 255, 255, 0.8)';
    variables['--xagi-nav-second-menu-color-text'] = 'rgba(255, 255, 255, 1)';
    variables['--xagi-nav-second-menu-color-text-secondary'] = 'rgba(255, 255, 255, 0.8)';
    variables['--xagi-nav-second-menu-color-text-tertiary'] = 'rgba(255, 255, 255, 0.55)';
  } else if (navConfig.colorMode === 'light') {
    variables['--xagi-nav-first-menu-color-text'] = 'rgba(0, 0, 0, 1)';
    variables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(0, 0, 0, 0.8)';
    variables['--xagi-nav-second-menu-color-text'] = 'rgba(0, 0, 0, 1)';
    variables['--xagi-nav-second-menu-color-text-secondary'] = 'rgba(0, 0, 0, 0.8)';
    variables['--xagi-nav-second-menu-color-text-tertiary'] = 'rgba(0, 0, 0, 0.55)';
  }

  if (navConfig.width) {
    variables['--xagi-nav-collapsed-width'] = `${navConfig.width.collapsed}px`;
    variables['--xagi-nav-expanded-width'] = `${navConfig.width.expanded}px`;
  }

  if (navConfig.fontSize) {
    variables['--xagi-nav-font-size'] = `${navConfig.fontSize}px`;
  }

  // 批量更新CSS变量
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};
```

#### 与现有组件的集成模式

完全复用ThemeControlPanel、BackgroundStyleSwitcher等现有组件的机制：

`````typescript
// 主题色实时预览 - 直接使用useGlobalSettings
const ThemeColorSelector: React.FC = () => {
  const { setPrimaryColor, settings } = useGlobalSettings();
  const [availableColors, setAvailableColors] = useState<Array<any>>([]);

  const handleColorChange = (colorId: string) => {
    const colorOption = availableColors.find(c => c.id === colorId);
    if (colorOption) {
      // 直接调用现有方法，会自动触发xagi-global-settings-changed事件
      // app.tsx中的监听器会自动重新应用antd主题
      setPrimaryColor(colorOption.value);
    }
  };

  return (
    <div className="theme-color-selector">
      {/* 颜色网格 */}
      <div className="color-grid">
        {availableColors.map(color => (
          <div
            key={color.id}
            className={`color-option ${
              settings.primaryColor === color.value ? 'selected' : ''
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => handleColorChange(color.id)}
          >
            <span>{color.name}</span>
          </div>
        ))}
      </div>

      {/* ColorPicker组件 - 参考ThemeControlPanel实现 */}
      <div className="color-picker">
        <ColorPicker
          value={settings.primaryColor}
          onChangeComplete={(c) => setPrimaryColor(c.toHexString())}
        />
      </div>
    </div>
  );
};

// 背景图选择器 - 直接集成BackgroundStyleSwitcher
const BackgroundImageSelector: React.FC = () => {
  const {
    backgroundImages,
    backgroundImageId,
    setBackgroundImage
  } = useGlobalSettings();

  const handleBackgroundChange = (backgroundId: string) => {
    // 直接调用现有方法，会自动：
    // 1. 调用backgroundService.setBackground()
    // 2. 更新localStorage
    // 3. 触发xagi-global-settings-changed事件
    // 4. 根据backgroundConfigs进行风格联动
    // 5. 页面重载应用新背景和样式
    setBackgroundImage(backgroundId);
  };

  return (
    <div className="background-selector">
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
              backgroundPosition: 'center'
            }}
            onClick={() => handleBackgroundChange(bg.id)}
            title={bg.name}
          >
            <div className="background-info">
              <div className="background-name">{bg.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 导航栏配置器 - 直接更新CSS变量，无需重载
const NavigationConfigPanel: React.FC = () => {
  const [navConfig, setNavConfig] = useState({
    colorMode: 'auto' as 'auto' | 'light' | 'dark',
    style: 'style1' as 'style1' | 'style2',
    width: { collapsed: 60, expanded: 88 },
    fontSize: 14
  });

  const handleNavigationChange = (updates: Partial<typeof navConfig>) => {
    const newConfig = { ...navConfig, ...updates };
    setNavConfig(newConfig);

    // 立即应用CSS变量更新（无需重载页面）
    applyNavigationSettings(newConfig);
  };

  return (
    <div className="navigation-config">
      {/* 深浅色切换 */}
      <div className="color-mode-toggle">
        <Segmented
          value={navConfig.colorMode}
          onChange={(value) => handleNavigationChange({ colorMode: value as any })}
          options={[
            { label: '自动', value: 'auto' },
            { label: '浅色', value: 'light' },
            { label: '深色', value: 'dark' }
          ]}
        />
      </div>

      {/* 宽度调节 */}
      <div className="width-adjustment">
        <div className="slider-group">
          <span>折叠宽度</span>
          <Slider
            min={48}
            max={80}
            value={navConfig.width.collapsed}
            onChange={(value) => handleNavigationChange({
              width: { ...navConfig.width, collapsed: value }
            })}
          />
        </div>
        <div className="slider-group">
          <span>展开宽度</span>
          <Slider
            min={80}
            max={120}
            value={navConfig.width.expanded}
            onChange={(value) => handleNavigationChange({
              width: { ...navConfig.width, expanded: value }
            })}
          />
        </div>
      </div>

      {/* 字体大小 */}
      <div className="font-size-adjustment">
        <span>字体大小</span>
        <Slider
          min={12}
          max={18}
          value={navConfig.fontSize}
          onChange={(value) => handleNavigationChange({ fontSize: value })}
        />
      </div>
    </div>
  );
};

// CSS变量应用函数 - 与backgroundStyle.ts中的变量保持一致
const applyNavigationSettings = (navConfig: any) => {
  const variables: Record<string, string> = {};

  // 应用深浅色设置 - 使用backgroundStyle.ts中定义的精确值
  if (navConfig.colorMode === 'dark') {
    variables['--xagi-nav-first-menu-color-text'] = 'rgba(255, 255, 255, 1)';
    variables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(255, 255, 255, 0.8)';
    variables['--xagi-nav-second-menu-color-text'] = 'rgba(255, 255, 255, 1)';
    variables['--xagi-nav-second-menu-color-text-secondary'] = 'rgba(255, 255, 255, 0.8)';
    variables['--xagi-nav-second-menu-color-text-tertiary'] = 'rgba(255, 255, 255, 0.55)';
  } else if (navConfig.colorMode === 'light') {
    variables['--xagi-nav-first-menu-color-text'] = 'rgba(0, 0, 0, 1)';
    variables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(0, 0, 0, 0.8)';
    variables['--xagi-nav-second-menu-color-text'] = 'rgba(0, 0, 0, 1)';
    variables['--xagi-nav-second-menu-color-text-secondary'] = 'rgba(0, 0, 0, 0.8)';
    variables['--xagi-nav-second-menu-color-text-tertiary'] = 'rgba(0, 0, 0, 0.55)';
  }
  // colorMode为'auto'时不设置，让背景联动机制接管

  // 应用尺寸设置
  variables['--xagi-nav-collapsed-width'] = `${navConfig.width.collapsed}px`;
  variables['--xagi-nav-expanded-width'] = `${navConfig.width.expanded}px`;
  variables['--xagi-nav-font-size'] = `${navConfig.fontSize}px`;

  // 批量更新CSS变量
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};
```
    const current = {
      primaryColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-primary-color'),
      navTextColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-nav-first-menu-color-text'),
      // ... 其他变量
    };
    setOriginalConfig(current);
    setPreviewMode(true);
  }, []);

  const disablePreview = useCallback(() => {
    // 恢复原始CSS变量
    Object.entries(originalConfig).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--xagi-${key}`, value);
    });
    setPreviewMode(false);
  }, [originalConfig]);

  return { previewMode, enablePreview, disablePreview };
};
```


## 现有系统集成

### 与 useGlobalSettings 的集成

新的主题配置系统完全集成现有的 useGlobalSettings Hook，保证兼容性：

`````typescript
// 与现有useGlobalSettings的集成
interface ThemeConfigIntegration {
  // 主题色配置 - 直接使用现有方法
  setPrimaryColor: (color: string) => void;        // 已存在于useGlobalSettings

  // 背景图配置 - 直接使用现有方法
  setBackgroundImage: (backgroundId: string) => void; // 已存在于useGlobalSettings

  // 导航栏配置 - 需要扩展现有功能
  updateNavigationStyle: (style: NavigationStyleConfig) => void;
}

// 集成现有系统的Hook
const useIntegratedThemeConfig = () => {
  const {
    primaryColor,
    backgroundImageId,
    backgroundImages,
    setPrimaryColor,
    setBackgroundImage,
    settings
  } = useGlobalSettings(); // 使用现有Hook

  // 扩展导航栏功能
  const updateNavigationStyle = useCallback((navConfig: NavigationStyleConfig) => {
    // 直接更新CSS变量
    const variables = {
      '--xagi-nav-first-menu-color-text': navConfig.textColor,
      '--xagi-nav-collapsed-width': `${navConfig.width.collapsed}px`,
      '--xagi-nav-expanded-width': `${navConfig.width.expanded}px`,
      '--xagi-nav-font-size': `${navConfig.fontSize}px`
    };

    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // 将导航配置保存到localStorage
    const navigationSettings = {
      ...settings,
      navigation: navConfig
    };
    localStorage.setItem('xagi-global-settings', JSON.stringify(navigationSettings));
  }, [settings]);

  return {
    // 现有功能
    primaryColor,
    backgroundImageId,
    backgroundImages,
    setPrimaryColor,
    setBackgroundImage,

    // 扩展功能
    updateNavigationStyle
  };
};
```

### 与 backgroundService 的集成

完全兼容现有的 backgroundService 和 backgroundStyleManager：

`````typescript
// 背景图管理集成
interface BackgroundServiceIntegration {
  // 使用现有的backgroundService方法
  addSystemBackground: (background: BackgroundConfig) => void;
  removeSystemBackground: (id: string) => void;

  // 使用现有的backgroundStyleManager
  applyBackgroundStyle: (backgroundId: string) => void;
}

// 集成实现
const extendBackgroundService = () => {
  // 扩展现有backgroundService支持系统配置
  const addSystemBackground = (background: BackgroundConfig) => {
    // 1. 添加到backgroundService管理的背景列表
    backgroundService.addBackground({
      id: background.id,
      name: background.name,
      path: background.url,
      preview: background.thumbnailUrl
    });

    // 2. 添加到backgroundConfigs以支持风格联动
    backgroundConfigs.push({
      id: background.id,
      name: background.name,
      url: background.url,
      style: background.style, // 'light' | 'dark'
      description: background.description
    });
  };

  const applyBackgroundStyle = (backgroundId: string) => {
    // 使用现有的setBackgroundImage方法
    // 该方法会自动:
    // 1. 调用backgroundService.setBackground()
    // 2. 保存到localStorage
    // 3. 触发xagi-global-settings-changed事件
    // 4. 根据backgroundConfigs进行风格联动
    // 5. 页面重载应用新背景
    const { setBackgroundImage } = useGlobalSettings();
    setBackgroundImage(backgroundId);
  };

  return {
    addSystemBackground,
    applyBackgroundStyle
  };
};
```

### 与 CSS变量系统的集成

完全遵循现有的 CSS 变量命名约定（--xagi-* 前缀）：

`````typescript
// CSS变量管理集成
interface CSSVariableIntegration {
  // 主题色相关变量（已存在）
  primaryColorVariable: '--xagi-primary-color';

  // 导航栏相关变量（已存在）
  navVariables: {
    firstMenuTextColor: '--xagi-nav-first-menu-color-text';
    firstMenuSecondaryColor: '--xagi-nav-first-menu-color-text-secondary';
    secondMenuTextColor: '--xagi-nav-second-menu-color-text';
    secondMenuSecondaryColor: '--xagi-nav-second-menu-color-text-secondary';
    secondMenuTertiaryColor: '--xagi-nav-second-menu-color-text-tertiary';
    collapsedWidth: '--xagi-nav-collapsed-width';
    expandedWidth: '--xagi-nav-expanded-width';
    fontSize: '--xagi-nav-font-size';
  };
}

// 与现有CSS变量系统的集成方法
const applyCSSVariables = (themeConfig: UserThemeConfigFormFields) => {
  // 1. 主题色应用 - 使用现有方法
  if (themeConfig.customThemeColor) {
    const { setPrimaryColor } = useGlobalSettings();
    setPrimaryColor(themeConfig.customThemeColor);
  }

  // 2. 导航栏样式应用 - 直接更新CSS变量
  const navVariables: Record<string, string> = {};

  if (themeConfig.navigationStyle === 'dark') {
    navVariables['--xagi-nav-first-menu-color-text'] = 'rgba(255, 255, 255, 1)';
    navVariables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(255, 255, 255, 0.8)';
    // ... 其他深色模式变量
  } else if (themeConfig.navigationStyle === 'light') {
    navVariables['--xagi-nav-first-menu-color-text'] = 'rgba(0, 0, 0, 1)';
    navVariables['--xagi-nav-first-menu-color-text-secondary'] = 'rgba(0, 0, 0, 0.8)';
    // ... 其他浅色模式变量
  }

  if (themeConfig.navigationWidth) {
    navVariables['--xagi-nav-collapsed-width'] = `${themeConfig.navigationWidth}px`;
  }

  if (themeConfig.navigationFontSize) {
    navVariables['--xagi-nav-font-size'] = `${themeConfig.navigationFontSize}px`;
  }

  // 批量更新CSS变量
  Object.entries(navVariables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};
```

### 与全局事件系统的集成

集成现有的 `xagi-global-settings-changed` 事件机制：

`````typescript
// 全局事件集成
interface GlobalEventIntegration {
  // 现有事件监听器（在app.tsx中）
  existingEventListener: 'xagi-global-settings-changed';

  // 扩展事件类型
  extendedEventTypes: {
    themeConfigUpdated: 'theme-config-updated';
    navigationStyleChanged: 'navigation-style-changed';
    systemThemeChanged: 'system-theme-changed';
  };
}

// 事件触发机制
const triggerThemeChangeEvent = (eventType: string, data?: any) => {
  // 使用现有的全局事件机制
  const event = new CustomEvent('xagi-global-settings-changed', {
    detail: {
      type: eventType,
      data: data,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
};

// 在主题配置变更时触发事件
const handleThemeConfigChange = (newConfig: UserThemeConfigFormFields) => {
  // 1. 应用配置
  applyCSSVariables(newConfig);

  // 2. 保存到本地存储
  localStorage.setItem(STORAGE_KEYS.USER_THEME_CONFIG, JSON.stringify(newConfig));

  // 3. 触发全局事件，通知其他组件更新
  triggerThemeChangeEvent('theme-config-updated', newConfig);
};
```

## 错误处理与用户反馈

### 表单校验错误处理

`````typescript
// 前端表单校验错误处理
interface FormValidationError {
  field: string;
  message: string;
  code: string;
}


### 存储策略

| 存储类型 | 用途 | 存储位置 |
|----------|------|----------|
| LocalStorage | 用户个人配置 | 浏览器本地 |
| SessionStorage | 临时预览配置 | 当前会话 |
| IndexedDB | 上传的背景图片 | 浏览器数据库 |

## 性能优化

### 优化策略

| 优化点 | 策略 | 实现方式 |
|--------|------|----------|
| 实时预览 | 防抖处理 | useDebounce Hook |
| 颜色选择器 | 懒加载 | React.lazy |
| 背景图上传 | 压缩处理 | Canvas API |
| CSS变量更新 | 批量操作 | requestAnimationFrame |

### 组件懒加载

`````typescript
const ColorPickerAdvanced = React.lazy(() =>
  import('./ColorPickerAdvanced')
);

const BackgroundUploader = React.lazy(() =>
  import('./BackgroundUploader')
);

const NavigationStyleEditor = React.lazy(() =>
  import('./NavigationStyleEditor')
);
```

### 样式系统集成

完全基于现有CSS变量系统扩展：

#### 现有CSS变量系统分析

基于已存在的变量结构：

```css
/* 现有的--xagi-*变量系统（来自backgroundStyle.ts） */
:root {
  /* 主题色相关（app.tsx中管理） */
  --xagi-primary-color: #5147ff;

  /* 导航栏文字颜色（backgroundStyle.ts中定义） */
  --xagi-nav-first-menu-color-text: rgba(0, 0, 0, 1);
  --xagi-nav-first-menu-color-text-secondary: rgba(0, 0, 0, 0.8);
  --xagi-nav-second-menu-color-text: rgba(0, 0, 0, 1);
  --xagi-nav-second-menu-color-text-secondary: rgba(0, 0, 0, 0.8);
  --xagi-nav-second-menu-color-text-tertiary: rgba(0, 0, 0, 0.55);

  /* 背景相关（backgroundService管理） */
  --xagi-current-text-primary: #000000;
  --xagi-current-text-secondary: rgba(0, 0, 0, 0.85);
  --xagi-current-bg-primary: rgba(255, 255, 255, 0.95);
  --xagi-current-shadow: rgba(0, 0, 0, 0.1);
}
```

#### 扩展CSS变量

基于现有命名约定扩展：

```css
/* 主题配置页面扩展变量 */
:root {
  /* 保持现有--xagi-*命名约定 */

  /* 导航栏尺寸控制（扩展） */
  --xagi-nav-collapsed-width: 60px;
  --xagi-nav-expanded-width: 88px;
  --xagi-nav-font-size: 14px;

  /* 主题配置面板样式 */
  --xagi-theme-config-panel-bg: rgba(255, 255, 255, 0.95);
  --xagi-theme-config-panel-border: rgba(0, 0, 0, 0.1);
  --xagi-theme-config-panel-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  /* 预览区域样式 */
  --xagi-theme-preview-bg: #f5f5f5;
  --xagi-theme-preview-border: 2px dashed #d9d9d9;

  /* 颜色选择器样式 */
  --xagi-color-selector-size: 32px;
  --xagi-color-selector-border: 2px solid transparent;
  --xagi-color-selector-active-border: 2px solid var(--xagi-primary-color);

  /* 背景选择器样式 */
  --xagi-background-selector-item-size: 80px;
  --xagi-background-selector-border-radius: 8px;
  --xagi-background-selector-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

#### 响应式设计

基于现有的布局系统：

```css
.theme-configuration-page {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  padding: 24px;
  min-height: 100vh;
  background: var(--xagi-current-bg-primary);
}

/* 与现有系统的断点保持一致 */
@media (max-width: 1200px) {
  .theme-configuration-page {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .theme-configuration-page {
    padding: 16px;
    gap: 12px;
  }
}

/* 主题色选择器样式 */
.theme-color-selector {
  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--xagi-color-selector-size), 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .color-option {
    width: var(--xagi-color-selector-size);
    height: var(--xagi-color-selector-size);
    border-radius: 6px;
    border: var(--xagi-color-selector-border);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      transform: scale(1.1);
      box-shadow: var(--xagi-theme-preview-shadow, 0 2px 8px rgba(0,0,0,0.15));
    }

    &.selected {
      border: var(--xagi-color-selector-active-border);

      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      }
    }
  }
}

/* 背景选择器样式 */
.background-selector {
  .background-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--xagi-background-selector-item-size), 1fr));
    gap: 12px;
  }

  .background-preview {
    width: var(--xagi-background-selector-item-size);
    height: calc(var(--xagi-background-selector-item-size) * 0.6);
    border-radius: var(--xagi-background-selector-border-radius);
    overflow: hidden;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--xagi-background-selector-hover-shadow);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: var(--xagi-primary-color);

      &::after {
        content: '✓';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 20px;
        height: 20px;
        background: var(--xagi-primary-color);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }
    }

    .background-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.7));
      color: white;
      padding: 8px;

      .background-name {
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}

/* 导航栏配置面板 */
.navigation-config {
  .config-section {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--xagi-theme-config-panel-bg);
    border: 1px solid var(--xagi-theme-config-panel-border);
    border-radius: 8px;

    .section-title {
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--xagi-current-text-primary);
    }
  }

  .slider-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    span {
      min-width: 80px;
      font-size: 13px;
      color: var(--xagi-current-text-secondary);
    }

    .ant-slider {
      flex: 1;
    }
  }
}
```

## 兼容性考虑

### 与现有系统的兼容性分析

基于对现有代码的分析，确保新设计与以下组件完全兼容：

| 现有系统 | 兼容方式 | 具体实现 |
|------------|----------|----------|
| useGlobalSettings Hook | 直接复用 | 使用setPrimaryColor、setBackgroundImage等现有方法 |
| backgroundService | 完全集成 | 复用setBackground、addBackground方法 |
| BackgroundStyleManager | 保持现有机制 | 继续使用backgroundConfigs进行风格联动 |
| CSS变量系统 | 扩展兼容 | 基于--xagi-*命名约定扩展 |
| 全局事件系统 | 继续使用 | 复用xagi-global-settings-changed事件 |
| antd主题系统 | 保持现有 | app.tsx中的主题配置机制不变 |

### 浏览器支持

基于现有系统的浏览器支持策略：

| 功能 | 现代浏览器 | 降级方案 | 现有实现 |
|------|-----------|---------|----------|
| CSS变量 | 原生支持 | 内联样式 | backgroundStyle.ts中已实现 |
| 颜色选择器 | ColorPicker组件 | 第三方组件 | ThemeControlPanel中已使用 |
| 文件上传 | File API | 传统表单上传 | backgroundService支持 |
| 本地存储 | localStorage | Cookie降级 | useGlobalSettings中已用 |

### 错误处理

基于现有系统的错误处理机制：

`````typescript
interface ThemeConfigErrorHandler {
  // 主题色错误处理 - 集成useGlobalSettings错误机制
  handleColorSelectionError: (error: Error) => {
    console.error('主题色选择错误:', error);
    // 恢复到默认主题色
    const event = new CustomEvent('xagi-global-settings-changed', {
      detail: { primaryColor: '#5147ff' }
    });
    window.dispatchEvent(event);
  };

  // 背景上传错误处理 - 集成backgroundService错误机制
  handleBackgroundUploadError: (error: Error) => {
    console.error('背景上传错误:', error);
    message.error('背景图上传失败，请检查文件格式和大小');
    // 恢复到默认背景
    backgroundService.setBackground('variant-1');
  };

  // 配置保存错误处理
  handleConfigSaveError: (error: Error) => {
    console.error('配置保存错误:', error);
    message.error('主题配置保存失败，请稍后重试');
  };

  // CSS变量错误处理 - 与现有backgroundStyle.ts兼容
  handleCssVariableError: (error: Error) => {
    console.error('CSS变量应用错误:', error);
    // 恢复到系统默认CSS变量值
    try {
      // 使用backgroundStyle.ts中的lightStyleVariables
      const defaultVariables = {
        '--xagi-nav-first-menu-color-text': 'rgba(0, 0, 0, 1)',
        '--xagi-nav-collapsed-width': '60px',
        '--xagi-nav-font-size': '14px'
      };

      Object.entries(defaultVariables).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    } catch (fallbackError) {
      console.error('CSS变量降级处理也失败:', fallbackError);
    }
  };
}
```

## 测试策略

### 单元测试范围

| 测试类型 | 覆盖范围 |
|----------|----------|
| 组件测试 | 所有配置组件的渲染和交互 |
| Hook测试 | useThemeConfig状态管理逻辑 |
| 服务测试 | ThemeConfigurationService业务逻辑 |
| 工具测试 | CSS变量操作和颜色处理函数 |

### 集成测试场景

`````typescript
describe('主题配置页面集成测试', () => {
  test('完整配置流程测试', () => {
    // 1. 渲染页面
    // 2. 选择主题色
    // 3. 切换背景图
    // 4. 调整导航栏设置
    // 5. 预览效果
    // 6. 保存配置
    // 7. 验证持久化
  });

  test('背景图联动测试', () => {
    // 1. 选择深色背景图
    // 2. 验证导航栏自动切换为深色
    // 3. 选择浅色背景图
    // 4. 验证导航栏自动切换为浅色
  });

  test('自定义背景图测试', () => {
    // 1. 上传用户背景图
    // 2. 验证不进行自动联动
    // 3. 手动调整导航栏样式
  });
});
```

## 扩展性设计

### 与现有系统的扩展性

基于现有backgroundService和useGlobalSettings的扩展能力：

#### 插件化配置

`````typescript
// 扩展现有backgroundService的插件机制
interface ThemeConfigPlugin {
  name: string;
  version: string;
  configSection: React.ComponentType<any>;

  // 集成现有服务
  applyConfig: (config: any) => {
    // 使用现有useGlobalSettings方法
    useGlobalSettings().setPrimaryColor(config.primaryColor);
    useGlobalSettings().setBackgroundImage(config.backgroundImageId);

    // 直接操作现有CSS变量系统
    Object.entries(config.cssVariables || {}).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string);
    });
  };

  validateConfig: (config: any) => boolean;
}

class ThemeConfigurationExtension {
  private plugins: Map<string, ThemeConfigPlugin> = new Map();

  // 与现有系统集成的插件注册
  registerPlugin(plugin: ThemeConfigPlugin): void {
    this.plugins.set(plugin.name, plugin);

    // 将插件配置同步到backgroundService
    if (plugin.name.includes('background')) {
      // 扩展backgroundService支持的背景类型
      backgroundService.registerBackgroundType(plugin.name, {
        handler: plugin.applyConfig,
        validator: plugin.validateConfig
      });
    }
  }

  // 渲染插件配置区域
  renderPluginSections(): React.ReactElement[] {
    return Array.from(this.plugins.values()).map(plugin =>
      React.createElement(plugin.configSection, {
        key: plugin.name,
        globalSettings: useGlobalSettings(), // 传入现有Hook
        backgroundService: backgroundService   // 传入现有服务
      })
    );
  }
}
```

#### 主题预设管理

在现有系统基础上扩展预设管理：

`````typescript
interface ThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];

  // 基于现有系统的配置结构
  config: {
    primaryColor: string;           // useGlobalSettings.setPrimaryColor
    backgroundImageId: string;      // useGlobalSettings.setBackgroundImage
    navigation: {                   // CSS变量直接更新
      colorMode: 'auto' | 'light' | 'dark';
      style: 'style1' | 'style2';
      width: { collapsed: number; expanded: number };
      fontSize: number;
    };
  };
}

interface PresetManager {
  // 获取可用预设（从系统配置和用户自定义）
  getAvailablePresets(): ThemePreset[];

  // 应用预设 - 使用现有方法
  applyPreset: (presetId: string) => {
    const preset = this.getPreset(presetId);
    if (preset) {
      // 1. 使用现有useGlobalSettings方法
      useGlobalSettings().setPrimaryColor(preset.config.primaryColor);
      useGlobalSettings().setBackgroundImage(preset.config.backgroundImageId);

      // 2. 应用导航栏配置 - 直接更新CSS变量
      applyNavigationSettings(preset.config.navigation);

      // 3. 触发现有全局事件
      const event = new CustomEvent('xagi-global-settings-changed', {
        detail: { type: 'preset-applied', presetId }
      });
      window.dispatchEvent(event);
    }
  };

  // 保存为预设 - 基于当前现有系统状态
  saveAsPreset: (name: string) => {
    // 从现有系统获取当前配置
    const currentSettings = useGlobalSettings().settings;
    const currentCssVars = {
      colorMode: this.detectCurrentColorMode(),
      width: {
        collapsed: parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--xagi-nav-collapsed-width') || '60'),
        expanded: parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--xagi-nav-expanded-width') || '88')
      },
      fontSize: parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--xagi-nav-font-size') || '14')
    };

    const preset: ThemePreset = {
      id: `preset-${Date.now()}`,
      name,
      description: `用户自定义预设 - ${new Date().toLocaleString()}`,
      thumbnail: '', // 可生成缩略图
      tags: ['custom'],
      config: {
        primaryColor: currentSettings.primaryColor || '#5147ff',
        backgroundImageId: currentSettings.backgroundImageId || 'variant-1',
        navigation: {
          colorMode: currentCssVars.colorMode,
          style: 'style1', // 从用户配置读取
          width: currentCssVars.width,
          fontSize: currentCssVars.fontSize
        }
      }
    };

    // 保存到本地或后端
    this.savePreset(preset);
  };

  // 删除预设
  deletePreset: (presetId: string) => Promise<void>;

  private detectCurrentColorMode(): 'auto' | 'light' | 'dark' {
    const navTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--xagi-nav-first-menu-color-text').trim();

    if (navTextColor.includes('255, 255, 255')) {
      return 'dark';
    } else if (navTextColor.includes('0, 0, 0')) {
      return 'light';
    } else {
      return 'auto';
    }
  }
}
```

## 安全性考虑

### 与现有系统的安全性集成

基于现有backgroundService的安全机制：

#### 文件上传安全

| 安全措施 | 现有实现 | 新系统集成 |
|----------|----------|----------|
| 文件类型校验 | backgroundService已实现 | 复用现有MIME类型检查 |
| 文件大小限制 | backgroundService中可配置 | 使用现有限制（默认2MB） |
| 文件内容检查 | backgroundService安全机制 | 集成现有图片头部验证 |
| 恶意脚本防护 | 现有CSP策略 | 遵循现有安全策略 |

#### 配置数据安全

与现有系统的安全验证集成：

`````typescript
// 安全验证器 - 集成现有系统的验证机制
interface ThemeSecurityValidator {
  // 颜色值验证 - 与useGlobalSettings保持一致
  validateColorValue: (color: string) => {
    // 使用现有useGlobalSettings中的验证逻辑
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    const rgbaRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[0-1]?(?:\.\d+)?)?\s*\)$/i;

    return hexRegex.test(color) || rgbaRegex.test(color);
  };

  // 图片URL验证 - 与backgroundService保持一致
  validateImageUrl: (url: string) => {
    // 复用backgroundService中的URL验证逻辑
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'data:'];
      return allowedProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  // 配置数据清理 - 遵循现有安全策略
  sanitizeConfigData: (config: any) => {
    const sanitized = { ...config };

    // 清理主题色
    if (sanitized.primaryColor && !this.validateColorValue(sanitized.primaryColor)) {
      sanitized.primaryColor = '#5147ff'; // 默认安全值
    }

    // 清理CSS变量名
    if (sanitized.cssVariables) {
      const safeCssVars: Record<string, string> = {};
      Object.entries(sanitized.cssVariables).forEach(([key, value]) => {
        // 只允许--xagi-*前缀的CSS变量（与现有系统保持一致）
        if (key.startsWith('--xagi-') && typeof value === 'string') {
          // 过滤潜在的CSS注入
          if (!this.checkCssInjection(value as string)) {
            safeCssVars[key] = value as string;
          }
        }
      });
      sanitized.cssVariables = safeCssVars;
    }

    return sanitized;
  };

  // CSS注入检查 - 与现有backgroundStyle.ts的安全机制保持一致
  checkCssInjection: (cssText: string) => {
    // 检查危险的CSS关键字
    const dangerousPatterns = [
      /javascript:/i,
      /expression\s*\(/i,
      /url\s*\([^)]*['"]?javascript:/i,
      /url\s*\([^)]*data:\s*text\/html/i,
      /@import/i,
      /behavior\s*:/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(cssText));
  };

  // 文件上传安全检查 - 集成backgroundService的安全机制
  validateUploadedFile: (file: File) => {
    // 使用backgroundService中的验证逻辑
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件类型');
    }

    if (file.size > maxSize) {
      throw new Error('文件大小超出限制');
    }

    return true;
  };
}

// 在主题配置服务中集成安全验证
class SecureThemeConfigurationService extends ThemeConfigurationService {
  private securityValidator = new ThemeSecurityValidator();

  // 重写应用配置方法，添加安全验证
  public applyThemeConfiguration(config: ThemeConfigurationDTO): void {
    try {
      // 1. 安全清理配置数据
      const sanitizedConfig = this.securityValidator.sanitizeConfigData(config);

      // 2. 调用父类方法应用配置
      super.applyThemeConfiguration(sanitizedConfig);

      // 3. 记录安全事件
      console.log('安全主题配置已应用:', {
        configId: sanitizedConfig.tenantId,
        timestamp: new Date().toISOString(),
        changes: this.getConfigChanges(config, sanitizedConfig)
      });
    } catch (error) {
      console.error('主题配置安全验证失败:', error);

      // 失败时使用安全的默认配置
      this.applyFallbackSecureConfig();
    }
  }

  private applyFallbackSecureConfig(): void {
    // 使用最安全的默认配置
    const secureConfig = {
      primaryColor: '#5147ff',
      backgroundImageId: 'variant-1', // 使用系统预设背景
      navigation: {
        colorMode: 'auto' as const,
        style: 'style1' as const,
        width: { collapsed: 60, expanded: 88 },
        fontSize: 14
      }
    };

    // 使用现有方法应用安全配置
    const event = new CustomEvent('xagi-global-settings-changed', {
      detail: { primaryColor: secureConfig.primaryColor }
    });
    window.dispatchEvent(event);

    backgroundService.setBackground(secureConfig.backgroundImageId);
  }

  private getConfigChanges(original: any, sanitized: any): any {
    const changes: any = {};
``````
