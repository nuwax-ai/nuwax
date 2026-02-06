import CustomFormModal from '@/components/CustomFormModal';
import { customizeRequiredMark } from '@/utils/form';
import {
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import {
  apiAddRole,
  apiGetRoleById,
  apiUpdateRole,
} from '../../../services/role-manage';
import {
  RoleSourceEnum,
  RoleStatusEnum,
  type RoleInfo,
} from '../../../types/role-manage';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface RoleFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex?: number;
  /** 编辑时的角色数据 */
  roleInfo?: RoleInfo | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

// 角色来源选项 来源 1:系统内置 2:用户自定义
const ROLE_SOURCE_OPTIONS = [
  { label: '系统内置', value: RoleSourceEnum.SystemBuiltIn },
  { label: '用户自定义', value: RoleSourceEnum.UserDefined },
];

/**
 * 角色表单Modal组件
 * 用于新增或编辑角色信息
 */
const RoleFormModal: React.FC<RoleFormModalProps> = ({
  open,
  isEdit = false,
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex = 1,
  /** 编辑时的角色数据 */
  roleInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // 根据ID查询角色
  const { run: runGetRoleById } = useRequest(apiGetRoleById, {
    manual: true,
    onSuccess: (data: RoleInfo) => {
      form.setFieldsValue({
        // code: data.code,
        name: data.name,
        description: data.description,
        sortIndex: data.sortIndex || 1,
        source: data.source || RoleSourceEnum.UserDefined,
        status: data.status === RoleStatusEnum.Enabled,
      });
    },
  });

  // 新增角色
  const { run: runAddRole, loading: addLoading } = useRequest(apiAddRole, {
    manual: true,
    onSuccess: () => {
      message.success('角色创建成功');
      onSuccess();
    },
  });

  // 更新角色
  const { run: runUpdateRole, loading: updateLoading } = useRequest(
    apiUpdateRole,
    {
      manual: true,
      onSuccess: () => {
        message.success('角色编辑成功');
        onSuccess();
      },
    },
  );

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (isEdit && roleInfo) {
        runGetRoleById(roleInfo.id);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          source: RoleSourceEnum.UserDefined,
          sortIndex: defaultSortIndex || 1,
          status: true,
        });
      }
    }
  }, [open, isEdit, roleInfo, defaultSortIndex]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = {
        ...values,
        status: values.status
          ? RoleStatusEnum.Enabled
          : RoleStatusEnum.Disabled,
      };

      if (isEdit && roleInfo) {
        await runUpdateRole({
          id: roleInfo.id,
          ...formData,
        });
      } else {
        await runAddRole(formData);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={isEdit ? '编辑角色' : '新增角色'}
      open={open}
      loading={loading}
      okText={isEdit ? '保存' : '创建'}
      width={650}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        className={cx(styles.form)}
      >
        {/* 基本信息 */}
        <Row gutter={16}>
          {/* <Col span={12}>
            <Form.Item
              label="角色编码"
              name="code"
              rules={[
                { required: true, message: '请输入角色编码' },
                {
                  pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                  message:
                    '角色编码必须以英文字母开头，只能包含字母、数字和下划线',
                },
              ]}
            >
              <Input
                disabled={isEdit}
                placeholder="请输入角色编码"
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Col> */}
          <Col span={12}>
            <Form.Item
              label="角色名称"
              name="name"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" maxLength={50} showCount />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="来源" name="source">
              <Select placeholder="请选择来源" options={ROLE_SOURCE_OPTIONS} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="排序" name="sortIndex">
              <InputNumber
                placeholder="请输入排序"
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="状态" name="status" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="描述" name="description">
          <TextArea
            placeholder="请输入角色描述"
            className="dispose-textarea-count"
            autoSize={{ minRows: 3, maxRows: 5 }}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default RoleFormModal;
