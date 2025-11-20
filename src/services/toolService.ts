import type { ToolItem } from '@/types/tiptap';

/**
 * 工具服务
 * 负责管理工具/技能的获取、缓存和操作
 */

// 本地存储键名
const TOOLS_STORAGE_KEY = 'tiptap-editor-tools';

/**
 * 默认工具列表
 */
const DEFAULT_TOOLS: ToolItem[] = [
  {
    key: 'web-search',
    title: '网络搜索',
    description: '在互联网上搜索相关信息',
    category: '信息获取',
  },
  {
    key: 'web-scraping',
    title: '网页抓取',
    description: '从网页中提取结构化数据',
    category: '信息获取',
  },
  {
    key: 'api-request',
    title: 'API请求',
    description: '发送HTTP请求到外部API',
    category: '数据交互',
    children: [
      {
        key: 'api-request/get',
        title: 'GET请求',
        description: '发送GET请求获取数据',
        category: '数据交互',
      },
      {
        key: 'api-request/post',
        title: 'POST请求',
        description: '发送POST请求提交数据',
        category: '数据交互',
      },
      {
        key: 'api-request/put',
        title: 'PUT请求',
        description: '发送PUT请求更新数据',
        category: '数据交互',
      },
      {
        key: 'api-request/delete',
        title: 'DELETE请求',
        description: '发送DELETE请求删除数据',
        category: '数据交互',
      },
    ],
  },
  {
    key: 'file-operations',
    title: '文件操作',
    description: '创建、读取、更新和删除文件',
    category: '数据处理',
    children: [
      {
        key: 'file-operations/read',
        title: '读取文件',
        description: '从文件系统读取文件内容',
        category: '数据处理',
      },
      {
        key: 'file-operations/write',
        title: '写入文件',
        description: '向文件系统写入文件内容',
        category: '数据处理',
      },
      {
        key: 'file-operations/delete',
        title: '删除文件',
        description: '从文件系统中删除文件',
        category: '数据处理',
      },
      {
        key: 'file-operations/copy',
        title: '复制文件',
        description: '复制文件到新位置',
        category: '数据处理',
      },
      {
        key: 'file-operations/move',
        title: '移动文件',
        description: '移动文件到新位置',
        category: '数据处理',
      },
    ],
  },
  {
    key: 'database-query',
    title: '数据库查询',
    description: '执行SQL查询和数据库操作',
    category: '数据处理',
    children: [
      {
        key: 'database-query/select',
        title: 'SELECT查询',
        description: '执行SELECT查询获取数据',
        category: '数据处理',
      },
      {
        key: 'database-query/insert',
        title: 'INSERT操作',
        description: '执行INSERT操作插入数据',
        category: '数据处理',
      },
      {
        key: 'database-query/update',
        title: 'UPDATE操作',
        description: '执行UPDATE操作更新数据',
        category: '数据处理',
      },
      {
        key: 'database-query/delete',
        title: 'DELETE操作',
        description: '执行DELETE操作删除数据',
        category: '数据处理',
      },
    ],
  },
  {
    key: 'text-processing',
    title: '文本处理',
    description: '文本分析和处理工具',
    category: '数据处理',
    children: [
      {
        key: 'text-processing/translate',
        title: '文本翻译',
        description: '将文本翻译成不同语言',
        category: '数据处理',
      },
      {
        key: 'text-processing/summarize',
        title: '文本摘要',
        description: '生成文本摘要',
        category: '数据处理',
      },
      {
        key: 'text-processing/sentiment',
        title: '情感分析',
        description: '分析文本的情感倾向',
        category: '数据处理',
      },
      {
        key: 'text-processing/extract',
        title: '关键信息提取',
        description: '从文本中提取关键信息',
        category: '数据处理',
      },
    ],
  },
  {
    key: 'image-processing',
    title: '图像处理',
    description: '图像分析和处理工具',
    category: '数据处理',
    children: [
      {
        key: 'image-processing/analyze',
        title: '图像分析',
        description: '分析图像内容',
        category: '数据处理',
      },
      {
        key: 'image-processing/recognize',
        title: '文字识别',
        description: '从图像中识别文字',
        category: '数据处理',
      },
      {
        key: 'image-processing/enhance',
        title: '图像增强',
        description: '提升图像质量',
        category: '数据处理',
      },
      {
        key: 'image-processing/crop',
        title: '图像裁剪',
        description: '裁剪图像区域',
        category: '数据处理',
      },
    ],
  },
  {
    key: 'data-analysis',
    title: '数据分析',
    description: '数据分析和统计工具',
    category: '数据分析',
  },
  {
    key: 'machine-learning',
    title: '机器学习',
    description: '机器学习模型训练和推理',
    category: 'AI功能',
    children: [
      {
        key: 'machine-learning/train',
        title: '模型训练',
        description: '训练机器学习模型',
        category: 'AI功能',
      },
      {
        key: 'machine-learning/predict',
        title: '预测分析',
        description: '使用模型进行预测',
        category: 'AI功能',
      },
      {
        key: 'machine-learning/classify',
        title: '分类任务',
        description: '对数据进行分类',
        category: 'AI功能',
      },
      {
        key: 'machine-learning/cluster',
        title: '聚类分析',
        description: '对数据进行聚类',
        category: 'AI功能',
      },
    ],
  },
  {
    key: 'code-generation',
    title: '代码生成',
    description: '生成各种编程语言的代码',
    category: '开发工具',
    children: [
      {
        key: 'code-generation/javascript',
        title: 'JavaScript代码',
        description: '生成JavaScript代码',
        category: '开发工具',
      },
      {
        key: 'code-generation/python',
        title: 'Python代码',
        description: '生成Python代码',
        category: '开发工具',
      },
      {
        key: 'code-generation/sql',
        title: 'SQL代码',
        description: '生成SQL查询语句',
        category: '开发工具',
      },
      {
        key: 'code-generation/html',
        title: 'HTML代码',
        description: '生成HTML代码',
        category: '开发工具',
      },
      {
        key: 'code-generation/css',
        title: 'CSS代码',
        description: '生成CSS样式',
        category: '开发工具',
      },
    ],
  },
  {
    key: 'code-review',
    title: '代码审查',
    description: '审查和优化代码质量',
    category: '开发工具',
  },
  {
    key: 'unit-testing',
    title: '单元测试',
    description: '生成和运行单元测试',
    category: '开发工具',
  },
  {
    key: 'documentation',
    title: '文档生成',
    description: '生成API文档和用户手册',
    category: '开发工具',
  },
  {
    key: 'deployment',
    title: '应用部署',
    description: '自动化应用部署流程',
    category: 'DevOps',
  },
  {
    key: 'monitoring',
    title: '系统监控',
    description: '监控系统性能和状态',
    category: 'DevOps',
    children: [
      {
        key: 'monitoring/metrics',
        title: '性能指标',
        description: '监控系统性能指标',
        category: 'DevOps',
      },
      {
        key: 'monitoring/logs',
        title: '日志监控',
        description: '分析系统日志',
        category: 'DevOps',
      },
      {
        key: 'monitoring/alerts',
        title: '告警管理',
        description: '配置和发送告警',
        category: 'DevOps',
      },
    ],
  },
  {
    key: 'security-scan',
    title: '安全扫描',
    description: '扫描系统安全漏洞',
    category: '安全',
  },
  {
    key: 'backup',
    title: '数据备份',
    description: '自动备份重要数据',
    category: '运维',
  },
  {
    key: 'notification',
    title: '消息通知',
    description: '发送各种类型的通知',
    category: '通信',
    children: [
      {
        key: 'notification/email',
        title: '邮件通知',
        description: '发送邮件通知',
        category: '通信',
      },
      {
        key: 'notification/sms',
        title: '短信通知',
        description: '发送短信通知',
        category: '通信',
      },
      {
        key: 'notification/webhook',
        title: 'Webhook通知',
        description: '发送Webhook通知',
        category: '通信',
      },
      {
        key: 'notification/push',
        title: '推送通知',
        description: '发送推送通知',
        category: '通信',
      },
    ],
  },
  {
    key: 'calendar',
    title: '日历管理',
    description: '管理日程和事件',
    category: '生产力',
    children: [
      {
        key: 'calendar/create',
        title: '创建事件',
        description: '创建新的日历事件',
        category: '生产力',
      },
      {
        key: 'calendar/update',
        title: '更新事件',
        description: '更新现有事件',
        category: '生产力',
      },
      {
        key: 'calendar/delete',
        title: '删除事件',
        description: '删除日历事件',
        category: '生产力',
      },
    ],
  },
  {
    key: 'task-automation',
    title: '任务自动化',
    description: '自动化重复性任务',
    category: '生产力',
  },
  {
    key: 'workflow',
    title: '工作流管理',
    description: '设计和管理业务流程',
    category: '生产力',
  },
];

