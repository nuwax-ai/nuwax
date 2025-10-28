import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import {
  apiCustomPageCreate,
  apiCustomPageCreateReverseProxy,
  apiCustomPageUploadAndStart,
} from '@/services/pageDev';
import { PageDevelopCreateTypeEnum } from '@/types/enums/pageDev';
import {
  CreateCustomPageInfo,
  PageCreateModalProps,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { InboxOutlined } from '@ant-design/icons';
import { Form, FormProps, Input, message, Upload, UploadProps } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';

const { Dragger } = Upload;

/**
 * 页面创建弹窗
 */
const PageCreateModal: React.FC<PageCreateModalProps> = ({
  spaceId,
  type,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 上传前端项目压缩包并启动开发服务器
  const { run: runCreatePageUploadAndStart } = useRequest(
    apiCustomPageUploadAndStart,
    {
      manual: true,
      onSuccess: (result: CreateCustomPageInfo) => {
        onConfirm(result);
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
      },
    },
  );

  // 创建用户前端页面项目
  const { run: runCreatePageCreate } = useRequest(apiCustomPageCreate, {
    manual: true,
    onSuccess: (result: CreateCustomPageInfo) => {
      onConfirm(result);
      setImageUrl('');
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 创建反向代理项目
  const { run: runCreatePageCreateReverseProxy } = useRequest(
    apiCustomPageCreateReverseProxy,
    {
      manual: true,
      onSuccess: (result: CreateCustomPageInfo) => {
        onConfirm(result);
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
      },
    },
  );

  // 创建页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    // 项目导入
    if (type === PageDevelopCreateTypeEnum.Import_Project) {
      const { fileList, icon, projectName, projectDesc } = values;

      // 上传文件接口返回的是文件的base64，这里需要转换一下
      const file = fileList?.[0]?.originFileObj;
      // 校验文件是否存在
      if (!file) {
        message.error('请上传项目压缩包文件');
        return;
      }

      // 校验文件类型
      const isZip = file.name?.endsWith('.zip');

      if (!isZip) {
        message.error('仅支持.zip后缀的压缩文件');
        return;
      }

      setLoading(true);
      // 创建formData
      const formData = new FormData();

      /* 1. 先把“对象”打散成扁平字段，前缀 + 点号 */
      formData.append('icon', icon || '');
      formData.append('projectName', projectName);
      formData.append('projectDesc', projectDesc || '');
      formData.append('spaceId', spaceId.toString());
      /* 2. 追加文件 */
      formData.append('file', file || '');
      runCreatePageUploadAndStart(formData);
    }
    // 在线创建
    else if (type === PageDevelopCreateTypeEnum.Online_Develop) {
      setLoading(true);
      const data = {
        ...values,
        spaceId,
      };
      runCreatePageCreate(data);
    }
    // 反向代理
    else if (type === PageDevelopCreateTypeEnum.Reverse_Proxy) {
      setLoading(true);
      // 调用反向代理接口
      const data = {
        ...values,
        spaceId,
      };
      runCreatePageCreateReverseProxy(data);
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  const handleCancel = () => {
    onCancel();
    setImageUrl('');
  };

  /**
   * 上传组件配置
   */
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    maxCount: 1,
    beforeUpload: (file) => {
      // 校验文件类型
      const isZip = file.name.endsWith('.zip');

      if (!isZip) {
        message.error('仅支持压缩文件(.zip)');
        return Upload.LIST_IGNORE; // 阻止文件被添加到fileList
      }

      // 校验文件大小（限制为10MB）
      // const isLessThan10M = file.size / 1024 / 1024 < 10;
      // if (!isLessThan10M) {
      //   message.error('文件大小不能超过10MB');
      //   return Upload.LIST_IGNORE;
      // }

      return false; // 阻止默认上传行为，改为手动上传
    },
  };

  // 上传图标成功
  const uploadIconSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="创建页面"
      loading={loading}
      onCancel={handleCancel}
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
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            svgIconName="icons-common-upload"
          />
        </Form.Item>
        {type === PageDevelopCreateTypeEnum.Import_Project && (
          <Form.Item
            name="fileList"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
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
