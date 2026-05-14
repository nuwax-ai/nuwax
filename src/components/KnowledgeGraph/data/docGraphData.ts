/**
 * 文档知识图谱 Mock 数据
 * 每个文档对应不同的图谱数据
 */
import type { RawDataItem } from '../types/graph';

// 文档1：人工智能基础
export const aiGraphData: RawDataItem[] = [
  {
    object: '人工智能',
    relations: [
      { relation: '应用领域', content: '自然语言处理' },
      { relation: '应用领域', content: '计算机视觉' },
      { relation: '应用领域', content: '语音识别' },
      { relation: '核心技术', content: '深度学习' },
      { relation: '核心技术', content: '机器学习' },
      { relation: '编程语言', content: 'Python' },
    ],
  },
  {
    object: '深度学习',
    relations: [
      { relation: '框架', content: 'TensorFlow' },
      { relation: '框架', content: 'PyTorch' },
      { relation: '应用', content: '图像识别' },
      { relation: '应用', content: '文本生成' },
    ],
  },
  {
    object: '自然语言处理',
    relations: [
      { relation: '任务', content: '文本分类' },
      { relation: '任务', content: '情感分析' },
      { relation: '任务', content: '机器翻译' },
      { relation: '模型', content: 'BERT' },
      { relation: '模型', content: 'GPT' },
    ],
  },
];

// 文档2：前端开发指南
export const frontendGraphData: RawDataItem[] = [
  {
    object: '前端开发',
    relations: [
      { relation: '框架', content: 'React' },
      { relation: '框架', content: 'Vue' },
      { relation: '框架', content: 'Angular' },
      { relation: '构建工具', content: 'Vite' },
      { relation: '构建工具', content: 'Webpack' },
      { relation: '语言', content: 'JavaScript' },
      { relation: '语言', content: 'TypeScript' },
    ],
  },
  {
    object: 'React',
    relations: [
      { relation: '特点', content: '组件化开发' },
      { relation: '特点', content: '虚拟DOM' },
      { relation: '生态', content: 'Redux' },
      { relation: '生态', content: 'React Router' },
    ],
  },
  {
    object: 'Vue',
    relations: [
      { relation: '特点', content: '渐进式框架' },
      { relation: '特点', content: '响应式数据' },
      { relation: '生态', content: 'Vuex' },
      { relation: '生态', content: 'Vue Router' },
    ],
  },
];

// 根据文档ID获取对应的图谱数据
export const getGraphDataByDocId = (docId: number): RawDataItem[] => {
  switch (docId) {
    case 1:
      return aiGraphData;
    case 2:
      return frontendGraphData;
    default:
      return aiGraphData;
  }
};

// 模拟文档列表数据（用于知识图谱模式）
export const mockGraphDocList = [
  {
    id: 1,
    name: '人工智能基础介绍.md',
    docStatus: 'ANALYZED',
    docStatusCode: 2,
    docStatusDesc: '构建成功',
    docStatusReason: '分析完成',
    entityCount: 18,
    relationCount: 15,
    createTime: '2024-03-15 10:30:00',
    updateTime: '2024-03-15 14:20:00',
  },
  {
    id: 2,
    name: '前端开发指南.docx',
    docStatus: 'ANALYZED',
    docStatusCode: 2,
    docStatusDesc: '构建成功',
    docStatusReason: '分析完成',
    entityCount: 14,
    relationCount: 12,
    createTime: '2024-03-14 14:20:00',
    updateTime: '2024-03-14 16:30:00',
  },
  {
    id: 3,
    name: '产品需求文档.pdf',
    docStatus: 'ANALYZING',
    docStatusCode: 1,
    docStatusDesc: '构建中',
    docStatusReason: '正在分析',
    entityCount: 0,
    relationCount: 0,
    createTime: '2024-03-16 09:00:00',
    updateTime: '2024-03-16 09:00:00',
  },
];
