# 命中测试页面前端开发计划

## 📋 项目概述

**目标**: 完成命中测试页面的前端开发，支持文档命中测试功能

**技术栈**: React 18 + UmiJS 4 + Ant Design 5 + TypeScript + Less

**开发路径**: `/Users/yangpeng/Documents/yangpeng/code/WeKnora/qianduan/nuwax/src/pages/SpaceKnowledge/KnowledgeAccuracyTest`

---

## 🎯 功能需求分析

### 1. 核心功能模块

#### 测试配置模块
- **测试范围选择**: 多选下拉框，默认"全部"，选择需要测试的文档
- **模式选择**: 单选下拉框，默认"MIXED"，选项：语义(SEMANTIC)、混合(MIXED)、全文(FULL_TEXT)

#### 测试输入模块
- **多行输入框**: 支持长文本输入
- **测试按钮**: 右下角"测试命中"按钮

#### 测试历史模块
- **表格展示**: Query字段（可省略显示，鼠标悬停显示完整）
- **时间字段**: 格式 2026-06-23 01:20:59
- **排序**: 按时间倒序
- **限制**: 最多显示20条

#### 召回结果模块
- **分段列表**: 显示查询到的分段
- **文字数量**: 每个分段显示字数
- **展开功能**: 点击展开显示完整内容
- **排序**: 按后端返回顺序

---

## 🏗️ 技术架构设计

### 组件结构设计

```
KnowledgeAccuracyTest/
├── index.tsx                    # 主页面组件
├── index.less                   # 全局样式
├── components/
│   ├── TestConfig.tsx           # 测试配置组件
│   ├── TestInput.tsx            # 测试输入组件
│   ├── TestHistory.tsx          # 测试历史表格
│   ├── RecallResult.tsx         # 召回结果展示
│   └── SegmentItem.tsx          # 单个分段展示组件
├── hooks/
│   ├── useTestHistory.ts        # 测试历史管理Hook
│   ├── useRecallTest.ts         # 命中测试Hook
│   └── useDocumentOptions.ts    # 文档选项Hook
├── services/
│   └── index.ts                 # API服务层
├── types/
│   └── index.ts                 # TypeScript类型定义
└── constants/
    └── index.ts                 # 常量定义
```

### 状态管理设计

```typescript
interface TestState {
  // 测试配置
  selectedDocumentIds: string[];
  testMode: 'SEMANTIC' | 'MIXED' | 'FULL_TEXT';
  
  // 测试输入
  queryText: string;
  isTesting: boolean;
  
  // 测试结果
  testHistory: TestHistoryItem[];
  recallResults: RecallSegment[];
  
  // UI状态
  expandedSegments: Set<string>;
}
```

### 类型定义设计

```typescript
// types/index.ts
export interface DocumentOption {
  id: string;
  name: string;
  type: string;
}

export type TestMode = 'SEMANTIC' | 'MIXED' | 'FULL_TEXT';

export interface TestHistoryItem {
  id: string;
  query: string;
  mode: TestMode;
  timestamp: string;
  documentIds: string[];
}

export interface RecallSegment {
  id: string;
  content: string;
  wordCount: number;
  score?: number;
  position?: number;
  documentId?: string;
}

export interface TestRequest {
  documentIds: string[];
  mode: TestMode;
  query: string;
}

export interface TestResponse {
  success: boolean;
  data: {
    segments: RecallSegment[];
    testId: string;
  };
}
```

---

## 🔌 接口设计

### API端点设计

```typescript
// services/index.ts

// 获取文档列表
export const getDocumentList = (spaceId: string) => {
  return request<APIResponse<DocumentOption[]>>(`/api/knowledge/${spaceId}/documents`);
};

// 执行命中测试
export const executeRecallTest = (data: TestRequest) => {
  return request<TestResponse>('/api/knowledge/test-recall', {
    method: 'POST',
    data,
  });
};

// 获取测试历史
export const getTestHistory = (spaceId: string, limit = 20) => {
  return request<APIResponse<TestHistoryItem[]>>(
    `/api/knowledge/${spaceId}/test-history?limit=${limit}`
  );
};
```

