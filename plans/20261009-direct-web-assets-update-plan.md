# 实施计划：direct-web-assets-update

- 对应 spec：specs/direct-web-assets-update.md
- 状态：已完成实现与本地验收（未发布）

## 实施顺序

1. 修复构建元信息和 CSS 保留/历史回填，并补充定向测试。
2. 实现 direct 版本检查和徽标；纠正已加载版本上报，补充多语言与回归测试。
3. 用真实浏览器和 Electron 的 A/B 产物夹具验收，执行前端质量门与构建检查。

## 证明成立的测试

- 旧异步 CSS 在新部署后继续 200/text-css，超出 3 代按规则清理。
- HTML/JSON hash 一致；构建标记变更不要求业务 JS 携带 hash。
- 仅 direct 启动检查；未知/失败不误报，同版隐藏、变版提示；隐藏/清理不泄漏轮询。
- 只有点击胶囊才刷新，当前路径、query/hash 和登录态保留。

## 风险与回退

旧页面无新逻辑时，首次加载新版本后才启用提醒；超过保留窗口仍可能需刷新。产物发布必须一并提供新入口和 version.json。实现只改 PC Web，保留外层仓库与壳的现有 WIP，不自动推送或部署。

## 偏离记录

暂无。

## 执行结果

三项实施步骤均完成。104 项定向测试、1145 项会话回归、架构检查及 production 构建通过；真实 Chromium 和 Electron webview 的 A/B 夹具通过。HTML 与 version.json 使用相同 hash，写入元信息前后 419 个业务 JS 文件字节不变。

全库 TypeScript 检查仍有既有错误，本次新增和修改路径没有错误。验收使用模拟宿主桥及 cookie/localStorage 登录标记，不代表真实账号、安装包或线上发布验收。历史 CSS 首次回填依赖当前旧产物的 version.json、保留清单和本地 Git 历史；历史不完整会报告并保留重试状态。

详见 [本地验收记录](../docs/acceptance/20261009-direct-web-assets-update.md)。
