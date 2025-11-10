# CopyToSpaceComponent 组件

## 功能描述

CopyToSpaceComponent 是一个通用的复制到空间组件，统一处理页面、智能体、工作流等不同类型的复制功能。该组件封装了不同复制类型的接口调用逻辑，提供统一的交互方式。

## 主要特性

- 支持多种组件类型（页面、智能体、工作流等）
- 统一接口调用方式，根据类型自动选择对应的接口
- 统一的交互方式，使用 MoveCopyComponent 组件
- 支持模板复制和非模板复制
- 支持自定义成功回调
- 自动处理工作流复制后的跳转

## 使用方法

```tsx
import { CopyToSpaceComponent } from '@/components/business-component';
import { AgentComponentTypeEnum } from '@/types/enums/agent';

const MyComponent = () => {
  const [open, setOpen] = useState(false);

  const handleConfirm = (targetSpaceId: number) => {
    console.log('复制到空间:', targetSpaceId);
    // 可以在这里处理自定义逻辑
  };

  const handleSuccess = (data: number, targetSpaceId: number) => {
    console.log('复制成功:', data, targetSpaceId);
  };

  return (
    <CopyToSpaceComponent
      spaceId={123}
      mode={AgentComponentTypeEnum.Page}
      componentId={456}
      title="我的页面"
      open={open}
      isTemplate={false}
      onCancel={() => setOpen(false)}
      onConfirm={handleConfirm}
      onSuccess={handleSuccess}
    />
  );
};
```

## Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| spaceId | number | 必填 | 当前空间 ID |
| mode | AgentComponentTypeEnum | 必填 | 组件类型（Page、Agent、Workflow 等） |
| componentId | number | 必填 | 组件 ID（根据类型不同，可能是 projectId、agentId、workflowId） |
| title | string | 必填 | 组件标题 |
| open | boolean | 必填 | 是否打开弹窗 |
| loading | boolean | false | 外部加载状态（可选，组件内部也会管理加载状态） |
| isTemplate | boolean | false | 是否为模板复制（智能体、工作流模板复制使用此标识） |
| onCancel | () => void | 必填 | 取消回调 |
| onConfirm | (targetSpaceId: number) => void | 可选 | 自定义确认回调（如果提供，将使用此回调而不是默认的接口调用） |
| onSuccess | (data: number, targetSpaceId: number) => void | 可选 | 复制成功回调 |

## 接口说明

### 页面复制

当 `mode` 为 `AgentComponentTypeEnum.Page` 时，组件会调用 `apiCustomPageCopyProject` 接口：

```typescript
{
  projectId: number;
  targetSpaceId: number;
}
```

### 模板复制

当 `mode` 为 `AgentComponentTypeEnum.Agent` 或 `AgentComponentTypeEnum.Workflow` 时，组件会调用 `apiPublishTemplateCopy` 接口：

```typescript
{
  targetType: AgentComponentTypeEnum;
  targetId: number;
  targetSpaceId: number;
}
```

### 工作流自动跳转

当复制工作流模板成功后，组件会自动跳转到目标空间的工作流详情页面。

## 注意事项

1. 如果提供了 `onConfirm` 回调，组件将不会自动调用接口，而是使用提供的回调函数
2. 模板复制时，建议设置 `isTemplate={true}` 以确保正确的空间过滤逻辑
3. 组件内部会自动管理加载状态，也可以从外部传入 `loading` 属性覆盖
4. 复制成功后，组件会自动关闭弹窗并显示成功消息
