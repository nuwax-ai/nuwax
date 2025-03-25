import ConditionRender from '@/components/ConditionRender';
import {
  apiSystemModelDelete,
  apiSystemModelList,
  apiSystemModelSave,
} from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, message, Popconfirm, Select, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import CreateModel from '../SpaceLibrary/CreateModel';

const cx = classNames.bind(styles);

/**
 * 全局模型管理页面
 */
const GlobalModelManage: React.FC = () => {
  const selectOptions = [
    { label: '全部', value: '' },
    { label: '会话', value: ModelTypeEnum.Chat },
    { label: '嵌入(向量化)', value: ModelTypeEnum.Embeddings },
  ];
  const [visible, setVisible] = useState<boolean>(false);
  const [modelId, setModelId] = useState<number>();
  const [currentType, setCurrentType] = useState<string>();
  const handleSelectChange = (e: string) => setCurrentType(e);
  const {
    data: resData,
    loading,
    run,
  } = useRequest(apiSystemModelList, {
    debounceWait: 300,
  });
  const data = useMemo(() => {
    return resData?.data.filter((v) => !currentType || v.type === currentType);
  }, [currentType, resData?.data]);
  // 删除模型
  const { runAsync: deleteModel, loading: delLoading } = useRequest(
    apiSystemModelDelete,
    { manual: true },
  );
  const delConfirm = async (id: number) => {
    await deleteModel({ id });
    message.success('删除成功');
    run();
  };
  const columns: ColumnsType<ModelConfigDto> = [
    {
      title: '模型名称',
      dataIndex: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (type) => selectOptions.find((v) => v.value === type)?.label,
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
      render: (created) => <>{moment(created).format('YYYY-MM-DD HH:mm:ss')}</>,
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
              setModelId(record.id);
              setVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除模型"
            description={
              <div>
                确认删除模型 <span style={{ color: 'red' }}>{record.name}</span>
                ?
              </div>
            }
            okText="确认"
            okButtonProps={{
              loading: delLoading,
            }}
            cancelText="取消"
            onConfirm={() => delConfirm(record.id)}
          >
            <Button
              type="link"
              className={cx(styles['table-action-ant-btn-link'])}
            >
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];
  return (
    <div className={cx(styles['system-manage-container'])}>
      <h3 className={cx(styles['system-manage-title'])}>全局模型管理</h3>
      <section className={cx('flex', 'content-between')}>
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue=""
          value={currentType}
          onChange={handleSelectChange}
          optionLabelProp="label"
          dropdownRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => (setModelId(undefined), setVisible(true))}
        >
          添加模型
        </Button>
      </section>

      <Table
        rowClassName={cx(styles['table-row-divider'])}
        className={cx('mt-30')}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
      />
      <ConditionRender condition={visible}>
        <CreateModel
          action={apiSystemModelSave}
          id={modelId}
          mode={
            modelId ? CreateUpdateModeEnum.Update : CreateUpdateModeEnum.Create
          }
          open={visible}
          onCancel={() => setVisible(false)}
          onConfirm={() => (run(), setVisible(false))}
        />
      </ConditionRender>
    </div>
  );
};

export default GlobalModelManage;
