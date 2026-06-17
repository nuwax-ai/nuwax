import CustomFormModal from '@/components/CustomFormModal';
import { t } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
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
} from '../../services/role-manage';
import {
  RoleSourceEnum,
  RoleStatusEnum,
  type RoleInfo,
} from '../../types/role-manage';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface RoleFormModalProps {
  /** Whether modal is open. */
  open: boolean;
  /** Whether edit mode is enabled. */
  isEdit?: boolean;
  /** Default sort index for create mode. */
  defaultSortIndex?: number;
  /** Role info for edit mode. */
  roleInfo?: RoleInfo | null;
  /** Cancel callback. */
  onCancel: () => void;
  /** Success callback. */
  onSuccess: () => void;
}

// Role source options. 1: System built-in, 2: User-defined.
const ROLE_SOURCE_OPTIONS = [
  {
    label: t('PC.Pages.SystemRoleFormModal.roleSourceSystemBuiltIn'),
    value: RoleSourceEnum.SystemBuiltIn,
  },
  {
    label: t('PC.Pages.SystemRoleFormModal.roleSourceUserDefined'),
    value: RoleSourceEnum.UserDefined,
  },
];

/**
 * Role create/edit modal.
 */
const RoleFormModal: React.FC<RoleFormModalProps> = ({
  open,
  isEdit = false,
  /** Default sort index for create mode. */
  defaultSortIndex = 1,
  /** Role info for edit mode. */
  roleInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // Query role by ID.
  const { run: runGetRoleById } = useRequest(apiGetRoleById, {
    manual: true,
    onSuccess: (data: RoleInfo) => {
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        sortIndex: data.sortIndex || 1,
        source: data.source || RoleSourceEnum.UserDefined,
        status: data.status === RoleStatusEnum.Enabled,
      });
    },
  });

  // Create role.
  const { run: runAddRole, loading: addLoading } = useRequest(apiAddRole, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Toast.SystemRoleFormModal.createSuccess'));
      onSuccess();
    },
  });

  // Update role.
  const { run: runUpdateRole, loading: updateLoading } = useRequest(
    apiUpdateRole,
    {
      manual: true,
      onSuccess: () => {
        message.success(t('PC.Toast.SystemRoleFormModal.editSuccess'));
        onSuccess();
      },
    },
  );

  const loading = addLoading || updateLoading;

  // Initialize form values.
  useEffect(() => {
    if (open) {
      if (isEdit && roleInfo) {
        runGetRoleById(roleInfo.id);
      } else {
        // Create mode: reset form.
        form.resetFields();
        form.setFieldsValue({
          source: RoleSourceEnum.UserDefined,
          sortIndex: defaultSortIndex || 1,
          status: true,
        });
      }
    }
  }, [open, isEdit, roleInfo, defaultSortIndex]);

  // Submit form.
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
      console.error(
        `${t('PC.Pages.SystemRoleFormModal.formValidateFailed')}:`,
        error,
      );
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={
        isEdit
          ? t('PC.Pages.SystemRoleFormModal.editTitle')
          : t('PC.Pages.SystemRoleFormModal.createTitle')
      }
      open={open}
      loading={loading}
      okText={
        isEdit
          ? t('PC.Pages.SystemRoleFormModal.save')
          : t('PC.Pages.SystemRoleFormModal.create')
      }
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
        {/* Basic information */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemRoleFormModal.roleName')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('PC.Pages.SystemRoleFormModal.roleNameRequired'),
                },
              ]}
            >
              <Input
                placeholder={t(
                  'PC.Pages.SystemRoleFormModal.roleNamePlaceholder',
                )}
                maxLength={50}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemRoleFormModal.source')}
              name="source"
            >
              <Select
                placeholder={t(
                  'PC.Pages.SystemRoleFormModal.sourcePlaceholder',
                )}
                disabled
                options={ROLE_SOURCE_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemRoleFormModal.sort')}
              name="sortIndex"
            >
              <InputNumber
                placeholder={t('PC.Pages.SystemRoleFormModal.sortPlaceholder')}
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemRoleFormModal.status')}
              name="status"
              valuePropName="checked"
              tooltip={{
                title: t('PC.Pages.SystemRoleFormModal.statusTooltip'),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Switch
                checkedChildren={t('PC.Pages.SystemRoleFormModal.enabled')}
                unCheckedChildren={t('PC.Pages.SystemRoleFormModal.disabled')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={t('PC.Pages.SystemRoleFormModal.description')}
          name="description"
        >
          <TextArea
            placeholder={t(
              'PC.Pages.SystemRoleFormModal.descriptionPlaceholder',
            )}
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
