# 规格：qiankun-message-library

- 对应 intent：`plans/20260928-qiankun-message-library-intent.md`
- 状态：实施规格；边界已结合历史调研和当前主线文档核查

## 需求基线

用户已授权正式实施；参考 `feat/repo-web-qiankun@e7bb37fda8` 和 `docs/menu-embedded-keepalive-design.md`。本期接入消息和资料库，保留主站布局与微应用内部状态，不扩展其它 iframe 菜单的保活范围。

## 方案设计

### 架构落点

- 主站配置启用 qiankun master，显式保持 `mountElementId: root`。
- `SidebarShell` 同构内容插槽放置持久微应用宿主；路由控制页只驱动当前应用和路径。首次进入调用 `loadMicroApp`，离开隐藏，刷新/会话失效才卸载。
- 路由/菜单识别为纯工具，实例状态及加载编排留在宿主；组件不反向依赖页面或 models。
- 子应用 main 固定为 submodule gitlink；适配文件随主仓管理，在独立构建缓存内应用。禁止改变共享 checkout 或静默升级 main。
- 资源放 `/micro-apps/repo/`、`/micro-apps/message/`，业务路由 `/repo/*`、`/instant-message/*` 与资源目录分离，避免深链刷新被子应用静态 index 截胡。消息使用用户确认的 `nuwax-im/main` 仓库内 `nuwax-im-web` PC 前端目录。

### 数据与契约

- 子应用以 `container.querySelector('#root')` 为 React 根，实例与主站 root 隔离。
- 保活路由采用子应用 MemoryRouter 与宿主 path/update/navigate 契约同步；隐藏期间不消费其它应用路径。
- dev 普通浏览器在加载任意入口前镜像当前调试 Token 为同源 ticket；生产/桌面沿用 Cookie 会话，不恢复旧 Token。
- 加载失败显示可重试反馈；卸载失败捕获并记录，避免未处理 Promise。
- dev API/WS 代理覆盖资料库实际命名空间，保留 mock 先于 proxy 的既有行为。
- 显式刷新保留当前深链；登出/401 清理持久实例。
- main 的 navHold、广播通道、全局样式/标题副作用在适配层处理，并验证主站切换后的行为。

### 平台矩阵

| 行为       | 普通浏览器开发                 | 构建产物/桌面             |
| ---------- | ------------------------------ | ------------------------- |
| 认证       | Bearer 原链路 + 同源 ticket 桥 | 当前 Cookie 会话          |
| 子应用来源 | 隔离适配构建，固定 main SHA    | 同一 dist 下资源目录      |
| 页面切换   | 常驻容器隐藏/恢复              | 相同                      |
| 深链刷新   | 主站 history fallback          | nginx 主站 index fallback |

## 异常与失败场景

仓库不可访问、pin 不在 main 历史、适配 patch 不匹配、构建失败时中止，不复制旧产物。未登录由主站鉴权控制；加载失败可重试；刷新和清理顺序串行避免同名实例竞态。

## 测试计划

纯路由映射、缓存切换、加载失败/重试、显式刷新、卸载清理和深链同步测试；分层检查；会话合同回归；固定 main 的子应用及宿主构建；ego-browser 验证挂载、切换状态、历史和刷新。

## 已否决的方案

- 合并整个调研分支：会引入旧业务基线和无关变更。
- 每个路由使用 `microApp`：离开路由即卸载，不能满足保活。
- `/repo/` 同时作为资源 index 和主站业务路由：刷新可绕开宿主布局。
- 直接用旧 slave 业务分支：违反用户使用 main 的要求。
