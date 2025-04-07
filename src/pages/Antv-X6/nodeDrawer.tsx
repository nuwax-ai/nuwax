import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import { testRunList } from '@/constants/node.constants';
import { ChildNode } from '@/types/interfaces/graph';
import { NodeConfig, NodeDrawerProps } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { Form, FormInstance } from 'antd';
import React, { useEffect, useState } from 'react';
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
const { PluginInNode } = ReferenceNode;
const { KnowledgeNode } = Library;

// 定义试运行,后面删除
const LoopContinue: React.FC = () => {
  return <div className="node-title-style">用于终止当前循环，执行下次循环</div>;
};

const LoopBreak: React.FC = () => {
  return (
    <div className="node-title-style">
      用于立即终止当前所在的循环，跳出循环体
    </div>
  );
};

const NodeDrawer: React.FC<NodeDrawerProps> = ({
  visible,
  onClose,
  foldWrapItem,
  onGetNodeConfig, // 新增这一行
  handleNodeChange,
  getRefernece,
}) => {
  // 当前节点是否修改了参数
  const [isModified, setIsModified] = useState(false);
  // 将节点的数据 保存到 state 中,维持数据双向绑定,便于管理
  const [currentNodeConfig, setCurrentNodeConfig] =
    useState<ChildNode>(foldWrapItem);

  // 打开重命名的input
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  // 将form表单拿到最上层
  const [form] = Form.useForm<NodeConfig>();

  // form表单校验完毕后提交数据
  const onFinish = () => {
    const values = form.getFieldsValue(true);

    if (
      !visible ||
      (foldWrapItem.id !== currentNodeConfig.id && currentNodeConfig.id !== 0)
    ) {
      const newNodeConfig = {
        ...currentNodeConfig,
        nodeConfig: {
          ...currentNodeConfig.nodeConfig,
          ...values,
        },
      };
      onGetNodeConfig(newNodeConfig);
    }
  };

  const onFinishFailed = () => {
    if (
      !visible ||
      (foldWrapItem.id !== currentNodeConfig.id && currentNodeConfig.id !== 0)
    ) {
      const values = form.getFieldsValue(true);
      console.log(values, 'onFinishFailed');
      const newNodeConfig = {
        ...currentNodeConfig,
        nodeConfig: {
          ...currentNodeConfig.nodeConfig,
          ...values,
        },
      };
      onGetNodeConfig(newNodeConfig);
    }
  };

  const submit = () => {
    form.submit();
  };

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

  // 重新获取当前的上级节点参数
  const retrieveRefernece = () => {
    getRefernece(foldWrapItem.id);
  };

  // 根据类型返回指定的 ReactNode
  const renderNodeContent = (params: ChildNode, form: FormInstance) => {
    switch (params.type) {
      case 'Start':
        // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
        return (
          <StartNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
            form={form}
          />
        );
      case 'DocumentExtraction':
        return (
          <DocumentExtractionNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
          />
        );
      case 'End':
      case 'Output':
        return (
          <EndNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            type={currentNodeConfig.type}
          />
        );
      case 'Loop':
        return (
          <CycleNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            retrieveRefernece={retrieveRefernece}
          />
        );
      case 'Variable':
        return (
          <VariableNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'TextProcessing':
        return (
          <TextProcessingNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'LLM':
        return (
          <ModelNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            updateNode={(newNodeConfig) => {
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              );
              setCurrentNodeConfig({
                ...currentNodeConfig,
                nodeConfig: newNodeConfig,
              });
            }}
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
            form={form}
          />
        );
      case 'Code':
        return (
          <CodeNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
          />
        );
      case 'QA':
        return (
          <QuestionsNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            updateNode={(newNodeConfig) => {
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              );
              setCurrentNodeConfig({
                ...currentNodeConfig,
                nodeConfig: newNodeConfig,
              });
            }}
          />
        );
      case 'HTTPRequest':
        return (
          <HttpToolNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            form={form}
          />
        );
      case 'Knowledge':
        return (
          <KnowledgeNode
            form={form}
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
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
      // 条件分支需要实时的调用接口
      case 'Condition':
        return (
          <ConditionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            updateNode={(newNodeConfig) => {
              onGetNodeConfig(
                {
                  ...currentNodeConfig,
                  nodeConfig: newNodeConfig,
                },
                true,
              );
              setCurrentNodeConfig({
                ...currentNodeConfig,
                nodeConfig: newNodeConfig,
              });
            }}
          />
        );
      case 'IntentRecognition':
        return (
          <IntentionNode
            params={currentNodeConfig.nodeConfig}
            Modified={handleChangeNodeConfig}
            form={form}
          />
        );
      case 'LoopBreak':
        return <LoopBreak />;
      case 'LoopContinue':
        return <LoopContinue />;
      default:
        return;
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
    } else if (val === 'Rename') {
      // 这里要触发展开input
      setShowNameInput(true);
    }
    setTimeout(() => {
      handleNodeChange(val, foldWrapItem);
    });
  };
  // 当切换节点之前，先保存当前节点的数据，再调用新节点的数据，刷新他的refernect
  // const handleUpdate = async () => {
  //   if (isModified) {
  //     await onGetNodeConfig(currentNodeConfig);
  //     setIsModified(false);
  //   }
  //   getRefernece(foldWrapItem.id);
  // };

  useEffect(() => {
    if (!visible && isModified && currentNodeConfig.id !== 0) {
      submit();
      setIsModified(false); // 重置修改状态
    }
  }, [visible]);

  useEffect(() => {
    if (foldWrapItem.id && foldWrapItem.id !== 0) {
      setCurrentNodeConfig(foldWrapItem);
      // 直接设置表单值而不是通过initialValues
      form.setFieldsValue(foldWrapItem.nodeConfig);
    }

    if (
      foldWrapItem.id !== 0 &&
      currentNodeConfig.id !== 0 &&
      foldWrapItem.id !== currentNodeConfig.id &&
      isModified
    ) {
      submit();
      setIsModified(false); // 重置修改状态
    }
  }, [foldWrapItem.id]);

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
      showNameInput={showNameInput}
      otherAction={
        <OtherOperations
          onChange={handleChangeNode}
          testRun={testRunList.includes(foldWrapItem.type)}
          action={foldWrapItem.type !== 'Start' && foldWrapItem.type !== 'End'}
        />
      }
    >
      <div className="dispose-node-style">
        <Form
          form={form}
          layout={'vertical'}
          onFinishFailed={onFinishFailed}
          onFinish={onFinish}
          onValuesChange={() => setIsModified(true)}
        >
          {renderNodeContent(foldWrapItem, form)}
        </Form>
      </div>
    </FoldWrap>
  );
};

export default NodeDrawer;
