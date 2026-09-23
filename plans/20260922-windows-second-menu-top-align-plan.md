# Nuwax 客户端壳顶部退让与二级菜单对齐计划

## 目标

- macOS 红绿灯位于左导航列：导航展开时主内容不退让，收起时 page-container 与全屏内容退让 `TOOLBAR`。
- Windows/Linux 菜单行横跨窗口：page-container 在导航展开/收起时都从 `CONTENT_TOP` 开始，二级菜单背景与它对齐。
- 无 page-container 的独立全屏页使用宿主默认值：macOS 为 `0`，Windows/Linux 为 `TOOLBAR`。
- 浏览器、社区宿主和带系统标题栏的独立窗口不启用沉浸壳退让。

## 实现

1. hostBridge 识别 Nuwax 沉浸主窗口平台并提供唯一尺寸源。
2. `src/utils/hostBridge/shellAvoidancePolicy.ts` 按平台、页面形态、导航收起态计算 page-container / 独立页的顶部值；`SidebarShell` 只传入路由与导航状态并消费结果。
3. 二级菜单列的结构专属高度和内边距继续由 `src/layouts/DynamicMenusLayout/secondMenuPolicy.ts` 负责，消费同一尺寸源。
4. 全局 LESS 只消费 CSS 变量，不在样式层重复判断平台或推导补偿值。
5. Windows/Linux 的 page-container 背景从 `CONTENT_TOP` 开始，二级菜单用 `TOP - CONTENT_TOP` 作为内部顶距，并同步扣减二级列高度。
6. macOS 导航展开时主内容不退让，收起时退让 `TOOLBAR`；独立页使用宿主默认值。
7. 该矩阵只对 Nuwax 沉浸主窗口生效，浏览器、社区宿主和独立窗口沿用原行为。
8. 几何策略保持纯函数，补回归用例；Windows/Linux 与 macOS 预览覆盖导航展开/收起及全屏页。
