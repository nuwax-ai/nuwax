import CustomFormModal from '@/components/CustomFormModal';
import { apiSystemModelList } from '@/services/systemManage';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Form, Input, InputNumber, Row, Switch, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import DataModelSelector from '../../../RoleManage/components/DataModelSelector';
import { apiAddUserGroup, apiUpdateUserGroup } from '../../api';
import { UserGroupStatusEnum, type UserGroupInfo } from '../../type';
import styles from './index.less';

const { TextArea } = Input;
const { Text } = Typography;
const cx = classNames.bind(styles);

interface UserGroupFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 编辑时的用户组数据 */
  userGroupData?: UserGroupInfo;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

/**
 * 用户组表单Modal组件
 * 用于新增或编辑用户组信息
 */
const UserGroupFormModal: React.FC<UserGroupFormModalProps> = ({
  open,
  isEdit = false,
  userGroupData,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);

  // 新增
  const { run: runAddUserGroup, loading: addLoading } = useRequest(
    apiAddUserGroup,
    {
      manual: true,
      onSuccess: () => {
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
        onSuccess();
      },
    },
  );

  // 查询模型列表
  const { run: runModelList, data: modelList } = useRequest(
    apiSystemModelList,
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      // 查询模型列表
      runModelList();
    }
  }, [open]);

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (isEdit && userGroupData) {
        // 编辑模式：填充表单数据
        form.setFieldsValue({
          code: userGroupData.code,
          name: userGroupData.name,
          description: userGroupData.description,
          maxUsers: userGroupData.maxUsers,
          status: userGroupData.status === UserGroupStatusEnum.Enabled,
        });
        // TODO: 从API获取已选中的数据模型
        setSelectedModelIds([]);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        setSelectedModelIds([]);
      }
    }
  }, [open, isEdit, userGroupData, form]);

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedModelIds([]);
    onCancel();
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 处理模型ID：全部模型传[0],未选中任何模型不传值
      let modelIds: number[] | undefined;
      if (selectedModelIds.length > 0) {
        // 检查是否选中了全部模型
        const isAllSelected =
          modelList?.length > 0 && selectedModelIds.length === modelList.length;
        modelIds = isAllSelected ? [0] : selectedModelIds;
      }

      const formData = {
        code: values.code,
        name: values.name,
        description: values.description || '',
        maxUsers: values.maxUsers || 0,
        modelIds,
        status: values.status
          ? UserGroupStatusEnum.Enabled
          : UserGroupStatusEnum.Disabled,
        sortIndex: 0,
      };

      if (isEdit && userGroupData) {
        await runUpdateUserGroup({
          id: userGroupData.id,
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
      width={800}
      onCancel={handleCancel}
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
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>基本信息</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户组编码"
                name="code"
                rules={[{ required: true, message: '请输入用户组编码' }]}
              >
                <Input placeholder="请输入用户组编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="用户组名称"
                name="name"
                rules={[{ required: true, message: '请输入用户组名称' }]}
              >
                <Input placeholder="请输入用户组名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="最大用户数"
                name="maxUsers"
                rules={[{ required: true, message: '请输入最大用户数' }]}
                tooltip={{
                  title: '0表示不限制用户数',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <InputNumber
                  placeholder="请输入最大用户数，0表示不限制"
                  className={cx('w-full')}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                valuePropName="checked"
                initialValue={true}
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
              maxLength={200}
            />
          </Form.Item>
        </div>

        {/* 系统字段配置 */}
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>系统字段配置</h3>
        </div>

        {/* 数据权限配置 */}
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>数据权限配置</h3>
          <Text type="secondary" className={cx(styles.sectionDesc)}>
            选择该用户组可以访问的数据模型,支持选择&ldquo;全部&rdquo;或具体模型
          </Text>
          <DataModelSelector
            models={modelList || []}
            selectedIds={selectedModelIds}
            onChange={setSelectedModelIds}
          />
        </div>
      </Form>
    </CustomFormModal>
  );
};

export default UserGroupFormModal;
