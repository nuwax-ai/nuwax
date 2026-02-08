import CustomFormModal from '@/components/CustomFormModal';
import Loading from '@/components/custom/Loading';
import type { MenuNodeInfo } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import type { ResourceTreeNode } from '@/pages/SystemManagement/MenuPermission/types/permission-resources';
import { DownOutlined } from '@ant-design/icons';
import { Form, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import { apiSystemUserListMenu } from '../../user-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserViewMenuModalProps {
  open: boolean;
  userId: number;
  onCancel: () => void;
}

/**
 * 用户查看菜单资源权限弹窗
 * @param open 是否打开
 * @param userId 用户ID
 * @param onCancel 取消回调
 * @returns
 */
const UserViewMenuModal: React.FC<UserViewMenuModalProps> = ({
  open,
  userId,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // 记录哪些菜单的资源树是展开的
  const [expandedResourceMenus, setExpandedResourceMenus] = useState<
    Set<number>
  >(new Set());
  // 记录哪些菜单节点是展开的（用于控制 Tree 组件的展开状态）
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // 查询用户的菜单权限列表
  const {
    data: menuList,
    loading,
    run: runGetMenuList,
  } = useRequest(apiSystemUserListMenu, {
    manual: true,
  });

  React.useEffect(() => {
    if (open && userId > 0) {
      runGetMenuList(userId);
    }
    if (!open) {
      // 关闭弹窗时重置展开状态
      setExpandedResourceMenus(new Set());
      setExpandedKeys([]);
    }
  }, [open, userId]);

  // 当菜单列表加载完成后，初始化展开状态（因为 defaultExpandAll 为 true，所以所有菜单和资源树都应该展开）
  React.useEffect(() => {
    if (menuList && menuList.length > 0) {
      const expandedSet = new Set<number>();
      const expandedKeysList: React.Key[] = [];

      const collectMenus = (menus: MenuNodeInfo[]) => {
        menus.forEach((menu) => {
          // 收集所有菜单ID（包括有子菜单和有资源树的菜单）
          if (menu.id !== 0) {
            expandedKeysList.push(menu.id);
          }
          // 收集有资源树的菜单
          if (menu.resourceTree && menu.resourceTree.length > 0) {
            expandedSet.add(menu.id);
          }
          // 递归处理子菜单
          if (menu.children && menu.children.length > 0) {
            collectMenus(menu.children);
          }
        });
      };
      collectMenus(menuList);
      setExpandedResourceMenus(expandedSet);
      setExpandedKeys(expandedKeysList);
    }
  }, [menuList]);

  /**
   * 将资源树数据转换为Tree组件需要的数据格式（只用于展示）
   */
  const convertResourceTreeToDataNode = (
    resources: ResourceTreeNode[],
  ): DataNode[] => {
    return resources.map((resource) => ({
      title: resource.name || `资源 ${resource.id}`,
      key: resource.id,
      value: resource.id,
      children: resource.children
        ? convertResourceTreeToDataNode(resource.children)
        : undefined,
    }));
  };

  /**
   * 渲染资源树（单独处理，显示在菜单下方，只用于展示）
   */
  const renderResourceTree = (menu: MenuNodeInfo) => {
    if (!menu.resourceTree || menu.resourceTree.length === 0) {
      return null;
    }

    // 如果该菜单的资源树未展开，则不显示
    if (!expandedResourceMenus.has(menu.id)) {
      return null;
    }

    const resourceTreeData = convertResourceTreeToDataNode(menu.resourceTree);

    return (
      <div className={styles.resourceTreeContainer}>
        <Tree
          switcherIcon={<DownOutlined />}
          treeData={resourceTreeData}
          showLine={{ showLeafIcon: false }}
          blockNode
          className={styles.resourceTree}
        />
      </div>
    );
  };

  // 处理菜单展开/折叠
  const handleExpand = useCallback(
    (newExpandedKeys: React.Key[]) => {
      // 确保 newExpandedKeys 是数组格式
      const expandedKeysArray = Array.isArray(newExpandedKeys)
        ? newExpandedKeys
        : [];

      // 过滤掉虚拟资源节点的 key
      const filteredKeys = expandedKeysArray.filter(
        (key) => !String(key).startsWith('resource-'),
      );

      // 更新菜单节点的展开状态
      setExpandedKeys(filteredKeys);

      // 根据新的展开状态，同步更新资源树的展开状态
      // 遍历所有菜单，如果菜单在 filteredKeys 中且有资源树，则展开资源树
      const newExpandedResourceMenus = new Set<number>();

      const checkMenu = (menus: MenuNodeInfo[]) => {
        menus.forEach((menu) => {
          if (menu.id !== 0) {
            // 如果菜单节点是展开的，且有资源树，则展开资源树
            if (
              filteredKeys.includes(menu.id) &&
              menu.resourceTree &&
              menu.resourceTree.length > 0
            ) {
              newExpandedResourceMenus.add(menu.id);
            }
          }
          // 递归处理子菜单
          if (menu.children && menu.children.length > 0) {
            checkMenu(menu.children);
          }
        });
      };

      if (menuList && menuList.length > 0) {
        checkMenu(menuList);
      }

      setExpandedResourceMenus(newExpandedResourceMenus);
    },
    [menuList],
  );

  // 将菜单数据转换为Tree组件需要的数据格式
  const treeData = useMemo(() => {
    const convertToTreeData = (menus: MenuNodeInfo[]): DataNode[] => {
      return menus
        .filter((menu) => menu.id !== 0) // 过滤掉根节点（id为0）
        .map((menu) => {
          // 判断是否有子菜单或资源树
          const hasChildren = menu.children && menu.children.length > 0;
          const hasResourceTree =
            menu.resourceTree && menu.resourceTree.length > 0;
          // 如果有子菜单或资源树，则应该显示折叠展开图标
          const shouldShowSwitcher = hasChildren || hasResourceTree;

          return {
            title: menu.name || `菜单 ${menu.id}`, // 只保存菜单名称，资源树在 titleRender 中渲染
            key: menu.id,
            value: menu.id, // 使用菜单ID作为值
            children: menu.children
              ? convertToTreeData(menu.children)
              : hasResourceTree
              ? [{ key: `resource-${menu.id}`, title: '', isLeaf: true }] // 如果有资源树但没有子菜单，添加一个虚拟子节点以显示折叠展开图标
              : undefined,
            menuData: menu, // 保存菜单原始数据，用于渲染资源树
            isLeaf: !shouldShowSwitcher, // 如果没有子菜单也没有资源树，则标记为叶子节点
          };
        });
    };

    if (!menuList || menuList.length === 0) {
      return [];
    }

    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (menuList.length === 1 && menuList[0].id === 0) {
      const rootNode = menuList[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }

    // 否则过滤掉所有 id 为 0 的节点
    return convertToTreeData(menuList);
  }, [menuList]);

  return (
    <CustomFormModal
      form={form}
      title="查看菜单资源权限"
      open={open}
      onCancel={onCancel}
      onConfirm={onCancel}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <div className={cx(styles.treeContainer)}>
        {loading ? (
          <Loading className={cx(styles.loading)} />
        ) : treeData && treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            expandedKeys={expandedKeys}
            blockNode
            showLine={{ showLeafIcon: false }}
            switcherIcon={<DownOutlined />}
            onExpand={handleExpand}
            titleRender={(nodeData: any) => {
              // 如果是虚拟资源节点，返回空内容（样式会隐藏整个节点）
              if (
                nodeData.key &&
                String(nodeData.key).startsWith('resource-')
              ) {
                return <span style={{ display: 'none' }} />;
              }

              const menuData = nodeData.menuData as MenuNodeInfo | undefined;
              if (!menuData) {
                return <span>{nodeData.title}</span>;
              }
              return (
                <div className={styles.menuNodeWrapper}>
                  <span className={styles.menuName}>{menuData.name}</span>
                  {renderResourceTree(menuData)}
                </div>
              );
            }}
          />
        ) : (
          <div className={cx(styles.empty)}>没有数据</div>
        )}
      </div>
    </CustomFormModal>
  );
};

export default UserViewMenuModal;
