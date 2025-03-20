import { SystemUserConfig } from '@/types/interfaces/systemManage';
import { Form } from 'antd';
import { useEffect } from 'react';
import BaseFormItem from '../BaseFormItem';

export default function BaseTab({ config }: { config: SystemUserConfig[] }) {
  useEffect(() => {
    console.log(config);
  }, []);
  return (
    <div style={{ backgroundColor: '#f3f5fa', padding: '26px 26px 21px 22px' }}>
      <Form layout="vertical" style={{ width: '520px' }}>
        {config.map((v) => {
          return <BaseFormItem props={v} key={v.name} />;
        })}
      </Form>
    </div>
  );
}
