# PC 商业授权管控验收记录

日期：2026-10-08。独立分支 `codex/pc-commercial-license-20261008`，基于 `feat-dong.0930-remaining` 已提交 HEAD `9167fab0397e41095c0b1beec8871af9c21ae7dd`。主工作区的未提交内容未复制或修改；两个子模块按基线初始化。

## 自动化结果

| 检查                                    | 结果                          |
| --------------------------------------- | ----------------------------- |
| License、推荐管理、菜单、微应用、侧栏   | 28 文件 / 287 项通过          |
| 智能分段撤权后的实际弹窗提交            | 1 文件 / 1 项通过             |
| `npm run test:conversation`             | 113 文件 / 1156 项通过        |
| `npm run lint:arch`                     | 通过，97 项既有豁免           |
| `pnpm exec tsc --noEmit --pretty false` | 全库有历史诊断，改动路径 0 项 |
| `git diff --check`                      | 通过                          |

相关测试命令：

```bash
pnpm exec vitest run tests/license tests/recommendManagement tests/microApps tests/release0930RemainingMock.test.ts src/layouts/SidebarShell/index.test.tsx src/layouts/DynamicMenusLayout/NewHomeSection/SidebarNavHomeSection.test.tsx
```

覆盖两个字段四种独立组合；缺失、null、字符串 "true"、数字等只按未授权处理，不回退旧 `commercialEdition`。验证菜单显隐不删除 RBAC 权限，配置变化可恢复菜单和默认选中项；新增推荐提交与异步校验期间撤权均受限制，历史推荐编辑保留原子类型。work 入口包括菜单路径、深链、稳定入口和旧 iframe；授权撤销释放持久微应用实例，未授权不触发鉴权同步或应用加载。

## PC 页面走查

通过 ego-browser 操作独立本地开发服务 `http://localhost:3118`，使用 `UMI_ENV=release0930Mock` 的租户接口夹具及假账号。页面、路由和组件采用真实业务代码。新增 `commercialScenario` 仅为专用 mock 模式提供已配置菜单和空列表，不改变生产菜单配置。

- 新增对话框智能体推荐：未授权只有“智能体”，授权后七类全部可选。
- 智能体开发：未授权创建仅问答型/通用型，类型筛选不含 Flow/Group；授权后创建入口恢复 AgentFlow/AgentGroup。
- 单栏侧栏：未授权隐藏项目分组及工作空间项目菜单；授权后恢复。经典侧栏：授权显示任务/项目，未授权保留任务，缓存项目选择不会占用任务页。
- 知识库：未授权不显示图谱；自定义文档分段设置只显示自动分段与自定义。授权后图谱与智能分段恢复。
- 伙伴、资料库：未授权菜单仍保留，进入内容区显示“请联系官方获取试用授权或商业授权”，DOM 无 iframe 或微应用实例。
- `/repo-entry`、`/open-iframe-page/ziliaoku` 同样拦截；授权后伙伴与资料库可以创建宿主实例，资料库稳定入口正常跳转 `/repo`。

## Electron WebView

使用 Electron 40.8.2 的真实 `<webview>` 加载同一本地 PC 页面，独立临时会话与假 Token。验证了未授权新增推荐默认智能体、伙伴菜单站内跳转提示、旧 iframe 入口不挂载应用、aiOS 授权后七类子类型可选。

## 验证边界与交付

本地验证覆盖授权入口和生命周期。未部署或验证线上租户接口，未进行正式客户端安装包验收，未验收子应用完整业务与真实 IM provider。本轮不合并、不推送、不部署。

aiOS 只控制入口显隐，已有内容与直达链接继续按原权限使用。伙伴/资料库/专家·技能·连接器默认菜单由后端处理，前端保留管理员明确配置的菜单；独立伙伴、资料库地址的授权兜底由相关同事负责。“工作空间”保持原名，移动端和历史数据未改动。
