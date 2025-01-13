import personal from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SPACE_APPLICATION_LIST } from '@/constants/space.contants';
import { SpaceApplicationListEnum } from '@/types/enums/space';
import { customizeRequiredMark } from '@/utils/form';
import { DownOutlined } from '@ant-design/icons';
import { Form, Input, Popover } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import PersonalSpaceContent from './PersonalSpaceContent';

const cx = classNames.bind(styles);

const SpaceSection: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();

  const handlerApplication = (type: SpaceApplicationListEnum) => {
    console.log(type);
  };

  const showModal = () => {
    setOpen(false);
    setOpenModal(true);
  };

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    form.submit();
    setTimeout(() => {
      setOpenModal(false);
      setConfirmLoading(false);
    }, 3000);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <div className={cx('h-full', 'px-6', 'py-16', 'overflow-y')}>
      <Popover
        placement="bottomLeft"
        open={open}
        trigger="click"
        arrow={false}
        onOpenChange={setOpen}
        content={<PersonalSpaceContent onCreateTeam={showModal} />}
      >
        <div
          className={cx(
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
            'px-6',
            styles.header,
          )}
        >
          <img
            className={cx(styles.img, 'radius-6')}
            src={personal as string}
            alt=""
          />
          <span className={cx('flex-1', styles.title)}>个人空间</span>
          <DownOutlined className={cx(styles['icon-down'])} />
        </div>
      </Popover>
      <ul>
        {SPACE_APPLICATION_LIST.map((item) => (
          <li
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            className={cx(
              styles['space-item'],
              'hover-box',
              'flex',
              'items-center',
              'cursor-pointer',
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <ul>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
        <li
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img
            src="https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D"
            alt=""
          />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            代码助手代码助手代码助手代码助手
          </span>
        </li>
      </ul>
      <CustomFormModal
        form={form}
        title={'创建新团队'}
        open={openModal}
        onCancel={handleCancel}
        loading={confirmLoading}
        onConfirm={handleOk}
      >
        <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
          <p className={cx(styles['create-team-tips'])}>
            通过创建团队，将支持项目、智能体、插件、工作流和知识库在团队内进行协作和共享。
          </p>
          <UploadAvatar
            className={styles['upload-box']}
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={
              'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D'
            }
          />
          <Form
            form={form}
            preserve={false}
            requiredMark={customizeRequiredMark}
            layout="vertical"
            onFinish={onFinish}
            rootClassName={cx(styles['create-team-form'])}
            autoComplete="off"
          >
            <Form.Item
              name="teamName"
              label="团队名称"
              rules={[{ required: true, message: '请输入团队名称' }]}
            >
              <Input placeholder="请输入团队名称" showCount maxLength={50} />
            </Form.Item>
            <OverrideTextArea name="desc" label="描述" />
          </Form>
        </div>
      </CustomFormModal>
    </div>
  );
};

export default SpaceSection;
