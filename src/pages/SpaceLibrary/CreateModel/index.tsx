import ConditionRender from '@/components/ConditionRender';
import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import {
  MODEL_API_PROTOCOL_LIST,
  MODEL_NETWORK_TYPE_LIST,
  MODEL_STRATEGY_LIST,
  MODEL_TYPE_LIST,
} from '@/constants/library.constants';
import { apiModelInfo, apiModelSave } from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ModelApiInfoColumnNameEnum,
  ModelNetworkTypeEnum,
  ModelTypeEnum,
} from '@/types/enums/modelConfig';
import type {
  CreateModelProps,
  ModelConfigDataType,
} from '@/types/interfaces/library';
import type { ModelConfigInfo, ModelFormData } from '@/types/interfaces/model';
import { getNumbersOnly } from '@/utils/common';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  message,
  Radio,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import IntranetModel from './IntranetModel';
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
  const [networkType, setNetworkType] = useState<ModelNetworkTypeEnum>(
    ModelNetworkTypeEnum.Internet,
  );
  // 入参源数据
  const [apiInfoList, setApiInfoList] = useState<ModelConfigDataType[]>([
    {
      key: Math.random(),
      [ModelApiInfoColumnNameEnum.Url]: '',
      [ModelApiInfoColumnNameEnum.Apikey]: '',
      [ModelApiInfoColumnNameEnum.Weight]: '',
    },
  ]);

  // 查询指定模型配置信息
  const { run: runQuery } = useRequest(apiModelInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo) => {
      form.setFieldsValue({
        name: result?.name,
        description: result?.description,
        model: result?.model,
        apiProtocol: result?.apiProtocol,
        networkType: result?.networkType,
        strategy: result?.strategy,
        type: result?.type,
        dimension: result?.dimension,
      });
      const _apiInfoList =
        result?.apiInfoList?.map((item) => ({
          key: Math.random(),
          url: item.url,
          apikey: item.key,
          weight: item.weight,
        })) || [];
      setApiInfoList(_apiInfoList as ModelConfigDataType[]);
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
      message.success('模型已创建成功');
      onConfirm(...params);
    },
  });

  const onFinish: FormProps<ModelFormData>['onFinish'] = (values) => {
    const _apiInfoList = apiInfoList?.map((item) => {
      return {
        url: item.url,
        key: item.apikey,
        weight: item.weight,
      };
    });
    // 模型类型和联网类型此版本先固定写死
    const data = {
      type: ModelTypeEnum.Chat,
      apiInfoList: _apiInfoList,
      ...values,
      networkType: ModelNetworkTypeEnum.Internet,
    };
    if (mode === CreateUpdateModeEnum.Create) {
      run({
        ...data,
        spaceId,
      });
    } else {
      // 更新模型
      run({
        ...data,
        id,
        spaceId,
      });
    }
  };

  const handlerSubmit = async () => {
    await form.submit();
  };

  const handleAdd = () => {
    const _apiInfoList = [...apiInfoList];
    _apiInfoList.push({
      key: Math.random(),
      [ModelApiInfoColumnNameEnum.Url]: '',
      [ModelApiInfoColumnNameEnum.Apikey]: '',
      [ModelApiInfoColumnNameEnum.Weight]: '',
    });
    setApiInfoList(_apiInfoList);
  };

  // 删除
  const handleDel = (index: number) => {
    const _apiInfoList = [...apiInfoList];
    _apiInfoList.splice(index, 1);
    setApiInfoList(_apiInfoList);
  };

  // 修改value值
  const handleChange = (
    index: number,
    attr: ModelApiInfoColumnNameEnum,
    value: string,
  ) => {
    const _apiInfoList = [...apiInfoList];
    _apiInfoList[index][attr as string] =
      attr === ModelApiInfoColumnNameEnum.Weight
        ? getNumbersOnly(value)
        : value;
    setApiInfoList(_apiInfoList);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<ModelConfigDataType>['columns'] = [
    {
      title: 'URL',
      dataIndex: ModelApiInfoColumnNameEnum.Url,
      key: ModelApiInfoColumnNameEnum.Url,
      className: styles['table-bg'],
      render: (_, record, index) => (
        <Input
          placeholder="输入接口URL"
          value={record.url}
          onChange={(e) =>
            handleChange(index, ModelApiInfoColumnNameEnum.Url, e.target.value)
          }
        />
      ),
    },
    {
      title: 'API KEY',
      dataIndex: ModelApiInfoColumnNameEnum.Apikey,
      key: ModelApiInfoColumnNameEnum.Apikey,
      className: styles['table-bg'],
      render: (_, record, index) => (
        <Input
          placeholder="输入接口API KEY"
          value={record.apikey}
          onChange={(e) =>
            handleChange(
              index,
              ModelApiInfoColumnNameEnum.Apikey,
              e.target.value,
            )
          }
        />
      ),
    },
    {
      title: '权重',
      dataIndex: ModelApiInfoColumnNameEnum.Weight,
      key: ModelApiInfoColumnNameEnum.Weight,
      className: styles['table-bg'],
      render: (_, record, index) => (
        <Input
          placeholder="输入权重值"
          value={record.weight}
          onChange={(e) =>
            handleChange(
              index,
              ModelApiInfoColumnNameEnum.Weight,
              e.target.value,
            )
          }
        />
      ),
    },
    {
      title: <PlusOutlined onClick={handleAdd} />,
      key: 'action',
      width: 40,
      className: styles['table-bg'],
      align: 'center',
      render: (_, record, index) => (
        <DeleteOutlined onClick={() => handleDel(index)} />
      ),
    },
  ];

  const handleValuesChange = (changedValues: ModelFormData) => {
    const { networkType } = changedValues;
    setNetworkType(networkType);
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
        onValuesChange={handleValuesChange}
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
        <ConditionRender condition={action !== apiModelSave}>
          <Form.Item
            name="type"
            label="模型类型"
            rules={[{ required: true, message: '选择模型接口协议' }]}
          >
            <Select options={MODEL_TYPE_LIST} placeholder="选择模型接口协议" />
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
        <ConditionRender condition={action !== apiModelSave}>
          <Form.Item
            name="dimension"
            label="向量维度"
            rules={[{ required: true, message: '输入向量维度' }]}
          >
            <Input placeholder="输入向量维度" />
          </Form.Item>
        </ConditionRender>
        <ConditionRender condition={action === apiModelSave}>
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
        </ConditionRender>
        <Form.Item label={<LabelStar label="接口配置" />}>
          <Form.Item className={cx('mb-0')}>
            <p>调用策略</p>
          </Form.Item>
          <Form.Item
            name="strategy"
            rules={[{ required: true, message: '接口配置' }]}
          >
            <Select
              options={MODEL_STRATEGY_LIST}
              rootClassName={styles.select}
              placeholder="请选择调用策略"
            />
          </Form.Item>
          <Form.Item noStyle>
            <Table<ModelConfigDataType>
              rowClassName={cx(styles['table-bg'])}
              columns={inputColumns}
              dataSource={apiInfoList}
              pagination={false}
            />
          </Form.Item>
        </Form.Item>
      </Form>
      {/*内网服务器执行命令弹窗*/}
      <IntranetServerCommand
        visible={visible}
        onCancel={() => setVisible(false)}
      />
    </CustomFormModal>
  );
};

export default CreateModel;
