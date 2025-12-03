# 生成优化后的 Tailwind Design Mode CSS 文件

## 使用步骤

### 1. 安装依赖（如果还没有安装）

```bash
cd /Users/apple/workspace/xagi-frontend-templates/packages/react-vite
pnpm install
```

### 2. 使用精简配置生成 CSS

将 `scripts/tailwind.config.optimized.js` 复制到模板项目，替换原有的 `tailwind.config.js`：

```bash
# 在 nuwax 项目根目录
cp scripts/tailwind.config.optimized.js /Users/apple/workspace/xagi-frontend-templates/packages/react-vite/tailwind.config.js
```

### 3. 生成 CSS 文件

在模板项目中运行 Tailwind CSS 构建命令：

```bash
cd /Users/apple/workspace/xagi-frontend-templates/packages/react-vite
npx tailwindcss -i ./src/input.css -o ./dist/tailwind_design_mode.all.css --minify
```

或者如果项目有自定义的构建脚本：

```bash
pnpm build:tailwind
```

### 4. 复制到 nuwax 项目

将生成的 CSS 文件复制到 nuwax 项目的 public 目录：

```bash
# 在 nuwax 项目根目录
cp /Users/apple/workspace/xagi-frontend-templates/packages/react-vite/dist/tailwind_design_mode.all.css public/sdk/tailwind_design_mode.all.css
```

### 5. 验证文件大小

```bash
# 查看文件大小
du -h public/sdk/tailwind_design_mode.all.css

# 查看行数
wc -l public/sdk/tailwind_design_mode.all.css
```

预期结果：

- 文件大小：从 456KB 减少到约 100-150KB
- 行数：从 22,720 行减少到约 5,000-8,000 行

### 6. 测试功能

在开发环境中测试设计模式功能，确保所有常用类都正常工作。

## 如果发现缺失的类

如果在使用过程中发现某些类不可用，可以：

1. **临时方案**：在 `tailwind.config.optimized.js` 中添加缺失的类到 safelist
2. **长期方案**：分析实际使用情况，逐步添加需要的类

例如，如果需要添加 `orange` 颜色：

```javascript
const essentialColors = [
  'gray',
  'primary',
  'blue',
  'red',
  'green',
  'yellow',
  'purple',
  'indigo',
  'orange', // 添加缺失的颜色
];
```

## 进一步优化建议

### 1. 按需加载

如果文件仍然太大，可以考虑按需加载：

- 将 CSS 拆分成多个文件（基础样式、颜色、布局等）
- 在 `dev-monitor.js` 中根据实际需要动态加载

### 2. 使用 CSS 变量

对于颜色，可以使用 CSS 变量 + JavaScript 动态设置，而不是预生成所有类。

### 3. 压缩优化

确保使用 `--minify` 选项生成压缩后的 CSS。

## 回滚方案

如果优化后的配置导致问题，可以：

1. 恢复原始的 `tailwind.config.js`
2. 重新生成 CSS 文件
3. 替换 `tailwind_design_mode.all.css`
