# F3 Java ERROR 终态与前端 close 合同补修

- 父代理提供实际 Java 安全载荷：`ERROR / completed:true / data:null / error:'Agent execution failed. Please retry or contact the administrator.'`。
- 直接回归确认先写 FAILED，随后 onClose 查到详情 COMPLETE 又覆盖成 COMPLETE。原因 ERROR 未更新 live 已解析终态标志。
- 最小修复：ERROR 与 FINAL 一样记为已解析终态，close 不再请求旧详情；domain ERROR 将安全文本追加到现有正文，保留已经输出的内容及既有 Error 展示协议。
- 按空正文/已有正文两种直接合同验证 FAILED、active/awaiting 释放、无后续 COMPLETE、错误文本和已有正文均保留。
- 单独提交，父代理独立源码复审与 combined 会话门；这是 Java→ 前端合同层验收，不代替部署后真实失败 E2E。
