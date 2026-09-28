# Nuwax Logo 与应用图标替换计划

- 用户需求：使用 `/Users/apple/Downloads/logo/` 的素材替换 nuwax PC Web 和 nuwax-client 的 Logo、favicon、应用图标。
- 状态：已完成静态资源替换与构建验证；未发布或进行安装包验收。

## 范围与顺序

1. PC Web 仅替换 `src/assets/images/logo.png`，提供 `public/logo.png` 和静态默认 favicon；租户配置中的 `siteLogo`、`faviconUrl` 及其现有渲染、缓存逻辑保持原样。
2. 审计固定品牌资源与引用；不替换智能体、用户、插件等业务对象的可配置图标。
3. nuwax-client 在商业 `overlay/` 更新 PNG、Dock、ICO、ICNS、托盘资源；补齐 Windows DPI 尺寸，macOS 托盘保持黑色剪影与透明背景。
4. 仅同步本次图标及品牌文件到客户端子模块，保留现有开发服务和无关 WIP。

## 验证

- 检查 PC Web 生产构建和静态资源输出，确认配置下发的 Logo、favicon 仍优先显示。
- 检查客户端图标格式、尺寸、透明度、overlay 同步和打包配置指向。
- 本次不涉及会话实现、不发布新版本；安装包验收与源码资源验证分别记录。

## 风险与回退

- 平台品牌通过配置下发，本次不迁移、不覆盖后台配置地址。
- 回退本次静态资源与默认 favicon 配置即可；不还原整个共享工作区。

## 范围调整

- 用户进一步明确：本次仅处理之前写死的部分。撤回旧配置 URL 迁移、默认 Logo 渲染兜底与 favicon 更新逻辑，移除对应工具和测试，恢复租户配置驱动的原有行为。

## 验证结果

- PC Web 生产配置构建通过；构建输出的 `logo.png`、`favicon.ico` 与提供的素材逐字节一致，HTML 包含默认 favicon。
- 主前端及客户端前端子模块的租户模型、登录页与两种导航 Logo 渲染文件，均与各自原始 HEAD 逐字节一致。
- 客户端 renderer 生产构建通过，构建输出包含新图标；ICO 11 层（16 ～ 256px）全部可解码；ICNS 10 帧（16 ～ 1024px）可导出，最大帧像素与 Dock PNG 一致。
- macOS 托盘为带透明背景的黑色星形剪影（22/44px），彩色托盘为 32/64px；Dock 沿用原来的 82px 外留白。
- overlay 检查：94 个文件一致，0 个待同步；`git diff --check` 通过。
- `check:pin` 受已有未跟踪 `resources/computer-use/Nuwax Computer Use.app` 生成产物阻塞；保留这些资源及其他无关 WIP。
- 最终页面未复查：原 Ego Browser 验收空间已关闭。先前针对已撤回逻辑的 10 项测试不作为最终交付证据。
