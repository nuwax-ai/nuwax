import CustomFormModal from '@/components/CustomFormModal';
import { apiSystemModelList } from '@/services/systemManage';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
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
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import DataModelSelector from '../../../components/DataModelSelector';
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
const { Text } = Typography;
const cx = classNames.bind(styles);

interface UserGroupFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
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
  userGroupInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  // 是否全部模型已选中
  const [allModelSelected, setAllModelSelected] = useState<boolean>(false);

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

  // 查询模型列表
  const { run: runModelList, data: modelList } = useRequest(
    apiSystemModelList,
    {
      manual: true,
    },
  );

  // 根据ID查询用户组
  const { run: runGetUserGroupById } = useRequest(apiGetUserGroupById, {
    manual: true,
    onSuccess: (data: UserGroupInfo) => {
      form.setFieldsValue({
        code: data.code,
        name: data.name,
        description: data.description,
        maxUserCount: data.maxUserCount,
        tokenLimit: {
          limitPerDay: data.tokenLimit?.limitPerDay || 0,
        },
        sortIndex: data.sortIndex || 0,
        status: data.status === UserGroupStatusEnum.Enabled,
        source: data.source || UserGroupSourceEnum.UserDefined,
      });
      // 处理模型ID：如果modelIds只存在一项且为0，则从modelList中设置全部模型id
      if (data?.modelIds && data?.modelIds?.length > 0) {
        if (data?.modelIds?.length === 1 && data?.modelIds[0] === 0) {
          // 如果模型ID列表长度为1，且为0，则设置为全部模型
          setAllModelSelected(true);
        } else {
          setSelectedModelIds(data.modelIds || []);
        }
      }
    },
  });

  // 当 modelList 加载完成后，处理待处理的 modelIds
  useEffect(() => {
    // 如果模型列表长度大于0，且全部模型已选中，则设置为全部模型ID列表
    if (modelList?.length > 0 && allModelSelected) {
      setSelectedModelIds(modelList.map((item: ModelConfigDto) => item.id));
    }
  }, [modelList, allModelSelected]);

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      // 查询模型列表
      runModelList();
      if (isEdit && userGroupInfo) {
        // 编辑模式：通过接口查询用户组信息
        runGetUserGroupById(userGroupInfo.id);
      }
    } else {
      // 新增模式：重置表单
      form.resetFields();
      form.setFieldsValue({
        source: UserGroupSourceEnum.UserDefined,
        sortIndex: 0,
        status: true,
        tokenLimit: {
          limitPerDay: 0,
        },
      });
      setAllModelSelected(false);
      setSelectedModelIds([]);
    }
  }, [open, isEdit, userGroupInfo, form]);

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
        ...values,
        modelIds,
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
      width={800}
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
        <div className={cx(styles.section)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户组编码"
                name="code"
                rules={[
                  { required: true, message: '请输入用户组编码' },
                  {
                    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                    message:
                      '用户组编码必须以英文字母开头，只能包含字母、数字和下划线',
                  },
                ]}
              >
                <Input disabled={isEdit} placeholder="请输入用户组编码" />
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
                name="maxUserCount"
                rules={[{ required: true, message: '请输入最大用户数' }]}
              >
                <InputNumber
                  placeholder="请输入最大用户数"
                  className={cx('w-full')}
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="每日token限制"
                name={['tokenLimit', 'limitPerDay']}
                rules={[{ required: true, message: '请输入每日token限制数量' }]}
                tooltip={{
                  title: '0表示不限制每日token数量',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <InputNumber
                  placeholder="请输入每日token限制数量"
                  className={cx('w-full')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

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
