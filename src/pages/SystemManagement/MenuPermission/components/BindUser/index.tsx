import personalImage from '@/assets/images/personal.png';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
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
  Input,
  List,
  message,
  Modal,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiAddRoleUser,
  apiGetRoleBoundUserList,
  apiRemoveRoleUser,
} from '../../services/role-manage';
import {
  apiAddUserGroupUser,
  apiGetGroupUserList,
  apiRemoveUserGroupUser,
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
}

/**
 * 角色/用户组绑定用户弹窗
 * @param targetId 角色ID或用户组ID
 * @param name 角色/用户组名称
 * @param type 绑定类型：角色/用户组
 * @param open 是否打开
 * @param onCancel 取消回调
 */
const BindUser: React.FC<BindUserProps> = ({
  targetId,
  name,
  type = 'role',
  open,
  onCancel,
}) => {
  // 左侧：当前可选择的单个成员（后端只返回一个用户）
  const [leftMember, setLeftMember] = useState<SearchUserInfo | null>(null);
  const [leftChecked, setLeftChecked] = useState<boolean>(false);

  // 右侧：已选成员列表（后端分页返回）
  const [rightColumnMembers, setRightColumnMembers] = useState<
    SearchUserInfo[]
  >([]);

  // 左侧搜索结果全集（用于从右侧移除时回填到左侧）
  const [searchedAllMembers, setSearchedAllMembers] = useState<
    SearchUserInfo[]
  >([]);

  // 右侧已选成员搜索关键字（通过后端接口按 userName 搜索）
  const [rightSearchKeyword, setRightSearchKeyword] = useState<string>('');

  // 分页相关状态（右侧已选成员列表）
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // 是否处于“滚动加载更多”的加载中状态（用于控制底部 loading 的展示）
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // 控制 InfiniteScrollDiv 的渲染时机
  const [isScrollReady, setIsScrollReady] = useState<boolean>(false);

  // 右侧滚动容器引用
  const rightListScrollRef = useRef<HTMLDivElement>(null);

  // 查询角色已绑定的用户列表 或 查询组已绑定的用户列表
  const apiBindedUserList =
    type === 'role' ? apiGetRoleBoundUserList : apiGetGroupUserList;

  // 角色绑定用户（全量覆盖）或 组绑定用户（全量覆盖）
  // const apiBindUser = type === 'role' ? apiRoleBindUser : apiGroupBindUser;

  const targetIdKey = type === 'role' ? 'roleId' : 'groupId';

  // 角色添加用户或用户组添加用户
  const apiAddUser = type === 'role' ? apiAddRoleUser : apiAddUserGroupUser;

  // 角色移除用户或用户组移除用户
  const apiRemoveUser =
    type === 'role' ? apiRemoveRoleUser : apiRemoveUserGroupUser;

  // 查询角色已绑定的用户或用户组已绑定的用户列表（支持分页与关键字 userName）
  const { run } = useRequest(apiBindedUserList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: Page<UserInfo>, params: any[]) => {
      setLoading(false);
      // 接口返回后，无论是首屏还是滚动加载，都结束“加载更多”状态
      setIsLoadingMore(false);
      const pageNo = params?.[0]?.pageNo || 1;

      if (data?.records?.length) {
        const bindUserInfos: SearchUserInfo[] = data.records.map(
          (m: UserInfo) => ({
            id: m.userId,
            userName: m.userName,
            nickName: m.nickName,
            avatar: m.avatar,
          }),
        );

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
      // 接口异常时也结束“加载更多”状态，防止底部 loading 一直显示
      setIsLoadingMore(false);
    },
  });

  // 角色绑定用户（全量覆盖）或 组绑定用户（全量覆盖）
  // const { run: runBindUser } = useRequest(apiBindUser, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: () => {
  //     message.success('添加成功');
  //     onConfirmBindUser?.();
  //   },
  // });

  // 根据关键字搜索左侧用户信息
  const { run: runSearch } = useRequest(apiSearchUser, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: SearchUserInfo[]) => {
      if (!data?.length) {
        message.warning('未搜索到相关用户');
        setLeftMember(null);
        return;
      }

      // 保留一份搜索结果全数据
      setSearchedAllMembers(data);

      // 后端目前只返回一个用户，这里取第一个并做必要的过滤
      const candidate = data[0];
      if (!candidate) {
        setLeftMember(null);
        return;
      }

      // 排除已在右侧列表中的用户
      if (rightColumnMembers.some((r) => r.id === candidate.id)) {
        setLeftMember(null);
        return;
      }

      // 当 type 为 role 时，只保留 admin 用户
      if (type === 'role' && candidate.role !== TeamStatusEnum.Admin) {
        setLeftMember(null);
        return;
      }

      setLeftMember(candidate);
      setLeftChecked(false);
    },
  });

  /**
   * 确认绑定
   * 将右侧已选成员的 id 列表提交给后端
   */
  // const handlerSubmit = () => {
  //   const idKey = type === 'role' ? 'roleId' : 'groupId';
  //   const params = {
  //     [idKey]: targetId,
  //     userIds: rightColumnMembers?.map((m) => m.id) || [],
  //   };
  //   runBindUser(params);
  // };

  /**
   * 加载右侧“已绑定成员”列表
   * @param pageNo 页码，从 1 开始
   * @param append 是否追加到已有数据之后
   * @param kw 用户名关键字（userName）
   * @param pageSize 每页数量，默认 15；删除后可传入更大的值以保持展示数量
   */
  const loadBindedUsers = (
    pageNo: number = 1,
    append: boolean = false,
    kw?: string,
    pageSize: number = 15,
  ) => {
    if (loading && !append) return;
    setLoading(true);
    setCurrentPage(pageNo);

    run({
      pageNo,
      pageSize,
      queryFilter: {
        [targetIdKey]: targetId,
        ...(kw ? { userName: kw } : {}),
      },
    });
  };

  /**
   * 从右侧已选列表移除成员
   * 如果该成员存在于左侧搜索结果全集中，则回填到左侧可选列表
   */
  const handleRemoveMember = async (id: number) => {
    // 删除前当前已选成员数量（删除后希望依旧展示这么多条，如果有的话）
    const prevCount = rightColumnMembers.length;

    // 先调用后端接口移除用户
    const params: any = {
      [targetIdKey]: targetId,
      userId: id,
    };

    const res = await apiRemoveUser(params);
    if (!res || res.code !== SUCCESS_CODE) {
      return;
    }

    // 后端删除成功后，重新加载右侧“已绑定成员”列表
    // 目标：尽量保持删除前的展示数量（prevCount），避免只加载第一页 15 条
    const pageSizeForReload = Math.max(prevCount, 15);

    // 强制重新从第一页开始加载，覆盖现有列表
    loadBindedUsers(1, false, rightSearchKeyword, pageSizeForReload);

    // 同时，如果该成员在搜索结果中存在，则可以回填到左侧
    const removedMember = searchedAllMembers.find((m) => m.id === id);
    if (removedMember) {
      // 复制对象以避免修改
      const copiedMember = { ...removedMember };
      // 将复制后的成员设置为左侧当前可选成员
      setLeftMember(copiedMember);
      setLeftChecked(false);
    }
  };

  /**
   * 左侧单个用户勾选变更
   * 将选中的成员移动到右侧（先调用后端添加用户接口）
   */
  const handleSingleCheckChange = async (checked: boolean) => {
    if (!checked || !leftMember) {
      setLeftChecked(false);
      return;
    }

    setLeftChecked(true);

    const params: any = {
      [targetIdKey]: targetId,
      userId: leftMember.id,
    };

    try {
      const res = await apiAddUser(params);

      if (!res || res.code !== SUCCESS_CODE) {
        setLeftChecked(false);
        return;
      }

      // 添加成功后，将该成员从左侧移到右侧
      setRightColumnMembers([...rightColumnMembers, leftMember]);
      setLeftMember(null);
    } catch (error) {
      setLeftChecked(false);
    } finally {
      // 勾选完成后，取消勾选状态
      setLeftChecked(false);
    }
  };

  /**
   * 左侧搜索输入（用户搜索）
   */
  const handleLeftSearch = (value: string) => {
    runSearch({
      kw: value || undefined,
    });
  };

  /**
   * 右侧搜索输入（通过关键字搜索已绑定用户，走后端接口 userName 字段）
   * 每次关键字搜索从第一页开始，并支持后续滚动加载更多
   */
  const handleRightSearch = (value: string) => {
    const kw = value?.trim() || '';
    setRightSearchKeyword(kw);
    // 每次搜索从第一页开始
    loadBindedUsers(1, false, kw);
  };

  /**
   * 弹窗打开/关闭时重置状态
   */
  useEffect(() => {
    if (open) {
      // 初次打开时加载第一页已绑定用户（不带关键字）
      loadBindedUsers(1, false);
    } else {
      setLeftChecked(false);
      setLeftMember(null);
      setRightColumnMembers([]);
      setSearchedAllMembers([]);
      setRightSearchKeyword('');
      setCurrentPage(1);
      setHasMore(true);
      setLoading(false);
    }
  }, [open]);

  /**
   * 右侧滚动加载更多（保持当前搜索关键字）
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      // 仅在真正触发“加载更多”时，才展示底部 loading
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      loadBindedUsers(nextPage, true, rightSearchKeyword);
    }
  };

  /**
   * 确保滚动容器在 Modal 打开后正确初始化
   */
  useEffect(() => {
    if (open && rightListScrollRef.current) {
      // 延迟一下，确保 DOM 已经渲染完成
      const timer = setTimeout(() => {
        const scrollElement = rightListScrollRef.current;
        // 确保滚动容器有高度
        if (scrollElement && scrollElement.offsetHeight > 0) {
          setIsScrollReady(true);
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

  /**
   * 渲染右侧已选成员列表（复用 List 渲染逻辑）
   */
  const renderRightMemberList = () => (
    <List
      dataSource={rightColumnMembers}
      renderItem={(m) => (
        <List.Item
          style={{ borderBlockEnd: 0, padding: 0 }}
          className="flex items-center gap-10 mb-12"
        >
          <Avatar src={m.avatar || personalImage} />
          <div className="flex-1 text-ellipsis">{m.nickName || m.userName}</div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => handleRemoveMember(m.id)}
          />
        </List.Item>
      )}
    />
  );

  return (
    <Modal
      title={`绑定用户 - ${name}`}
      open={open}
      classNames={{
        content: cx(styles['add-member-modal-content']),
        body: cx(styles['add-member-modal-body']),
      }}
      destroyOnHidden
      onCancel={onCancel}
      footer={
        <Button type="primary" onClick={onCancel}>
          关闭
        </Button>
      }
    >
      <div className={cx(styles.contentWrapper)}>
        {/* 左侧：搜索并选择成员 */}
        <div className={cx(styles['add-member-left-column'], 'flex-1')}>
          <Input.Search
            placeholder="输入用户名、邮箱或手机号码，回车搜索"
            allowClear
            onSearch={handleLeftSearch}
          />
          {leftMember && (
            <Checkbox
              className={cx(styles['member-checkbox-group'])}
              checked={leftChecked}
              onChange={(e) => handleSingleCheckChange(e.target.checked)}
            >
              <Avatar src={leftMember.avatar || personalImage} />{' '}
              {leftMember.nickName || leftMember.userName}
            </Checkbox>
          )}
        </div>

        {/* 右侧：已选成员列表，支持关键字后端搜索 + 滚动加载更多 */}
        <div className={cx('flex-1', styles.rightColumn)}>
          <Input.Search
            placeholder="通过关键字搜索已绑定成员"
            allowClear
            value={rightSearchKeyword}
            onChange={(e) => setRightSearchKeyword(e.target.value)}
            onSearch={handleRightSearch}
            className={cx(styles['mb-15'])}
          />

          <h3 className={cx(styles['mb-15'])}>
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
                showLoader={isLoadingMore}
                onScroll={handleLoadMore}
              >
                {renderRightMemberList()}
              </InfiniteScrollDiv>
            ) : (
              // 未准备好时显示普通列表
              renderRightMemberList()
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BindUser;
