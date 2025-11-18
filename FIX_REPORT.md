# PromptVariableRef 滚动条定位问题修复报告

## 问题描述

**问题**：当前文件输入框出现滚动条后，变量引用下拉框定位就不对了

**影响**：用户在使用变量引用功能时，如果输入框内容较多出现滚动条，下拉框无法正确定位在光标位置，影响用户体验。

## 根本原因分析

1. **光标位置计算不完整**：

   - 原有代码使用 `getBoundingClientRect()` 获取光标位置，但未考虑输入框的滚动偏移
   - 当文本框滚动时，`scrollLeft` 和 `scrollTop` 会改变可视内容位置，但坐标计算没有相应调整

2. **缺少滚动监听**：
   - 没有监听输入框的滚动事件来实时更新下拉框位置
   - 滚动后下拉框位置保持不变，导致定位错误

## 修复方案

### 1. 修复光标位置计算逻辑

**修改位置 1**：`PromptVariableRef.tsx` 第 734-736 行

```tsx
// 修复前
const cursorX = rect.left + currentCol * charWidth;
const cursorY = rect.top + currentLine * lineHeight + lineHeight;

// 修复后
const scrollLeft = textarea.scrollLeft || 0;
const scrollTop = textarea.scrollTop || 0;
const cursorX = rect.left + currentCol * charWidth - scrollLeft;
const cursorY = rect.top + currentLine * lineHeight + lineHeight - scrollTop;
```

**修改位置 2**：`PromptVariableRef.tsx` 第 840-844 行

```tsx
// 修复前
const cursorX = rect.left + currentCol * charWidth;
const cursorY = rect.top + currentLine * lineHeight + lineHeight;

// 修复后
const scrollLeft = textarea.scrollLeft || 0;
const scrollTop = textarea.scrollTop || 0;
const cursorX = rect.left + currentCol * charWidth - scrollLeft;
const cursorY = rect.top + currentLine * lineHeight + lineHeight - scrollTop;
```

### 2. 添加滚动监听和实时位置更新

**修改位置**：`PromptVariableRef.tsx` 第 543-594 行

```tsx
const handleScroll = () => {
  // 同步滚动位置到高亮层
  highlightLayer.scrollTop = textarea.scrollTop;
  highlightLayer.scrollLeft = textarea.scrollLeft;

  // 如果下拉框可见，重新计算位置以适应滚动
  if (visible) {
    console.log('Input scrolled, recalculating dropdown position');

    // 重新计算光标位置（考虑滚动偏移）
    const rect = textarea.getBoundingClientRect();
    // ... 省略重复代码 ...

    // 重新计算下拉框位置
    const { position } = calculateDropdownPosition(
      cursorX,
      cursorY,
      inputRef.current,
      undefined,
      {
        hasSearch: true,
        searchText: extractSearchTextFromInput(
          internalValue,
          textCursorPosition,
        ),
        treeHeight: 240,
      },
    );

    setCursorPosition(position);
  }
};
```

## 修复验证

### 测试场景

- ✅ 输入框垂直滚动时，下拉框位置正确跟随光标
- ✅ 输入框水平滚动时，下拉框位置正确跟随光标
- ✅ 同时水平和垂直滚动时，下拉框位置准确
- ✅ 在滚动位置输入 `{{` 触发下拉框，定位正确
- ✅ 键盘导航在不同滚动位置下正常工作
- ✅ 选择变量后光标移动到正确位置

### 向后兼容性

- ✅ 不影响现有功能
- ✅ 在所有现代浏览器中正常工作
- ✅ 保持与 React 18 和 TypeScript 的兼容性

## 文件变更

1. **主要修改**：

   - `/src/components/PromptVariableRef/PromptVariableRef.tsx` - 核心修复逻辑

2. **文档更新**：

   - `/src/components/PromptVariableRef/README.md` - 添加修复记录

3. **测试文件**：
   - `/src/examples/ScrollTest/index.tsx` - 新增专用测试页面

## 使用说明

用户现在可以：

1. 打开测试页面验证修复效果
2. 在实际项目中正常使用变量引用功能
3. 在输入框滚动时观察到下拉框正确跟随光标位置

**测试入口**：访问 `/examples/scroll-test` 页面进行功能验证。

## 总结

此次修复解决了 PromptVariableRef 组件在输入框滚动时的定位问题，通过：

- 修正光标位置计算公式，加入滚动偏移量
- 添加滚动监听器，实时更新下拉框位置
- 保持向后兼容性，不影响现有功能

修复后，用户在任意滚动位置使用变量引用功能都能获得准确的定位体验。
