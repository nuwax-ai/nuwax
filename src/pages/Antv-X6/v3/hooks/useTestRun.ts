/**
 * useTestRun - 试运行相关逻辑
 *
 * 从 indexV3.tsx 提取，负责管理工作流和节点的试运行功能
 */

import { ACCESS_TOKEN } from '@/constants/home.constants';
import { ITestRun } from '@/services/workflow';
import { DefaultObjectType } from '@/types/interfaces/common';
import { GraphContainerRef, RunResultItem } from '@/types/interfaces/graph';
import { ErrorParams } from '@/types/interfaces/workflow';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useCallback, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import {
  getWorkflowTestRun,
  removeWorkflowTestRun,
  setWorkflowTestRun,
} from '../utils/workflowV3';

interface UseTestRunParams {
  workflowId: number;
  spaceId: number;
  graphRef: React.RefObject<GraphContainerRef | null>;
  info: { id?: number; startNode?: { id: number } } | null;
  foldWrapItem: { id: number; type: string };
  validWorkflow: () => Promise<boolean>;
  onSaveWorkflow: (data: any) => Promise<void>;
  getWorkflow: (key: string) => any;
  isModified: boolean;
  setIsModified: (val: boolean) => void;
  changeUpdateTime: () => void;
  errorParams: ErrorParams;
  setErrorParams: React.Dispatch<React.SetStateAction<ErrorParams>>;
}

interface UseTestRunReturn {
  // 状态
  loading: boolean;
  setLoading: (val: boolean) => void;
  testRun: boolean;
  setTestRun: (val: boolean) => void;
  testRunResult: string;
  setTestRunResult: (val: string) => void;
  testRunLoading: boolean;
  stopWait: boolean;
  setStopWait: (val: boolean) => void;
  testRunParams: any;
  setTestRunParams: (val: any) => void;
  formItemValue: any;
  setFormItemValue: (val: any) => void;
  // 方法
  nodeTestRun: (params?: DefaultObjectType) => Promise<void>;
  testRunAllNode: (params: ITestRun) => Promise<void>;
  testRunAll: () => Promise<void>;
  runTest: (type: string, params?: DefaultObjectType) => Promise<void>;
  handleClearRunResult: () => void;
}

