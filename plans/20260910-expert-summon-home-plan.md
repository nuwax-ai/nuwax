# 实施计划:专家召唤(expert-summon-home)

- 对应 spec:无独立 spec(需求经会话多轮拷问对齐:专家=单 agent、刷新不存活、回落默认、仅 home 首页、不做校验)
- 状态:已接受

## 需求摘要

专家&专家团页(系统广场/团队空间)卡片「召唤」→ 携带 `{agentId, name, icon}` 经 `pageHandoffContext` 跳 `/home` → 输入框下方电脑 icon 右侧展示专家 chip(可取消)→ 提交时以专家 agentId 创建会话(`/api/agent/conversation/chat` 零改动,身份固化在 create 接口)。

## 改动文件清单

| # | 文件 | 动作(增/改/删) | 说明 |
| --- | --- | --- | --- |
| 1 | src/pages/ExpertSkillConnector/types.ts | 改 | `ResourceItem` 新增可选 `agentId?: number`(系统广场=targetId,团队空间=id) |
| 2 | src/pages/ExpertSkillConnector/components/ResourceAggregation/hooks/useResourceList.ts | 改 | `mapPublishedItem` 按前缀 `agent` 填 `agentId: item.targetId`;团队空间专家 extractAll 填 `agentId: item.id` |
| 3 | src/hooks/useSummonExpertHandoff.ts | 增 | handoff 读写封装:`summon()`(setContext + push /home)/`consume()`;导出 `SummonedExpertInfo` 协议类型(home 侧同事消费入口) |
| 4 | src/pages/ExpertSkillConnector/components/ResourceAggregation/components/ResourceCard/index.tsx | 改 | 新增可选 prop `onSummon`,召唤按钮 onClick 调用;技能/连接器按钮保持 TODO |
| 5 | src/pages/ExpertSkillConnector/components/ResourceAggregation/index.tsx | 改 | 仅 expert 类型传 `onSummon` → `summon({agentId, name, icon})` |

（原 6-9 项 Home/ChatInputHome/i18n 改动已撤销,见偏离记录）

## 实施顺序

1. 步骤 1-2(数据层)→ 2-3(handoff 封装)→ 4-5(卡片接线)可顺序完成
2. 步骤 6-8(Home + ChatInputHome chip)依赖 3 的协议类型
3. 步骤 9(i18n)随 chip 一起提交

## 证明成立的测试

- 新增测试:无(三模块均无现存测试文件;vitest 不能 import umi 模块,handoff hook 依赖 `useModel` 需 mock,本次不新增)
- 回归范围:`npm run test:conversation` 全绿;`npx tsc --noEmit` 改动文件零新增错误
- 手动 E2E:召唤 →chip→ 提交 →`/home/chat/{id}/{专家agentId}`;取消/切换意图回落;刷新丢失;其他 ChatInputHome 消费方无变化

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 团队空间专家详情接口(apiPublishedAgentInfo)可能失败 | 现有 catch 优雅降级(setAgentDetail(undefined)),会话创建不受影响 | 不需回退,降级可接受 |
| ChatInputHome 被多页复用引入回归 | 新 props 全可选,不传不渲染 | revert 单文件即恢复 |
| StrictMode 双执行洗掉 handoff 值 | 消费时 `if (payload)` 守卫 | — |

## 偏离记录

- 2026-09-10:home 页(Home/index.tsx、ChatInputHome 组件与样式、ChatInputProps、i18n key)改动**全部撤销**——home 页由另一位同事负责开发。本计划收敛为**专家页写入侧**:召唤按钮把 `SummonedExpertInfo` 写入 `pageHandoffContext`(key `homeSummonedExpert`)并跳 `/home`;home 侧同事通过 `useSummonExpertHandoff().consume()` 接入(挂载一次性消费,详见「Home 侧接入指引」)。
- 2026-09-10(追加):**技能「选择」接入同款透传**——`ResourceItem` 补 `skillId`(系统广场=发布项 targetId,团队空间=技能 id);新建 `src/hooks/useSelectSkillHandoff.ts`(协议类型 `SelectedSkillInfo`,key `homeSelectedSkill`,与专家透传相互独立);ResourceCard 新增可选 `onSelect` 并接通技能「选择」按钮(原 TODO 移除);聚合层仅 skill 类型接线。pin 图标按钮与连接器「连接/断开」仍为 TODO。

## Home 侧接入指引（交接给 home 页开发同事）

1. **数据在哪**:umi 全局 model `pageHandoffContext`(内存 Map,不写 URL/storage;刷新 `/home` 即失效,产品已确认)。key 为常量 `'homeSummonedExpert'`。
2. **有哪些数据**:`SummonedExpertInfo`(定义于 `src/hooks/useSummonExpertHandoff.ts`):
   - `agentId: number` —— 专家(团)对应的真实智能体 ID(系统广场 = 发布项 `targetId`,团队空间 = 智能体 `id`)
   - `name: string` —— 专家名称(chip 展示用)
   - `icon?: string` —— 专家图标 URL;可能是 `/api/f/` 受保护地址,展示需走 `useAuthProtectedImageSrc`(空/失败回退 `agent_image.png`)
3. **如何获取**:`const { consume } = useSummonExpertHandoff();`,在 Home 挂载 effect 中 `const payload = consume();`——**读取即清**(一次性语义),务必 `if (payload) setXxx(payload)` 守卫(规避 StrictMode 双执行把值洗掉)。
4. **提交时怎么用**:`agentId` 即会话的智能体——传入现有 `handleCreateConversation(agentId, attach)`(POST `/api/agent/conversation/create`),成功后跳 `/home/chat/{id}/{agentId}`;**`/api/agent/conversation/chat` 入参零改动**。
5. **交互语义**:取消 chip 回落默认 agent;用户点电脑开关/推荐 pill/切分类 = 显式切换会话对象,应清掉召唤态(与现有 `selectedRecommend` 清理行为对齐);优先级建议 `召唤专家 > 推荐pill > 默认agentId`。

## Home 侧接入指引 —— 技能选择(2026-09-10 追加)

与专家召唤同款机制(`pageHandoffContext` 内存一次性透传,两份 key 相互独立、互不覆盖):

1. **数据在哪**:同一个 umi 全局 model `pageHandoffContext`,key 为常量 `'homeSelectedSkill'`。
2. **有哪些数据**:`SelectedSkillInfo`(定义于 `src/hooks/useSelectSkillHandoff.ts`):
   - `skillId: number` —— 真实技能 ID(系统广场 = 发布项 `targetId`,团队空间 = 技能 `id`)
   - `name: string` —— 技能名称(chip 展示用)
   - `icon?: string` —— 技能图标 URL;可能是 `/api/f/` 受保护地址,展示走 `useAuthProtectedImageSrc`
3. **如何获取**:`const { consume } = useSelectSkillHandoff();`,Home 挂载 effect 中 `const payload = consume();`——读取即清,务必 `if (payload)` 守卫(StrictMode 双执行)。
4. **提交时怎么用**:把 `skillId` 并入 chat 接口**已有**的 `skillIds: number[]` 入参(接口零改动);会话创建走默认链即可(技能不改变会话 agent)。
5. **交互语义**:取消 chip 回落无技能状态;刷新 `/home` 即失效;技能卡「选择」与专家「召唤」可先后发生,home 侧各自消费、互不冲突。