/**
 * 工具服务类
 */
class ToolService {
  private tools: ToolItem[] = DEFAULT_TOOLS;
  private cache: Map<string, ToolItem> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从本地存储加载工具
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(TOOLS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.tools = [...DEFAULT_TOOLS, ...parsed];
        }
      }
    } catch (error) {
      console.warn('Failed to load tools from storage:', error);
    }
  }

  /**
   * 保存工具到本地存储
   */
  private saveToStorage() {
    try {
      const userTools = this.tools.filter(
        (tool) =>
          !DEFAULT_TOOLS.some((defaultTool) => defaultTool.key === tool.key),
      );
      localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(userTools));
    } catch (error) {
      console.warn('Failed to save tools to storage:', error);
    }
  }

  /**
   * 递归查找工具
   */
  private findToolRecursive(tools: ToolItem[], key: string): ToolItem | null {
    for (const tool of tools) {
      if (tool.key === key) {
        return tool;
      }
      if (tool.children) {
        const found = this.findToolRecursive(tool.children, key);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 递归添加工具到缓存
   */
  private addToCacheRecursive(tools: ToolItem[]) {
    for (const tool of tools) {
      this.cache.set(tool.key, tool);
      if (tool.children) {
        this.addToCacheRecursive(tool.children);
      }
    }
  }

  /**
   * 获取所有工具
   */
  getAllTools(): ToolItem[] {
    return [...this.tools];
  }

  /**
   * 根据 key 获取工具
   */
  getTool(key: string): ToolItem | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const tool = this.findToolRecursive(this.tools, key);
    if (tool) {
      this.cache.set(key, tool);
    }
    return tool || undefined;
  }

  /**
   * 获取扁平化的工具列表（用于搜索）
   */
  getFlattenedTools(): Array<ToolItem & { path: string }> {
    const flattened: Array<ToolItem & { path: string }> = [];

    const flatten = (tools: ToolItem[], parentPath = '') => {
      for (const tool of tools) {
        const currentPath = parentPath ? `${parentPath}/${tool.key}` : tool.key;
        flattened.push({ ...tool, key: currentPath, path: currentPath });

        if (tool.children) {
          flatten(tool.children, currentPath);
        }
      }
    };

    flatten(this.tools);
    return flattened;
  }

  /**
   * 搜索工具
   */
  searchTools(query: string): Array<ToolItem & { path: string }> {
    if (!query) return this.getFlattenedTools();

    const lowerQuery = query.toLowerCase();
    return this.getFlattenedTools().filter(
      (tool) =>
        tool.title.toLowerCase().includes(lowerQuery) ||
        tool.key.toLowerCase().includes(lowerQuery) ||
        tool.description?.toLowerCase().includes(lowerQuery) ||
        tool.category?.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * 根据分类获取工具
   */
  getToolsByCategory(category: string): ToolItem[] {
    return this.tools.filter((tool) => tool.category === category);
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.tools.forEach((tool) => {
      if (tool.category) {
        categories.add(tool.category);
      }
      if (tool.children) {
        tool.children.forEach((child: ToolItem) => {
          if (child.category) {
            categories.add(child.category);
          }
        });
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * 添加新工具
   */
  addTool(tool: ToolItem): boolean {
    // 检查 key 是否已存在
    if (this.getTool(tool.key)) {
      return false;
    }

    this.tools.push(tool);
    this.cache.clear();
    this.addToCacheRecursive([tool]);
    this.saveToStorage();
    return true;
  }

  /**
   * 更新工具
   */
  updateTool(key: string, updates: Partial<ToolItem>): boolean {
    const tool = this.getTool(key);
    if (!tool) return false;

    Object.assign(tool, updates);
    this.cache.clear();
    this.addToCacheRecursive(this.tools);
    this.saveToStorage();
    return true;
  }

  /**
   * 删除工具
   */
  removeTool(key: string): boolean {
    const removeRecursive = (tools: ToolItem[]): boolean => {
      const index = tools.findIndex((tool) => tool.key === key);
      if (index !== -1) {
        // 不允许删除系统默认工具
        if (DEFAULT_TOOLS.some((defaultTool) => defaultTool.key === key)) {
          return false;
        }
        tools.splice(index, 1);
        return true;
      }

      for (const tool of tools) {
        if (tool.children && removeRecursive(tool.children)) {
          return true;
        }
      }
      return false;
    };

    const removed = removeRecursive(this.tools);
    if (removed) {
      this.cache.delete(key);
      this.saveToStorage();
    }
    return removed;
  }

  /**
   * 获取工具统计信息
   */
  getStats() {
    const categories = this.getCategories();
    const categoryStats = categories.reduce((acc, category) => {
      acc[category] = this.getToolsByCategory(category).length;
      return acc;
    }, {} as Record<string, number>);

    const totalTools = this.getFlattenedTools().length;

    return {
      total: totalTools,
      categories: categories.length,
      categoryStats,
      custom: this.tools.filter(
        (tool) =>
          !DEFAULT_TOOLS.some((defaultTool) => defaultTool.key === tool.key),
      ).length,
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 重置为默认工具
   */
  resetToDefaults() {
    this.tools = [...DEFAULT_TOOLS];
    this.cache.clear();
    this.addToCacheRecursive(this.tools);
    try {
      localStorage.removeItem(TOOLS_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear tools from storage:', error);
    }
  }

  /**
   * 导出工具配置
   */
  exportTools(): string {
    const userTools = this.tools.filter(
      (tool) =>
        !DEFAULT_TOOLS.some((defaultTool) => defaultTool.key === tool.key),
    );
    return JSON.stringify(userTools, null, 2);
  }

  /**
   * 导入工具配置
   */
  importTools(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) return false;

      // 验证每个工具的格式
      for (const tool of imported) {
        if (!tool.key || !tool.title) {
          return false;
        }
      }

      // 添加导入的工具
      let added = 0;
      for (const tool of imported) {
        if (this.addTool(tool)) {
          added++;
        }
      }

      return added > 0;
    } catch (error) {
      console.warn('Failed to import tools:', error);
      return false;
    }
  }

  /**
   * 获取工具树结构
   */
  getToolTree(): ToolItem[] {
    return this.tools;
  }
}

// 导出单例实例
export const toolService = new ToolService();

// 导出类型
export type { ToolItem };

// 导出默认工具
export { DEFAULT_TOOLS };
