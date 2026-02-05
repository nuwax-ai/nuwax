import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiAddMenu,
  apiGetMenuById,
  apiGetMenuList,
  apiUpdateMenu,
} from '../../../services/menu-manage';
import { apiGetResourceList } from '../../../services/permission-resources';
import {
  MenuSourceEnum,
  MenuVisibleEnum,
  type MenuNodeInfo,
} from '../../../types/menu-manage';
import {
  ResourceBindTypeEnum,
  ResourceTreeNode,
} from '../../../types/permission-resources';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface MenuFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 编辑时的菜单数据 */
  menuInfo?: MenuNodeInfo | null;
  /** 父菜单（新增子菜单时使用） */
  parentMenu?: MenuNodeInfo | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

// 菜单来源选项 来源 1:系统内置 2:用户自定义
const MENU_SOURCE_OPTIONS = [
  { label: '系统内置', value: MenuSourceEnum.SystemBuiltIn },
  { label: '用户自定义', value: MenuSourceEnum.UserDefined },
];

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
  // 选中的资源码ID
  const [selectedResourceIds, setSelectedResourceIds] = useState<React.Key[]>(
    [],
  );
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');

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

  // 根据条件查询菜单列表（树形结构）（用于父菜单选择）
  const { run: runGetMenuTree, data: menuTreeList } = useRequest(
    apiGetMenuList,
    {
      manual: true,
    },
  );

  // 根据条件查询权限资源列表（树形结构）（用于关联资源码选择）
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
      // 根据条件查询权限资源列表（树形结构）（用于关联资源码选择）
      runGetResourceList();
      if (isEdit && menuInfo) {
        // 编辑模式：查询菜单详情
        runGetMenuById(menuInfo.id);
      }
    } else {
      // 新增模式：重置表单
      form.resetFields();
      setImageUrl('');
      setSelectedResourceIds([]);
      form.setFieldsValue({
        sortIndex: 1,
        visible: true,
        source: MenuSourceEnum.UserDefined,
        // 如果有父菜单，自动设置父节点
        parentId: parentMenu?.id,
      });
    }
  }, [open, isEdit, menuInfo, parentMenu]);

  const loading = addLoading || updateLoading;

  // 将菜单树转换为TreeSelect需要的数据格式
  const menuTreeSelectData = useMemo(() => {
    const convertToTreeData = (menus: any[]): any[] => {
      return menus
        .filter((menu) => menu.id !== 0) // 过滤掉根菜单（id为0）
        .map((menu) => ({
          title: menu.name,
          value: menu.id,
          key: menu.id,
          children: menu.children
            ? convertToTreeData(menu.children)
            : undefined,
        }));
    };
    if (!menuTreeList || !menuTreeList.length) {
      return [];
    }
    // 如果第一个节点是根菜单（id为0），则只返回其子节点
    if (menuTreeList.length === 1 && menuTreeList[0].id === 0) {
      const rootNode = menuTreeList[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return convertToTreeData(menuTreeList);
  }, [menuTreeList]);

  // 将资源树转换为Tree需要的数据格式（用于关联资源码选择）
  const resourceTreeData = useMemo(() => {
    const convertToTreeData = (resources: ResourceTreeNode[]): any[] => {
      return resources
        .filter((resource) => resource.id !== 0) // 过滤掉根节点（id为0）
        .map((resource) => ({
          title: `${resource.name}-(${resource.code})`,
          key: resource.id,
          value: resource.id,
          children: resource.children
            ? convertToTreeData(resource.children)
            : undefined,
        }));
    };
    if (!resourceTreeList || !resourceTreeList.length) {
      return [];
    }
    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (resourceTreeList.length === 1 && resourceTreeList[0].id === 0) {
      const rootNode = resourceTreeList[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return convertToTreeData(resourceTreeList);
  }, [resourceTreeList]);

  /**
   * 将树形结构扁平化为一维数组
   * @param resources 资源树
   * @returns 扁平化后的资源数组
   */
  const flattenResourceTree = useCallback(
    (resources: ResourceTreeNode[]): ResourceTreeNode[] => {
      const result: ResourceTreeNode[] = [];
      const traverse = (nodes: ResourceTreeNode[]) => {
        nodes.forEach((node) => {
          result.push(node);
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        });
      };
      traverse(resources);
      return result;
    },
    [],
  );

  /**
   * 获取已绑定资源ID列表
   * @param resources 资源树
   * @returns 已绑定资源ID列表
   */
  const getBoundResourceIds = useCallback(
    (resources: ResourceTreeNode[]): number[] => {
      // 先将树形结构扁平化为一维数组
      const flatResources = flattenResourceTree(resources);
      // 过滤出已绑定（全部绑定或部分绑定）的资源，并提取 id
      return flatResources
        .filter(
          (resource) =>
            resource.resourceBindType === ResourceBindTypeEnum.AllBound,
        )
        .map((resource) => resource.id);
    },
    [flattenResourceTree],
  );

  // 初始化表单数据
  useEffect(() => {
    if (isEdit && menuInfoResponse) {
      setImageUrl(menuInfoResponse.icon || '');
      form.setFieldsValue({
        code: menuInfoResponse.code,
        name: menuInfoResponse.name,
        description: menuInfoResponse.description,
        parentId: menuInfoResponse.parentId || undefined,
        path: menuInfoResponse.path,
        sortIndex: menuInfoResponse.sortIndex || 1,
        visible: menuInfoResponse.visible === MenuVisibleEnum.Visible,
        source: menuInfoResponse.source || MenuSourceEnum.UserDefined,
      });
      // 设置关联资源码：从 resourceTree 中提取已绑定和部分绑定的资源 id
      const resourceTree = menuInfoResponse.resourceTree;
      if (resourceTree) {
        setSelectedResourceIds(getBoundResourceIds(resourceTree));
      }
    }
  }, [isEdit, menuInfoResponse]);

  // 处理关联资源码ID选择（onCheck 事件）
  const handleResourceIdsCheck = (
    checkedKeys:
      | React.Key[]
      | { checked: React.Key[]; halfChecked: React.Key[] },
  ) => {
    // Tree 组件的 onCheck 可能返回数组或对象
    const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
    setSelectedResourceIds(keys);
  };

  /**
   * 构建资源树结构
   * 根据 resourceTreeList 和 selectedResourceCodes 构建完整的 resourceTree
   */
  const buildResourceTree = (
    resources: ResourceTreeNode[],
    selectedIds: React.Key[],
  ): ResourceTreeNode[] => {
    return resources.map((resource) => {
      const isSelected = selectedIds.includes(resource.id || '');
      const hasChildren = resource.children && resource.children.length > 0;

      let resourceBindType = ResourceBindTypeEnum.Unbound; // 默认未绑定
      let children: ResourceTreeNode[] | undefined;

      if (hasChildren) {
        // 递归处理子节点
        children = buildResourceTree(resource.children!, selectedIds);

        // 检查子节点的绑定状态
        const allChildrenBound = children.every(
          (child) => child.resourceBindType === ResourceBindTypeEnum.AllBound,
        );
        const someChildrenBound = children.some(
          (child) =>
            child.resourceBindType === ResourceBindTypeEnum.AllBound ||
            child.resourceBindType === ResourceBindTypeEnum.PartiallyBound,
        );

        if (isSelected && allChildrenBound) {
          // 当前节点选中且所有子节点都是全部绑定
          resourceBindType = ResourceBindTypeEnum.AllBound;
        } else if (isSelected || someChildrenBound) {
          // 当前节点选中或部分子节点绑定
          resourceBindType = ResourceBindTypeEnum.PartiallyBound;
        } else {
          // 当前节点未选中且没有子节点绑定
          resourceBindType = ResourceBindTypeEnum.Unbound;
        }
      } else {
        // 叶子节点：选中则为全部绑定，未选中则为未绑定
        resourceBindType = isSelected
          ? ResourceBindTypeEnum.AllBound
          : ResourceBindTypeEnum.Unbound;
      }

      return {
        id: resource.id,
        resourceBindType,
        children,
      };
    });
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 构建资源树结构
      const resourceTree = resourceTreeList
        ? buildResourceTree(resourceTreeList, selectedResourceIds)
        : undefined;

      const formData = {
        ...values,
        icon: imageUrl,
        visible: values.visible
          ? MenuVisibleEnum.Visible
          : MenuVisibleEnum.Hidden,
        // 传递构建好的资源树
        resourceTree,
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
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        className={cx(styles.form)}
      >
        {/* 基本信息 */}
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            svgIconName="icons-workspace-agent"
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="菜单编码"
              name="code"
              rules={[
                { required: true, message: '请输入菜单编码' },
                {
                  pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                  message:
                    '菜单编码必须以英文字母开头，只能包含字母、数字和下划线',
                },
              ]}
            >
              <Input
                disabled={isEdit}
                placeholder="请输入菜单编码"
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="菜单名称"
              name="name"
              rules={[{ required: true, message: '请输入菜单名称' }]}
            >
              <Input placeholder="请输入菜单名称" maxLength={50} showCount />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="父菜单" name="parentId">
              <TreeSelect
                placeholder="请选择父菜单（无）"
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
              label="路由路径"
              name="path"
              rules={[
                {
                  pattern: /^\/[a-zA-Z0-9/?#&=._:@%+ -]+$/,
                  message:
                    '路由路径必须以斜杠开头，只能包含英文字母、数字、斜杠和URL常见特殊字符（?、#、&、=、.、_、-、:、%、@、+、空格）',
                },
                {
                  max: 500,
                  message: '路由路径长度不能超过500个字符',
                },
              ]}
              tooltip={{
                title:
                  '静态路由，例如：/system/menu; 动态路由，例如：/system/menu/:id',
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input placeholder="请输入路由路径，例如：/system/menu" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="来源" name="source">
              <Select placeholder="请选择来源" options={MENU_SOURCE_OPTIONS} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="排序" name="sortIndex">
              <InputNumber
                placeholder="请输入排序"
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="是否显示"
          name="visible"
          valuePropName="checked"
          tooltip={{
            title: '显示或隐藏此菜单',
            icon: <InfoCircleOutlined />,
          }}
        >
          <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <TextArea
            placeholder="请输入描述"
            className="dispose-textarea-count"
            autoSize={{ minRows: 3, maxRows: 5 }}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* 关联资源码 */}
        <Form.Item
          label="关联资源码"
          tooltip={{
            title: '选择该菜单可以访问的资源权限',
            icon: <InfoCircleOutlined />,
          }}
        >
          {resourceTreeData && resourceTreeData.length > 0 && (
            <Tree
              checkable
              defaultExpandAll
              treeData={resourceTreeData}
              checkedKeys={selectedResourceIds}
              onCheck={handleResourceIdsCheck}
              className={cx(styles.resourceTree)}
            />
          )}
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default MenuFormModal;
