import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import LabelStar from '@/components/LabelStar';
import {
  MODEL_API_PROTOCOL_LIST,
  MODEL_FUNCTION_CALL_LIST,
  MODEL_STRATEGY_LIST,
  MODEL_TYPE_LIST,
} from '@/constants/library.constants';
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
      message.success('模型检测连接成功');
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
          ? '模型已创建成功'
          : '模型已更新成功',
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
      title={mode === CreateUpdateModeEnum.Create ? '新增模型' : '更新模型'}
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
            模型连通性测试
          </Button>
          <Button className={cx(styles.btn)} type="default" onClick={onCancel}>
            取消
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handlerSubmit}
            className={cx(!submittable && styles['confirm-btn'], styles.btn)}
            disabled={!submittable}
          >
            确定
          </Button>
        </>
      }
    >
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        // onValuesChange={handleValuesChange}
        initialValues={{
          networkType: ModelNetworkTypeEnum.Internet,
          apiInfoList: [{ weight: 1 }],
          isReasonModel: 0,
          functionCall: ModelFunctionCallEnum.CallSupported,
          apiProtocol: ModelApiProtocolEnum.OpenAI,
          strategy: ModelStrategyEnum.RoundRobin,
          type: ModelTypeEnum.Chat,
          maxTokens: 4096,
          dimension: 1536,
          enabled: ModelComponentStatusEnum.Enabled, // 启用
        }}
        autoComplete="off"
      >
        <div className={cx('flex', styles['gap-16'])}>
          <Form.Item
            className={cx('flex-1')}
            name="name"
            label="模型名称"
            rules={[{ required: true, message: '输入模型名称' }]}
          >
            <Input placeholder="输入模型名称" />
          </Form.Item>
          <Form.Item
            className={cx('flex-1')}
            name="model"
            label="模型标识"
            rules={[{ required: true, message: '输入模型标识' }]}
          >
            <Input placeholder="输入模型标识" />
          </Form.Item>
        </div>
        <Form.Item
          name="description"
          label="模型介绍"
          rules={[{ required: true, message: '输入模型介绍' }]}
        >
          <Input.TextArea
            placeholder="输入模型介绍"
            className="dispose-textarea-count"
            showCount
            maxLength={100}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <div className={cx('flex', styles['gap-16'])}>
          <Form.Item
            name="type"
            label="模型类型"
            className={cx('flex-1')}
            rules={[{ required: true, message: '请选择模型类型' }]}
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
              placeholder="请选择模型类型"
            />
          </Form.Item>
          {modelType !== ModelTypeEnum.Embeddings && (
            <Form.Item
              name="isReasonModel"
              className={cx('flex-1')}
              label="推理模型"
            >
              <Radio.Group
                options={[
                  { label: '是', value: 1 },
                  { label: '否', value: 0 },
                ]}
              />
            </Form.Item>
          )}
          <ConditionRender condition={modelType === ModelTypeEnum.Embeddings}>
            <Form.Item
              name="dimension"
              label="向量维度"
              className={cx('flex-1')}
              rules={[{ required: true, message: '填写向量维度' }]}
            >
              <InputNumber className={cx('w-full')} min={0} />
            </Form.Item>
          </ConditionRender>
        </div>

        <ConditionRender condition={modelType !== ModelTypeEnum.Embeddings}>
          <Form.Item
            name="maxTokens"
            label="最大输出token数"
            rules={[{ required: true, message: '请输入最大输出token数' }]}
          >
            <InputNumber className={cx('w-full')} min={0} />
          </Form.Item>
          <Form.Item
            name="functionCall"
            label="函数调用支持"
            rules={[{ required: true, message: '函数调用支持' }]}
          >
            <Select
              options={MODEL_FUNCTION_CALL_LIST}
              placeholder="选择函数调用支持"
            />
          </Form.Item>
        </ConditionRender>

        {/* 启用模型开关 */}
        <Form.Item
          name="enabled"
          label={
            <div className={cx('flex', 'items-center')}>
              <span>是否启用</span>
              <TooltipIcon
                title="禁用后，将不可再被选择，正在使用中的智能体不受影响"
                icon={<InfoCircleOutlined />}
              />
            </div>
          }
        >
          <Radio.Group
            options={[
              { label: '启用', value: ModelComponentStatusEnum.Enabled },
              { label: '禁用', value: ModelComponentStatusEnum.Disabled },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="apiProtocol"
          label="接口协议"
          rules={[{ required: true, message: '选择模型接口协议' }]}
        >
          <Select
            options={MODEL_API_PROTOCOL_LIST}
            placeholder="请选择模型接口协议"
          />
        </Form.Item>
        {/* 隐藏调用策略, 但不去掉，默认选择轮询 -- start */}
        <Form.Item label={<LabelStar label="接口配置" />} noStyle>
          <div className={cx(styles.hide)}>
            <Form.Item noStyle>
              <p>调用策略</p>
            </Form.Item>
            <Form.Item
              className={cx('mb-0')}
              noStyle
              name="strategy"
              rules={[{ required: true, message: '接口配置' }]}
            >
              <Select
                options={MODEL_STRATEGY_LIST}
                rootClassName={styles.select}
                placeholder="请选择调用策略"
              />
            </Form.Item>
          </div>
        </Form.Item>
        {/* 隐藏调用策略 -- end */}
        <Form.Item noStyle>
          <LabelStar label="接口配置" className={cx(styles['weight-600'])} />
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
                    rules={[{ required: true, message: '输入URL' }]}
                  >
                    <Input placeholder="输入URL" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={key === 0 ? 'API KEY' : ''}
                    name={[name, 'key']}
                    rules={[{ required: true, message: '输入API KEY' }]}
                  >
                    <Input placeholder="输入API KEY" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    label={key === 0 ? '权重' : ''}
                    name={[name, 'weight']}
                    rules={[{ required: true, message: '输入权重值' }]}
                  >
                    <InputNumber placeholder="输入权重值" />
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
                    rules={[{ required: true, message: '输入权重值' }]}
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
