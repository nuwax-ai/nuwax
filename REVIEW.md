<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 5 · PR 评审清单（agent 与人共用）。Passes 2–4 的领域细项安装后按仓库实际维护。
-->

# REVIEW.md — PR 评审清单

> 发现项本身不批准也不否决 PR；approve 永远是人（writer-agent 没有自批路径）。

## 检查遍（passes）

1. **Bugs & 逻辑错误**
   - 对照本 PR 关联的 `specs/<feature>.md` / `plans/*-plan.md`；无工件时自查：空值、竞态、错误吞掉不报、边界条件。
2. **Security**
   - 凭证不进 diff（guard-paths 已拦编辑期，此处复核漏网）；外部输入校验；权限与隔离边界未放松；依赖与发布物来源可信。
3. **Compliance 合规对照**
   - 行为与 `specs/<feature-slug>.md` 的"本期做/不做"逐条吻合；差异要么改码要么改规格并在 PR 说明。
   - 契约双同步：改动涉及对外契约（API/协议/文档/工具描述）时，所有登记过的同步位置是否一起动了。
4. **架构原则**
   - 落点符合本仓分层与包边界；依赖方向单向；组合根唯一。
   - （安装后按 docs/architecture.md 补充本仓具体分层清单）
5. **Tests & Evidence**
   - 测试落位与层级匹配；bug 修复须可见"失败测试先于修复"的提交序列。
   - PR 描述附 pnpm test 最近一次结论数字；红灯注明归属（在途 vs 主干）。

## Important vs Nit

- **Important**：会错、会丢数据、有安全面、破坏架构约束——必须处理才能 approve。
- **Nit**：风格/命名/更优雅写法——**全 Review 最多 5 条**；格式化工具已覆盖的不算 Nit。

## 跳过项

- 构建产物与三方源码树；格式化工具/CI 已强制事项；纯措辞偏好。

## 发现项处置

- 同类错误第二次被抓 → 纠正写入 AGENTS.md（"错两次进规则"纪律）。
- 变更让 AGENTS.md / docs 过时 → 评审里指出需同步。
