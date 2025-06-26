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

  // 只保留在JSX中使用的handle函数
  const handleAddRoot = useCallback(addRootNode, [addRootNode]);

  // 创建一个独立的渲染函数，避免循环依赖
  const createNodeTitle = useCallback(
    (nodeData: TreeNodeConfig, key?: string) => {
      if (isBody) {
        return (
          <TreeNodeTitleBody
            nodeData={nodeData}
            showCheck={showCheck}
            onUpdateField={updateNodeField}
            onAddChild={addChildNode}
            onDelete={deleteNode}
            onUpdateRequire={updateRequireStatus}
          />
        );
      }

      return (
        <TreeNodeTitle
          key={`treeNodeTitle-${nodeData.key || key}`}
          nodeData={nodeData}
          form={form}
          showCheck={showCheck}
          isNotAdd={isNotAdd}
          onUpdateField={updateNodeField}
          onAddChild={addChildNode}
          onDelete={deleteNode}
          onUpdateRequire={updateRequireStatus}
        />
      );
    },
    [
      isBody,
      showCheck,
      form,
      isNotAdd,
      updateNodeField,
      addChildNode,
      deleteNode,
      updateRequireStatus,
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

      {/* 树形结构 - 保持TreeNode结构 */}
      <Tree<TreeNodeConfig>
        switcherIcon={<DownOutlined />}
        defaultExpandAll
        defaultExpandParent
        blockNode
        expandedKeys={expandedKeys}
        treeData={treeData}
        fieldNames={{
          title: 'name',
          key: 'key',
          children: 'subArgs',
        }}
        onExpand={(keys) => setExpandedKeys(keys)}
        titleRender={(nodeData) => {
          return createNodeTitle(nodeData, nodeData.key);
        }}
        className={`${
          treeData.find((item) => item.subArgs && item.subArgs.length > 0)
            ? 'tree-form-style'
            : 'tree-form-style-no-child'
        }`}
      ></Tree>
    </div>
  );
};

export default CustomTree;
