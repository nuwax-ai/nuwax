/**
 * AppDev API服务模块
 * 处理与后端API的通信
 */

// API基础配置 - 使用后端提供的临时地址
const API_BASE_URL = 'http://192.168.31.125:8081';

// Mock模式配置 - 开发环境默认启用Mock模式
const MOCK_MODE =
  process.env.NODE_ENV === 'development' &&
  (localStorage.getItem('appdev-mock-mode') !== 'false' || // 默认启用，除非明确禁用
    new URLSearchParams(window.location.search).get('mock') === 'true' ||
    new URLSearchParams(window.location.search).get('mock') !== 'false'); // 默认启用，除非明确禁用

console.log('🔧 [AppDev API] Mock mode:', MOCK_MODE);

/**
 * Mock数据
 */
const MOCK_DATA = {
  projects: new Map<string, any>(),
  devServers: new Map<string, any>(),
  nextProjectId: 1,
};

// 初始化mock数据
const initMockData = () => {
  // 添加一个示例项目
  const exampleProjectId = 'mock-project-1';
  MOCK_DATA.projects.set(exampleProjectId, {
    id: exampleProjectId,
    name: 'Mock Project',
    description: '这是一个mock项目，用于开发调试',
    status: 'stopped',
    createdAt: new Date().toISOString(),
  });

  MOCK_DATA.devServers.set(exampleProjectId, {
    projectId: exampleProjectId,
    status: 'stopped',
    url: null,
    port: null,
  });
};

// 初始化mock数据
initMockData();

/**
 * 初始化Mock模式设置
 * 在开发环境下，如果localStorage中没有设置，则默认启用Mock模式
 */
const initMockMode = () => {
  if (process.env.NODE_ENV === 'development') {
    const mockModeSetting = localStorage.getItem('appdev-mock-mode');
    if (mockModeSetting === null) {
      // 如果localStorage中没有设置，默认启用Mock模式
      localStorage.setItem('appdev-mock-mode', 'true');
      console.log(
        '🎭 [AppDev API] Mock mode enabled by default in development',
      );
    }
  }
};

// 初始化Mock模式设置
initMockMode();

/**
 * Mock工具函数
 */
const mockDelay = (ms: number = 500) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const mockSuccessResponse = (data: any, message: string = '成功') => ({
  code: '0000',
  displayCode: '0000',
  message,
  data,
  tid: Date.now().toString(),
});

const mockErrorResponse = (message: string = '操作失败') => ({
  code: '9999',
  displayCode: '9999',
  message,
  data: null,
  tid: Date.now().toString(),
});

/**
 * 自定义request函数，绕过UmiJS的request拦截器
 * 直接使用fetch进行API调用
 */
