import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import { ChildNode } from '@/types/interfaces/graph';
import { NodeConfig } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import React, { useEffect, useState } from 'react';
import ComplexNode from './component/complexNode';
import { ConditionNode } from './component/condition';
import NodeItem from './component/nodeItem';
import ReferenceNode from './component/pluginNode';
import './index.less';
const {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
  TextProcessingNode,
  CodeNode,
} = NodeItem;
const { ModelNode, IntentionNode, QuestionsNode, HttpToolNode } = ComplexNode;
const { PluginInNode, KnowledgeNode, DatabaseNode } = ReferenceNode;

interface NodeDrawerProps {
  // 是否显示,关闭右侧弹窗
  visible: boolean;
  // 关闭
  onClose: () => void;
  // 当前的数据
  foldWrapItem: ChildNode;
  // 将节点信息返回给父组件
  onGetNodeConfig: (config: ChildNode) => void;

  handleNodeChange: (action: string, data: ChildNode) => void;
}

// 定义试运行,后面删除
const TestNode: React.FC = () => {
  return <div className="node-title-style">试运行输入</div>;
};

const NodeDrawer: React.FC<NodeDrawerProps> = ({
  visible,
  onClose,
  foldWrapItem,
  onGetNodeConfig, // 新增这一行
  handleNodeChange,
}) => {
  // 当前节点是否修改了参数
  const [isModified, setIsModified] = useState(false);
  // 将节点的数据 保存到 state 中,维持数据双向绑定,便于管理
  const [currentNodeConfig, setCurrentNodeConfig] =
    useState<ChildNode>(foldWrapItem);
  // 修改节点数据
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    if (
      JSON.stringify(currentNodeConfig.nodeConfig) !==
      JSON.stringify(newNodeConfig)
    ) {
      setCurrentNodeConfig({ ...currentNodeConfig, nodeConfig: newNodeConfig });
      setIsModified(true);
    }
  };
  // 根据类型返回指定的 ReactNode
  const renderNodeContent = (params: ChildNode) => {
    switch (params.type) {
      case 'Start':
      case 'DocumentExtraction': // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
        return (
          <StartNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
          />
        );
      case 'End':
      case 'Output':
        return (
          <EndNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
          />
        );
      case 'Loop':
        return (
          <CycleNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'Variable':
        return (
          <VariableNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'TextProcessing':
        return (
          <TextProcessingNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'LLM':
        return (
          <ModelNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );

      case 'Plugin':
      case 'Workflow':
      case 'LongTermMemory':
        return (
          <PluginInNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
          />
        );
      case 'Code':
        return (
          <CodeNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'QA':
        return (
          <QuestionsNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'HTTPRequest':
        return (
          <HttpToolNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'KnowledgeBase':
        return (
          <KnowledgeNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'Database':
        return (
          <DatabaseNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      // 条件分支需要实时的调用接口
      case 'Condition':
        return (
          <ConditionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig({
                ...currentNodeConfig,
                nodeConfig: newNodeConfig,
              })
            }
          />
        );
      case 'IntentRecognition':
        return (
          <IntentionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      default:
        return <TestNode />;
    }
  };

  // 定义关闭逻辑，确保不会因 onGetNodeConfig 调用而陷入循环
  const handleClose = () => {
    if (isModified) {
      onGetNodeConfig(currentNodeConfig);
      setIsModified(false); // 重置修改状态
    }
    onClose();
  };

  useEffect(() => {
    if (visible && isModified) {
      onGetNodeConfig(currentNodeConfig);
      setIsModified(false); // 重置修改状态
    }
    setCurrentNodeConfig(foldWrapItem);
  }, [foldWrapItem.id]);

  useEffect(() => {
    setCurrentNodeConfig(foldWrapItem);
  }, [foldWrapItem]);

  return (
    <FoldWrap
      className="fold-wrap-style"
      lineMargin
      title={foldWrapItem.name}
      visible={visible}
      onClose={handleClose}
      desc={foldWrapItem.description}
      icon={returnImg(foldWrapItem.type)}
      otherAction={
        <OtherOperations
          onChange={(val: string) => handleNodeChange(val, foldWrapItem)}
          testRun
        />
      }
    >
      <div className="dispose-node-style">
        {renderNodeContent(foldWrapItem)}
      </div>
    </FoldWrap>
  );
};

export default NodeDrawer;
