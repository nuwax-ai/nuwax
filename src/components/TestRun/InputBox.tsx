import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { getAccept } from '@/utils';
import { App, Button, Form, Input, InputNumber, Radio, Upload } from 'antd';
import React from 'react';
import CodeEditor from '../CodeEditor';

interface InputBoxProps {
  item: InputAndOutConfig;
  loading?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ item, loading, ...restProps }) => {
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  const { message } = App.useApp();
  const form = Form.useFormInstance();

  const handleChange: any = (info: any) => {
    if (info.file.status === 'uploading') return;
    if (info.file.status === 'done') {
      try {
        const data = info.file.response?.data;
        form.setFieldValue(item.name, data?.url);
      } catch (error) {
        message.warning(info.file.response?.message);
      }
    }
  };

  switch (true) {
    case item.dataType?.includes('File'):
      return (
        <Upload
          {...restProps}
          action={UPLOAD_FILE_ACTION}
          onChange={handleChange}
          headers={{
            Authorization: token ? `Bearer ${token}` : '',
          }}
          accept={getAccept(item.dataType as DataTypeEnum)}
          disabled={loading}
        >
          <Button>上传文件</Button>
        </Upload>
      );
    case item.dataType === 'Object' || item.dataType?.includes('Array'):
      return (
        <CodeEditor
          value={form.getFieldValue(item.name) || ''}
          codeLanguage={CodeLangEnum.JSON}
          onChange={(code: string) => {
            form.setFieldsValue({ [item.name]: code });
          }}
          height="180px"
        />
      );
    case item.dataType === 'Number':
      return <InputNumber {...restProps} disabled={loading} />;
    case item.dataType === 'Integer':
      return <InputNumber {...restProps} precision={0} disabled={loading} />;
    case item.dataType === 'Boolean':
      return (
        <Radio.Group
          {...restProps}
          disabled={loading}
          options={[
            { label: 'true', value: 'true' },
            { label: 'false', value: 'false' },
          ]}
        />
      );
    case item.dataType === 'String':
      return <Input {...restProps} />;
    default:
      return <Input {...restProps} disabled={loading} />;
  }
};

export default InputBox;
