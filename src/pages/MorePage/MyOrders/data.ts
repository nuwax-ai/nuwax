export enum OrderStatus {
  SETTLED = 'settled',
  SETTLING = 'settling',
}

export interface OrderItemData {
  id: string;
  orderNo: string;
  title: string;
  amount: number;
  income: number;
  commission?: number;
  createdAt: string;
  user: string;
  status: OrderStatus;
}

export const MOCK_ORDERS: OrderItemData[] = [
  {
    id: '1',
    orderNo: 'SAL20260426001',
    title: '智能文档摘要 · 订阅收入',
    amount: 19.9,
    income: 19.9,
    createdAt: '2026-04-26 08:30:00',
    user: 'tech_**ing',
    status: OrderStatus.SETTLED,
  },
  {
    id: '2',
    orderNo: 'SAL20260425002',
    title: 'API调用 · Token消耗分成',
    amount: 126.5,
    income: 113.8,
    commission: 12.65,
    createdAt: '2026-04-25 23:50:00',
    user: 'cloud****',
    status: OrderStatus.SETTLING,
  },
  {
    id: '3',
    orderNo: 'SAL20260424003',
    title: '合同审查助手 · 订阅收入',
    amount: 39.9,
    income: 39.9,
    createdAt: '2026-04-24 14:20:00',
    user: 'law_**firm',
    status: OrderStatus.SETTLED,
  },
  {
    id: '4',
    orderNo: 'SAL20260423004',
    title: 'Web搜索工具 · API调用',
    amount: 45,
    income: 40.5,
    commission: 4.5,
    createdAt: '2026-04-23 16:45:00',
    user: 'dev_**123',
    status: OrderStatus.SETTLED,
  },
  {
    id: '5',
    orderNo: 'SAL20260422005',
    title: '数据可视化 · 订阅收入',
    amount: 29.9,
    income: 29.9,
    createdAt: '2026-04-22 10:00:00',
    user: 'data_**inc',
    status: OrderStatus.SETTLED,
  },
  {
    id: '6',
    orderNo: 'SAL20260421006',
    title: 'AI绘画助手 · 订阅收入',
    amount: 29.9,
    income: 29.9,
    createdAt: '2026-04-21 09:15:00',
    user: 'art_**user',
    status: OrderStatus.SETTLED,
  },
];
