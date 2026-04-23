# 无障碍检查清单

本项目为前端通用区域保留一套轻量级 WCAG 基线。

## 本地审计

运行生产构建下的 axe 快照：

```bash
pnpm install
pnpm run audit:a11y
```

脚本会构建应用、本地托管 `dist`，扫描 `/login`、`/`、`/home`、`/square`，并把 JSON 报告写入 `reports/a11y/`。

常用覆盖项：

```bash
A11Y_PAGES=/login,/home pnpm run audit:a11y
A11Y_BASE_URL=http://localhost:3000 pnpm run audit:a11y
A11Y_SKIP_BUILD=1 pnpm run audit:a11y
A11Y_CHROME_PATH=/path/to/chrome pnpm run audit:a11y
```

## 组件规则

- 优先使用原生 `button`、`a`、`input` 和表单控件，再考虑 ARIA。
- 只有图标的按钮必须用 `aria-label` 提供可访问名称。
- 自定义可点击容器必须同时支持鼠标和键盘激活。
- 保留可见焦点态；不要在没有替代方案时移除 outline。
- 图片需要有意义的 `alt`，装饰性图片使用 `alt=""`。
- 新增通用 UI 组件时，尽量补充 axe smoke test。

## PR 期望

- 开 PR 前运行 `pnpm exec max lint`。
- 修改 base/custom/layout 通用 UI 时，运行聚焦的 axe smoke test。
- 如果 `audit:a11y` 发现问题，在 PR body 里附上报告摘要。

## 故障排查

如果 `audit:a11y` 在产出 axe JSON 前失败，并提示缺少 `chromedriver` 二进制文件，请在该环境中通过 `pnpm approve-builds` 允许 `chromedriver` 安装脚本，然后重新安装或重建依赖。

如果提示找不到 Chrome 二进制文件，请安装 Chrome/Chromium，或把 `A11Y_CHROME_PATH` 指向浏览器可执行文件。
