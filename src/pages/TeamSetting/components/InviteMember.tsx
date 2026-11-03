import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateSpaceInvite,
  apiDisableSpaceInvite,
  apiGetSpaceInviteQr,
  apiListSpaceInvites,
} from '@/services/spaceInvite';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type {
  SpaceInvite,
  SpaceInviteRole,
} from '@/types/interfaces/spaceInvite';
import { copyTextToClipboard } from '@/utils/clipboard';
import { getSpaceInviteStatus } from '@/utils/spaceInvite';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import styles from './InviteMember.less';

const t = (key: string) => dict(`PC.Pages.SpaceInvite.${key}`);
const expiryText = (expire: string | null) =>
  expire ? dayjs(expire).format('YYYY-MM-DD HH:mm') : t('never');
const roleText = (role: SpaceInviteRole) =>
  dict(
    role === TeamStatusEnum.Admin
      ? 'PC.Pages.TeamSetting.roleAdmin'
      : 'PC.Pages.TeamSetting.roleMember',
  );

function InvitePreview({ invite }: { invite: SpaceInvite }) {
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    setQrUrl('');
    setError('');
    apiGetSpaceInviteQr(invite.inviteUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setQrUrl(objectUrl);
      })
      .catch((reason) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : t('qrFailed'));
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invite.inviteUrl, revision]);

  return (
    <Space
      direction="vertical"
      style={{ width: '100%', textAlign: 'center' }}
      size="middle"
    >
      <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
        {error ? (
          <Alert
            type="error"
            message={error}
            action={
              <Button onClick={() => setRevision((value) => value + 1)}>
                {t('retry')}
              </Button>
            }
          />
        ) : qrUrl ? (
          <Image src={qrUrl} alt={t('qrAlt')} width={240} preview={false} />
        ) : (
          <Spin />
        )}
      </div>
      <Typography.Text type="secondary">{t('scanHint')}</Typography.Text>
      <Typography.Text>
        {roleText(invite.role)} · {expiryText(invite.expire)}
      </Typography.Text>
      <Input aria-label={t('link')} readOnly value={invite.inviteUrl} />
      <Space wrap>
        <Button
          onClick={() => {
            void copyTextToClipboard(invite.inviteUrl, undefined, true).catch(
              () => message.error(t('copyFailed')),
            );
          }}
        >
          {t('copyLink')}
        </Button>
        <Button
          href={qrUrl || undefined}
          download={`team-invite-${invite.id}.png`}
          disabled={!qrUrl}
        >
          {t('saveQr')}
        </Button>
      </Space>
    </Space>
  );
}

interface InviteFormValues {
  role: SpaceInviteRole;
  validity: '1' | '7' | '30' | 'custom' | 'never';
  expire?: Dayjs;
}

