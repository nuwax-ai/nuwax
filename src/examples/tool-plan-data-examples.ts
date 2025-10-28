/**
 * Tool Plan 数据示例
 * 用于未来实现渲染 tool plan 输出的数据示例
 */

// Plan 消息数据结构
export interface PlanEntry {
  content: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface PlanMessage {
  sessionId: string;
  messageType: 'agentSessionUpdate';
  subType: 'plan';
  data: {
    entries: PlanEntry[];
    request_id: string;
  };
  timestamp: string;
}

// Tool Call 消息数据结构
export interface ToolCallLocation {
  line: number;
  path: string;
  type: 'ToolCallLocation';
}

export interface ToolCallContent {
  content: {
    text: string;
    type: 'text';
  };
  type: 'content';
}

export interface ToolCallMessage {
  sessionId: string;
  messageType: 'agentSessionUpdate';
  subType: 'tool_call';
  data: {
    content?: ToolCallContent[];
    kind: 'read' | 'edit' | 'write' | 'execute';
    locations?: ToolCallLocation[];
    rawInput: {
      file_path?: string;
      command?: string;
      description?: string;
      new_string?: string;
      old_string?: string;
    };
    request_id: string;
    title: string;
    toolCallId: string;
  };
  timestamp: string;
}

// Tool Call Update 消息数据结构
export interface ToolCallUpdateMessage {
  sessionId: string;
  messageType: 'agentSessionUpdate';
  subType: 'tool_call_update';
  data: {
    content?: ToolCallContent[];
    request_id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    toolCallId: string;
  };
  timestamp: string;
}

// 示例数据：删除 Token 相关组件的完整流程
export const deleteTokenComponentsExample: {
  plan: PlanMessage[];
  toolCalls: ToolCallMessage[];
  toolCallUpdates: ToolCallUpdateMessage[];
} = {
  plan: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'plan',
      data: {
        entries: [
          {
            content: '删除TokenPriceQuery组件',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '删除TokenIcon组件',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '删除TokenPage页面',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从路由配置中移除Token页面路由',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从导航组件中移除Token页面链接',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从services.ts中删除Token相关API',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '更新首页内容，移除Token查询相关描述',
            priority: 'medium',
            status: 'pending',
          },
        ],
        request_id: 'req_1760593922359_r36y4vl',
      },
      timestamp: '2025-10-16T05:52:08.384894500Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'plan',
      data: {
        entries: [
          {
            content: '删除TokenPriceQuery组件',
            priority: 'medium',
            status: 'in_progress',
          },
          {
            content: '删除TokenIcon组件',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '删除TokenPage页面',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从路由配置中移除Token页面路由',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从导航组件中移除Token页面链接',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从services.ts中删除Token相关API',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '更新首页内容，移除Token查询相关描述',
            priority: 'medium',
            status: 'pending',
          },
        ],
        request_id: 'req_1760593922359_r36y4vl',
      },
      timestamp: '2025-10-16T05:52:10.682150257Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'plan',
      data: {
        entries: [
          {
            content: '删除TokenPriceQuery组件',
            priority: 'medium',
            status: 'completed',
          },
          {
            content: '删除TokenIcon组件',
            priority: 'medium',
            status: 'in_progress',
          },
          {
            content: '删除TokenPage页面',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从路由配置中移除Token页面路由',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从导航组件中移除Token页面链接',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '从services.ts中删除Token相关API',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '更新首页内容，移除Token查询相关描述',
            priority: 'medium',
            status: 'pending',
          },
        ],
        request_id: 'req_1760593922359_r36y4vl',
      },
      timestamp: '2025-10-16T05:52:14.713178846Z',
    },
  ],
  toolCalls: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call',
      data: {
        content: [
          {
            content: {
              text: '删除TokenPriceQuery组件文件',
              type: 'text',
            },
            type: 'content',
          },
        ],
        kind: 'execute',
        rawInput: {
          command:
            'rm /home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/components/TokenPriceQuery.tsx',
          description: '删除TokenPriceQuery组件文件',
        },
        request_id: 'req_1760593922359_r36y4vl',
        title:
          '`rm /home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/components/TokenPriceQuery.tsx`',
        toolCallId: 'call_3e7vmhfr3',
      },
      timestamp: '2025-10-16T05:52:11.744255028Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call',
      data: {
        content: [
          {
            content: {
              text: '删除TokenIcon组件文件',
              type: 'text',
            },
            type: 'content',
          },
        ],
        kind: 'execute',
        rawInput: {
          command:
            'rm /home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/components/TokenIcon.tsx',
          description: '删除TokenIcon组件文件',
        },
        request_id: 'req_1760593922359_r36y4vl',
        title:
          '`rm /home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/components/TokenIcon.tsx`',
        toolCallId: 'call_c2l2u50369k',
      },
      timestamp: '2025-10-16T05:52:15.758216537Z',
    },
  ],
  toolCallUpdates: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call_update',
      data: {
        request_id: 'req_1760593922359_r36y4vl',
        status: 'completed',
        toolCallId: 'call_3e7vmhfr3',
      },
      timestamp: '2025-10-16T05:52:12.252197056Z',
    },
  ],
};

