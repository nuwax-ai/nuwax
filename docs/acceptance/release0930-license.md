# 9.30 License 前端验收与接口交接

本期对应「本次版本剩余未完成内容」第 13 条，仅前端。当前文件导入交互是可调整的提案；输入方式和具体受控功能名单尚待产品确认。真实 OpenAPI 没有 License 接口，普通开发及生产明确显示服务未接入，不返回假授权成功。

## 页面与 mock

独立管理页 `/system/config/license`：查看需要 `license_query`，导入需要 `license_import`、provider 可用、服务返回 `canImport=true`。角色名为 Admin 不绕过资源权限。普通 `/403` 提示无访问权限，`/license-expired` 才提示授权到期。

专用 `pnpm run dev:release0930-mock` 在 `http://localhost:3102` 提供假登录、菜单和本地 provider。可以通过登录页进入系统管理 › 系统配置 › License 授权。文件输入非空且最多 1 MiB，手动提交；失败保留所选文件和此前快照，成功使用服务新快照。

`tests/fixtures/release0930-license/{valid,expired}.json` 是本地 JSON 样例，**不是实际 License 签名文件**。本地服务严格校验并投影最小快照，原子替换状态，原始文件内容不进入可查询的请求记录。切换本地只读或无权限模式可检查权限；控制接口可注入下一次读取/导入失败。

## 接入合同

实际路径、请求格式、业务错误码、文件签名格式及权限种子需后端确认；`/api/mock/release0930/license/*` 只用于本地供数，不能作为生产 API 地址。

最小读取投影：

| 字段 | 用途 |
| --- | --- |
| state | `NOT_INSTALLED / VALID / EXPIRED / INVALID`，由服务判定 |
| subject / maskedId | 授权主体与已脱敏编号，可缺省 |
| validFrom / expiresAt / updatedAt | 可选展示时间；前端不按本机时钟改写授权状态 |
| canImport | 当前账号是否可安装或更新；仍需前端资源权限 |
| features | 只读数组，项含明确 code、name、enabled 和可选 reason |

provider 接受原始 `File`，只将最小快照和明确错误类别交给 controller。controller 已支持 `AbortSignal`、账号切换撤销、请求乱序、防重复导入和失败重试。后端接入时替换独立 provider，不在页面中分散 URL、错误判断或签名逻辑。

执行授权同时要求 provider 可用、读取成功、`VALID` 和对应 feature 明确启用。未知字段被投影排除，未知状态或重复 code 拒绝；读取/导入失败会撤销可执行授权，即使为展示保留旧快照。`LicenseFeatureGate` 保证不可用时不挂载业务内容，但最终受控功能名单未确定，当前没有擅自套到生产业务页。登录、验证码、账号修复、退出登录和授权更新入口不纳入全局阻断。

## 证据与未完成项

领域、provider、mock 和 React 页面测试分别记录于本轮检查清单。测试覆盖并发、权限、环境隔离、导入保留输入和功能 gate 的失效/恢复；不把单元测试写成真实浏览器或后端联调完成。

2026-10-07 已在合入最新 feature 的 remaining 工作区完成 License 本地浏览器 8 项（导入失败保留文件/旧快照与重试成功、四种状态文案、读取失败恢复、只读隐藏导入），并修复状态和错误类别拼接出的无效翻译键。实际 React 页面 18 项 + 五语言翻译契约 5 项，共 23 项回归通过；登录/绑定及验证码等完整 24 项业务页面检查也已通过。详见[本轮合并与启动记录](./20261007-remaining-feature-integration.md)。

真实菜单/资源种子、实际签发校验、受控功能接入、无访问权限的真实环境行为与测试部署产物仍需分别验收。即使本地 mock 全绿，服务端授权 enforcement 仍需后端闭环。
