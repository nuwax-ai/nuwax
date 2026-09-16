# 更新徽标 hover 卡片 + 点击直接下载 计划

- 日期：2026-09-16
- 分支：feat-dong.0930（基点 a73e61877）
- 参考：用户提供的竞品截图——更新徽标 hover 弹「版本号 + 日期 + 更新日志」气泡，点击直接进入下载流程

## 背景与现状

- `src/features/client-shell/ClientVersionBadge.tsx`：单栏 logo 旁版本徽标，已有状态机（idle/checking/not-available 纯版本号；available 下载图标点击开 Modal；downloading 圆环；downloaded 点击安装；error 红点）。
- 数据源 `clientUpdateService.ts` 轮询 `NuwaClawBridge.updater.getState()`；`releaseNotes` 由壳主进程从 OSS latest.json `notes` 补入（GitHub Release body 截 500 字符，CI 提额到 2000 由外层仓同步做）。
- 壳基座/overlay 零改动：桥能力（get-state/check/download/install）已齐备。

## 改动

1. **ClientVersionBadge.tsx 重构**
   - 移除 Tooltip + 说明 Modal，改 antd Popover（受控 open、`arrow={false}`、`destroyOnHidden`、placement=`bottomLeft`，参照 SpaceTitle 现成模式）。
   - 卡片：标题 `v{目标版本} 更新日志`（error 态 `errorTitle`）、发布日期、ReleaseNotesContent 渲染的更新日志（maxHeight 280 滚动）、底部 CTA 随状态（下载更新/重试下载/下载中 x% disabled/重启安装）。
   - 点击徽标：available→`download()`；error→`download()` 重试；downloaded→`install()`；downloading→无操作。常态（无更新任务）纯版本号、无 hover 卡。
2. **ReleaseNotesContent.tsx**（新文件，内聚 features/client-shell）：逐行解析 notes——`#`/`##`/`###` 分级标题、`- `/`*` bullet、`**bold**` 内联加粗、其余段落；不引 markdown 依赖。
3. **i18n 5 文件**：新增 `PC.Components.ClientUpdate.releaseNotesTitle`（更新日志）；删除 `modalTitle`、`later`（Modal 移除后无消费方）。
4. **测试** `ClientVersionBadge.test.tsx`：点击徽标直接断言 `download` 触发；mouseEnter 断言卡片内容；各状态分支同步。

## 验证

- 前端 vitest 全绿。
- `pnpm build` 重建 dist（随仓提交，--no-verify）。
- 商业 dev 冒烟（NUWAX_APP_IDENTIFIER=nuwax npm run base:dev，dist 指新构建）：hover 出卡、点击触发下载；dev 态下载被主进程 guard 拒正好验证 error/重试路径。真实下载圆环/重启安装留打包版发版轮验收。
- 外层仓：CI `head -c 500`→`2000`（release-electron.yml / release-electron-dev.yml）+ bump nuwax gitlink，push release/v1.0.x。
