# file-preview 预览缓存版本号未 bump 处置记录

> 处置日期：2026-08-26 · 分支：`feat/conversation-auto-collapse` · 提交：`d50c5119e` · 问题等级：P2（缓存命中用户拿不到已修复代码）
>
> 来源：8-26 上午 24h 提交审查（审查对象 `055831262 fix(preview): 保留Markdown预览页面标题的文件后缀名`）。

## 1. 背景

`public/static/file-preview.html` 是静态托管页，其引用的三个脚本不走构建哈希，靠手写 `?v=` 查询参数做缓存失效，文件内有明确约定注释：

```html
<!-- 改脚本后请 bump ?v=，避免 CDN/浏览器缓存旧文件 -->
```

`055831262`（8-25 15:14）修改了 `file-preview-utils.js` 与 `file-preview.js`（保留 `.md` 标题后缀），**未按约定 bump 仓库内 `?v=`**（停留 `2026.8.5-katex`）。

## 2. 部署侧事实（2026-08-26 核实）

- 部署链路：`gitlab/test` 分支 dist 即部署物；`gitlab/test:dist/static/file-preview/file-preview.js` 与 `055831262` 修复版 **md5 逐字节一致**（`c2acd030…`）——修复代码已上线。
- 但 8-25 两次发版（14:22 坏版、16:18 修版）部署时共用了同一版本串 `?v=2026.8.25-md-title`（dist 内当前仍是该值）。
- 后果：CDN/浏览器在 14:22–16:18 之间缓存了坏版 `file-preview.js?v=2026.8.25-md-title` 的节点，对同 URL 持续命中坏版，**修复对这部分用户不可达**，直至缓存过期或版本串变更。

## 3. 处置

- 仓库侧（`d50c5119e`）：`file-preview-utils.js` 与 `file-preview.js` 的 `?v=` 从 `2026.8.5-katex` bump 至 `2026.8.26-mdfix`（openui 脚本未改动，保持 `2026.8.3`）。
- **部署侧操作项（未完成）**：需携带新版本串重发一次 dist 到 `gitlab/test`。仅重发不带新 `?v=` 无效——缓存命中的判定键是完整 URL（含查询参数）。

## 4. 防再发约定

1. 改 `public/static/file-preview/` 下任何脚本，同提交内 bump 对应 `?v=`（文件内注释已声明，走 review 时以此为准卡口）。
2. 部署发版时版本串不得与历史已发版本串重复——同串重发对已缓存用户等于没发。
3. 版本串建议格式 `YYYY.M.D-主题`（既有惯例），每次内容变化必须产生新串。
