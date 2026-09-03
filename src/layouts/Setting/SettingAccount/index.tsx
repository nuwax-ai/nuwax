import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiGetUserDynamicCode, apiUserUpdate } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { UserUpdateParams } from '@/types/interfaces/login';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Tooltip } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 设置账号
 */
const SettingAccount: React.FC = () => {
  const [form] = Form.useForm();
  const { userInfo, setUserInfo } = useModel('userInfo');
  // 动态验证码相关状态
  const [dynamicCode, setDynamicCode] = useState<number | null>(null);
  const [expireTime, setExpireTime] = useState<Date | null>(null);
  const [userNameLoading, setUserNameLoading] = useState(false);
  const [nickNameLoading, setNickNameLoading] = useState(false);

  // 更新用户信息
  const { run } = useRequest(apiUserUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UserUpdateParams[]) => {
      message.success(dict('PC.Toast.Global.savedSuccessfully'));
      const _userInfo = cloneDeep(userInfo);
      if (params[0]?.avatar) {
        _userInfo.avatar = params[0].avatar;
      } else {
        _userInfo.userName = form.getFieldValue('userName');
        _userInfo.nickName = form.getFieldValue('nickName');
      }
      setUserInfo(_userInfo);
      localStorage.setItem(USER_INFO, JSON.stringify(_userInfo));
      setUserNameLoading(false);
      setNickNameLoading(false);
    },
    onError: () => {
      setUserNameLoading(false);
      setNickNameLoading(false);
    },
  });

  // 获取动态验证码
  const { run: runGetDynamicCode, loading: dynamicCodeLoading } = useRequest(
    apiGetUserDynamicCode,
    {
      manual: true,
      onSuccess: (code: number) => {
        setDynamicCode(code);
        // 设置过期时间：当前时间 + 5分钟
        const expireDate = new Date();
        expireDate.setMinutes(expireDate.getMinutes() + 5);
        setExpireTime(expireDate);
      },
    },
  );

  // 刷新验证码
  const handleRefreshCode = () => {
    runGetDynamicCode();
  };

  // 复制成功回调
  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  // 格式化过期时间
  const formatExpireTime = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    form.setFieldsValue({
      userName: userInfo?.userName,
      nickName: userInfo?.nickName,
    });
    // 初始化时获取动态验证码
    runGetDynamicCode();
  }, []);

  // 上传头像成功后更新头像
  const handleSuccessUpload = (url: string) => {
    if (url) {
      run({
        avatar: url,
      });
    }
  };

  const handleSaveUserName = async () => {
    try {
      const values = await form.validateFields(['userName']);
      setUserNameLoading(true);
      run({ userName: values.userName });
    } catch {
      // 表单校验失败时不发起请求
    }
  };

  const handleSaveNickName = async () => {
    const nickName = form.getFieldValue('nickName');
    setNickNameLoading(true);
    run({ nickName });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Pages.Setting.accountTitle')}</h3>
      <UploadAvatar
        imageUrl={userInfo?.avatar}
        className={cx(styles.avatar)}
        defaultImage={avatarImage as string}
        onUploadSuccess={handleSuccessUpload}
      />
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredNoStarMark}
      >
        <Form.Item label={dict('PC.Pages.Setting.userName')}>
          <Form.Item
            noStyle
            name="userName"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.Setting.inputUserName'),
              },
            ]}
          >
            <Input
              rootClassName={cx(styles.input)}
              placeholder={dict('PC.Pages.Setting.inputUserName')}
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button
              type="primary"
              loading={userNameLoading}
              onClick={handleSaveUserName}
            >
              {dict('PC.Common.Global.save')}
            </Button>
          </Form.Item>
        </Form.Item>
        <Form.Item label={dict('PC.Pages.Setting.nickName')}>
          <Form.Item noStyle name="nickName">
            <Input
              rootClassName={cx(styles.input)}
              placeholder={dict('PC.Pages.Setting.inputNickName')}
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button
              type="primary"
              loading={nickNameLoading}
              onClick={handleSaveNickName}
            >
              {dict('PC.Common.Global.save')}
            </Button>
          </Form.Item>
        </Form.Item>
      </Form>
      <h4 className={cx(styles.name)}>{dict('PC.Pages.Setting.phone')}</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.phone}
      </span>
      <h4 className={cx(styles.name)}>{dict('PC.Pages.Setting.email')}</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.email || dict('PC.Pages.Setting.bindPending')}
      </span>
      <h4 className={cx(styles.name)}>
        {dict('PC.Pages.Setting.dynamicCode')}
        {expireTime && (
          <span className={cx(styles.expireTime)}>
            ({dict('PC.Pages.Setting.expiresAt', formatExpireTime(expireTime))})
          </span>
        )}
      </h4>
      <div className={cx('flex', 'items-center')}>
        <span className={cx(styles.text)}>{dynamicCode || '--'}</span>
        <CopyToClipboard
          text={dynamicCode ? String(dynamicCode) : ''}
          onCopy={handleCopy}
        >
          <Tooltip title={dict('PC.Common.Global.copy')}>
            <Button
              size="small"
              type="link"
              icon={<CopyOutlined />}
              className={cx(styles.btn, styles['ml-4'])}
            />
          </Tooltip>
        </CopyToClipboard>
        <Tooltip title={dict('PC.Common.Global.refresh')}>
          <Button
            size="small"
            type="link"
            icon={<ReloadOutlined />}
            loading={dynamicCodeLoading}
            onClick={handleRefreshCode}
            className={cx(styles.btn)}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default SettingAccount;
