/**
 * V2 异常处理配置组件
 *
 * 用于配置节点的异常处理策略，包括超时、重试、异常处理方式
 * 完全独立，不依赖 V1
 */

import CodeEditor from '@/components/CodeEditor';
import NewMonaco from '@/components/CodeEditor/NewMonaco';
import TooltipIcon from '@/components/custom/TooltipIcon';
import {
  EXCEPTION_HANDLE_OPTIONS,
  EXCEPTION_NODES_TYPE,
  RETRY_COUNT_OPTIONS,
} from '@/constants/node.constants';
import { CodeLangEnum } from '@/types/enums/plugin';
import { convertValueToEditorValue } from '@/utils/graph';
import { ExpandAltOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Form, FormInstance, Input, Select } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import type { ChildNodeV2 } from '../../../types';
import { ExceptionHandleTypeEnumV2 } from '../../../types';

import './ExceptionItemV2.less';

// ==================== 类型定义 ====================

export interface ExceptionItemV2Props {
  /** 表单字段名 */
  name?: string;
  /** 超时时间 */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 异常处理类型 */
  exceptionHandleType?: ExceptionHandleTypeEnumV2;
  /** 是否禁用 */
  disabled?: boolean;
  /** 特定返回内容 */
  specificContent?: string;
  /** 异常处理节点 ID 列表 */
  exceptionHandleNodeIds?: number[];
  /** 表单实例 */
  form?: FormInstance;
}

// ==================== 工具函数 ====================

/**
 * 判断节点是否显示异常处理配置
 */
export const showExceptionHandleV2 = (node: ChildNodeV2): boolean => {
  // 使用 NodeTypeEnumV2 对应的字符串与 EXCEPTION_NODES_TYPE 比较
  return EXCEPTION_NODES_TYPE.includes(node.type as any);
};

// ==================== 组件实现 ====================

/**
 * 异常处理配置组件
 * 用于配置节点的异常处理策略，包括超时、重试、异常处理方式
 */
