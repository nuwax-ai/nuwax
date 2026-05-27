import { dict } from '@/services/i18nRuntime';
import type { OpenApiDefinition } from '@/types/interfaces/account';
import { Empty, Tree, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

export interface ApiPermissionTabProps {
  loading: boolean;
  treeData: OpenApiDefinition[];
  checkedKeys: React.Key[];
  onCheckedChange: (keys: React.Key[]) => void;
  expandedKeys: React.Key[];
  onExpandedChange: (keys: React.Key[]) => void;
}

/**
 * 接口权限页签组件
 */
const ApiPermissionTab: React.FC<ApiPermissionTabProps> = ({
  loading,
  treeData,
  checkedKeys,
  onCheckedChange,
  expandedKeys,
  onExpandedChange,
}) => {
  // 统计逻辑：计算某个节点下选中的子节点数量
  const getSubCheckedCount = (node: OpenApiDefinition) => {
    if (!node.apiList || node.apiList.length === 0) return 0;
    let count = 0;
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        if (!item.apiList || item.apiList.length === 0) {
          if (checkedKeys.includes(item.key)) count++;
        } else {
          traverse(item.apiList);
        }
      });
    };
    traverse(node.apiList);
    return count;
  };

  // 统计逻辑：获取某个节点下的总叶子节点数
  const getSubTotalCount = (node: OpenApiDefinition) => {
    if (!node.apiList || node.apiList.length === 0) return 0;
    let total = 0;
    const traverse = (list: OpenApiDefinition[]) => {
      list.forEach((item) => {
        if (!item.apiList || item.apiList.length === 0) {
          total++;
        } else {
          traverse(item.apiList);
        }
      });
    };
    traverse(node.apiList);
    return total;
  };

  // 自定义渲染接口节点内容
  const titleRender = (node: any) => {
    const isParent = node.apiList && node.apiList.length > 0;

    if (isParent) {
      const checkedCount = getSubCheckedCount(node);
      const totalCount = getSubTotalCount(node);
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingRight: 8,
          }}
        >
          <Text style={{ fontSize: 14 }}>{node.name}</Text>
          <span
            style={{
              backgroundColor: '#e6f7ff',
              color: '#1890ff',
              padding: '0 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {checkedCount}/{totalCount}
          </span>
        </div>
      );
    }

    // 子节点（API 接口项）：名称与地址各占一半，地址左对齐，超出显示省略号且鼠标移入悬浮显示
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingRight: 8,
          gap: 16,
        }}
      >
        <Text
          ellipsis={{ tooltip: true }}
          style={{ fontSize: 14, flex: 1, width: 0 }}
        >
          {node.name}
        </Text>
        <Text
          type="secondary"
          ellipsis={{ tooltip: true }}
          style={{ fontSize: 12, flex: 1, width: 0, textAlign: 'left' }}
        >
          {node.path}
        </Text>
      </div>
    );
  };

  if (treeData.length === 0) {
    if (loading) return null;
    return (
      <Empty
        description={dict(
          'PC.Pages.MorePage.ApiKeyPermission.noPermissionDefs',
        )}
      />
    );
  }

  return (
    <Tree
      checkable
      checkStrictly={false}
      expandedKeys={expandedKeys}
      onExpand={onExpandedChange}
      checkedKeys={checkedKeys}
      onCheck={(keys: any) => {
        onCheckedChange(keys);
      }}
      treeData={treeData as any}
      fieldNames={{
        title: 'name',
        key: 'key',
        children: 'apiList',
      }}
      titleRender={titleRender}
      blockNode
    />
  );
};

export default ApiPermissionTab;
