# 分域 TypeScript 门禁

`pnpm typecheck` 使用项目当前的严格 TypeScript 配置，要求节点、会话核心、AppDevPro 工作台与宿主桥契约四个域内零诊断。全库仍有域外存量错误，分域通过不表示全库类型检查通过。

## 日常入口

```sh
pnpm typecheck
pnpm typecheck:nodes
pnpm typecheck:conversation
pnpm typecheck:workspace
pnpm typecheck:contracts
```

安装依赖的 postinstall 会执行 `max setup` 生成 `.umi` 配置与类型。已有依赖但生成目录缺失时可运行 `pnpm setup`；类型门只读，不会自动安装、下载微应用、同步产物或生成版本。

检查范围以 `typecheck-domains.json` 为准，域内测试夹具也受约束。其它 Chat 页面、模型和布局等未列出的文件不属于会话/工作台类型门。扩大范围时先修复新纳入文件的诊断，不提供历史错误额度或自动接纳错误的命令。

## 检查边界

检查器创建完整 TypeScript program，保持项目原有的编译与 import 语义，再按诊断所属文件归入所选域。配置或生成类型缺失、无输入、域文件没有进入编译、项目级诊断、语法错误或编译器异常会使检查失败。生成的 tsconfig、typings、exports 均须存在，生成模块也必须能通过检查；引用其他工作区源码或声明会被拒绝，共享 node_modules 依赖可以使用。域外业务诊断单独报告数量。

门禁沿用当前项目配置及第三方声明。现有 `declare module 'umi'` 仍为宽泛声明，库声明检查也遵循项目的 `skipLibCheck`；不能把门禁当作所有宿主声明与 Umi 调用已得到完整验证。宿主快照一致性继续由外层 `host-bridge:check` 验证，provider/consumer 契约回归也继续保留。

前端 CI 使用 `.github/workflows/typecheck.yml`。外层客户端复用前端脚本时，须更新源码 pin 才能带入已提交的检查器变更。运行行为仍由相关 Vitest、架构检查及 UI/后端验收验证。

检查器自身变更时运行 `pnpm test:typecheck`。它使用 `node --test` 验证域内零诊断、域隔离、配置与生成输入完整性，以及跨工作区引用边界；不由 Vitest 重复收集。
