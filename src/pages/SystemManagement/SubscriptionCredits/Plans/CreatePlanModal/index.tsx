import { dict } from '@/services/i18nRuntime';
import { QuestionCircleFilled } from '@ant-design/icons';
import {
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
} from 'antd';
import React from 'react';

interface CreatePlanModalProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 新增套餐弹窗
 * @param open - 是否打开弹窗
 * @param onCancel - 取消回调
 * @returns
 */
const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  open,
  onCancel,
}) => {
  return (
    <Modal
      title={dict('PC.Pages.SystemPlans.createPlan')}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={760}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={{
          creditAmount: 0,
          period: 'MONTH',
          isHot: false,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={`${dict('PC.Pages.SystemSubsOrders.colPlanName')} *`}
              name="name"
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceSubscriptionSettings.fieldNameRequired',
                  ),
                },
              ]}
            >
              <Input placeholder="例如：基础版" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  套餐包含积分（每月）{' '}
                  <QuestionCircleFilled style={{ color: '#bfbfbf' }} />
                </span>
              }
              name="creditAmount"
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="套餐价格 (¥) *"
              name="price"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="例如：99"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="套餐有效期 *"
              name="period"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: '月', value: 'MONTH' },
                  { label: '季度', value: 'QUARTER' },
                  { label: '年', value: 'YEAR' },
                  { label: '永久', value: 'FOREVER' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="原价 (¥)" name="firstPrice">
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="留空表示无原价"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="热门标签" name="isHot" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="套餐描述 *"
              name="description"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="描述套餐的定位和适用场景"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1f1f1f',
            marginBottom: 4,
          }}
        >
          开发者权限
        </div>
        <div style={{ color: '#8c8c8c', marginBottom: 16 }}>
          关联用户组以控制套餐包含的权限范围，可多选
        </div>

        <Row gutter={12}>
          <Col span={12}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                基础开发者
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>知识库空间</span>
                <span>500MB</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>云端电脑内存</span>
                <span>2GB</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>API 调用次数</span>
                <span>1,000 次/月</span>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                专业开发者
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>知识库空间</span>
                <span>2GB</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>云端电脑内存</span>
                <span>4GB</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#8c8c8c' }}>API 调用次数</span>
                <span>10,000 次/月</span>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreatePlanModal;
