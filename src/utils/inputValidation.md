# 输入验证工具函数使用文档

## 概述

`inputValidation.ts` 提供了一系列输入验证工具函数，用于限制和规范用户在输入框中的输入行为。

## 功能特性

- ✅ 阻止键盘直接输入非法字符
- ✅ 阻止通过输入法输入中文、符号
- ✅ 支持粘贴时自动过滤非法字符
- ✅ 支持小数、负数等灵活配置
- ✅ 完全兼容 Ant Design Input、ProTable 等组件

## API 说明

### 1. getNumberOnlyFieldProps (通用数字输入)

最灵活的数字输入配置函数，支持多种参数自定义。

**参数：**

```typescript
interface NumberOnlyFieldPropsOptions {
  placeholder?: string; // 占位符文本
  allowNegative?: boolean; // 是否允许负数，默认 false
  allowDecimal?: boolean; // 是否允许小数，默认 false
  maxLength?: number; // 最大长度限制
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // 自定义 onChange
}
```

**使用示例：**

```tsx
import { getNumberOnlyFieldProps } from '@/utils/inputValidation';

// 示例 1: 只允许整数
<Input {...getNumberOnlyFieldProps({ placeholder: '请输入年龄' })} />

// 示例 2: 允许小数（如金额）
<Input {...getNumberOnlyFieldProps({
  placeholder: '请输入金额',
  allowDecimal: true
})} />

// 示例 3: 允许负数
<Input {...getNumberOnlyFieldProps({
  placeholder: '请输入温度',
  allowNegative: true,
  allowDecimal: true
})} />

// 示例 4: 限制最大长度
<Input {...getNumberOnlyFieldProps({
  placeholder: '请输入手机号',
  maxLength: 11
})} />

// 示例 5: 自定义 onChange
<Input {...getNumberOnlyFieldProps({
  placeholder: '请输入数量',
  onChange: (e) => {
    console.log('输入值:', e.target.value);
  }
})} />
```

### 2. getIntegerOnlyFieldProps (仅整数)

`getNumberOnlyFieldProps` 的简化版本，只允许输入正整数。

**参数：**

```typescript
getIntegerOnlyFieldProps(placeholder?: string, maxLength?: number)
```

**使用示例：**

```tsx
import { getIntegerOnlyFieldProps } from '@/utils/inputValidation';

// 基础用法
<Input {...getIntegerOnlyFieldProps('请输入用户ID')} />

// 限制长度
<Input {...getIntegerOnlyFieldProps('请输入数量', 10)} />
```

### 3. getPositiveNumberFieldProps (正数+小数)

只允许输入正数，支持小数点。

**参数：**

```typescript
getPositiveNumberFieldProps(placeholder?: string, maxLength?: number)
```

**使用示例：**

```tsx
import { getPositiveNumberFieldProps } from '@/utils/inputValidation';

// 金额输入
<Input {...getPositiveNumberFieldProps('请输入金额')} />

// 百分比输入
<Input {...getPositiveNumberFieldProps('请输入比例', 5)} />
```

## 在 ProTable 中使用

### 示例 1: 用户 ID（整数）

```tsx
import { getIntegerOnlyFieldProps } from '@/utils/inputValidation';

const columns: ProColumns<DataType>[] = [
  {
    title: '用户ID',
    dataIndex: 'userId',
    fieldProps: getIntegerOnlyFieldProps('请输入用户ID'),
  },
];
```

### 示例 2: 金额（小数）

```tsx
import { getPositiveNumberFieldProps } from '@/utils/inputValidation';

const columns: ProColumns<DataType>[] = [
  {
    title: '金额',
    dataIndex: 'amount',
    fieldProps: getPositiveNumberFieldProps('请输入金额'),
  },
];
```

### 示例 3: 温度（负数+小数）

```tsx
import { getNumberOnlyFieldProps } from '@/utils/inputValidation';

const columns: ProColumns<DataType>[] = [
  {
    title: '温度',
    dataIndex: 'temperature',
    fieldProps: getNumberOnlyFieldProps({
      placeholder: '请输入温度',
      allowNegative: true,
      allowDecimal: true,
    }),
  },
];
```

## 在 Form 表单中使用

### 示例 1: Ant Design Form

```tsx
import { Form, Input } from 'antd';
import { getIntegerOnlyFieldProps } from '@/utils/inputValidation';

<Form>
  <Form.Item label="用户ID" name="userId">
    <Input {...getIntegerOnlyFieldProps('请输入用户ID')} />
  </Form.Item>

  <Form.Item label="金额" name="amount">
    <Input {...getPositiveNumberFieldProps('请输入金额')} />
  </Form.Item>
</Form>;
```

### 示例 2: ProForm

```tsx
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { getIntegerOnlyFieldProps } from '@/utils/inputValidation';

<ProForm>
  <ProFormText
    label="用户ID"
    name="userId"
    fieldProps={getIntegerOnlyFieldProps('请输入用户ID')}
  />
</ProForm>;
```

## 常见场景

### 1. 身份证号码（18 位数字）

```tsx
<Input {...getIntegerOnlyFieldProps('请输入身份证号', 18)} />
```

### 2. 手机号码（11 位数字）

```tsx
<Input {...getIntegerOnlyFieldProps('请输入手机号', 11)} />
```

### 3. 验证码（6 位数字）

```tsx
<Input {...getIntegerOnlyFieldProps('请输入验证码', 6)} />
```

### 4. 价格（支持小数）

```tsx
<Input {...getPositiveNumberFieldProps('请输入价格')} />
```

### 5. 库存数量（整数）

```tsx
<Input {...getIntegerOnlyFieldProps('请输入库存数量')} />
```

### 6. 折扣率（0-100 的小数）

```tsx
<Input {...getPositiveNumberFieldProps('请输入折扣率')} suffix="%" />
```

## 注意事项

1. **输入法兼容性**: 工具函数已处理输入法输入，可以阻止通过拼音输入中文
2. **粘贴处理**: 粘贴时会自动过滤非法字符，只保留数字
3. **负号位置**: 负号只能出现在第一个位置
4. **小数点限制**: 小数点只能出现一次
5. **特殊按键**: 退格、删除、方向键等功能按键不受影响

## 扩展

如果需要其他类型的输入限制（如字母、邮箱等），可以参考 `getNumberOnlyFieldProps` 的实现方式，创建类似的工具函数。

例如：

```typescript
// 只允许字母
export const getLetterOnlyFieldProps = (placeholder?: string) => {
  // 实现类似逻辑...
};

// 只允许字母和数字
export const getAlphanumericFieldProps = (placeholder?: string) => {
  // 实现类似逻辑...
};
```
