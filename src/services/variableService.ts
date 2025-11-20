import type { VariableItem } from '@/types/tiptap';

/**
 * 变量服务
 * 负责管理变量的获取、缓存和操作
 */

// 本地存储键名
const VARIABLES_STORAGE_KEY = 'tiptap-editor-variables';

/**
 * 默认变量列表
 */
const DEFAULT_VARIABLES: VariableItem[] = [
  {
    key: 'userName',
    name: '用户名',
    description: '当前用户的名称',
    type: 'string',
  },
  {
    key: 'userEmail',
    name: '用户邮箱',
    description: '当前用户的邮箱地址',
    type: 'string',
  },
  {
    key: 'currentDate',
    name: '当前日期',
    description: '今天的日期（YYYY-MM-DD 格式）',
    type: 'date',
  },
  {
    key: 'currentTime',
    name: '当前时间',
    description: '现在的时间（HH:mm:ss 格式）',
    type: 'time',
  },
  {
    key: 'projectName',
    name: '项目名称',
    description: '当前项目的名称',
    type: 'string',
  },
  {
    key: 'environment',
    name: '环境变量',
    description: '当前运行环境（development/production）',
    type: 'string',
  },
  {
    key: 'version',
    name: '版本号',
    description: '当前应用版本号',
    type: 'string',
  },
  {
    key: 'apiBaseUrl',
    name: 'API基础URL',
    description: 'API 接口的基础地址',
    type: 'url',
  },
  {
    key: 'databaseUrl',
    name: '数据库地址',
    description: '数据库连接地址',
    type: 'string',
  },
  {
    key: 'sessionId',
    name: '会话ID',
    description: '当前用户会话标识',
    type: 'string',
  },
  {
    key: 'userAgent',
    name: '用户代理',
    description: '当前浏览器的用户代理信息',
    type: 'string',
  },
  {
    key: 'ipAddress',
    name: 'IP地址',
    description: '用户的IP地址',
    type: 'string',
  },
  {
    key: 'screenResolution',
    name: '屏幕分辨率',
    description: '用户屏幕分辨率',
    type: 'string',
  },
  {
    key: 'language',
    name: '语言',
    description: '用户界面语言',
    type: 'string',
  },
  {
    key: 'timezone',
    name: '时区',
    description: '用户所在时区',
    type: 'string',
  },
  {
    key: 'deviceType',
    name: '设备类型',
    description: '用户设备类型（桌面/移动）',
    type: 'string',
  },
  {
    key: 'browserName',
    name: '浏览器名称',
    description: '用户浏览器名称',
    type: 'string',
  },
  {
    key: 'operatingSystem',
    name: '操作系统',
    description: '用户操作系统',
    type: 'string',
  },
  {
    key: 'randomId',
    name: '随机ID',
    description: '随机生成的唯一标识符',
    type: 'string',
  },
  {
    key: 'hashValue',
    name: '哈希值',
    description: '基于内容生成的哈希值',
    type: 'string',
  },
  {
    key: 'tokenCount',
    name: 'Token计数',
    description: '当前消息的Token数量',
    type: 'number',
  },
  {
    key: 'responseTime',
    name: '响应时间',
    description: 'API响应时间（毫秒）',
    type: 'number',
  },
  {
    key: 'requestCount',
    name: '请求次数',
    description: '累计请求次数',
    type: 'number',
  },
  {
    key: 'errorCount',
    name: '错误次数',
    description: '累计错误次数',
    type: 'number',
  },
];

/**
 * 变量服务类
 */