export const ExceptionItemV2: React.FC<ExceptionItemV2Props> = memo(
  ({
    name = 'exceptionHandleConfig',
    timeout = 180,
    retryCount = 0,
    exceptionHandleType = ExceptionHandleTypeEnumV2.INTERRUPT,
    disabled = false,
    specificContent,
    exceptionHandleNodeIds,
    form: propForm,
  }) => {
    const formInstance = Form.useFormInstance();
    const outerForm = propForm || formInstance;

    // 异常处理方式选项
    const exceptionHandleOptions = useMemo(() => EXCEPTION_HANDLE_OPTIONS, []);

    // 重试次数选项
    const retryOptions = useMemo(() => RETRY_COUNT_OPTIONS, []);

    const [currentExceptionHandleType, setCurrentExceptionHandleType] =
      useState<ExceptionHandleTypeEnumV2>(exceptionHandleType);

    // 用于存储编辑器的值
    const [jsonContent, setJsonContent] = useState<string>(
      convertValueToEditorValue(specificContent) || '',
    );

    const [show, setShow] = useState(false);

    // 初始化表单值
    useEffect(() => {
      if (!outerForm) return;
      const initialValue = {
        timeout,
        retryCount,
        exceptionHandleType,
        ...(exceptionHandleType ===
          ExceptionHandleTypeEnumV2.SPECIFIC_CONTENT && {
          specificContent: convertValueToEditorValue(specificContent),
        }),
        ...(exceptionHandleType ===
          ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW && {
          exceptionHandleNodeIds,
        }),
      };
      outerForm.setFieldsValue({
        [name]: initialValue,
      });
    }, [
      outerForm,
      name,
      timeout,
      retryCount,
      exceptionHandleType,
      specificContent,
      exceptionHandleNodeIds,
    ]);

    // 处理异常处理类型变化
    useEffect(() => {
      if (!outerForm) return;
      setCurrentExceptionHandleType(exceptionHandleType);
      if (
        exceptionHandleType !== ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW
      ) {
        outerForm.setFieldValue([name, 'exceptionHandleNodeIds'], []);
      }
    }, [outerForm, name, exceptionHandleType]);

    useEffect(() => {
      if (!outerForm) return;
      if (
        currentExceptionHandleType !==
        ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW
      ) {
        outerForm.setFieldValue([name, 'exceptionHandleNodeIds'], []);
      }
    }, [outerForm, name, currentExceptionHandleType]);

    const handleChange = useCallback(
      (value: string) => {
        outerForm.setFieldValue([name, 'specificContent'], value);
      },
      [outerForm, name],
    );

    // 处理异常处理类型变更
    const handleExceptionTypeChange = useCallback(
      (value: ExceptionHandleTypeEnumV2) => {
        setCurrentExceptionHandleType(value);

        // 当切换到特定内容时，确保JSON内容有效
        if (value === ExceptionHandleTypeEnumV2.SPECIFIC_CONTENT) {
          handleChange(specificContent || '');
        } else {
          handleChange('');
        }
      },
      [handleChange, specificContent],
    );

    // 处理JSON内容变更
    const handleJsonContentChange = useCallback(
      (value: string) => {
        if (!outerForm) return;
        setJsonContent(value);
        try {
          // 尝试解析JSON，确保有效
          JSON.parse(value);
          handleChange(value);
        } catch (e) {
          // JSON无效时不更新表单，但保留编辑器内容
        }
      },
      [outerForm, handleChange],
    );

    return (
      <div className="exception-item-v2">
        {/* 标题 */}
        <div className="exception-item-v2-header">
          <span className="exception-item-v2-title">异常处理</span>
          <TooltipIcon
            title="可设置异常处理，包括超时、重试、异常处理方式。开启流式输出后，一旦开始输出数据，即使出现异常也无法重试或者跳转异常分支。"
            icon={<InfoCircleOutlined />}
          />
        </div>

        {/* 表单配置项 */}
        <div className="exception-item-v2-form">
          <div className="exception-item-v2-row">
            {/* 超时时间 */}
            <Form.Item
              name={[name, 'timeout']}
              label={
                <span className="flex items-center">
                  超时时间
                  <TooltipIcon
                    title="设置节点执行的最大等待时间"
                    icon={<InfoCircleOutlined />}
                  />
                </span>
              }
              className="exception-item-v2-form-item timeout-item"
              rules={[
                {
                  required: true,
                  message: '请输入超时时间',
                },
              ]}
            >
              <Input
                size="small"
                suffix="s"
                type="number"
                className="exception-item-v2-input"
              />
            </Form.Item>

            {/* 重试次数 */}
            <Form.Item
              name={[name, 'retryCount']}
              label="重试次数"
              className="exception-item-v2-form-item retry-item"
            >
              <Select
                size="small"
                options={retryOptions}
                className="exception-item-v2-select"
                disabled={disabled}
                placeholder="不重试"
              />
            </Form.Item>

            {/* 异常处理方式 */}
            <Form.Item
              name={[name, 'exceptionHandleType']}
              label="异常处理方式"
              className="exception-item-v2-form-item handle-type-item"
            >
              <Select
                size="small"
                options={exceptionHandleOptions}
                className="exception-item-v2-select"
                disabled={disabled}
                placeholder="中断流程"
                onChange={handleExceptionTypeChange}
              />
            </Form.Item>
          </div>

          {/* 当异常处理方式为返回特定内容时，显示返回内容 */}
          {currentExceptionHandleType ===
            ExceptionHandleTypeEnumV2.SPECIFIC_CONTENT && (
            <div className="exception-item-v2-content-wrapper">
              <div className="exception-item-v2-content-label">
                <span>自定义返回内容</span>
                <Button
                  icon={<ExpandAltOutlined />}
                  size="small"
                  type="text"
                  onClick={() => setShow(true)}
                />
              </div>
              <Form.Item
                name={[name, 'specificContent']}
                className="exception-item-v2-form-item exception-content-item"
                rules={[
                  {
                    required: true,
                    message: '请输入自定义返回内容',
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      try {
                        JSON.parse(value);
                        return Promise.resolve();
                      } catch (error) {
                        return Promise.reject(
                          new Error('请输入有效的JSON格式'),
                        );
                      }
                    },
                  },
                ]}
              >
                <div className="editor-wrapper">
                  <CodeEditor
                    codeLanguage={CodeLangEnum.JSON}
                    height="150px"
                    value={jsonContent}
                    codeOptimizeVisible={false}
                    onChange={handleJsonContentChange}
                  />
                </div>
              </Form.Item>
            </div>
          )}

          <NewMonaco
            disabledSwitchLanguage={true}
            value={jsonContent}
            language={CodeLangEnum.JSON}
            visible={show}
            onClose={() => setShow(false)}
            onChange={({ code }) => {
              handleJsonContentChange(code);
            }}
          />
        </div>
      </div>
    );
  },
);

export default ExceptionItemV2;
