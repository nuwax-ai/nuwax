# File Preview HTML 使用文档

`public/static/file-preview.html` 是一个独立的文件预览页面，主要用于在 H5、微信小程序（WebView）、PC 浏览器等多端环境中预览 Office 文档、PDF、图片等文件。

## 场景

- **微信小程序内预览**：通过 `<web-view>` 组件加载此页面，利用 `file-preview.html` 的渲染能力（基于 js-preview 系列库）预览文件。
- **H5/Web 应用内预览**：在移动端或 PC 端 Web 应用中，通过 iframe 或新窗口打开此页面进行预览。
- **文件分享**：将此页面的 URL 分享给用户，用户在微信或其他浏览器中打开即可预览。
  - 场景描述：用户 A 在应用内点击分享，生成包含 `fileUrl` 等参数的预览链接。用户 B 点击链接后，直接在浏览器或微信中打开预览页。
  - 注意事项：分享链接应确保 `fileUrl` 是公共可访问的，或者用户 B 具备访问权限（如通过 URL 携带临时的鉴权 Token）。

## URL 参数


页面支持通过 URL 查询参数（Query Params）配置预览的文件和行为：

| 参数名 | 必填 | 描述 | 示例 |
| :--- | :--- | :--- | :--- |
| `fileUrl` | **是** (非分享模式) | 文件的完整下载链接 (需 encodeURIComponent 编码) | `https%3A%2F%2Fexample.com%2Ffile.pdf` |
| `sk` | **是** (分享模式) | 分享密钥 (Share Key)，用于换取文件信息。如果存在 `sk`，则优先使用分享模式 | `abc123xyz` |
| `fileType` | 否 | 文件类型后缀 (不区分大小写)。如果不传，将尝试从 `fileUrl` 或分享信息中解析 | `pdf`, `docx`, `xlsx`, `pptx` |
| `fileName` | 否 | 文件名 | `report.pdf` |
| `title` | 否 | 页面标题 | `预览文件` |
| `isDev` | 否 | 是否使用测试环境接口 (true/false) | `true` |

> **注意**: 
> 1. `fileUrl`, `fileName` 等包含特殊字符的参数值建议使用 `encodeURIComponent` 进行编码。
> 2. 如果提供了 `sk` 参数，页面会自动调用分享详情接口获取文件地址，此时可以不传 `fileUrl`。

## 支持文件类型

- **Office**: `docx`, `xlsx`, `pptx`
- **PDF**: `pdf`
- **图片**: `jpg`, `png`, `jpeg`, `gif`, `svg` (直接渲染)
- **其他**: 暂不支持 (会显示"不支持此文件类型")

## 消息通信 (PostMessage)

此页面会通过 `postMessage` 与父窗口（iframe）或宿主环境（微信小程序 WebView）通信。

### 发送给宿主的消息

**1. 预览成功**
```javascript
{
  type: "preview_success",
  fileType: "pdf" // 实际渲染的文件类型
}
```

**2. 预览失败**
```javascript
{
  type: "preview_error",
  error: "Error message"
}
```

**3. 请求下载 (仅微信小程序 WebView)**
```javascript
{
  type: "download_file",
  url: "https://example.com/file.pdf",
  fileName: "file.pdf",
  fileType: "pdf"
}
```

## 示例

### 1. 微信小程序 WebView 使用

```html
<web-view 
  src="https://your-domain.com/static/file-preview.html?fileUrl=...&fileType=pdf"
  @message="handleMessage"
></web-view>
```

### 2. URL 拼接

```javascript
const baseUrl = "https://your-domain.com/static/file-preview.html";
const fileUrl = encodeURIComponent("https://example.com/doc.docx");
const previewUrl = `${baseUrl}?fileUrl=${fileUrl}&fileType=docx&fileName=document.docx`;
window.open(previewUrl);
```

### 3. 文件分享链接生成 (示例)

分享链接通常由服务端或前端生成，核心是携带 `sk` (Share Key) 参数：

```javascript
/**
 * 生成文件预览分享链接
 * @param {string} shareKey - 从后端获取的分享 Key
 * @param {string} baseUrl - 预览页基础地址 (如 https://your-domain.com/static/file-preview.html)
 */
function generateShareLink(shareKey, baseUrl) {
    return `${baseUrl}?sk=${shareKey}`;
}

// Usage
const shareKey = '7d8f9a2b...'; // 通过 API 获取
const link = generateShareLink(
    shareKey,
    'https://your-domain.com/static/file-preview.html'
);
console.log('分享链接:', link);
```

## 依赖库

页面依赖位于 `/public/libs/js-preview/` 下的本地库：
- `@js-preview/docx`
- `@js-preview/excel`
- `@js-preview/pdf`
- `@js-preview/pptx` (自定义或 patch 版)
