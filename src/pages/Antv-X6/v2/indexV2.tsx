/**
 * V2 工作流主入口组件
 *
 * 新版工作流编辑器，采用前端数据驱动模式
 * 支持撤销/重做、全量保存、运行动画等功能
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { LoadingOutlined } from '@ant-design/icons';
import { Form, Spin, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams } from 'umi';

// V2 独立导入 - 类型
import type {
  ChildNodeV2,
  CreateNodeByPortOrEdgePropsV2,
  EdgeV2,
  GraphContainerRefV2,
  NodeConfigV2,
  ValidationErrorV2,
  WorkflowDataV2,
} from './types';
import { NodeTypeEnumV2 } from './types';

// V2 独立导入 - Hooks
import { useWorkflowDataV2 } from './hooks/useWorkflowDataV2';

// V2 独立导入 - 工具函数
import { calculateNewNodePosition, getNodeShape } from './utils/graphV2';
import { calculateNodePreviousArgs } from './utils/variableReferenceV2';
import { validateWorkflow } from './utils/workflowValidatorV2';

// V2 独立导入 - 组件
import NodeDrawerV2 from './components/drawer/NodeDrawerV2';
import GraphContainerV2 from './components/GraphContainerV2';
import ControlPanelV2 from './components/layout/ControlPanelV2';
import HeaderV2 from './components/layout/HeaderV2';
import StencilContentV2 from './components/layout/StencilContentV2';
import type { RunResult, RunStatus } from './components/modal';
import {
  CreateComponentModalV2,
  EditWorkflowModalV2,
  PublishModalV2,
  TestRunModalV2,
} from './components/modal';
import type { VersionInfo } from './components/version';
import { VersionHistoryV2 } from './components/version';

// V2 独立导入 - 服务
import workflowServiceV2 from './services/workflowV2';

// V2 独立导入 - 常量
import { NODE_TEMPLATES_V2 } from './constants/stencilConfigV2';

import './indexV2.less';

// ==================== 组件实现 ====================

const WorkflowV2: React.FC = () => {
  const params = useParams<{ workflowId: string; spaceId: string }>();
  const workflowId = Number(params.workflowId);
  const spaceId = Number(params.spaceId);

  // ==================== 状态管理 ====================

  // 使用 V2 数据管理 Hook
  const {
    workflowData,
    isLoading,
    isSaving,
    isDirty,
    addNode,
    updateNode,
    deleteNode,
    getNodeById,
    addEdge,
    deleteEdge,
    refreshData,
    saveNow,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useWorkflowDataV2({
    workflowId,
    onSaveSuccess: () => {
      message.success('保存成功');
    },
    onSaveError: (error) => {
      message.error('保存失败: ' + error.message);
    },
  });

  // 工作流基本信息
  const [workflowInfo, setWorkflowInfo] = useState<{
    name: string;
    description: string;
    modified?: string;
    publishStatus?: string;
    version?: string;
  }>({ name: '', description: '' });

  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<ChildNodeV2 | null>(null);

  // 右侧抽屉是否显示
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 历史状态
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });

  // 缩放比例
  const [zoom, setZoom] = useState(1);

  // 校验错误
  const [validationErrors, setValidationErrors] = useState<ValidationErrorV2[]>(
    [],
  );

  // 节点添加弹窗
  const [stencilVisible, setStencilVisible] = useState(false);

  // 弹窗状态
  const [testRunModalVisible, setTestRunModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editWorkflowModalVisible, setEditWorkflowModalVisible] =
    useState(false);
  const [createComponentModalVisible, setCreateComponentModalVisible] =
    useState(false);
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false);

  // 试运行状态
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [runResult, setRunResult] = useState<RunResult | undefined>();

  // 版本历史
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // 表单
  const [form] = Form.useForm<NodeConfigV2>();

  // Refs
  const graphRef = useRef<GraphContainerRefV2>(null);

  // ==================== 初始化 ====================

  // 加载工作流详情
  useEffect(() => {
    const loadWorkflowInfo = async () => {
      try {
        const response = await workflowServiceV2.getWorkflowDetails(workflowId);
        if (workflowServiceV2.isSuccess(response)) {
          const { name, description, modified, publishStatus, version } =
            response.data;
          setWorkflowInfo({
            name,
            description,
            modified,
            publishStatus,
            version,
          });
        }
      } catch (error) {
        console.error('Failed to load workflow info:', error);
      }
    };

    loadWorkflowInfo();
  }, [workflowId]);

  // 初始校验
  useEffect(() => {
    if (workflowData && workflowData.nodeList.length > 0) {
      const result = validateWorkflow(workflowData);
      setValidationErrors(result.errors);
    }
  }, [workflowData]);

  // ==================== 节点操作 ====================

  /**
   * 选中节点
   */
  const handleNodeSelect = useCallback(
    (node: ChildNodeV2 | null) => {
      setSelectedNode(node);
      if (node) {
        setDrawerVisible(true);
        form.setFieldsValue(node.nodeConfig);

        // 计算变量引用
        const previousArgs = calculateNodePreviousArgs(node.id, workflowData);
        console.log('[V2] Node previous args:', previousArgs);
      } else {
        setDrawerVisible(false);
      }
    },
    [form, workflowData],
  );

  /**
   * 更新节点
   */
  const handleNodeChange = useCallback(
    (node: ChildNodeV2) => {
      updateNode(node.id, node);
    },
    [updateNode],
  );

  /**
   * 添加节点
   */
  const handleNodeAdd = useCallback(
    (node: ChildNodeV2) => {
      addNode(node);
      // 选中新添加的节点
      setSelectedNode(node);
      setDrawerVisible(true);
      form.setFieldsValue(node.nodeConfig);
    },
    [addNode, form],
  );

  /**
   * 删除节点
   */
  const handleNodeDelete = useCallback(
    (nodeId: number, node?: ChildNodeV2) => {
      deleteNode(nodeId);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        setDrawerVisible(false);
      }
    },
    [deleteNode, selectedNode],
  );

  /**
   * 复制节点
   */
  const handleNodeCopy = useCallback(
    (node: ChildNodeV2) => {
      // 创建节点副本
      const newNode: ChildNodeV2 = {
        ...node,
        id: Date.now(), // 临时 ID，实际应由后端生成
        name: `${node.name} (副本)`,
        nodeConfig: {
          ...node.nodeConfig,
          extension: {
            ...node.nodeConfig?.extension,
            x: (node.nodeConfig?.extension?.x || 0) + 50,
            y: (node.nodeConfig?.extension?.y || 0) + 50,
          },
        },
        nextNodeIds: [],
      };

      handleNodeAdd(newNode);
      message.success('节点已复制');
    },
    [handleNodeAdd],
  );

  // ==================== 边操作 ====================

  /**
   * 添加边
   */
  const handleEdgeAdd = useCallback(
    (edge: EdgeV2) => {
      addEdge(edge);
    },
    [addEdge],
  );

  /**
   * 删除边
   */
  const handleEdgeDelete = useCallback(
    (source: string, target: string) => {
      deleteEdge(source, target);
    },
    [deleteEdge],
  );

  // ==================== 图形操作 ====================

  /**
   * 缩放变化
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  /**
   * 放大
   */
  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoomIn();
  }, []);

  /**
   * 缩小
   */
  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoomOut();
  }, []);

  /**
   * 适应画布
   */
  const handleFitView = useCallback(() => {
    graphRef.current?.fitView();
  }, []);

  /**
   * 历史状态变化
   */
  const handleHistoryChange = useCallback(
    (canUndoNow: boolean, canRedoNow: boolean) => {
      setHistoryState({ canUndo: canUndoNow, canRedo: canRedoNow });
    },
    [],
  );

  /**
   * 点击空白区域
   */
  const handleClickBlank = useCallback(() => {
    // 保存当前编辑的节点
    if (selectedNode && drawerVisible) {
      const values = form.getFieldsValue(true);
      updateNode(selectedNode.id, {
        ...selectedNode,
        nodeConfig: { ...selectedNode.nodeConfig, ...values },
      });
    }
    setSelectedNode(null);
    setDrawerVisible(false);
    setStencilVisible(false);
  }, [selectedNode, drawerVisible, form, updateNode]);

  /**
   * 通过端口或边创建节点
   */
  const handleCreateNodeByPortOrEdge = useCallback(
    (config: CreateNodeByPortOrEdgePropsV2) => {
      const { child, sourceNode, portId, targetNode, edgeId } = config;

      // 计算新节点位置
      const newPosition = calculateNewNodePosition(
        sourceNode,
        portId,
        child.type,
      );

      // 创建新节点
      const newNode: ChildNodeV2 = {
        id: Date.now(), // 临时 ID
        name: child.name || child.type,
        description: child.description || '',
        workflowId,
        type: child.type,
        shape: getNodeShape(child.type),
        icon: child.icon || '',
        nodeConfig: {
          extension: newPosition,
        },
        loopNodeId: sourceNode.loopNodeId,
      };

      // 添加节点
      handleNodeAdd(newNode);

      // 创建边
      const isOutput = portId.endsWith('-out') || portId.includes('-out');
      if (isOutput) {
        handleEdgeAdd({
          source: sourceNode.id.toString(),
          target: newNode.id.toString(),
        });
      } else {
        handleEdgeAdd({
          source: newNode.id.toString(),
          target: sourceNode.id.toString(),
        });
      }

      // 如果是在边上创建节点，需要删除原来的边并创建新的边
      if (targetNode && edgeId) {
        handleEdgeDelete(sourceNode.id.toString(), targetNode.id.toString());
        handleEdgeAdd({
          source: newNode.id.toString(),
          target: targetNode.id.toString(),
        });
      }
    },
    [workflowId, handleNodeAdd, handleEdgeAdd, handleEdgeDelete],
  );

  /**
   * 初始化完成
   */
  const handleInit = useCallback(() => {
    console.log('[V2] Graph initialized');
  }, []);

  // ==================== 抽屉操作 ====================

  /**
   * 关闭抽屉
   */
  const handleDrawerClose = useCallback(() => {
    // 保存当前编辑的节点
    if (selectedNode) {
      const values = form.getFieldsValue(true);
      updateNode(selectedNode.id, {
        ...selectedNode,
        nodeConfig: { ...selectedNode.nodeConfig, ...values },
      });
    }
    setSelectedNode(null);
    setDrawerVisible(false);
  }, [selectedNode, form, updateNode]);

  /**
   * 节点配置变更
   */
  const handleNodeConfigChange = useCallback(
    (config: NodeConfigV2) => {
      if (selectedNode) {
        updateNode(selectedNode.id, {
          ...selectedNode,
          nodeConfig: config,
        });
      }
    },
    [selectedNode, updateNode],
  );

  // ==================== 工具栏操作 ====================

  /**
   * 返回
   */
  const handleBack = useCallback(() => {
    history.goBack();
  }, []);

  /**
   * 撤销
   */
  const handleUndo = useCallback(() => {
    undo();
    graphRef.current?.undo();
  }, [undo]);

  /**
   * 重做
   */
  const handleRedo = useCallback(() => {
    redo();
    graphRef.current?.redo();
  }, [redo]);

  /**
   * 手动保存
   */
  const handleManualSave = useCallback(async () => {
    const success = await saveNow();
    if (success) {
      message.success('保存成功');
    }
  }, [saveNow]);

  /**
   * 验证工作流
   */
  const handleValidate = useCallback(() => {
    const result = validateWorkflow(workflowData);
    setValidationErrors(result.errors);

    if (result.isValid) {
      message.success('工作流配置正确');
    } else {
      const errorCount = result.errors.filter(
        (e) => e.level === 'error',
      ).length;
      message.error(`发现 ${errorCount} 个错误，请检查`);
    }

    return result;
  }, [workflowData]);

  /**
   * 点击错误项
   */
  const handleErrorClick = useCallback(
    (error: ValidationErrorV2) => {
      if (error.nodeId) {
        const node = getNodeById(error.nodeId);
        if (node) {
          handleNodeSelect(node);
          // 定位到节点
          graphRef.current?.focusNode(error.nodeId.toString());
        }
      }
    },
    [getNodeById, handleNodeSelect],
  );

  // ==================== 弹窗操作 ====================

  /**
   * 打开试运行
   */
  const handleOpenTestRun = useCallback(() => {
    // 先验证
    const validationResult = handleValidate();
    if (validationResult.errors.filter((e) => e.level === 'error').length > 0) {
      message.error('请先修复错误');
      return;
    }
    setTestRunModalVisible(true);
  }, [handleValidate]);

  /**
   * 执行试运行
   */
  const handleTestRun = useCallback(
    async (inputValues: Record<string, any>) => {
      try {
        setRunStatus('running');
        setRunResult(undefined);

        // TODO: 调用试运行 API
        // const result = await workflowServiceV2.testRun(workflowId, inputValues);

        // 模拟运行结果
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setRunStatus('success');
        setRunResult({
          status: 'success',
          startTime: Date.now() - 2000,
          endTime: Date.now(),
          duration: 2000,
          nodeResults: [],
          finalOutput: { result: '运行成功' },
        });

        message.success('运行成功');
      } catch (error: any) {
        setRunStatus('failed');
        setRunResult({
          status: 'failed',
          startTime: Date.now() - 1000,
          endTime: Date.now(),
          duration: 1000,
          nodeResults: [],
          error: error.message,
        });
        message.error('运行失败: ' + error.message);
      }
    },
    [workflowId],
  );

  /**
   * 停止运行
   */
  const handleStopRun = useCallback(async () => {
    try {
      // TODO: 调用停止 API
      setRunStatus('stopped');
      message.info('已停止运行');
    } catch (error: any) {
      message.error('停止失败: ' + error.message);
    }
  }, []);

  /**
   * 打开发布
   */
  const handleOpenPublish = useCallback(() => {
    // 先验证
    const validationResult = handleValidate();
    setPublishModalVisible(true);
  }, [handleValidate]);

  /**
   * 执行发布
   */
  const handlePublish = useCallback(
    async (data: { versionDescription: string; forcePublish: boolean }) => {
      try {
        // TODO: 调用发布 API
        // await workflowServiceV2.publish(workflowId, data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        message.success('发布成功');
        setPublishModalVisible(false);
      } catch (error: any) {
        message.error('发布失败: ' + error.message);
        throw error;
      }
    },
    [workflowId],
  );

  /**
   * 编辑工作流信息
   */
  const handleEditWorkflow = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        // TODO: 调用更新 API
        // await workflowServiceV2.updateWorkflow(workflowId, data);
        setWorkflowInfo((prev) => ({ ...prev, ...data }));
        message.success('保存成功');
        setEditWorkflowModalVisible(false);
      } catch (error: any) {
        message.error('保存失败: ' + error.message);
        throw error;
      }
    },
    [workflowId],
  );

  /**
   * 创建组件
   */
  const handleCreateComponent = useCallback(
    async (data: { name: string; description?: string; category?: string }) => {
      try {
        // TODO: 调用创建组件 API
        // await workflowServiceV2.createComponent(workflowId, data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        message.success('组件创建成功');
        setCreateComponentModalVisible(false);
      } catch (error: any) {
        message.error('创建失败: ' + error.message);
        throw error;
      }
    },
    [workflowId],
  );

  /**
   * 打开版本历史
   */
  const handleOpenVersionHistory = useCallback(async () => {
    setVersionHistoryVisible(true);
    setVersionsLoading(true);
    try {
      // TODO: 调用获取版本历史 API
      // const response = await workflowServiceV2.getVersionHistory(workflowId);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setVersions([
        {
          id: '1',
          version: 'v1.0.0',
          description: '初始版本',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
          isCurrent: true,
          isPublished: true,
        },
      ]);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setVersionsLoading(false);
    }
  }, [workflowId]);

  /**
   * 版本回滚
   */
  const handleVersionRollback = useCallback(
    async (versionId: string) => {
      try {
        // TODO: 调用回滚 API
        // await workflowServiceV2.rollback(workflowId, versionId);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        message.success('回滚成功');
        refreshData();
      } catch (error: any) {
        message.error('回滚失败: ' + error.message);
      }
    },
    [workflowId, refreshData],
  );

  /**
   * 预览版本
   */
  const handleVersionPreview = useCallback((versionId: string) => {
    // TODO: 实现版本预览
    message.info('版本预览功能开发中');
  }, []);

  // ==================== Stencil 操作 ====================

  /**
   * 打开添加节点面板
   */
  const handleOpenStencil = useCallback(() => {
    setStencilVisible(true);
  }, []);

  /**
   * 从 Stencil 添加节点
   */
  const handleStencilNodeAdd = useCallback(
    (template: (typeof NODE_TEMPLATES_V2)[0]) => {
      // 计算新节点位置（画布中心）
      const viewport = graphRef.current?.getViewport();
      const x = viewport ? viewport.x + viewport.width / 2 - 100 : 400;
      const y = viewport ? viewport.y + viewport.height / 2 - 40 : 300;

      const newNode: ChildNodeV2 = {
        id: Date.now(),
        name: template.name,
        description: template.description || '',
        workflowId,
        type: template.type as NodeTypeEnumV2,
        shape: getNodeShape(template.type as NodeTypeEnumV2),
        icon: template.icon,
        nodeConfig: {
          extension: { x, y },
        },
      };

      handleNodeAdd(newNode);
      setStencilVisible(false);
    },
    [workflowId, handleNodeAdd],
  );

  // ==================== 渲染 ====================

  // 计算变量引用数据
  const referenceData = selectedNode
    ? calculateNodePreviousArgs(selectedNode.id, workflowData)
    : undefined;

  return (
    <div className="workflow-v2-container">
      {/* 顶部导航栏 */}
      <HeaderV2
        info={{
          name: workflowInfo.name || '未命名工作流',
          description: workflowInfo.description,
          publishStatus: workflowInfo.publishStatus,
          modified: workflowInfo.modified,
        }}
        isDirty={isDirty}
        isSaving={isSaving}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleManualSave}
        onPublish={handleOpenPublish}
        onEditInfo={() => setEditWorkflowModalVisible(true)}
        onOpenVersionHistory={handleOpenVersionHistory}
      />

      {/* 主体区域 */}
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <div className="workflow-v2-body">
          {/* 图形容器 */}
          <div className="workflow-v2-graph-area">
            <GraphContainerV2
              ref={graphRef}
              workflowData={workflowData}
              onNodeChange={handleNodeChange}
              onNodeAdd={handleNodeAdd}
              onNodeDelete={handleNodeDelete}
              onNodeCopy={handleNodeCopy}
              onNodeSelect={handleNodeSelect}
              onEdgeAdd={handleEdgeAdd}
              onEdgeDelete={handleEdgeDelete}
              onZoomChange={handleZoomChange}
              onHistoryChange={handleHistoryChange}
              onClickBlank={handleClickBlank}
              onInit={handleInit}
              createNodeByPortOrEdge={handleCreateNodeByPortOrEdge}
            />

            {/* 左下角控制面板 */}
            <ControlPanelV2
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitView={handleFitView}
              onAddNode={handleOpenStencil}
              onTestRun={handleOpenTestRun}
            />

            {/* 节点添加面板 */}
            {stencilVisible && (
              <div className="workflow-v2-stencil-panel">
                <StencilContentV2
                  onNodeClick={handleStencilNodeAdd}
                  onClose={() => setStencilVisible(false)}
                />
              </div>
            )}
          </div>

          {/* 右侧配置抽屉 */}
          <NodeDrawerV2
            open={drawerVisible}
            node={selectedNode}
            referenceData={referenceData}
            onClose={handleDrawerClose}
            onNodeConfigChange={handleNodeConfigChange}
            onNodeDelete={handleNodeDelete}
          />
        </div>
      </Spin>

      {/* 底部状态栏 */}
      <div className="workflow-v2-footer">
        <span>节点数: {workflowData.nodeList.length}</span>
        <span>边数: {workflowData.edgeList.length}</span>
        <span>缩放: {Math.round(zoom * 100)}%</span>
        {isSaving && <span className="saving">保存中...</span>}
        {isDirty && !isSaving && (
          <span className="unsaved">有未保存的更改</span>
        )}
      </div>

      {/* 试运行弹窗 */}
      <TestRunModalV2
        open={testRunModalVisible}
        onClose={() => setTestRunModalVisible(false)}
        workflowData={workflowData as WorkflowDataV2}
        onRun={handleTestRun}
        onStop={handleStopRun}
        runStatus={runStatus}
        runResult={runResult}
      />

      {/* 发布弹窗 */}
      <PublishModalV2
        open={publishModalVisible}
        onClose={() => setPublishModalVisible(false)}
        workflowData={workflowData as WorkflowDataV2}
        validationErrors={validationErrors}
        onPublish={handlePublish}
      />

      {/* 编辑工作流弹窗 */}
      <EditWorkflowModalV2
        open={editWorkflowModalVisible}
        onClose={() => setEditWorkflowModalVisible(false)}
        workflowData={
          {
            ...workflowData,
            name: workflowInfo.name,
            description: workflowInfo.description,
          } as WorkflowDataV2
        }
        onSave={handleEditWorkflow}
      />

      {/* 创建组件弹窗 */}
      <CreateComponentModalV2
        open={createComponentModalVisible}
        onClose={() => setCreateComponentModalVisible(false)}
        workflowData={
          {
            ...workflowData,
            name: workflowInfo.name,
            description: workflowInfo.description,
          } as WorkflowDataV2
        }
        onCreate={handleCreateComponent}
      />

      {/* 版本历史抽屉 */}
      <VersionHistoryV2
        open={versionHistoryVisible}
        onClose={() => setVersionHistoryVisible(false)}
        versions={versions}
        loading={versionsLoading}
        onRollback={handleVersionRollback}
        onPreview={handleVersionPreview}
      />
    </div>
  );
};

export default WorkflowV2;
