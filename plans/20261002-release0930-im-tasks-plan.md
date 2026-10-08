# 0930 IM 只读任务页签实施计划

日期：2026-10-02。规格：[release0930-im-tasks](../specs/release0930-im-tasks.md)。源码分支为 IM 子仓 `codex/release0930-im-tasks-20261002`，基线 `65779cc`；源码已提交并推送 `172d23cf1d299d426351a52baf37119274bafc8a`。主站通过 `micro-frontends/message/adapter.patch` 集成交付，保留主仓 gitlink、`adapter.pin=65779cc21fe5d394e532c7b5c05f5816bd31a792` 和 main 历史校验。

## 实施顺序

1. 定义独立的任务/产物类型、provider 和不可用错误；增加明确的 DEV mock 门控和按会话 fixture，不发明真实 API。
2. 实现可订阅的局部任务状态控制器，统一处理首屏、成功空态、刷新、分页、局部产物加载、错误与加载代次失效；React 面板只消费该状态。
3. 在现有 ChatWindow 顶部页签机制增加 tasks，能力可用时才显示所有入口；增加任务面板及页签内安全产物预览、显式下载。保留其他页签和导航。
4. 登记定向 node:test，覆盖并发迟到响应/错误与空态/产物局部失败/资源信任约束；检查类型和现有页签回归，构建正式 platform 产物验证默认门控。
5. 提供独立开发 mock 启动命令和场景给 root；root 统一浏览器验收实际 ChatWindow、预览/下载和长名布局。源码分支已 commit/push；主仓适配补丁纳入前端实现，真实任务接口和部署另行取证。

## 验收记录

- [x] Provider、显式 mock 和异常语义。
- [x] 会话任务页签、状态与产物查看（源码实现；实际操作验收见下一项）。
- [x] 定向测试与页签回归。
- [x] 类型检查及正式 platform 构建。
- [x] 主仓组合适配补丁的原 pin 复放、隔离 qiankun 类型检查与生产构建。
- [ ] root 浏览器操作与宽度验证。

### 2026-10-02 实现与验证证据

- 新增 `api/conversationTasks.ts` 默认不可用 provider、`lib/conversationTasks.ts` 类型与错误语义、`lib/conversationTasksController.ts` 局部状态控制器、`dev/conversationTasksMock.ts` 开发 fixture 和 `tasksRuntime.ts` 门控。`ChatTasksPanel.tsx/.css` 接入真实 `ChatWindow`，沿用侧栏与关闭回消息；任务是可添加页签，不重写现有偏好。页签、添加菜单与管理弹窗统一检查 provider 能力。
- 任务只读展示、独立产物加载与重试、产物刷新、文本/受限位图预览与 Blob 下载已实现。切会话/卸载与刷新请求防迟到回写；刷新移除后恢复同 key 的 ABA 请求失效；当前 taskId、状态、更新时间或产物数变化会失效旧产物缓存，展开项重新读取。产物错误定位到对应任务，刷新错误保留此前成功数据。
- `pnpm test` 全部通过，共 **1355 项**：独立 upload 61 项、CommonJS 1294 项，其中新任务合同/控制器 10 项。任务+现有页签定向用例合计 52 项。新增测试已登记 `tsconfig.test.json`；已有 `selfChat` 纪律断言适配新增能力参数，仍检查原第 5 个参数。
- `pnpm typecheck` 通过；最终 `VITE_IM_AUTH_MODE=platform VITE_IM_TASKS_MOCK=1 pnpm build` 成功，构建包含 `tsc -b`。最终业务 JS 未含 `本地演示产物`、`1001-platform`、长报告文件名 fixture 标记，证明正式构建即使设置 mock 开关仍不会携带运行期任务 fixture。antd vendor 超过原 1000 kB 提示线，构建成功；未改依赖或锁文件。
- `git diff --check` 通过；本地 PNG fixture 的 CRC 检查通过，尺寸 240×120。长标题/文件名样例已备，实际 `scrollWidth/clientWidth` 尚待 root 浏览器取证，不能以样式或测试代替。

### 主仓组合适配验证

