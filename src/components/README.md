# 插件卡片组件说明文档

本文档详细介绍了插件卡片相关组件的使用方法和主要功能。

## 组件概览

插件卡片组件系统主要包含以下几个组件：

1. **PluginCard**: 单个插件卡片组件，用于展示插件的基本信息
2. **PluginCardList**: 插件卡片列表组件，用于展示多个插件卡片
3. **PluginCardDetail**: 插件详情组件，用于展示插件的详细信息

## PluginCard 组件

### 组件功能

展示单个插件的基本信息，包括图标、标题、描述和新版本标记。

### 属性说明

```typescript
interface PluginCardProps {
  /** 插件图标URL */
  icon: string;
  /** 插件标题 */
  title: string;
  /** 插件描述 */
  description: string;
  /** 是否有新版本标记 */
  isNew?: boolean;
  /** 点击卡片事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}
```

### 使用示例

```tsx
import PluginCard from '@/components/PluginCard';

// 在组件中使用
<PluginCard
  icon="https://example.com/icon.png"
  title="联网搜索"
  description="在互联网上搜索相关信息，响应今日新闻、天气情况等"
  isNew={true}
  onClick={() => console.log('点击了插件')}
/>;
```

## PluginCardList 组件

### 组件功能

展示多个插件卡片，支持标题、空数据提示、自定义列数等功能。

### 属性说明

```typescript
interface PluginCardListProps {
  /** 列表标题 */
  title?: string;
  /** 卡片数据 */
  plugins: PluginCardProps[];
  /** 列表为空时的提示 */
  emptyText?: string;
  /** 卡片点击事件 */
  onCardClick?: (plugin: PluginCardProps, index: number) => void;
  /** 每行显示的卡片数量 */
  column?: number;
  /** 卡片间距 */
  gutter?: [number, number];
  /** 自定义类名 */
  className?: string;
}
```

### 使用示例

```tsx
import PluginCardList from '@/components/PluginCardList';

// 插件数据
const plugins = [
  {
    icon: 'https://example.com/icon1.png',
    title: '联网搜索',
    description: '在互联网上搜索相关信息',
    isNew: true,
  },
  {
    icon: 'https://example.com/icon2.png',
    title: '文档解析',
    description: '提取文档中的关键信息',
  },
];

// 在组件中使用
<PluginCardList
  title="推荐插件"
  plugins={plugins}
  onCardClick={(plugin, index) => console.log('点击了插件', plugin.title)}
  column={2}
  emptyText="暂无插件数据"
/>;
```

## PluginCardDetail 组件

### 组件功能

展示插件的详细信息，包括版本、发布日期、作者、分类等，支持安装/卸载功能。

### 属性说明

```typescript
interface PluginDetailProps extends PluginCardProps {
  /** 插件版本 */
  version: string;
  /** 发布日期 */
  publishDate: string;
  /** 插件作者 */
  author: string;
  /** 插件分类 */
  categories: string[];
  /** 是否已启用 */
  isEnabled?: boolean;
  /** 安装/卸载回调 */
  onToggleEnable?: () => void;
  /** 详情页返回回调 */
  onBack?: () => void;
}
```

### 使用示例

```tsx
import PluginCardDetail from '@/components/PluginCardDetail';

// 在组件中使用
<PluginCardDetail
  icon="https://example.com/icon.png"
  title="联网搜索"
  description="在互联网上搜索相关信息，响应今日新闻、天气情况等"
  version="1.0.0"
  publishDate="2023-10-01"
  author="生态市场官方"
  categories={['工具', '智能助手']}
  isNew={true}
  isEnabled={false}
  onToggleEnable={() => console.log('切换启用状态')}
  onBack={() => console.log('返回列表')}
/>;
```

## 组件间关系

1. **PluginCard**: 基础组件，被 PluginCardList 使用
2. **PluginCardList**: 列表组件，使用多个 PluginCard 构建列表
3. **PluginCardDetail**: 详情组件，与 PluginCard 共享部分属性，但扩展了更多详细信息

## 样式定制

每个组件都有对应的 `.less` 样式文件，可以通过修改这些文件来自定义组件样式。主要样式文件包括：

- `src/components/PluginCard/index.less`
- `src/components/PluginCardList/index.less`
- `src/components/PluginCardDetail/index.less`

## 注意事项

1. 插件卡片组件依赖 Ant Design 组件库
2. 所有组件都支持响应式设计，适用于不同屏幕尺寸
3. 描述文本支持自动省略，鼠标悬停时显示完整内容
