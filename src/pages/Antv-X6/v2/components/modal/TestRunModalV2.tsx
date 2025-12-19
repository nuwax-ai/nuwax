/**
 * V2 试运行弹窗组件
 * 用于配置和执行工作流试运行
 * 完全独立，不依赖 v1 任何代码
 */

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CompressOutlined,
  ExpandOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import type { WorkflowDataV2 } from '../../types';

import './TestRunModalV2.less';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// ==================== 类型定义 ====================

/** 运行状态 */
export type RunStatus = 'idle' | 'running' | 'success' | 'failed' | 'stopped';

/** 节点运行结果 */
export interface NodeRunResult {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: number;
  endTime?: number;
  duration?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

/** 运行结果 */
export interface RunResult {
  status: RunStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  nodeResults: NodeRunResult[];
  finalOutput?: Record<string, any>;
  error?: string;
}

export interface TestRunModalV2Props {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 工作流数据 */
  workflowData: WorkflowDataV2;
  /** 执行试运行 */
  onRun?: (inputValues: Record<string, any>) => Promise<void>;
  /** 停止运行 */
  onStop?: () => Promise<void>;
  /** 运行状态 */
  runStatus?: RunStatus;
  /** 运行结果 */
  runResult?: RunResult;
}

// ==================== 组件实现 ====================

const TestRunModalV2: React.FC<TestRunModalV2Props> = ({
  open,
  onClose,
  workflowData,
  onRun,
  onStop,
  runStatus = 'idle',
  runResult,
}) => {
  const [form] = Form.useForm();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 获取开始节点：优先从 nodeList 查找，回退到 metadata
  const startNode = useMemo(() => {
    // 从 nodeList 中查找 Start 类型的节点
    const startNodeFromList = workflowData?.nodeList?.find(
      (node) => node.type === 'Start',
    );
    if (startNodeFromList) {
      return startNodeFromList;
    }
    // 回退到 metadata 中的 startNode
    return workflowData?.metadata?.startNode;
  }, [workflowData]);

  // 获取输入参数
  const inputArgs = startNode?.nodeConfig?.inputArgs || [];

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
      // 设置默认值（使用 bindValue 作为默认值）
      const defaultValues: Record<string, any> = {};
      inputArgs.forEach((arg) => {
        if (arg.bindValue !== undefined && arg.bindValue !== null) {
          defaultValues[arg.name] = arg.bindValue;
        }
      });
      form.setFieldsValue(defaultValues);
    }
  }, [open, inputArgs]);

  // 执行试运行
  const handleRun = async () => {
    try {
      const values = await form.validateFields();
      await onRun?.(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 停止运行
  const handleStop = async () => {
    try {
      await onStop?.();
      message.info('已停止运行');
    } catch (error) {
      message.error('停止失败');
    }
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const config: Record<
      string,
      { color: string; text: string; icon: React.ReactNode }
    > = {
      pending: { color: 'default', text: '等待中', icon: null },
      running: {
        color: 'processing',
        text: '运行中',
        icon: <LoadingOutlined />,
      },
      success: {
        color: 'success',
        text: '成功',
        icon: <CheckCircleOutlined />,
      },
      failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
      skipped: { color: 'warning', text: '跳过', icon: null },
    };
    const item = config[status] || config.pending;
    return (
      <Tag color={item.color} icon={item.icon}>
        {item.text}
      </Tag>
    );
  };

  // 渲染输入表单
  const renderInputForm = () => {
    if (inputArgs.length === 0) {
      return (
        <div className="test-run-modal-v2-empty">该工作流没有输入参数</div>
      );
    }

    return (
      <Form form={form} layout="vertical" className="test-run-modal-v2-form">
        {inputArgs.map((arg) => (
          <Form.Item
            key={arg.key || arg.name}
            name={arg.name}
            label={
              <Space>
                <span>{arg.name}</span>
                <Tag color="#C9CDD4">{arg.dataType}</Tag>
                {arg.require && <span style={{ color: '#ff4d4f' }}>*</span>}
              </Space>
            }
            rules={[
              {
                required: arg.require,
                message: `请输入 ${arg.name}`,
              },
            ]}
            extra={arg.description}
          >
            {arg.dataType === 'Object' ||
            String(arg.dataType).startsWith('Array') ? (
              <TextArea
                rows={4}
                placeholder={`请输入 JSON 格式的 ${arg.dataType}`}
              />
            ) : (
              <Input placeholder={`请输入 ${arg.name}`} />
            )}
          </Form.Item>
        ))}
      </Form>
    );
  };

  // 渲染运行结果
  const renderRunResult = () => {
    if (!runResult) return null;

    return (
      <div className="test-run-modal-v2-result">
        {/* 总体状态 */}
        <div className="test-run-modal-v2-result-summary">
          <Space>
            <Text strong>运行状态:</Text>
            {getStatusTag(runResult.status)}
            {runResult.duration && (
              <Text type="secondary">耗时: {runResult.duration}ms</Text>
            )}
          </Space>
        </div>

        {/* 错误信息 */}
        {runResult.error && (
          <div className="test-run-modal-v2-result-error">
            <Text type="danger">{runResult.error}</Text>
          </div>
        )}

        {/* 节点执行详情 */}
        <Collapse
          className="test-run-modal-v2-result-nodes"
          defaultActiveKey={runResult.nodeResults
            .filter((n) => n.status === 'failed')
            .map((n) => n.nodeId)}
        >
          {runResult.nodeResults.map((node) => (
            <Panel
              key={node.nodeId}
              header={
                <Space>
                  <span>{node.nodeName}</span>
                  {getStatusTag(node.status)}
                  {node.duration && (
                    <Text type="secondary">{node.duration}ms</Text>
                  )}
                </Space>
              }
            >
              {node.input && (
                <div className="test-run-modal-v2-result-section">
                  <Text strong>输入:</Text>
                  <Paragraph>
                    <pre>{JSON.stringify(node.input, null, 2)}</pre>
                  </Paragraph>
                </div>
              )}
              {node.output && (
                <div className="test-run-modal-v2-result-section">
                  <Text strong>输出:</Text>
                  <Paragraph>
                    <pre>{JSON.stringify(node.output, null, 2)}</pre>
                  </Paragraph>
                </div>
              )}
              {node.error && (
                <div className="test-run-modal-v2-result-section">
                  <Text type="danger">错误: {node.error}</Text>
                </div>
              )}
            </Panel>
          ))}
        </Collapse>

        {/* 最终输出 */}
        {runResult.finalOutput && (
          <div className="test-run-modal-v2-result-final">
            <Divider>最终输出</Divider>
            <Paragraph>
              <pre>{JSON.stringify(runResult.finalOutput, null, 2)}</pre>
            </Paragraph>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="test-run-modal-v2-header">
          <Space>
            <PlayCircleOutlined />
            <span>试运行</span>
          </Space>
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={toggleFullscreen}
          />
        </div>
      }
      open={open}
      onCancel={onClose}
      width={isFullscreen ? '100%' : 720}
      className={`test-run-modal-v2 ${isFullscreen ? 'fullscreen' : ''}`}
      footer={
        <div className="test-run-modal-v2-footer">
          <Button onClick={onClose}>关闭</Button>
          {runStatus === 'running' ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRun}
              loading={runStatus === 'running'}
            >
              运行
            </Button>
          )}
        </div>
      }
      destroyOnClose
    >
      <Spin spinning={runStatus === 'running'} tip="运行中...">
        <div className="test-run-modal-v2-content">
          {/* 输入参数 */}
          <div className="test-run-modal-v2-section">
            <Text strong className="test-run-modal-v2-section-title">
              输入参数
            </Text>
            {renderInputForm()}
          </div>

          {/* 运行结果 */}
          {runResult && (
            <div className="test-run-modal-v2-section">
              <Text strong className="test-run-modal-v2-section-title">
                运行结果
              </Text>
              {renderRunResult()}
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default TestRunModalV2;
