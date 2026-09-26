# 飞书候选：客户端产物文件下载

## 卡片 F-DOWNLOAD（候选，禅道去重待 root 确认）
- 来源：研发组，冯飞，2026-09-24：「桌面客户端产物里下载文件貌似没有保存到」。消息由 root 亲读；未把宽泛描述等同于精确复现。
- 分类：客户端 ↔ 前端文件桥；难度中；适合具备 Electron/preload/IPC 与前端 Promise 错误处理经验的 agent。
- 发现：旧客户端修复 2718afe1、前端 581e63806b 已含在基线，但文件树复用图片保存接口，合法 JSON/HTML 产物被 binary MIME 错误页保护拒绝；fileTree 未 await 保存，异步失败不能进入其现有提示。
- 处理：商业 overlay 新增 native:saveFile，并复用现有逐跳来源 cookie、trusted sender、取消与原子临时文件保存。仅源 URL 与最终 URL 的文档扩展匹配响应 MIME 才允许 JSON/HTML，ZIP/图片/API 错误页仍拒绝。saveImage 的行为保持不变。
- 前端：可选 saveFile 接入，旧壳回落 saveImage；downloadCompletion 调通用能力，fileTree 等待实际保存，使错误进入已有 catch。取消不触发备用下载。
- 本轮修复范围是这些明确源码缺陷；缺少原反馈文件 URL/类型/版本，原账号及原安装包上的广义现象尚未复验。

## 验证证据
- 壳测试先提交 9a422851：6 个新增用例失败、36 通过；实现后定向 7 文件 76/76 通过。
- 前端测试先提交 0eaa2ceaf：准备 Umi 后，8 失败、53 通过；实现后 3 文件 61/61 通过。初次缺 Umi tsconfig 的环境错误保留在初次日志，不当作缺陷红灯。
- 真实本地 Electron 40.8.2：独立 home/userData，实际商业 bridge handler、生产构建 preload、实际前端 downloadCompletion+hostBridge；系统保存对话框选择通过 fixture shim 指定临时路径。真实 IPC/fetch/fs 非 mock。
- 保存 HTML、JSON、TXT、ZIP 与源字节一致；同格式 302 成功；API JSON、HTML MIME 不符、登录重定向、断流、404 均失败且保留目标/清除 .part；取消不发请求、不重试。
- 品牌 main 生产构建通过；ESLint 0 错误（新增测试因现有配置 ignore 有 1 warning）；overlay --check 74 文件一致，check:pin 全部为 overlay，diff --check 通过。
- 前端 tsc --noEmit 退出 2，仍有全仓存量诊断；本次改动路径无诊断。不据此声称全仓类型检查通过。
- 未重新发包、推送、部署或写禅道；Windows 真机、原业务账号、原安装包尚未验证。独立评审由 root 安排，writer 不自批。
- fixture 自清理退出码 0；47926 旧 fixture 无监听，新 fixture 主进程也已退出，共享 Electron dev 未停止。

## 日志位置
/Users/apple/workspace/bug-batch-20260926/evidence/
- feishu-download-red.log
- feishu-download-client-green.log
- feishu-download-frontend-red-prepared.log
- feishu-download-frontend-green.log
- feishu-download-main-build.log
- feishu-download-eslint.log
- feishu-download-native.log
- feishu-download-native-fixture/（含 setup/main/源 bundle fixture，保存字节）

## 卡片 F-FILESERVER（已有处理，待合流）
- 来源：雷林周 9/24 更新说明：file-server 1.5.3，Git 优先原生、失败回落 isomorphic-git；罗东了解反馈。
- 主客户端提交 50ab2083 已升级 installVersion 与 npmFallback 至 1.5.3，计划 20260926-nuwax-file-server-upgrade-plan.md 记录 sources/resources 0cffa11、1.5.3 以及实际上传、list、ZIP 字节契约验证。
- 本轮 combined 基线较早，仍为 1.4.4 兜底；未在本修复分支重复更新依赖。root 合流 50ab2083 即可继承已有修复。原已运行客户端需要重启/新打包资源，不能据源码升级宣称原安装包通过。
