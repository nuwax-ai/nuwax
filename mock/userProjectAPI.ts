/**
 * 项目管理分页查询 mock（后端 /api/user-project/page-query 未就绪期间的 dev 供数）。
 * 内存数据支持：按 projectType 过滤、name 模糊匹配、created 增补（真实创建接口
 * /api/project/create 与 /api/userapp/create 不在此拦截，走 test 后端）。
 */
import { S } from './utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const projectStore = [
  {
    id: 9001,
    spaceId: 0,
    projectType: 'NormalProject',
    name: '数据看板改版',
    description: '常规项目：现有管理后台的数据看板重构',
    icon: '',
    publishStatus: 0,
    modified: '2026-09-08T14:20:00',
    created: '2026-09-06T10:00:00',
  },
  {
    id: 9002,
    spaceId: 0,
    projectType: 'PageApp',
    name: '官网落地页',
    description: '网页应用：产品官网与活动落地页',
    icon: '',
    publishStatus: 1,
    modified: '2026-09-08T11:30:00',
    created: '2026-09-05T09:00:00',
  },
  {
    id: 9003,
    spaceId: 0,
    projectType: 'UserApp',
    name: '客户管理系统',
    description: '全栈应用：客户资料与跟进记录管理',
    icon: '',
    publishStatus: 0,
    modified: '2026-09-07T18:00:00',
    created: '2026-09-04T15:00:00',
  },
  {
    id: 9004,
    spaceId: 0,
    projectType: 'NormalProject',
    name: 'API 网关迁移',
    description: '常规项目：服务网关切换与回归验证',
    icon: '',
    publishStatus: 0,
    modified: '2026-09-07T09:40:00',
    created: '2026-09-03T09:00:00',
  },
  {
    id: 9005,
    spaceId: 0,
    projectType: 'UserApp',
    name: '库存预警工具',
    description: '全栈应用：库存阈值监控与消息通知',
    icon: '',
    publishStatus: 1,
    modified: '2026-09-06T16:10:00',
    created: '2026-09-02T14:00:00',
  },
];

export default {
  'POST /api/user-project/page-query': (req: any, res: any) => {
    const { queryFilter = {}, current = 1, pageSize = 10 } = req.body || {};
    const { projectType, name } = queryFilter;

    let records = projectStore.filter(
      (item) => !projectType || item.projectType === projectType,
    );
    if (name) {
      records = records.filter((item) => item.name.includes(name));
    }
    records = [...records].sort((a, b) =>
      (b.modified || '').localeCompare(a.modified || ''),
    );

    const start = (Number(current) - 1) * Number(pageSize);
    res.json(
      S({
        records: records.slice(start, start + Number(pageSize)),
        total: records.length,
        current: Number(current),
        size: Number(pageSize),
      }),
    );
  },
};
