import { apiSystemModelList } from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
import { CheckOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Col, Form, Input, Modal, Row, Select, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import React, { useState } from 'react';

const cx = classNames.bind(styles);

type DetailModelProps = {
  model?: ModelConfigDto;
  modelType: ModelType;
  open: boolean;
  cancle: () => void;
};
type ModelType = 'edit' | 'new';
const DetailModel: React.FC<DetailModelProps> = (props) => {
  const handleOk = () => {};
  const handleCancel = () => props.cancle();
  const title = props.modelType === 'edit' ? '编辑模型' : '新增模型';
  return (
    <Modal
      title={title}
      open={props.open}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
      okText="确认"
      cancelText="取消"
    >
      <Form layout="vertical" preserve={false}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="模型名称" name="name">
              <Input placeholder="请输入模型名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="模型标识" name="model">
              <Input placeholder="请输入模型标识" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="模型介绍" name="description">
          <Input placeholder="请输入模型介绍" />
        </Form.Item>
        <Form.Item label="模型类型" name="type">
          <Select placeholder="请选择模型类型" />
        </Form.Item>
        <Form.Item label="接口协议" name="apiProtocol">
          <Select placeholder="请选择接口协议" />
        </Form.Item>
        <Form.Item label="向量维度" name="dimension">
          <Input placeholder="请输入向量维度" />
        </Form.Item>
        <Form.Item label="接口配置">
          <Form.Item label="调用策略" name="strategy">
            <Select placeholder="请选择调用策略" />
          </Form.Item>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 全局模型管理页面
 */
const GlobalModelManage: React.FC = () => {
  const selectOptions = [
    { label: '全部', value: '' },
    { label: '会话', value: '1' },
    { label: '嵌入(向量化)', value: '2' },
  ];
  const [modelType, setModelType] = useState<ModelType>('new');
  const [model, setModel] = useState<ModelConfigDto>();
  const [visible, setVisible] = useState<boolean>(false);
  const handleSelectChange = () => {};
  const columns: ColumnsType<ModelConfigDto> = [
    {
      title: '模型名称',
      dataIndex: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
    },
    {
      title: '模型标识',
      dataIndex: 'model',
    },
    {
      title: '模型介绍',
      dataIndex: 'description',
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      render: (creator) => <>{creator.nickName}</>,
    },
    {
      title: '更新时间',
      dataIndex: 'created',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      render: (_, record) => (
        <>
          <Button
            type="link"
            className={cx(styles['table-action-ant-btn-link'])}
            onClick={() => {
              setModel(record);
              setModelType('edit');
              setVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            className={cx(styles['table-action-ant-btn-link'])}
          >
            删除
          </Button>
        </>
      ),
    },
  ];
  const { data, loading } = useRequest(apiSystemModelList, {
    debounceWait: 300,
  });

  return (
    <div className={cx(styles['system-manage-container'])}>
      <h3 className={cx(styles['system-manage-title'])}>全局模型管理</h3>
      <section className={cx('flex', 'content-between')}>
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          dropdownRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
      </section>

      <Table
        rowClassName={cx(styles['table-row-divider'])}
        className={cx('mt-22')}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.data}
      />
      <DetailModel
        modelType={modelType}
        model={model}
        open={visible}
        cancle={() => setVisible(false)}
      />
    </div>
  );
};

export default GlobalModelManage;