### 接口对接方案

1. **使用项目现有的request工具** (基于umijs/max的request)
2. **错误处理**: 统一的错误处理和loading状态
3. **数据转换**: 后端数据到前端类型的转换
4. **缓存策略**: 文档列表适当缓存

---

## 🎨 组件实现方案

### 1. TestConfig组件

**功能**: 测试范围和模式选择

**技术要点**:
- 使用Ant Design的`Select`组件
- 支持多选文档选择
- 模式单选
- 响应式布局

**关键代码结构**:
```typescript
const TestConfig: React.FC<TestConfigProps> = ({
  documentIds,
  mode,
  onDocumentChange,
  onModeChange,
  documentOptions
}) => {
  return (
    <div className="test-config">
      <Select
        mode="multiple"
        placeholder="选择测试文档"
        value={documentIds}
        onChange={onDocumentChange}
        options={documentOptions}
        allowClear
      />
      <Select
        placeholder="选择测试模式"
        value={mode}
        onChange={onModeChange}
        options={[
          { label: '语义', value: 'SEMANTIC' },
          { label: '混合', value: 'MIXED' },
          { label: '全文', value: 'FULL_TEXT' }
        ]}
      />
    </div>
  );
};
```

### 2. TestInput组件

**功能**: 多行输入和测试按钮

**技术要点**:
- 使用Ant Design的`Input.TextArea`
- 字数统计
- 按钮防抖
- 加载状态

### 3. TestHistory组件

**功能**: 测试历史表格展示

**技术要点**:
- 使用Ant Design的`Table`组件
- Query字段文本截断 (CSS overflow)
- 鼠标悬停显示完整内容 (Tooltip)
- 时间格式化 (dayjs)

### 4. RecallResult组件

**功能**: 召回结果展示

**技术要点**:
- 列表展示 (Ant Design List)
- 展开/收起功能
- 文字数量统计
- 动画效果

---

## 📅 开发步骤

### Phase 1: 基础结构搭建 (预计2小时)

- [x] 创建目录结构
- [ ] 定义TypeScript类型
- [ ] 定义常量配置
- [ ] 创建主页面框架
- [ ] 配置路由和菜单

### Phase 2: 基础组件开发 (预计4小时)

- [ ] 实现TestConfig组件
- [ ] 实现TestInput组件  
- [ ] 实现TestHistory组件
- [ ] 实现RecallResult组件
- [ ] 实现SegmentItem组件

### Phase 3: 自定义Hooks开发 (预计2小时)

- [ ] 实现useDocumentOptions Hook
- [ ] 实现useTestHistory Hook
- [ ] 实现useRecallTest Hook
- [ ] 实现状态管理逻辑

### Phase 4: 服务层和API对接 (预计2小时)

- [ ] 实现API服务层
- [ ] 对接后端接口
- [ ] 实现数据转换逻辑
- [ ] 错误处理和loading状态

### Phase 5: 主页面集成 (预计2小时)

- [ ] 集成所有组件到主页面
- [ ] 实现组件间通信
- [ ] 优化状态管理
- [ ] 实现业务逻辑流程

### Phase 6: 样式和交互优化 (预计2小时)

- [ ] 实现响应式布局
- [ ] 优化交互体验
- [ ] 添加动画效果
- [ ] 适配移动端

### Phase 7: 测试和调试 (预计2小时)

- [ ] 功能测试
- [ ] 浏览器兼容性测试
- [ ] 性能优化
- [ ] Bug修复

**总计预计时间**: 16小时

---

## 🔧 技术要点

### 1. 基于Ant Design的实现

项目已安装Ant Design 5，充分利用现有组件库：
- `Select` - 下拉选择
- `Input.TextArea` - 多行输入  
- `Button` - 按钮
- `Table` - 表格
- `List` - 列表
- `Tooltip` - 提示
- `Collapse` - 展开/收起

### 2. 状态管理