// 示例数据：创建 Token 相关组件的完整流程
export const createTokenComponentsExample: {
  plan: PlanMessage[];
  toolCalls: ToolCallMessage[];
  toolCallUpdates: ToolCallUpdateMessage[];
} = {
  plan: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'plan',
      data: {
        entries: [
          {
            content: '在services.ts中添加Token价格查询API接口',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '创建TokenIcon组件用于显示代币图标',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '创建TokenPriceQuery组件实现价格查询功能',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '创建TokenPage页面',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '在路由配置中添加Token页面路由',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '在导航组件中添加Token页面链接',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '更新首页内容，添加Token查询功能介绍',
            priority: 'medium',
            status: 'pending',
          },
        ],
        request_id: 'req_1760594419687_epfhwbn',
      },
      timestamp: '2025-10-16T06:00:29.350906097Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'plan',
      data: {
        entries: [
          {
            content: '在services.ts中添加Token价格查询API接口',
            priority: 'medium',
            status: 'in_progress',
          },
          {
            content: '创建TokenIcon组件用于显示代币图标',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '创建TokenPriceQuery组件实现价格查询功能',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '创建TokenPage页面',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '在路由配置中添加Token页面路由',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '在导航组件中添加Token页面链接',
            priority: 'medium',
            status: 'pending',
          },
          {
            content: '更新首页内容，添加Token查询功能介绍',
            priority: 'medium',
            status: 'pending',
          },
        ],
        request_id: 'req_1760594419687_epfhwbn',
      },
      timestamp: '2025-10-16T06:00:31.449896810Z',
    },
  ],
  toolCalls: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call',
      data: {
        kind: 'read',
        locations: [
          {
            line: 0,
            path: '/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts',
            type: 'ToolCallLocation',
          },
        ],
        rawInput: {
          file_path:
            '/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts',
        },
        request_id: 'req_1760594419687_epfhwbn',
        title: 'Read File',
        toolCallId: 'call_9j98n8ez1tq',
      },
      timestamp: '2025-10-16T06:00:32.591769261Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call',
      data: {
        content: [
          {
            newText: `return { data, loading, error, refetch: fetchData };
}

// Token 价格查询相关接口
export interface TokenPriceParams {
  symbol: string; // 代币名称，必须大写，且追加USDT，例如：BTCUSDT
}

export interface TokenPriceData {
  closeTime: number;
  mins: number;
  price: string;
}

export interface TokenPriceResponse {
  code: string; // "0000" 表示成功，其余失败
  message: string;
  data: TokenPriceData;
}

// Token 相关 API
export const tokenApi = {
  // 查询 token 价格
  getPrice: (params: TokenPriceParams) =>
    api.post<TokenPriceResponse>('/api/plugin/18/published/execute', params),
};

// 使用示例：
// const { data: userInfo, loading, error } = useApi(() => userApi.getUserInfo());`,
            oldText: `return { data, loading, error, refetch: fetchData };
}


// 使用示例：
// const { data: userInfo, loading, error } = useApi(() => userApi.getUserInfo());`,
            path: '/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts',
            type: 'diff',
          },
        ],
        kind: 'edit',
        locations: [
          {
            path: '/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts',
            type: 'ToolCallLocation',
          },
        ],
        rawInput: {
          file_path:
            '/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts',
          new_string: `return { data, loading, error, refetch: fetchData };
}

// Token 价格查询相关接口
export interface TokenPriceParams {
  symbol: string; // 代币名称，必须大写，且追加USDT，例如：BTCUSDT
}

export interface TokenPriceData {
  closeTime: number;
  mins: number;
  price: string;
}

export interface TokenPriceResponse {
  code: string; // "0000" 表示成功，其余失败
  message: string;
  data: TokenPriceData;
}

// Token 相关 API
export const tokenApi = {
  // 查询 token 价格
  getPrice: (params: TokenPriceParams) =>
    api.post<TokenPriceResponse>('/api/plugin/18/published/execute', params),
};

// 使用示例：
// const { data: userInfo, loading, error } = useApi(() => userApi.getUserInfo());`,
          old_string: `return { data, loading, error, refetch: fetchData };
}


// 使用示例：
// const { data: userInfo, loading, error } = useApi(() => userApi.getUserInfo());`,
        },
        request_id: 'req_1760594419687_epfhwbn',
        title:
          'Edit `/home/swufe/workspace/rcoder-server/project_workspace/8336056151511040/src/lib/services.ts`',
        toolCallId: 'call_5fj7duh8k4e',
      },
      timestamp: '2025-10-16T06:00:35.658119756Z',
    },
  ],
  toolCallUpdates: [
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call_update',
      data: {
        content: [
          {
            content: {
              text: "```\n     1→import { api } from './api';\n     2→\n     3→// 接口返回数据类型定义\n     4→export interface User {\n     5→  id: number;\n     6→  username: string;\n     7→  email: string;\n     8→  avatar?: string;\n     9→  createdAt: string;\n    10→}\n    11→\n    12→export interface LoginParams {\n    13→  username: string;\n    14→  password: string;\n    15→}\n    16→\n    17→export interface LoginResult {\n    18→  token: string;\n    19→  user: User;\n    20→}\n    21→\n    22→export interface ListParams {\n    23→  page: number;\n    24→  pageSize: number;\n    25→  keyword?: string;\n    26→}\n    27→\n    28→export interface ListResult<T> {\n    29→  list: T[];\n    30→  total: number;\n    31→  page: number;\n    32→  pageSize: number;\n    33→}\n    34→\n    35→// 用户相关API\n    36→export const userApi = {\n    37→  // 登录\n    38→  login: (params: LoginParams) => api.post<LoginResult>('/auth/login', params),\n    39→  \n    40→  // 获取用户信息\n    41→  getUserInfo: () => api.get<User>('/user/info'),\n    42→  \n    43→  // 更新用户信息\n    44→  updateUserInfo: (data: Partial<User>) => api.put<User>('/user/info', data),\n    45→};\n    46→\n    47→// 示例数据列表API\n    48→export const exampleApi = {\n    49→  // 获取列表数据\n    50→  getList: (params: ListParams) => api.get<ListResult<any>>('/example/list', { params }),\n    51→  \n    52→  // 创建项目\n    53→  create: (data: any) => api.post<any>('/example/create', data),\n    54→  \n    55→  // 更新项目\n    56→  update: (id: number, data: any) => api.put<any>(`/example/update/${id}`, data),\n    57→  \n    58→  // 删除项目\n    59→  delete: (id: number) => api.delete<any>(`/example/delete/${id}`),\n    60→  \n    61→  // 获取详情\n    62→  getDetail: (id: number) => api.get<any>(`/example/detail/${id}`),\n    63→};\n    64→\n    65→// React Hook 封装示例\n    66→import { useState, useEffect } from 'react';\n    67→\n    68→export function useApi<T>(\n    69→  apiCall: () => Promise<T>,\n    70→  deps: any[] = []\n    71→) {\n    72→  const [data, setData] = useState<T | null>(null);\n    73→  const [loading, setLoading] = useState(false);\n    74→  const [error, setError] = useState<Error | null>(null);\n    75→\n    76→  const fetchData = async () => {\n    77→    setLoading(true);\n    78→    setError(null);\n    79→    \n    80→    try {\n    81→      const result = await apiCall();\n    82→      setData(result);\n    83→    } catch (err) {\n    84→      setError(err as Error);\n    85→    } finally {\n    86→      setLoading(false);\n    87→    }\n    88→  };\n    89→\n    90→  useEffect(() => {\n    91→    fetchData();\n    92→  }, deps);\n    93→\n    94→  return { data, loading, error, refetch: fetchData };\n    95→}\n    96→\n    97→\n    98→// 使用示例：\n    99→// const { data: userInfo, loading, error } = useApi(() => userApi.getUserInfo());\n```",
              type: 'text',
            },
            type: 'content',
          },
        ],
        request_id: 'req_1760594419687_epfhwbn',
        status: 'completed',
        toolCallId: 'call_9j98n8ez1tq',
      },
      timestamp: '2025-10-16T06:00:32.613427487Z',
    },
    {
      sessionId: '0199eb82-09e1-76ed-9747-6d089f06755a',
      messageType: 'agentSessionUpdate',
      subType: 'tool_call_update',
      data: {
        request_id: 'req_1760594419687_epfhwbn',
        status: 'completed',
        toolCallId: 'call_5fj7duh8k4e',
      },
      timestamp: '2025-10-16T06:00:36.029995Z',
    },
  ],
};

