import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import { apiSystemModelList } from '@/services/systemManage';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Form, Input, InputNumber, Row, Switch, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiAddRole, apiUpdateRole } from '../../api';
import { RoleStatusEnum, type RoleInfo } from '../../type';
import DataModelSelector from '../DataModelSelector';
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
  // 模型ID列表 全部模型传[0],未选中任何模型不传值
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);
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

  // 新增/更新角色
  const { run: runAddRole, loading: addLoading } = useRequest(apiAddRole, {
    manual: true,
    onSuccess: () => {
      onSuccess();
    },
  });

  const { run: runUpdateRole, loading: updateLoading } = useRequest(
    apiUpdateRole,
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
      if (isEdit && roleData) {
        // 编辑模式：填充表单数据
        form.setFieldsValue({
          code: roleData.code,
          name: roleData.name,
          description: roleData.description,
          limitPerDay: roleData.tokenLimit?.limitPerDay,
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
      }
    }
  }, [open, isEdit, roleData, form]);

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setSelectedModelIds([]);
    setSelectedMenuIds([]);
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
              initialValue={0}
              name="limitPerDay"
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
              valuePropName="checked"
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
