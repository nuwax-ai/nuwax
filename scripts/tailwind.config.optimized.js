/** @type {import('tailwindcss').Config} */

/**
 * 精简版 Tailwind CSS 配置
 * 用于生成 tailwind_design_mode.all.css 文件
 *
 * 优化策略：
 * 1. 只保留最常用的颜色和颜色前缀
 * 2. 精简 spacing 值，只保留常用值
 * 3. 保持其他工具类配置不变
 *
 * 预期可以减少约 70-80% 的文件大小
 */

// 只保留最常用的颜色（根据实际使用情况调整）
const essentialColors = [
  'gray', // 最常用
  'primary', // 主题色
  'blue', // 常用
  'red', // 错误/警告
  'green', // 成功
  'yellow', // 警告
  'purple', // 常用
  'indigo', // 常用
];

// 只保留最常用的颜色前缀
const essentialColorPrefixes = [
  'text', // 文字颜色
  'bg', // 背景颜色
  'border', // 边框颜色
];

// 去掉 950 色阶（很少使用），保留常用的 10 个色阶
const essentialColorShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// 生成精简的颜色 safelist
function generateOptimizedColorSafelist() {
  const safelist = [];

  essentialColorPrefixes.forEach((prefix) => {
    essentialColors.forEach((color) => {
      // 添加带深度的颜色类（如 text-blue-500）
      essentialColorShades.forEach((shade) => {
        safelist.push(`${prefix}-${color}-${shade}`);
      });
      // 添加不带深度的颜色类（如 text-blue）
      safelist.push(`${prefix}-${color}`);
    });
  });

  // 添加特殊颜色类（如 text-white, text-black, bg-transparent 等）
  const specialColors = ['white', 'black', 'transparent', 'current'];
  essentialColorPrefixes.forEach((prefix) => {
    specialColors.forEach((color) => {
      safelist.push(`${prefix}-${color}`);
    });
  });

  return safelist;
}

// 只保留常用的 spacing 值
const essentialSpacingValues = [
  0,
  0.5,
  1,
  1.5,
  2,
  2.5,
  3,
  4,
  5,
  6,
  8,
  10,
  12,
  16,
  20,
  24,
  32,
  40,
  48,
  64,
  // 特殊值
  'px',
  'auto',
  'full',
];

// Padding 和 Margin 相关的工具类前缀
const spacingPrefixes = {
  padding: ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'],
  margin: ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'],
};

// 生成精简的 spacing safelist
function generateOptimizedSpacingSafelist() {
  const safelist = [];
  const allPrefixes = [...spacingPrefixes.padding, ...spacingPrefixes.margin];

  allPrefixes.forEach((prefix) => {
    essentialSpacingValues.forEach((value) => {
      if (typeof value === 'number') {
        safelist.push(`${prefix}-${value}`);
      } else {
        safelist.push(`${prefix}-${value}`);
      }
    });
  });

  return safelist;
}

// Tailwind 默认 border width 值
const borderWidthValues = [0, 1, 2, 4, 8];

// Border width 相关的工具类前缀
const borderWidthPrefixes = [
  'border',
  'border-t',
  'border-r',
  'border-b',
  'border-l',
  'border-x',
  'border-y',
];

// 生成所有 border width 相关的 safelist 模式
function generateBorderWidthSafelist() {
  const safelist = [];

  borderWidthPrefixes.forEach((prefix) => {
    borderWidthValues.forEach((value) => {
      safelist.push(`${prefix}-${value}`);
    });
  });

  safelist.push('border');

  return safelist;
}

// Tailwind 默认 border style 值
const borderStyleValues = [
  'solid',
  'dashed',
  'dotted',
  'double',
  'hidden',
  'none',
];

// 生成所有 border style 相关的 safelist 模式
function generateBorderStyleSafelist() {
  const safelist = [];

  borderStyleValues.forEach((style) => {
    safelist.push(`border-${style}`);
  });

  return safelist;
}

