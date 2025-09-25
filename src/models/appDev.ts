import { useState } from 'react';

/**
 * 文件节点接口
 * 表示文件树中的文件或文件夹
 */
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: string;
  children?: FileNode[];
  lastModified: number;
}

/**
 * 工作区接口
 * 表示AppDev的工作区状态
 */
export interface AppDevWorkspace {
  id: string;
  name: string;
  projectId: string;
  devServerUrl?: string;
  files: FileNode[];
  activeFile?: string;
  settings: {
    theme: 'light' | 'dark';
    fontSize: number;
    tabSize: number;
  };
  compiler: {
    status: 'initializing' | 'ready' | 'error';
    error?: string;
    mode: 'wasm' | 'fallback' | 'babel';
  };
}

/**
 * 编译选项接口
 */
export interface CompileOptions {
  compiler?: 'swc' | 'babel' | 'fallback';
  jsc?: {
    target?:
      | 'es3'
      | 'es5'
      | 'es2015'
      | 'es2016'
      | 'es2017'
      | 'es2018'
      | 'es2019'
      | 'es2020'
      | 'es2021'
      | 'es2022';
    parser?: {
      syntax?: 'ecmascript' | 'typescript' | 'jsx';
      tsx?: boolean;
      decorators?: boolean;
      dynamicImport?: boolean;
    };
    transform?: {
      react?: {
        pragma?: string;
        pragmaFrag?: string;
        runtime?: 'automatic' | 'classic';
      };
      constModules?: boolean;
      optimizer?: {
        globals?: Record<string, string>;
      };
    };
  };
  module?: {
    type?: 'commonjs' | 'es6';
    strict?: boolean;
    strictMode?: boolean;
    lazy?: boolean;
    noInterop?: boolean;
  };
  sourceMaps?: boolean;
}

/**
 * 编译结果接口
 */
export interface CompileResult {
  code: string;
  map?: any;
  errors?: string[];
}

/**
 * 从URL参数中获取projectId
 */
export const getProjectIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('projectId');
};

/**
 * 默认工作区配置
 */
const initialWorkspace: AppDevWorkspace = {
  id: 'default',
  name: 'New Project',
  projectId: '',
  files: [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: 'app',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          content: `import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

const App = () => {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 使用现代 JavaScript 特性
  const features = [
    'Optional Chaining (?.)',
    'Nullish Coalescing (??)',
    'Template Literals',
    'Arrow Functions',
    'Destructuring',
    'Spread Operator',
    'Async/Await',
    'Promises',
    'Modules',
    'Classes'
  ];

  useEffect(() => {
    // 模拟异步数据获取
    const fetchUser = async () => {
      try {
        // 模拟 API 调用
        const mockUser: User = {
          id: 1,
          name: 'Web IDE User',
          email: 'user@example.com',
          role: 'admin'
        };

        // 使用可选链操作符和空值合并操作符
        setTimeout(() => {
          setUser(mockUser);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  // 使用现代 JavaScript 特性的示例
  const displayName = user?.name ?? 'Guest';
  const userRole = user?.role ?? 'user';

  const formatFeatures = features.map((feature, index) => (
    <span key={index} style={{
      display: 'inline-block',
      background: 'rgba(255,255,255,0.2)',
      padding: '0.25rem 0.5rem',
      margin: '0.25rem',
      borderRadius: '1rem',
      fontSize: '0.875rem'
    }}>
      {feature}
    </span>
  ));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Modern Web IDE 🚀
        </h1>

        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Welcome, {displayName}! ({userRole})
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Counter Demo
          </h2>

          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            {count}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleIncrement}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Increment
            </button>

            <button
              onClick={handleReset}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Modern JavaScript Features
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {formatFeatures}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '0.5rem',
          padding: '1rem',
          fontSize: '0.875rem',
          opacity: '0.8'
        }}>
          <p>✨ ES2022 Features Active ✨</p>
          <p>Preview is running with modern JavaScript support</p>
        </div>
      </div>
    </div>
  );
};

export default App;`,
          language: 'typescript',
          lastModified: Date.now(),
        },
      ],
      lastModified: Date.now(),
    },
    {
      id: 'package',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: JSON.stringify(
        {
          name: 'web-ide-project',
          version: '1.0.0',
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        },
        null,
        2,
      ),
      language: 'json',
      lastModified: Date.now(),
    },
  ],
  settings: {
    theme: 'light',
    fontSize: 14,
    tabSize: 2,
  },
  compiler: {
    status: 'initializing',
    mode: 'babel',
  },
};

