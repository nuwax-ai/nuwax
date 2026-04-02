/**
 * 数据权限弹窗 —「API 权限」Tab 面板
 *
 * 功能：展示开放 API 树（可勾选）；勾选结果写入 openApiConfigsCache（含 key、rpm、rpd）。
 * 叶子节点可在标题行编辑每分钟/每天调用次数；-1 表示不限制（含义与业务 tooltip 一致）。
 * 树数据由父组件拉取后传入；本组件内处理勾选合并与标题渲染。
 *
 * @see DataPermissionModal
 */
import Loading from '@/components/custom/Loading';
import type { OpenApiDefinition } from '@/types/interfaces/account';
import { Empty, InputNumber, Tree, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import type { OpenApiConfigInfo } from '../../../types/role-manage';
import styles from '../index.less';

const cx = classNames.bind(styles);
const { Text } = Typography;

/** API 权限 Tab：开放 API 树 + 勾选配置缓存 */
export interface ApiPermissionTabPanelProps {
  /** 拉取开放 API 列表中 */
  openApiListLoading: boolean;
  /** 接口返回的树形数据（字段 name/key/apiList） */
  openApiTreeData: OpenApiDefinition[];
  /** 当前勾选的 API 及其 RPM/RPD，与保存参数 openApiConfigs 对应 */
  openApiConfigsCache: OpenApiConfigInfo[];
  setOpenApiConfigsCache: React.Dispatch<
    React.SetStateAction<OpenApiConfigInfo[]>
  >;
}

const ApiPermissionTabPanel: React.FC<ApiPermissionTabPanelProps> = ({
  openApiListLoading,
  openApiTreeData,
  openApiConfigsCache,
  setOpenApiConfigsCache,
}) => {
  /** 勾选变化：按新 key 集合重建列表，保留仍选中项的 rpm/rpd，新增项默认 -1 */
  const handleOpenApiTreeCheck = useCallback(
    (
      keys: React.Key[] | { checked: React.Key[]; halfChecked?: React.Key[] },
    ) => {
      const raw = Array.isArray(keys) ? keys : keys.checked;
      const keySet = new Set((raw as React.Key[]).map((k) => String(k)));
      setOpenApiConfigsCache((prev) => {
        const byKey = new Map(prev.map((c) => [c.key, c]));
        const next: OpenApiConfigInfo[] = [];
        keySet.forEach((key) => {
          const existing = byKey.get(key);
          next.push(
            existing ?? {
              key,
              rpm: -1,
              rpd: -1,
            },
          );
        });
        return next;
      });
    },
    [setOpenApiConfigsCache],
  );

  /** 树节点标题：名称 + path；叶子且已勾选时展示 RPM/RPD 输入 */
  const openApiTitleRender = useCallback(
    (node: OpenApiDefinition) => {
      const isLeaf = !node.apiList?.length;
      const cfg = openApiConfigsCache.find((c) => c.key === node.key);
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
              <Text className={styles['font-12']}>每分钟调用次数</Text>
              <InputNumber
                size="small"
                min={-1}
                className={styles['input-number']}
                value={cfg.rpm}
                onChange={(v) => {
                  setOpenApiConfigsCache((prev) =>
                    prev.map((c) =>
                      c.key === node.key ? { ...c, rpm: v ?? 0 } : c,
                    ),
                  );
                }}
              />
              <Text className={styles['font-12']}>每天调用次数</Text>
              <InputNumber
                size="small"
                min={-1}
                className={styles['input-number']}
                value={cfg.rpd}
                onChange={(v) => {
                  setOpenApiConfigsCache((prev) =>
                    prev.map((c) =>
                      c.key === node.key ? { ...c, rpd: v ?? 0 } : c,
                    ),
                  );
                }}
              />
            </div>
          ) : null}
        </div>
      );
    },
    [openApiConfigsCache, setOpenApiConfigsCache],
  );

  return (
    <div className={cx('h-full', 'overflow-hide')}>
      {/* 加载完成后展示可滚动区域内的树或空态 */}
      {openApiListLoading ? (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Loading />
        </div>
      ) : (
        <div className={cx('h-full', 'overflow-y', 'py-16')}>
          {openApiTreeData?.length > 0 ? (
            <Tree
              checkable
              checkStrictly={false}
              defaultExpandAll
              checkedKeys={openApiConfigsCache.map((c) => c.key)}
              onCheck={(keys) => handleOpenApiTreeCheck(keys as any)}
              treeData={openApiTreeData as any}
              fieldNames={{ title: 'name', key: 'key', children: 'apiList' }}
              titleRender={(node) =>
                openApiTitleRender(node as OpenApiDefinition)
              }
              blockNode
            />
          ) : (
            !openApiListLoading && (
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'h-full',
                )}
              >
                <Empty description="暂无 API 权限配置" />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ApiPermissionTabPanel;
