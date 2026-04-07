import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import LabelStar from '@/components/LabelStar';
import {
  MODEL_API_PROTOCOL_LIST,
  MODEL_FUNCTION_CALL_LIST,
  MODEL_STRATEGY_LIST,
  MODEL_TYPE_LIST,
  MODEL_USAGE_SCENARIO_LIST,
} from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiModelInfo,
  apiModelSave,
  apiModelTestConnectivity,
} from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelStrategyEnum,
  ModelTypeEnum,
} from '@/types/enums/modelConfig';
import { ModelComponentStatusEnum } from '@/types/enums/space';
import type { CreateModelProps } from '@/types/interfaces/library';
import type {
  ModelConfigInfo,
  ModelFormData,
  ModelSaveParams,
} from '@/types/interfaces/model';
import { customizeRequiredMark } from '@/utils/form';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  FormProps,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import IntranetServerCommand from './IntranetServerCommand';

const cx = classNames.bind(styles);

/**
 * 创建工作流弹窗
 */
const CreateModel: React.FC<CreateModelProps> = ({
  mode = CreateUpdateModeEnum.Create,
  id,
  spaceId,
  open,
  action = apiModelSave,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState<boolean>(false);
  const [modelType, setModelType] = useState<ModelTypeEnum>();
  // 检测连接加载中
  const [loadingTestConnection, setLoadingTestConnection] =
    useState<boolean>(false);
  // 确认按钮加载中
  const [loading, setLoading] = useState<boolean>(false);
  // 确认按钮是否可点击
  const [submittable, setSubmittable] = useState<boolean>(false);

  // 监听表单值变化
  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  // 查询指定模型配置信息
  const { run: runQuery } = useRequest(apiModelInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo) => {
      form.setFieldsValue(result);
      setModelType(result?.type);
    },
  });

  // 测试模型连通性
  const { run: runTestConnectivity } = useRequest(apiModelTestConnectivity, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(
        dict('PC.Pages.SpaceLibrary.CreateModel.testConnectionSuccess'),
      );
      setLoadingTestConnection(false);
    },
    onError: () => {
      setLoadingTestConnection(false);
    },
  });

  useEffect(() => {
    if (id) {
      runQuery(id);
    }
  }, [id]);

  // 在空间中添加或更新模型配置接口
  const { run } = useRequest(action, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: ModelSaveParams[]) => {
      message.success(
        mode === CreateUpdateModeEnum.Create
          ? dict('PC.Pages.SpaceLibrary.CreateModel.modelCreateSuccess')
          : dict('PC.Pages.SpaceLibrary.CreateModel.modelUpdateSuccess'),
      );
      setLoading(false);
      const info = params[0];
      onConfirm(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps<ModelFormData>['onFinish'] = (values) => {
    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
      run({
        ...values,
        spaceId,
      });
    } else {
      // 更新模型
      run({
        ...values,
        id,
        spaceId,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 检测模型连通性
  const handlerCheckConnection = () => {
    setLoadingTestConnection(true);
    const values = form.getFieldsValue();

    runTestConnectivity({
      ...values,
      id,
      spaceId,
    });
  };

  return (
    <Modal
      title={
        mode === CreateUpdateModeEnum.Create
          ? dict('PC.Pages.SpaceLibrary.CreateModel.addModel')
          : dict('PC.Pages.SpaceLibrary.CreateModel.updateModel')
      }
      open={open}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
        body: cx(styles.body),
      }}
      destroyOnHidden
      onCancel={onCancel}
      footer={
        <>
          <Button
            type="default"
            loading={loadingTestConnection}
            onClick={handlerCheckConnection}
            className={cx(
              !submittable && styles['confirm-btn'],
              styles['connection-btn'],
            )}
            disabled={!submittable}
          >
            {dict('PC.Pages.SpaceLibrary.CreateModel.testConnection')}
          </Button>
          <Button className={cx(styles.btn)} type="default" onClick={onCancel}>
            {dict('PC.Common.Global.cancel')}
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handlerSubmit}
            className={cx(!submittable && styles['confirm-btn'], styles.btn)}
            disabled={!submittable}
          >
            {dict('PC.Common.Global.confirm')}
          </Button>
        </>
      }
    >
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          networkType: ModelNetworkTypeEnum.Internet,
          apiInfoList: [{ weight: 1 }],
          isReasonModel: 0,
          functionCall: ModelFunctionCallEnum.StreamCallSupported,
          apiProtocol: ModelApiProtocolEnum.OpenAI,
          strategy: ModelStrategyEnum.RoundRobin,
          type: ModelTypeEnum.Chat,
          maxTokens: 4096,
          // 最大上下文长度，默认128000
          maxContextTokens: 128000,
          dimension: 1536,
          enabled: ModelComponentStatusEnum.Enabled, // 启用
          usageScenarios: MODEL_USAGE_SCENARIO_LIST.map((v) => v.value),
        }}
        autoComplete="off"
      >
        <div className={cx('flex', styles['gap-16'])}>
          <Form.Item
            className={cx('flex-1')}
            name="name"
            label={dict('PC.Pages.SpaceLibrary.CreateModel.modelName')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceLibrary.CreateModel.inputModelName',
                ),
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.inputModelName',
              )}
            />
          </Form.Item>
          <Form.Item
            className={cx('flex-1')}
            name="model"
            label={dict('PC.Pages.SpaceLibrary.CreateModel.modelIdentifier')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceLibrary.CreateModel.inputModelIdentifier',
                ),
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.inputModelIdentifier',
              )}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceLibrary.CreateModel.modelDescription')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpaceLibrary.CreateModel.inputModelDescription',
              ),
            },
          ]}
        >
          <Input.TextArea
            placeholder={dict(
              'PC.Pages.SpaceLibrary.CreateModel.inputModelDescription',
            )}
            className="dispose-textarea-count"
            showCount
            maxLength={100}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <div className={cx('flex', styles['gap-16'])}>
          <Form.Item
            name="type"
            label={dict('PC.Pages.SpaceLibrary.CreateModel.modelType')}
            className={cx('flex-1')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceLibrary.CreateModel.selectModelType',
                ),
              },
            ]}
          >
            <Select
              onChange={setModelType}
              options={MODEL_TYPE_LIST.filter((v) =>
                [
                  ModelTypeEnum.Chat,
                  ModelTypeEnum.Embeddings,
                  ModelTypeEnum.Multi,
                ].includes(v.value),
              )}
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.selectModelType',
              )}
            />
          </Form.Item>
          {modelType !== ModelTypeEnum.Embeddings && (
            <Form.Item
              name="isReasonModel"
              className={cx('flex-1')}
              label={dict('PC.Pages.SpaceLibrary.CreateModel.reasoningModel')}
            >
              <Radio.Group
                options={[
                  {
                    label: dict('PC.Pages.SpaceLibrary.CreateModel.yes'),
                    value: 1,
                  },
                  {
                    label: dict('PC.Pages.SpaceLibrary.CreateModel.no'),
                    value: 0,
                  },
                ]}
              />
            </Form.Item>
          )}
          <ConditionRender condition={modelType === ModelTypeEnum.Embeddings}>
            <Form.Item
              name="dimension"
              label={dict('PC.Pages.SpaceLibrary.CreateModel.vectorDimension')}
              className={cx('flex-1')}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceLibrary.CreateModel.inputVectorDimension',
                  ),
                },
              ]}
            >
              <InputNumber className={cx('w-full')} min={0} />
            </Form.Item>
          </ConditionRender>
        </div>

        <ConditionRender condition={modelType !== ModelTypeEnum.Embeddings}>
          <div className={cx('flex', styles['gap-16'])}>
            <Form.Item
              name="maxTokens"
              className={cx('flex-1')}
              label={dict('PC.Pages.SpaceLibrary.CreateModel.maxOutputTokens')}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceLibrary.CreateModel.inputMaxOutputTokens',
                  ),
                },
              ]}
            >
              <InputNumber className={cx('w-full')} min={0} />
            </Form.Item>
            <Form.Item
              name="maxContextTokens"
              className={cx('flex-1')}
              label={dict('PC.Pages.SpaceLibrary.CreateModel.maxContextLength')}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceLibrary.CreateModel.inputMaxContextLength',
                  ),
                },
              ]}
            >
              <InputNumber className={cx('w-full')} min={0} />
            </Form.Item>
          </div>
          <Form.Item
            name="functionCall"
            label={dict(
              'PC.Pages.SpaceLibrary.CreateModel.functionCallSupport',
            )}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceLibrary.CreateModel.functionCallSupport',
                ),
              },
            ]}
          >
            <Select
              options={MODEL_FUNCTION_CALL_LIST}
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.selectFunctionCallSupport',
              )}
            />
          </Form.Item>
        </ConditionRender>

        {/* 启用模型开关 */}
        <Form.Item
          name="enabled"
          label={
            <div className={cx('flex', 'items-center')}>
              <span>
                {dict('PC.Pages.SpaceLibrary.CreateModel.enableModel')}
              </span>
              <TooltipIcon
                title={dict('PC.Pages.SpaceLibrary.CreateModel.disableTooltip')}
                icon={<InfoCircleOutlined />}
              />
            </div>
          }
        >
          <Radio.Group
            options={[
              {
                label: dict('PC.Pages.SpaceLibrary.CreateModel.enable'),
                value: ModelComponentStatusEnum.Enabled,
              },
              {
                label: dict('PC.Pages.SpaceLibrary.CreateModel.disable'),
                value: ModelComponentStatusEnum.Disabled,
              },
            ]}
          />
        </Form.Item>

        <Form.Item name="usageScenarios" label="可用范围">
          <Select
            mode="multiple"
            options={MODEL_USAGE_SCENARIO_LIST}
            placeholder="请选择可用范围"
          />
        </Form.Item>

        <Form.Item
          name="apiProtocol"
          label={dict('PC.Pages.SpaceLibrary.CreateModel.apiProtocol')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpaceLibrary.CreateModel.selectApiProtocol',
              ),
            },
          ]}
        >
          <Select
            options={MODEL_API_PROTOCOL_LIST}
            placeholder={dict(
              'PC.Pages.SpaceLibrary.CreateModel.selectApiProtocol',
            )}
          />
        </Form.Item>
        {/* 隐藏调用策略, 但不去掉，默认选择轮询 -- start */}
        <Form.Item
          label={
            <LabelStar
              label={dict('PC.Pages.SpaceLibrary.CreateModel.apiConfig')}
            />
          }
          noStyle
        >
          <div className={cx(styles.hide)}>
            <Form.Item noStyle>
              <p>{dict('PC.Pages.SpaceLibrary.CreateModel.callStrategy')}</p>
            </Form.Item>
            <Form.Item
              className={cx('mb-0')}
              noStyle
              name="strategy"
              rules={[
                {
                  required: true,
                  message: dict('PC.Pages.SpaceLibrary.CreateModel.apiConfig'),
                },
              ]}
            >
              <Select
                options={MODEL_STRATEGY_LIST}
                rootClassName={styles.select}
                placeholder={dict(
                  'PC.Pages.SpaceLibrary.CreateModel.selectCallStrategy',
                )}
              />
            </Form.Item>
          </div>
        </Form.Item>
        {/* 隐藏调用策略 -- end */}
        <Form.Item noStyle>
          <LabelStar
            label={dict('PC.Pages.SpaceLibrary.CreateModel.apiConfig')}
            className={cx(styles['weight-600'])}
          />
        </Form.Item>
        <Form.List name="apiInfoList">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    label={key === 0 ? 'URL' : ''}
                    name={[name, 'url']}
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.SpaceLibrary.CreateModel.inputUrl',
                        ),
                      },
                    ]}
                  >
                    <Input
                      placeholder={dict(
                        'PC.Pages.SpaceLibrary.CreateModel.inputUrl',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={key === 0 ? 'API KEY' : ''}
                    name={[name, 'key']}
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.SpaceLibrary.CreateModel.inputApiKey',
                        ),
                      },
                    ]}
                  >
                    <Input
                      placeholder={dict(
                        'PC.Pages.SpaceLibrary.CreateModel.inputApiKey',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={
                      key === 0
                        ? dict('PC.Pages.SpaceLibrary.CreateModel.weight')
                        : ''
                    }
                    name={[name, 'weight']}
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.SpaceLibrary.CreateModel.inputWeight',
                        ),
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder={dict(
                        'PC.Pages.SpaceLibrary.CreateModel.inputWeight',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      key === 0 ? (
                        <PlusCircleOutlined
                          onClick={() => add({ weight: 1 })}
                        />
                      ) : (
                        ''
                      )
                    }
                    rules={[
                      {
                        required: true,
                        message: dict(
                          'PC.Pages.SpaceLibrary.CreateModel.inputWeight',
                        ),
                      },
                    ]}
                  >
                    {key !== 0 && (
                      <DeleteOutlined onClick={() => remove(name)} />
                    )}
                  </Form.Item>
                </Space>
              ))}
            </>
          )}
        </Form.List>
        {/*内网服务器执行命令弹窗*/}
        <IntranetServerCommand
          visible={visible}
          onCancel={() => setVisible(false)}
        />
      </Form>
    </Modal>
  );
};

export default CreateModel;