export default function InviteMember({
  spaceId,
  open,
  onCancel,
}: {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
}) {
  const [form] = Form.useForm<InviteFormValues>();
  const validity = Form.useWatch('validity', form);
  const [tab, setTab] = useState('create');
  const [invites, setInvites] = useState<SpaceInvite[]>([]);
  const [selected, setSelected] = useState<SpaceInvite>();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [disabling, setDisabling] = useState<number>();
  const [listError, setListError] = useState(false);
  const generation = useRef(0);
  const listVersion = useRef(0);
  const createLock = useRef(false);
  const disableLock = useRef(false);

  const loadInvites = async (currentGeneration = generation.current) => {
    const currentListVersion = ++listVersion.current;
    setLoading(true);
    setListError(false);
    try {
      const result = await apiListSpaceInvites(spaceId);
      if (
        currentGeneration !== generation.current ||
        currentListVersion !== listVersion.current
      )
        return;
      if (result.code === SUCCESS_CODE) setInvites(result.data || []);
      else setListError(true);
    } catch {
      if (
        currentGeneration === generation.current &&
        currentListVersion === listVersion.current
      )
        setListError(true);
    } finally {
      if (
        currentGeneration === generation.current &&
        currentListVersion === listVersion.current
      )
        setLoading(false);
    }
  };

  useEffect(() => {
    const currentGeneration = ++generation.current;
    setInvites([]);
    setSelected(undefined);
    setCreating(false);
    setDisabling(undefined);
    createLock.current = false;
    disableLock.current = false;
    setTab('create');
    if (open) {
      form.resetFields();
      void loadInvites(currentGeneration);
    }
    return () => {
      generation.current++;
    };
  }, [open, spaceId]);

  const createInvite = async (values: InviteFormValues) => {
    if (createLock.current) return;
    createLock.current = true;
    setCreating(true);
    const currentGeneration = generation.current;
    try {
      const expire =
        values.validity === 'never'
          ? undefined
          : values.validity === 'custom'
          ? values.expire?.toISOString()
          : dayjs().add(Number(values.validity), 'day').toISOString();
      if (
        values.validity !== 'never' &&
        (!expire || Date.parse(expire) <= Date.now())
      ) {
        message.warning(t('futureRequired'));
        return;
      }
      const result = await apiCreateSpaceInvite({
        spaceId,
        role: values.role,
        ...(expire ? { expire } : {}),
      });
      if (
        currentGeneration !== generation.current ||
        result.code !== SUCCESS_CODE
      )
        return;
      listVersion.current++;
      setLoading(false);
      setSelected(result.data);
      setInvites((previous) => [
        result.data,
        ...previous.filter((item) => item.id !== result.data.id),
      ]);
    } catch {
      // 请求层已经提示；保留表单，允许重试。
    } finally {
      if (currentGeneration === generation.current) {
        createLock.current = false;
        setCreating(false);
      }
    }
  };

  const disableInvite = async (inviteId: number) => {
    if (disableLock.current) return;
    disableLock.current = true;
    setDisabling(inviteId);
    const currentGeneration = generation.current;
    try {
      const result = await apiDisableSpaceInvite(inviteId);
      if (
        currentGeneration !== generation.current ||
        result.code !== SUCCESS_CODE
      )
        return;
      listVersion.current++;
      setLoading(false);
      setInvites((previous) =>
        previous.map((item) =>
          item.id === inviteId ? { ...item, status: 'Disabled' } : item,
        ),
      );
      setSelected((previous) =>
        previous?.id === inviteId ? undefined : previous,
      );
      message.success(t('disabledSuccess'));
    } catch {
      // 请求层已经提示，失败时不修改原邀请状态。
    } finally {
      if (currentGeneration === generation.current) {
        disableLock.current = false;
        setDisabling(undefined);
      }
    }
  };

  return (
    <Modal
      title={t('manageTitle')}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={760}
      centered
      destroyOnHidden
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'create',
            label: t('createTab'),
            children: (
              <div className={selected ? styles.layout : undefined}>
                <Form
                  form={form}
                  disabled={creating}
                  layout="vertical"
                  initialValues={{ role: TeamStatusEnum.User, validity: '7' }}
                  onFinish={(values) => {
                    void createInvite(values);
                  }}
                  onValuesChange={() => setSelected(undefined)}
                >
                  <Form.Item
                    label={t('role')}
                    name="role"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={(
                        [TeamStatusEnum.User, TeamStatusEnum.Admin] as const
                      ).map((role) => ({ value: role, label: roleText(role) }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('validity')}
                    name="validity"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={['1', '7', '30', 'custom', 'never'].map(
                        (value) => ({
                          value,
                          label: ['1', '7', '30'].includes(value)
                            ? dict('PC.Pages.SpaceInvite.days', value)
                            : t(value),
                        }),
                      )}
                    />
                  </Form.Item>
                  {validity === 'custom' && (
                    <Form.Item
                      label={t('expire')}
                      name="expire"
                      rules={[
                        { required: true, message: t('futureRequired') },
                        {
                          validator: (_, value: Dayjs | undefined) =>
                            !value || value.valueOf() > Date.now()
                              ? Promise.resolve()
                              : Promise.reject(new Error(t('futureRequired'))),
                        },
                      ]}
                    >
                      <DatePicker
                        showTime
                        style={{ width: '100%' }}
                        disabledDate={(value) =>
                          value.isBefore(dayjs().startOf('day'))
                        }
                      />
                    </Form.Item>
                  )}
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={creating}>
                      {t('generate')}
                    </Button>
                  </Form.Item>
                </Form>
                {selected && getSpaceInviteStatus(selected) === 'Active' && (
                  <InvitePreview invite={selected} />
                )}
              </div>
            ),
          },
          {
            key: 'history',
            label: t('historyTab'),
            disabled: creating,
            children: (
              <>
                {listError && (
                  <Alert
                    type="error"
                    message={t('listFailed')}
                    action={
                      <Button
                        onClick={() => {
                          void loadInvites();
                        }}
                      >
                        {t('retry')}
                      </Button>
                    }
                  />
                )}
                <Table<SpaceInvite>
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={invites}
                  scroll={{ x: 620 }}
                  pagination={{ pageSize: 5 }}
                  columns={[
                    { title: t('role'), dataIndex: 'role', render: roleText },
                    {
                      title: t('expire'),
                      dataIndex: 'expire',
                      render: expiryText,
                    },
                    {
                      title: t('status'),
                      render: (_, record) => {
                        const status = getSpaceInviteStatus(record);
                        return (
                          <Tag
                            color={status === 'Active' ? 'green' : 'default'}
                          >
                            {t(status)}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: t('action'),
                      render: (_, record) =>
                        getSpaceInviteStatus(record) === 'Active' && (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                form.setFieldsValue({
                                  role: record.role,
                                  validity: record.expire ? 'custom' : 'never',
                                  expire: record.expire
                                    ? dayjs(record.expire)
                                    : undefined,
                                });
                                setSelected(record);
                                setTab('create');
                              }}
                            >
                              {t('viewQr')}
                            </Button>
                            <Popconfirm
                              title={t('disableConfirm')}
                              onConfirm={() => disableInvite(record.id)}
                            >
                              <Button
                                type="link"
                                danger
                                loading={disabling === record.id}
                                disabled={disabling !== undefined}
                              >
                                {t('disable')}
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
