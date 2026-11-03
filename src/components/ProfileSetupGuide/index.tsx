import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiUserUpdate } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { UserUpdateParams } from '@/types/interfaces/login';
import { Button, Form, Input, Modal, message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 新用户「取昵称+设头像」引导弹框（L2，对齐 App 端 profileSetupPrompt）。
 *
 * 产品口径（App 端 2026-10-21 确认，PC 对齐）：
 * - 昵称、头像均可选，用户可随时关闭，不强制、无冷却；
 * - 「何时弹」由调用方用 needsProfileSetup 判定（仅登录完成后），本组件只负责弹框本体。
 */
const ProfileSetupGuide: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { userInfo, setUserInfo } = useModel('userInfo');

  // 保存昵称：与设置页同一接口；成功后同步 userInfo model 与本地缓存
  const { run: runUpdate, loading: saving } = useRequest(apiUserUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UserUpdateParams[]) => {
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      const _userInfo = cloneDeep(userInfo);
      if (params[0]?.avatar) {
        _userInfo.avatar = params[0].avatar;
      }
      if (params[0]?.nickName !== undefined) {
        _userInfo.nickName = params[0].nickName;
      }
      setUserInfo(_userInfo);
      localStorage.setItem(USER_INFO, JSON.stringify(_userInfo));
      onClose();
    },
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open]);

  // 上传头像成功后立即保存（同设置页行为），昵称留在表单里由「保存」提交
  const handleUploadSuccess = (url: string) => {
    if (url) {
      runUpdate({ avatar: url });
    }
  };

  const handleSave = async () => {
    const nickName = (form.getFieldValue('nickName') || '').trim();
    if (nickName) {
      runUpdate({ nickName });
    } else {
      // 两项均可选：不填昵称直接关闭，不强制
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={dict('PC.Components.ProfileSetupGuide.title')}
      footer={null}
      closable
      maskClosable
      onCancel={onClose}
      destroyOnClose
    >
      <p className={cx(styles.desc)}>
        {dict('PC.Components.ProfileSetupGuide.desc')}
      </p>
      <div className={cx(styles.avatarRow)}>
        <UploadAvatar
          imageUrl={userInfo?.avatar}
          onUploadSuccess={handleUploadSuccess}
          defaultImage={avatarImage as string}
        />
        <span className={cx(styles.avatarLabel)}>
          {dict('PC.Components.ProfileSetupGuide.avatar')}
        </span>
      </div>
      <Form form={form} layout="vertical">
        <Form.Item label={dict('PC.Pages.Setting.nickName')} name="nickName">
          <Input
            placeholder={dict('PC.Pages.Setting.inputNickName')}
            showCount
            maxLength={50}
            onPressEnter={handleSave}
          />
        </Form.Item>
      </Form>
      <div className={cx(styles.actions)}>
        <Button onClick={onClose}>
          {dict('PC.Components.ProfileSetupGuide.skip')}
        </Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          {dict('PC.Common.Global.save')}
        </Button>
      </div>
    </Modal>
  );
};

export default ProfileSetupGuide;
