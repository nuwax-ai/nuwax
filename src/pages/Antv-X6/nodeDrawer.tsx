import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import { testRunList } from '@/constants/node.constants';
import { ChildNode } from '@/types/interfaces/graph';
import { NodeConfig, NodeDrawerProps } from '@/types/interfaces/node';
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
  ref: React.ForwardedRef<{ getFormValues: () => NodeConfig }>,
) => {
  // 当前节点是否修改了参数
  const { isModified, setIsModified } = useModel('workflow');
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
  const onFinish = () => {
    const values = form.getFieldsValue(true);
    let newNodeConfig;
    if (
      currentNodeConfig.type === 'QA' ||
      currentNodeConfig.type === 'IntentRecognition' ||
      currentNodeConfig.type === 'Condition'
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
    onGetNodeConfig(newNodeConfig);
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
      ...currentNodeConfig,
      name: name,
      description: description,
    });
    setIsModified(true);
  };

  // 重新获取当前的上级节点参数
  // const retrieveRefernece = () => {
  //   getRefernece(foldWrapItem.id);
  // };

  // 根据类型返回指定的 ReactNode
  const renderNodeContent = (params: ChildNode, form: FormInstance) => {
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

  // 定义关闭逻辑，确保不会因 onGetNodeConfig 调用而陷入循环
  const handleClose = () => {
    if (isModified) {
      onGetNodeConfig(currentNodeConfig);
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

  useImperativeHandle(ref, () => ({
    getFormValues: () => form.getFieldsValue(true),
  }));

  // 新增定时器逻辑
  useEffect(() => {
    // 清除已有定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 创建新定时器
    timerRef.current = setInterval(() => {
      if (isModified) {
        form.submit();
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

  useEffect(() => {
    // 当 foldWrapItem.id 改变时，重新设置 currentNodeConfig
    if (!visible && isModified) {
      form.submit();
      setIsModified(false);
    }
  }, [visible]);

  useEffect(() => {
    if (foldWrapItem.id && foldWrapItem.id !== 0) {
      // 对比新旧 foldWrapItem，仅在必要时更新
      if (JSON.stringify(foldWrapItem) !== JSON.stringify(currentNodeConfig)) {
        if (foldWrapItem.id === currentNodeConfig.id) {
          const currentValues = form.getFieldsValue(); // 获取当前表单值
          const newValues = { ...currentValues }; // 创建一个副本用于更新

          // 更新表单值（仅当节点类型匹配时）
          if (['LLM', 'Knowledge'].includes(foldWrapItem.type)) {
            form.setFieldsValue(newValues);
          }
        }

        // 更新当前节点配置
        setCurrentNodeConfig(foldWrapItem);
      }
    }
  }, [JSON.stringify(foldWrapItem)]); // 监听 foldWrapItem 的变化

  // 监听 foldWrapItem.id 的变化，而不是整个 foldWrapItem
  useEffect(() => {
    if (foldWrapItem.id !== currentNodeConfig.id && foldWrapItem.id !== 0) {
      // 清空表单值
      form.resetFields();
      // 设置新的表单值
      form.setFieldsValue(foldWrapItem.nodeConfig);
      // 特殊处理 HTTPRequest 节点
      if (foldWrapItem.type === 'HTTPRequest') {
        if (form.getFieldValue('method') === undefined) {
          form.setFieldValue('method', 'GET');
        }
        if (form.getFieldValue('contentType') === undefined) {
          form.setFieldValue('contentType', 'JSON');
        }
      }
    }
  }, [foldWrapItem.id]); // 监听 id 和 nodeConfig 的变化

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
