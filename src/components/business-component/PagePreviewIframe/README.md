# PagePreviewIframe 组件

## 功能描述

PagePreviewIframe 是一个专门用于页面预览的 iframe 组件，从 PagePreview 组件中抽离出来，负责处理页面内容的加载和显示，以及标题栏的展示。

## 主要特性

- 负责加载和显示页面内容
- 处理 iframe 加载事件
- 监听页面内容变化并上报
- 支持加载状态显示
- 支持 HTML 和 Markdown 格式的内容转换
- 显示标题栏和关闭按钮

## 使用方法

```tsx
import PagePreviewIframe from '@/components/business-component/PagePreviewIframe';

const MyComponent = () => {
  const pagePreviewData = {
    name: '页面预览',
    uri: '/example-page',
    params: { id: '123' },
    method: 'browser_navigate_page',
    data_type: 'html',
    request_id: 'req-123',
  };

  const handleClose = () => {
    console.log('关闭预览');
  };

  return (
    <PagePreviewIframe
      pagePreviewData={pagePreviewData}
      showLoading={true}
      showHeader={true}
      showCloseButton={true}
      onClose={handleClose}
    />
  );
};
```

## Props

| 属性名          | 类型                    | 默认值    | 描述             |
| --------------- | ----------------------- | --------- | ---------------- |
| pagePreviewData | PagePreviewData \| null | null      | 页面预览数据     |
| showLoading     | boolean                 | true      | 是否显示加载状态 |
| showHeader      | boolean                 | true      | 是否显示标题栏   |
| showCloseButton | boolean                 | true      | 是否显示关闭按钮 |
| onClose         | () => void              | undefined | 关闭按钮点击回调 |

## PagePreviewData 接口

| 属性名     | 类型                   | 描述     |
| ---------- | ---------------------- | -------- |
| name       | string                 | 页面名称 |
| uri        | string                 | 页面 URI |
| params     | Record<string, string> | 页面参数 |
| method     | string                 | 请求方法 |
| data_type  | 'html' \| 'markdown'   | 数据类型 |
| request_id | string                 | 请求 ID  |
