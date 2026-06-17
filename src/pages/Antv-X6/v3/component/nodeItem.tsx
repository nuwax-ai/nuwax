// Node panels for common workflow node types.
import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import TiptapVariableInput from '@/components/TiptapVariableInput/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { VARIABLE_CONFIG_TYPE_OPTIONS } from '@/pages/Antv-X6/v3/constants/node.constants';
import { t } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum, VariableConfigTypeEnum } from '@/types/enums/node';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import {
  ExclamationCircleOutlined,
  ExpandAltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { cycleOption, outPutConfigs } from '../ParamsV3';
import { InputAndOut, OtherFormList, TreeOutput } from './commonNode';
import './nodeItem.less';
// Shared options.

// Start node.
const StartNode: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  id,
  type,
}) => {
  return (
    <Form.Item name={'inputArgs'}>
      <CustomTree
        key={`${type}-${id}-inputArgs`}
        title={t('PC.Pages.AntvX6Data.input')}
        inputItemName={'inputArgs'}
        params={nodeConfig?.inputArgs || []}
        form={form}
        showCheck
      />
    </Form.Item>
  );
};
// Document extraction node.
const DocumentExtractionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <>
      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AntvX6Data.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
          disabledAdd
          disabledDelete
          disabledInput
        />
      </div>
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6Data.output')}
              </div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// End/process-output node.
const EndNode: React.FC<NodeDisposeProps> = ({ form, type }) => {
  const { referenceList } = useModel('workflowV3');
  const segOptions = [
    {
      label: t('PC.Pages.AntvX6NodeItem.returnVariable'),
      value: 'VARIABLE',
    },
    { label: t('PC.Pages.AntvX6NodeItem.returnText'), value: 'TEXT' },
  ];
  const outputArgs =
    Form.useWatch(InputItemNameEnum.outputArgs, {
      form,
      preserve: true,
    }) || [];

  return (
    <>
      {type === 'End' && (
        <div className="dis-center">
          <Form.Item name={'returnType'}>
            <Segmented<string>
              options={segOptions}
              style={{ marginBottom: '10px' }}
            />
          </Form.Item>
        </div>
      )}
      <div
        className={
          form.getFieldValue('returnType') !== 'VARIABLE'
            ? 'node-item-style'
            : ''
        }
      >
        <InputAndOut
          title={t('PC.Pages.AntvX6NodeItem.outputVariable')}
          form={form}
          fieldConfigs={outPutConfigs}
          showCopy={true}
          inputItemName={InputItemNameEnum.outputArgs}
        />
      </div>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('returnType') !== 'VARIABLE' && (
            <>
              <div className="dis-sb margin-bottom">
                <span className="node-title-style gap-6 flex items-center">
                  {t('PC.Pages.AntvX6NodeItem.outputContent')}
                  <TooltipIcon
                    title={t('PC.Pages.AntvX6NodeItem.outputContentTooltip')}
                    icon={<ExclamationCircleOutlined />}
                  />
                </span>
              </div>
              <Form.Item
                name="content"
                getValueFromEvent={(value) =>
                  typeof value === 'string' ? extractTextFromHTML(value) : ''
                }
              >
                <TiptapVariableInput
                  placeholder={t(
                    'PC.Pages.AntvX6NodeItem.outputContentPlaceholder',
                  )}
                  style={{
                    minHeight: '80px',
                    marginBottom: '10px',
                  }}
                  variables={transformToPromptVariables(
                    outputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
                    referenceList?.argMap,
                  )}
                />
              </Form.Item>
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// Loop node.
const CycleNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <div>
      <div className="node-item-style">
        <span className="node-title-style margin-bottom gap-6 flex items-center">
          {t('PC.Pages.AntvX6NodeItem.loopSetting')}
          <TooltipIcon
            title={t('PC.Pages.AntvX6NodeItem.loopSettingTooltip')}
            icon={<ExclamationCircleOutlined />}
          />
        </span>
        <Form.Item name={'loopType'}>
          <Select
            options={cycleOption}
            style={{ width: '100%', marginBottom: '10px' }}
          ></Select>
        </Form.Item>
      </div>

      {/* Render loop settings by selected loop type. */}
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.loopType !== currentValues.loopType
        }
      >
        {() => {
          const loopType = form.getFieldValue('loopType');
          if (loopType === 'SPECIFY_TIMES_LOOP') {
            return (
              <div className="node-item-style">
                <div className="node-title-style margin-bottom">
                  {t('PC.Pages.AntvX6NodeItem.loopTimes')}
                </div>
                <Form.Item name="loopTimes">
                  <InputNumber
                    size="small"
                    style={{ width: '100%', marginBottom: '10px' }}
                    placeholder={t(
                      'PC.Pages.AntvX6NodeItem.loopTimesPlaceholder',
                    )}
                    min={1}
                    precision={0}
                  />
                </Form.Item>
              </div>
            );
          } else if (loopType === 'ARRAY_LOOP') {
            return (
              <div className="node-item-style">
                <InputAndOut
                  title={t('PC.Pages.AntvX6NodeItem.loopArray')}
                  fieldConfigs={outPutConfigs}
                  inputItemName={InputItemNameEnum.inputArgs}
                  form={form}
                />
              </div>
            );
          }
          return null;
        }}
      </Form.Item>
      <div className="node-item-style">
        <InputAndOut
          title={
            <>
              {t('PC.Pages.AntvX6NodeItem.intermediateVariable')}
              <TooltipIcon
                title={t('PC.Pages.AntvX6NodeItem.intermediateVariableTooltip')}
                icon={<ExclamationCircleOutlined />}
              />
            </>
          }
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.variableArgs}
          form={form}
          isVariable
        />
      </div>

      <InputAndOut
        title={t('PC.Pages.AntvX6Data.output')}
        fieldConfigs={outPutConfigs}
        inputItemName={InputItemNameEnum.outputArgs}
        form={form}
        isLoop
      />
    </div>
  );
};

