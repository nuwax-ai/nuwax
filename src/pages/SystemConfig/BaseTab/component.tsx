import {
  apiSystemAgentList,
  apiSystemConfigUpdate,
  apiUseableModelList,
} from '@/services/systemManage';
import {
  ModelConfigDto,
  PublishedDto,
  SystemUserConfig,
} from '@/types/interfaces/systemManage';
import { Button, Form, message } from 'antd';
import { useEffect, useState } from 'react';
import { TabKey } from '..';
import BaseFormItem from '../BaseFormItem';

export default function BaseTab({
  config,
  currentTab,
  refresh,
}: {
  config: SystemUserConfig[];
  currentTab: TabKey;
  refresh: () => Promise<void>;
}) {
  const [modelList, setModelList] = useState<ModelConfigDto[]>([]);
  const fetchModelList = async () => {
    const res = await apiUseableModelList();
    setModelList(res.data);
  };
  const [agentList, setAgentList] = useState<PublishedDto[]>([]);
  const fetchAgentList = async (kw = '') => {
    const res = await apiSystemAgentList(kw);
    setAgentList(res.data);
  };
  useEffect(() => {
    console.log(config, currentTab);
    if (currentTab === 'ModelSetting') {
      fetchModelList();
    }
    if (currentTab === 'AgentSetting') {
      fetchAgentList();
    }
  }, []);
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
  return (
    <div style={{ backgroundColor: '#f3f5fa', padding: '26px 26px 21px 22px' }}>
      <Form layout="vertical" style={{ width: '520px' }} onFinish={onFinish}>
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
        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
