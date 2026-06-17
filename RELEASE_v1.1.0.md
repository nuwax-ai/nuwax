# Release v1.1.0

基于 v1.0.9 至 main 的变更整理，可直接用于 GitHub/GitLab Release 描述。

---

### ✨ 新功能

- 广场（Square）增强滚动加载与自动填充逻辑，支持更多内容流畅加载。
- 空间板块（SpaceSection）增强滚动加载与自动填充逻辑，优化长列表浏览体验。
- 生态 MCP（EcosystemMcp）增强滚动加载与自动填充逻辑，提升生态市场内容加载能力。
- 知识库原始片段（RawSegmentInfo）增强自动加载与编辑功能，便于文档片段管理。
- 更多操作菜单（MoreActionsMenu）新增重启功能图标并更新相关常量，便于开发环境快捷操作。

### 🐛 Bug 修复

- 修复空间知识库（SpaceKnowledge）页码更新逻辑并优化文档加载体验。
- 修复知识库原始片段（RawSegmentInfo）页码更新逻辑以正确加载数据。
- 修复数据权限弹窗（DataPermissionModal）页码更新逻辑以提升数据加载体验。
- 修复空间板块（SpaceSection）滚动加载逻辑以正确更新页码。
- 修复生态 MCP（EcosystemMcp）滚动加载逻辑以正确更新页码。

### ♻️ 重构

- 广场（Square）优化滚动加载逻辑，提升代码可维护性。
- 菜单列表项、页面预览 iframe、菜单布局（MenuListItem, PagePreviewIframe, MenusLayout）优化组件逻辑与样式。
- 布局与动态菜单（Layout, DynamicMenusLayout）移除已注释的动态菜单相关代码以简化布局。
- 动态菜单、空间板块、空间开发、应用项（DynamicMenusLayout, SpaceSection, SpaceDevelop, ApplicationItem）注释掉开发收藏相关逻辑以简化代码。

### 🎨 样式优化

- 空间开发（SpaceDevelop）更新主容器样式以优化响应式布局。

---

**版本**：v1.1.0  
**基准**：v1.0.9 → main  
**日期**：2026-03-06
