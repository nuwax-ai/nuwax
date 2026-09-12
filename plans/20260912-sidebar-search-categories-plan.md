# 计划：单栏侧边栏搜索弹窗（⌘K）分类化改版 + 真实接口接入

- 日期：2026-09-12
- 分支：feat-dong.0930
- 组件：`src/layouts/DynamicMenusLayout/SidebarSearchModal/`（单栏顶栏搜索 icon / ⌘K 触发，挂载点 `SidebarNavLayout/index.tsx:480`）

## 需求

- 分类 tab：**任务 / 项目 / 专家&专家团 / 技能 / 连接器 / 资料库**（去掉「全部」「操作」）
- 「最近访问」：有接口的分类才展示——任务=最近 8 条会话（现有能力）、资料库=`/api/repo/pages/recently-accessed`；其余分类无关键词直接列表第一页
- 各分类接真实接口（含搜索）；专家/技能/连接器 = 系统广场 + 当前团队空间 双源合并，行尾「官方/团队」来源标记
- 点击「项目」结果 → 打开该项目最近一条子会话（无子会话置灰）

## 接口对应

| 分类 | system 源 | team 源 |
| --- | --- | --- |
| 任务 | `apiAgentConversationList`（topic 模糊搜 + 最近 8 条） | — |
| 项目 | `apiUserProjectTabPageQuery`（queryFilter.name 契约先行） | — |
| 专家&专家团 | `apiPublishedAgentList`（kw，official/targetType/targetSubType 同页面口径） | `apiAgentConfigList(spaceId)` 本地过滤 |
| 技能 | `apiPublishedSkillList`（kw） | `apiSkillList({spaceId})` 本地过滤 |
| 连接器 | `apiSystemConnectorProviderList()` 本地过滤 | `apiConnectorProviderPageList`（keyword 服务端搜） |
| 资料库 | `apiRepoSearch`（新封装，GET /api/repo/search） | — |

新增 service：`apiRepoSearch({spaceId?, keyword, from, size})`、`apiRepoRecentlyAccessed(from, size)`（`src/services/repo.ts` + `src/types/interfaces/repo.ts`）。

## 点击分发

- task → goConversation（现 devTargetType 分发保留）
- project → 取 conversations 最新一条走 goConversation；无子会话置灰
- expert → `useSummonExpertHandoff.summon({agentId,name,icon})`（回 /home 召唤）
- skill → `useSelectSkillHandoff.select({skillId,name,icon})`
- connector → `history.push('/expert-skill-connector/connector')`
- repo → `window.location.assign('/repo/doc/'+slugId)`（深链契约）

## 边界与风险

- 项目 `queryFilter.name` 后端未实证，走查确认，必要时前端过滤兜底
- repo-web 子模块未合入本分支：dev 下 `/repo/doc/*` 深链 404、`/api/repo` 跨源可能不通，走查以 test 环境为准
- 双源结果可能重复（同智能体既发布又在空间内），与页面行为一致，先不去重
- i18n 语言文件并行会话共用，Edit 前重新 Read

## 验证

- tsc 改动路径零新增；`npm run test:conversation` 全绿
- 映射/过滤纯函数 vitest（mock service/i18n）
- 浏览器走查六 tab（用户 3000 dev server，不另起服务）