export const useTestRun = ({
  workflowId,
  spaceId,
  graphRef,
  info,
  foldWrapItem,
  validWorkflow,
  onSaveWorkflow,
  getWorkflow,
  isModified,
  setIsModified,
  changeUpdateTime,
  setErrorParams,
}: UseTestRunParams): UseTestRunReturn => {
  // 使用全局 model 中的 testRun 状态，确保 TestRun 组件能正确响应状态变化
  const { testRun, setTestRun } = useModel('model');

  // 局部状态
  const [loading, setLoading] = useState(false);
  const [testRunResult, setTestRunResult] = useState('');
  const [testRunLoading, setTestRunLoading] = useState(false);
  const [stopWait, setStopWait] = useState(false);
  const [testRunParams, setTestRunParams] = useState<any>(null);
  const [formItemValue, setFormItemValue] = useState<any>(null);

  // 清除运行结果
  const handleClearRunResult = useCallback(() => {
    setTestRunResult('');
    graphRef.current?.graphResetRunResult();
  }, [graphRef]);

  // 节点试运行
  const nodeTestRun = useCallback(
    async (params?: DefaultObjectType) => {
      const _params = {
        nodeId: foldWrapItem.id,
        params,
      };
      setTestRunResult('');

      const abortConnection = await createSSEConnection({
        url: `${process.env.BASE_URL}/api/workflow/test/node/execute`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          Accept: ' application/json, text/plain, */* ',
        },
        body: _params,
        onMessage: (data) => {
          if (!data.success) {
            if (data.message) {
              setTestRunResult(data.message);
            }
          } else {
            if (data.complete) {
              if (data.data && data.data.output) {
                setTestRunResult(data.data.output);
              }
              setTestRunResult(JSON.stringify(data.data, null, 2));
              removeWorkflowTestRun({
                spaceId,
                workflowId,
              });
            }
            if (data.data.status === 'STOP_WAIT_ANSWER') {
              setLoading(false);
              setStopWait(true);
              setWorkflowTestRun({
                spaceId,
                workflowId,
                value: JSON.stringify(params),
              });
            }
          }
        },
        onError: (error) => {
          console.error('流式请求异常:', error);
        },
        onOpen: (response) => {
          console.log('连接已建立', response.status);
        },
        onClose: () => {
          setLoading(false);
        },
      });
      abortConnection();
    },
    [foldWrapItem.id, spaceId, workflowId],
  );

  // 试运行所有节点
  const testRunAllNode = useCallback(
    async (params: ITestRun) => {
      setLoading(true);
      const abortConnection = await createSSEConnection({
        url: `${process.env.BASE_URL}/api/workflow/test/execute`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          Accept: ' application/json, text/plain, */* ',
        },
        body: params,
        onMessage: (data) => {
          if (data.data && data.data.nodeId) {
            const runResult: RunResultItem = {
              requestId: data.requestId,
              options: {
                ...data.data.result,
                nodeId: data.data.nodeId,
                nodeName: data.data.nodeName,
              },
              status: data.data.status,
            };
            graphRef.current?.graphActiveNodeRunResult(
              data.data.nodeId.toString(),
              runResult,
            );
          }
          if (!data.success) {
            setErrorParams((prev: ErrorParams) => {
              if (data.data && data.data.result) {
                return {
                  errorList: [...prev.errorList, data.data.result],
                  show: true,
                };
              } else {
                if (!data.data) {
                  return {
                    errorList: [...prev.errorList, { error: data.message }],
                    show: true,
                  };
                }
                return prev;
              }
            });
          } else {
            if (data.complete) {
              if (data.data && data.data.output) {
                setTestRunResult(data.data.output);
                removeWorkflowTestRun({
                  spaceId,
                  workflowId,
                });
              }

              setFormItemValue(
                data.nodeExecuteResultMap[
                  (info?.startNode?.id as number).toString()
                ]?.data,
              );
              setTestRunResult(JSON.stringify(data.data, null, 2));
              setLoading(false);
            }
            if (data.data.status === 'STOP_WAIT_ANSWER') {
              setLoading(false);
              setStopWait(true);
              setWorkflowTestRun({
                spaceId,
                workflowId,
                value: JSON.stringify(params),
              });
              if (data.data.result) {
                setTestRunParams(data.data.result.data);
              }
            }
          }
        },
        onError: (error) => {
          console.error('流式请求异常:', error);
        },
        onOpen: (response) => {
          console.log('连接已建立', response.status);
        },
        onClose: () => {
          setLoading(false);
        },
      });
      abortConnection();
      changeUpdateTime();
    },
    [graphRef, spaceId, workflowId, info, changeUpdateTime],
  );

  // 试运行所有节点（入口）
  const testRunAll = useCallback(async () => {
    const loadingTimer = setTimeout(() => {
      setTestRunLoading(true);
    }, 300);
    try {
      // V3: validWorkflow 中已经包含了保存逻辑，这里直接调用即可
      const result = await validWorkflow();
      if (result) {
        setTestRunResult('');
        setTestRun(true);
      }
    } catch (error) {
      console.error('试运行所有节点失败:', error);
    } finally {
      clearTimeout(loadingTimer);
      setTestRunLoading(false);
    }
  }, [validWorkflow]);

  // 运行测试
  const runTest = useCallback(
    async (type: string, params?: DefaultObjectType) => {
      setErrorParams({
        errorList: [],
        show: false,
      });
      handleClearRunResult();
      if (type === 'Start') {
        let _params: ITestRun;
        const testRunData = getWorkflowTestRun({
          spaceId,
          workflowId,
        });
        if (testRunData) {
          _params = {
            ...JSON.parse(testRunData),
            ...(params as DefaultObjectType),
          };
          setStopWait(false);
          removeWorkflowTestRun({ spaceId, workflowId });
        } else {
          _params = {
            workflowId: info?.id as number,
            params,
            requestId: uuidv4(),
          };
        }

        testRunAllNode(_params);
      } else {
        if (type === 'Code') {
          if (isModified) {
            setIsModified(false);
            await onSaveWorkflow(getWorkflow('drawerForm'));
          }
          nodeTestRun(params);
        } else {
          nodeTestRun(params);
        }
      }
      setLoading(true);
    },
    [
      handleClearRunResult,
      spaceId,
      workflowId,
      info,
      testRunAllNode,
      isModified,
      setIsModified,
      onSaveWorkflow,
      getWorkflow,
      nodeTestRun,
    ],
  );

  return {
    // 状态
    loading,
    setLoading,
    testRun,
    setTestRun,
    testRunResult,
    setTestRunResult,
    testRunLoading,
    stopWait,
    setStopWait,
    testRunParams,
    setTestRunParams,
    formItemValue,
    setFormItemValue,
    // 方法
    nodeTestRun,
    testRunAllNode,
    testRunAll,
    runTest,
    handleClearRunResult,
  };
};
