import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiUserUpdate } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { UserUpdateParams } from '@/types/interfaces/login';
import { useRequest } from 'ahooks';
import { Button, Form, Input, Modal, message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useRef } from 'react';
import { useModel } from 'umi';
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

  const identity = `${userInfo?.tenantId ?? ''}:${
    userInfo?.id ?? userInfo?.userName ?? ''
  }`;
  const view = useRef({ open, identity, revision: 0 });
  if (view.current.open !== open || view.current.identity !== identity) {
    view.current = { open, identity, revision: view.current.revision + 1 };
  }
  const viewRevision = view.current.revision;
  const latestIdentity = useRef(identity);
  latestIdentity.current = identity;
  const latestUser = useRef(userInfo);
  latestUser.current = userInfo;
  const epoch = useRef(0);
  const mounted = useRef(false);
  const pending = useRef(false);
  const { runAsync, loading: saving } = useRequest(apiUserUpdate, {
    manual: true,
  });

  useEffect(() => {
    mounted.current = true;
    if (open) form.resetFields();
    return () => {
      mounted.current = false;
      epoch.current += 1;
    };
  }, [open, identity]);

  const save = async (params: UserUpdateParams, closeAfterSave: boolean) => {
    if (
      pending.current ||
      !mounted.current ||
      !open ||
      !latestUser.current ||
      identity !== latestIdentity.current
    )
      return;
    pending.current = true;
    const requestEpoch = epoch.current;
    try {
      await runAsync(params);
      // 关闭重开或换账号后，旧请求不能覆盖当前资料或关闭新弹框。
      if (requestEpoch !== epoch.current || identity !== latestIdentity.current)
        return;
      const updated = { ...cloneDeep(latestUser.current), ...params };
      setUserInfo(updated);
      localStorage.setItem(USER_INFO, JSON.stringify(updated));
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      if (closeAfterSave) onClose();
    } catch {
      // 请求层已提示，保留表单供重试。
    } finally {
      pending.current = false;
    }
  };

  // 头像即时保存，继续保留昵称草稿，用户点「保存」后才结束引导。
  const handleUploadSuccess = (url: string) => {
    // 上传组件的迟到回调须属于仍打开的同一轮引导。
    if (
      url &&
      mounted.current &&
      view.current.open &&
      viewRevision === view.current.revision
    ) {
      void save({ avatar: url }, false);
    }
  };

  const handleSave = () => {
    const nickName = (form.getFieldValue('nickName') || '').trim();
    if (nickName) void save({ nickName }, true);
    else if (!pending.current) onClose();
  };

  return (
    <Modal
      open={open}
      title={dict('PC.Components.ProfileSetupGuide.title')}
      footer={null}
      closable
      maskClosable
      onCancel={onClose}
      destroyOnHidden
    >
      <p className={cx(styles.desc)}>
        {dict('PC.Components.ProfileSetupGuide.desc')}
      </p>
      <div className={cx(styles.avatarRow)}>
        <UploadAvatar
          key={`${identity}:${viewRevision}`}
          className={styles.avatar}
          editIconPlacement="bottomRight"
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
