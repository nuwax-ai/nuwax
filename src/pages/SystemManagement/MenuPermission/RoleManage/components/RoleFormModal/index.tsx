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
const { Text } = Typography;
const cx = classNames.bind(styles);

interface RoleFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
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
  roleInfo,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  // 模型ID列表 全部模型传[0],未选中任何模型不传值
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  // 是否全部模型已选中
  const [allModelSelected, setAllModelSelected] = useState<boolean>(false);

  // 根据ID查询角色
  const { run: runGetRoleById } = useRequest(apiGetRoleById, {
    manual: true,
    onSuccess: (data: RoleInfo) => {
      form.setFieldsValue({
        code: data.code,
        name: data.name,
        description: data.description,
        tokenLimit: {
          limitPerDay: data.tokenLimit?.limitPerDay || 0,
        },
        sortIndex: data.sortIndex || 0,
        source: data.source || RoleSourceEnum.UserDefined,
        status: data.status === RoleStatusEnum.Enabled,
      });
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

  // 查询模型列表
  const { run: runModelList, data: modelList } = useRequest(
    apiSystemModelList,
    {
      manual: true,
    },
  );

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
      if (isEdit && roleInfo) {
        runGetRoleById(roleInfo.id);
      }
    } else {
      // 新增模式：重置表单
      form.resetFields();
      form.setFieldsValue({
        source: RoleSourceEnum.UserDefined,
        sortIndex: 0,
        status: true,
        tokenLimit: {
          limitPerDay: 0,
        },
      });
      setAllModelSelected(false);
      setSelectedModelIds([]);
    }
  }, [open, isEdit, roleInfo, form]);

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
        status: values.status
          ? RoleStatusEnum.Enabled
          : RoleStatusEnum.Disabled,
        modelIds,
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
                <Input disabled={isEdit} placeholder="请输入角色编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="角色名称"
                name="name"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="来源" name="source">
                <Select
                  placeholder="请选择来源"
                  options={ROLE_SOURCE_OPTIONS}
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
              <Form.Item label="排序" name="sortIndex">
                <InputNumber
                  placeholder="请输入排序"
                  className={cx('w-full')}
                  min={0}
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
              maxLength={200}
            />
          </Form.Item>
        </div>

        {/* 数据权限配置 */}
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>数据权限配置</h3>
          <Text type="secondary" className={cx(styles.sectionDesc)}>
            选择该角色可以访问的数据模型,支持选择&ldquo;全部&rdquo;或具体模型
          </Text>
          <DataModelSelector
            models={modelList}
            selectedIds={selectedModelIds}
            onChange={setSelectedModelIds}
          />
        </div>
      </Form>
    </CustomFormModal>
  );
};

export default RoleFormModal;