/**
 * AppDev状态管理Hook
 */
export const useAppDevStore = () => {
  const [workspace, setWorkspace] = useState<AppDevWorkspace>(initialWorkspace);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  /**
   * 设置工作区
   */
  const updateWorkspace = (newWorkspace: Partial<AppDevWorkspace>) => {
    setWorkspace((prev) => ({ ...prev, ...newWorkspace }));
  };

  /**
   * 设置活动文件
   */
  const setActiveFile = (fileId: string) => {
    console.log('📁 [AppDev] Setting active file:', fileId);

    const findFile = (files: FileNode[], targetId: string): FileNode | null => {
      for (const file of files) {
        if (file.id === targetId) return file;
        if (file.children) {
          const found = findFile(file.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(workspace.files, fileId);
    if (file) {
      console.log('✅ [AppDev] File found:', file.name);
      setCurrentFile(file);
      updateWorkspace({ activeFile: fileId });
    } else {
      console.error('❌ [AppDev] File not found:', fileId);
    }
  };

  /**
   * 更新文件内容
   */
  const updateFileContent = (fileId: string, content: string) => {
    console.log('📝 [AppDev] Updating file content:', fileId);

    const updateFileInTree = (files: FileNode[]): FileNode[] => {
      return files.map((file) => {
        if (file.id === fileId) {
          console.log('✅ [AppDev] File found for update:', file.name);
          return { ...file, content, lastModified: Date.now() };
        }
        if (file.children) {
          return { ...file, children: updateFileInTree(file.children) };
        }
        return file;
      });
    };

    setWorkspace((prev) => ({
      ...prev,
      files: updateFileInTree(prev.files),
    }));
    console.log('✅ [AppDev] File content updated successfully');
  };

  /**
   * 创建文件
   */
  const createFile = (path: string, content: string) => {
    const fileName = path.split('/').pop() || 'untitled';
    const fileId = fileName.toLowerCase().replace(/\./g, '-');

    const newFile: FileNode = {
      id: fileId,
      name: fileName,
      type: 'file',
      path,
      content,
      language: fileName.split('.').pop(),
      lastModified: Date.now(),
    };

    setWorkspace((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));
  };

  /**
   * 删除文件
   */
  const deleteFile = (fileId: string) => {
    const removeFileFromTree = (files: FileNode[]): FileNode[] => {
      return files
        .filter((file) => file.id !== fileId)
        .map((file) => ({
          ...file,
          children: file.children
            ? removeFileFromTree(file.children)
            : undefined,
        }));
    };

    setWorkspace((prev) => ({
      ...prev,
      files: removeFileFromTree(prev.files),
      activeFile: prev.activeFile === fileId ? undefined : prev.activeFile,
    }));

    if (currentFile?.id === fileId) {
      setCurrentFile(null);
    }
  };

  /**
   * 创建文件夹
   */
  const createFolder = (path: string) => {
    const folderName = path.split('/').pop() || 'New Folder';
    const folderId = folderName.toLowerCase().replace(/\s+/g, '-');

    const newFolder: FileNode = {
      id: folderId,
      name: folderName,
      type: 'folder',
      path,
      children: [],
      lastModified: Date.now(),
    };

    setWorkspace((prev) => ({
      ...prev,
      files: [...prev.files, newFolder],
    }));
  };

  /**
   * 更新设置
   */
  const updateSettings = (settings: Partial<AppDevWorkspace['settings']>) => {
    setWorkspace((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  /**
   * 更新编译器状态
   */
  const updateCompilerStatus = (
    compiler: Partial<AppDevWorkspace['compiler']>,
  ) => {
    setWorkspace((prev) => ({
      ...prev,
      compiler: { ...prev.compiler, ...compiler },
    }));
  };

  /**
   * 更新开发服务器URL
   */
  const updateDevServerUrl = (devServerUrl: string) => {
    setWorkspace((prev) => ({
      ...prev,
      devServerUrl,
    }));
  };

  /**
   * 更新项目ID
   */
  const updateProjectId = (projectId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      projectId,
    }));
  };

  return {
    workspace,
    currentFile,
    isServiceRunning,
    setIsServiceRunning,
    updateWorkspace,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    createFolder,
    updateSettings,
    updateCompilerStatus,
    updateDevServerUrl,
    updateProjectId,
  };
};