// 工具函数：检测是否为文件操作
export const isFileOperationFromMessage = (messageData: any): boolean => {
  const fileRelatedTools = [
    'write_file',
    'edit_file',
    'delete_file',
    'create_directory',
  ];

  // 检查工具名称、命令、类型或描述是否包含文件操作
  const toolName = messageData.toolName || '';
  const command = messageData.rawInput?.command || '';
  const description = messageData.rawInput?.description || '';
  const kind = messageData.kind || '';
  const title = messageData.title || '';

  return (
    fileRelatedTools.some((tool) => toolName.includes(tool)) ||
    kind === 'edit' || // 文件编辑操作
    kind === 'write' || // 文件写入操作
    kind === 'execute' || // 执行命令操作
    command.includes('rm ') || // 删除文件命令
    command.includes('mv ') || // 移动/重命名文件命令
    command.includes('cp ') || // 复制文件命令
    command.includes('mkdir ') || // 创建目录命令
    command.includes('touch ') || // 创建文件命令
    command.includes('echo ') || // 写入文件命令
    command.includes('cat ') || // 读取文件命令
    title.includes('Edit ') || // 编辑文件标题
    title.includes('Write ') || // 写入文件标题
    title.includes('Create ') || // 创建文件标题
    title.includes('Delete ') || // 删除文件标题
    description.includes('删除') ||
    description.includes('创建') ||
    description.includes('移动') ||
    description.includes('重命名') ||
    description.includes('编辑') ||
    description.includes('写入')
  );
};

// 工具函数：获取计划状态统计
export const getPlanStatusStats = (entries: PlanEntry[]) => {
  const stats = {
    total: entries.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  };

  entries.forEach((entry) => {
    switch (entry.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'in_progress':
        stats.in_progress++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  });

  return stats;
};

// 工具函数：获取工具调用状态统计
export const getToolCallStatusStats = (updates: ToolCallUpdateMessage[]) => {
  const stats = {
    total: updates.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  };

  updates.forEach((update) => {
    switch (update.data.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'in_progress':
        stats.in_progress++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  });

  return stats;
};
