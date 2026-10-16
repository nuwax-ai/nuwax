# 参与开发

环境准备、子模块与日常命令见 [开发上手](docs/getting-started.md)。使用 pnpm，并保留现有锁文件。

- 命名、分层与国际化：[工程规范](docs/engineering-conventions.md)。
- 按改动风险选择验证：[测试策略](docs/testing-strategy.md)；会话改动遵守 [会话维护指南](docs/conversation/dual-track/conversation-maintenance-guide.md)。
- 子模块与构建：[微应用手册](docs/micro-apps-runbook.md)。
- 提测：[部署手册](docs/deploy-sync-test-runbook.md)。

提交使用 conventional commit。提交钩子会格式化暂存文件；PR 写清行为变化、验证结果和未覆盖边界，评审参照 [REVIEW.md](REVIEW.md)。
