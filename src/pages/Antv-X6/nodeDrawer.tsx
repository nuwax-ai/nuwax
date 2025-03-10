import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import { testRunList } from '@/constants/node.constants';
import { ChildNode } from '@/types/interfaces/graph';
import { NodeConfig, NodeDrawerProps } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import React, { useEffect, useRef, useState } from 'react';
import ComplexNode from './component/complexNode';
import { ConditionNode } from './component/condition';
import Library from './component/library';
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
  DocumentExtractionNode,
} = NodeItem;
const { ModelNode, IntentionNode, QuestionsNode, HttpToolNode } = ComplexNode;
const { PluginInNode, DatabaseNode } = ReferenceNode;
const { KnowledgeNode } = Library;

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
  referenceList,
  getRefernece,
}) => {
  // 当前节点是否修改了参数
  const [isModified, setIsModified] = useState(false);
  // 将节点的数据 保存到 state 中,维持数据双向绑定,便于管理
  const [currentNodeConfig, setCurrentNodeConfig] =
    useState<ChildNode>(foldWrapItem);

  // 新增定时器引用
  const timerRef = useRef<NodeJS.Timeout>();
  // 修改节点的名称和描述
  const changeFoldWrap = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    setCurrentNodeConfig({
      ...foldWrapItem,
      name: name,
      description: description,
    });
    setIsModified(true);
  };
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
        // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
        return (
          <StartNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
            referenceList={referenceList}
          />
        );
      case 'DocumentExtraction':
        return (
          <DocumentExtractionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
            referenceList={referenceList}
          />
        );
      case 'End':
      case 'Output':
        return (
          <EndNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
            referenceList={referenceList}
          />
        );
      case 'Loop':
        return (
          <CycleNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      case 'Variable':
        return (
          <VariableNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      case 'TextProcessing':
        return (
          <TextProcessingNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      case 'LLM':
        return (
          <ModelNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              )
            }
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
            referenceList={referenceList}
          />
        );
      case 'Code':
        return (
          <CodeNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      case 'QA':
        return (
          <QuestionsNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              )
            }
          />
        );
      case 'HTTPRequest':
        return (
          <HttpToolNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      case 'Knowledge':
        return (
          <KnowledgeNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              )
            }
          />
        );
      case 'Database':
        return (
          <DatabaseNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
          />
        );
      // 条件分支需要实时的调用接口
      case 'Condition':
        return (
          <ConditionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              )
            }
          />
        );
      case 'IntentRecognition':
        return (
          <IntentionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            referenceList={referenceList}
            updateNode={(newNodeConfig) =>
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              )
            }
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

  // 重命名，试运行等操作
  const handleChangeNode = (val: string) => {
    if (val === 'TestRun') {
      onGetNodeConfig(currentNodeConfig, true);
    }
    setTimeout(() => {
      handleNodeChange(val, foldWrapItem);
    });
  };

  useEffect(() => {
    const handleUpdate = async () => {
      if (isModified) {
        await onGetNodeConfig(currentNodeConfig);
        setIsModified(false);
        getRefernece(foldWrapItem);
      } else {
        // 独立处理非修改状态的更新
        setCurrentNodeConfig((prev) => {
          if (visible && (prev.id !== foldWrapItem.id || !prev.id)) {
            getRefernece(foldWrapItem);
          }
          return foldWrapItem;
        });
      }
    };

    handleUpdate();
  }, [foldWrapItem.id, visible]);

  useEffect(() => {
    setCurrentNodeConfig(foldWrapItem);
    console.log('123124', foldWrapItem);
  }, [foldWrapItem]);

  useEffect(() => {
    // 清除已有定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 创建新定时器
    timerRef.current = setInterval(() => {
      if (isModified) {
        onGetNodeConfig(currentNodeConfig);
        setIsModified(false); // 重置修改状态
      }
    }, 3000);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible, currentNodeConfig, isModified]);

  return (
    <FoldWrap
      className="fold-wrap-style"
      lineMargin
      title={currentNodeConfig.name}
      visible={visible}
      onClose={handleClose}
      description={currentNodeConfig.description}
      icon={returnImg(foldWrapItem.type)}
      changeFoldWrap={changeFoldWrap}
      otherAction={
        <OtherOperations
          onChange={handleChangeNode}
          testRun={testRunList.includes(foldWrapItem.type)}
          action={foldWrapItem.type !== 'Start' && foldWrapItem.type !== 'End'}
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
