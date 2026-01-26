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
  Tree,
  TreeSelect,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiAddMenu,
  apiGetMenuById,
  apiGetMenuTree,
  apiUpdateMenu,
} from '../../../services/menu-manage';
import { apiGetResourceList } from '../../../services/permission-resources';
import {
  MenuStatusEnum,
  MenuTypeEnum,
  type MenuInfo,
  type MenuNodeInfo,
} from '../../../types/menu-manage';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface MenuFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 编辑时的菜单数据 */
  menuInfo?: MenuInfo | null;
  /** 父菜单（新增子菜单时使用） */
  parentMenu?: MenuNodeInfo | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

/**
 * 菜单表单Modal组件
 * 用于新增或编辑菜单信息
 */
const MenuFormModal: React.FC<MenuFormModalProps> = ({
  open,
  isEdit = false,
  menuInfo,
  parentMenu,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [menuType, setMenuType] = useState<MenuTypeEnum>(MenuTypeEnum.Parent);
  const [selectedResourceCodes, setSelectedResourceCodes] = useState<
    React.Key[]
  >([]);

  // 新增菜单
  const { run: runAddMenu, loading: addLoading } = useRequest(apiAddMenu, {
    manual: true,
    onSuccess: () => {
      message.success('新增菜单成功');
      onSuccess();
    },
  });

  // 更新菜单
  const { run: runUpdateMenu, loading: updateLoading } = useRequest(
    apiUpdateMenu,
    {
      manual: true,
      onSuccess: () => {
        message.success('更新菜单成功');
        onSuccess();
      },
    },
  );

  // 根据ID查询菜单
  const { run: runGetMenuById, data: menuInfoResponse } = useRequest(
    apiGetMenuById,
    {
      manual: true,
    },
  );

  // 查询菜单树列表（用于父菜单选择）
  const { run: runGetMenuTree, data: menuTreeList } = useRequest(
    apiGetMenuTree,
    {
      manual: true,
    },
  );

  // 查询资源列表（用于关联资源码选择）
  const { run: runGetResourceList, data: resourceTreeList } = useRequest(
    apiGetResourceList,
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      // 查询菜单树列表和资源列表
      runGetMenuTree();
      runGetResourceList();
      if (isEdit && menuInfo) {
        // 编辑模式：查询菜单详情
        runGetMenuById(menuInfo.id);
      }
    }
  }, [open]);

  const loading = addLoading || updateLoading;

  // 将菜单树转换为TreeSelect需要的数据格式
  const menuTreeSelectData = useMemo(() => {
    const convertToTreeData = (menus: any[]): any[] => {
      return menus.map((menu) => ({
        title: menu.name,
        value: menu.id,
        key: menu.id,
        children: menu.children ? convertToTreeData(menu.children) : undefined,
      }));
    };
    return menuTreeList ? convertToTreeData(menuTreeList) : [];
  }, [menuTreeList]);

  // 将资源树转换为Tree需要的数据格式（用于关联资源码选择）
  const resourceTreeData = useMemo(() => {
    const convertToTreeData = (resources: any[]): any[] => {
      return resources.map((resource) => ({
        title: `${resource.name} (${resource.code})`,
        key: resource.code,
        value: resource.code,
        children: resource.children
          ? convertToTreeData(resource.children)
          : undefined,
      }));
    };
    return resourceTreeList ? convertToTreeData(resourceTreeList) : [];
  }, [resourceTreeList]);

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (isEdit && menuInfoResponse) {
        // 编辑模式：填充表单数据
        const type = menuInfoResponse.type || MenuTypeEnum.Parent;
        setMenuType(type);
        form.setFieldsValue({
          code: menuInfoResponse.code,
          name: menuInfoResponse.name,
          description: menuInfoResponse.description,
          type: type,
          parentId: menuInfoResponse.parentId || undefined,
          path: menuInfoResponse.path,
          icon: menuInfoResponse.icon,
          sortIndex: menuInfoResponse.sortIndex || 0,
          status: menuInfoResponse.status === MenuStatusEnum.Enabled,
        });
        // 设置关联资源码
        if (menuInfoResponse.resourceCodes) {
          setSelectedResourceCodes(menuInfoResponse.resourceCodes);
        }
      } else {
        // 新增模式：重置表单
        form.resetFields();
        setMenuType(MenuTypeEnum.Parent);
        setSelectedResourceCodes([]);
        form.setFieldsValue({
          sortIndex: 0,
          status: true,
          type: MenuTypeEnum.Parent,
          // 如果有父菜单，自动设置父节点
          parentId: parentMenu?.id,
        });
      }
    }
  }, [open, isEdit, menuInfoResponse, parentMenu, form]);

  // 处理菜单类型变化
  const handleMenuTypeChange = (value: MenuTypeEnum) => {
    setMenuType(value);
    // 如果不是末级菜单，清空关联资源码
    if (value !== MenuTypeEnum.Leaf) {
      setSelectedResourceCodes([]);
    }
  };

  // 处理关联资源码选择
  const handleResourceCodesChange = (checkedKeys: React.Key[]) => {
    setSelectedResourceCodes(checkedKeys);
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        code: values.code,
        name: values.name,
        description: values.description || '',
        type: values.type,
        parentId: values.parentId || undefined,
        path: values.path,
        icon: values.icon,
        sortIndex: values.sortIndex || 0,
        status: values.status
          ? MenuStatusEnum.Enabled
          : MenuStatusEnum.Disabled,
        // 仅末级菜单才传递关联资源码
        resourceCodes:
          values.type === MenuTypeEnum.Leaf
            ? selectedResourceCodes.map((key) => String(key))
            : undefined,
      };

      if (isEdit && menuInfo) {
        await runUpdateMenu({
          id: menuInfo.id,
          ...formData,
        });
      } else {
        await runAddMenu(formData);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 菜单类型选项
  const menuTypeOptions = [
    { label: '父级菜单', value: MenuTypeEnum.Parent },
    { label: '末级菜单', value: MenuTypeEnum.Leaf },
  ];

  return (
    <CustomFormModal
      form={form}
      title={isEdit ? '编辑菜单' : '新增菜单'}
      open={open}
      loading={loading}
      okText={isEdit ? '保存' : '创建'}
      width={800}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      classNames={{
        body: cx(styles.modalBody),
        header: cx(styles.modalHeader),
      }}
    >
      {/* 副标题 */}
      <div className={cx(styles.modalSubtitle)}>
        {isEdit ? '编辑菜单信息' : '创建新的菜单'}
      </div>

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
                label="菜单编码"
                name="code"
                rules={[{ required: true, message: '请输入菜单编码' }]}
              >
                <Input placeholder="请输入菜单编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="菜单名称"
                name="name"
                rules={[{ required: true, message: '请输入菜单名称' }]}
              >
                <Input placeholder="请输入菜单名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="父菜单" name="parentId">
                <TreeSelect
                  placeholder="请选择父菜单（无（根菜单））"
                  treeData={menuTreeSelectData}
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  filterTreeNode={(inputValue, node) =>
                    (node.title as string)
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="菜单类型"
                name="type"
                rules={[{ required: true, message: '请选择菜单类型' }]}
              >
                <Select
                  placeholder="请选择菜单类型"
                  options={menuTypeOptions}
                  onChange={handleMenuTypeChange}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="路由路径" name="path">
                <Input placeholder="请输入路由路径" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排序" name="sortIndex" initialValue={0}>
                <InputNumber
                  placeholder="请输入排序"
                  className={cx('w-full')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="图标" name="icon">
            <Input placeholder="请输入图标" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
            initialValue={true}
            tooltip={{
              title: '启用或禁用此菜单',
              icon: <InfoCircleOutlined />,
            }}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea
              placeholder="请输入描述"
              className="dispose-textarea-count"
              autoSize={{ minRows: 3, maxRows: 5 }}
              showCount
              maxLength={200}
            />
          </Form.Item>
        </div>

        {/* 关联资源码（仅末级菜单） */}
        {menuType === MenuTypeEnum.Leaf && (
          <div className={cx(styles.section)}>
            <h3 className={cx(styles.sectionTitle)}>关联资源码</h3>
            <p className={cx(styles.sectionDesc)}>
              仅末级菜单可以关联资源码,选择该菜单可以访问的资源权限
            </p>
            <Form.Item name="resourceCodes">
              <Tree
                checkable
                defaultExpandAll
                treeData={resourceTreeData}
                checkedKeys={selectedResourceCodes}
                onCheck={handleResourceCodesChange}
                className={cx(styles.resourceTree)}
              />
            </Form.Item>
          </div>
        )}
      </Form>
    </CustomFormModal>
  );
};

export default MenuFormModal;
