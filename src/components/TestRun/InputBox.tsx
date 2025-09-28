import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { DataTypeEnum, UploadFileStatus } from '@/types/enums/common';
import { CodeLangEnum } from '@/types/enums/plugin';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { FileListItem } from '@/types/interfaces/workflow';
import { getAccept } from '@/utils';
import { App, Button, Form, Input, InputNumber, Radio, Upload } from 'antd';
import { isString } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import CodeEditor from '../CodeEditor';

interface InputBoxProps {
  item: InputAndOutConfig;
  loading?: boolean;
  value?: any;
}

const InputBox: React.FC<InputBoxProps> = ({ item, loading, ...restProps }) => {
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const { getWorkflow } = useModel('workflow');
  const [isMultiple, setIsMultiple] = useState(false);
  const [fileList, setFileList] = useState<FileListItem[] | []>([]);
  useEffect(() => {
    setIsMultiple(item.dataType?.startsWith('Array_') ?? false);
  }, [item.dataType]);
  const handleUploadData = useCallback((info: any): FileListItem[] | [] => {
    const updateFileInfo = info.fileList
      .filter((file: any) => {
        if (!file.response) {
          message.error('上传失败');
        }
        return file.status !== UploadFileStatus.removed && file.response;
      })
      .map((file: any) => {
        const url = file.url || file.response?.data.url;
        const key = file.response?.data.key;
        const name = file.name || file.response?.data.fileName || '';
        return {
          key: key || '',
          status: file.status,
          uid: file.uid || uuidv4(),
          name, // 最url 地址最后一段作为文件名
          url,
        };
      });
    return updateFileInfo;
  }, []);

  const handleChange: any = useCallback(
    (info: any) => {
      const updateFileInfo = handleUploadData(info); //区分 单选 多选
      setFileList(isMultiple ? updateFileInfo : updateFileInfo.splice(0, 1));
      if (info.file.status === UploadFileStatus.error) {
        message.warning(info.file.response?.message);
      }
    },
    [setFileList, isMultiple],
  );

  const handleFormInitFileList = useCallback(
    (
      list: any,
      _isMultiple: boolean,
      formName: string,
    ): FileListItem[] | [] => {
      const theList = _isMultiple ? list : [list];
      return Array.isArray(theList) && theList[0]?.url
        ? theList.map((item: any) => {
            if (isString(item)) {
              const testRunValues = getWorkflow('testRunValues');
              const cachedValue = testRunValues[formName];
              const results =
                _isMultiple && isString(cachedValue)
                  ? JSON.parse(cachedValue)
                  : cachedValue;
              return Array.isArray(results)
                ? results.find((result: any) => result?.url === item)
                : results;
            } else if (item?.url) {
              return {
                uid: item?.uid || uuidv4(),
                name:
                  item?.name || item?.url?.split('/').pop() || item?.url || '', // 最url 地址最后一段作为文件名
                url: item?.url,
                status: UploadFileStatus.done,
              };
            }
            return item;
          }) || []
        : [];
    },
    [],
  );

  useEffect(() => {
    if (item.dataType?.includes('File')) {
      const value = form.getFieldsValue(true)[item.name];
      const formValue =
        isMultiple && isString(value) ? JSON.parse(value) : value;
      const newFileList = handleFormInitFileList(
        formValue,
        isMultiple,
        item.name,
      );
      setFileList(newFileList);
    }
  }, [item.name, item.dataType, isMultiple]);

  useEffect(() => {
    if (item.dataType?.includes('File')) {
      let uploadedFileInfo: FileListItem | FileListItem[];
      uploadedFileInfo =
        fileList.filter((item: any) => item.status === UploadFileStatus.done) ||
        [];
      if (!isMultiple) {
        uploadedFileInfo = uploadedFileInfo[0] || {};
      }
      form.setFieldValue(item.name, uploadedFileInfo);
    }
  }, [fileList, form, item.dataType, item.name, isMultiple]);

  switch (true) {
    case item.dataType?.includes('File'): {
      const uploadRestProps = { ...restProps, maxCount: isMultiple ? 10 : 1 };
      delete uploadRestProps.value;
      return (
        <Upload
          {...uploadRestProps}
          fileList={fileList}
          action={UPLOAD_FILE_ACTION}
          onChange={(info: any) => {
            handleChange(info);
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
    }
    case item.dataType === 'Object' || item.dataType?.includes('Array'): {
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
    }
    case item.dataType === 'Number': {
      return <InputNumber {...restProps} disabled={loading} />;
    }
    case item.dataType === 'Integer': {
      return <InputNumber {...restProps} precision={0} disabled={loading} />;
    }
    case item.dataType === 'Boolean': {
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
    }
    case item.dataType === 'String': {
      return <Input {...restProps} />;
    }
    default: {
      return <Input {...restProps} disabled={loading} />;
    }
  }
};

export default InputBox;
