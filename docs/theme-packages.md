# 主题包制作与安装（schemaVersion 1）

桌面客户端和 PC Web 使用同一份主题包。官方浅色、暗黑和 DeepSeek Inspired 示例也由共用主题核心解析。主题只改变外观，切换时不重建会话、微应用或编辑器；不包含 JavaScript，不替换页面布局。

## 安装与本地开发

在设置的主题面板中导入 ZIP、选择主题和浅色／暗黑／跟随系统。双变体支持跟随系统；单变体只显示该模式。默认使用官方浅色。内置主题不可被外部包覆盖，导出模板会生成可修改的 `my-theme` ID。

- 桌面：可导入 ZIP，也可关联本地目录。保存 JSON、CSS 或图片后，约 200ms 合并变更，完整校验通过才生效。文件未写完、语法错误、目录暂时离线时保留最近有效版本并显示错误；修复后自动恢复。打开目录可继续编辑。删除关联只取消关联，保留原目录文件。
- Web：包与选择保存在当前浏览器的 IndexedDB，刷新或离线重开可恢复。编辑文件后重新导入。相同 ID 需确认覆盖；导入或存储失败保留当前主题。相同源的其他标签页自动更新。
- 导出：分享 ZIP，不含账号数据、绝对路径或关联目录信息。主题只保存在本设备／浏览器，不进行账号同步。

桌面安装位置为产品数据目录下的 `themes/installed/<id>`；`themes/registry.json` 保存最近有效包和选择。请通过界面管理，勿手工编辑 registry。历史显式主色／背景首次迁移为可移除的 `nuwax-migrated` 包；已有显式主题选择优先于迁移、登录和租户配置。

恢复默认可在主题面板操作。如果自定义 CSS 遮住入口：Web 用 `?theme=default` 打开页面；桌面退出后用 `--safe-theme` 启动（macOS：`open -a Nuwax --args --safe-theme`）。恢复模式只应用官方外观，保留原选择和文件；可在其中恢复默认，再正常启动。

## 创建目录和 ZIP

无需编译，直接编辑文本文件：

```sh
node scripts/theme-package.mjs template /tmp/my-theme
# DeepSeek 风格起点，同样生成可安装的 my-theme ID
node scripts/theme-package.mjs template /tmp/my-example deepseek
node scripts/theme-package.mjs validate /tmp/my-theme
```

目标目录必须不存在。也可从主题面板导出模板。修改 ID、名称和版本后压缩；ZIP 可直接包含 `theme.json`，或只包一层主题目录。忽略常见 macOS ZIP 元数据。

```text
my-theme/
  theme.json
  tokens/light.json
  tokens/dark.json
  styles/common.css
  styles/message.css
  styles/repo.css
  assets/background.png
  preview.png                 # 可选
  README.md                   # 可选
```

```json
{
  "schemaVersion": 1,
  "id": "my-theme",
  "name": "My Theme",
  "version": "1.0.0",
  "author": "Theme author",
  "preview": "preview.png",
  "variants": {
    "light": {
      "tokens": "tokens/light.json",
      "styles": {
        "common": ["styles/common.css"],
        "message": ["styles/message.css"],
        "repo": ["styles/repo.css"]
      }
    },
    "dark": { "tokens": "tokens/dark.json" }
  }
}
```

仅保留实际存在的文件入口。`id` 为小写安全 slug，`name/version` 必填，`author/description/preview` 可选；至少一个 `light/dark` 变体。`nuwax-default` 和 `deepseek-inspired` 为保留 ID。每个变体独立指定 CSS；想在两种模式使用同一份 CSS，需在两处声明。

## Token 契约

Token JSON 是扁平字典，只写需要覆盖的值，未填写的键继承官方对应模式。公开键如下：

| 范围 | 键 |
| --- | --- |
| 背景 | `app.bg`, `surface.bg`, `sidebar.bg`, `elevated.bg`, `input.bg` |
| 文字与边框 | `text.primary/secondary/disabled/inverse`, `border.default/strong` |
| 品牌和状态 | `primary`, `primary.hover/active`, `success/warning/error/info` |
| 交互 | `hover.bg`, `selected.bg`, `focus.ring` |
| 对话 | `chat.user/assistant/think` 各自的 `.bg/.text` |
| 独立渲染器 | `code/editor/terminal` 各自的 `.bg/.text` |
| 字体 | `font.family`, `font.code`, `font.size` |
| 尺度 | `radius.small/medium/large`, `spacing.small/medium/large` |

颜色只接受十六进制 `#RGB/#RGBA/#RRGGBB/#RRGGBBAA`；字体接受本机已安装字体名列表；尺寸接受 `0` 或非负 `px`，字号必须大于 0。不接受 Token 中的函数、URL 或表达式。v1 不支持注册包内字体；可打包 WOFF2 静态资源，但不允许 `@font-face`。

```json
{
  "primary": "#4d6bfe",
  "sidebar.bg": "#f9fbff",
  "chat.user.bg": "#edf2ff",
  "font.family": "system-ui, sans-serif",
  "radius.large": "16px"
}
```

