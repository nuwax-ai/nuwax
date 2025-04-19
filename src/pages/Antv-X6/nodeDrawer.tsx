import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import { testRunList } from '@/constants/node.constants';
import { ChildNode } from '@/types/interfaces/graph';
import {
  NodeConfig,
  NodeDrawerProps,
  NodeDrawerRef,
} from '@/types/interfaces/node';
import { changeNodeConfig } from '@/utils/updateNode';
import { returnImg } from '@/utils/workflow';
import { Form, FormInstance } from 'antd';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import ComplexNode from './component/complexNode';
import ConditionNode from './component/condition';
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

// 移除 React.FC，直接使用函数组件定义
const NodeDrawer = (
  {
    visible,
    onClose,
    onGetNodeConfig,
    handleNodeChange,
    foldWrapItem,
  }: NodeDrawerProps,
  ref: React.ForwardedRef<NodeDrawerRef>,
) => {
  // 当前节点是否修改了参数
  const { isModified, setIsModified, skillChange } = useModel('workflow');
  // 新增一个变量来保存上一次保存的节点配置
  const lastSavedRef = useRef<string>('');
  // 新增一个变量来保存当前节点的原始配置
  const processingRef = useRef<boolean>(false);
  // 新增定时器引用
  const timerRef = useRef<NodeJS.Timeout>();

  // 将节点的数据 保存到 state 中,维持数据双向绑定,便于管理
  const [currentNodeConfig, setCurrentNodeConfig] =
    useState<ChildNode>(foldWrapItem);

  // 打开重命名的input
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  // 将form表单拿到最上层
  const [form] = Form.useForm<NodeConfig>();

  // form表单校验完毕后提交数据
  // 优化后的onFinish方法
  const onFinish = async () => {
    console.log('onFinish', isModified);
    if (processingRef.current) return;

    try {
      processingRef.current = true;
      const values = form.getFieldsValue(true);
      const currentConfigString = JSON.stringify(values);

      // 避免重复提交相同的数据
      if (currentConfigString === lastSavedRef.current) {
        setIsModified(false);
        return;
      }

      let newNodeConfig;
      if (
        ['QA', 'IntentRecognition', 'Condition'].includes(
          currentNodeConfig.type,
        )
      ) {
        newNodeConfig = {
          ...currentNodeConfig,
          nodeConfig: {
            ...currentNodeConfig.nodeConfig,
            ...changeNodeConfig(
              currentNodeConfig.type,
              values,
              currentNodeConfig.nodeConfig,
            ),
          },
        };
      } else {
        newNodeConfig = {
          ...currentNodeConfig,
          nodeConfig: {
            ...currentNodeConfig.nodeConfig,
            ...values,
          },
        };
      }

      lastSavedRef.current = currentConfigString;
      await onGetNodeConfig(newNodeConfig);
      setIsModified(false);
    } finally {
      processingRef.current = false;
    }
  };

  // 定义关闭逻辑，确保不会因 onGetNodeConfig 调用而陷入循环
  const handleClose = async () => {
    if (isModified && !processingRef.current) {
      await onFinish();
    }
    onClose();
  };

  // 重命名，试运行等操作
  const handleChangeNode = async (val: string) => {
    if (val === 'TestRun' && isModified && !processingRef.current) {
      await onFinish();
    } else if (val === 'Rename') {
      console.log(12312313);
      setShowNameInput(true);
    }
    handleNodeChange(val, foldWrapItem);
  };

  // 修改节点的名称和描述
  const changeFoldWrap = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    if (
      name !== currentNodeConfig.name ||
      description !== currentNodeConfig.description
    ) {
      setCurrentNodeConfig({
        ...currentNodeConfig,
        name: name,
        description: description,
      });
      onGetNodeConfig({
        ...currentNodeConfig,
        name: name,
        description: description,
      });
    }
    setShowNameInput(false);
  };

  // 新增定时器逻辑
  useEffect(() => {
    // 清除已有定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 创建新定时器
    if (isModified && !processingRef.current) {
      timerRef.current = setTimeout(() => {
        onFinish();
      }, 3000);
    }

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isModified]);

  useEffect(() => {
    // 当 foldWrapItem.id 改变时，重新设置 currentNodeConfig
    if (!visible && isModified && !processingRef.current) {
      onFinish(); // 直接调用 onFinish
      setIsModified(false);
    }
  }, [visible]);

  // 优化的useEffect for foldWrapItem changes
  useEffect(() => {
    const handleFoldWrapItemChange = async () => {
      if (foldWrapItem.id && foldWrapItem.id !== currentNodeConfig.id) {
        if (isModified && !processingRef.current) {
          await onFinish();
        }

        const newFoldWrapItem = JSON.parse(JSON.stringify(foldWrapItem));
        setCurrentNodeConfig(newFoldWrapItem);

        // 重置表单状态
        form.resetFields();
        form.setFieldsValue(newFoldWrapItem.nodeConfig);

        // 处理特殊节点的默认值
        if (foldWrapItem.type === 'HTTPRequest') {
          if (!form.getFieldValue('method')) {
            form.setFieldValue('method', 'GET');
          }
          if (!form.getFieldValue('contentType')) {
            form.setFieldValue('contentType', 'JSON');
          }
        } else if (foldWrapItem.type === 'Variable') {
          if (!form.getFieldValue('configType')) {
            form.setFieldValue('configType', 'SET_VARIABLE');
          }
        } else if (foldWrapItem.type === 'QA') {
          if (!form.getFieldValue('answerType')) {
            form.setFieldValue('answerType', 'TEXT');
          }
        }

        lastSavedRef.current = JSON.stringify(form.getFieldsValue(true));
      } else if (
        foldWrapItem.id === currentNodeConfig.id &&
        JSON.stringify(foldWrapItem) !== JSON.stringify(currentNodeConfig)
      ) {
        if (foldWrapItem.type === 'LLM' && skillChange) {
          const currentValues = form.getFieldsValue();
          const newValues = { ...currentValues, ...foldWrapItem.nodeConfig };
          form.setFieldsValue(newValues);
        }
        setCurrentNodeConfig(foldWrapItem);
      }
    };

    handleFoldWrapItemChange();
  }, [foldWrapItem.id, JSON.stringify(foldWrapItem)]);

  // 根据类型返回指定的 ReactNode
  const renderNodeContent = (params: ChildNode, form: FormInstance) => {
    console.log(params.type);

    switch (params.type) {
      case 'Start':
        // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
        return <StartNode type={currentNodeConfig.type} form={form} />;
      case 'DocumentExtraction':
        return (
          <DocumentExtractionNode form={form} type={currentNodeConfig.type} />
        );
      case 'End':
      case 'Output':
        return <EndNode form={form} type={currentNodeConfig.type} />;
      case 'Loop':
        return <CycleNode form={form} />;
      case 'Variable':
        return <VariableNode form={form} />;
      case 'TextProcessing':
        return <TextProcessingNode form={form} />;
      case 'LLM':
        return <ModelNode form={form} />;

      case 'Plugin':
      case 'Workflow':
      case 'LongTermMemory':
        return <PluginInNode type={currentNodeConfig.type} form={form} />;
      case 'Code':
        return <CodeNode form={form} />;
      case 'QA':
        return <QuestionsNode form={form} />;
      case 'HTTPRequest':
        return <HttpToolNode form={form} />;
      case 'Knowledge':
        return <KnowledgeNode form={form} />;
      // 条件分支需要实时的调用接口
      case 'Condition':
        return <ConditionNode form={form} />;
      case 'IntentRecognition':
        return <IntentionNode form={form} />;
      case 'LoopBreak':
        return <LoopBreak />;
      case 'LoopContinue':
        return <LoopContinue />;
      default:
        return;
    }
  };

  useImperativeHandle(ref, () => ({
    getFormValues: () => form.getFieldsValue(true),
    onFinish,
  }));

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
          onFinishFailed={onFinish}
          onFinish={onFinish}
          onValuesChange={() => {
            setIsModified(true);
          }}
        >
          {renderNodeContent(foldWrapItem, form)}
        </Form>
      </div>
    </FoldWrap>
  );
};

// 使用 forwardRef 包裹组件
export default forwardRef(NodeDrawer);
