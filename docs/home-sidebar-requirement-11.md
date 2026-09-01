# 需求 11:PC 端首页调整 —— 交付文档

> 分支:`feat/home-agent-recent-sessions`(基于 `feat/conversation-renderer-v2`) 需求来源:需求包 #11「PC 端首页调整」;设计稿为交互原型(file-preview 内嵌 `nuwax_desktop.html`) 状态:已推送,待产品走查

## 一、需求原文与交付对照

| 需求条目 | 交付状态 | 说明 |
| --- | --- | --- |
| 每个智能体都有最近的几个会话 | ✅ | 侧栏「最近使用」tab 按智能体分组,组内展示该智能体最近会话(最多 3 条) |
| 默认不展开 | ✅ | 分组默认收起,组头仅显示头像+名称+最新会话主题+时间 |
| 展开条件 1)有执行中的展开 | ✅ | 分组内存在 `taskStatus=EXECUTING` 会话时自动展开,组头显示「执行中(N)」徽标;全部终态后自动收起 |
| 展开条件 2)选中的展开 | ✅ | 当前路由对应智能体(从 `/home/chat/:id/:agentId` 推导)自动展开并高亮 |
| 展开条件 3)用户主动展开 | ✅ | 点击组头切换展开/收起;手动收起优先于执行中自动展开 |
| 新增「项目」tab | ✅ 骨架 | tab 与空态已就绪;**项目数据接口后端未 ready**,服务层留接缝 |
| 内容分类(对话任务/项目开发/AI 教育) | ✅ 结构 | 分类切换用 antd Segmented(居中/size large);**分类与 pill 全部数据驱动**,接口 ready 后只换适配层 |
| 首页主区域调整 | ✅ 部分 | hero 副标题、底部「内容由 AI 生成」提示;composer 快捷 chips/电脑与模型下拉重构未做(依赖后端契约) |

## 二、Feature 明细

### F1 侧栏三 tab:「最近使用 / 会话记录 / 项目」

- 原「最近使用/会话记录」双 tab 基础上新增「项目」tab,**沿用原有自定义 tab 组件与下划线样式**(经评审确认不换 Segmented)
- tab 状态持久化 localStorage(key `PC_HOME_SECTION_ACTIVE_TAB`,新增 `project` 值)
- 「会话记录」tab 行为不变(置顶/归档/收藏等本地标记能力保留)

### F2 「最近使用」智能体分组折叠(核心)

- **组头**:头像 + 智能体名称 + 最新会话主题副标题 + 时间;执行中时显示「执行中(N)」徽标
- **展开规则**(优先级从高到低):
  1. 用户手动收起 → 保持收起(执行中也不再自动弹开)
  2. 用户手动展开 → 保持展开
  3. 有执行中会话 → 自动展开
  4. 智能体选中(当前会话路由)→ 自动展开
- **展开内容**:该智能体最近 3 条会话;点击条目跳 `/home/chat/:conversationId/:agentId`
- 组头点击:有会话=切换展开;无会话=进入智能体(原行为)
- 行为已由合同测试锁死:`tests/recentAgentItemGroup.test.tsx`(5 用例)

### F3 「项目」tab 骨架

- `ProjectPanel` 组件 + 「暂无项目」空态
- 数据接口后端未 ready;组件已隔离,接入时只需在 `NewHomeSection` 挂数据

### F4 首页内容分类 Segmented(数据驱动)

- 「对话任务 / 项目开发 / AI 教育」分类切换 = antd `Segmented`(居中、下边距、size large)
- **组件纯数据驱动**:`HomeCategoryTabs` 的 label 与 pill 全由入参渲染,无内置文案
- 分类数据适配层在 `pages/Home/index.tsx`(标注 `TODO(后端)`):当前用现有 `recChatBoxNav` 推荐数据按 `functionType` 临时归类(AgentDev/PageAppDev/SkillDev/PluginDev → 项目开发);分类维度接口 ready 后整体替换
- 交互细节:默认选中第一个有内容的分类,且选中值在 Segmented 首挂前确定(数据到达后才渲染),避免加载时滑块出现无意义滑动;用户手动切换后滑块从当前位置平滑移动

### F5 首页主区域点缀

- hero 副标题「与女娲 Nuwax 一起创造」(i18n)
- 页脚「内容由 AI 生成,请仔细甄别」(i18n)

### F6 交互评审回改(过程记录)

- 组头「最近会话」标签文案:按要求移除(含五语言词条)
- 侧栏 tab 曾改 Segmented,后按要求恢复原自定义组件

## 三、数据链路

```
apiUserUsedAgentList (/api/user/agent/used/list/{size})
  └─ AgentInfo.conversationList[{id, topic, taskStatus}]
       ├─ 初始展开判定: getExecutingConversationCount
       ├─ 执行态实时: eventBus UpdateConversationListTaskStatus(EXECUTING 乐观追加到对应智能体)
       ├─ 结束刷新: ChatFinished / RefreshConversationList → 静默重拉
       └─ 会话主题同步: conversation-updated window 事件
```

- 首页分类 pill:`apiDisplayRecommendList` → `recChatBoxNav.Agent`(按 functionType 归类)
- 项目 tab:待后端新接口(未 ready)

## 四、关键文件

| 文件 | 内容 |
| --- | --- |
| `src/layouts/DynamicMenusLayout/NewHomeSection/index.tsx` | 三 tab、分组渲染、事件订阅 |
| `src/layouts/DynamicMenusLayout/NewHomeSection/components/RecentAgentItem/` | 分组项(组头+折叠会话列表) |
| `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/` | 项目 tab 空态骨架 |
| `src/pages/Home/components/HomeCategoryTabs/` | 内容分类 Segmented(数据驱动) |
| `src/pages/Home/index.tsx` | 分类数据适配层、hero 副标题、foot-tip |
| `tests/recentAgentItemGroup.test.tsx` | 分组展开合同测试(5 用例) |

## 五、质量与验收

- `npm run test:conversation`:41 文件 / 399 用例全绿(含新增 5 用例)
- tsc 改动路径零新增错误
- ego-lite 实测通过:三 tab 渲染、组头点击展开/收起(不跳转)、会话条目跳转、选中自动展开+高亮、项目 tab 空态、分类 Segmented 选中/切换
- 待产品走查:视觉细节与原型对齐度

## 六、提交记录

| 提交 | 说明 |
| --- | --- |
| `c887dc08c` → `67deaf915` | 初版「首页卡片折叠」探索(基于 main),确认需求落点在侧栏后 revert,保留历史 |
| `c322c86d5` | 侧栏三 tab 改版 + 分组折叠 + 项目骨架 + 首页主区域调整 |
| `db2fd971e` | Segmented 统一 + 分类数据驱动化 + 移除「最近会话」文案 |
| `1a411c317` | 侧栏恢复原 tab 组件;分类 Segmented 居中+加大 |
| `1373ae657` | 分类选中值首挂前确定,消除滑块滑动 |
| `2e7288d68` | 分组展开合同测试 |

## 七、待办(依赖后端)

1. **项目 tab 数据接口**(项目列表+子项),接入 `ProjectPanel`
2. **分类维度接口**:对话任务/AI 教育 分类的推荐配置(替换 `pages/Home/index.tsx` 适配层)
3. composer 快捷 chips(PPT 制作/文档处理等)与电脑/模型下拉重构(原型有、契约未定)