使用React Hooks进行状态管理：
- `useState` - 基础状态
- `useEffect` - 副作用处理
- 自定义Hooks - 业务逻辑封装

### 3. 样式方案

使用Less进行样式管理，遵循项目现有样式规范。

### 4. 工具函数

- `dayjs` - 时间格式化
- `lodash` - 工具函数
- `classnames` - 类名管理

---

## 📁 文件创建清单

### 需要创建的文件:

1. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/index.tsx` (已存在)
2. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/index.less` (已存在)
3. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestConfig.tsx`
4. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestInput.tsx`
5. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestHistory.tsx`
6. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/RecallResult.tsx`
7. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/SegmentItem.tsx`
8. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/hooks/useDocumentOptions.ts`
9. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/hooks/useTestHistory.ts`
10. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/hooks/useRecallTest.ts`
11. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/services/index.ts`
12. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/types/index.ts`
13. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/constants/index.ts`

### 组件样式文件:

14. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestConfig.less`
15. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestInput.less`
16. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/TestHistory.less`
17. `/src/pages/SpaceKnowledge/KnowledgeAccuracyTest/components/RecallResult.less`

---

## 🎯 界面布局设计

```
┌─────────────────────────────────────────────────────────┐
│ 命中测试                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 测试配置                                                │
│ ┌──────────────────────┐ ┌────────────────────────┐  │
│ │ 测试范围: [多选框]   │ │ 模式: [单选框]         │  │
│ └──────────────────────┘ └────────────────────────┘  │
│                                                         │
│ 测试内容                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │                                                    │ │
│ │           多行文本输入框                          │ │
│ │                                                    │ │
│ │                          [测试命中] 按钮          │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ 测试历史                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Query     │ 时间                │ 模式            │ │
│ │ 测试查询.. │ 2026-06-23 01:20:59  │ MIXED          │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ 召回结果                                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ▶ 分段1 (120字)                                    │ │
│ │ ▶ 分段2 (85字)                                     │ │
│ │ ▼ 分段3 (200字)                                    │ │
│ │   这是展开的完整内容...                            │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ 风险评估与解决方案

### 技术风险

1. **多选下拉框体验**
   - 风险: 文档数量多时选择困难
   - 解决: 添加搜索功能和分组

2. **大量数据的性能**
   - 风险: 召回结果过多时性能问题
   - 解决: 虚拟滚动和分页加载

3. **浏览器兼容性**
   - 风险: 不同浏览器显示差异
   - 解决: 标准CSS和Polyfill

### 业务风险

1. **接口对接**
   - 风险: 后端接口变更
   - 解决: 接口版本管理和Mock数据

2. **数据格式**
   - 风险: 后端返回数据格式不符合预期
   - 解决: 数据验证和错误处理

---

## 🚀 开发建议

1. **优先级**: 先实现核心功能，样式可以后续迭代
2. **组件复用**: 充分利用Ant Design组件库
3. **代码规范**: 遵循项目现有代码规范
4. **测试**: 开发过程中及时测试
5. **文档**: 关键函数添加注释
6. **性能**: 注意大数据量的性能优化
7. **响应式**: 确保移动端体验

---

## 📊 成功标准

### 功能完整性
- ✅ 所有4个功能模块正常工作
- ✅ 接口对接无错误
- ✅ 数据显示正确

### 用户体验
- ✅ 界面美观，符合设计图
- ✅ 交互流畅，无卡顿
- ✅ 响应式布局适配

### 技术质量
- ✅ 代码规范，无Lint错误
- ✅ TypeScript类型完整
- ✅ 组件结构清晰

---

## 🔄 与后端协作

### 需要后端提供的接口:
1. `GET /api/knowledge/{spaceId}/documents` - 获取文档列表
2. `POST /api/knowledge/test-recall` - 执行命中测试
3. `GET /api/knowledge/{spaceId}/test-history` - 获取测试历史

### 数据格式约定:
- 统一使用`APIResponse<T>`格式
- 时间格式: ISO 8601
- 分页参数: `page`, `pageSize`

---

**计划制定完成！等待团队审核和后端接口确认后开始开发。**