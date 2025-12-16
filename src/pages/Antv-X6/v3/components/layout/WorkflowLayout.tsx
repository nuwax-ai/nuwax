import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import PublishComponentModal from '@/components/PublishComponentModal';
import TestRun from '@/components/TestRun';
import VersionHistory from '@/components/VersionHistory';
import { testRunList } from '@/constants/node.constants';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum, NodeTypeEnum } from '@/types/enums/common';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import {
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  GraphContainerRef,
  GraphRect,
  StencilChildNode,
} from '@/types/interfaces/graph';
import { TestRunParams } from '@/types/interfaces/node';
import { ErrorParams } from '@/types/interfaces/workflow';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, FormInstance, Spin } from 'antd';
import React, { MutableRefObject } from 'react';
import VersionAction from '../../../components/VersionAction';
import GraphContainer from '../graph/GraphContainer';
import NodePanelDrawer from '../panels/PropertyPanel';
import ControlPanel from './ControlPanel';
import ErrorList from './ErrorList';
import Header from './Header';

export interface WorkflowLayoutProps {
  // Header Props
  isValidLoading: boolean;
  info: any;
  setShowCreateWorkflow: (show: boolean) => void;
  setShowVersionHistory: (show: boolean) => void;
  handleShowPublish: () => void;
  showPublish: boolean;
  setShowPublish: (show: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onConfirm: (values: any, callback?: () => void) => void;
  handleConfirmPublishWorkflow: () => void;

  // Global Loading
  globalLoadingTime: number;

  // Graph Props
  graphParams: any;
  graphRef: MutableRefObject<GraphContainerRef | null>;
  handleNodeClick: (node: ChildNode | null) => void;
  nodeChangeEdge: any;
  changeNode: any;
  deleteNode: (id: number | string, node?: ChildNode) => void;
  copyNode: (child: ChildNode) => void;
  changeZoom: (val: number) => void;
  createNodeByPortOrEdge: (
    config: CreateNodeByPortOrEdgeProps,
  ) => Promise<void>;
  handleSaveNode: (data: ChildNode, payload: Partial<ChildNode>) => void;
  handleClickBlank: () => void;
  handleInitLoading: (loading?: boolean) => void;
  handleRefreshGraph: () => void;

  // Control Panel Props
  dragChild: (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement> | GraphRect,
    continueDragCount?: number,
  ) => Promise<void>;
  foldWrapItem: ChildNode;
  changeGraph: (val: number | string) => void;
  testRunAll: () => Promise<void>;
  testRunLoading: boolean;

  // FoldWrap / Drawer Props
  visible: boolean;
  handleDrawerClose: () => void;
  showNameInput: boolean;
  changeFoldWrap: (values: { name: string; description: string }) => void;
  handleOperationsChange: (val: string) => void;
  form: FormInstance;
  doSubmitFormData: () => Promise<boolean>;
  throttledHandleGraphUpdate: (changedValues: any, fullFormValues: any) => void;

  // Created Modal Props
  createdItem: AgentComponentTypeEnum;
  onAdded: (val: CreatedNodeItem, parentFC?: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  workflowCreatedTabs: any[];
  workflowId: number;

  // TestRun Props
  runTest: (type: string, params?: DefaultObjectType) => Promise<void>;
  testRunResult: string;
  handleClearRunResult: () => void;
  loading: boolean;
  stopWait: boolean;
  formItemValue: DefaultObjectType;
  testRunParams: TestRunParams;

  // ErrorList Props
  errorParams: ErrorParams;
  setErrorParams: (params: ErrorParams) => void;
  handleErrorNodeClick: (node: ChildNode | null) => void;

  // Publish Modal
  spaceId: number;

  // Create Workflow Modal
  showCreateWorkflow: boolean;

  // Version History
  showVersionHistory: boolean;
}

const WorkflowLayout: React.FC<WorkflowLayoutProps> = ({
  isValidLoading,
  info,
  setShowCreateWorkflow,
  setShowVersionHistory,
  handleShowPublish,
  showPublish,
  setShowPublish,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onConfirm,
  handleConfirmPublishWorkflow,
  globalLoadingTime,
  graphParams,
  graphRef,
  handleNodeClick,
  nodeChangeEdge,
  changeNode,
  deleteNode,
  copyNode,
  changeZoom,
  createNodeByPortOrEdge,
  handleSaveNode,
  handleClickBlank,
  handleInitLoading,
  handleRefreshGraph,
  dragChild,
  foldWrapItem,
  changeGraph,
  testRunAll,
  testRunLoading,
  visible,
  handleDrawerClose,
  showNameInput,
  changeFoldWrap,
  handleOperationsChange,
  form,
  doSubmitFormData,
  throttledHandleGraphUpdate,
  createdItem,
  onAdded,
  open,
  setOpen,
  workflowCreatedTabs,
  workflowId,
  runTest,
  testRunResult,
  handleClearRunResult,
  loading,
  stopWait,
  formItemValue,
  testRunParams,
  errorParams,
  setErrorParams,
  handleErrorNodeClick,
  spaceId,
  showCreateWorkflow,
  showVersionHistory,
}) => {
  return (
    <div id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header
        isValidLoading={isValidLoading}
        info={info ?? {}}
        onToggleVersionHistory={() => setShowVersionHistory(true)}
        setShowCreateWorkflow={() => setShowCreateWorkflow(true)}
        showPublish={handleShowPublish}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      <Spin
        spinning={globalLoadingTime > 0}
        indicator={<LoadingOutlined spin />}
        wrapperClassName="spin-workflow-global-style"
      >
        <GraphContainer
          graphParams={graphParams}
          ref={graphRef}
          changeDrawer={handleNodeClick}
          changeEdge={nodeChangeEdge}
          changeCondition={changeNode}
          removeNode={deleteNode}
          copyNode={copyNode}
          changeZoom={changeZoom}
          createNodeByPortOrEdge={createNodeByPortOrEdge}
          onSaveNode={handleSaveNode}
          onClickBlank={handleClickBlank}
          onInit={handleInitLoading}
          onRefresh={handleRefreshGraph}
        />
      </Spin>

      <ControlPanel
        dragChild={dragChild}
        foldWrapItem={foldWrapItem}
        changeGraph={changeGraph}
        handleTestRun={testRunAll}
        testRunLoading={testRunLoading}
        zoomSize={(info?.extension?.size as number) ?? 1}
      />

      <FoldWrap
        className="fold-wrap-style"
        lineMargin
        title={foldWrapItem.name}
        visible={visible}
        key={`${foldWrapItem.type}-${foldWrapItem.id}-foldWrap`}
        onClose={handleDrawerClose}
        description={foldWrapItem.description}
        backgroundColor={returnBackgroundColor(foldWrapItem.type)}
        icon={returnImg(foldWrapItem.type)}
        showNameInput={showNameInput}
        changeFoldWrap={changeFoldWrap}
        otherAction={
          <OtherOperations
            onChange={handleOperationsChange}
            testRun={testRunList.includes(foldWrapItem.type)}
            nodeType={foldWrapItem.type}
            action={
              foldWrapItem.type !== NodeTypeEnum.Start &&
              foldWrapItem.type !== NodeTypeEnum.End
            }
          />
        }
      >
        <div className="dispose-node-style">
          <Form
            form={form}
            layout={'vertical'}
            onFinishFailed={doSubmitFormData}
            onFinish={doSubmitFormData}
            key={`${foldWrapItem.type}-${foldWrapItem.id}-form`}
            clearOnDestroy={true}
            onValuesChange={(values) => {
              // 使用节流处理，确保最后一次调用必须触发更新
              throttledHandleGraphUpdate(values, form.getFieldsValue(true));
            }}
          >
            <NodePanelDrawer
              params={foldWrapItem}
              key={`${foldWrapItem.type}-${foldWrapItem.id}-nodePanelDrawer`}
            />
          </Form>
        </div>
      </FoldWrap>

      <Created
        checkTag={createdItem}
        onAdded={onAdded}
        open={open}
        tabs={workflowCreatedTabs}
        addComponents={[
          {
            type: AgentComponentTypeEnum.Workflow,
            targetId: workflowId,
            status: AgentAddComponentStatusEnum.Added,
          },
        ]}
        onCancel={() => setOpen(false)}
      />

      <TestRun
        node={foldWrapItem}
        run={runTest}
        testRunResult={testRunResult}
        clearRunResult={handleClearRunResult}
        loading={loading}
        stopWait={stopWait}
        formItemValue={formItemValue}
        testRunParams={testRunParams}
      />

      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreateWorkflow(false)}
        open={showCreateWorkflow}
        type={CreateUpdateModeEnum.Update}
        {...info}
      />

      <ErrorList
        visible={visible}
        errorList={errorParams.errorList}
        show={errorParams.show}
        onClose={() =>
          setErrorParams({ ...errorParams, errorList: [], show: false })
        }
        onClickItem={handleErrorNodeClick}
        nodeList={graphParams.nodeList}
      />

      {/*工作流发布弹窗*/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Workflow}
        targetId={workflowId}
        spaceId={spaceId}
        category={info?.category}
        open={showPublish}
        // 取消发布
        onCancel={() => setShowPublish(false)}
        onConfirm={handleConfirmPublishWorkflow}
      />

      {/*版本历史*/}
      <VersionHistory
        targetId={workflowId}
        targetName={info?.name}
        targetType={AgentComponentTypeEnum.Workflow}
        permissions={info?.permissions || []}
        visible={showVersionHistory}
        isDrawer={true}
        onClose={() => setShowVersionHistory(false)}
        renderActions={(item) => (
          <VersionAction
            data={item}
            onRefresh={handleRefreshGraph}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
      />
    </div>
  );
};

export default WorkflowLayout;
