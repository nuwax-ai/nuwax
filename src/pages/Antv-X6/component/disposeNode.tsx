import { ChildNode } from '@/types/interfaces/workflow';
import { CaretRightOutlined, PlusOutlined } from '@ant-design/icons';
import React from 'react';
import '../index.less';
import ComplexNode from './complexNode';
import NodeItem from './nodeItem';
import ReferenceNode from './pluginNode';
const { StartNode, EndNode, CycleNode, VariableNode, CodeNode } = NodeItem;
const { ModelNode, IntentionNode, QuestionsNode, HttpToolNode } = ComplexNode;
const { PluginInNode, KnowledgeNode, DatabaseNode } = ReferenceNode;

// 定义试运行
const TestNode: React.FC = () => {
  return <div className="node-title-style">试运行输入</div>;
};

interface FoldWarpNodeProps {
  // 当前节点的参数
  params: ChildNode;
  // 节点触发事件，通知父组件
  triggerEvent?: () => void;
}

// 分组的数据源
const groupedOptionsData = [
  {
    label: 'Image Models',
    options: [
      {
        icon: <CaretRightOutlined />,
        label: 'Image Processing',
        value: 'ImageProcessing',
        size: '10MB',
        modelName: 'VGG16',
        desc: 'A popular convolutional neural network for image recognition.',
        tagList: ['CNN', 'Image Recognition', 'Transfer Learning'],
      },
      // 更多图像模型...
    ],
  },
  {
    label: 'Text Models',
    options: [
      {
        icon: <PlusOutlined />,
        label: 'Text Analysis',
        value: 'textAnalysis',
        size: '5MB',
        modelName: 'BERT',
        desc: 'Bidirectional Encoder Representations from Transformers for NLP tasks.',
        tagList: ['NLP', 'Text Classification', 'Pre-trained'],
      },
      // 更多文本模型...
    ],
  },
  {
    label: 'Audio Models',
    options: [
      {
        icon: <PlusOutlined />,
        label: 'Audio Detection',
        value: 'AudioDetection',
        size: '8MB',
        modelName: 'WaveNet',
        desc: 'Generative model for raw audio waveforms.',
        tagList: ['Audio', 'Waveform Generation', 'Deep Learning'],
      },
    ],
  },
];

// FoldWarpNode 函数根据 type 返回指定的 ReactNode
const FoldWarpNode: React.FC<FoldWarpNodeProps> = ({ params }) => {
  switch (params.type) {
    case 'Start':
      return <StartNode params={params} />;
    case 'DocumentExtraction':
      return <StartNode params={params} />;
    case 'End':
      return <EndNode params={params} />;
    case 'Output':
      return <EndNode params={params} />;
    case 'Loop':
      return <CycleNode params={params} />;
    case 'Variable':
      return <VariableNode params={params} />;
    case 'TextProcessing':
      return <VariableNode params={params} />;
    case 'LLM': {
      return (
        <ModelNode groupedOptionsData={groupedOptionsData} params={params} />
      );
    }
    case 'IntentRecognition': {
      return (
        <IntentionNode
          groupedOptionsData={groupedOptionsData}
          params={params}
        />
      );
    }
    case 'Plugin':
      return <PluginInNode params={params} />;
    case 'Workflow':
      return <PluginInNode params={params} />;
    case 'LongTermMemory':
      return <PluginInNode params={params} />;
    case 'Code':
      return <CodeNode params={params} />;
    case 'QA':
      return <QuestionsNode params={params} />;
    case 'HTTPRequest':
      return <HttpToolNode params={params} />;
    case 'KnowledgeBase':
      return <KnowledgeNode params={params} />;
    case 'Database':
      return <DatabaseNode params={params} />;

    default:
      return <TestNode />;
  }
};

export default FoldWarpNode;
