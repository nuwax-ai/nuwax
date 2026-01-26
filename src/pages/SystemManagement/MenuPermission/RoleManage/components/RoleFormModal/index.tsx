import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import { apiSystemModelList } from '@/services/systemManage';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
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
import { RoleStatusEnum, type RoleInfo } from '../../../types/role-manage';
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
  roleInfo?: RoleInfo;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

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
  // const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);
  // const [expandedMenuKeys, setExpandedMenuKeys] = useState<React.Key[]>([]);

  // const mockMenuTree: MenuNodeInfo[] = [
  //   {
  //     id: 1,
  //     name: '系统管理',
  //     children: [
  //       { id: 11, name: '用户管理', parentId: 1 },
  //       { id: 12, name: '角色管理', parentId: 1 },
  //     ],
  //   },
  //   {
  //     id: 2,
  //     name: '业务管理',
  //     children: [{ id: 21, name: '订单管理', parentId: 2 }],
  //   },
  // ];

  // 根据ID查询角色
  const { run: runGetRoleById, loading: getRoleByIdLoading } = useRequest(
    apiGetRoleById,
    {
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
          status: data.status === RoleStatusEnum.Enabled,
        });
        setSelectedModelIds(data.modelIds || []);
      },
    },
  );

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

  console.log('getRoleByIdLoading', getRoleByIdLoading);

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      // 查询模型列表
      runModelList();
      if (isEdit && roleInfo) {
        runGetRoleById(roleInfo.id);
        // 编辑模式：填充表单数据
        form.setFieldsValue({
          code: roleInfo.code,
          name: roleInfo.name,
          description: roleInfo.description,
          tokenLimit: {
            limitPerDay: roleInfo.tokenLimit?.limitPerDay || 0,
          },
          sortIndex: roleInfo.sortIndex || 0,
          status: roleInfo.status === RoleStatusEnum.Enabled,
        });
        setSelectedModelIds(roleInfo.modelIds || []);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        setSelectedModelIds([]);
      }
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

  // 计算菜单树展开的keys（默认展开所有父节点）
  // const defaultExpandedKeys = useMemo(() => {
  //   const getParentKeys = (menus: MenuNodeInfo[]): React.Key[] => {
  //     const keys: React.Key[] = [];
  //     menus.forEach((menu) => {
  //       if (menu.children && menu.children.length > 0) {
  //         keys.push(menu.id);
  //         keys.push(...getParentKeys(menu.children));
  //       }
  //     });
  //     return keys;
  //   };
  //   return expandedMenuKeys.length > 0
  //     ? expandedMenuKeys
  //     : getParentKeys(mockMenuTree);
  // }, [mockMenuTree, expandedMenuKeys]);

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

        {/* 系统字段配置 */}
        <div className={cx(styles.section)}>
          <div className={cx('flex', 'items-center', 'gap-4', 'mb-12')}>
            <h3 className={cx(styles.sectionTitle)}>系统字段配置</h3>
            <TooltipIcon
              title="系统字段配置用于控制角色的token限制和启用状态"
              icon={<InfoCircleOutlined />}
            />
          </div>
          <div className={cx(styles.systemFields)}>
            <Form.Item
              label="token限制"
              name={['tokenLimit', 'limitPerDay']}
              initialValue={0}
              rules={[{ required: true, message: '请输入token限制数量' }]}
              className={cx(styles.fieldItem)}
            >
              <InputNumber
                placeholder="请输入token限制"
                className={cx('w-full')}
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="排序"
              name="sortIndex"
              initialValue={0}
              className={cx(styles.fieldItem)}
            >
              <InputNumber
                placeholder="请输入排序"
                className={cx('w-full')}
                min={0}
              />
            </Form.Item>
            <Form.Item
              label="状态"
              name="status"
              valuePropName="checked"
              initialValue={true}
              className={cx(styles.fieldItem)}
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </div>
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

        {/* 菜单权限 */}
        {/* <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>菜单权限</h3>
          <Text type="secondary" className={cx(styles.sectionDesc)}>
            选择该角色可以访问的菜单,支持多选和父子级联选择
          </Text>
          <MenuPermissionTree
            menuTree={mockMenuTree}
            selectedKeys={selectedMenuIds}
            onSelect={setSelectedMenuIds}
            expandedKeys={defaultExpandedKeys}
            onExpand={setExpandedMenuKeys}
          />
        </div> */}
      </Form>
    </CustomFormModal>
  );
};

export default RoleFormModal;