// Variable node.
const VariableNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const options = VARIABLE_CONFIG_TYPE_OPTIONS;
  const configType = form.getFieldValue('configType');
  const isSetVariable = configType === VariableConfigTypeEnum.SET_VARIABLE;
  return (
    <>
      <Form.Item
        name={'configType'}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented options={options} />
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          isSetVariable ? (
            <div className="node-item-style">
              <InputAndOut
                title={t('PC.Pages.AntvX6NodeItem.setVariable')}
                fieldConfigs={outPutConfigs}
                inputItemName={InputItemNameEnum.inputArgs}
                form={form}
              />
            </div>
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          !isSetVariable ? (
            <OtherFormList
              title={t('PC.Pages.AntvX6NodeItem.outputVariable')}
              fieldConfigs={outPutConfigs}
              inputItemName={InputItemNameEnum.outputArgs}
              form={form}
            />
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          isSetVariable ? (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6Data.output')}
              </div>
              <TreeOutput
                treeData={[
                  {
                    name: 'isSuccess',
                    dataType: DataTypeEnum.Boolean,
                    description: '',
                    require: true,
                    systemVariable: false,
                    bindValue: '',
                    key: 'outputArray',
                  },
                ]}
              />
            </>
          ) : null
        }
      </Form.Item>
    </>
  );
};

// Variable aggregation node (extracted).
import VariableAggregationNode from './VariableAggregation';

