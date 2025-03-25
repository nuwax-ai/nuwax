import avatarImage from '@/assets/images/avatar.png';
import UploadAvatar from '@/components/UploadAvatar';
import { USER_INFO } from '@/constants/home.constants';
import { apiUserUpdate } from '@/services/account';
import type { SetUserAccountInfo } from '@/types/interfaces/login';
import { customizeRequiredNoStarMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Button, Form, Input, message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 设置账号
 */
const SettingAccount: React.FC = () => {
  const [form] = Form.useForm();
  const { userInfo, setUserInfo } = useModel('userInfo');

  // 更新用户信息
  const { run, loading } = useRequest(apiUserUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
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

  useEffect(() => {
    form.setFieldValue('userName', userInfo?.userName);
    form.setFieldValue('nickName', userInfo?.nickName);
  }, []);

  // 上传头像成功后更新头像
  const handleSuccessUpload = (url: string) => {
    console.log(url, 'url');
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
      <span className={cx(styles.text, styles.phone)}>{userInfo?.phone}</span>
      <h4 className={cx(styles.name)}>邮箱地址</h4>
      <span className={cx(styles.text)}>{userInfo?.email || '待绑定'}</span>
    </div>
  );
};

export default SettingAccount;
