const routes = [
  {
    path: '/login',
    component: '@/pages/Login',
    layout: false,
  },
  {
    path: '/verify-code',
    component: '@/pages/VerifyCode',
    layout: false,
  },
  {
    path: '/set-password',
    component: '@/pages/SetPassword',
    layout: false,
  },
  {
    path: '/chat-temp/:chatKey',
    component: '@/pages/ChatTemp',
    layout: false,
  },
  {
    path: '/',
    component: '@/layouts',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
    routes: [
      { path: '/', component: '@/pages/Index' },
      { path: '/home', component: '@/pages/Home' },
      {
        path: '/open-iframe-page/:menuCode',
        component: '@/pages/OpenIframePage',
      },
      { path: '/home/chat/:id/:agentId', component: '@/pages/Chat' },
      { path: '/my-computer-manage', component: '@/pages/MyComputerManage' },
      { path: '/agent/:agentId', component: '@/pages/AgentDetails' },
      { path: '/space', component: '@/pages/Space' },
      { path: '/space/:spaceId/develop', component: '@/pages/SpaceDevelop' },
      // 页面开发
      {
        path: '/space/:spaceId/page-develop',
        component: '@/pages/SpacePageDevelop',
      },
      // 技能管理
      {
        path: '/space/:spaceId/skill-manage',
        component: '@/pages/SpaceSkillManage',
      },
      // 任务中心
      {
        path: '/space/:spaceId/task-center',
        component: '@/pages/SpaceTaskCenter',
      },
      // IM 机器人
      {
        path: '/space/:spaceId/im-channel',
        component: '@/pages/IMChannel',
      },
      {
        path: '/space/:spaceId/skill-details/:skillId',
        component: '@/pages/SkillDetails',
      },
      { path: '/space/:spaceId/:agentId/log', component: '@/pages/SpaceLog' },
      { path: '/space/:spaceId/library', component: '@/pages/SpaceLibrary' },
      // 插件、工作流、MCP日志
      {
        path: '/space/:spaceId/library-log',
        component: '@/pages/SpaceLibraryLog',
      },
      { path: '/space/:spaceId/mcp', component: '@/pages/SpaceMcpManage' },
      {
        path: '/space/:spaceId/mcp/create',
        component: '@/pages/SpaceMcpCreate',
      },
      {
        path: '/space/:spaceId/mcp/edit/:mcpId',
        component: '@/pages/SpaceMcpEdit',
      },
      {
        path: '/space/:spaceId/space-square',
        component: '@/pages/SpaceSquare',
      },
      { path: '/space/:spaceId/team', component: '@/pages/TeamSetting' },
      {
        path: '/space/:spaceId/plugin/:pluginId',
        component: '@/pages/SpacePluginTool',
      },
      {
        path: '/space/:spaceId/plugin/:pluginId/cloud-tool',
        component: '@/pages/SpacePluginCloudTool',
      },
      {
        path: '/space/:spaceId/knowledge/:knowledgeId',
        component: '@/pages/SpaceKnowledge',
      },
      {
        path: '/space/:spaceId/table/:tableId',
        component: '@/pages/SpaceTable',
      },

      { path: '/square', component: '@/pages/Square' },
      // 空间广场-插件详情
      {
        path: '/space/publish/plugin/:pluginId',
        component: '@/pages/Square/PluginDetail',
      },
      // 空间广场-工作流详情
      {
        path: '/space/publish/workflow/:workflowId',
        component: '@/pages/Square/WorkflowIdDetail',
      },
      // 空间广场-技能详情
      {
        path: '/space/publish/skill/:skillId',
        component: '@/pages/Square/SkillDetail',
      },
      // 广场-插件详情
      {
        path: '/square/publish/plugin/:pluginId',
        component: '@/pages/Square/PluginDetail',
      },
      // 广场-工作流详情
      {
        path: '/square/publish/workflow/:workflowId',
        component: '@/pages/Square/WorkflowIdDetail',
      },
      // 广场-技能详情
      {
        path: '/square/publish/skill/:skillId',
        component: '@/pages/Square/SkillDetail',
      },
      {
        path: '/history-conversation',
        component: '@/pages/HistoryConversation',
      },
      // 系统管理统一管理
      {
        path: '/system',
        name: '系统管理',
        routes: [
          {
            path: 'dashboard',
            name: '系统概览',
            component: '@/pages/SystemManagement/Dashboard',
          },
          {
            path: 'task-manage',
            name: '任务管理',
            component: '@/pages/SystemManagement/TaskManage',
          },
          {
            path: 'user/manage',
            name: '用户管理',
            component: '@/pages/UserManage',
          },
          {
            path: 'publish/audit',
            name: '发布审核',
            component: '@/pages/PublishAudit',
          },
          {
            path: 'published/manage',
            name: '已发布管理',
            component: '@/pages/PublishedManage',
          },
          {
            path: 'model/manage',
            name: '公共模型管理',
            component: '@/pages/GlobalModelManage',
          },
          {
            path: 'config',
            name: '系统配置',
            routes: [
              {
                path: 'setting',
                name: '系统设置',
                component: '@/pages/SystemManagement/SystemConfig/SystemConfig',
              },
              {
                path: 'theme',
                name: '主题配置',
                component: '@/pages/SystemManagement/SystemConfig/ThemeConfig',
              },
              {
                path: 'sandbox',
                name: '沙盒配置',
                component:
                  '@/pages/SystemManagement/SystemConfig/SandboxConfig',
              },
              {
                path: 'category',
                name: '分类管理',
                component:
                  '@/pages/SystemManagement/SystemConfig/CategoryManage',
              },
            ],
          },
          {
            path: 'content',
            name: '内容管理',
            routes: [
              {
                path: 'content-space',
                name: '空间',
                component: '@/pages/SystemManagement/Content/Space',
              },
              {
                path: 'content-agent',
                name: '智能体',
                component: '@/pages/SystemManagement/Content/Agent',
              },
              {
                path: 'content-web-application',
                name: '网页应用',
                component: '@/pages/SystemManagement/Content/WebApplication',
              },
              {
                path: 'content-knowledge-base',
                name: '知识库',
                component: '@/pages/SystemManagement/Content/KnowledgeBase',
              },
              {
                path: 'content-data-table',
                name: '数据表',
                component: '@/pages/SystemManagement/Content/DataTable',
              },
              {
                path: 'content-workflow',
                name: '工作流',
                component: '@/pages/SystemManagement/Content/Workflow',
              },
              {
                path: 'content-plugin',
                name: '插件',
                component: '@/pages/SystemManagement/Content/Plugin',
              },
              {
                path: 'content-mcp',
                name: 'MCP',
                component: '@/pages/SystemManagement/Content/Mcp',
              },
              {
                path: 'content-skill',
                name: '技能',
                component: '@/pages/SystemManagement/Content/Skill',
              },
            ],
          },
          {
            path: 'menu-permission',
            name: '菜单权限',
            routes: [
              {
                path: 'permission-resources',
                name: '权限资源',
                component:
                  '@/pages/SystemManagement/MenuPermission/PermissionResources',
              },
              {
                path: 'menu-manage',
                name: '菜单管理',
                component: '@/pages/SystemManagement/MenuPermission/MenuManage',
              },
              {
                path: 'role-manage',
                name: '角色管理',
                component: '@/pages/SystemManagement/MenuPermission/RoleManage',
              },
              {
                path: 'user-group-manage',
                name: '用户组管理',
                component:
                  '@/pages/SystemManagement/MenuPermission/UserGroupManage',
              },
            ],
          },
          {
            path: 'log-query',
            name: '日志查询',
            routes: [
              // {
              //   path: 'operation-log',
              //   name: '操作日志',
              //   component: '@/pages/SystemManagement/LogQuery/OperationLog',
              // },
              {
                path: 'running-log',
                name: '运行日志',
                component: '@/pages/SystemManagement/LogQuery/RunningLog',
              },
            ],
          },
        ],
      },
      // 生态市场
      {
        path: '/ecosystem',
        name: '生态市场',
        access: 'canAdmin',
        routes: [
          {
            path: '/ecosystem/plugin',
            name: '插件',
            component: '@/pages/EcosystemPlugin',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem/template',
            name: '模板',
            component: '@/pages/EcosystemTemplate',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem/mcp',
            name: 'MCP',
            component: '@/pages/EcosystemMcp',
            access: 'canAdmin',
          },
          {
            path: '/ecosystem',
            redirect: '/ecosystem/mcp',
          },
        ],
      },
    ],
  },
  {
    path: '/space/:spaceId/workflow/:workflowId',
    component: '@/pages/Antv-X6',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/space/:spaceId/agent/:agentId',
    component: '@/pages/EditAgent',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/space/:spaceId/app-dev/:projectId',
    component: '@/pages/AppDev',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/license-expired',
    component: '@/pages/403',
    layout: false,
  },
  {
    path: '/*',
    component: '@/pages/404',
    layout: false,
  },
  {
    path: '/examples',
    component: '@/examples/index',
    layout: false,
  },
  {
    path: '/examples/antd-showcase',
    component: '@/examples/AntdComponentsShowcase',
    layout: false,
  },
  {
    path: '/examples/svg-icon-showcase',
    component: '@/examples/SvgIconShowcase',
    layout: false,
  },
  {
    path: '/examples/tiptap-variable-input-test',
    component: '@/examples/TiptapVariableInputTest/index',
    layout: false,
  },
  {
    path: '/examples/vnc-preview-demo',
    component: '@/examples/VncPreviewDemo',
    layout: false,
  },
  {
    path: '/examples/file-preview-demo',
    component: '@/examples/file-preview-demo',
    layout: false,
  },
  {
    path: '/examples/empty-state-showcase',
    component: '@/examples/EmptyStateShowcase',
    layout: false,
  },
  {
    path: '/examples/sse-streaming-test',
    component: '@/examples/SSEStreamingTest',
    layout: false,
  },
  {
    path: '/examples/menu-permission-demo',
    component: '@/examples/MenuPermissionDemo',
    layout: false,
  },
];

export default routes;
