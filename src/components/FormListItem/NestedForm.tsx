import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import React, { useCallback } from 'react';
import TreeColumnHeader from './components/TreeColumnHeader';
import TreeHeader from './components/TreeHeader';
import TreeNodeTitle from './components/TreeNodeTitle';
import TreeNodeTitleBody from './components/TreeNodeTitleBody';
import { useRequireStatus } from './hooks/useRequireStatus';
import { TreeNodeConfig, useTreeData } from './hooks/useTreeData';
import { TreeFormProps } from './type';

/**
 * 嵌套表单树组件
 * 用于渲染可嵌套的树形表单结构，支持动态添加、删除节点
 *
 * 主要功能：
 * - 树形数据的增删改查
 * - 节点的必填状态管理
 * - 支持不同的输出格式（Text、Markdown、JSON）
 * - 支持Body类型的输入或引用（使用专门的TreeNodeTitleBody组件）
 */
const CustomTree: React.FC<TreeFormProps> = ({
  params,
  form,
  title,
  inputItemName = 'inputArgs',
  notShowTitle,
  showCheck,
  isBody,
  isNotAdd,
}) => {
  // 使用自定义Hook管理树形数据
  const {
    treeData,
    expandedKeys,
    setExpandedKeys,
    addRootNode,
    addChildNode,
    deleteNode,
    updateNodeField,
    updateTreeData,
  } = useTreeData(params, form, inputItemName);

  // 使用自定义Hook管理必填状态
  const { updateRequireStatus } = useRequireStatus(treeData, updateTreeData);

  // 使用useCallback优化回调函数，避免子组件不必要的重渲染
  const handleUpdateField = useCallback(updateNodeField, [updateNodeField]);
  const handleAddChild = useCallback(addChildNode, [addChildNode]);
  const handleDelete = useCallback(deleteNode, [deleteNode]);
  const handleUpdateRequire = useCallback(updateRequireStatus, [
    updateRequireStatus,
  ]);
  const handleAddRoot = useCallback(addRootNode, [addRootNode]);

  /**
   * 渲染树节点标题
   * 根据isBody属性选择使用不同的组件
   * @param nodeData 节点数据
   * @returns 渲染的节点标题组件
   */
  const renderTitle = useCallback(
    (nodeData: TreeNodeConfig) => {
      // 根据isBody属性选择不同的组件
      if (isBody) {
        return (
          <TreeNodeTitleBody
            nodeData={nodeData}
            showCheck={showCheck}
            onUpdateField={handleUpdateField}
            onAddChild={handleAddChild}
            onDelete={handleDelete}
            onUpdateRequire={handleUpdateRequire}
          />
        );
      }

      return (
        <TreeNodeTitle
          nodeData={nodeData}
          form={form}
          showCheck={showCheck}
          isNotAdd={isNotAdd}
          onUpdateField={handleUpdateField}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
          onUpdateRequire={handleUpdateRequire}
        />
      );
    },
    [
      isBody,
      form,
      showCheck,
      isNotAdd,
      handleUpdateField,
      handleAddChild,
      handleDelete,
      handleUpdateRequire,
    ],
  );

  // 判断是否显示添加按钮
  const showAddButton =
    !isNotAdd && (!notShowTitle || form.getFieldValue('outputType') === 'JSON');

  return (
    <div>
      {/* 树头部 */}
      <TreeHeader
        title={title}
        form={form}
        notShowTitle={notShowTitle}
        showAddButton={showAddButton}
        onAddRoot={handleAddRoot}
      />

      {/* 列头 */}
      {treeData && treeData.length > 0 && (
        <TreeColumnHeader showCheck={showCheck} isBody={isBody} />
      )}

      {/* 树形结构 */}
      <Tree<TreeNodeConfig>
        treeData={treeData}
        switcherIcon={<DownOutlined />}
        defaultExpandAll
        fieldNames={{ title: 'name', key: 'key', children: 'subArgs' }}
        titleRender={renderTitle}
        defaultExpandParent
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        className={`${
          treeData.find((item) => item.subArgs && item.subArgs.length > 0)
            ? 'tree-form-style'
            : 'tree-form-style-no-child'
        }`}
      />
    </div>
  );
};

export default CustomTree;
