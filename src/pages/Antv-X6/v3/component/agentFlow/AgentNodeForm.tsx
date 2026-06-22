/**
 * Agent 节点属性面板
 *
 * 数据格式（与后端对齐）：
 * - agentId: Long       智能体ID（当前空间内选择）
 * - extraPrompt: String  补充提示词
 * - selfLoopTimes: int   自身循环次数
 * - reminderPrompt: String 循环提醒提示词
 */

import { apiAgentConfigList } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Segmented, Select, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';

const { TextArea } = Input;

const AgentNodeForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const contextPassMode =
    Form.useWatch('contextPassMode', { form, preserve: true }) || 'auto';

  const params = useParams<{ spaceId?: string }>();
  const spaceId = Number(params.spaceId);
  const [agents, setAgents] = useState<AgentConfigInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spaceId || Number.isNaN(spaceId)) return;
    let cancelled = false;
    setLoading(true);
    apiAgentConfigList(spaceId)
      .then((res) => {
        if (cancelled) return;
        setAgents(res?.data || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  return (
    <div className="af-panel">
      <div className="af-section">
        <Form.Item
          name="agentId"
          label={t('PC.Pages.AgentFlowNode.agentIdLabel', '智能体')}
          rules={[{ required: true }]}
          className="af-field"
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t(
              'PC.Pages.AgentFlowNode.agentIdPlaceholder',
              '选择当前空间内的智能体',
            )}
            loading={loading}
            notFoundContent={
              loading ? (
                <Spin size="small" />
              ) : (
                t('PC.Pages.AgentFlowNode.agentIdEmpty', '暂无智能体')
              )
            }
            options={agents.map((a) => ({
              label: a.name || `#${a.id}`,
              value: a.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="extraPrompt"
          label={t('PC.Pages.AgentFlowNode.extraPromptLabel', '补充提示词')}
          tooltip={t(
            'PC.Pages.AgentFlowNode.extraPromptTooltip',
            '约束输出格式等，支持 {{变量}} 引用',
          )}
          className="af-field"
        >
          <TextArea
            rows={3}
            placeholder={t(
              'PC.Pages.AgentFlowNode.extraPromptPlaceholder',
              '可添加提示词约束智能体输出格式...',
            )}
          />
        </Form.Item>

        <Form.Item
          name="selfLoopTimes"
          label={t('PC.Pages.AgentFlowNode.selfLoopTimesLabel', '自身循环次数')}
          tooltip={t(
            'PC.Pages.AgentFlowNode.selfLoopTimesTooltip',
            '智能体自循环执行的次数，0 表示不循环',
          )}
          initialValue={0}
          className="af-field"
        >
          <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="reminderPrompt"
          label={t(
            'PC.Pages.AgentFlowNode.reminderPromptLabel',
            '循环提醒提示词',
          )}
          tooltip={t(
            'PC.Pages.AgentFlowNode.reminderPromptTooltip',
            '每次自循环结束后注入的提醒提示词，支持 {{变量}} 引用',
          )}
          className="af-field"
        >
          <TextArea
            rows={2}
            placeholder={t(
              'PC.Pages.AgentFlowNode.reminderPromptPlaceholder',
              '循环提醒提示词...',
            )}
          />
        </Form.Item>
      </div>

      <div className="af-section">
        <Form.Item
          name="contextPassMode"
          label={t('PC.Pages.AgentFlowNode.contextPassModeLabel', '上下文传递')}
          initialValue="auto"
          className="af-field"
        >
          <Segmented
            options={[
              {
                label: t('PC.Pages.AgentFlowNode.contextPassAuto', '自动'),
                value: 'auto',
              },
              {
                label: t('PC.Pages.AgentFlowNode.contextPassManual', '手动'),
                value: 'manual',
              },
            ]}
          />
        </Form.Item>

        {contextPassMode === 'manual' && (
          <>
            <Form.Item
              name={['contextParams', 'baseParam']}
              label={t('PC.Pages.AgentFlowNode.baseParamLabel', '基础参数')}
              className="af-field"
            >
              <Input placeholder="user_input" />
            </Form.Item>
            <Form.List name={['contextParams', 'extraParams']}>
              {(fields, { add, remove }) => (
                <>
                  <div className="af-section-title">
                    {t('PC.Pages.AgentFlowNode.extraParamsTitle', '自定义参数')}
                  </div>
                  {fields.map(({ key, name }) => (
                    <div key={key} className="af-inline-row">
                      <Form.Item
                        name={[name, 'name']}
                        rules={[{ required: true, max: 32 }]}
                      >
                        <Input placeholder="param" style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item name={[name, 'value']}>
                        <Input
                          placeholder="{{variable}}"
                          style={{ width: 180 }}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    block
                    onClick={() =>
                      add({ name: '', valueType: 'literal', value: '' })
                    }
                  >
                    {t('PC.Pages.AgentFlowNode.extraParamsAdd', '+ 添加参数')}
                  </Button>
                </>
              )}
            </Form.List>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentNodeForm;
