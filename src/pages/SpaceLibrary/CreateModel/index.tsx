import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import type {
  CreateModelProps,
  ModelConfigDataType,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Form,
  Input,
  message,
  Radio,
  Select,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import IntranetModel from './IntranetModel';
import IntranetServerCommand from './IntranetServerCommand';

const cx = classNames.bind(styles);

/**
 * 创建工作流弹窗
 */
const CreateModel: React.FC<CreateModelProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState<boolean>(false);

  const onFinish = (values) => {
    console.log(values);
    message.success('新增模型已创建');
    onConfirm();
  };

  const handlerSubmit = async () => {
    await form.submit();
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<ModelConfigDataType>['columns'] = [
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      className: styles['table-bg'],
      render: () => <Input placeholder="输入接口URL" />,
    },
    {
      title: 'API KEY',
      dataIndex: 'apiKey',
      key: 'apiKey',
      className: styles['table-bg'],
      render: () => <Input placeholder="输入接口API KEY" />,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      className: styles['table-bg'],
      render: () => <Input placeholder="输入权重值" />,
    },
    {
      title: <PlusOutlined />,
      key: 'action',
      width: 40,
      className: styles['table-bg'],
      align: 'center',
      render: (_, record) => (
        <DeleteOutlined onClick={() => console.log(record)} />
      ),
    },
  ];

  // 入参源数据
  const inputData: ModelConfigDataType[] = [
    {
      key: '1',
      url: 'John Brown',
      apikey: '这里是apikey',
      weight: '这里是weight',
    },
    {
      key: '12',
      url: 'John Brown',
      apikey: '这里是apikey',
      weight: '这里是weight',
    },
  ];

  return (
    <CustomFormModal
      form={form}
      title="新增模型"
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      // loading={loading}
    >
      <Form
        form={form}
        preserve={false}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <div className={cx('flex', styles['gap-16'])}>
          <Form.Item
            className={cx('flex-1')}
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '输入模型名称' }]}
          >
            <Input placeholder="输入模型名称" />
          </Form.Item>
          <Form.Item
            className={cx('flex-1')}
            name="modelIdentification"
            label="模型标识"
            rules={[{ required: true, message: '输入模型标识' }]}
          >
            <Input placeholder="输入模型标识" />
          </Form.Item>
        </div>
        <Form.Item
          name="intro"
          label="模型介绍"
          rules={[{ required: true, message: '输入模型介绍' }]}
        >
          <Input.TextArea
            placeholder="输入模型介绍"
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <Form.Item
          name="protocol"
          label="接口协议"
          rules={[{ required: true, message: '选择模型接口协议' }]}
        >
          <Select
            options={[
              { value: 'jack', label: 'Jack' },
              { value: 'lucy', label: 'Lucy' },
            ]}
            placeholder="请选择模型接口协议"
          />
        </Form.Item>
        <Form.Item name="networkType" label="联网类型">
          <Radio.Group
            options={[
              { value: 1, label: '公网模型' },
              { value: 2, label: '内网模型' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <IntranetModel onOpen={() => setVisible(true)} />
        </Form.Item>
        <Form.Item label={<LabelStar label="接口配置" />}>
          <Form.Item className={cx('mb-0')}>
            <p>调用策略</p>
          </Form.Item>
          <Form.Item
            name="interfaceConfig"
            rules={[{ required: true, message: '接口配置' }]}
          >
            <Select
              options={[
                { value: 'jack', label: 'Jack' },
                { value: 'lucy', label: 'Lucy' },
              ]}
              rootClassName={styles.select}
              placeholder="请选择调用策略"
            />
          </Form.Item>
          <Form.Item className={cx('mb-0')}>
            <Table<ModelConfigDataType>
              rowClassName={cx(styles['table-bg'])}
              columns={inputColumns}
              dataSource={inputData}
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
