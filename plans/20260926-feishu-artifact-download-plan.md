# 飞书 9/24 客户端产物下载补修

## 来源与范围
- 冯飞 9/24：「桌面客户端产物里下载文件貌似没有保存到」。来源由 root 亲读；禅道去重仍由 root 完成，当前仅候选。
- 旧下载修复 2718afe1 / 前端 581e63806b 已在基线；尚存在合法 JSON/HTML 被图片 binary guard 拒绝、文件树未 await 落盘 promise 的缺陷。
- file-server 1.5.3 已在独立提交 50ab2083 处理，不更新依赖，不发布或推送。

## 实施边界
1. 在商业 overlay 增加 native:saveFile 与 preload 可选能力，复用可信 sender、源隔离、逐跳 cookie、取消与原子落盘。saveImage 保持原 binary 保护。
2. 通用文件下载仅在源 URL 扩展与响应 JSON/HTML MIME 一致时允许文档。仅更改对话框文件名不能让接口错误页被当成文件；ZIP/图片请求的 JSON/HTML 错误继续拒绝。
3. 前端独立工作树增加可选 hostBridge.native.saveFile（旧壳回落 saveImage）、downloadCompletion 优先调用；fileTree.downloadFileByUrl await 下载，使现有 catch 展示失败。
4. 先保存失败测试结果，再实现；跑定向壳/前端测试、真实本地 Electron+guest+preload 保存字节验证、overlay/check:pin/diff。原安装包与 Windows 真机不在本机证据内。

## 工作树
- 壳 /Users/apple/workspace/nuwax-client-feishu-download-20260926，基线 85a1b04c，基座固定 f7e3f931。
- 前端 /Users/apple/workspace/nuwax-feishu-download-20260926，基线 d2db5ef6f。
