import CodeEditor from '@/components/CodeEditor';
import NewMonaco from '@/components/CodeEditor/NewMonaco';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { useSpecificContent } from '@/hooks/useSpecificContent';
import { t } from '@/services/i18nRuntime';
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

// Default JSON content.
const DEFAULT_JSON_CONTENT = '';
/**
 * Exception handling config component.
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
    // Exception handling options.
    const exceptionHandleOptions = useMemo(
      () => [
        {
          label: t('PC.Pages.AntvX6ExceptionItem.interruptFlow'),
          value: ExceptionHandleTypeEnum.INTERRUPT,
        },
        {
          label: t('PC.Pages.AntvX6ExceptionItem.returnSpecificContent'),
          value: ExceptionHandleTypeEnum.SPECIFIC_CONTENT,
        },
        {
          label: t('PC.Pages.AntvX6ExceptionItem.executeExceptionFlow'),
          value: ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW,
        },
      ],
      [],
    );

    // Retry options.
    const retryOptions = useMemo(
      () => [
        {
          label: t('PC.Pages.AntvX6ExceptionItem.noRetry'),
          value: 0,
        },
        {
          label: t('PC.Pages.AntvX6ExceptionItem.retryOnce'),
          value: 1,
        },
        {
          label: t('PC.Pages.AntvX6ExceptionItem.retryTwice'),
          value: 2,
        },
        {
          label: t('PC.Pages.AntvX6ExceptionItem.retryThrice'),
          value: 3,
        },
      ],
      [],
    );

    const [currentExceptionHandleType, setCurrentExceptionHandleType] =
      useState<ExceptionHandleTypeEnum>(exceptionHandleType);

    // Keep editor value in local state to avoid read timing issues.
    const [jsonContent, setJsonContent] = useState<string>(
      convertValueToEditorValue(specificContent) || DEFAULT_JSON_CONTENT,
    );

    const [show, setShow] = useState(false);

    // Initialize form values.
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

    // Sync exception handling type.
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

    // Handle exception type change.
    const handleExceptionTypeChange = (value: ExceptionHandleTypeEnum) => {
      setCurrentExceptionHandleType(value);

      // Ensure JSON content is valid when switching to specific content mode.
      if (value === ExceptionHandleTypeEnum.SPECIFIC_CONTENT) {
        try {
          handleChange(specificContent || '');
        } catch (e) {}
      } else {
        handleChange('');
      }
    };

    // Handle JSON content change.
    const handleJsonContentChange = (value: string) => {
      if (!outerForm) return;
      try {
        JSON.parse(value);
        handleChange(value);
      } catch (e) {
        // Keep editor content when JSON is invalid.
      }
    };

    return (
      <div className={cx(styles.exceptionItem)}>
        {/* Header */}
        <div className={cx(styles.exceptionItemHeader)}>
          <span className={cx(styles.exceptionItemTitle)}>
            {t('PC.Pages.AntvX6ExceptionItem.title')}
          </span>
          <TooltipIcon
            title={t('PC.Pages.AntvX6ExceptionItem.titleTooltip')}
            icon={<InfoCircleOutlined />}
          />
        </div>

        {/* Form fields */}
        <div className={cx(styles.exceptionItemForm)}>
          <div className={cx(styles.exceptionItemRow)}>
            {/* Timeout - 30% width */}
            <Form.Item
              name={[name, 'timeout']}
              label={
                <span className="flex items-center">
                  {t('PC.Pages.AntvX6ExceptionItem.timeoutLabel')}
                  <TooltipIcon
                    title={t('PC.Pages.AntvX6ExceptionItem.timeoutTooltip')}
                    icon={<InfoCircleOutlined />}
                  />
                </span>
              }
              className={cx(styles.exceptionItemFormItem, styles.timeoutItem)}
              rules={[
                {
                  required: true,
                  message: t('PC.Pages.AntvX6ExceptionItem.timeoutRequired'),
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

            {/* Retry count - 30% width */}
            <Form.Item
              name={[name, 'retryCount']}
              label={t('PC.Pages.AntvX6ExceptionItem.retryCountLabel')}
              className={cx(styles.exceptionItemFormItem, styles.retryItem)}
            >
              <Select
                size="small"
                options={retryOptions}
                className={cx(styles.exceptionItemSelect, {
                  [styles.disabled]: disabled,
                })}
                disabled={disabled}
                placeholder={t('PC.Pages.AntvX6ExceptionItem.noRetry')}
              />
            </Form.Item>

            {/* Exception handling mode - 40% width */}
            <Form.Item
              name={[name, 'exceptionHandleType']}
              label={t('PC.Pages.AntvX6ExceptionItem.handleTypeLabel')}
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
                placeholder={t('PC.Pages.AntvX6ExceptionItem.interruptFlow')}
                onChange={handleExceptionTypeChange}
              />
            </Form.Item>
          </div>

          {/* Show custom return content when the mode is specific content. */}
          {currentExceptionHandleType ===
            ExceptionHandleTypeEnum.SPECIFIC_CONTENT && (
            <div className={cx(styles.exceptionItemContentWrapper)}>
              <div className={cx(styles.exceptionItemContentLabel)}>
                <span>
                  {t('PC.Pages.AntvX6ExceptionItem.customReturnContent')}
                </span>
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
                    message: t(
                      'PC.Pages.AntvX6ExceptionItem.customReturnContentRequired',
                    ),
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      try {
                        JSON.parse(value);
                        return Promise.resolve();
                      } catch (error) {
                        return Promise.reject(
                          new Error(
                            t('PC.Pages.AntvX6ExceptionItem.validJsonRequired'),
                          ),
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
