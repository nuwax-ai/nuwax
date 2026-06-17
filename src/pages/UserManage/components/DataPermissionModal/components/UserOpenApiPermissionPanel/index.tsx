/**
 * 用户数据权限弹窗 — API 权限 Tab（只读）
 *
 * 树结构、字段与系统管理端 ApiPermissionTabPanel 一致；勾选与 RPM/RPD 由接口返回的 openApiConfigs 决定，不可编辑。
 */
import Loading from '@/components/custom/Loading';
import type { OpenApiConfigInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { dict } from '@/services/i18nRuntime';
import type { OpenApiDefinition } from '@/types/interfaces/account';
import { Empty, InputNumber, Tree, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
const { Text } = Typography;

/** 为整棵树禁用勾选交互，仅展示 checkedKeys 对应的选中态 */
function withTreeNodeCheckboxDisabled(nodes: OpenApiDefinition[]): any[] {
  return (nodes ?? []).map((node) => ({
    ...node,
    disableCheckbox: true,
    apiList: node.apiList?.length
      ? withTreeNodeCheckboxDisabled(node.apiList)
      : undefined,
  }));
}

export interface UserOpenApiPermissionReadonlyTabProps {
  openApiListLoading: boolean;
  openApiTreeData: OpenApiDefinition[];
  /** 来自用户数据权限接口的 openApiConfigs，决定勾选与 RPM/RPD 展示 */
  openApiConfigs: OpenApiConfigInfo[];
}

/** 用户数据API权限弹窗 — API 权限 Tab */
const UserOpenApiPermissionPanel: React.FC<
  UserOpenApiPermissionReadonlyTabProps
> = ({ openApiListLoading, openApiTreeData, openApiConfigs }) => {
  const treeData = useMemo(
    () => withTreeNodeCheckboxDisabled(openApiTreeData),
    [openApiTreeData],
  );

  const checkedKeys = useMemo(
    () => openApiConfigs.map((c) => c.key),
    [openApiConfigs],
  );

  const configByKey = useMemo(() => {
    const m = new Map<string, OpenApiConfigInfo>();
    openApiConfigs.forEach((c) => m.set(c.key, c));
    return m;
  }, [openApiConfigs]);

  // 树节点标题渲染
  const titleRender = useCallback(
    (node: OpenApiDefinition) => {
      const isLeaf = !node.apiList?.length;
      const cfg = configByKey.get(node.key);
      return (
        <div className={styles.openApiTreeTitleRow}>
          <div className={styles.openApiTreeTitleLeft}>
            <span
              className={cx(styles.openApiTreeTitleName, 'text-ellipsis')}
              title={node.name}
            >
              {node.name}
            </span>
            {node.path ? (
              <span
                className={cx(styles.openApiTreeTitlePath, 'text-ellipsis')}
                title={node.path}
              >
                {node.path}
              </span>
            ) : null}
          </div>
          {isLeaf && cfg ? (
            <div
              className={styles.openApiTreeTitleControls}
              onClick={(e) => e.stopPropagation()}
            >
              <Text className={styles['font-12']}>
                {dict('PC.Pages.DataPermissionTabPanel.rpmLabel')}
              </Text>
              <InputNumber
                size="small"
                min={-1}
                disabled
                className={styles['input-number']}
                value={cfg.rpm}
              />
              <Text className={styles['font-12']}>
                {dict('PC.Pages.DataPermissionTabPanel.rpdLabel')}
              </Text>
              <InputNumber
                size="small"
                min={-1}
                disabled
                className={styles['input-number']}
                value={cfg.rpd}
              />
            </div>
          ) : null}
        </div>
      );
    },
    [configByKey],
  );

  return (
    <div
      className={cx('h-full', 'overflow-hide', styles['api-permission-tree'])}
    >
      {openApiListLoading ? (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Loading />
        </div>
      ) : (
        <div className={cx('h-full', 'overflow-y', 'py-16')}>
          {treeData?.length > 0 ? (
            <Tree
              checkable
              checkStrictly={false}
              defaultExpandAll
              checkedKeys={checkedKeys}
              selectable={false}
              treeData={treeData}
              fieldNames={{ title: 'name', key: 'key', children: 'apiList' }}
              titleRender={(node) => titleRender(node as OpenApiDefinition)}
              blockNode
            />
          ) : (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <Empty
                description={dict(
                  'PC.Pages.DataPermissionTabPanel.noApiPermission',
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserOpenApiPermissionPanel;
