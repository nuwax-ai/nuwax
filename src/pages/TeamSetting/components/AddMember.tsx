import personalImage from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import {
  apiAddSpaceMember,
  apiGetSpaceUserList,
  apiSearchUser,
} from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type {
  SearchUserInfo,
  SpaceUserInfo,
} from '@/types/interfaces/teamSetting';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Checkbox,
  Form,
  Input,
  List,
  message,
  Select,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

const cx = classNames.bind(styles);

export interface AddMemberProps {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  onConfirmAdd?: () => void;
}

const selectOptions = [
  { value: TeamStatusEnum.Admin, label: '管理员' },
  { value: TeamStatusEnum.User, label: '成员' },
];

const AddMember: React.FC<AddMemberProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirmAdd,
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

  const cancelModal = () => {
    onCancel();
  };

  // 查询成员列表信息
  const { run, data: spaceExistMembers } = useRequest(apiGetSpaceUserList, {
    manual: true,
  });

  // 增加团队成员
  const { run: runAdd } = useRequest(apiAddSpaceMember, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('添加成功');
      onConfirmAdd?.();
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

      // 遍历 data 数组，为 role 不存在的用户设置默认值
      const updatedData = data.map((m: SearchUserInfo) => {
        // 如果 role 不存在，则设置为默认值 TeamStatusEnum.User
        return { ...m, role: m.role ?? TeamStatusEnum.User };
      });

      // 保留一份搜索结果全数据
      setSearchedAllMembers(updatedData);
      // 排除 rightColumnMembers 和 spaceExistMembers 中的数据
      const newLeftColumnMembers = updatedData.filter((m: SearchUserInfo) => {
        return (
          !rightColumnMembers.some((r) => r.id === m.id) &&
          !spaceExistMembers?.some((f: SpaceUserInfo) => f.userId === m.id)
        );
      });
      setLeftColumnMembers(newLeftColumnMembers);
    },
  });

  const handlerSubmit = () => {
    if (rightColumnMembers.length === 0) {
      message.warning('请选择要添加的成员');
      return;
    }
    const params = rightColumnMembers.map((m) => ({
      spaceId,
      userId: m.id,
      role: m.role,
    }));
    runAdd(params);
  };

  const handleRoleChange = (id: number, role: TeamStatusEnum) => {
    // 创建一个新的 rightColumnMembers 数组，避免直接修改原对象
    const newRightColumnMembers = rightColumnMembers.map((m) => {
      if (m.id === id) {
        // 复制对象并更新角色
        return { ...m, role };
      }
      return m;
    });
    setRightColumnMembers(newRightColumnMembers);
  };
  const handleRemoveMember = (id: number) => {
    // 从 rightColumnMembers 中移除指定 userId 的成员
    const newRightColumnMembers = rightColumnMembers.filter((m) => m.id !== id);
    setRightColumnMembers(newRightColumnMembers);
    // 从 searchedAllMembers 中找到要添加到 leftColumnMembers 的成员
    const removedMember = searchedAllMembers.find((m) => m.id === id);
    if (removedMember) {
      // 复制对象以避免修改 spaceExistMembers
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
    run({ spaceId });
  }, [spaceId, open]);

  return (
    <CustomFormModal
      form={form}
      title="添加新成员"
      classNames={{
        content: cx(styles['add-member-modal-content']),
      }}
      open={open}
      onCancel={cancelModal}
      onConfirm={handlerSubmit}
    >
      <div style={{ display: 'flex', gap: 20 }}>
        <div className={cx(styles['add-member-left-column'])}>
          <Input
            placeholder="搜索成员"
            prefix={<SearchOutlined />}
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
                <Avatar src={m.avatar || personalImage} /> {m.userName}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>

        <div style={{ width: '300px' }}>
          <h3 style={{ marginBottom: 15 }}>
            已选成员 ({rightColumnMembers.length})
          </h3>
          <List
            dataSource={rightColumnMembers}
            renderItem={(m) => (
              <List.Item style={{ borderBlockEnd: 0 }}>
                <Avatar src={m.avatar || personalImage} /> {m.userName}
                <Select
                  value={m.role}
                  onChange={(value) => handleRoleChange(m.id, value)}
                  style={{ width: 100, marginLeft: 10 }}
                  options={selectOptions}
                />
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

export default AddMember;
