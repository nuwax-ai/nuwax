import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { apiPageAddPath, apiPageUpdatePath } from '@/services/pageDev';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  AddPathModalProps,
  PageAddPathParams,
} from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 添加（修改）路径参数弹窗
 */
const AddPathModal: React.FC<AddPathModalProps> = ({
  projectId,
  mode = CreateUpdateModeEnum.Create,
  editPathInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

  const title =
    mode === CreateUpdateModeEnum.Create
      ? dict('PC.Pages.SpacePageDevelop.AddPathModal.addPath')
      : dict('PC.Pages.SpacePageDevelop.AddPathModal.editPath');

  useEffect(() => {
    if (open && editPathInfo) {
      form.setFieldsValue({
        name: editPathInfo.name,
        pageUri: editPathInfo.pageUri,
        description: editPathInfo.description,
      });
    }
  }, [open, editPathInfo]);

  const handleSuccess = (info: PageAddPathParams) => {
    message.success(
      dict('PC.Pages.SpacePageDevelop.AddPathModal.actionSuccess').replace(
        '{0}',
        title,
      ),
    );
    setLoading(false);
    onConfirm(info, editPathInfo);
  };

  // 添加路径配置
  const { run: runAddPath } = useRequest(apiPageAddPath, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageAddPathParams[]) => {
      const info = params[0];
      handleSuccess(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 编辑路径配置
  const { run: runUpdatePath } = useRequest(apiPageUpdatePath, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageAddPathParams[]) => {
      const info = params[0];
      handleSuccess(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 提交表单
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    setLoading(true);
    const params = {
      projectId,
      ...values,
    };
    if (mode === CreateUpdateModeEnum.Create) {
      runAddPath(params);
    } else {
      runUpdatePath(params);
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={title}
      loading={loading}
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
          name="name"
          label={dict('PC.Pages.SpacePageDevelop.AddPathModal.pathName')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpacePageDevelop.AddPathModal.pleaseEnterPathName',
              ),
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Pages.SpacePageDevelop.AddPathModal.pleaseEnterPathName',
            )}
            showCount
            maxLength={50}
          />
        </Form.Item>
        <Form.Item
          name="pageUri"
          label={dict('PC.Pages.SpacePageDevelop.AddPathModal.pathUri')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpacePageDevelop.AddPathModal.pleaseEnterPathUri',
              ),
            },
            {
              validator(_, value) {
                if (!value || value.startsWith('/')) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    dict(
                      'PC.Pages.SpacePageDevelop.AddPathModal.pathUriFormatError',
                    ),
                  ),
                );
              },
            },
          ]}
        >
          <Input
            disabled={mode === CreateUpdateModeEnum.Update}
            placeholder={dict(
              'PC.Pages.SpacePageDevelop.AddPathModal.pathUriPlaceholder',
            )}
            showCount
            maxLength={200}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpacePageDevelop.AddPathModal.pathDescription')}
        >
          <Input.TextArea
            placeholder={dict(
              'PC.Pages.SpacePageDevelop.AddPathModal.pathDescriptionPlaceholder',
            )}
            autoSize={{ minRows: 4, maxRows: 6 }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default AddPathModal;
