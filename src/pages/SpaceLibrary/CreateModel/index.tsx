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
  apiModelProviders,
  apiModelSave,
  apiModelTestConnectivity,
} from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ModelApiProtocolEnum,
  ModelCapabilityTypeEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelStrategyEnum,
} from '@/types/enums/modelConfig';
import { ModelComponentStatusEnum } from '@/types/enums/space';
import type { CreateModelProps } from '@/types/interfaces/library';
import type {
  ModelConfigInfo,
  ModelFormData,
  ModelProviderInfo,
  ModelProviderModelInfo,
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import IntranetServerCommand from './IntranetServerCommand';
import ProviderPidAutoComplete from './ProviderPidAutoComplete';
import {
  mapModalitiesInputsToCapabilityTypes,
  supplierDefaultProtocolAndUrl,
  supplierResolvableProtocols,
  supplierUrlForProtocol,
} from './supplierApiInfo';
import SupplierModelIdAutoComplete from './SupplierModelIdAutoComplete';
import SupplierModelNameAutoComplete from './SupplierModelNameAutoComplete';

const cx = classNames.bind(styles);

// 向量类模型能力
const EMBEDDING_CAPABILITIES: readonly ModelCapabilityTypeEnum[] = [
  ModelCapabilityTypeEnum.TextEmbedding,
  ModelCapabilityTypeEnum.MultiEmbedding,
];

/** 多选能力中包含向量类（文本向量 / 多模态向量） */
const isEmbeddingCapabilityType = (
  types: ModelCapabilityTypeEnum[] | null,
): boolean => (types ?? []).some((t) => EMBEDDING_CAPABILITIES.includes(t));

/** 多选能力中包含文本生成 / 图像理解 / 语音识别 / 视频理解 任一项（与推理模型开关相关） */
const hasGenerationLikeCapabilityType = (
  types: ModelCapabilityTypeEnum[] | null,
): boolean =>
  (types ?? []).some((t) =>
    (
      [
        ModelCapabilityTypeEnum.Text,
        ModelCapabilityTypeEnum.Image,
        ModelCapabilityTypeEnum.Audio,
        ModelCapabilityTypeEnum.Video,
      ] as ModelCapabilityTypeEnum[]
    ).includes(t),
  );

/** 新建模型时写入表单的默认值（打开创建弹窗并通过 effect 应用；编辑由 runQuery 覆盖） */
const CREATE_MODEL_DEFAULT_VALUES = {
  networkType: ModelNetworkTypeEnum.Internet,
  apiInfoList: [{ weight: 1 }],
  isReasonModel: 0,
  functionCall: ModelFunctionCallEnum.StreamCallSupported,
  apiProtocol: ModelApiProtocolEnum.OpenAI,
  strategy: ModelStrategyEnum.RoundRobin,
  types: [],
  maxTokens: 4096,
  maxContextTokens: 128000,
  dimension: 1536,
  enabled: ModelComponentStatusEnum.Enabled,
  usageScenarios: MODEL_USAGE_SCENARIO_LIST.map((v) => v.value),
};

/**
 * 创建模型弹窗
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
  const [modelTypes, setModelTypes] = useState<
    ModelCapabilityTypeEnum[] | null
  >(null);
  // 检测连接加载中
  const [loadingTestConnection, setLoadingTestConnection] =
    useState<boolean>(false);
  // 确认按钮加载中
  const [loading, setLoading] = useState<boolean>(false);
  // 确认按钮是否可点击
  const [submittable, setSubmittable] = useState<boolean>(false);
  // 模型提供商列表
  const [modelProviderList, setModelProviderList] = useState<
    ModelProviderInfo[]
  >([]);

  /**
   * 供应商 / 供应商模型使用 antd AutoComplete（底层为 rc-select combobox）。
   * 选中后输入框为 pid 或 modelId 时，内置 filterOption 会再按该字符串筛 options，列表常只剩 1 条。
   * 做法：filterOption={false} 关内置过滤；用下方 state 存「用户搜索关键字」，由 useMemo 生成实际传入的 options。
   * 每次展开下拉时清空搜索关键字（setTimeout(0) 排在 rc 可能触发的 onSearch 之后，保证先打开再清）。
   */
  const [pidOptionsFilter, setPidOptionsFilter] = useState<string>('');
  /** 供应商模型「标识」下拉的本地搜索关键字 */
  const [supplierModelOptionsFilter, setSupplierModelOptionsFilter] =
    useState<string>('');
  /** 供应商模型「名称」下拉的本地搜索关键字（与标识列分列，互不干扰输入框展示） */
  const [supplierNameOptionsFilter, setSupplierNameOptionsFilter] =
    useState<string>('');

  // 查询模型提供商列表
  const { run: runModelProviders } = useRequest(apiModelProviders, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelProviderInfo[]) => {
      setModelProviderList(result || []);
    },
  });

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
      setModelTypes(result?.types as ModelCapabilityTypeEnum[] | null);
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
    if (open) {
      runModelProviders();
    }
  }, [open, runModelProviders]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (id !== undefined && id !== null) {
      runQuery(String(id));
    } else {
      form.setFieldsValue(CREATE_MODEL_DEFAULT_VALUES);
      setModelTypes([...CREATE_MODEL_DEFAULT_VALUES.types]);
    }
  }, [open, id, runQuery, form]);

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

  // 监听供应商PID
  const pidWatch = Form.useWatch('pid', form);
  // 监听API协议
  const apiProtocolWatch = Form.useWatch('apiProtocol', form);

  /** 选中供应商 PID 时应的供应商详情 */
  const currentProvider = useMemo(
    () => modelProviderList.find((p) => p.pid === pidWatch),
    [modelProviderList, pidWatch],
  );

  /** 未匹配到列表内供应商时，禁用名称 / 标识 / 介绍（须先选供应商） */
  const supplierModelFieldsDisabled = !currentProvider;

  /** 可选协议：若有供应商且 apiInfo 可解析，则收窄为支持的协议列表 */
  const providerApiProtocolSelectOptions = useMemo(() => {
    const restriction = supplierResolvableProtocols(currentProvider?.apiInfo);
    if (!restriction) return MODEL_API_PROTOCOL_LIST;

    let filtered = MODEL_API_PROTOCOL_LIST.filter((x) =>
      restriction.has(x.value),
    );
    const current = apiProtocolWatch as ModelApiProtocolEnum | undefined;
    if (current && !filtered.some((o) => o.value === current)) {
      const fromDefined = MODEL_API_PROTOCOL_LIST.find(
        (o) => o.value === current,
      );
      if (fromDefined) filtered = [...filtered, fromDefined];
      else filtered = [...filtered, { value: current, label: current }];
    }
    if (!filtered.length) return MODEL_API_PROTOCOL_LIST;
    return filtered;
  }, [currentProvider, apiProtocolWatch]);

  /** 当前供应商下可选模型（展示用 label，提交 value 为 model id） */
  const supplierModelSelectOptions = useMemo(
    () =>
      currentProvider?.models?.map((m) => ({
        label: (m.name || '').trim() ? `${m.name} (${m.id})` : m.id,
        value: m.id,
      })) ?? [],
    [currentProvider],
  );

  /** 经 supplierModelOptionsFilter 筛选后的模型选项（标识列）；空关键字时与 supplierModelSelectOptions 一致 */
  const supplierModelOptionsDisplayed = useMemo(() => {
    const q = supplierModelOptionsFilter.trim().toLowerCase();
    if (!q) return supplierModelSelectOptions;
    return supplierModelSelectOptions.filter(
      (o) =>
        String(o.label ?? '')
          .toLowerCase()
          .includes(q) ||
        String(o.value ?? '')
          .toLowerCase()
          .includes(q),
    );
  }, [supplierModelSelectOptions, supplierModelOptionsFilter]);

  /** 模型名称下拉：label 侧重展示名称，value 仍为 model id */
  const supplierModelNameSelectOptions = useMemo(
    () =>
      currentProvider?.models?.map((m) => ({
        label: (m.name || '').trim() || m.id,
        value: m.id,
      })) ?? [],
    [currentProvider],
  );

  /** 名称列下拉过滤关键字 */
  const supplierNameOptionsDisplayed = useMemo(() => {
    const q = supplierNameOptionsFilter.trim().toLowerCase();
    if (!q) return supplierModelNameSelectOptions;
    return supplierModelNameSelectOptions.filter(
      (o) =>
        String(o.label ?? '')
          .toLowerCase()
          .includes(q) ||
        String(o.value ?? '')
          .toLowerCase()
          .includes(q),
    );
  }, [supplierModelNameSelectOptions, supplierNameOptionsFilter]);

  // 当API协议变化时，按供应商 apiInfo 回写首条 URL；该协议无配置或值为空串时置空（此前 !url 直接 return 会导致仍显示上一协议的地址）
  const providerApiUrlWhenProtocolChanges = useCallback(
    (changedValues: Record<string, unknown>) => {
      if (!('apiProtocol' in changedValues)) {
        return;
      }
      const protocol = changedValues.apiProtocol as ModelApiProtocolEnum;
      const pidVal = form.getFieldValue('pid');
      const provider = modelProviderList.find((p) => p.pid === pidVal);
      if (!provider) {
        return;
      }
      const url = supplierUrlForProtocol(provider.apiInfo, protocol) ?? '';
      const row = form.getFieldValue('apiInfoList')?.[0];
      form.setFieldsValue({
        apiInfoList: [
          {
            url,
            key: row?.key ?? '',
            weight:
              typeof row?.weight === 'number' && !Number.isNaN(row.weight)
                ? row.weight
                : 1,
          },
        ],
      });
    },
    [form, modelProviderList],
  );

  /** 全部供应商：label 为名称，value 为 pid */
  const providerOptions = useMemo(
    () =>
      modelProviderList.map((p) => ({
        label: p.name,
        value: p.pid,
      })),
    [modelProviderList],
  );

  /** 经 pidOptionsFilter 筛选后的供应商选项；空关键字时为全量，避免「已选后再点开只见一条」 */
  const providerOptionsDisplayed = useMemo(() => {
    const q = pidOptionsFilter.trim().toLowerCase();
    if (!q) return providerOptions;
    return providerOptions.filter(
      (o) =>
        String(o.label ?? '')
          .toLowerCase()
          .includes(q) ||
        String(o.value ?? '')
          .toLowerCase()
          .includes(q),
    );
  }, [providerOptions, pidOptionsFilter]);

  /**
   * 用供应商侧的模型元数据回填表单（模型名称 / 标识下拉选中时调用，手动输入不触发）。
   * - modalities.input → 映射为表单 `types`（无可识别项时置 `[]`）
   * - 供应商模型条目上的 reasoning → isReasonModel
   * - 供应商模型条目上的 toolCall → functionCall
   * 回填后同步 `modelTypes` 与表单 `types` 一致。
   */
  const applySupplierModelFields = useCallback(
    (provider: ModelProviderInfo, modelItem: ModelProviderModelInfo) => {
      const patch: Parameters<typeof form.setFieldsValue>[0] = {
        model: modelItem.id,
        name: (modelItem.name || '').trim(),
        description: (provider.doc || '').trim(),
      };

      if (
        modelItem.limit !== undefined &&
        modelItem.limit !== null &&
        typeof modelItem.limit.context === 'number' &&
        !Number.isNaN(modelItem.limit.context)
      ) {
        patch.maxContextTokens = modelItem.limit.context;
      }
      if (
        modelItem.limit !== undefined &&
        modelItem.limit !== null &&
        typeof modelItem.limit.output === 'number' &&
        !Number.isNaN(modelItem.limit.output)
      ) {
        patch.maxTokens = modelItem.limit.output;
      }

      // 供应商模型条目上的 modalities.input → 映射为表单 `types`
      if (
        modelItem.modalities?.input !== undefined &&
        modelItem.modalities?.input !== null
      ) {
        const mapped = mapModalitiesInputsToCapabilityTypes(
          modelItem.modalities.input,
        );
        if (mapped.length > 0) {
          patch.types = mapped;
        } else {
          patch.types = [];
        }
      } else {
        patch.types = [];
      }

      // 供应商模型条目上的 reasoning → isReasonModel
      patch.isReasonModel = modelItem.reasoning ? 1 : 0;

      // 供应商模型条目上的 toolCall → functionCall
      patch.functionCall = modelItem.toolCall
        ? ModelFunctionCallEnum.StreamCallSupported
        : ModelFunctionCallEnum.Unsupported;

      form.setFieldsValue(patch);

      if (patch.types !== undefined) {
        setModelTypes([...patch.types]);
      } else {
        setModelTypes([]);
      }
    },
    [form],
  );

  /** 从下拉选了供应商：重置依赖字段并按供应商 apiInfo 联动协议 / 地址（自行输入 PID 不回填） */
  const applyPidLinkageOnDropdownPick = useCallback(
    (pid: string) => {
      const provider = modelProviderList.find((p) => p.pid === pid);
      const next: Parameters<typeof form.setFieldsValue>[0] = {
        pid,
        model: undefined,
        name: undefined,
        description: undefined,
        apiProtocol: ModelApiProtocolEnum.OpenAI,
        apiInfoList: [{ weight: 1 }],
      };
      const d = provider ? supplierDefaultProtocolAndUrl(provider) : null;
      if (d) {
        next.apiProtocol = d.protocol;
        next.apiInfoList = [{ url: d.url, key: '', weight: 1 }];
      }
      form.setFieldsValue(next);
    },
    [form, modelProviderList],
  );

  const clearPidLinkedFields = useCallback(() => {
    setPidOptionsFilter('');
    setSupplierModelOptionsFilter('');
    setSupplierNameOptionsFilter('');
    setModelTypes([]);
    form.setFieldsValue({
      pid: undefined,
      name: undefined,
      model: undefined,
      description: undefined,
      types: [],
      apiProtocol: ModelApiProtocolEnum.OpenAI,
      apiInfoList: [{ weight: 1 }],
    });
  }, [form]);

  /** 从下拉选供应商模型：回显模型元数据（自行输入不回填） */
  const applySupplierModelLinkageOnDropdownPick = useCallback(
    (modelId: string) => {
      if (!currentProvider) return;
      const item = currentProvider.models?.find((x) => x.id === modelId);
      if (!item) return;
      applySupplierModelFields(currentProvider, item);
    },
    [applySupplierModelFields, currentProvider],
  );

  /** 清空供应商模型及由其联动回填的表单（名称、描述、模型类型等）；顺带重置模型下拉本地搜索关键字 */
  const clearSupplierModelLinkedFields = useCallback(() => {
    setSupplierModelOptionsFilter('');
    setSupplierNameOptionsFilter('');
    setModelTypes([]);
    form.setFieldsValue({
      model: undefined,
      name: undefined,
      description: undefined,
      types: [],
    });
  }, [form]);

  /** 切换供应商后清空列表本地过滤关键字 */
  useEffect(() => {
    setSupplierModelOptionsFilter('');
    setSupplierNameOptionsFilter('');
  }, [currentProvider?.pid]);

  /** 弹窗关闭时重置下拉过滤状态（避免下次打开沿用旧关键字） */
  useEffect(() => {
    if (!open) {
      setPidOptionsFilter('');
      setSupplierModelOptionsFilter('');
      setSupplierNameOptionsFilter('');
    }
  }, [open]);

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
      maskClosable={false}
      keyboard={false}
      classNames={{
        content: cx(styles.container),
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
        onValuesChange={(changedValues) => {
          providerApiUrlWhenProtocolChanges(
            changedValues as Record<string, unknown>,
          );
        }}
        autoComplete="off"
      >
        {/* 仅从列表 onSelect 才 applyPidLinkage；ProviderPidAutoComplete 负责「存 pid / 展示 name」，失焦落盘手写 */}
        <Form.Item
          name="pid"
          label={dict('PC.Pages.SpaceLibrary.CreateModel.modelProvider')}
        >
          <ProviderPidAutoComplete
            className={cx('w-full')}
            placeholder={dict(
              'PC.Pages.SpaceLibrary.CreateModel.selectModelProvider',
            )}
            providerOptionsDisplayed={providerOptionsDisplayed}
            setPidOptionsFilter={setPidOptionsFilter}
            applyPidLinkageOnDropdownPick={applyPidLinkageOnDropdownPick}
            clearPidLinkedFields={clearPidLinkedFields}
            modelProviderList={modelProviderList}
          />
        </Form.Item>
        <div className={cx('flex', styles['gap-16'])}>
          {/* 模型名称 */}
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
            <SupplierModelNameAutoComplete
              className={cx('w-full')}
              disabled={supplierModelFieldsDisabled}
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.inputModelName',
              )}
              supplierNameOptionsDisplayed={supplierNameOptionsDisplayed}
              setSupplierNameOptionsFilter={setSupplierNameOptionsFilter}
              applySupplierModelLinkageOnDropdownPick={
                applySupplierModelLinkageOnDropdownPick
              }
              clearSupplierModelLinkedFields={clearSupplierModelLinkedFields}
              currentProvider={currentProvider}
            />
          </Form.Item>

          {/* 模型标识（供应商模型） */}
          <Form.Item
            className={cx('flex-1')}
            name="model"
            label={dict('PC.Pages.SpaceLibrary.CreateModel.modelIdentifier')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpaceLibrary.CreateModel.selectSupplierModel',
                ),
              },
            ]}
          >
            <SupplierModelIdAutoComplete
              className={cx('w-full')}
              disabled={supplierModelFieldsDisabled}
              placeholder={dict(
                'PC.Pages.SpaceLibrary.CreateModel.selectSupplierModel',
              )}
              supplierModelOptionsDisplayed={supplierModelOptionsDisplayed}
              setSupplierModelOptionsFilter={setSupplierModelOptionsFilter}
              applySupplierModelLinkageOnDropdownPick={
                applySupplierModelLinkageOnDropdownPick
              }
              clearSupplierModelLinkedFields={clearSupplierModelLinkedFields}
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
            disabled={supplierModelFieldsDisabled}
            placeholder={dict(
              'PC.Pages.SpaceLibrary.CreateModel.inputModelDescription',
            )}
            className="dispose-textarea-count"
            showCount
            maxLength={100}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        {/* 模型类型 */}
        <Form.Item
          name="types"
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
            mode="multiple"
            disabled={supplierModelFieldsDisabled}
            onChange={(v) => setModelTypes(v as ModelCapabilityTypeEnum[])}
            options={MODEL_TYPE_LIST}
            placeholder={dict(
              'PC.Pages.SpaceLibrary.CreateModel.selectModelType',
            )}
          />
        </Form.Item>
        <div className={cx('flex', styles['gap-16'])}>
          {/* 推理模型 */}
          {hasGenerationLikeCapabilityType(modelTypes) && (
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

          {/* 向量维度 */}
          <ConditionRender condition={isEmbeddingCapabilityType(modelTypes)}>
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

        {/* 文本模型或多模态模型时显示 */}
        <ConditionRender
          condition={hasGenerationLikeCapabilityType(modelTypes)}
        >
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
        {!isEmbeddingCapabilityType(modelTypes) && (
          <Form.Item
            name="usageScenarios"
            label={dict('PC.Pages.SpaceLibrary.availableScope')}
          >
            <Select
              mode="multiple"
              options={MODEL_USAGE_SCENARIO_LIST}
              placeholder={dict('PC.Pages.SpaceLibrary.selectAvailableScope')}
            />
          </Form.Item>
        )}

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
            options={providerApiProtocolSelectOptions}
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
                  className={cx(styles.apiInfoRow)}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    label={key === 0 ? 'URL' : ''}
                    name={[name, 'url']}
                    className={cx(styles.apiInfoUrl)}
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
                    className={cx(styles.apiInfoKey)}
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
                    className={cx(styles.apiInfoWeight)}
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
                    className={cx(styles.apiInfoActions)}
                    label={
                      key === 0 ? (
                        <PlusCircleOutlined
                          onClick={() => {
                            const rows = form.getFieldValue('apiInfoList') as
                              | ModelSaveParams['apiInfoList']
                              | undefined;
                            const url = rows?.[0]?.url;
                            add({
                              url: typeof url === 'string' ? url : '',
                              key: '',
                              weight: 1,
                            });
                          }}
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