// Text processing node.
const TextProcessingNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const { referenceList } = useModel('workflowV3');
  const textTypeOptions = [
    { label: t('PC.Pages.AntvX6NodeItem.stringConcat'), value: 'CONCAT' },
    { label: t('PC.Pages.AntvX6NodeItem.stringSplit'), value: 'SPLIT' },
  ];

  const [options, setOptions] = useState([
    { value: '\\n', label: t('PC.Pages.AntvX6NodeItem.newline') },
    { value: '\\t', label: t('PC.Pages.AntvX6NodeItem.tab') },
    { value: '\u3002', label: t('PC.Pages.AntvX6NodeItem.fullStop') },
    { value: ',', label: t('PC.Pages.AntvX6NodeItem.comma') },
    { value: ';', label: t('PC.Pages.AntvX6NodeItem.semicolon') },
    { value: '&nbsp;', label: t('PC.Pages.AntvX6NodeItem.space') },
  ]);

  const [newItem, setNewItem] = useState({
    label: '',
    value: '',
  });

  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || [];

  // Add a custom separator option.
  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    if (newItem.label === '' || newItem.value === '') return;
    const newOption = {
      label: `${newItem.label}(${newItem.value})`,
      value: newItem.value,
    };
    setOptions([...options, newOption]);
    setNewItem({ label: '', value: '' });
    localStorage.setItem(
      'arrayLinkSetting',
      JSON.stringify([...options, newOption]),
    );
  };

  useEffect(() => {
    const arrayLinkSetting = localStorage.getItem('arrayLinkSetting');
    if (arrayLinkSetting) {
      setOptions(JSON.parse(arrayLinkSetting));
    }
  }, []);

  return (
    <>
      <Form.Item
        name={'textHandleType'}
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <Segmented
          options={
            textTypeOptions as { label: string; value: 'CONCAT' | 'SPLIT' }[]
          }
        />
      </Form.Item>
      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AntvX6Data.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('textHandleType') === 'CONCAT' ? (
            <div className="node-item-style">
              <div className="dis-sb margin-bottom">
                <span className="node-title-style">
                  {t('PC.Pages.AntvX6NodeItem.stringConcat')}
                </span>
                <Popover
                  placement="topRight"
                  content={
                    <>
                      <p className="node-title-style">
                        {t('PC.Pages.AntvX6NodeItem.arrayJoinSymbolSetting')}
                      </p>
                      <p>
                        {t(
                          'PC.Pages.AntvX6NodeItem.arrayJoinSymbolDescription',
                        )}
                      </p>
                      <p className="array-link-setting-select-label">
                        {t('PC.Pages.AntvX6NodeItem.joinSymbol')}
                      </p>
                      <Form.Item name="join">
                        <Select
                          options={options}
                          allowClear
                          placeholder={t(
                            'PC.Pages.AntvX6NodeItem.selectJoinSymbol',
                          )}
                          popupRender={(menu) => (
                            <>
                              {menu}
                              <Divider style={{ margin: '8px 0' }} />
                              <div
                                style={{ padding: '8px' }}
                                className="dis-sb"
                              >
                                <Space>
                                  <Input
                                    value={newItem.label}
                                    placeholder={t(
                                      'PC.Pages.AntvX6NodeItem.optionNamePlaceholder',
                                    )}
                                    onChange={(e) =>
                                      setNewItem({
                                        value: newItem.value,
                                        label: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                  <Input
                                    value={newItem.value}
                                    placeholder={t(
                                      'PC.Pages.AntvX6NodeItem.optionValuePlaceholder',
                                    )}
                                    onChange={(e) =>
                                      setNewItem({
                                        label: newItem.label,
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => e.stopPropagation()}
                                  />
                                  <Button type="primary" onClick={addItem}>
                                    {t('PC.Pages.AntvX6NodeItem.add')}
                                  </Button>
                                </Space>
                              </div>
                            </>
                          )}
                          style={{ width: '100%', marginBottom: '10px' }}
                        />
                      </Form.Item>
                    </>
                  }
                  trigger="click"
                >
                  <Button type="text" icon={<SettingOutlined />} size="small" />
                </Popover>
              </div>
              <Form.Item
                name="text"
                getValueFromEvent={(value) =>
                  typeof value === 'string' ? extractTextFromHTML(value) : ''
                }
              >
                <TiptapVariableInput
                  placeholder={t(
                    'PC.Pages.AntvX6NodeItem.inputVariablePlaceholder',
                  )}
                  style={{
                    minHeight: '80px',
                  }}
                  variables={transformToPromptVariables(
                    inputArgs.filter(
                      (item: InputAndOutConfig) =>
                        !['', null, undefined].includes(item.name),
                    ),
                    referenceList?.argMap,
                  )}
                />
              </Form.Item>
            </div>
          ) : null
        }
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('textHandleType') === 'SPLIT' ? (
            <div className="node-item-style">
              <span className="node-title-style">
                {t('PC.Pages.AntvX6NodeItem.delimiter')}
              </span>
              <Form.Item name="splits">
                <Select
                  allowClear
                  placeholder={t('PC.Pages.AntvX6NodeItem.selectSplitSymbol')}
                  mode={'multiple'}
                  maxTagCount={3}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '8px' }} className="dis-sb">
                        <Space>
                          <Input
                            value={newItem.label}
                            placeholder={t(
                              'PC.Pages.AntvX6NodeItem.optionNamePlaceholder',
                            )}
                            onChange={(e) =>
                              setNewItem({
                                value: newItem.value,
                                label: e.target.value,
                              })
                            }
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <Input
                            value={newItem.value}
                            placeholder={t(
                              'PC.Pages.AntvX6NodeItem.optionValuePlaceholder',
                            )}
                            onChange={(e) =>
                              setNewItem({
                                label: newItem.label,
                                value: e.target.value,
                              })
                            }
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <Button type="primary" onClick={addItem}>
                            {t('PC.Pages.AntvX6NodeItem.add')}
                          </Button>
                        </Space>
                      </div>
                    </>
                  )}
                  options={options}
                ></Select>
              </Form.Item>
            </div>
          ) : null
        }
      </Form.Item>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6Data.output')}
              </div>
              <TreeOutput
                treeData={
                  form.getFieldValue('textHandleType') === 'CONCAT'
                    ? [
                        {
                          name: 'output',
                          dataType: DataTypeEnum.String,
                          description: '',
                          require: true,
                          systemVariable: false,
                          bindValue: '',
                          key: 'outputArray',
                        },
                      ]
                    : [
                        {
                          name: 'output',
                          dataType: DataTypeEnum.Array_String,
                          description: '',
                          require: true,
                          systemVariable: false,
                          bindValue: '',
                          key: 'outputString',
                        },
                      ]
                }
              />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

