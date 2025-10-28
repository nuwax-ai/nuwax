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
          if(typeof window === 'undefined') {
            return;
          }
          // 开发模式检测 - 如果是开发环境则不执行跳转
          if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
            console.log('开发模式检测到，跳过双向跳转逻辑');
            return;
          }

          const { protocol, host, href, hash } = window.location;
          const isMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
          const baseUrl = protocol + '//' + host;

          // PC 端访问 M 页面 => 跳转 PC
          if (!isMobile && href.includes('/m/')) {
            if (hash && hash.indexOf("#/pages/agent-detail/agent-detail") !== -1) {
              const match = hash.match(/[?&]id=([^&#]+)/);
              if (match && match[1]) {
                const agentId = match[1];
                window.location.replace(baseUrl + '/agent/' + agentId);
                return;
              }
            }

            // 临时会话页面: PC 端访问 M 页面 => 跳转 PC
            if (hash && hash.indexOf("#/pages/chat-temp/chat-temp") !== -1) {
              const matchChatTemp = hash.match(/[?&]chatKey=([^&#]+)/);
              if (matchChatTemp && matchChatTemp[1]) {
                const chatKey = matchChatTemp[1];
                window.location.replace(baseUrl + '/chat-temp/' + chatKey);
                return;
              }
            }

            window.location.replace(baseUrl + '/');
            return;
          }

          // 移动端访问 PC 页面 => 跳转 M
          if (isMobile && !href.includes('/m/')) {
            const match = href.match(/\\/agent\\/([^/?#]+)/);
            if (match) {
              const agentId = match[1];
              window.location.replace(baseUrl + '/m/#/pages/agent-detail/agent-detail?id=' + agentId);
              return;
            }

            // 临时会话页面: 移动端访问 PC 页面 => 跳转 M
            const matchChatTemp = href.match(/\\/chat-temp\\/([^/?#]+)/);
            if (matchChatTemp) {
              const chatKey = matchChatTemp[1];
              window.location.replace(baseUrl + '/m/#/pages/chat-temp/chat-temp?chatKey=' + chatKey);
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
        languages: [
          'javascript',
          'typescript',
          'json',
          'python',
          'html',
          'css',
          'scss',
          'less',
        ],
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
