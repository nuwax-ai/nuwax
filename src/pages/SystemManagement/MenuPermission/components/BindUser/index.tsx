import personalImage from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import { apiSearchUser } from '@/services/teamSetting';
import type { SearchUserInfo } from '@/types/interfaces/teamSetting';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, Form, Input, List, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetRoleBoundUserList,
  apiRoleBindUser,
} from '../../services/role-manage';
import {
  apiGetGroupUserList,
  apiGroupBindUser,
} from '../../services/user-group-manage';
import { UserInfo } from '../../types/role-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface BindUserProps {
  targetId: number;
  name: string;
  type?: 'role' | 'userGroup';
  open: boolean;
  onCancel: () => void;
  onConfirmBindUser?: () => void;
}

/**
 * 角色绑定用户
 * @param targetId 角色ID
 * @param open 是否打开
 * @param onCancel 取消回调
 * @param onConfirmBindUser 确认回调
 * @returns
 */
const BindUser: React.FC<BindUserProps> = ({
  targetId,
  name,
  type = 'role',
  open,
  onCancel,
  onConfirmBindUser,
}) => {
  const [form] = Form.useForm();
  const [leftColumnMembers, setLeftColumnMembers] = useState<SearchUserInfo[]>(
    [],
  );
  const [leftCheckedMembers, setLeftCheckedMembers] = useState<number[]>([]);
  const [rightColumnMembers, setRightColumnMembers] = useState<
    SearchUserInfo[]
  >([]);
  const [searchedAllMembers, setSearchedAllMembers] = useState<
    SearchUserInfo[]
  >([]);

  // 查询角色已绑定的用户列表 或 查询组已绑定的用户列表
  const apiBindedUserList =
    type === 'role' ? apiGetRoleBoundUserList : apiGetGroupUserList;

  // 角色绑定用户（全量覆盖）或 组绑定用户（全量覆盖）
  const apiBindUser = type === 'role' ? apiRoleBindUser : apiGroupBindUser;

  // 查询角色已绑定的用户或用户组已绑定的用户列表
  const { run } = useRequest(apiBindedUserList, {
    manual: true,
    onSuccess: (data: UserInfo[]) => {
      if (data?.length) {
        const bindUserInfos = data.map((m) => ({
          id: m.userId,
          userName: m.userName,
          nickName: m.nickName,
          avatar: m.avatar,
        }));
        setRightColumnMembers(bindUserInfos);
      }
    },
  });

  // 角色绑定用户（全量覆盖）或 组绑定用户（全量覆盖）
  const { run: runBindUser } = useRequest(apiBindUser, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('添加成功');
      onConfirmBindUser?.();
    },
  });

  // 根据关键字搜索用户信息
  const { run: runSearch } = useRequest(apiSearchUser, {
    manual: true,
    debounceWait: 300,
    onSuccess: (data: SearchUserInfo[]) => {
      if (!data?.length) {
        message.warning('未搜索到相关用户');
        setLeftColumnMembers([]);
        return;
      }

      // 保留一份搜索结果全数据
      setSearchedAllMembers(data);
      // 排除 rightColumnMembers 中的数据
      const newLeftColumnMembers = data.filter((m: SearchUserInfo) => {
        return !rightColumnMembers.some((r) => r.id === m.id);
      });
      setLeftColumnMembers(newLeftColumnMembers);
    },
  });

  const handlerSubmit = () => {
    // 根据类型设置 id 字段名称
    const id = type === 'role' ? 'roleId' : 'groupId';
    const params = {
      [id]: targetId,
      userIds: rightColumnMembers?.map((m) => m.id) || [],
    };
    runBindUser(params);
  };

  const handleRemoveMember = (id: number) => {
    // 从 rightColumnMembers 中移除指定 userId 的成员
    const newRightColumnMembers = rightColumnMembers.filter((m) => m.id !== id);
    setRightColumnMembers(newRightColumnMembers);
    // 从 searchedAllMembers 中找到要添加到 leftColumnMembers 的成员
    const removedMember = searchedAllMembers.find((m) => m.id === id);
    if (removedMember) {
      // 复制对象以避免修改
      const copiedMember = { ...removedMember };
      // 将复制后的成员添加到 leftColumnMembers
      setLeftColumnMembers((prev) => [...prev, copiedMember]);
    }
  };
  const handleCheckAllChange = (e: any) => {
    if (e.target.checked) {
      // 将 leftColumnMembers 全部添加到 rightColumnMembers 中
      setRightColumnMembers([...rightColumnMembers, ...leftColumnMembers]);
      // 清空 leftColumnMembers
      setLeftColumnMembers([]);
      // 清空 leftCheckedMembers，将全部的 checkbox 设置为不勾选
      setLeftCheckedMembers([]);
    }
  };

  const handleCheckChange = (checkedValues: number[]) => {
    const newCheckedMembers = leftColumnMembers.filter((m) =>
      checkedValues.includes(m.id),
    );
    setRightColumnMembers([...rightColumnMembers, ...newCheckedMembers]);

    const newLeftColumnMembers = leftColumnMembers.filter(
      (m) => !checkedValues.includes(m.id),
    );
    setLeftColumnMembers(newLeftColumnMembers);
  };

  const handleInputChange = (value: string) => {
    runSearch({
      kw: value || undefined,
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setLeftCheckedMembers([]);
    setRightColumnMembers([]);
    setLeftColumnMembers([]);
    setSearchedAllMembers([]);
    // 查询角色已绑定的用户
    run(targetId);
  }, [targetId, open]);

  return (
    <CustomFormModal
      form={form}
      title={`绑定用户 - ${name}`}
      classNames={{
        content: cx(styles['add-member-modal-content']),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div style={{ display: 'flex', gap: 20 }}>
        <div className={cx(styles['add-member-left-column'], 'flex-1')}>
          <Input
            placeholder="输入用户名、邮箱或手机号码，回车搜索"
            prefix={<SearchOutlined />}
            allowClear
            onPressEnter={(event) => {
              if (event.key === 'Enter') {
                handleInputChange(
                  (event.currentTarget as HTMLInputElement).value,
                );
              }
            }}
          />
          <Checkbox
            onChange={handleCheckAllChange}
            style={{ marginTop: 20 }}
            checked={
              leftCheckedMembers.length === leftColumnMembers.length &&
              leftColumnMembers.length > 0
            }
          >
            全部
          </Checkbox>
          <Checkbox.Group
            style={{ display: 'block', marginTop: 10 }}
            onChange={handleCheckChange}
            value={leftCheckedMembers}
          >
            {leftColumnMembers.map((m) => (
              <Checkbox key={m.id} value={m.id} className={'flex mb-12'}>
                <Avatar src={m.avatar || personalImage} />{' '}
                {m.nickName || m.userName}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>

        <div className="flex-1">
          <h3 style={{ marginBottom: 15 }}>
            已选成员 ({rightColumnMembers.length})
          </h3>
          <List
            dataSource={rightColumnMembers}
            renderItem={(m) => (
              <List.Item
                style={{ borderBlockEnd: 0, padding: 0 }}
                className="flex items-center gap-10 mb-12"
              >
                <Avatar src={m.avatar || personalImage} />
                <div className="flex-1 text-ellipsis">
                  {m.nickName || m.userName}
                </div>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveMember(m.id)}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </CustomFormModal>
  );
};

export default BindUser;