// Code node.
const CodeNode: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  type,
  id,
}) => {
  const [show, setShow] = useState(false);
  const { setIsModified } = useModel('workflowV3');
  const fieldName =
    form.getFieldValue('codeLanguage') === CodeLangEnum.JavaScript
      ? 'codeJavaScript'
      : 'codePython';

  const codeLanguage =
    form.getFieldValue('codeLanguage') || CodeLangEnum.JavaScript;
  return (
    <>
      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AntvX6Data.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      <div className="node-item-style">
        <div>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style ">
              {t('PC.Pages.AntvX6NodeItem.code')}
            </span>
            <Button
              icon={<ExpandAltOutlined />}
              size="small"
              type="text"
              onClick={() => setShow(true)}
            ></Button>
          </div>
          <CodeEditor
            form={form}
            value={form.getFieldValue(fieldName)}
            onChange={(value) => {
              form.setFieldValue(fieldName, value);
              setIsModified(true);
            }}
            codeLanguage={codeLanguage}
            height="180px"
          />
        </div>
      </div>
      <CustomTree
        title={t('PC.Pages.AntvX6Data.output')}
        key={`${type}-${id}-outputArgs`}
        params={nodeConfig?.outputArgs || []}
        form={form}
        inputItemName={'outputArgs'}
      />
      <Monaco form={form} isShow={show} close={() => setShow(false)} />
    </>
  );
};

export default {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
  VariableAggregationNode,
  CodeNode,
  TextProcessingNode,
  DocumentExtractionNode,
};