共用核心统一生成 Ant Design Token、`data-theme=light|dark` 和 `--nuwax-*` CSS 变量。键的点替换为连字符，如 `text.primary` 对应 `--nuwax-text-primary`；同时维护历史 `--xagi-*`、`--v2-*` 等语义别名。Markdown、Monaco、Mermaid、图表和终端通过各自主题接口接收同一快照。

## CSS 与样式入口

清单支持 `common/web/shell/message/repo` 有序 CSS 数组，每个界面先应用 common，再应用专属 CSS。选择器自动收拢到对应 `data-theme-surface`，并在嵌套微应用边界停止匹配。`:root/html/body` 只能位于顶层选择器开头，会被替换为当前界面根。`html body` 等连续根不支持。

公开的 `data-theme-part`：

| 界面 | 入口 |
| --- | --- |
| 主站 | `sidebar`, `conversation`, `input`, `theme-settings`, `resource-catalog`, `app-catalog` |
| 工作流 | `workflow-canvas`（画布、节点与连线的外观） |
| 消息／资料库 overlay | `sidebar`, `conversation`, `input`, `message-bubble`, `search`（对应组件存在时标记） |
| 内容渲染器 | `markdown`, `terminal` |
| 桌面壳 | `theme-manager`, `browser-toolbar` |

消息和资料库通过主站 `props/update` 同步，只修改 `micro-frontends/**` overlay，不编辑上游子模块。文档纸张、用户内容和图片保留自己的颜色。任意业务 class 不属于稳定 API。

工作流画布与节点、开发会话的 Markdown 和流式输出、文件结果卡片、文件预览工具栏及订阅设置／统计页面消费上述 Token。切换明暗只更新外观，不重建图数据、消息或编辑器。页面预览的 URL 工具栏属于宿主外观；iframe 内的网页不注入主题，保留网页自己的样式。业务组件对尺寸 Token 的覆盖以实际接入为准，公开 Token 不表示每一个固定间距或圆角都已替换。

```css
[data-theme-part='input'] {
  border-radius: var(--nuwax-radius-large);
  background-color: var(--nuwax-input-bg);
}
[data-theme-part='sidebar'] {
  background-image: url('../assets/background.png');
  background-size: cover;
}
```

CSS 内 URL 相对 CSS 所在目录；允许包根内归一化的 `../assets`，禁止逃出包根。仅允许包内 PNG/JPEG/WebP/WOFF2，不允许远程、data/file URL。运行时替换为受管理的 blob URL，切换后释放旧资源。全站壁纸可用唯一允许声明的自定义属性：`:root { --nuwax-background-image: url("../assets/background.png"); }`。

允许常规局部选择器、`:is/:where/:not/:has` 和块级 `@media/@supports`。拒绝 `@import/@font-face/@keyframes`、CSS 嵌套、动画／过渡、其他自定义属性声明、CSS 转义和可执行内容。`var()` 只允许公开语义变量，不支持 fallback。作用域隔离选择器，不限制布局或遮挡，因此仍需人工检查第三方主题外观。

## 校验边界与开发 API

最多 500 文件、单文件 5 MiB、解码总计 20 MiB；目录深度最多 32。拒绝符号链接、非普通文件、包外路径、大小写冲突、Windows 设备名和原型污染键。ZIP 另检查中央目录／本地记录一致性、重复路径、压缩方法及限额，拒绝 ZIP64、多卷和加密。图片／字体检查文件头，仍由浏览器完成解码。

允许小写扩展 `json/css/png/jpg/jpeg/webp/woff2` 和精确 `README.md`。SVG、HTML、JS、可执行文件均不接受。所有 JSON 和 CSS（包括未引用文件）都检查。错误包含包内文件／字段；无效包不会替换有效状态。

`src/features/themes/core/index.mjs` 是无 DOM/Node 的核心，`index.ts` 为前端入口。`ThemeFiles` 为安全相对路径到规范 base64 的映射；快照及结果可 JSON 序列化。外部安装必须调用 `assertInstallableThemeId`。桌面快照由根脚本 `npm run theme-core:sync` 生成，`theme-core:check` 防止跨端漂移。

```ts
const pkg = validateThemePackage(files);
assertInstallableThemeId(pkg.manifest.id);
const snapshot = resolveThemePackage(pkg, 'system', systemDark, revision);
```

主题桥通过 `themes` 能力探测，提供读取列表／状态、安装、导出、选择、移除、关联／打开目录和订阅。旧宿主不具备该能力时，PC Web 使用浏览器存储。

## 给 AI 的制作提示词

将本文件连同导出的模板一起交给生成工具：

> 请按随附 Nuwax schemaVersion 1 模板生成主题目录，无需构建。使用新 ID 和版本，至少一种 light/dark 变体。只使用文档列出的 Token 和 data-theme-part；提供明暗变体时分别检查文字、输入框、消息与代码的可读性。CSS 按 common/web/shell/message/repo 分区，只引用包内 PNG/JPEG/WebP。不要生成 JavaScript、HTML、SVG、远程 URL、@import、@font-face 或动画。不修改页面结构、不隐藏设置入口、不改变用户内容颜色。交付完整目录、README、修改说明，并运行 `node scripts/theme-package.mjs validate <目录>`；失败先修复再压缩。
