/**
 * V2 知识库节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import {
  DeleteOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Slider,
  Tooltip,
  Typography,
} from 'antd';
import React, { useCallback } from 'react';

import type {
  ChildNodeV2,
  InputAndOutConfigV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import OutputArgsDisplayV2 from '../../common/OutputArgsDisplayV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

import './KnowledgeNodePanelV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

export interface KnowledgeNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

/** 知识库配置项 */
interface KnowledgeBaseConfig {
  knowledgeBaseId: number;
  name: string;
  description?: string;
  type?: string;
}

// ==================== 常量定义 ====================

const SEARCH_STRATEGY_OPTIONS = [
  { label: '语义检索', value: 'SEMANTIC' },
  { label: '全文检索', value: 'FULL_TEXT' },
  { label: '混合检索', value: 'MIXED' },
];

const DEFAULT_INPUT_ARGS_DESC = '检索关键词';
const KBC_FORM_KEY = 'knowledgeBaseConfigs';
const KBC_INPUT_ARGS_KEY = 'inputArgs';

// ==================== 组件实现 ====================

const KnowledgeNodePanelV2: React.FC<KnowledgeNodePanelV2Props> = ({
  node: _node,
  referenceData,
}) => {
  const form = Form.useFormInstance();

  // 监听知识库配置变化
  const knowledgeBaseConfigs: KnowledgeBaseConfig[] =
    Form.useWatch(KBC_FORM_KEY, form) || [];
  const outputArgs: InputAndOutConfigV2[] =
    Form.useWatch('outputArgs', form) || [];

  // 获取输入参数并添加默认描述
  const inputArgs = (form?.getFieldValue(KBC_INPUT_ARGS_KEY) || []).map(
    (item: InputAndOutConfigV2) => ({
      ...item,
      description: item.description || DEFAULT_INPUT_ARGS_DESC,
    }),
  );

  /**
   * 添加知识库（临时用本地表单，后续可接入选择器）
   */
  const handleAddKnowledge = useCallback(() => {
    const current = form.getFieldValue(KBC_FORM_KEY) || [];
    form.setFieldsValue({
      [KBC_FORM_KEY]: [
        ...current,
        {
          knowledgeBaseId: undefined,
          name: '',
          description: '',
          searchStrategy: 'SEMANTIC',
        },
      ],
    });
  }, [form]);

  /**
   * 移除知识库
   */
  const handleRemoveKnowledge = useCallback(
    (knowledgeBaseId: number) => {
      const current = form.getFieldValue(KBC_FORM_KEY) || [];
      form.setFieldValue(
        KBC_FORM_KEY,
        current.filter(
          (k: KnowledgeBaseConfig) => k.knowledgeBaseId !== knowledgeBaseId,
        ),
      );
    },
    [form],
  );

  return (
    <div className="knowledge-node-panel-v2">
      {/* 输入参数 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输入</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            检索关键词
          </Text>
        </div>

        {inputArgs.length > 0 ? (
          inputArgs.map((arg: InputAndOutConfigV2, index: number) => (
            <Form.Item
              key={arg.key || index}
              name={[KBC_INPUT_ARGS_KEY, index, 'bindValue']}
              label={arg.name}
              tooltip={arg.description}
            >
              <VariableSelectorV2
                referenceData={referenceData}
                placeholder="输入或引用变量"
              />
            </Form.Item>
          ))
        ) : (
          <Form.Item
            name={[KBC_INPUT_ARGS_KEY, 0, 'bindValue']}
            rules={[{ required: true, message: '请输入检索关键词' }]}
          >
            <VariableSelectorV2
              referenceData={referenceData}
              placeholder="输入检索关键词"
            />
          </Form.Item>
        )}
      </div>

      {/* 知识库选择 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>知识库</Text>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddKnowledge}
          >
            添加
          </Button>
        </div>

        <Form.List name={KBC_FORM_KEY}>
          {(fields, { add, remove }) => (
            <div className="knowledge-node-panel-v2-list">
              {fields.length === 0 && (
                <Empty
                  description="暂未选择知识库"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        knowledgeBaseId: undefined,
                        name: '',
                        description: '',
                        type: 'SEMANTIC',
                      })
                    }
                  >
                    添加知识库
                  </Button>
                </Empty>
              )}

              {fields.map((field) => (
                <Card
                  key={field.key}
                  size="small"
                  className="knowledge-node-panel-v2-item"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <FileTextOutlined
                        style={{
                          fontSize: 18,
                          color: '#1890ff',
                          marginRight: 8,
                        }}
                      />
                      <Text strong>
                        <Form.Item
                          name={[field.name, 'name']}
                          rules={[
                            { required: true, message: '请输入知识库名称' },
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="知识库名称" />
                        </Form.Item>
                      </Text>
                    </span>
                  }
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  }
                >
                  <Form.Item
                    name={[field.name, 'knowledgeBaseId']}
                    label="知识库 ID"
                    rules={[{ required: true, message: '请输入知识库 ID' }]}
                  >
                    <Input placeholder="请输入知识库 ID" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'description']} label="描述">
                    <Input.TextArea rows={2} placeholder="可选描述" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'searchStrategy']}
                    label="检索策略"
                    initialValue="SEMANTIC"
                  >
                    <Select options={SEARCH_STRATEGY_OPTIONS} />
                  </Form.Item>
                </Card>
              ))}

              {fields.length > 0 && (
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      knowledgeBaseId: undefined,
                      name: '',
                      description: '',
                      type: 'SEMANTIC',
                    })
                  }
                >
                  添加知识库
                </Button>
              )}
            </div>
          )}
        </Form.List>
      </div>

      {/* 搜索策略 */}
      <div className="node-panel-v2-section">
        <Form.Item
          name="searchStrategy"
          label={
            <span>
              搜索策略
              <Tooltip title="从知识库中获取知识的检索方式，不同的检索策略可以更有效地找到正确的信息">
                <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
          initialValue="SEMANTIC"
        >
          <Select options={SEARCH_STRATEGY_OPTIONS} />
        </Form.Item>
      </div>

      {/* 最大召回数量 */}
      <div className="node-panel-v2-section">
        <Form.Item
          name="maxRecallCount"
          label={
            <span>
              最大召回数量
              <Tooltip title="从知识库中返回给大模型的最大段落数，数值越大返回的内容越多">
                <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
          initialValue={5}
        >
          <Slider
            min={1}
            max={20}
            step={1}
            marks={{ 1: '1', 10: '10', 20: '20' }}
          />
        </Form.Item>
      </div>

      {/* 最小匹配度 */}
      <div className="node-panel-v2-section">
        <Form.Item
          name="matchingDegree"
          label={
            <span>
              最小匹配度
              <Tooltip title="根据设置的匹配度选取段落返回给大模型，低于设定匹配度的内容不会被召回">
                <InfoCircleOutlined style={{ marginLeft: 4, color: '#999' }} />
              </Tooltip>
            </span>
          }
          initialValue={0.5}
        >
          <Slider
            min={0.01}
            max={0.99}
            step={0.01}
            marks={{ 0.01: '0.01', 0.5: '0.5', 0.99: '0.99' }}
          />
        </Form.Item>
      </div>

      {/* 输出参数 */}
      {outputArgs.length > 0 && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输出</Text>
          </div>
          <OutputArgsDisplayV2 outputArgs={outputArgs} />
        </div>
      )}
    </div>
  );
};

export default KnowledgeNodePanelV2;
