import ConditionRender from '@/components/ConditionRender';
import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import {
  MODEL_API_PROTOCOL_LIST,
  MODEL_FUNCTION_CALL_LIST,
  MODEL_STRATEGY_LIST,
  MODEL_TYPE_LIST,
} from '@/constants/library.constants';
import { apiModelInfo, apiModelSave } from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelStrategyEnum,
  ModelTypeEnum,
} from '@/types/enums/modelConfig';
import type { CreateModelProps } from '@/types/interfaces/library';
import type { ModelConfigInfo, ModelFormData } from '@/types/interfaces/model';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  InputNumber,
  message,
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
  const [modelType, setModelType] = useState<ModelTypeEnum | undefined>();
  // const [shouldRenderDimension, setShouldRenderDimension] = useState(false);
  // const [networkType, setNetworkType] = useState<ModelNetworkTypeEnum>(
  //   ModelNetworkTypeEnum.Internet,
  // );

  // 查询指定模型配置信息
  const { run: runQuery } = useRequest(apiModelInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo) => {
      form.setFieldsValue(result);
      setModelType(result?.type);
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
    onSuccess: (_, params) => {
      message.success(
        mode === CreateUpdateModeEnum.Create
          ? '模型已创建成功'
          : '模型已更新成功',
      );
      onConfirm(...params);
    },
  });

  const onFinish: FormProps<ModelFormData>['onFinish'] = (values) => {
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

  const handlerSubmit = async () => {
    await form.submit();
  };

  // const handleValuesChange = (changedValues: ModelFormData) => {
  //   // const { networkType } = changedValues;
  //   // setNetworkType(networkType);
  //   if (action !== apiModelSave) {
  //     setShouldRenderDimension(changedValues.type === ModelTypeEnum.Embeddings);
  //   }
  // };

  const onTypeChanege = (value: ModelTypeEnum) => {
    setModelType(value);
  };

  return (
    <CustomFormModal
      form={form}
      title={mode === CreateUpdateModeEnum.Create ? '新增模型' : '更新模型'}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
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
          isReasonModel: 1,
          functionCall: ModelFunctionCallEnum.CallSupported,
          apiProtocol: ModelApiProtocolEnum.OpenAI,
          strategy: ModelStrategyEnum.RoundRobin,
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
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <div className={cx('flex', styles['gap-16'])}>
          {/* <ConditionRender condition={action !== apiModelSave}> */}
          <Form.Item
            name="type"
            label="模型类型"
            className={cx('flex-1')}
            rules={[{ required: true, message: '请选择模型类型' }]}
          >
            <Select
              onChange={onTypeChanege}
              options={MODEL_TYPE_LIST.filter((v) =>
                [
                  ModelTypeEnum.Chat,
                  ModelTypeEnum.Embeddings,
                  ModelTypeEnum.Multi,
                ].includes(v.value),
              )}
              placeholder="选择模型接口协议"
            />
          </Form.Item>
          {/* </ConditionRender> */}
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
              rules={[{ required: false, message: '填写向量维度' }]}
            >
              <InputNumber />
            </Form.Item>
          </ConditionRender>
        </div>

        <ConditionRender condition={modelType !== ModelTypeEnum.Embeddings}>
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
        {/* <ConditionRender condition={shouldRenderDimension}>
          <Form.Item
            name="dimension"
            label="向量维度"
            rules={[{ required: true, message: '输入向量维度' }]}
          >
            <Input placeholder="输入向量维度" />
          </Form.Item>
        </ConditionRender> */}
        {/* <ConditionRender condition={action === apiModelSave}>
          <Form.Item name="networkType" label="联网类型">
            <Radio.Group options={MODEL_NETWORK_TYPE_LIST} />
          </Form.Item>
        </ConditionRender>
        <ConditionRender
          condition={
            action === apiModelSave &&
            networkType === ModelNetworkTypeEnum.Intranet
          }
        >
          <Form.Item>
            <IntranetModel onOpen={() => setVisible(true)} />
          </Form.Item>
        </ConditionRender> */}
        <Form.Item label={<LabelStar label="接口配置" />}>
          <Form.Item className={cx('mb-0')}>
            <p>调用策略</p>
          </Form.Item>
          <Form.Item
            className={cx('mb-0')}
            name="strategy"
            rules={[{ required: true, message: '接口配置' }]}
          >
            <Select
              options={MODEL_STRATEGY_LIST}
              rootClassName={styles.select}
              placeholder="请选择调用策略"
            />
          </Form.Item>
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
    </CustomFormModal>
  );
};

export default CreateModel;
