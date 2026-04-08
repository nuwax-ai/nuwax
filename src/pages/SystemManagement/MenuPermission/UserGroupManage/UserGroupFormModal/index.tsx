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
  apiAddUserGroup,
  apiGetUserGroupById,
  apiUpdateUserGroup,
} from '../../services/user-group-manage';
import {
  UserGroupSourceEnum,
  UserGroupStatusEnum,
  type UserGroupInfo,
} from '../../types/user-group-manage';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface UserGroupFormModalProps {
  /** Whether modal is open. */
  open: boolean;
  /** Whether edit mode is enabled. */
  isEdit?: boolean;
  /** Default sort index for create mode. */
  defaultSortIndex?: number;
  /** User-group info for edit mode. */
  userGroupInfo?: UserGroupInfo | null;
  /** Cancel callback. */
  onCancel: () => void;
  /** Success callback. */
  onSuccess: () => void;
}

// User-group source options. 1: System built-in, 2: User-defined.
const USER_GROUP_SOURCE_OPTIONS = [
  {
    label: t('PC.Pages.SystemUserGroupFormModal.sourceSystemBuiltIn'),
    value: UserGroupSourceEnum.SystemBuiltIn,
  },
  {
    label: t('PC.Pages.SystemUserGroupFormModal.sourceUserDefined'),
    value: UserGroupSourceEnum.UserDefined,
  },
];

/**
 * User-group create/edit modal.
 */
const UserGroupFormModal: React.FC<UserGroupFormModalProps> = ({
  open,
  isEdit = false,
  /** Default sort index for create mode. */
  defaultSortIndex = 1,
  /** User-group info for edit mode. */
  userGroupInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // Create.
  const { run: runAddUserGroup, loading: addLoading } = useRequest(
    apiAddUserGroup,
    {
      manual: true,
      onSuccess: () => {
        message.success(t('PC.Toast.SystemUserGroupFormModal.createSuccess'));
        onSuccess();
      },
    },
  );

  // Update user group.
  const { run: runUpdateUserGroup, loading: updateLoading } = useRequest(
    apiUpdateUserGroup,
    {
      manual: true,
      onSuccess: () => {
        message.success(t('PC.Toast.SystemUserGroupFormModal.updateSuccess'));
        onSuccess();
      },
    },
  );

  // Query user group by ID.
  const { run: runGetUserGroupById } = useRequest(apiGetUserGroupById, {
    manual: true,
    onSuccess: (data: UserGroupInfo) => {
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        sortIndex: data.sortIndex || 1,
        status: data.status === UserGroupStatusEnum.Enabled,
        source: data.source || UserGroupSourceEnum.UserDefined,
      });
    },
  });

  const loading = addLoading || updateLoading;

  // Initialize form values.
  useEffect(() => {
    if (open) {
      if (isEdit && userGroupInfo) {
        // Edit mode: load detail from API.
        runGetUserGroupById(userGroupInfo.id);
      } else {
        // Create mode: reset form.
        form.resetFields();
        form.setFieldsValue({
          source: UserGroupSourceEnum.UserDefined,
          sortIndex: defaultSortIndex || 1,
          status: true,
        });
      }
    }
  }, [open, isEdit, userGroupInfo, defaultSortIndex]);

  // Submit form.
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = {
        ...values,
        status: values.status
          ? UserGroupStatusEnum.Enabled
          : UserGroupStatusEnum.Disabled,
      };

      if (isEdit && userGroupInfo) {
        await runUpdateUserGroup({
          id: userGroupInfo.id,
          ...formData,
        });
      } else {
        await runAddUserGroup(formData);
      }
    } catch (error) {
      console.error(
        `${t('PC.Pages.SystemUserGroupFormModal.formValidateFailed')}:`,
        error,
      );
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={
        isEdit
          ? t('PC.Pages.SystemUserGroupFormModal.editTitle')
          : t('PC.Pages.SystemUserGroupFormModal.createTitle')
      }
      open={open}
      loading={loading}
      okText={
        isEdit
          ? t('PC.Pages.SystemUserGroupFormModal.save')
          : t('PC.Pages.SystemUserGroupFormModal.create')
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
              label={t('PC.Pages.SystemUserGroupFormModal.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t('PC.Pages.SystemUserGroupFormModal.nameRequired'),
                },
              ]}
            >
              <Input
                placeholder={t(
                  'PC.Pages.SystemUserGroupFormModal.namePlaceholder',
                )}
                maxLength={50}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemUserGroupFormModal.source')}
              name="source"
            >
              <Select
                placeholder={t(
                  'PC.Pages.SystemUserGroupFormModal.sourcePlaceholder',
                )}
                disabled
                options={USER_GROUP_SOURCE_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemUserGroupFormModal.sort')}
              name="sortIndex"
              className={cx(styles.fieldItem)}
            >
              <InputNumber
                placeholder={t(
                  'PC.Pages.SystemUserGroupFormModal.sortPlaceholder',
                )}
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemUserGroupFormModal.status')}
              name="status"
              valuePropName="checked"
              tooltip={{
                title: t('PC.Pages.SystemUserGroupFormModal.statusTip'),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Switch
                checkedChildren={t('PC.Pages.SystemUserGroupFormModal.enabled')}
                unCheckedChildren={t(
                  'PC.Pages.SystemUserGroupFormModal.disabled',
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('PC.Pages.SystemUserGroupFormModal.description')}
          name="description"
        >
          <TextArea
            placeholder={t(
              'PC.Pages.SystemUserGroupFormModal.descriptionPlaceholder',
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

export default UserGroupFormModal;
