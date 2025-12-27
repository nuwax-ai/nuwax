# OnlyOffice 文档预览和编辑解决方案

基于 OnlyOffice Document Server 的内网文档预览和编辑解决方案，支持 Word、Excel、PowerPoint、PDF 等格式。

## 目录

- [架构说明](#架构说明)
- [快速开始](#快速开始)
- [部署配置](#部署配置)
- [核心代码说明](#核心代码说明)
- [常见问题](#常见问题)

---

## 架构说明

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   浏览器前端     │────▶│   后端服务器     │────▶│  OnlyOffice Document    │
│   (React)       │◀────│   (Express.js)  │◀────│  Server (Docker)        │
│   Port: 3002    │     │   Port: 3001    │     │  Port: 8080             │
└─────────────────┘     └─────────────────┘     └─────────────────────────┘
```

**数据流程：**

1. 用户上传文档到后端服务器
2. 前端请求后端获取 OnlyOffice 配置
3. OnlyOffice 从后端下载文档进行渲染
4. 用户编辑后，OnlyOffice 通过回调 API 保存文档

---

## 快速开始

### 1. 启动 OnlyOffice Document Server

```bash
# 使用 Docker 启动（推荐）
docker run -d -p 8080:80 --name onlyoffice-ds \
  -e JWT_ENABLED=false \
  -e ALLOW_PRIVATE_IP_ADDRESS=true \
  -e ALLOW_META_IP_ADDRESS=true \
  onlyoffice/documentserver

# 等待约 1-2 分钟初始化，检查健康状态
curl http://localhost:8080/healthcheck
# 返回 true 表示启动成功
```

### 2. 配置 IP 地址访问权限

> ⚠️ **重要**：OnlyOffice 默认阻止私有 IP 和 Meta IP 访问，需要手动配置

```bash
# 进入容器修改配置
docker exec onlyoffice-ds bash -c 'cat /etc/onlyoffice/documentserver/local.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
if \"services\" not in data: data[\"services\"] = {}
if \"CoAuthoring\" not in data[\"services\"]: data[\"services\"][\"CoAuthoring\"] = {}
data[\"services\"][\"CoAuthoring\"][\"request-filtering-agent\"] = {
    \"allowPrivateIPAddress\": True,
    \"allowMetaIPAddress\": True
}
print(json.dumps(data, indent=2))
" > /tmp/local.json && cat /tmp/local.json > /etc/onlyoffice/documentserver/local.json'

# 重启服务
docker exec onlyoffice-ds supervisorctl restart ds:docservice ds:converter
```

### 3. 启动后端服务

```bash
cd server
npm install
npm start
# 输出: OnlyOffice backend server running on http://localhost:3001
```

### 4. 启动前端

```bash
pnpm install
pnpm dev
# 访问: http://localhost:3002/examples/onlyoffice-demo
```

---

## 部署配置

### 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3001` | 后端服务端口 |
| `DOCKER_HOST` | `192.168.31.14` | 宿主机 IP（Docker 容器访问后端用） |
| `ONLYOFFICE_URL` | `http://localhost:8080` | OnlyOffice 服务地址 |

### 修改宿主机 IP

编辑 `server/index.js`，修改 `DOCKER_HOST` 为您的网络 IP：

```javascript
// 获取本机 IP
// Mac: ipconfig getifaddr en0
// Linux: hostname -I | awk '{print $1}'

const DOCKER_HOST = process.env.DOCKER_HOST || '你的IP地址';
```

### OnlyOffice Docker 配置

| 环境变量                        | 说明                      |
| ------------------------------- | ------------------------- |
| `JWT_ENABLED=false`             | 禁用 JWT 验证（开发环境） |
| `ALLOW_PRIVATE_IP_ADDRESS=true` | 允许私有 IP               |
| `ALLOW_META_IP_ADDRESS=true`    | 允许 Meta IP              |

---

## 核心代码说明

### 后端 API (`server/index.js`)

```javascript
// 文件上传
POST /api/upload

// 文件列表
GET /api/files

// 文件下载（OnlyOffice 访问）
GET /api/files/:filename

// 文件删除
DELETE /api/files/:id

// OnlyOffice 配置
GET /api/config/:id?edit=true|false

// 保存回调
POST /api/callback
```

### OnlyOffice 配置结构

```javascript
const config = {
  document: {
    fileType: 'pptx', // 文件扩展名
    key: 'unique-document-key', // 文档唯一标识
    title: '文档标题.pptx',
    url: 'http://HOST:3001/api/files/xxx.pptx', // 文档下载地址
    permissions: {
      edit: true, // 是否可编辑
      download: true,
      print: true,
    },
  },
  documentType: 'slide', // word | cell | slide
  editorConfig: {
    callbackUrl: 'http://HOST:3001/api/callback', // 保存回调地址
    lang: 'zh-CN',
    mode: 'edit', // edit | view
    user: { id: 'user-1', name: '用户名' },
  },
};
```

### 前端组件 (`OnlyOfficeEditor`)

```tsx
import OnlyOfficeEditor from '@/components/business-component/OnlyOfficeEditor';

<OnlyOfficeEditor
  configUrl="http://localhost:3001/api/config"
  documentId="document-id"
  editable={true}
  height="600px"
  onReady={() => console.log('Ready')}
  onError={(e) => console.error(e)}
/>;
```

---

## 常见问题

### 1. 文档令牌格式不正确

**原因**：JWT 验证未禁用

**解决**：启动容器时添加 `-e JWT_ENABLED=false`

### 2. DNS lookup is not allowed (private/meta IP)

**原因**：OnlyOffice 默认阻止私有/Meta IP 地址

**解决**：

1. 启动时添加环境变量
2. 进入容器修改 `local.json` 配置并重启服务

### 3. 文档下载失败

**原因**：Docker 容器无法访问 `localhost`

**解决**：将后端 URL 改为宿主机的实际网络 IP（如 `192.168.x.x`）

### 4. 编辑后无法保存

**原因**：回调 URL 不可访问

**解决**：确保 `callbackUrl` 使用宿主机 IP，容器可访问

---

## 文件结构

```
server/
├── index.js          # 后端服务入口
├── package.json      # 依赖配置
├── uploads/          # 文件存储目录
└── .gitignore

src/components/business-component/OnlyOfficeEditor/
├── index.tsx         # 编辑器组件
└── index.less        # 样式

src/examples/
└── onlyoffice-demo.tsx  # 演示页面
```

---

## 参考资源

- [OnlyOffice 官方文档](https://api.onlyoffice.com/editors/basic)
- [OnlyOffice Docker 部署](https://helpcenter.onlyoffice.com/installation/docs-community-install-ubuntu.aspx)
- [原始参考文章](https://juejin.cn/post/7374224361559261218)
