import teamImage from '@/assets/images/team_image.png';
import {
  REDIRECT_LOGIN,
  SUCCESS_CODE,
  USER_NO_LOGIN,
} from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetSpaceInviteInfo,
  apiJoinSpaceInvite,
} from '@/services/spaceInvite';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { RequestResponse } from '@/types/interfaces/request';
import type { SpaceInviteInfo } from '@/types/interfaces/spaceInvite';
import {
  getSpaceInviteConversationPath,
  getSpaceInviteStatus,
} from '@/utils/spaceInvite';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Result,
  Space,
  Spin,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const t = (key: string) => dict(`PC.Pages.SpaceInvite.${key}`);

// 旧环境的 IM 整页入口会补尾斜杠并丢失 query；站内导航把完整目标交给 IM 宿主。
const openTeamChat = (spaceId: number | string) => {
  history.replace(getSpaceInviteConversationPath(spaceId));
};

export default function SpaceInvitePage() {
  const { code = '' } = useParams();
  const returnPath = `/invite/space/${encodeURIComponent(code)}`;
  const [info, setInfo] = useState<SpaceInviteInfo>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinedNow, setJoinedNow] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const joinLock = useRef(false);
  const autoStarted = useRef(false);

  const redirectIfUnauthenticated = useCallback(
    (result: { code?: string; response?: { status?: number } }) => {
      if (
        result.code === USER_NO_LOGIN ||
        result.code === REDIRECT_LOGIN ||
        result.response?.status === 401
      ) {
        history.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return true;
      }
      return false;
    },
    [returnPath],
  );

  useEffect(() => {
    const currentGeneration = ++generation.current;
    joinLock.current = false;
    autoStarted.current = false;
    setLoading(true);
    setInfo(undefined);
    setError('');
    setJoining(false);
    setJoinedNow(false);
    apiGetSpaceInviteInfo(code)
      .then((result) => {
        if (
          currentGeneration !== generation.current ||
          redirectIfUnauthenticated(result)
        )
          return;
        if (result.code === SUCCESS_CODE && result.data) setInfo(result.data);
        else setError(result.message || t('loadFailed'));
      })
      .catch((reason) => {
        if (
          currentGeneration === generation.current &&
          !redirectIfUnauthenticated(reason || {})
        )
          setError(t('loadFailed'));
      })
      .finally(() => {
        if (currentGeneration === generation.current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [code, revision, redirectIfUnauthenticated]);

  const join = useCallback(async () => {
    if (joinLock.current || !info || info.joined) return;
    if (getSpaceInviteStatus(info) !== 'Active') {
      setInfo({ ...info, status: getSpaceInviteStatus(info) });
      return;
    }
    joinLock.current = true;
    setJoining(true);
    setError('');
    const currentGeneration = generation.current;
    try {
      const result: RequestResponse<null> = await apiJoinSpaceInvite(code);
      if (
        currentGeneration !== generation.current ||
        redirectIfUnauthenticated(result)
      )
        return;
      if (result.code !== SUCCESS_CODE) {
        setError(result.message || t('joinFailed'));
        // 以最新详情同步“已加入/过期/作废”，避免停留在旧的可加入状态。
        const refreshed = await apiGetSpaceInviteInfo(code);
        if (
          currentGeneration === generation.current &&
          !redirectIfUnauthenticated(refreshed) &&
          refreshed.code === SUCCESS_CODE
        )
          setInfo(refreshed.data);
        return;
      }
      setInfo({ ...info, joined: true });
      setJoinedNow(true);
      if (currentGeneration === generation.current) openTeamChat(info.spaceId!);
    } catch (reason) {
      if (
        currentGeneration === generation.current &&
        !redirectIfUnauthenticated(reason || {})
      )
        setError(t('joinFailed'));
    } finally {
      if (currentGeneration === generation.current) {
        joinLock.current = false;
        setJoining(false);
      }
    }
  }, [code, info, redirectIfUnauthenticated]);

  const openApp = () => {
    if (info?.spaceId) openTeamChat(info.spaceId);
  };

  useEffect(() => {
    if (
      loading ||
      !info ||
      !info.spaceId ||
      getSpaceInviteStatus(info) !== 'Active' ||
      autoStarted.current
    )
      return;
    autoStarted.current = true;
    if (info.joined) openTeamChat(info.spaceId);
    else void join();
  }, [loading, info, join]);

  const status = info && getSpaceInviteStatus(info);
  return (
    <main className={styles.container}>
      <Card className={styles.card}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : !info ? (
          <Result
            status="warning"
            title={error || t('loadFailed')}
            extra={
              <Button onClick={() => setRevision((value) => value + 1)}>
                {t('retry')}
              </Button>
            }
          />
        ) : status !== 'Active' ? (
          <Result
            status="warning"
            title={t(status === 'Expired' ? 'expiredTitle' : 'disabledTitle')}
            subTitle={t('askForNew')}
          />
        ) : info.joined ? (
          <Result
            status="success"
            title={t(joinedNow ? 'joinedSuccess' : 'alreadyJoined')}
            subTitle={info.spaceName}
            extra={
              <Button type="primary" onClick={openApp}>
                {t('openApp')}
              </Button>
            }
          />
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className={styles.heading}>
              <Avatar size={72} src={info.spaceIcon || teamImage} />
              <Typography.Title level={3}>{info.spaceName}</Typography.Title>
              <Typography.Text type="secondary">
                {t('joinHint')}
              </Typography.Text>
            </div>
            <Descriptions
              column={1}
              size="small"
              items={[
                ...(info.inviterName
                  ? [
                      {
                        key: 'inviter',
                        label: t('inviter'),
                        children: info.inviterName,
                      },
                    ]
                  : []),
                {
                  key: 'role',
                  label: t('role'),
                  children: dict(
                    info.role === TeamStatusEnum.Admin
                      ? 'PC.Pages.TeamSetting.roleAdmin'
                      : 'PC.Pages.TeamSetting.roleMember',
                  ),
                },
                {
                  key: 'expire',
                  label: t('expire'),
                  children: info.expire
                    ? dayjs(info.expire).format('YYYY-MM-DD HH:mm')
                    : t('never'),
                },
              ]}
            />
            {error && <Alert type="error" message={error} />}
            <Button
              type="primary"
              size="large"
              block
              loading={joining}
              onClick={() => {
                void join();
              }}
            >
              {t('join')}
            </Button>
          </Space>
        )}
      </Card>
    </main>
  );
}
