import personalImage from '@/assets/images/personal.png';
import CustomFormModal from '@/components/CustomFormModal';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { apiSearchUser } from '@/services/teamSetting';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import { Page } from '@/types/interfaces/request';
import type { SearchUserInfo } from '@/types/interfaces/teamSetting';
import { CloseOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  List,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
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
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  // 控制 InfiniteScrollDiv 的渲染时机
  const [isScrollReady, setIsScrollReady] = useState<boolean>(false);
  // 滚动容器引用
  const rightListScrollRef = useRef<HTMLDivElement>(null);

  // 查询角色已绑定的用户列表 或 查询组已绑定的用户列表
  const apiBindedUserList =
    type === 'role' ? apiGetRoleBoundUserList : apiGetGroupUserList;

  // 角色绑定用户（全量覆盖）或 组绑定用户（全量覆盖）
  const apiBindUser = type === 'role' ? apiRoleBindUser : apiGroupBindUser;

  const targetIdKey = type === 'role' ? 'roleId' : 'groupId';

  // 查询角色已绑定的用户或用户组已绑定的用户列表
  const { run } = useRequest(apiBindedUserList, {
    manual: true,
    onSuccess: (data: Page<UserInfo>, params: any[]) => {
      setLoading(false);
      const pageNo = params?.[0]?.pageNo || 1;
      if (data?.records?.length) {
        const bindUserInfos = data.records.map((m: UserInfo) => ({
          id: m.userId,
          userName: m.userName,
          nickName: m.nickName,
          avatar: m.avatar,
        }));
        // 如果是第一页，直接设置；否则追加数据
        if (pageNo === 1) {
          setRightColumnMembers(bindUserInfos);
        } else {
          setRightColumnMembers((prev) => [...prev, ...bindUserInfos]);
        }
        // 判断是否还有更多数据
        const totalPages = data.pages || 0;
        setHasMore(pageNo < totalPages);
      } else {
        // 没有数据时，如果是第一页则清空列表，否则保持原列表
        if (pageNo === 1) {
          setRightColumnMembers([]);
        }
        setHasMore(false);
      }
    },
    onError: () => {
      setLoading(false);
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
      // 当 type 为 role 时，还需要过滤掉不是 admin 的用户
      const newLeftColumnMembers = data.filter((m: SearchUserInfo) => {
        // 排除已选中的用户
        if (rightColumnMembers.some((r) => r.id === m.id)) {
          return false;
        }
        // 当 type 为 role 时，只保留 admin 用户
        if (type === 'role') {
          return m.role === TeamStatusEnum.Admin;
        }
        // 其他情况保留所有用户
        return true;
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

  // 加载已绑定用户列表
  const loadBindedUsers = (pageNo: number = 1, append: boolean = false) => {
    if (loading && !append) return; // 首次加载时如果正在加载则返回
    setLoading(true);
    setCurrentPage(pageNo);
    run({
      pageNo,
      pageSize: 15,
      queryFilter: {
        [targetIdKey]: targetId,
        userName: '',
      },
    });
  };

  useEffect(() => {
    if (open) {
      // 分页查询已绑定的用户列表
      loadBindedUsers();
    } else {
      setLeftCheckedMembers([]);
      setRightColumnMembers([]);
      setLeftColumnMembers([]);
      setSearchedAllMembers([]);
      setCurrentPage(1);
      setHasMore(true);
      setLoading(false);
    }
  }, [targetId, open, targetIdKey]);

  // 滚动加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      loadBindedUsers(nextPage, true);
    }
  };

  // 确保滚动容器在 Modal 打开后正确初始化
  useEffect(() => {
    if (open && rightListScrollRef.current) {
      // 延迟一下，确保 DOM 已经渲染完成
      const timer = setTimeout(() => {
        const scrollElement = rightListScrollRef.current;
        if (scrollElement) {
          // 确保滚动容器已经存在且有高度后，再渲染 InfiniteScrollDiv
          if (scrollElement.offsetHeight > 0) {
            setIsScrollReady(true);
          }
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        setIsScrollReady(false);
      };
    } else {
      setIsScrollReady(false);
    }
  }, [open, rightColumnMembers.length]);

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
      <div className={cx(styles.contentWrapper)}>
        <div className={cx(styles['add-member-left-column'], 'flex-1')}>
          <Input.Search
            placeholder="输入用户名、邮箱或手机号码，回车搜索"
            allowClear
            onSearch={(value) => {
              handleInputChange(value);
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

        <div className={cx('flex-1', styles.rightColumn)}>
          <h3 style={{ marginBottom: 15 }}>
            已选成员 ({rightColumnMembers.length})
          </h3>
          <div
            ref={rightListScrollRef}
            id="right-member-list-scroll"
            className={cx(styles.rightListScroll)}
          >
            {loading && rightColumnMembers.length === 0 ? (
              // 首次加载时显示 Loading
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'h-full',
                )}
              >
                <Loading />
              </div>
            ) : !loading && rightColumnMembers.length === 0 ? (
              // 没有数据时显示 Empty，垂直居中
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'h-full',
                )}
              >
                <Empty description="暂无数据" />
              </div>
            ) : open && isScrollReady ? (
              // 滚动加载时使用 InfiniteScrollDiv，它会自动显示底部的加载动画
              <InfiniteScrollDiv
                key={`infinite-scroll-${targetId}-${open}`}
                scrollableTarget="right-member-list-scroll"
                list={rightColumnMembers}
                hasMore={hasMore}
                onScroll={handleLoadMore}
              >
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
              </InfiniteScrollDiv>
            ) : (
              // 未准备好时显示普通列表
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
            )}
          </div>
        </div>
      </div>
    </CustomFormModal>
  );
};

export default BindUser;
