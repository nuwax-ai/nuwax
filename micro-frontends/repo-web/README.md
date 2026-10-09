# 资料库 main 的隔离适配层

业务来源为 `submodules/nuwax-repo-web` 的固定 main 提交，原始子模块保持干净。构建脚本在独立缓存内 `git archive` 后，依次校验/应用 `adapter.patch` 和 `overlay/`，依赖安装继续使用子仓原始 lock 的 frozen 模式。主仓提供精确版本的 qiankun Vite 插件。

资源入口 `/micro-apps/repo/index.html` 与业务地址 `/repo/*` 分开。业务深链刷新始终由主站布局承接。适配 dev server 独立调试仍使用 `http://localhost:7100/repo/`。

## 生命周期契约

`mount` / `update` 的 props：

```ts
{
  container?: HTMLElement; // qiankun 注入，React 根限定为内部 #root
  path?: string;           // /repo/*，包括 search/hash
  active?: boolean;        // false 时保存内部路径，拒绝宿主其它模块路径
  onNavigate?: (path: string, replace: boolean) => void;
  onAuthExpired?: (target: string) => void; // 认证跳转交宿主清会话及执行 SSO/桌面代理桥
}
```

嵌入采用 `MemoryRouter`，保持 main 的 `useTransitions=false`。宿主导航通过 `update` 下发，业务路由变化通过 `onNavigate` 回传，回传同路径不循环写 history。隐藏保持实例；真正卸载时清理 React 树和目录广播通道。

## 副作用边界

- main 的门户/doc query 改为 Router replace，直接浏览器 history state 清理仅用于独立模式；嵌入 state 保留导入播种载荷，不写宿主 history。
- 嵌入禁用 navHold 的主文档 root 克隆与 history patch；title/favicon 由宿主管理。
- 已知业务 body portal、滚动锁、公式栏拖拽类名落子根；静态 CSS 选择器、viewport units、keyframes 经构建收拢。
- 子根建立固定弹层边界和容器尺寸，隐藏时弹层跟随隐藏。
- 快捷键和分享页复制限制只监听子根；真正重挂重置目录缓存，隐藏保活继续使用原缓存。
- 请求开始捕获实例 generation；4010/4011 和嵌入时的裸 HTTP 401 通知宿主，卸载后迟到响应不触碰新会话；匿名分享的 `skipAuthRedirect` 保留。

## 验证与边界

`git apply --check` 绑定当前 main 内容；路径、隐藏导航、同路径回传、标题/弹层边界、广播卸载的合同由 `adapter.test.ts` 验证。构建与真实编辑器/协作 WS 验收属于独立证据，不能由合同测试替代。

当前固定 main 的 `tsc -b` 存在 72 个错误。构建管线先用相同 frozen 依赖检查原始 main 与适配产物，比较路径/错误码/完整消息的多重集（忽略行号），任何新增都阻断；基线数量/摘要进入产物 manifest 后再执行 Vite 构建。

真实 React 19 / React Router 7 的合同用独立配置运行，避免主仓 React 18 混入子应用：

```sh
NUWAX_REPO_APP_ROOT=<已安装依赖的隔离子应用缓存> pnpm exec vitest run --config micro-frontends/repo-web/vitest.router.config.ts
```

第三方引擎或文档内任意脚本在运行期自行追加全局节点/样式仍需真实场景走查；main 无统一适配 API，升级 gitlink 必须审查 patch 与 overlay，不得静默跳过失配。CSS 媒体查询仍以浏览器视口判断，编辑器窄屏行为另需检查。
