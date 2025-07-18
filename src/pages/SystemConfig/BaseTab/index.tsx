import {
  apiSystemAgentList,
  apiSystemConfigUpdate,
  apiUseableModelList,
} from '@/services/systemManage';
import {
  ModelConfigDto,
  PublishedDto,
  SystemUserConfig,
  TabKey,
} from '@/types/interfaces/systemManage';
import { Button, Form, message } from 'antd';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import BaseFormItem from '../BaseFormItem';
import styles from './index.less';

const cx = classNames.bind(styles);

export default function BaseTab({
  config,
  currentTab,
  refresh,
}: {
  config: SystemUserConfig[];
  currentTab: TabKey;
  refresh: () => Promise<void>;
}) {
  const [form] = Form.useForm();
  const [modelList, setModelList] = useState<ModelConfigDto[]>([]);
  const [agentList, setAgentList] = useState<PublishedDto[]>([]);
  // 查询可选模型列表
  const fetchModelList = async () => {
    const res = await apiUseableModelList();
    setModelList(res.data);
  };
  // 查询可选择的智能体列表
  const fetchAgentList = async (kw = '') => {
    const res = await apiSystemAgentList(kw);
    setAgentList(res.data);
  };

  useEffect(() => {
    if (currentTab === 'ModelSetting') {
      fetchModelList();
    }
    if (currentTab === 'AgentSetting') {
      fetchAgentList();
    }
  }, [currentTab]);

  const onFinish = async (values: any) => {
    const params: any = {};
    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (value.file) {
        params[key] = value.file.response?.data?.url;
      } else {
        params[key] = value as any;
      }
    });
    await apiSystemConfigUpdate(params);
    message.success('保存成功');
    refresh();
  };

  // 保存配置
  const handleSave = () => {
    form.submit();
  };

  return (
    <div className={cx(styles.container, 'overflow-y', 'flex-1')}>
      <Form
        layout="vertical"
        style={{ width: '520px' }}
        form={form}
        onFinish={onFinish}
      >
        {config.map((v) => {
          return (
            <BaseFormItem
              props={v}
              key={v.name}
              modelList={modelList}
              agentList={agentList}
              currentTab={currentTab}
            />
          );
        })}
      </Form>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </footer>
    </div>
  );
}
