import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiGetUserDynamicCode, apiUserUpdate } from '@/services/account';
import type {
  SetUserAccountInfo,
  UserUpdateParams,
} from '@/types/interfaces/login';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
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

  // 更新用户信息
  const { run, loading } = useRequest(apiUserUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UserUpdateParams[]) => {
      message.success('保存成功');
      const _userInfo = cloneDeep(userInfo);
      if (params[0]?.avatar) {
        _userInfo.avatar = params[0].avatar;
      } else {
        _userInfo.userName = form.getFieldValue('userName');
        _userInfo.nickName = form.getFieldValue('nickName');
      }
      setUserInfo(_userInfo);
      localStorage.setItem(USER_INFO, JSON.stringify(_userInfo));
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
    message.success('复制成功');
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

  const onSaveUsername: FormProps<SetUserAccountInfo>['onFinish'] = (
    values,
  ) => {
    run(values);
  };

  return (
    <div className={cx(styles.container)}>
      <h3>账号</h3>
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
        onFinish={onSaveUsername}
      >
        <Form.Item label="用户名">
          <Form.Item
            noStyle
            name="userName"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              rootClassName={cx(styles.input)}
              placeholder="请输入用户名"
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button type="primary" loading={loading} htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form.Item>
        <Form.Item label="用户昵称">
          <Form.Item noStyle name="nickName">
            <Input
              rootClassName={cx(styles.input)}
              placeholder="请输入用户昵称"
              showCount
              maxLength={50}
            />
          </Form.Item>
          <Form.Item noStyle>
            <Button type="primary" loading={loading} htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form.Item>
      </Form>
      <h4 className={cx(styles.name)}>手机号码</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.phone}
      </span>
      <h4 className={cx(styles.name)}>邮箱地址</h4>
      <span className={cx(styles.text, styles['mb-30'])}>
        {userInfo?.email || '待绑定'}
      </span>
      <h4 className={cx(styles.name)}>
        动态认证码
        {expireTime && (
          <span className={cx(styles.expireTime)}>
            （{formatExpireTime(expireTime)} 过期）
          </span>
        )}
      </h4>
      <div className={cx('flex', 'items-center')}>
        <span className={cx(styles.text)}>{dynamicCode || '--'}</span>
        <CopyToClipboard
          text={dynamicCode ? String(dynamicCode) : ''}
          onCopy={handleCopy}
        >
          <Tooltip title="复制">
            <Button
              size="small"
              type="link"
              icon={<CopyOutlined />}
              className={cx(styles.btn, styles['ml-4'])}
            />
          </Tooltip>
        </CopyToClipboard>
        <Tooltip title="刷新">
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
