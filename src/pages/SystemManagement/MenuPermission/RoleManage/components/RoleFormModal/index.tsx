import CustomFormModal from '@/components/CustomFormModal';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Col, Form, Input, Row, Select, Switch, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { apiAddRole, apiUpdateRole } from '../../api';
import {
  DataScopeEnum,
  RoleStatusEnum,
  type DataModelInfo,
  type MenuNodeInfo,
  type RoleInfo,
} from '../../type';
import DataModelSelector from '../DataModelSelector';
import MenuPermissionTree from '../MenuPermissionTree';
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
  roleData?: RoleInfo;
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
  roleData,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);
  const [expandedMenuKeys, setExpandedMenuKeys] = useState<React.Key[]>([]);

  // TODO: 从API获取数据模型列表
  const mockDataModels: DataModelInfo[] = [
    { id: 1, name: '用户模型', description: '用户数据表' },
    { id: 2, name: '订单模型', description: '订单数据表' },
    { id: 3, name: '产品模型', description: '产品数据表' },
    { id: 4, name: '合同模型', description: '合同数据表' },
    { id: 5, name: '财务模型', description: '财务数据表' },
    { id: 6, name: '库存模型', description: '库存数据表' },
    { id: 7, name: '报表模型', description: '报表数据表' },
  ];

  // TODO: 从API获取菜单树数据
  const mockMenuTree: MenuNodeInfo[] = [
    {
      id: 1,
      name: '系统管理',
      children: [
        { id: 11, name: '用户管理', parentId: 1 },
        { id: 12, name: '角色管理', parentId: 1 },
      ],
    },
    {
      id: 2,
      name: '业务管理',
      children: [{ id: 21, name: '订单管理', parentId: 2 }],
    },
  ];

  // 数据范围选项
  const dataScopeOptions = [
    { label: '全部数据', value: DataScopeEnum.All },
    { label: '本部门数据', value: DataScopeEnum.Department },
    { label: '仅本人数据', value: DataScopeEnum.Self },
  ];

  // 新增/更新角色
  const { run: runAddRole, loading: addLoading } = useRequest(apiAddRole, {
    manual: true,
    onSuccess: () => {
      onSuccess();
      // handleCancel();
    },
  });

  const { run: runUpdateRole, loading: updateLoading } = useRequest(
    apiUpdateRole,
    {
      manual: true,
      onSuccess: () => {
        onSuccess();
        // handleCancel();
      },
    },
  );

  const loading = addLoading || updateLoading;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (isEdit && roleData) {
        // 编辑模式：填充表单数据
        form.setFieldsValue({
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
          dataScope: roleData.dataScope,
          status: roleData.status === RoleStatusEnum.Enabled,
        });
        // TODO: 从API获取已选中的数据模型和菜单
        setSelectedModelIds([]);
        setSelectedMenuIds([]);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        setSelectedModelIds([]);
        setSelectedMenuIds([]);
        setExpandedMenuKeys([]);
      }
    }
  }, [open, isEdit, roleData, form]);

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedModelIds([]);
    setSelectedMenuIds([]);
    setExpandedMenuKeys([]);
    onCancel();
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        code: values.code,
        name: values.name,
        description: values.description || '',
        dataScope: values.dataScope,
        menuPermissionIds: selectedMenuIds.map((id) => Number(id)),
      };

      if (isEdit && roleData) {
        await runUpdateRole({
          id: roleData.id,
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
  const defaultExpandedKeys = useMemo(() => {
    const getParentKeys = (menus: MenuNodeInfo[]): React.Key[] => {
      const keys: React.Key[] = [];
      menus.forEach((menu) => {
        if (menu.children && menu.children.length > 0) {
          keys.push(menu.id);
          keys.push(...getParentKeys(menu.children));
        }
      });
      return keys;
    };
    return expandedMenuKeys.length > 0
      ? expandedMenuKeys
      : getParentKeys(mockMenuTree);
  }, [mockMenuTree, expandedMenuKeys]);

  return (
    <CustomFormModal
      form={form}
      title={isEdit ? '编辑角色' : '新增角色'}
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
                label="角色编码"
                name="code"
                rules={[{ required: true, message: '请输入角色编码' }]}
              >
                <Input placeholder="请输入角色编码" />
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

        {/* 数据权限配置 */}
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>数据权限配置</h3>
          <Text type="secondary" className={cx(styles.sectionDesc)}>
            选择该角色可以访问的数据模型,支持选择&ldquo;全部&rdquo;或具体模型
          </Text>
          <DataModelSelector
            models={mockDataModels}
            selectedIds={selectedModelIds}
            onChange={setSelectedModelIds}
          />
        </div>

        {/* 系统字段配置 */}
        <div className={cx(styles.section)}>
          <h3 className={cx(styles.sectionTitle)}>系统字段配置</h3>
          <div className={cx(styles.systemFields)}>
            <Form.Item
              label="数据范围"
              name="dataScope"
              rules={[{ required: true, message: '请选择数据范围' }]}
              className={cx(styles.fieldItem)}
            >
              <Select placeholder="请选择数据范围" options={dataScopeOptions} />
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
          <div className={cx(styles.tip)}>
            <InfoCircleOutlined className={cx(styles.tipIcon)} />
            <Text type="secondary" className={cx(styles.tipText)}>
              系统字段配置用于控制角色的数据访问范围和启用状态
            </Text>
          </div>
        </div>

        {/* 菜单权限 */}
        <div className={cx(styles.section)}>
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
        </div>
      </Form>
    </CustomFormModal>
  );
};

export default RoleFormModal;
