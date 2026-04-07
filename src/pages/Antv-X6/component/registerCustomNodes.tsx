import EditableTitle from '@/components/editableTitle';
import { ICON_WORKFLOW_LOOP } from '@/constants/images.constants';
import {
  answerTypeMap,
  branchTypeMap,
  compareTypeMap,
  EXCEPTION_HANDLE_OPTIONS,
  optionsMap,
} from '@/constants/node.constants';
import useNodeSelection from '@/hooks/useNodeSelection';
import { t } from '@/services/i18nRuntime';
import {
  AnswerTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
  RunResultStatusEnum,
} from '@/types/enums/common';
import { ConditionBranchTypeEnum } from '@/types/enums/node';
import { ChildNode, NodeProps, RunResultItem } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { showExceptionHandle } from '@/utils/graph';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import '../index.less';
import './registerCustomNodes.less';
import RunResult from './runResult';

// Condition node.
const ConditionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const conditionBranchConfigs = data.nodeConfig.conditionBranchConfigs;

  return (
    <div className="condition-node-content-style">
      {conditionBranchConfigs?.map((item) => {
        const firstArgName = item.conditionArgs
          ? item.conditionArgs[0]?.firstArg?.name
          : '';
        const secondArgName =
          item.conditionArgs[0]?.secondArg?.name ||
          item.conditionArgs[0]?.secondArg?.bindValue ||
          '';
        return (
          <div key={item.uuid} className="dis-left condition-item-style">
            <span className="condition-title-sytle">
              {
                branchTypeMap[
                  item.branchType || ConditionBranchTypeEnum.ELSE_IF
                ]
              }
            </span>
            <div className="flex-1 condition-node-left-input">
              {firstArgName}
            </div>
            {item.conditionArgs && item.conditionArgs.length > 0 && (
              <div className="dis-left">
                {/* Guard null/undefined compareType */}
                <span className="condition-node-compare-type">
                  {item.conditionArgs[0]?.compareType
                    ? compareTypeMap[
                        item.conditionArgs[0]
                          .compareType as keyof typeof compareTypeMap
                      ]
                    : ''}
                </span>
                <div className="condition-node-right-input">
                  {secondArgName}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// QA node.
const QANode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const inputArgs = data.nodeConfig.inputArgs;
  const question = data.nodeConfig.question;
  const answerType = data.nodeConfig.answerType as AnswerTypeEnum;
  return (
    <div className="qa-node-content-style">
      <div className="dis-left">
        <span className="text-right qa-title-style">
          {t('PC.Pages.AntvX6RegisterNodes.input')}
        </span>
        {inputArgs?.slice(0, 2).map((item, index) => (
          <Tag key={`inputArgs-${item.name}-${index}`}>{item.name}</Tag>
        ))}
        {inputArgs && inputArgs.length > 2 && (
          <Tag>+{inputArgs.length - 2}</Tag>
        )}
        {!inputArgs && (
          <span>{t('PC.Pages.AntvX6RegisterNodes.unconfiguredInput')}</span>
        )}
      </div>
      <div className="dis-left">
        <span className="text-right qa-title-style">
          {t('PC.Pages.AntvX6RegisterNodes.questionContent')}
        </span>
        <span className="question-content-style">
          {question || t('PC.Pages.AntvX6RegisterNodes.unconfiguredQuestion')}
        </span>
      </div>
      <div className="dis-left">
        <span className="text-right qa-title-style">
          {t('PC.Pages.AntvX6RegisterNodes.qaType')}
        </span>
        <span>{answerTypeMap[answerType]}</span>
      </div>
      {answerType === AnswerTypeEnum.SELECT &&
        data.nodeConfig.options?.map((item, index) => (
          <div
            key={`options-${item.uuid || optionsMap[index]}-${index}`}
            className="dis-left"
          >
            <span className="text-right qa-title-style"></span>
            <Tag>{optionsMap[index]}</Tag>
            <span className="qa-content-style">
              {item.content ||
                t('PC.Pages.AntvX6RegisterNodes.unconfiguredContent')}
            </span>
          </div>
        ))}
    </div>
  );
};

// Intent recognition node.
const IntentRecognitionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const intentConfigs = data.nodeConfig.intentConfigs;
  return (
    <div className="qa-node-content-style">
      {intentConfigs?.map((item, index) => (
        <div className="dis-left" key={index}>
          <span className="qa-title-style">
            {t('PC.Pages.AntvX6RegisterNodes.optionLabel', index + 1)}
          </span>
          <span className="qa-content-style">
            {item.intent ||
              t('PC.Pages.AntvX6RegisterNodes.unconfiguredIntent')}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * General node for graph rendering.
 */
const DISABLE_EDIT_NODE_TYPES = [
  NodeTypeEnum.LoopStart,
  NodeTypeEnum.LoopEnd,
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
];
const NodeRunResult: React.FC<{
  data: RunResultItem[] | [];
}> = ({ data }) => {
  const time = (
    (data?.reduce((acc, item) => {
      return (
        acc + ((item?.options?.endTime || 0) - (item?.options?.startTime || 0))
      );
    }, 0) || 0) / 1000
  ).toFixed(3);
  const total = data?.length || 0;
  const [pageTotal, setPageTotal] = useState(total);
  // Current page.
  const [current, setCurrent] = useState(1);
  // Whether only failed items are shown.
  const [onlyError, setOnlyError] = useState(false);
  // Expand state.
  const [expanded, setExpanded] = useState(false);
  const [innerData, setInnerData] = useState<RunResultItem[] | []>([]);

  const success = data.every(
    (item) => item?.status === RunResultStatusEnum.FINISHED,
  );
  const isExecuting = data.some(
    (item) =>
      item?.status === RunResultStatusEnum.EXECUTING ||
      item?.status === RunResultStatusEnum.STOP_WAIT_ANSWER,
  );

  // Handle page change.
  const handlePageChange = (page: number) => {
    console.log('[RegisterCustomNodes] page changed:', page);
    setCurrent(page);
  };

  // Handle only-error filter change.
  const handleOnlyErrorChange = (checked: boolean) => {
    console.log('[RegisterCustomNodes] only-error changed:', checked);
    setOnlyError(checked);
  };

  // Handle expand change.
  const handleExpandChange = (expanded: boolean) => {
    console.log('[RegisterCustomNodes] expand changed:', expanded);
    setExpanded(expanded);
  };

  useEffect(() => {
    setInnerData(data);
  }, [data]);

  useEffect(() => {
    if (onlyError && !success) {
      const _data = data.filter(
        (item) => item?.status === RunResultStatusEnum.FAILED,
      );
      setInnerData(_data.length > 0 ? _data : []);
    } else {
      setInnerData(data);
    }
  }, [onlyError, success]);

  useEffect(() => {
    setPageTotal(innerData.length);
    setCurrent(1);
  }, [innerData]);
  const genRunResultTitle = useCallback(() => {
    const statusList = data.map((item) => item?.status);

    switch (true) {
      case statusList.some(
        (status) => status === RunResultStatusEnum.STOP_WAIT_ANSWER,
      ):
        return t('PC.Pages.AntvX6RegisterNodes.replyQuestion');
      case statusList.some(
        (status) => status === RunResultStatusEnum.EXECUTING,
      ):
        return t('PC.Pages.AntvX6RegisterNodes.running');
      case statusList.some((status) => status === RunResultStatusEnum.FAILED):
        return t('PC.Pages.AntvX6RegisterNodes.failed');
      case statusList.every(
        (status) => status === RunResultStatusEnum.FINISHED,
      ):
        return t('PC.Pages.AntvX6RegisterNodes.success');
      default:
        return t('PC.Pages.AntvX6RegisterNodes.failed');
    }
  }, [data]);

  if (data?.length === 0) {
    return null;
  }
  return (
    <RunResult
      success={success}
      title={genRunResultTitle()}
      loading={isExecuting}
      collapsible={!isExecuting}
      time={`${time}s`}
      total={pageTotal}
      current={current}
      onlyError={onlyError}
      onPageChange={handlePageChange}
      onOnlyErrorChange={handleOnlyErrorChange}
      expanded={expanded}
      onExpandChange={handleExpandChange}
      inputParams={innerData[current - 1]?.options?.input || {}}
      outputResult={innerData[current - 1]?.options?.data || {}}
    />
  );
};

const ExceptionHandle: React.FC<{
  data: ExceptionHandleConfig | undefined;
}> = ({ data }) => {
  return (
    <div className="exception-handle-style">
      <span className="exception-handle-title">
        {t('PC.Pages.AntvX6RegisterNodes.exceptionWhen')}
      </span>
      <p className="exception-handle-content">
        {
          EXCEPTION_HANDLE_OPTIONS.find(
            (item) => item.value === data?.exceptionHandleType,
          )?.label
        }
      </p>
    </div>
  );
};

export const GeneralNode: React.FC<NodeProps> = (props) => {
  /**
   * Render node style and content.
   */
  const { node, graph } = props;
  const data = node.getData<ChildNode>();
  const selected = useNodeSelection({ graph, nodeId: data?.id });
  const [editValue, setEditValue] = useState(data?.name || '');
  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);

  if (!data) {
    return null;
  }

  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 100%)`;
  const isSpecialNode = [
    NodeTypeEnum.QA,
    NodeTypeEnum.Condition,
    NodeTypeEnum.IntentRecognition,
  ].includes(data.type);
  const marginBottom = isSpecialNode ? '10px' : '0';

  const handleEditingStatusChange = (val: boolean) => {
    // Disable node move while editing.
    node.setData({ enableMove: !val });
  };

  // Save handler.
  const handleSave = (saveValue: string): boolean => {
    setEditValue(saveValue);
    graph.trigger('node:custom:save', {
      data: node.getData<ChildNode>(),
      payload: { name: saveValue },
    });
    return true;
  };

  const canNotEditNode = DISABLE_EDIT_NODE_TYPES.includes(data.type);
  const runResults = data.runResults || [];
  const showRunResult = [NodeTypeEnum.LoopStart, NodeTypeEnum.LoopEnd].includes(
    data.type,
  )
    ? false
    : !!runResults.length; // Hide run result for loop-start result node.
  const showException = showExceptionHandle(data);

  if (!data) {
    return null;
  }

  return (
    <>
      <div
        className={`general-node ${selected ? 'selected-general-node' : ''}`} // Apply class by selected state.
      >
        {/* Node header with title, icon and actions */}
        <div
          className="general-node-header"
          style={{
            background: gradientBackground,
            marginBottom,
          }} // Apply gradient background.
        >
          <div className="dis-left general-node-header-image">
            {returnImg(data.type)}
          </div>
          <EditableTitle
            key={data.id.toString()}
            dataId={data.id.toString()}
            value={editValue}
            onSave={handleSave}
            disabled={canNotEditNode}
            onEditingStatusChange={handleEditingStatusChange}
          />
        </div>

        {data.type === NodeTypeEnum.Condition && <ConditionNode data={data} />}

        {data.type === NodeTypeEnum.QA && <QANode data={data} />}

        {data.type === NodeTypeEnum.IntentRecognition && (
          <IntentRecognitionNode data={data} />
        )}
        {/* Exception handling */}
        {showException && (
          <ExceptionHandle data={data.nodeConfig.exceptionHandleConfig} />
        )}
      </div>
      {/* Run result */}
      {showRunResult && <NodeRunResult data={runResults} />}
    </>
  );
};

/**
 * Loop node.
 */

// Optimized loop node.
export const LoopNode: React.FC<NodeProps> = ({ node, graph }) => {
  const data = node.getData<ChildNode>();
  const [editValue, setEditValue] = useState(data?.name || '');
  const selected = useNodeSelection({ graph, nodeId: data?.id });
  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 42px)`;
  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);
  const handleEditingStatusChange = (val: boolean) => {
    // Disable node move while editing.
    node.setData({ enableMove: !val });
  };

  // Save handler.
  const handleSave = (saveValue: string): boolean => {
    setEditValue(saveValue);
    graph.trigger('node:custom:save', {
      data: node.getData<ChildNode>(),
      payload: { name: saveValue },
    });
    return true;
  };
  const runResults = data.runResults || [];
  const showRunResult = !!runResults.length;
  return (
    <>
      <div
        className={`loop-node-style general-node ${
          selected ? 'selected-general-node' : ''
        }`}
        style={{ background: gradientBackground }}
      >
        <div className="loop-node-title-style dis-left">
          <ICON_WORKFLOW_LOOP style={{ marginRight: '6px' }} />
          <EditableTitle
            key={data.id.toString()}
            value={editValue}
            dataId={data.id.toString()}
            onEditingStatusChange={handleEditingStatusChange}
            onSave={handleSave}
          />
        </div>
        <div className="loop-node-content" />
      </div>
      {showRunResult && <NodeRunResult data={runResults} />}
    </>
  );
};

/**
 * Port style config for top/right/bottom/left ports.
 */

// Register custom nodes.

export function registerCustomNodes() {
  // Register custom nodes.
  register({
    shape: NodeShapeEnum.General,
    component: GeneralNode,
  });
  register({
    shape: NodeShapeEnum.Loop,
    component: LoopNode,
    resizable: true,
    draggable: true,
    // enabled: true
  });
}

interface Point {
  x: number;
  y: number;
}

export const createCurvePath = (s: Point, e: Point) => {
  const startOffset = 2; // Start offset.
  const endOffset = 2; // End offset.
  const deltaX = Math.abs(e.x - s.x);
  const control = Math.floor((deltaX / 3) * 2); // Bezier control.

  // Calculate start/end points with offsets.
  let newStartX = s.x < e.x ? s.x + startOffset : s.x - startOffset;
  let newEndX = e.x > s.x ? e.x - endOffset : e.x + endOffset;

  // Keep Y positions by original direction.
  const startY = s.y;
  const endY = e.y;

  // Calculate control points.
  const v1 = { x: newStartX + control, y: startY };
  const v2 = { x: newEndX - control, y: endY };

  return Path.normalize(
    `M ${newStartX} ${startY}
     L ${newStartX + (s.x < e.x ? startOffset : -startOffset)} ${startY}
     C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${newEndX} ${endY}
     L ${newEndX} ${endY}
    `,
  );
};
