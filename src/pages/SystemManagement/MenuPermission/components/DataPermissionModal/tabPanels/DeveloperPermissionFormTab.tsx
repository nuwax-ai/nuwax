/**
 * 数据权限弹窗 —「开发者权限」Tab 面板
 *
 * 功能：展示与编辑 DataPermission 中的数值型配额（token、各资源上限、智能体电脑规格、对话次数等）。
 * 使用 antd Form，实例与初始值由父组件传入；字段变更通过 onValuesChange 同步到父级缓存，便于非本 Tab 时保存仍能带上表单数据。
 *
 * @see DataPermissionModal
 */
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
            label="每日token限制"
            name={['tokenLimit', 'limitPerDay']}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '每日 token 限制，-1 表示不限制',
            }}
          >
            <InputNumber
              placeholder="请输入每日token限制数量"
              className={cx('w-full')}
              min={-1}
              max={1000000000000000}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="可创建工作空间数量"
            name="maxSpaceCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建工作空间数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="可创建智能体数量"
            name="maxAgentCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建智能体数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="可创建网页应用数量"
            name="maxPageAppCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建网页应用数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="可创建知识库数量"
            name="maxKnowledgeCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建知识库数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="知识库存储空间上限 (GB)"
            name="knowledgeStorageLimitGb"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title:
                '-1表示不限制, 0表示无权限, 精度为0.001GB, 1GB=1024MB, 1MB=1024KB',
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
            label="可创建数据表数量"
            name="maxDataTableCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建数据表数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="可创建定时任务数量"
            name="maxScheduledTaskCount"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '可创建定时任务数量，-1 表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="智能体电脑内存(GB)"
            name="agentComputerMemoryGb"
            initialValue={4}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '智能体电脑内存 (GB，留空表示使用默认值4GB)',
            }}
          >
            <InputNumber className={cx('w-full')} min={1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="智能体电脑 CPU 核心数"
            name="agentComputerCpuCores"
            initialValue={2}
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '智能体电脑 CPU 核心数（留空表示使用默认值）',
            }}
          >
            <InputNumber className={cx('w-full')} min={1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="通用智能体每天对话次数限制"
            name="agentDailyPromptLimit"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '通用智能体每天对话次数，-1表示不限制',
            }}
          >
            <InputNumber className={cx('w-full')} min={-1} max={100000000} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="网页应用开发每天对话次数"
            name="pageDailyPromptLimit"
            tooltip={{
              icon: <InfoCircleOutlined />,
              title: '网页应用开发每天对话次数，-1表示不限制',
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
