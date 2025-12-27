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
  // 排除不兼容模块联邦的包
  mfsu: {
    exclude: ['html2pdf.js', 'jspdf', 'html2canvas'],
  },
  // 添加阿里云验证码脚本和双向跳转脚本
  headScripts: [
    {
      src: 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js',
      type: 'text/javascript',
    },
    {
      content: `
        (function () {
				if (typeof window === 'undefined') {
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
				const agentDetailPathMobile = '/pages/agent-detail/agent-detail'; //分包前的页面路径
				const chatTempPathMobile = '/pages/chat-temp/chat-temp'; //分包前的页面路径
				const newAgentDetailPathMobile = '/subpackages' + agentDetailPathMobile; //分包后的页面路径
				const newChatTempPathMobile = '/subpackages' + chatTempPathMobile; //分包后的页面路径
				//兼容分包前的页面 先转为分包后的页面 然后跳转
				if (isMobile && href.includes('/m/#/pages/')) {
					let mHash = hash;
					if (hash.indexOf(agentDetailPathMobile) !== -1) {
						mHash = mHash.replace(agentDetailPathMobile, newAgentDetailPathMobile);
						window.location.replace(baseUrl + '/m/' + mHash);
						return;
					}
					if(hash.indexOf(chatTempPathMobile) !== -1) {
						mHash = mHash.replace(chatTempPathMobile, newChatTempPathMobile);
						window.location.replace(baseUrl + '/m/' + mHash);
						return;
					}
				}

				// PC 端访问 M 页面 => 跳转 PC
				if (!isMobile && href.includes('/m/')) {
					if (hash && hash.indexOf(agentDetailPathMobile) !== -1) {
						const match = hash.match(new RegExp('[?&]id=([^&#]+)'));
						if (match && match[1]) {
							const agentId = match[1];
							window.location.replace(baseUrl + '/agent/' + agentId);
							return;
						}
					}

					// 临时会话页面: PC 端访问 M 页面 => 跳转 PC
					if (hash && hash.indexOf(chatTempPathMobile) !== -1) {
						const matchChatTemp = hash.match(new RegExp('[?&]chatKey=([^&#]+)'));
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
					const match = href.match(new RegExp('/agent/([^/?#]+)'));
					if (match) {
						const agentId = match[1];
						window.location.replace(baseUrl + '/m/#' + newAgentDetailPathMobile + '?id=' + agentId);
						return;
					}

					// 临时会话页面: 移动端访问 PC 页面 => 跳转 M
					const matchChatTemp = href.match(new RegExp('/chat-temp/([^/?#]+)'));
					if (matchChatTemp) {
						const chatKey = matchChatTemp[1];
						window.location.replace(baseUrl + '/m/#' + newChatTempPathMobile + '?chatKey=' + chatKey);
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

    // 复制并压缩 dev-monitor.js
    config.plugin('copy-dev-monitor').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.resolve(__dirname, '../public/sdk/dev-monitor.js'),
            to: 'sdk/dev-monitor.js',
            force: true,
            // 使用 transform 在复制时进行压缩
            transform: async (content: Buffer) => {
              const code = content.toString('utf-8');
              // 动态导入 esbuild 进行压缩
              const { transform } = await import('esbuild');
              const result = await transform(code, {
                minify: true,
                target: 'es2020',
                format: 'iife',
                // 保持代码为单行，移除注释和空白
                legalComments: 'none',
              });
              return Buffer.from(result.code, 'utf-8');
            },
          },
        ],
      },
    ]);

    // 复制并压缩 tailwind_design_mode.all.css
    config.plugin('copy-tailwind-css').use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.resolve(
              __dirname,
              '../public/sdk/tailwind_design_mode.all.css',
            ),
            to: 'sdk/tailwind_design_mode.all.css',
            force: true,
            // 使用 transform 在复制时进行压缩
            transform: async (content: Buffer) => {
              const css = content.toString('utf-8');
              // 动态导入 clean-css 进行压缩
              const CleanCSS = (await import('clean-css')).default;
              const minifier = new CleanCSS({
                level: 2, // 启用所有优化级别
                format: false, // 不格式化输出
                returnPromise: false,
              });
              const result = minifier.minify(css);
              if (result.errors && result.errors.length > 0) {
                console.warn(
                  'CSS minification warnings:',
                  result.errors.join('\n'),
                );
              }
              // 确保返回压缩后的 CSS
              const minifiedCss = result.styles || css;
              return Buffer.from(minifiedCss, 'utf-8');
            },
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
