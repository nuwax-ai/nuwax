import { ApiKeyItem } from './index';

export const MOCK_API_KEYS: ApiKeyItem[] = [
  {
    id: '1',
    name: '默认密钥',
    description: '用于系统核心后端的数据交换交互模型管理节点',
    apiKey: 'sk-prod-a82kdh93kals92kdkals92kdn4o5',
    status: 'active',
    createTime: '2026-03-25 10:24:38',
    expireTime: '永不过期',
  },
  {
    id: '2',
    name: '测试环境',
    description: '仅用于 dev 环境联调测试，请勿在正式环境中使用',
    apiKey: 'sk-prod-9e1d8ckals92kfdf2a71d8e92000',
    status: 'inactive',
    createTime: '2025-05-18 14:30:15',
    expireTime: '2026-05-18 14:30:15',
  },
  {
    id: '3',
    name: '过期密钥',
    description: '历史遗留配置，已不可使用',
    apiKey: 'sk-prod-8dka93kdkals92kfdf2a71aaaaaa',
    status: 'expired',
    createTime: '2024-01-10 12:00:00',
    expireTime: '2025-01-10 12:00:00',
  },
];
