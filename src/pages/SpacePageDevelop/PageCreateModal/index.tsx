import workflowIcon from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import {
  apiCustomPageCreate,
  apiCustomPageUploadAndStart,
} from '@/services/pageDev';
import { PageDevelopCreateTypeEnum } from '@/types/enums/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { InboxOutlined } from '@ant-design/icons';
import { Form, FormProps, Input, message, Upload, UploadProps } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';

/**
 * 页面创建弹窗Props
 */
export interface PageCreateModalProps {
  type: PageDevelopCreateTypeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const { Dragger } = Upload;

/**
 * 页面创建弹窗
 */
const PageCreateModal: React.FC<PageCreateModalProps> = ({
  type,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');

  // 上传前端项目压缩包并启动开发服务器
  const { run: runCreatePageUploadAndStart } = useRequest(
    apiCustomPageUploadAndStart,
    {
      manual: true,
      onSuccess: () => {
        onConfirm();
      },
    },
  );

  // 创建用户前端页面项目
  const { run: runCreatePageCreate } = useRequest(apiCustomPageCreate, {
    manual: true,
    onSuccess: () => {
      onConfirm();
    },
  });

  // 创建页面
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log(values, type);
    if (type === PageDevelopCreateTypeEnum.Import_Project) {
      const { zipFile, ...rest } = values;
      // todo 上传文件接口返回的是文件的base64，这里需要转换一下
      const file = JSON.stringify(zipFile.fileList[0]);
      const data = {
        ...rest,
        file,
      };
      runCreatePageUploadAndStart(data);
    } else if (type === PageDevelopCreateTypeEnum.Online_Create) {
      runCreatePageCreate(values);
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  /**
   * 上传组件配置
   */
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip,.rar',
    maxCount: 1,
    beforeUpload: (file) => {
      // 校验文件类型
      const isZip = file.name.endsWith('.zip');

      if (!isZip) {
        message.error('仅支持压缩文件(.zip)');
        return false;
      }

      // 校验文件大小（限制为10MB）
      // const isLessThan10M = file.size / 1024 / 1024 < 10;
      // if (!isLessThan10M) {
      //   message.error('文件大小不能超过10MB');
      //   return false;
      // }

      // setFileList([file]);
      return false; // 阻止默认上传行为，改为手动上传
    },
  };

  // 上传图标成功
  const uploadIconSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="创建页面"
      onCancel={onCancel}
      onConfirm={handlerConfirm}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="projectName"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" showCount maxLength={50} />
        </Form.Item>
        <Form.Item name="projectDesc" label="描述">
          <Input.TextArea
            placeholder="请输入描述"
            autoSize={{ minRows: 4, maxRows: 6 }}
          />
        </Form.Item>
        <Form.Item name="basePath" label="路径">
          <Input placeholder="请输入路径" />
        </Form.Item>
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            defaultImage={workflowIcon}
          />
        </Form.Item>
        {type === PageDevelopCreateTypeEnum.Import_Project && (
          <Form.Item name="zipFile" label="项目压缩包">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                点击或拖拽项目压缩包文件到此区域上传
              </p>
              <p className="ant-upload-hint">仅支持压缩文件(.zip)</p>
            </Dragger>
          </Form.Item>
        )}
      </Form>
    </CustomFormModal>
  );
};

export default PageCreateModal;
