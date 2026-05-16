/**
 * 知识图谱 Mock 数据
 */
import type { RawDataItem } from '../types/graph';

export const mockData: RawDataItem[] = [
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
    object: 'Python',
    relations: [
      { relation: '主要用途', content: 'Web开发' },
      { relation: '主要用途', content: '数据分析' },
      { relation: '主要用途', content: '人工智能' },
      { relation: '流行框架', content: 'Django' },
      { relation: '流行框架', content: 'Flask' },
      { relation: '流行框架', content: 'FastAPI' },
    ],
  },
  {
    object: '数据库',
    relations: [
      { relation: '关系型', content: 'MySQL' },
      { relation: '关系型', content: 'PostgreSQL' },
      { relation: 'NoSQL', content: 'MongoDB' },
      { relation: 'NoSQL', content: 'Redis' },
      { relation: '图数据库', content: 'Neo4j' },
      { relation: '展示内容', content: 'Web开发' },
    ],
  },
  {
    object: '前端开发',
    relations: [
      { relation: '框架', content: 'React' },
      { relation: '框架', content: 'Vue' },
      { relation: '框架', content: 'Angular' },
      { relation: '构建工具', content: 'Vite' },
      { relation: '构建工具', content: 'Webpack' },
      { relation: '开发效果', content: 'Web开发' },
    ],
  },
  {
    object: 'Web开发',
    relations: [
      { relation: 'H5', content: '小网页开发' },
      { relation: '开发', content: '小程序' },
      { relation: '开发', content: '桌面运用' },
      { relation: '开发', content: 'App应用' },
      { relation: '应用', content: '前端开发' },
    ],
  },
  {
    object: '云计算',
    relations: [
      { relation: '服务提供商', content: 'AWS' },
      { relation: '服务提供商', content: 'Azure' },
      { relation: '服务提供商', content: '阿里云' },
      { relation: '核心技术', content: '容器化' },
      { relation: '核心技术', content: 'Kubernetes' },
    ],
  },
];
