import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiSearchUsageUsers } from '@/services/systemManage';
import { positiveInt64Id } from '@/utils/int64Id';
import { Button, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.less';

export interface UsageUser {
  value: string;
  label: string;
}

interface UserSearchResult {
  keyword: string;
  pageNo: number;
  users: UsageUser[];
  total: number;
  loading: boolean;
  failed: boolean;
}

const PAGE_SIZE = 20;

export default function UserUsageSelect({
  value,
  onChange,
}: {
  value?: UsageUser;
  onChange: (user?: UsageUser) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<UserSearchResult>();
  const current = result?.keyword === keyword ? result : undefined;
  const loading =
    !!keyword && (!current || current.loading || current.pageNo !== pageNo);

  useEffect(() => {
    if (!keyword) {
      setResult(undefined);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setResult((previous) => ({
      keyword,
      pageNo,
      users: pageNo > 1 && previous?.keyword === keyword ? previous.users : [],
      total: previous?.keyword === keyword ? previous.total : 0,
      loading: true,
      failed: false,
    }));
    const timer = setTimeout(
      () => {
        // 与用户管理页使用同一筛选：用户名/昵称模糊匹配，完整手机号精确匹配。
        void apiSearchUsageUsers(
          { pageNo, pageSize: PAGE_SIZE, queryFilter: { userName: keyword } },
          { signal: controller.signal, skipErrorHandler: true },
        )
          .then((response) => {
            if (cancelled) return;
            if (
              response.code !== SUCCESS_CODE ||
              !Array.isArray(response.data?.records) ||
              !Number.isSafeInteger(response.data.total) ||
              response.data.total < 0
            ) {
              throw new Error('User search failed');
            }
            const users = response.data.records.flatMap((user) => {
              const id = positiveInt64Id(user.id);
              if (!id) return [];
              const name = user.nickName || user.userName || id;
              return [
                {
                  value: id,
                  label:
                    user.userName && user.userName !== name
                      ? `${name} (${user.userName})`
                      : name,
                },
              ];
            });
            setResult((previous) => ({
              keyword,
              pageNo,
              users: Array.from(
                new Map(
                  [...(pageNo > 1 ? previous?.users ?? [] : []), ...users].map(
                    (user) => [user.value, user],
                  ),
                ).values(),
              ),
              total: response.data.total,
              loading: false,
              failed: false,
            }));
            // 唯一命中按服务端总数判断，不能把当前页仅一条误当作唯一用户。
            if (response.data.total === 1 && users.length === 1) {
              setKeyword('');
              setPageNo(1);
              setOpen(false);
              onChange(users[0]);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setResult((previous) => ({
                keyword,
                pageNo,
                users: pageNo > 1 ? previous?.users ?? [] : [],
                total: previous?.total ?? 0,
                loading: false,
                failed: true,
              }));
            }
          });
      },
      pageNo === 1 ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [keyword, pageNo, retry, onChange]);

  return (
    <Select<UsageUser>
      className={styles['user-input']}
      aria-label={dict('PC.Pages.ModelMonitor.user')}
      placeholder={dict('PC.Pages.ModelMonitor.userSearchPlaceholder')}
      showSearch
      allowClear
      labelInValue
      filterOption={false}
      value={value}
      searchValue={keyword}
      open={open}
      onOpenChange={setOpen}
      options={current?.users ?? []}
      loading={loading}
      onSearch={(text) => {
        setKeyword(text.trim());
        setPageNo(1);
        if (value) onChange(undefined);
      }}
      onChange={(user) => {
        setKeyword('');
        setPageNo(1);
        setOpen(false);
        onChange(user);
      }}
      optionRender={(option) => (
        <>
          <div>{option.label}</div>
          <div className={styles['user-id']}>ID: {option.value}</div>
        </>
      )}
      notFoundContent={
        loading ? (
          <Spin size="small" />
        ) : (
          dict(
            current?.failed
              ? 'PC.Pages.ModelMonitor.userSearchFailed'
              : keyword
              ? 'PC.Pages.ModelMonitor.noMatchingUser'
              : 'PC.Pages.ModelMonitor.userSearchPlaceholder',
          )
        )
      }
      popupRender={(menu) => (
        <>
          {menu}
          {current?.failed ? (
            <>
              {current.users.length > 0 && (
                <div role="alert">
                  {dict('PC.Pages.ModelMonitor.userSearchFailed')}
                </div>
              )}
              <Button
                type="link"
                block
                onClick={() => setRetry((attempt) => attempt + 1)}
              >
                {dict('PC.Pages.ModelMonitor.retry')}
              </Button>
            </>
          ) : (
            pageNo * PAGE_SIZE < (current?.total ?? 0) && (
              <Button
                type="link"
                block
                loading={loading}
                onClick={() => setPageNo((page) => page + 1)}
              >
                {dict('PC.Pages.ModelMonitor.loadMoreUsers')}
              </Button>
            )
          )}
        </>
      )}
    />
  );
}
