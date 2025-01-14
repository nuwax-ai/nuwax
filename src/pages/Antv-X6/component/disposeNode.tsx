import { PlusOutlined } from '@ant-design/icons';
import React from 'react';
import '../index.less';
import ComplexNode from './complexNode';
import NodeItem from './nodeItem';
import ReferenceNode from './pluginNode';
const { StartNode, EndNode, CycleNode, VariableNode, CodeNode } = NodeItem;
const { ModelNode, IntentionNode } = ComplexNode;
const { PluginInNode } = ReferenceNode;

// 定义试运行
const TestNode: React.FC = () => {
  return <div className="node-title-style">试运行输入</div>;
};

interface FoldWarpNodeProps {
  // 当前节点的类型
  type: string;
  // 节点触发事件，通知父组件
  triggerEvent?: () => void;
}

// 分组的数据源
const groupedOptionsData = [
  {
    label: 'Image Models',
    options: [
      {
        icon: <PlusOutlined />,
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
const FoldWarpNode: React.FC<FoldWarpNodeProps> = ({ type }) => {
  console.log(type);
  switch (type) {
    case 'startNode':
      return <StartNode />;
    case 'documentNode':
      return <StartNode type="document" />;
    case 'endNode':
      return <EndNode />;
    case 'processNode':
      return <EndNode type="processNode" />;
    case 'cycleNode':
      return <CycleNode />;
    case 'variableNode':
      return <VariableNode />;
    case 'textNode':
      return <VariableNode type="textNode" />;
    case 'modelNode': {
      return <ModelNode groupedOptionsData={groupedOptionsData} />;
    }
    case 'intentionNode': {
      return <IntentionNode groupedOptionsData={groupedOptionsData} />;
    }
    case 'plugInNode':
      return <PluginInNode />;
    case 'workflowNode':
      return <PluginInNode />;
    case 'memoryNode':
      return <PluginInNode />;
    case 'codeNode':
      return <CodeNode />;
    default:
      return <TestNode />;
  }
};

export default FoldWarpNode;
