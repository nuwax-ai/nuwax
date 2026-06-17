import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { t } from '@/services/i18nRuntime';
import { apiPageUpdateProject } from '@/services/pageDev';
import { CoverImgSourceTypeEnum } from '@/types/enums/pageDev';
import { PageEditModalProps } from '@/types/interfaces/pageDev';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Page edit modal.
 */
const PageEditModal: React.FC<PageEditModalProps> = ({
  open,
  projectInfo,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // Icon.
  const [imageUrl, setImageUrl] = useState<string>('');
  // Cover image.
  const [coverImgUrl, setCoverImgUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // Whether cover image is uploaded by user.
  const [isUserUploadCoverImg, setIsUserUploadCoverImg] =
    useState<boolean>(false);

  // Update page app config.
  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevPageEditModal.editSuccess'));
      onConfirm();
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    if (open && projectInfo) {
      const { name, description, icon, coverImg } = projectInfo;
      form.setFieldsValue({
        projectName: name,
        projectDesc: description,
        icon: icon || '',
        coverImg: coverImg || '',
      });

      setImageUrl(icon);
      setCoverImgUrl(coverImg);
    }
  }, [open, projectInfo]);

  // Edit app.
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    setLoading(true);
    // Use USER source when cover is uploaded in current edit session.
    const coverImgSourceType = isUserUploadCoverImg
      ? CoverImgSourceTypeEnum.USER
      : projectInfo?.coverImgSourceType;
    // Call update API.
    const data = {
      ...values,
      projectId: projectInfo?.projectId,
      // Do not pass cover source when user did not upload cover in this edit.
      ...(coverImgSourceType ? { coverImgSourceType } : {}),
    };
    runUpdatePage(data);
  };

  const handlerConfirm = () => {
    form.submit();
  };

  const handleCancel = () => {
    onCancel();
    setImageUrl('');
    setCoverImgUrl('');
    setIsUserUploadCoverImg(false);
  };

  // Icon upload success.
  const uploadIconSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  // Cover upload success.
  const uploadCoverImgSuccess = (url: string) => {
    setCoverImgUrl(url);
    setIsUserUploadCoverImg(true);
    form.setFieldValue('coverImg', url);
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={t('PC.Pages.AppDevPageEditModal.modalTitle')}
      loading={loading}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-header'],
        body: styles['modal-body'],
      }}
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
          label={t('PC.Pages.AppDevPageEditModal.name')}
          rules={[
            {
              required: true,
              message: t('PC.Pages.AppDevPageEditModal.nameRequired'),
            },
          ]}
        >
          <Input
            placeholder={t('PC.Pages.AppDevPageEditModal.namePlaceholder')}
            showCount
            maxLength={50}
          />
        </Form.Item>
        <OverrideTextArea
          name="projectDesc"
          label={t('PC.Pages.AppDevPageEditModal.description')}
          placeholder={t('PC.Pages.AppDevPageEditModal.descriptionPlaceholder')}
          maxLength={200}
        />
        <Form.Item name="icon" label={t('PC.Pages.AppDevPageEditModal.icon')}>
          <UploadAvatar
            onUploadSuccess={uploadIconSuccess}
            imageUrl={imageUrl}
            svgIconName="icons-common-plus"
          />
        </Form.Item>
        <Form.Item
          name="coverImg"
          label={
            <div className={cx('flex', 'gap-10', 'items-center')}>
              <span>{t('PC.Pages.AppDevPageEditModal.coverImage')}</span>
              <span className={cx(styles['text-tip'])}>
                {t('PC.Pages.AppDevPageEditModal.coverImageTip')}
              </span>
            </div>
          }
        >
          <UploadAvatar
            className={cx(styles['upload-avatar'])}
            onUploadSuccess={uploadCoverImgSuccess}
            imageUrl={coverImgUrl}
            svgIconName="icons-common-plus"
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PageEditModal;
