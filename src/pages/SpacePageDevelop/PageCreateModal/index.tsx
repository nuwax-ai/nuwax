import GuardedFormModal, {
  GuardedFormModalForm,
  useFormModalSubmit,
} from '@/components/business-component/GuardedFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import {
  apiCustomPageCreate,
  apiCustomPageCreateReverseProxy,
  apiCustomPageUploadAndStart,
} from '@/services/pageDev';
import {
  CoverImgSourceTypeEnum,
  PageDevelopCreateTypeEnum,
  PageTemplateTypeEnum,
} from '@/types/enums/pageDev';
import {
  CreateCustomPageInfo,
  PageCreateModalProps,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import { InboxOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Form,
  FormProps,
  Input,
  message,
  Select,
  Upload,
  UploadProps,
} from 'antd';
import React, { PropsWithChildren, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const { Dragger } = Upload;

interface PageCreateFormProps extends PropsWithChildren {
  form: FormInstance;
  type: PageDevelopCreateTypeEnum;
  spaceId: number;
  imageUrl: string;
  setLoading: (loading: boolean) => void;
  runCreatePageUploadAndStart: (formData: FormData) => void;
  runCreatePageCreate: (data: Record<string, unknown>) => void;
  runCreatePageCreateReverseProxy: (data: Record<string, unknown>) => void;
}

/** 须在 GuardedFormModal 子树内，onFinish 早退时释放提交锁 */
const PageCreateForm: React.FC<PageCreateFormProps> = ({
  form,
  type,
  spaceId,
  imageUrl,
  setLoading,
  runCreatePageUploadAndStart,
  runCreatePageCreate,
  runCreatePageCreateReverseProxy,
  children,
}) => {
  const modalSubmit = useFormModalSubmit();

  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    if (type === PageDevelopCreateTypeEnum.Import_Project) {
      const { fileList, projectName, projectDesc, coverImg } = values;
      const formIcon = values.icon;
      const file = fileList?.[0]?.originFileObj;

      if (!file) {
        message.error(
          dict('PC.Pages.SpacePageDevelop.PageCreateModal.pleaseUploadZip'),
        );
        modalSubmit?.abortSubmit();
        return;
      }

      const isZip = file.name?.endsWith('.zip');
      if (!isZip) {
        message.error(
          dict('PC.Pages.SpacePageDevelop.PageCreateModal.zipOnly'),
        );
        modalSubmit?.abortSubmit();
        return;
      }

      setLoading(true);
      try {
        const { icon: resolvedIcon, description } = await resolveCreateIcon({
          imageUrl: imageUrl || formIcon || '',
          name: projectName,
          description: projectDesc,
        });
        const formData = new FormData();
        formData.append('icon', resolvedIcon || '');
        formData.append('projectName', projectName);
        formData.append('projectDesc', description ?? projectDesc ?? '');
        formData.append('spaceId', spaceId.toString());
        if (coverImg) {
          formData.append('coverImg', coverImg);
          formData.append('coverImgSourceType', CoverImgSourceTypeEnum.USER);
        }
        formData.append('file', file || '');
        runCreatePageUploadAndStart(formData);
      } catch {
        setLoading(false);
      }
    } else {
      const { coverImg } = values;
      const coverImgSourceType = coverImg ? CoverImgSourceTypeEnum.USER : '';
      setLoading(true);
      try {
        const { icon, description } = await resolveCreateIcon({
          imageUrl: imageUrl || values.icon || '',
          name: values.projectName,
          description: values.projectDesc,
        });
        const data = {
          ...values,
          icon,
          projectDesc: description ?? values.projectDesc,
          spaceId,
          ...(coverImgSourceType ? { coverImgSourceType } : {}),
        };
        if (type === PageDevelopCreateTypeEnum.Online_Develop) {
          runCreatePageCreate(data);
        } else if (type === PageDevelopCreateTypeEnum.Reverse_Proxy) {
          runCreatePageCreateReverseProxy(data);
        }
      } catch {
        setLoading(false);
      }
    }
  };

  return (
    <GuardedFormModalForm
      form={form}
      preserve={false}
      layout="vertical"
      requiredMark={customizeRequiredMark}
      onFinish={onFinish}
      autoComplete="off"
    >
      {children}
    </GuardedFormModalForm>
  );
};

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
  // 封面图片
  // const [coverImgUrl, setCoverImgUrl] = useState<string>('');
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
        message.error(
          dict('PC.Pages.SpacePageDevelop.PageCreateModal.zipOnly'),
        );
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

  // 上传封面图片成功
  // const uploadCoverImgSuccess = (url: string) => {
  //   setCoverImgUrl(url);
  //   form.setFieldValue('coverImg', url);
  // };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <GuardedFormModal
      form={form}
      open={open}
      title={dict('PC.Pages.SpacePageDevelop.PageCreateModal.createApp')}
      loading={loading}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-header'],
        body: styles['modal-body'],
      }}
      onCancel={handleCancel}
      onConfirm={handlerConfirm}
    >
      <PageCreateForm
        form={form}
        type={type}
        spaceId={spaceId}
        imageUrl={imageUrl}
        setLoading={setLoading}
        runCreatePageUploadAndStart={runCreatePageUploadAndStart}
        runCreatePageCreate={runCreatePageCreate}
        runCreatePageCreateReverseProxy={runCreatePageCreateReverseProxy}
      >
        <Form.Item
          name="projectName"
          label={dict('PC.Pages.SpacePageDevelop.PageCreateModal.name')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseEnterName',
              ),
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseEnterName',
            )}
            showCount
            maxLength={50}
          />
        </Form.Item>
        {type === PageDevelopCreateTypeEnum.Online_Develop && (
          <Form.Item
            name="templateType"
            label={dict(
              'PC.Pages.SpacePageDevelop.PageCreateModal.templateType',
            )}
            initialValue={PageTemplateTypeEnum.React}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseSelectTemplateType',
                ),
              },
            ]}
          >
            <Select
              placeholder={dict(
                'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseSelectTemplateType',
              )}
              // 仅允许后端支持的模板值，避免非法参数提交到 create 接口
              options={[
                {
                  label: 'React',
                  value: PageTemplateTypeEnum.React,
                },
                {
                  label: 'Vue3',
                  value: PageTemplateTypeEnum.Vue3,
                },
              ]}
            />
          </Form.Item>
        )}
        <OverrideTextArea
          name="projectDesc"
          label={dict('PC.Pages.SpacePageDevelop.PageCreateModal.description')}
          placeholder={dict(
            'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseEnterDescription',
          )}
          maxLength={200}
        />
        <Form.Item
          name="icon"
          label={dict('PC.Pages.SpacePageDevelop.PageCreateModal.icon')}
        >
          <UploadAvatar
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            svgIconName="icons-common-plus"
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
                {dict(
                  'PC.Pages.SpacePageDevelop.PageCreateModal.uploadDragText',
                )}
              </p>
              <p className="ant-upload-hint">
                {dict('PC.Pages.SpacePageDevelop.PageCreateModal.zipOnly')}
              </p>
            </Dragger>
          </Form.Item>
        )}
      </PageCreateForm>
    </GuardedFormModal>
  );
};

export default PageCreateModal;