class VariableService {
  private variables: VariableItem[] = DEFAULT_VARIABLES;
  private cache: Map<string, VariableItem> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从本地存储加载变量
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(VARIABLES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.variables = [...DEFAULT_VARIABLES, ...parsed];
        }
      }
    } catch (error) {
      console.warn('Failed to load variables from storage:', error);
    }
  }

  /**
   * 保存变量到本地存储
   */
  private saveToStorage() {
    try {
      const userVariables = this.variables.filter(
        (variable) =>
          !DEFAULT_VARIABLES.some(
            (defaultVar) => defaultVar.key === variable.key,
          ),
      );
      localStorage.setItem(
        VARIABLES_STORAGE_KEY,
        JSON.stringify(userVariables),
      );
    } catch (error) {
      console.warn('Failed to save variables to storage:', error);
    }
  }

  /**
   * 获取所有变量
   */
  getAllVariables(): VariableItem[] {
    return [...this.variables];
  }

  /**
   * 根据 key 获取变量
   */
  getVariable(key: string): VariableItem | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const variable = this.variables.find((v) => v.key === key);
    if (variable) {
      this.cache.set(key, variable);
    }
    return variable;
  }

  /**
   * 搜索变量
   */
  searchVariables(query: string): VariableItem[] {
    if (!query) return this.variables;

    const lowerQuery = query.toLowerCase();
    return this.variables.filter(
      (variable) =>
        variable.name.toLowerCase().includes(lowerQuery) ||
        variable.key.toLowerCase().includes(lowerQuery) ||
        variable.description?.toLowerCase().includes(lowerQuery) ||
        variable.type?.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * 根据类型过滤变量
   */
  getVariablesByType(type: string): VariableItem[] {
    return this.variables.filter((variable) => variable.type === type);
  }

  /**
   * 添加新变量
   */
  addVariable(variable: VariableItem): boolean {
    // 检查 key 是否已存在
    if (this.variables.some((v) => v.key === variable.key)) {
      return false;
    }

    this.variables.push(variable);
    this.cache.clear();
    this.saveToStorage();
    return true;
  }

  /**
   * 更新变量
   */
  updateVariable(key: string, updates: Partial<VariableItem>): boolean {
    const index = this.variables.findIndex((v) => v.key === key);
    if (index === -1) return false;

    this.variables[index] = { ...this.variables[index], ...updates };
    this.cache.clear();
    this.saveToStorage();
    return true;
  }

  /**
   * 删除变量
   */
  removeVariable(key: string): boolean {
    const index = this.variables.findIndex((v) => v.key === key);
    if (index === -1) return false;

    // 不允许删除系统默认变量
    if (DEFAULT_VARIABLES.some((defaultVar) => defaultVar.key === key)) {
      return false;
    }

    this.variables.splice(index, 1);
    this.cache.delete(key);
    this.saveToStorage();
    return true;
  }

  /**
   * 获取变量统计信息
   */
  getStats() {
    const typeStats = this.variables.reduce((acc, variable) => {
      const type = variable.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.variables.length,
      types: typeStats,
      custom: this.variables.filter(
        (v) =>
          !DEFAULT_VARIABLES.some((defaultVar) => defaultVar.key === v.key),
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
   * 重置为默认变量
   */
  resetToDefaults() {
    this.variables = [...DEFAULT_VARIABLES];
    this.cache.clear();
    try {
      localStorage.removeItem(VARIABLES_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear variables from storage:', error);
    }
  }

  /**
   * 导出变量配置
   */
  exportVariables(): string {
    const userVariables = this.variables.filter(
      (variable) =>
        !DEFAULT_VARIABLES.some(
          (defaultVar) => defaultVar.key === variable.key,
        ),
    );
    return JSON.stringify(userVariables, null, 2);
  }

  /**
   * 导入变量配置
   */
  importVariables(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) return false;

      // 验证每个变量的格式
      for (const variable of imported) {
        if (!variable.key || !variable.name) {
          return false;
        }
      }

      // 添加导入的变量
      let added = 0;
      for (const variable of imported) {
        if (this.addVariable(variable)) {
          added++;
        }
      }

      return added > 0;
    } catch (error) {
      console.warn('Failed to import variables:', error);
      return false;
    }
  }
}

// 导出单例实例
export const variableService = new VariableService();

// 导出类型
export type { VariableItem };

// 导出默认变量
export { DEFAULT_VARIABLES };
