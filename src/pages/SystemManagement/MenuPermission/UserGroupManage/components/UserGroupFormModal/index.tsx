import CustomFormModal from '@/components/CustomFormModal';
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
} from '../../../services/user-group-manage';
import {
  UserGroupSourceEnum,
  UserGroupStatusEnum,
  type UserGroupInfo,
} from '../../../types/user-group-manage';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface UserGroupFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex?: number;
  /** 编辑时的用户组数据 */
  userGroupInfo?: UserGroupInfo | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

// 用户组来源选项 来源 1:系统内置 2:用户自定义
const USER_GROUP_SOURCE_OPTIONS = [
  { label: '系统内置', value: UserGroupSourceEnum.SystemBuiltIn },
  { label: '用户自定义', value: UserGroupSourceEnum.UserDefined },
];

/**
 * 用户组表单Modal组件
 * 用于新增或编辑用户组信息
 */
const UserGroupFormModal: React.FC<UserGroupFormModalProps> = ({
  open,
  isEdit = false,
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex = 1,
  /** 编辑时的用户组数据 */
  userGroupInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // 新增
  const { run: runAddUserGroup, loading: addLoading } = useRequest(
    apiAddUserGroup,
    {
      manual: true,
      onSuccess: () => {
        message.success('新增用户组成功');
        onSuccess();
      },
    },
  );

  // 更新用户组
  const { run: runUpdateUserGroup, loading: updateLoading } = useRequest(
    apiUpdateUserGroup,
    {
      manual: true,
      onSuccess: () => {
        message.success('更新用户组成功');
        onSuccess();
      },
    },
  );

  // 根据ID查询用户组
  const { run: runGetUserGroupById } = useRequest(apiGetUserGroupById, {
    manual: true,
    onSuccess: (data: UserGroupInfo) => {
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        maxUserCount: data.maxUserCount,
        sortIndex: data.sortIndex || 1,
        status: data.status === UserGroupStatusEnum.Enabled,
        source: data.source || UserGroupSourceEnum.UserDefined,
      });
    },
  });

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (isEdit && userGroupInfo) {
        // 编辑模式：通过接口查询用户组信息
        runGetUserGroupById(userGroupInfo.id);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          source: UserGroupSourceEnum.UserDefined,
          sortIndex: defaultSortIndex || 1,
          status: true,
          maxUserCount: 100,
        });
      }
    }
  }, [open, isEdit, userGroupInfo, defaultSortIndex]);

  // 处理提交
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
      console.error('表单验证失败:', error);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={isEdit ? '编辑用户组' : '新增用户组'}
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
          <Col span={12}>
            <Form.Item
              label="用户组名称"
              name="name"
              rules={[{ required: true, message: '请输入用户组名称' }]}
            >
              <Input placeholder="请输入用户组名称" maxLength={50} showCount />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="最大用户数"
              name="maxUserCount"
              rules={[{ required: true, message: '请输入最大用户数' }]}
              tooltip={{
                title: '最大值为2147483647',
                icon: <InfoCircleOutlined />,
              }}
            >
              <InputNumber
                placeholder="请输入最大用户数"
                className={cx('w-full')}
                min={1}
                max={2147483647}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="来源" name="source">
              <Select
                placeholder="请选择来源"
                options={USER_GROUP_SOURCE_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="排序"
              name="sortIndex"
              className={cx(styles.fieldItem)}
            >
              <InputNumber
                placeholder="请输入排序"
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="状态"
              name="status"
              valuePropName="checked"
              tooltip={{
                title: '启用或禁用此用户组',
                icon: <InfoCircleOutlined />,
              }}
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="描述" name="description">
          <TextArea
            placeholder="请输入用户组描述"
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
