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

  const handleChange: any = (info: any, isMultiple: boolean) => {
    if (info.file.status === 'uploading') return;
    console.log('info', info);
    if (info.file.status === 'done') {
      try {
        if (isMultiple) {
          form.setFieldValue(
            item.name,
            info.fileList.map((file: any) => file.response?.data.url || ''),
          );
        } else {
          const data = info.file.response?.data;
          form.setFieldValue(item.name, data?.url);
        }
      } catch (error) {
        message.warning(info.file.response?.message);
      }
    }
  };

  const isMultiple = item.dataType?.startsWith('Array_') ?? false;
  switch (true) {
    case item.dataType?.includes('File'):
      return (
        <Upload
          {...restProps}
          action={UPLOAD_FILE_ACTION}
          onChange={(info: any) => {
            handleChange(info, isMultiple);
          }}
          multiple={isMultiple}
          headers={{
            Authorization: token ? `Bearer ${token}` : '',
          }}
          accept={getAccept(
            isMultiple
              ? (item.dataType?.replace('Array_', '') as DataTypeEnum)
              : (item.dataType as DataTypeEnum),
          )}
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
