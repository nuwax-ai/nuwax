# direct 网页资源与界面更新：本地验收

日期：2026-10-09。前端分支：`codex/direct-web-assets-update-20261009`，基于 `4dfea90cd2`。本记录证明实现与本地验收完成，不代表线上部署。本任务未更新外层客户端和产物仓 pin。

## 实现结果

- 保留规则覆盖 `*.hash.chunk.css`，继续按 3 代清理。首次从旧产物对应的本地 Git 历史恢复窗口内缺失 CSS；保留原始字节，年龄按历史清单年龄加部署距离计算，超期文件不会从更早历史复活。
- 同一份构建 hash 写入入口 HTML 和 `dist/version.json`，不进入业务 JS。当前页面版本固定取初始 HTML，既有桥上报实际页面版本。
- 仅 Nuwax direct 模式检查同源 `/version.json`，请求 `no-store`。启动、可见时每 5 分钟和回到前台检查；合并并发，超时与卸载清理完整。
- 合法 hash 不同时在客户端版本旁显示“界面更新”，悬停提示“网页已更新，点击刷新”。点击才重载当前地址。无自动刷新、弹窗或登录存储清除。

## 自动验证

| 检查 | 结果 |
| --- | --- |
| 11 个定向测试文件 | 104 通过、0 失败、0 跳过；独立 verifier 复核 |
| `pnpm run test:conversation` | 112 个文件、1145 通过 |
| `pnpm run lint:arch` | 通过；97 个已登记违规被忽略 |
| `pnpm exec cross-env UMI_ENV=production max build` | 通过；沿用已有微应用产物，未运行远端微应用构建 |
| 实际 production 产物的元信息写入 | HTML hash 与 JSON 相同，标记先于脚本；419 个 JS 文件写入前后 SHA256 不变 |
| production CSS 命名覆盖 | 158 个生成的 chunk CSS 文件均匹配保留规则 |
| `git diff --check` | 通过 |
| 全库 TypeScript 检查 | 未通过：既有全库错误；本次新增及修改 TS 路径没有报错 |

类型检查中的既有 `ClientVersionBadge.test.tsx` 两处可能为空错误已与 HEAD 对照确认未改变；其他历史错误未在本任务修复。生产构建仍有既有 Browserslist 与包体积警告。

定向复现命令：

```sh
pnpm exec vitest run tests/deploy-asset-retention.test.mjs tests/write-dist-version.test.mjs src/features/client-shell/pageBuildInfo.test.ts src/features/client-shell/webUpdateService.test.ts src/features/client-shell/WebVersionBadge.test.tsx src/features/client-shell/index.test.ts src/features/client-shell/clientUpdateService.test.ts src/features/client-shell/ClientVersionBadge.test.tsx tests/sidebarNavHeaderNewTask.test.tsx tests/sidebarNavHeaderAppTabActions.test.tsx tests/chatConversation/newTaskNavigation.test.tsx
```

## A/B 产物验收

使用 [可复跑夹具](../../scripts/e2e/direct-web-assets-update-fixture.cjs)，加载实际版本读取、检查服务与胶囊组件源码，使用实际构建元信息及资源 snapshot/merge 脚本。A 为 `aaaaaaa111`，B 为 `bbbbbbb222`；业务 JS 完全相同，CSS 为不同 hash。以发布 B 后再加载 A 的 CSS 模拟长时间打开的页面。

真实 Chromium 验证：A 的旧 CSS 在 B 发布后返回 `text/css` 并生效，当前 hash 保持 A，浏览器没有胶囊和版本轮询；手动刷新后进入 B，路径、query/hash、cookie 和 localStorage 标记保留。

真实 Electron 40.8.2 webview 验证：旧 CSS 同样生效；A 页面检测 B 后出现胶囊，首页请求次数未增加，证明未自动刷新；点击进入 B，原地址及 cookie/localStorage 标记保留，同版胶囊消失。结果见 [A/B 验收证据](20261009-direct-web-assets-update-evidence.json)。

复跑时先启动隔离 HTTP 夹具，随后将输出的地址传给 Electron runner：

```sh
node scripts/e2e/direct-web-assets-update-fixture.cjs serve
NUWAX_WEB_UPDATE_ORIGIN=http://127.0.0.1:PORT node scripts/e2e/direct-web-assets-update-fixture.cjs electron
```

## 发布边界

此次实现不需要新增 IPC 或发布客户端安装包；需要发布 PC Web 的入口、version.json 和保留后的资源。首次历史回填要求旧产物有有效 version.json、保留清单及可读的对应 Git 历史。缺少历史、清单或 blob 时报告缺口并保留重试状态，不伪造资源年龄。

旧页面没有新逻辑或构建标记时，首次加载新版本后才启用提醒；超过 3 代窗口的旧页面仍可能需要刷新。A/B 登录验证使用夹具 cookie/localStorage，宿主桥也由夹具提供；尚未验证真实账号、安装包或线上部署。
