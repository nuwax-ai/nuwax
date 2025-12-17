# V3 Feature Verification

## P0 - 上线阻塞 (Must Pass)

### 🧪 单元测试

- [x] workflowProxyV3 单元测试 (24/24 passed ✅)

### 👆 节点增删改 + 保存 ✅

- [x] 从侧边栏添加节点 → 保存 → 刷新页面 → 节点存在
- [x] 删除节点 → 保存 → 刷新页面 → 节点消失
- [x] 修改节点配置 → 保存 → 刷新页面 → 配置保留

### 👆 连线增删 + 保存 ✅

- [x] 创建连线 → 保存 → 刷新页面 → 连线存在
- [x] 删除连线 → 保存 → 刷新页面 → 连线消失

### 📝 保存 Payload 格式 ✅

- [x] 检查 `/api/workflow/save` 请求 payload 包含 nodes 和 nextNodeIds

---

## 🎉 P0 测试全部通过!

## P1 - 核心体验 (Should Pass) ✅

- [x] 👆 LLM 技能列表 CRUD + 保存
- [x] 👆 Knowledge 知识库列表 CRUD + 保存
- [x] 👆 条件分支端口联动
- [x] 👆 撤销/重做 (已修复触发保存)
- [x] 👆 变量引用选择器

---

## P2 - 增强体验 (Deferred - 延期)

- [ ] 👆 快捷键完整性
- [ ] 👆 版本历史
- [ ] 🧪 边缘情况单元测试

---

## 已修复问题

- [x] Variable Aggregation 选择变量后下拉框不关闭
- [x] Variable Aggregation Form initialValue 冲突警告
- [x] V3 添加 MCP 节点 API payload 不完整
- [x] 删除节点时未触发保存
- [x] 撤销/重做未触发保存
- [x] 历史记录包含端口 hover 事件（过滤）
- [x] 节点复制支持多次粘贴 + 累积偏移
- [x] 复制节点 ID 生成规则统一
- [x] 复制节点渲染 shape 修复

---

## ✅ V3 已达到可上线状态 (P0/P1 全部通过)
