# 实施计划：微应用单个与全部升级脚本

- 分级：中等需求，仅维护本计划；复用现有固定 main 构建合同。
- 状态：升级脚本及默认构建前升级全部均已完成。
- 范围：升级脚本、共享构建辅助函数、Node Git 合同测试、npm 命令与文档。

## 实施顺序

1. 增加 `upgrade:micro-apps`，显式选择 `message`、`repo` 或 `all`；支持 dry-run 和单应用选定 main 历史中的提交。
2. 共享构建锁和适配指纹；拒绝选中路径已有 WIP，允许无关文件 dirty/staged。
3. 获取选中来源 main，所有候选先通过 archive、patch 和 overlay 变化检查。
4. 保存恢复记录，再更新所选子模块 HEAD、adapter pin 和 index；失败尽力回滚每项，保留恢复记录。
5. 用真实临时 Git 仓库验证升级、整体失败、index 同步和 WIP 保留；补充使用文档。
6. 根据后续要求，`build:dev`、`build:prod` 的 prebuild 首先升级全部应用；允许仅有成对 gitlink/pin 暂存差异的重复升级，继续拒绝其它源码与适配 WIP。验证重复构建准备、继续升级和失败恢复，并同步文档。

## 证明成立的测试

- 单应用、全部、dry-run、无新提交、固定提交与 main/快进边界。
- patch 冲突、overlay 上游变化、子仓或适配 WIP、共享锁。
- 修改/stage 失败恢复原分支、adapter 字节、选中 index，并保留其他暂存内容。
- 原有微应用构建 Node 合同保持通过；脚本 syntax/help 和格式检查。
- 默认 prebuild 的升级 → 版本生成 → 子应用构建顺序与失败中止；已暂存配对 pin 的重复升级、继续升级和失败恢复。

## 验证结果

- `npm run test:micro-app-build`：60 项通过（50 项升级合同、10 项原有构建合同），0 失败；包含新增 14 项已暂存版本指针回归。
- 使用实际 package scripts 在临时目录替换升级/构建执行程序，验证 `build:dev`、`build:prod`、`build:prod:m` 的默认顺序与升级/sync 失败中止，共 9 个场景通过；未运行真实生产构建或远程升级。
- 两个脚本的 Node 语法检查、升级 CLI help、改动脚本与测试的 ESLint、相关新增文件的 Prettier 检查、`git diff --check` 均通过。
- 实际升级测试全部运行于临时 Git 仓库；真实消息与资料库子仓 pin、主仓暂存区保持原样。

## 风险与回退

- Git index 是构建输入，升级同时暂存所选 gitlink 和 adapter；不自动 commit、push、构建或部署。
- 上游 overlay 同名文件变化默认中止；人工审核后可显式放行，仍需完整构建与业务验收。
- 共享锁协调构建/升级脚本，首次写入前再次核对输入，避免覆盖后续编辑。
- 正常失败和 SIGINT/SIGTERM 尝试回滚；断电/SIGKILL 无法承诺自动恢复，使用持久恢复记录核对。
- 本次实现仅在临时仓库运行实际升级合同，不升级真实远程 main 或修改当前子仓 pin。
- 默认宿主构建依赖远程 main 可访问，并可能更新/暂存 gitlink 与 adapter pin；直接 `sync:micro-apps` 仍只构建当前固定输入。