- 在系统 scratch 归档原 pin `65779cc21fe5d394e532c7b5c05f5816bd31a792`，先应用排除本地 Vite WS 覆盖的 child 差异，再应用现有宿主适配，生成相对基线的单一补丁。最终补丁从原 pin 的另一份干净归档 `git apply --check` 与复放通过；15 个非宿主重叠文件与 `172d23c` 精确一致，`ChatWindow` 同时保留任务接入与既有宿主适配。Vite 的 100% 纯重命名仍保留。
- 副本应用实际 overlay，复制子仓已安装的锁定依赖并清除副本 TypeScript 增量缓存；主仓既有 qiankun 插件在副本提供解析，不修改 package/lock 或 child 工作区。`NUWAX_MICRO_APP_HOST_ROOT=<主仓> VITE_IM_AUTH_MODE=platform VITE_IM_TASKS_MOCK=1 pnpm build` 成功，包含 `tsc -b` 与 Vite qiankun 构建。任务 CSS 已限定到消息根，资源 base 为 `/micro-apps/message/`。
- 全部 4 个生产 JS 的 6 个固定 fixture 标记均缺失，source map 不含 `conversationTasksMock` 模块；任务 runtime 仍在，证明正式构建中的不可用 provider 与界面代码保留、开发 fixture 被排除。原 antd vendor 超过 1000 kB 提示线，构建成功。
- 标准脚本 `getPinnedSource` 核对来源为 main / `65779cc21fe5d394e532c7b5c05f5816bd31a792`。`adapterFingerprint(app)` 的完整 `adapter.json + adapter.patch + overlay` 摘要为 `25ba4c1e848b3bb730b337e26f6d06c7d48c7df2551dc09ad13ce374aaf13b93`；仅 patch 文件摘要为 `5f2d9a5a7d3025da113b5cd589c2563026c9114a3426dbcc8fd56b232bda792a`，二者不可混用。
- root 的 pipeline 门禁本轮 60 项通过。以上是 scratch 构建与合同证据，本轮未执行正式 `sync:micro-apps` 全链、未发布 `/public/micro-apps/message` 或部署测试环境；正式同步后须再以实际 manifest 核对 source 与 adapter 摘要。

### 开发 mock 启动与场景

在独立子仓 `nuwax-im-web` 运行现有预览桩，仅使用本机固定 REST 数据与可选 WS 下行桩，不连接实际 IM 后端。桩打印随机端口；随后 Vite 显式开启任务 fixture，并分别把 API 与 WS 开发代理指向该端口。本轮桩为 54242、Vite 为 5197；重启时替换为实际桩端口。

```sh
node scripts/serve-ui-preview.mjs dist --ws
```

另一个终端运行：

```sh
VITE_IM_AUTH_MODE=mock VITE_IM_TASKS_MOCK=1 \
IM_BUSINESS_TARGET=http://127.0.0.1:54242 IM_WS_TARGET=ws://127.0.0.1:54242 \
pnpm dev --host 127.0.0.1 --port 5197 --strictPort
```

入口为 `http://127.0.0.1:5197/instant-message/`。按真实 App 的 mock 下拉登录 9001，打开研发群，在会话顶部 `+ → 添加标签页 → 任务` 进入。1001 群覆盖五种任务状态、长标题/长文件名、图片/文本与失效产物、失败任务已有产物；1002 单聊是独立数据。仅已开启 DEV fixture 时，URL `?tasksScenario=empty|error|forbidden|artifact-error` 可选择成功空态、首屏一次失败、无权限、首项产物一次失败；默认 `overview`。首屏/产物一次失败场景重试后成功。

普通 dev 未设置 `VITE_IM_TASKS_MOCK=1` 和正式构建都不启用任务 provider，所有任务入口隐藏；偏好或 URL 不能绕过能力门控。正式任务 provider 仍为 `unavailable`，须确认现有绑定的当前任务查询、成员/产物授权和资源读取后实现真实 adapter，不能把本地 fixture 验收记成后端联调或部署完成。

## 交付边界

只改 IM 前端与定向测试、主仓 message 适配补丁及本期文档；不改后端、依赖锁文件、main 历史 guard 或任意导航白名单。不增加创建/取消/手工关联，不增加跨应用主站导航。真实 provider 不可用时拒绝返回假数据，mock 角色只是 fixture。

### 主仓适配来源与移除条件

- 子仓源码交付：`172d23cf1d299d426351a52baf37119274bafc8a`，基于 `65779cc21fe5d394e532c7b5c05f5816bd31a792`。主仓补丁由基线归档先应用两提交间的前端差异，再应用既有宿主适配，最终生成相对基线的单一补丁；没有重复业务 overlay。
- 已纳入 16 个功能、类型和测试文件。仅排除子仓 `nuwax-im-web/vite.config.ts` 的本地 `IM_WS_TARGET` 调试覆盖；宿主仍保留原 Vite 配置的 100% 纯重命名与现有 qiankun overlay，避免破坏升级覆盖检测。
- 标准构建来源仍是主仓 index 的 main pin，不能把 manifest 的 `source.commit` 写成源码分支 `172d23c`。该功能通过 manifest 的 adapter 摘要追溯；隔离 scratch 构建不代表 `public/micro-apps/message` 已同步或测试环境已部署。
- 后续升级 main pin 时，只有**新 pin 本身已包含等价任务实现**，才移除补丁中的任务功能、测试及注册改动，并保留宿主适配。上游 squash 后须核对文件/功能等价，不能仅判断 `172d23c` 祖先关系；main 已合入但当前 pin 仍为 `65779cc` 时不能删除。移除后须重新验证 patch + overlay、任务回归与生产 mock 排除，再重建并核对 manifest。