const customRequest = async (url: string, options: any = {}) => {
  // 如果是mock模式，返回mock数据
  if (MOCK_MODE) {
    console.log('🎭 [AppDev API] Using mock mode for:', url);
    await mockDelay(300); // 模拟网络延迟

    // 根据URL路径返回不同的mock数据
    if (url.includes('/start-dev')) {
      const projectId = options.data?.projectId;
      if (!projectId) {
        return mockErrorResponse('项目ID不能为空');
      }

      const devServer = MOCK_DATA.devServers.get(projectId);
      if (!devServer) {
        return mockErrorResponse('项目不存在');
      }

      // 模拟启动开发服务器
      const port = 3000 + Math.floor(Math.random() * 1000);
      const devServerUrl = `http://localhost:${port}`;

      MOCK_DATA.devServers.set(projectId, {
        ...devServer,
        status: 'running',
        url: devServerUrl,
        port: port,
      });

      return mockSuccessResponse(
        {
          projectId,
          devServerUrl,
          port,
          status: 'running',
        },
        '开发环境启动成功',
      );
    }

    if (url.includes('/stop-dev')) {
      const projectId = options.data?.projectId;
      if (!projectId) {
        return mockErrorResponse('项目ID不能为空');
      }

      const devServer = MOCK_DATA.devServers.get(projectId);
      if (!devServer) {
        return mockErrorResponse('项目不存在');
      }

      // 模拟停止开发服务器
      MOCK_DATA.devServers.set(projectId, {
        ...devServer,
        status: 'stopped',
        url: null,
        port: null,
      });

      return mockSuccessResponse(
        {
          projectId,
          status: 'stopped',
        },
        '开发环境已停止',
      );
    }

    if (url.includes('/restart-dev')) {
      const projectId = options.data?.projectId;
      if (!projectId) {
        return mockErrorResponse('项目ID不能为空');
      }

      const devServer = MOCK_DATA.devServers.get(projectId);
      if (!devServer) {
        return mockErrorResponse('项目不存在');
      }

      // 模拟重启开发服务器
      const port = 3000 + Math.floor(Math.random() * 1000);
      const devServerUrl = `http://localhost:${port}`;

      MOCK_DATA.devServers.set(projectId, {
        ...devServer,
        status: 'running',
        url: devServerUrl,
        port: port,
      });

      return mockSuccessResponse(
        {
          projectId,
          devServerUrl,
          port,
          status: 'running',
        },
        '开发服务器重启成功',
      );
    }

    if (url.includes('/build')) {
      const projectId = options.data?.projectId;
      if (!projectId) {
        return mockErrorResponse('项目ID不能为空');
      }

      // 模拟构建项目
      return mockSuccessResponse(
        {
          projectId,
          buildId: `build-${Date.now()}`,
          status: 'completed',
          buildTime: Math.floor(Math.random() * 30) + 10, // 10-40秒
        },
        '项目构建成功',
      );
    }

    if (url.includes('/dev-status')) {
      const projectId = new URLSearchParams(url.split('?')[1]).get('projectId');
      if (!projectId) {
        return mockErrorResponse('项目ID不能为空');
      }

      const devServer = MOCK_DATA.devServers.get(projectId);
      if (!devServer) {
        return mockErrorResponse('项目不存在');
      }

      return mockSuccessResponse(
        {
          projectId,
          status: devServer.status,
          devServerUrl: devServer.url,
          port: devServer.port,
        },
        '获取开发环境状态成功',
      );
    }

    if (url.includes('/upload-and-start')) {
      // 模拟上传并启动项目
      const projectId = `mock-project-${MOCK_DATA.nextProjectId++}`;
      const port = 3000 + Math.floor(Math.random() * 1000);
      const devServerUrl = `http://localhost:${port}`;

      MOCK_DATA.projects.set(projectId, {
        id: projectId,
        name: 'Uploaded Project',
        description: '通过上传创建的项目',
        status: 'running',
        createdAt: new Date().toISOString(),
      });

      MOCK_DATA.devServers.set(projectId, {
        projectId,
        status: 'running',
        url: devServerUrl,
        port: port,
      });

      return mockSuccessResponse(
        {
          projectId,
          devServerUrl,
          port,
          status: 'running',
        },
        '项目上传并启动成功',
      );
    }

    // 默认返回成功响应
    return mockSuccessResponse({}, 'Mock操作成功');
  }

  // 真实API调用
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    body: options.data ? JSON.stringify(options.data) : options.body,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Mock模式管理工具
 */
export const mockUtils = {
  /**
   * 启用mock模式
   */
  enableMock: () => {
    localStorage.setItem('appdev-mock-mode', 'true');
    console.log('🎭 [AppDev API] Mock mode enabled');
    window.location.reload(); // 重新加载页面以应用mock模式
  },

  /**
   * 禁用mock模式
   */
  disableMock: () => {
    localStorage.setItem('appdev-mock-mode', 'false');
    console.log('🎭 [AppDev API] Mock mode disabled');
    window.location.reload(); // 重新加载页面以禁用mock模式
  },

  /**
   * 检查是否启用mock模式
   */
  isMockEnabled: () => MOCK_MODE,

  /**
   * 获取mock数据
   */
  getMockData: () => ({
    projects: Array.from(MOCK_DATA.projects.values()),
    devServers: Array.from(MOCK_DATA.devServers.values()),
  }),

  /**
   * 重置mock数据
   */
  resetMockData: () => {
    MOCK_DATA.projects.clear();
    MOCK_DATA.devServers.clear();
    MOCK_DATA.nextProjectId = 1;
    initMockData();
    console.log('🎭 [AppDev API] Mock data reset');
  },

  /**
   * 添加mock项目
   */
  addMockProject: (projectId: string, projectData: any) => {
    MOCK_DATA.projects.set(projectId, {
      id: projectId,
      name: projectData.name || 'Mock Project',
      description: projectData.description || 'Mock项目',
      status: 'stopped',
      createdAt: new Date().toISOString(),
      ...projectData,
    });

    MOCK_DATA.devServers.set(projectId, {
      projectId,
      status: 'stopped',
      url: null,
      port: null,
    });

    console.log('🎭 [AppDev API] Mock project added:', projectId);
  },

  /**
   * 重置到默认Mock状态
   */
  resetToDefault: () => {
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('appdev-mock-mode', 'true');
      console.log('🎭 [AppDev API] Reset to default Mock mode');
      window.location.reload();
    }
  },
};

