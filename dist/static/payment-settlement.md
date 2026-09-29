# 支付中间结算页（前端迁移说明）

参考实现：`PaymentSettlement.html`（纯 HTML，可改为 Vue/React 路由页）。

## 1. 路由与 URL 参数

建议前端路由：`/pay/settlement`（路径按项目规范自定）。

| 参数 | 必填 | 说明 |
|------|------|------|
| `orderId` | 是 | Bill 订单 ID |
| `returnUrl` | 是 | 结算成功后回到的**业务页**完整 URL（可已带 query） |
| `callback` | 否 | 与 `returnUrl` 等价 |
| `pollIntervalMs` | 否 | 轮询间隔，默认 2000 |
| `pollMaxTimes` | 否 | 最大轮询次数，默认 60 |
| 其它 query | 否 | 成功/失败回跳时**透传**到业务页 |

打开收银台前，调用接口时把**本结算页完整 URL** 作为 `returnUrl` 传给后端：

```http
GET /api/bill/order/pay/cashier?orderId={orderId}&returnUrl={encodeURIComponent(结算页完整URL)}
```

结算页 URL 示例（由前端自行拼接）：

```text
https://{前端域名}/pay/settlement?orderId=12345&returnUrl=https%3A%2F%2F{前端域名}%2Fcredits
```

## 2. 轮询接口

```http
GET /api/bill/order/settlement-status?orderId={orderId}
```

需登录态（Cookie `ticket` 或项目统一 Authorization）。

响应 `data`（`OrderSettlementStatusResponse`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `settled` | boolean | `true`：Bill 已支付成功，可回跳业务页 |
| `terminalFailed` | boolean | `true`：失败/关单等终态，停止轮询 |
| `payStatus` | enum | `PENDING` / `SUCCESS` / `FAILED` / `CLOSED` 等 |
| `message` | string | 展示文案 |

后端在非终态时会主动调用 pay 同步网关并通知 Bill，一般 1～2 次轮询即可 `settled=true`。

## 3. 页面状态机

```
进入页面 → 轮询 settlement-status
  ├─ settled=true        → 展示成功 → 约 600ms 后 location.replace 业务页，追加 payResult=success
  ├─ terminalFailed=true → 展示失败 → 用户点返回，payResult=failed
  └─ 均未满足且超时      → 提示处理中 → 返回业务页 payResult=pending
```

回跳业务页时合并 query：

- 保留结算页 URL 上除保留字外的参数（透传）
- 追加 `payResult`：`success` | `failed` | `pending`

保留字（不要当透传业务参数）：`orderId`、`returnUrl`、`callback`、`pollIntervalMs`、`pollMaxTimes`。

## 4. 业务页处理建议

```javascript
const payResult = new URLSearchParams(location.search).get('payResult');
if (payResult === 'success') {
  // 刷新积分 / 订单状态
} else if (payResult === 'failed') {
  // 提示支付未完成
} else if (payResult === 'pending') {
  // 可选：继续短轮询或提示稍后刷新
}
```

## 5. 打开收银台（前端）

```javascript
const settlementUrl = new URL('/pay/settlement', window.location.origin);
settlementUrl.searchParams.set('orderId', String(orderId));
settlementUrl.searchParams.set('returnUrl', window.location.href); // 当前业务页

const res = await fetch(
  `/api/bill/order/pay/cashier?orderId=${orderId}&returnUrl=${encodeURIComponent(settlementUrl.href)}`,
  { credentials: 'include' }
);
const { data } = await res.json();
window.location.href = data.cashierUrl;
```

## 6. 与参考 HTML 的差异说明

- 参考实现使用相对路径 `/api/bill/order/settlement-status`；SPA 请改用项目内封装的 `request` 基址。
- 样式请接入设计系统，逻辑按上文状态机实现即可。
