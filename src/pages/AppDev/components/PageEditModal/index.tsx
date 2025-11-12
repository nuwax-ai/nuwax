import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
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
 * 页面编辑弹窗
 */
const PageEditModal: React.FC<PageEditModalProps> = ({
  open,
  projectInfo,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  // 封面图片
  const [coverImgUrl, setCoverImgUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // 用户是否上传封面图片
  const [isUserUploadCoverImg, setIsUserUploadCoverImg] =
    useState<boolean>(false);

  // 上传前端项目压缩包并启动开发服务器
  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: () => {
      message.success('编辑成功');
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

  // 编辑页面
  const onFinish: FormProps<any>['onFinish'] = async (values) => {
    setLoading(true);
    // 封面图片来源, 如果用户上传了封面图片，则设置封面图片来源为USER, 否则使用项目原有的封面图片来源
    const coverImgSourceType = isUserUploadCoverImg
      ? CoverImgSourceTypeEnum.USER
      : projectInfo?.coverImgSourceType;
    // 调用编辑页面接口
    const data = {
      ...values,
      projectId: projectInfo?.projectId,
      coverImgSourceType,
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

  // 上传图标成功
  const uploadIconSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  // 上传封面图片成功
  const uploadCoverImgSuccess = (url: string) => {
    setCoverImgUrl(url);
    setIsUserUploadCoverImg(true);
    form.setFieldValue('coverImg', url);
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="编辑页面"
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
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" showCount maxLength={50} />
        </Form.Item>
        <OverrideTextArea
          name="projectDesc"
          label="描述"
          placeholder="请输入描述"
          maxLength={10000}
        />
        <Form.Item name="icon" label="图标">
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
              <span>封面图片</span>
              <span className={cx(styles['text-tip'])}>
                建议尺寸356px * 200px, 比例16:9
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
