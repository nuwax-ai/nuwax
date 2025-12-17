import CodeEditor from '@/components/CodeEditor';
import NewMonaco from '@/components/CodeEditor/NewMonaco';
import TooltipIcon from '@/components/custom/TooltipIcon';
import {
  EXCEPTION_HANDLE_OPTIONS,
  RETRY_COUNT_OPTIONS,
} from '@/constants/node.constants';
import { useSpecificContent } from '@/hooks/useSpecificContent';
import { ExceptionHandleTypeEnum } from '@/types/enums/common';
import { CodeLangEnum } from '@/types/enums/plugin';
import { ExceptionItemProps } from '@/types/interfaces/graph';
import { ExpandAltOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import cx from 'classnames';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import {
  convertValueToEditorValue,
  isEqualExceptionHandleConfig,
} from '../utils/graphV3';
import styles from './ExceptionItem.less';

// 默认的JSON格式内容
const DEFAULT_JSON_CONTENT = '';
/**
 * 异常处理配置组件
 * 用于配置节点的异常处理策略，包括超时、重试、异常处理方式
 */
export const ExceptionItem: React.FC<ExceptionItemProps> = memo(
  ({
    name,
    timeout = 180,
    retryCount = 0,
    exceptionHandleType = ExceptionHandleTypeEnum.INTERRUPT,
    disabled = false,
    specificContent,
    exceptionHandleNodeIds,
  }) => {
    const { setIsModified } = useModel('workflowV3');
    const outerForm = Form.useFormInstance();
    // 异常处理方式选项
    const exceptionHandleOptions = useMemo(() => EXCEPTION_HANDLE_OPTIONS, []);

    // 重试次数选项
    const retryOptions = useMemo(() => RETRY_COUNT_OPTIONS, []);

    const [currentExceptionHandleType, setCurrentExceptionHandleType] =
      useState<ExceptionHandleTypeEnum>(exceptionHandleType);

    // 用于存储编辑器的值，避免直接从表单读取导致的问题
    const [jsonContent, setJsonContent] = useState<string>(
      convertValueToEditorValue(specificContent) || DEFAULT_JSON_CONTENT,
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
          ExceptionHandleTypeEnum.SPECIFIC_CONTENT && {
          specificContent: convertValueToEditorValue(specificContent),
        }),
        ...(exceptionHandleType ===
          ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW && {
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

    const calcSpecificContent = useSpecificContent({
      specificContent: outerForm.getFieldValue([name, 'specificContent']) || '',
      fieldName: name,
      watchField: 'outputArgs',
    });

    useEffect(() => {
      setJsonContent(convertValueToEditorValue(calcSpecificContent));
    }, [calcSpecificContent]);

    // 处理异常处理类型变化
    useEffect(() => {
      if (!outerForm) return;
      setCurrentExceptionHandleType(exceptionHandleType);
      if (
        exceptionHandleType !== ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW
      ) {
        outerForm.setFieldValue([name, 'exceptionHandleNodeIds'], []);
      }
    }, [outerForm, name, exceptionHandleType]);
    useEffect(() => {
      if (!outerForm) return;
      if (
        currentExceptionHandleType !==
        ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW
      ) {
        outerForm.setFieldValue([name, 'exceptionHandleNodeIds'], []);
      }
    }, [outerForm, name, currentExceptionHandleType]);

    const debounceSetIsModified = useCallback(
      debounce(() => {
        setIsModified(true);
      }, 100),
      [],
    );
    const handleChange = (value: string) => {
      outerForm.setFieldValue([name, 'specificContent'], value);
      debounceSetIsModified();
    };

    // 处理异常处理类型变更
    const handleExceptionTypeChange = (value: ExceptionHandleTypeEnum) => {
      setCurrentExceptionHandleType(value);

      // 当切换到特定内容时，确保JSON内容有效
      if (value === ExceptionHandleTypeEnum.SPECIFIC_CONTENT) {
        try {
          // 尝试解析当前内容，如果无效则使用默认内容
          handleChange(specificContent || '');
        } catch (e) {}
      } else {
        handleChange('');
      }
    };

    // 处理JSON内容变更
    const handleJsonContentChange = (value: string) => {
      if (!outerForm) return;
      try {
        // 尝试解析JSON，确保有效
        JSON.parse(value);
        handleChange(value);
        // 更新表单值
      } catch (e) {
        // JSON无效时不更新表单，但保留编辑器内容
        // message.error('JSON格式无效');
        // console.warn('JSON格式无效:', e);
      }
    };

    return (
      <div className={cx(styles.exceptionItem)}>
        {/* 标题 */}
        <div className={cx(styles.exceptionItemHeader)}>
          <span className={cx(styles.exceptionItemTitle)}>异常处理</span>
          <TooltipIcon
            title="可设置异常处理，包括超时、重试、异常处理方式。开启流式输出后，一旦开始输出数据，即使出现异常也无法重试或者跳转异常分支。"
            icon={<InfoCircleOutlined />}
          />
        </div>

        {/* 表单配置项 */}
        <div className={cx(styles.exceptionItemForm)}>
          <div className={cx(styles.exceptionItemRow)}>
            {/* 超时时间 - 30% 宽度 */}
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
              className={cx(styles.exceptionItemFormItem, styles.timeoutItem)}
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
                className={cx(styles.exceptionItemInput)}
              />
            </Form.Item>

            {/* 重试次数 - 30% 宽度 */}
            <Form.Item
              name={[name, 'retryCount']}
              label="重试次数"
              className={cx(styles.exceptionItemFormItem, styles.retryItem)}
            >
              <Select
                size="small"
                options={retryOptions}
                className={cx(styles.exceptionItemSelect, {
                  [styles.disabled]: disabled,
                })}
                disabled={disabled}
                placeholder="不重试"
              />
            </Form.Item>

            {/* 异常处理方式 - 40% 宽度 */}
            <Form.Item
              name={[name, 'exceptionHandleType']}
              label="异常处理方式"
              className={cx(
                styles.exceptionItemFormItem,
                styles.handleTypeItem,
              )}
            >
              <Select
                size="small"
                options={exceptionHandleOptions}
                className={cx(styles.exceptionItemSelect, {
                  [styles.disabled]: disabled,
                })}
                disabled={disabled}
                placeholder="中断流程"
                onChange={handleExceptionTypeChange}
              />
            </Form.Item>
          </div>

          {/* 当异常处理方式为返回特定内容时，显示返回内容 */}
          {currentExceptionHandleType ===
            ExceptionHandleTypeEnum.SPECIFIC_CONTENT && (
            <div className={cx(styles.exceptionItemContentWrapper)}>
              <div className={cx(styles.exceptionItemContentLabel)}>
                <span>自定义返回内容</span>
                <Button
                  icon={<ExpandAltOutlined />}
                  size="small"
                  type="text"
                  onClick={() => setShow(true)}
                ></Button>
              </div>
              <Form.Item
                name={[name, 'specificContent']}
                className={cx(
                  styles.exceptionItemFormItem,
                  styles.exceptionContentItem,
                )}
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
                <div className={cx(styles.editorWrapper)}>
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
  (prevProps, nextProps) => {
    return isEqualExceptionHandleConfig(prevProps, nextProps);
  },
);
