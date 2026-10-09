# 0930 IM 会话关联任务：一期规格

日期：2026-10-02。来源：飞书剩余内容第 10 条、[范围草案](../plans/20261002-release0930-im-repo-followup.md)。用户已允许按推荐方向继续；本期先落地只读界面和明确启用的开发 mock，真实接口待对齐。

## 目标和边界

在实际 IM 会话窗口增加「任务」页签，查看该 IM 会话关联的女娲任务状态和授权产物。关联依据先采用既有 `im_agent_binding` 的「IM 会话 × 智能体 → 平台 chatConversationId」。默认一条任务行是关联平台会话的当前/最近任务；不编造每轮执行历史。

只实现列表、刷新、展开产物、安全预览/下载。创建、取消、重新执行、手工关联/解绑、跨主站导航均不做。保留现有消息、成员、文件、资料库的行为。

## 能力与 mock

- Provider 隔离任务列表、产物列表和产物资源查询；不定义未经确认的后端 URL。
- 默认真实 provider 标记为不可用，调用必须拒绝并给出「任务服务尚未接入」；绝不返回假成功空数组。
- 仅 provider 可用时显示任务页签、添加菜单项和管理选项。mock 仅在 Vite 开发模式且 `VITE_IM_TASKS_MOCK=1` 时显式启用，普通 dev/正式 build 均保持不可用。
- mock 使用按 IM 会话隔离的固定数据；可演示空态、首屏失败、产物失败和无权限。这些权限响应只是 fixture，正式后端必须逐成员、逐任务/产物授权。
- 不改变平台 Cookie 或既有 mock 登录模式，不把真实请求失败静默切换成 mock。

## 数据与状态

所有标识均为字符串，区分 IM 会话 ID、平台会话 ID、taskId、智能体 subjectId。列表字段最少包含稳定 key、平台会话 ID、智能体、标题、TaskStatus、更新时间与产物数。状态对齐 CREATE/EXECUTING/COMPLETE/FAILED/CANCEL，未知值展示「状态未知」。空主题、名称、无效时间均有兜底。

产物包括 ID、名称、描述、类型、可用状态；资源在点击预览/下载时通过 `readArtifact` 单独获取。现行 provider 只返回文本或 Blob，不接受任意资源 URL；文本按纯文本展示，图片只预览 PNG/JPEG/GIF/WebP Blob。其他文件可显式下载，不执行 HTML/script，不渲染产物 HTML 或 SVG。预览与下载所需 Blob URL 由面板创建并配对释放。mock 文本/图片完全本地，不使用平台工作目录地址；实现契约以 `nuwax-im-web/src/lib/conversationTasks.ts` 为准。

## 交互和异常

- 任务页签位于右侧会话顶部，沿用现有添加、管理、关闭回消息机制；单聊/群聊均支持。
- 任务行显示标题、智能体、状态、更新时间；展开时独立加载产物。长标题/文件名可换行，不扩大面板宽度。
- 首屏加载、成功空列表、加载失败/无权限/未接入分别显示。刷新失败保留此前数据并显示错误，不伪装为空态。
- 产物失败仅影响对应任务，有独立重试；任务执行中无产物与已结束无产物区别提示。失败/取消任务也可查看已有授权产物。
- 选择新会话立即清旧会话内容；旧请求晚到不得写入新会话。关闭页签或真卸载使旧加载代次失效。刷新与分页具有独立请求序号，旧结果不能覆盖新结果。
- 无权限和 401 分别保留错误语义；未来真实 provider 继续遵循已有鉴权清理，前端不假扮群代理或传入任意用户身份。

## 验收

定向测试验证 provider 不可用与 dev mock 门控、会话数据隔离、成功空态与首屏失败、刷新/切会话晚到响应、局部产物错误、五种状态与未知状态、资源协议约束。测试登记现有 node:test + tsc 测试入口。类型检查与正式 platform 构建验证默认不会开启 mock。

root 在统一浏览器中验实际 IM ChatWindow 页签、展开/重试、文本/图片预览和下载，测长标题/文件名的 scrollWidth/clientWidth。mock 验收不代表真实后端联调、成员授权或部署完成。

### 2026-10-02 源码验证记录

只读面板、按会话隔离的 controller、能力门控及显式 DEV fixture 已实现，任务按现有 `+ → 添加标签页` 进入。`pnpm test` 共 1355 项通过（61 + 1294，新增任务 10 项）；类型检查通过，最终 platform 构建含 `tsc -b` 成功。正式构建即使设置 `VITE_IM_TASKS_MOCK=1`，业务 JS 仍不包含运行期任务 fixture 标记；默认真实 provider 为 `unavailable`。状态/并发/局部错误和受限图片格式由定向测试覆盖，长名与真实按钮操作仍待 root 统一浏览器验证。

开发方式与场景见[实施计划](../plans/20261002-release0930-im-tasks-plan.md#开发-mock-启动与场景)：现有 `serve-ui-preview.mjs dist --ws` 喂本机 REST/WS，Vite 使用 `VITE_IM_AUTH_MODE=mock VITE_IM_TASKS_MOCK=1` 与 `IM_BUSINESS_TARGET/IM_WS_TARGET` 指向桩。mock 不启用时隐藏任务全部入口，不把接口失败转换成 mock 成功。

## 后续契约确认

确认当前绑定以外的执行历史/退群智能体/手工关联需求，以及群代理平台会话对真实成员的任务与产物读取权限；随后实现真实 provider。上述不阻塞只读 mock 开发。

## 源码与主站交付

IM 源码分支 `codex/release0930-im-tasks-20261002` 已提交并推送 `172d23cf1d299d426351a52baf37119274bafc8a`。主站维持 main 基线 `65779cc21fe5d394e532c7b5c05f5816bd31a792` 的 gitlink/pin，通过已有 message `adapter.patch + overlay` 路线纳入 16 个功能、类型和测试文件；仅排除子仓 Vite 的本地 WS 桩覆盖。生产来源为 main pin 与 adapter 摘要共同确定，独立源码提交和 scratch 构建不能作为发布完成证据。

组合补丁已从原 pin 的干净归档检查与复放；隔离副本应用实际 overlay 后，platform + qiankun 的 `tsc -b && vite build` 通过。即使设置 `VITE_IM_TASKS_MOCK=1`，生产 JS 与 source map 均不包含开发 fixture 模块/固定数据。完整适配摘要为 `25ba4c1e848b3bb730b337e26f6d06c7d48c7df2551dc09ad13ce374aaf13b93`；root pipeline 门禁 60 项通过。本轮未正式同步微应用目录或部署，发布时仍须核对实际 manifest，不能把 scratch 证据当成已上线。

新 main pin 已包含等价实现后，须移除任务功能的重复补丁并保留宿主适配；squash 合入按文件/功能等价判断。当前 pin 未升级时不能因 main 已合入就删除补丁。具体组合、验证及移除条件见[实施计划](../plans/20261002-release0930-im-tasks-plan.md#主仓适配来源与移除条件)。
