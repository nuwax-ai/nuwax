/**
 * 数据权限弹窗 —「开发者权限」Tab 面板
 *
 * 功能：展示与编辑 DataPermission 中的数值型配额（token、各资源上限、智能体电脑规格、对话次数等）。
 * 使用 antd Form，实例与初始值由父组件传入；字段变更通过 onValuesChange 同步到父级缓存，便于非本 Tab 时保存仍能带上表单数据。
 *
 * @see DataPermissionModal
 */
import { dict } from '@/services/i18nRuntime';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Form, InputNumber, Row } from 'antd';
import type { FormInstance } from 'antd/es/form';
import classNames from 'classnames';
import React from 'react';
import type { DataPermission } from '../../../types/role-manage';
import styles from '../index.less';

const cx = classNames.bind(styles);

export interface DeveloperPermissionFormTabProps {
  /** 与父组件共用的 Form 实例（含 setFieldsValue / validateFields） */
  form: FormInstance;
  /** 任意字段变化时回传当前表单聚合值，供父组件写入 formValuesCache */
  onValuesChange: (allValues: DataPermission) => void;
}

/** 开发者权限配额表单（无状态展示层，状态在 Form 与父组件） */
const DeveloperPermissionFormTab: React.FC<DeveloperPermissionFormTabProps> = ({
  form,
  onValuesChange,
}) => (
  <div className={cx(styles.dataPermissionFormWrapper)}>
    <Form
      form={form}
      layout="vertical"
      className={cx(styles.dataPermissionForm)}
      preserve
      onValuesChange={(_, allValues) =>
        onValuesChange(allValues as DataPermission)
      }
    >
      {/* 两列栅格排布各项配额 InputNumber */}
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.dailyTokenLimit')}
            name={['tokenLimit', 'limitPerDay']}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.dailyTokenLimitTooltip',
              ),
            }}
          >
            <InputNumber
              placeholder={dict(
                'PC.Pages.DeveloperPermissionForm.dailyTokenLimitPlaceholder',
              )}
              className={cx('w-full')}
              min={-1}
              max={1000000000000000}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.maxSpaceCount')}
            name="maxSpaceCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxSpaceCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.maxAgentCount')}
            name="maxAgentCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxAgentCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.maxPageAppCount')}
            name="maxPageAppCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxPageAppCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.maxKnowledgeCount')}
            name="maxKnowledgeCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxKnowledgeCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.knowledgeStorageLimitGb',
            )}
            name="knowledgeStorageLimitGb"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.knowledgeStorageLimitGbTooltip',
              ),
            }}
          >
            <InputNumber
              className={cx('w-full')}
              min={-1}
              max={100000000}
              step={0.001}
              precision={3}
              formatter={(value) => {
                if (value === undefined || value === null) return '';
                const num = Number(value);
                if (Number.isInteger(num)) return String(num);
                return num.toFixed(3).replace(/\.?0+$/, '');
              }}
              parser={(value) => {
                if (!value) return value as any;
                const num = parseFloat(value);
                return isNaN(num) ? (value as any) : num;
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict('PC.Pages.DeveloperPermissionForm.maxDataTableCount')}
            name="maxDataTableCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxDataTableCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.maxScheduledTaskCount',
            )}
            name="maxScheduledTaskCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.maxScheduledTaskCountTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.agentComputerMemoryGb',
            )}
            name="agentComputerMemoryGb"
            initialValue={4}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.agentComputerMemoryGbTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.agentComputerCpuCores',
            )}
            name="agentComputerCpuCores"
            initialValue={2}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.agentComputerCpuCoresTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.agentDailyPromptLimit',
            )}
            name="agentDailyPromptLimit"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.agentDailyPromptLimitTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={dict(
              'PC.Pages.DeveloperPermissionForm.pageDailyPromptLimit',
            )}
            name="pageDailyPromptLimit"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: dict(
                'PC.Pages.DeveloperPermissionForm.pageDailyPromptLimitTooltip',
              ),
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </div>
);

export default DeveloperPermissionFormTab;