// Tailwind 默认 fontWeight 值
const fontWeightValues = [
  'thin', // 100
  'extralight', // 200
  'light', // 300
  'normal', // 400
  'medium', // 500
  'semibold', // 600
  'bold', // 700
  'extrabold', // 800
  'black', // 900
];

// 生成所有 fontWeight 相关的 safelist 模式
function generateFontWeightSafelist() {
  const safelist = [];

  fontWeightValues.forEach((weight) => {
    safelist.push(`font-${weight}`);
  });

  return safelist;
}

// Tailwind 默认 fontSize 键名
const fontSizeValues = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
];

// 生成所有 fontSize 相关的 safelist 模式
function generateFontSizeSafelist() {
  const safelist = [];

  fontSizeValues.forEach((size) => {
    safelist.push(`text-${size}`);
  });

  return safelist;
}

// Tailwind 默认 lineHeight 键名
const lineHeightValues = [
  'none',
  'tight',
  'snug',
  'normal',
  'relaxed',
  'loose',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
];

// 生成所有 lineHeight 相关的 safelist 模式
function generateLineHeightSafelist() {
  const safelist = [];

  lineHeightValues.forEach((value) => {
    safelist.push(`leading-${value}`);
  });

  return safelist;
}

// Tailwind 默认 letter spacing 值
const letterSpacingValues = [
  'tighter',
  'tight',
  'normal',
  'wide',
  'wider',
  'widest',
];

// 生成所有 letter spacing 相关的 safelist 模式
function generateLetterSpacingSafelist() {
  const safelist = [];

  letterSpacingValues.forEach((value) => {
    safelist.push(`tracking-${value}`);
  });

  return safelist;
}

// Tailwind 默认 text align 值
const textAlignValues = ['left', 'center', 'right', 'justify', 'start', 'end'];

// 生成所有 text align 相关的 safelist 模式
function generateTextAlignSafelist() {
  const safelist = [];

  textAlignValues.forEach((value) => {
    safelist.push(`text-${value}`);
  });

  return safelist;
}

// Tailwind 默认 opacity 值
const opacityValues = [
  0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100,
];

// 生成所有 opacity 相关的 safelist 模式
function generateOpacitySafelist() {
  const safelist = [];

  opacityValues.forEach((value) => {
    safelist.push(`opacity-${value}`);
  });

  return safelist;
}

// Tailwind 默认 border radius 值
const borderRadiusValues = [
  'none',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'full',
];

// Border radius 相关的工具类前缀
const borderRadiusPrefixes = [
  'rounded',
  'rounded-t',
  'rounded-r',
  'rounded-b',
  'rounded-l',
  'rounded-tl',
  'rounded-tr',
  'rounded-bl',
  'rounded-br',
];

// 生成所有 border radius 相关的 safelist 模式
function generateBorderRadiusSafelist() {
  const safelist = [];

  borderRadiusPrefixes.forEach((prefix) => {
    borderRadiusValues.forEach((value) => {
      safelist.push(`${prefix}-${value}`);
    });
  });

  return safelist;
}

// Tailwind 默认 shadow 值
const shadowValues = ['sm', 'md', 'lg', 'xl', '2xl', 'inner', 'none'];

// 生成所有 shadow 相关的 safelist 模式
function generateShadowSafelist() {
  const safelist = [];

  shadowValues.forEach((value) => {
    safelist.push(`shadow-${value}`);
  });

  return safelist;
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // 使用精简的 safelist，大幅减少生成的 CSS 文件大小
  safelist: [
    ...generateOptimizedColorSafelist(),
    ...generateOptimizedSpacingSafelist(),
    ...generateBorderWidthSafelist(),
    ...generateBorderStyleSafelist(),
    ...generateFontWeightSafelist(),
    ...generateFontSizeSafelist(),
    ...generateLineHeightSafelist(),
    ...generateLetterSpacingSafelist(),
    ...generateTextAlignSafelist(),
    ...generateOpacitySafelist(),
    ...generateBorderRadiusSafelist(),
    ...generateShadowSafelist(),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
      };
      addUtilities(newUtilities);
    },
  ],
  darkMode: 'class',
};