/**
 * 启动开发环境接口
 * @param projectId 项目ID
 * @returns Promise<any> 接口响应
 */
export const startDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🚀 [AppDev API] 正在启动开发环境，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/start-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 开发环境启动成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 启动开发环境失败:', error);
    throw error;
  }
};

/**
 * 检查开发环境状态
 * @param projectId 项目ID
 * @returns Promise<any> 状态信息
 */
export const checkDevStatus = async (projectId: string): Promise<any> => {
  try {
    console.log('🔍 [AppDev API] 检查开发环境状态，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/dev-status?projectId=${encodeURIComponent(
        projectId,
      )}`,
      {
        method: 'GET',
      },
    );

    console.log('✅ [AppDev API] 开发环境状态:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 检查开发环境状态失败:', error);
    throw error;
  }
};

/**
 * 停止开发环境
 * @param projectId 项目ID
 * @returns Promise<any> 停止结果
 */
export const stopDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🛑 [AppDev API] 停止开发环境，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/stop-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 开发环境已停止:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 停止开发环境失败:', error);
    throw error;
  }
};

/**
 * 重启前端开发服务器
 * @param projectId 项目ID
 * @returns Promise<any> 重启结果
 */
export const restartDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🔄 [AppDev API] 重启前端开发服务器，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/restart-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 前端开发服务器重启成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 重启前端开发服务器失败:', error);
    throw error;
  }
};

/**
 * 构建并发布前端项目
 * @param projectId 项目ID
 * @returns Promise<any> 构建结果
 */
export const buildProject = async (projectId: string): Promise<any> => {
  try {
    console.log('🏗️ [AppDev API] 构建并发布前端项目，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/build`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 前端项目构建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 构建前端项目失败:', error);
    throw error;
  }
};

/**
 * 创建用户前端页面项目
 * @param projectData 项目数据
 * @returns Promise<any> 创建结果
 */
export const createProject = async (projectData: {
  name: string;
  description?: string;
  template?: string;
  framework?: string;
}): Promise<any> => {
  try {
    console.log('📁 [AppDev API] 创建用户前端页面项目:', projectData);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/create`,
      {
        method: 'POST',
        data: projectData,
      },
    );

    console.log('✅ [AppDev API] 前端页面项目创建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 创建前端页面项目失败:', error);
    throw error;
  }
};

/**
 * 上传前端项目压缩包并启动开发服务器
 * @param file 项目压缩包文件
 * @param projectName 项目名称
 * @returns Promise<any> 上传和启动结果
 */
export const uploadAndStartProject = async (
  file: File,
  projectName: string,
): Promise<any> => {
  try {
    console.log('📤 [AppDev API] 上传前端项目压缩包并启动开发服务器:', {
      fileName: file.name,
      projectName,
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectName', projectName);

    const response = await fetch(
      `${API_BASE_URL}/api/custom-page/upload-and-start`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [AppDev API] 项目上传并启动成功:', result);
    return result;
  } catch (error) {
    console.error('❌ [AppDev API] 上传项目并启动失败:', error);
    throw error;
  }
};

/**
 * 获取文件内容
 * @param projectId 项目ID
 * @param filePath 文件路径
 * @returns Promise<string> 文件内容
 */
export const getFileContent = async (
  projectId: string,
  filePath: string,
): Promise<string> => {
  try {
    console.log('📄 [AppDev API] 获取文件内容:', { projectId, filePath });

    if (MOCK_MODE) {
      await mockDelay(300);

      // 模拟不同文件类型的内容
      const mockFileContents: Record<string, string> = {
        'globals.css': `/* 全局样式文件 */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`,
        'layout.tsx': `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
        'page.tsx': `'use client'

import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">src/app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <img
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <img
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
        />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Learn{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Templates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore starter templates for Next.js.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Deploy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50 text-balance">
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
    </main>
  )
}`,
        'tailwind.config.ts': `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
}
export default config`,
      };

      const content =
        mockFileContents[filePath] ||
        `// 文件内容: ${filePath}\n// 这是一个示例文件内容\nconsole.log('Hello, World!');`;

      return mockSuccessResponse(content, '文件内容获取成功');
    }

    // 真实API调用
    const response = await fetch(
      `${API_BASE_URL}/api/custom-page/file-content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          filePath,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [AppDev API] 文件内容获取成功:', result);
    return result;
  } catch (error) {
    console.error('❌ [AppDev API] 获取文件内容失败:', error);
    throw error;
  }
};
