import { EN_US } from '../locales/i18n/en-US';

/**
 * 路由配置会在 Umi 读取 config 时于 Node 环境直接执行。
 * 这里不能依赖运行时 i18n service，否则 pre-commit 的配置解析阶段会报模块解析错误。
 * 因此路由名称统一从本地静态词典读取，缺失时回退为 key 本身。
 */
const getRouteLabel = (key: string): string => EN_US[key] || key;

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
      // 新建项目
      {
        path: '/space/:spaceId/create-project',
        component: '@/pages/SpaceCreateProject',
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
      // 待审核的技能详情
      {
        path: '/space/:spaceId/apply/skill-details/:skillId',
        component: '@/pages/ApplySkillDetails',
      },
      // 已发布的技能详情
      {
        path: '/space/:spaceId/published/skill-details/:skillId',
        component: '@/pages/PublishedSkillDetails',
      },
      {
        path: '/space/:spaceId/skill-details-conversation/:skillId',
        component: '@/pages/SkillDetailsConversation',
      },
      { path: '/space/:spaceId/:agentId/log', component: '@/pages/SpaceLog' },
      { path: '/space/:spaceId/library', component: '@/pages/SpaceLibrary' },
      // 组件资源子页面
      {
        path: '/space/:spaceId/plugin',
        component: '@/pages/SpaceResource/Plugin',
      },
      {
        path: '/space/:spaceId/workflow',
        component: '@/pages/SpaceResource/Workflow',
      },
      {
        path: '/space/:spaceId/knowledge',
        component: '@/pages/SpaceResource/Knowledge',
      },
      {
        path: '/space/:spaceId/storage',
        component: '@/pages/SpaceResource/Storage',
      },
      {
        path: '/space/:spaceId/model-manage',
        component: '@/pages/SpaceResource/ModelManage',
      },
      // 资源定价
      {
        path: '/space/:spaceId/resource-pricing',
        component: '@/pages/SpaceResource/Pricing',
      },
      // 智能体用户订阅
      {
        path: '/space/:spaceId/agent-subscriptions',
        component: '@/pages/SpaceResource/AgentSubscriptions',
      },
      // 订阅设置
      {
        path: '/space/:spaceId/subscription-settings',
        component: '@/pages/SpaceResource/SubscriptionSettings',
      },
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
      {
        path: '/more-page',
        name: getRouteLabel('PC.Routes.morePage'),
        routes: [
          {
            path: 'api-key',
            name: 'API KEY',
            component: '@/pages/MorePage/ApiKey',
          },
          {
            path: 'api-key-logs',
            name: 'API Call Logs',
            component: '@/pages/MorePage/ApiKeyLogs',
            hideInMenu: true,
          },
          {
            path: 'my-subscriptions',
            name: getRouteLabel('PC.Routes.mySubscriptions'),
            component: '@/pages/MorePage/MySubscriptions',
          },
          {
            path: 'my-orders',
            name: getRouteLabel('PC.Routes.myOrders'),
            component: '@/pages/MorePage/MyOrders',
          },
          {
            path: 'my-earnings',
            name: getRouteLabel('PC.Routes.myEarnings'),
            component: '@/pages/MorePage/MyEarnings',
          },
          {
            path: 'credit-records',
            name: getRouteLabel('PC.Routes.creditRecords'),
            component: '@/pages/MorePage/CreditRecords',
            hideInMenu: true,
          },
          {
            path: 'usage-stats',
            name: getRouteLabel('PC.Routes.usageStats'),
            component: '@/pages/MorePage/UsageStats',
          },
          {
            path: 'model-permissions',
            name: getRouteLabel('PC.Routes.modelPermissions'),
            component: '@/pages/MorePage/ModelPermissions',
          },
          // 历史会话
          {
            path: 'history-conversation',
            name: getRouteLabel('PC.Routes.historyConversation'),
            component: '@/pages/HistoryConversation',
          },
        ],
      },
      // 系统管理统一管理
      {
        path: '/system',
        name: getRouteLabel('PC.Routes.systemManagement'),
        routes: [
          {
            path: 'dashboard',
            name: getRouteLabel('PC.Routes.systemOverview'),
            component: '@/pages/SystemManagement/Dashboard',
          },
          {
            path: 'task-manage',
            name: getRouteLabel('PC.Routes.taskManagement'),
            component: '@/pages/SystemManagement/TaskManage',
          },
          {
            path: 'user/manage',
            name: getRouteLabel('PC.Routes.userManagement'),
            component: '@/pages/UserManage',
          },
          {
            path: 'publish/audit',
            name: getRouteLabel('PC.Routes.publishAudit'),
            component: '@/pages/PublishAudit',
          },
          {
            path: 'published/manage',
            name: getRouteLabel('PC.Routes.publishedManagement'),
            component: '@/pages/PublishedManage',
          },
          {
            path: 'model/manage',
            name: getRouteLabel('PC.Routes.publicModelManagement'),
            component: '@/pages/GlobalModelManage',
          },
          {
            path: 'model/pricing',
            name: getRouteLabel('PC.Pages.SpaceResourcePricing.pageTitle'),
            component: '@/pages/GlobalModelManage/Pricing',
            hideInMenu: true,
          },
          {
            path: 'model/monitor',
            name: getRouteLabel('PC.Routes.modelMonitor'),
            component: '@/pages/SystemManagement/ModelMonitor',
          },
          {
            path: 'config',
            name: getRouteLabel('PC.Routes.systemConfig'),
            routes: [
              {
                path: 'setting',
                name: getRouteLabel('PC.Routes.systemSetting'),
                component: '@/pages/SystemManagement/SystemConfig/SystemConfig',
              },
              {
                path: 'theme',
                name: getRouteLabel('PC.Routes.themeConfig'),
                component: '@/pages/SystemManagement/SystemConfig/ThemeConfig',
              },
              {
                path: 'sandbox',
                name: getRouteLabel('PC.Routes.sandboxConfig'),
                component:
                  '@/pages/SystemManagement/SystemConfig/SandboxConfig',
              },
              {
                path: 'category',
                name: getRouteLabel('PC.Routes.categoryManagement'),
                component:
                  '@/pages/SystemManagement/SystemConfig/CategoryManage',
              },
              {
                path: 'i18n-lang',
                name: getRouteLabel('PC.Routes.i18nLangManagement'),
                component: '@/pages/SystemManagement/SystemConfig/I18nManage',
              },
              {
                path: 'lang-content/:lang',
                name: getRouteLabel('PC.Routes.i18nLangContent'),
                component: '@/pages/SystemManagement/SystemConfig/LangContent',
              },
            ],
          },
          {
            path: 'content',
            name: getRouteLabel('PC.Routes.contentManagement'),
            routes: [
              {
                path: 'content-space',
                name: getRouteLabel('PC.Routes.contentSpace'),
                component: '@/pages/SystemManagement/Content/Space',
              },
              {
                path: 'content-agent',
                name: getRouteLabel('PC.Routes.contentAgent'),
                component: '@/pages/SystemManagement/Content/Agent',
              },
              {
                path: 'content-web-application',
                name: getRouteLabel('PC.Routes.contentWebApplication'),
                component: '@/pages/SystemManagement/Content/WebApplication',
              },
              {
                path: 'content-knowledge-base',
                name: getRouteLabel('PC.Routes.contentKnowledgeBase'),
                component: '@/pages/SystemManagement/Content/KnowledgeBase',
              },
              {
                path: 'content-data-table',
                name: getRouteLabel('PC.Routes.contentDataTable'),
                component: '@/pages/SystemManagement/Content/DataTable',
              },
              {
                path: 'content-workflow',
                name: getRouteLabel('PC.Routes.contentWorkflow'),
                component: '@/pages/SystemManagement/Content/Workflow',
              },
              {
                path: 'content-plugin',
                name: getRouteLabel('PC.Routes.contentPlugin'),
                component: '@/pages/SystemManagement/Content/Plugin',
              },
              {
                path: 'content-mcp',
                name: 'MCP',
                component: '@/pages/SystemManagement/Content/Mcp',
              },
              {
                path: 'content-skill',
                name: getRouteLabel('PC.Routes.contentSkill'),
                component: '@/pages/SystemManagement/Content/Skill',
              },
            ],
          },
          {
            path: 'menu-permission',
            name: getRouteLabel('PC.Routes.menuPermission'),
            routes: [
              {
                path: 'permission-resources',
                name: getRouteLabel('PC.Routes.permissionResources'),
                component:
                  '@/pages/SystemManagement/MenuPermission/PermissionResources',
              },
              {
                path: 'menu-manage',
                name: getRouteLabel('PC.Routes.menuManage'),
                component: '@/pages/SystemManagement/MenuPermission/MenuManage',
              },
              {
                path: 'role-manage',
                name: getRouteLabel('PC.Routes.roleManage'),
                component: '@/pages/SystemManagement/MenuPermission/RoleManage',
              },
              {
                path: 'user-group-manage',
                name: getRouteLabel('PC.Routes.userGroupManage'),
                component:
                  '@/pages/SystemManagement/MenuPermission/UserGroupManage',
              },
            ],
          },
          {
            path: 'payment-earnings',
            name: getRouteLabel('PC.Routes.devPaymentEarnings'),
            routes: [
              {
                path: 'config',
                name: getRouteLabel('PC.Routes.paymentConfig'),
                component: '@/pages/SystemManagement/PaymentEarnings/Config',
              },
              {
                path: 'merchant-info',
                name: getRouteLabel('PC.Routes.paymentMerchantInfo'),
                component:
                  '@/pages/SystemManagement/PaymentEarnings/MerchantInfo',
              },
              {
                path: 'dev-payment',
                name: getRouteLabel('PC.Routes.devPaymentInfo'),
                component:
                  '@/pages/SystemManagement/PaymentEarnings/DevPayment',
              },
              {
                path: 'earnings-stats',
                name: getRouteLabel('PC.Routes.devEarningsStats'),
                component:
                  '@/pages/SystemManagement/PaymentEarnings/EarningsStats',
              },
              {
                path: 'withdrawal',
                name: getRouteLabel('PC.Routes.devWithdrawal'),
                component:
                  '@/pages/SystemManagement/PaymentEarnings/Withdrawal',
              },
              {
                path: 'orders',
                name: getRouteLabel('PC.Routes.paymentOrders'),
                component: '@/pages/SystemManagement/PaymentEarnings/Orders',
              },
              {
                path: 'earnings-detail',
                name: getRouteLabel('PC.Routes.devEarningsDetail'),
                component:
                  '@/pages/SystemManagement/PaymentEarnings/EarningsDetail',
              },
            ],
          },
          {
            path: 'subscription-credits',
            name: getRouteLabel('PC.Routes.adminSubscriptionCredits'),
            routes: [
              {
                path: 'basic-config',
                name: getRouteLabel('PC.Routes.subsBasicConfig'),
                component:
                  '@/pages/SystemManagement/SubscriptionCredits/BasicConfig',
              },
              {
                path: 'plans',
                name: getRouteLabel('PC.Routes.subsPlans'),
                component: '@/pages/SystemManagement/SubscriptionCredits/Plans',
              },
              {
                path: 'credit-packages',
                name: getRouteLabel('PC.Routes.creditsPackages'),
                component:
                  '@/pages/SystemManagement/SubscriptionCredits/CreditPackages',
              },
              {
                path: 'user-credits',
                name: getRouteLabel('PC.Routes.userCreditsQuery'),
                component:
                  '@/pages/SystemManagement/SubscriptionCredits/UserCredits',
              },
              {
                path: 'credit-records',
                name: getRouteLabel('PC.Routes.creditsRecordsQuery'),
                component:
                  '@/pages/SystemManagement/SubscriptionCredits/CreditRecords',
              },
              {
                path: 'orders',
                name: getRouteLabel('PC.Routes.subsOrders'),
                component:
                  '@/pages/SystemManagement/SubscriptionCredits/Orders',
              },
            ],
          },
          {
            path: 'recommend-manage',
            name: getRouteLabel('PC.Routes.recommendManage'),
            routes: [
              {
                path: 'home',
                name: getRouteLabel('PC.Routes.homeRecommend'),
                component:
                  '@/pages/SystemManagement/RecommendManage/HomeRecommend',
              },
              {
                path: 'official',
                name: getRouteLabel('PC.Routes.officialRecommend'),
                component:
                  '@/pages/SystemManagement/RecommendManage/OfficialRecommend',
              },
              {
                path: 'chatbox',
                name: getRouteLabel('PC.Routes.chatboxRecommend'),
                component: '@/pages/SystemManagement/RecommendManage/Chatbox',
              },
            ],
          },
          {
            path: 'log-query',
            name: getRouteLabel('PC.Routes.logQuery'),
            routes: [
              // {
              //   path: 'operation-log',
              //   name: '操作日志',
              //   component: '@/pages/SystemManagement/LogQuery/OperationLog',
              // },
              {
                path: 'running-log',
                name: getRouteLabel('PC.Routes.runningLog'),
                component: '@/pages/SystemManagement/LogQuery/RunningLog',
              },
            ],
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
    path: '/space/:spaceId/app-dev-design/:projectId',
    component: '@/pages/AppDevDesign',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/space/:spaceId/conversation-agent',
    component: '@/pages/ConversationAgent',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
  },
  {
    path: '/app',
    component: '@/pages/OpenApp/BaseTemplate',
    wrappers: ['@/wrappers/authWithLoading'],
    layout: false,
    routes: [
      {
        path: 'open-iframe-page/:agentId',
        component: '@/pages/OpenIframePage',
      },
      {
        path: ':agentId/my-subscriptions',
        component: '@/pages/OpenApp/MySubscriptions',
      },
      {
        path: ':agentId/credit-records',
        component: '@/pages/OpenApp/CreditRecords',
      },
      {
        path: ':agentId/my-orders',
        component: '@/pages/OpenApp/MyOrders',
      },
      {
        path: ':agentId/usage-stats',
        component: '@/pages/OpenApp/UsageStats',
      },
      {
        path: ':agentId',
        component: '@/pages/OpenApp/AppDetails',
      },
      {
        path: 'chat/:agentId/:id',
        component: '@/pages/Chat',
      },
      {
        path: 'history/conversation/:agentId',
        component: '@/pages/OpenApp/HistoryConversation',
      },
    ],
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
    path: '/examples/message-queue-demo',
    component: '@/examples/MessageQueueDemo',
    layout: false,
  },
  {
    path: '/examples/menu-permission-demo',
    component: '@/examples/MenuPermissionDemo',
    layout: false,
  },
  {
    path: '/examples/agent-intervention-demo',
    component: '@/examples/AgentInterventionDemo',
    layout: false,
  },
];

export default routes;
