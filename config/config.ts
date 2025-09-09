// 取消以下注释并确保已安装依赖
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import path from 'path';
import { defineConfig } from 'umi';
import routes from '../src/routes';

export default defineConfig({
  // 优先从环境变量读取（需要创建 .env 文件）
  // publicPath: process.env.UMI_PUBLIC_PATH || '/',
  antd: {
    appConfig: {
      style: {
        height: '100%',
      },
    },
    configProvider: {
      direction: 'ltr',
      theme: {
        cssVar: {
          prefix: 'xagi',
        },
      },
    },
  },
  locale: {
    default: 'zh-CN',
    antd: true,
    baseSeparator: '-',
    baseNavigator: true,
  },
  layout: false,
  access: {},
  model: {},
  initialState: {},
  request: {},
  routes,
  npmClient: 'pnpm',
  // 添加阿里云验证码脚本和双向跳转脚本
  headScripts: [
    {
      src: 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js',
      type: 'text/javascript',
    },
    {
      content: `
        (function() {
          // 开发模式检测 - 如果是开发环境则不执行跳转
          if (typeof window !== 'undefined' && process?.env?.NODE_ENV === 'development') {
            console.log('开发模式检测到，跳过双向跳转逻辑');
            return;
          }
          
          const { protocol, host, href } = window.location;
          const baseUrl = protocol + '//' + host;
          
          // 移动端转PC
          if (href.includes('/m/')) {
            const match = href.match(/agent-detail\\?id=([^&]+)/);
            if (match) {
              const agentId = match[1];
              window.location.replace(baseUrl + '/agent/' + agentId);
              return;
            }
            window.location.replace(baseUrl + '/');
            return;
          }
          
          // PC端转移动端
          if (!href.includes('/m/')) {
            const match = href.match(/\\/agent\\/([^/?#]+)/);
            if (match) {
              const agentId = match[1];
              window.location.replace(baseUrl + '/m/#/pages/agent-detail/agent-detail?id=' + agentId);
              return;
            }
            window.location.replace(baseUrl + '/m/');
            return;
          }
        })();
      `,
      type: 'text/javascript',
    },
  ],
  // 添加在顶层配置中
  jsMinifier: 'esbuild',
  jsMinifierOptions: {
    minify: true,
    target: ['es2020'],
    format: 'iife',
  },
  chainWebpack(config: any) {
    config.plugin('copy-monaco').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve('monaco-editor/package.json')),
              'min/vs',
            ),
            to: 'vs', // 修改为直接复制到 vs 目录
            force: true,
          },
        ],
      },
    ]);

    config.plugin('monaco').use(MonacoWebpackPlugin, [
      {
        languages: ['javascript', 'typescript', 'json', 'python'],
        publicPath: '/', // 修改为根路径
        filename: 'vs/[name].worker.js',
        features: [
          'accessibilityHelp',
          'bracketMatching',
          'clipboard',
          'find',
          'folding',
          'hover',
          'links',
          'suggest',
          'wordHighlighter',
        ],
      },
    ]);
  },
});
