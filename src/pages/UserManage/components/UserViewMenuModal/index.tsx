import CustomFormModal from '@/components/CustomFormModal';
import Loading from '@/components/custom/Loading';
import type { MenuNodeInfo } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import type { ResourceTreeNode } from '@/pages/SystemManagement/MenuPermission/types/permission-resources';
import { DownOutlined } from '@ant-design/icons';
import { Form, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import classNames from 'classnames';
import React, { useMemo } from 'react';
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
  }, [open, userId]);

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

  // 将菜单数据转换为Tree组件需要的数据格式
  const treeData = useMemo(() => {
    const convertToTreeData = (menus: MenuNodeInfo[]): DataNode[] => {
      return menus
        .filter((menu) => menu.id !== 0) // 过滤掉根节点（id为0）
        .map((menu) => ({
          title: menu.name || `菜单 ${menu.id}`, // 只保存菜单名称，资源树在 titleRender 中渲染
          key: menu.id,
          value: menu.id,
          children: menu.children
            ? convertToTreeData(menu.children)
            : undefined,
          menuData: menu, // 保存菜单原始数据，用于渲染资源树
        }));
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
            defaultExpandAll
            blockNode
            showLine={{ showLeafIcon: false }}
            switcherIcon={<DownOutlined />}
            titleRender={(nodeData: any) => {
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
          <div className={cx(styles.empty)}>暂未配置权限</div>
        )}
      </div>
    </CustomFormModal>
  );
};

export default UserViewMenuModal;
