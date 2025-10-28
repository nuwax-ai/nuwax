# ButtonToggle 按钮切换组件

一个支持单选和多选的按钮切换组件，基于 Ant Design 的 Button 组件封装。

## 功能特性

- ✅ 支持单选模式
- ✅ 支持多选模式
- ✅ 可控和非可控模式
- ✅ 支持禁用状态
- ✅ 支持不同尺寸
- ✅ 完整的 TypeScript 支持
- ✅ 响应式设计

## 基本用法

### 单选模式

```tsx
import ButtonToggle from '@/components/ButtonToggle';

const options = [
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2' },
  { label: '选项3', value: '3' },
];

function SingleSelect() {
  const [value, setValue] = useState('1');

  return <ButtonToggle options={options} value={value} onChange={setValue} />;
}
```

### 多选模式

```tsx
import ButtonToggle from '@/components/ButtonToggle';

const options = [
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2' },
  { label: '选项3', value: '3' },
];

function MultipleSelect() {
  const [value, setValue] = useState(['1', '2']);

  return (
    <ButtonToggle
      options={options}
      value={value}
      multiple
      onChange={setValue}
    />
  );
}
```

### 非可控模式

```tsx
<ButtonToggle
  options={options}
  defaultValue="1"
  onChange={(value) => console.log('选中值:', value)}
/>
```

### 不同尺寸

```tsx
<ButtonToggle options={options} size="small" />
<ButtonToggle options={options} size="middle" />
<ButtonToggle options={options} size="large" />
```

### 禁用状态

```tsx
// 整体禁用
<ButtonToggle options={options} disabled />;

// 部分选项禁用
const optionsWithDisabled = [
  { label: '选项1', value: '1' },
  { label: '选项2', value: '2', disabled: true },
  { label: '选项3', value: '3' },
];

<ButtonToggle options={optionsWithDisabled} />;
```

## API

### ButtonToggleProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| options | 选项数据 | `ButtonToggleOption[]` | `[]` |
| value | 当前选中的值（可控模式） | `string \| number \| (string \| number)[]` | - |
| defaultValue | 默认选中的值（非可控模式） | `string \| number \| (string \| number)[]` | - |
| multiple | 是否多选模式 | `boolean` | `false` |
| size | 按钮大小 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| disabled | 是否禁用 | `boolean` | `false` |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `React.CSSProperties` | - |
| onChange | 值变化回调 | `(value: string \| number \| (string \| number)[]) => void` | - |

### ButtonToggleOption

| 参数     | 说明           | 类型               | 默认值  |
| -------- | -------------- | ------------------ | ------- |
| label    | 显示文本       | `string`           | -       |
| value    | 选项值         | `string \| number` | -       |
| disabled | 是否禁用该选项 | `boolean`          | `false` |

## 样式定制

组件使用 Less 变量，可以通过覆盖以下变量来定制样式：

```less
// 主要颜色
@colorPrimary: #1890ff;
@colorPrimaryHover: #40a9ff;
@colorPrimaryActive: #096dd9;

// 背景颜色
@colorBgContainer: #ffffff;
@colorBgTextHover: #f5f5f5;

// 边框颜色
@colorBorder: #d9d9d9;

// 文本颜色
@colorText: #000000d9;
@colorWhite: #ffffff;
```

## 注意事项

1. 在多选模式下，`value` 和 `defaultValue` 应该是数组类型
2. 在单选模式下，`value` 和 `defaultValue` 应该是字符串或数字类型
3. 组件支持可控和非可控两种模式，建议在表单中使用可控模式
4. 禁用状态下的选项不会触发 `onChange` 回调
