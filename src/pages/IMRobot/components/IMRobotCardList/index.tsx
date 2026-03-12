import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import CardWrapper from '@/components/business-component/CardWrapper';
import { ActionItem, TableActions } from '@/components/ProComponents';
import { ICON_SUCCESS } from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  IMRobotInfo,
  IMRobotStatusEnum,
  IMRobotTypeEnum,
} from '@/types/interfaces/imRobot';
import { message, Space, Switch } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// TODO: 暂时使用模拟数据，后续对接正式接口
const MOCK_DATA: IMRobotInfo[] = [
  {
    id: 1,
    spaceId: 1,
    name: '企业微信客服机器人',
    type: IMRobotTypeEnum.WeChatBot,
    status: IMRobotStatusEnum.Enabled,
    targetType: AgentComponentTypeEnum.Agent,
    targetId: 101,
    targetName: '智能客服助理',
    targetIcon: '',
    config: {
      webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx',
    },
    created: '2024-03-11 10:00:00',
    modified: '2024-03-11 15:30:00',
  },
  {
    id: 2,
    spaceId: 1,
    name: '运维告警通知',
    type: IMRobotTypeEnum.WeChatApp,
    status: IMRobotStatusEnum.Disabled,
    targetType: AgentComponentTypeEnum.Agent,
    targetId: 102,
    targetName: '运维告警助手',
    targetIcon: '',
    config: { agentId: '1000001', secret: 'xxx' },
    created: '2024-03-10 09:00:00',
    modified: '2024-03-10 11:00:00',
  },
];

export interface IMRobotCardListRef {
  reload: () => void;
}

export interface IMRobotCardListProps {
  spaceId: number;
  onEdit: (info: IMRobotInfo) => void;
  platform?: string;
}

const IMRobotCardList = forwardRef<IMRobotCardListRef, IMRobotCardListProps>(
  ({ spaceId, onEdit, platform = 'all' }, ref) => {
    const [loading, setLoading] = useState(false);
    const [robotList, setRobotList] = useState<IMRobotInfo[]>([]);
    const [allRobots, setAllRobots] = useState<IMRobotInfo[]>([]);
    const filterAndSetList = (
      syncList: IMRobotInfo[],
      currentPlatform: string,
    ) => {
      let filtered = syncList;
      if (currentPlatform !== 'all') {
        if (currentPlatform === 'wechat') {
          filtered = filtered.filter(
            (item) =>
              item.type === IMRobotTypeEnum.WeChatBot ||
              item.type === IMRobotTypeEnum.WeChatApp,
          );
        } else if (currentPlatform === 'dingtalk') {
          filtered = []; // TODO: DingTalk filtering
        } else if (currentPlatform === 'lark') {
          filtered = []; // TODO: Lark filtering
        }
      }
      setRobotList(filtered);
    };

    const fetchData = useCallback(async () => {
      if (!spaceId) return;
      setLoading(true);

      // 模拟接口请求
      setTimeout(() => {
        setAllRobots(MOCK_DATA);
        filterAndSetList(MOCK_DATA, platform);
        setLoading(false);
      }, 500);

      /* 待接口实现后恢复
      try {
        const res = await apiIMRobotList(spaceId);
        if (res.code === SUCCESS_CODE) {
          const list = res.data || [];
          setAllRobots(list);
          filterAndSetList(list, platform);
        }
      } finally {
        setLoading(false);
      }
      */
    }, [spaceId, platform]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    useImperativeHandle(ref, () => ({
      reload: fetchData,
    }));

    const handleToggleStatus = async (
      record: IMRobotInfo,
      checked: boolean,
    ) => {
      const newStatus = checked
        ? IMRobotStatusEnum.Enabled
        : IMRobotStatusEnum.Disabled;

      // 模拟操作
      message.loading('处理中...', 0.5);
      setTimeout(() => {
        message.success(`${checked ? '启用' : '停用'}成功`);
        // 更新本地数据
        const newList = allRobots.map((item) =>
          item.id === record.id ? { ...item, status: newStatus } : item,
        );
        setAllRobots(newList);
        filterAndSetList(newList, platform);
      }, 600);

      /* 待接口实现后恢复
      const res = await apiIMRobotToggleStatus(record.id, newStatus);
      if (res.code === SUCCESS_CODE) {
        message.success(`${checked ? '启用' : '停用'}成功`);
        fetchData();
      }
      */
    };

    const handleDelete = async (id: number) => {
      // 模拟操作
      message.loading('删除中...', 0.5);
      setTimeout(() => {
        message.success('删除成功');
        const newList = allRobots.filter((item) => item.id !== id);
        setAllRobots(newList);
        filterAndSetList(newList, platform);
      }, 600);

      /* 待接口实现后恢复
      const res = await apiDeleteIMRobot(id);
      if (res.code === SUCCESS_CODE) {
        message.success('删除成功');
        fetchData();
      }
      */
    };

    const renderCard = (record: IMRobotInfo) => {
      const actions: ActionItem<IMRobotInfo>[] = [
        {
          key: 'edit',
          label: '编辑',
          onClick: () => onEdit(record),
        },
        {
          key: 'delete',
          label: '删除',
          confirm: { title: '确认删除该机器人？' },
          onClick: () => handleDelete(record.id),
        },
      ];

      const typeText =
        record.type === IMRobotTypeEnum.WeChatBot ? '微信机器人' : '企业应用';
      const isEnabled = record.status === IMRobotStatusEnum.Enabled;

      return (
        <CardWrapper
          key={record.id}
          className={cx(styles.card)}
          title={record.name}
          avatar={record.targetIcon || ''}
          name={record.targetName || '未绑定智能体'}
          content={`机器人类型：${typeText}`}
          icon="" // Logic in CardWrapper fallback
          defaultIcon="" // Logic in CardWrapper fallback
          extra={
            <div className={cx(styles.extra)}>
              <span className={cx(styles.time)}>
                最近编辑 {dayjs(record.modified).format('MM-DD HH:mm')}
              </span>
              <span
                className={cx(
                  styles.status,
                  isEnabled ? styles.enabled : styles.disabled,
                )}
              >
                {isEnabled ? (
                  <>
                    <ICON_SUCCESS />
                    已启用
                  </>
                ) : (
                  '已停用'
                )}
              </span>
            </div>
          }
          footer={
            <div className={cx(styles.footer)}>
              <div className={cx(styles.typeTag)}>{typeText}</div>
              <Space size={16}>
                <Switch
                  size="small"
                  checked={isEnabled}
                  onChange={(checked) => handleToggleStatus(record, checked)}
                />
                <TableActions record={record} actions={actions} />
              </Space>
            </div>
          }
        />
      );
    };

    const renderSkeleton = () => {
      return (
        <div className={cx(styles.container)}>
          <div className={cx(styles.list)}>
            {[...Array(4)].map((_, index) => (
              <CardWrapper
                key={`skeleton-${index}`}
                className={cx(styles.card)}
                loading={true}
                title=""
                avatar=""
                name=""
                content=""
                icon=""
                defaultIcon=""
              />
            ))}
          </div>
        </div>
      );
    };

    if (loading) {
      return renderSkeleton();
    }

    if (robotList.length === 0) {
      return (
        <div className={cx(styles.emptyWrapper)}>
          <AppDevEmptyState
            type="no-data"
            title="未能找到相关结果"
            description="当前平台下暂无机器人，请点击上方“新增机器人”按钮开始创建"
          />
        </div>
      );
    }

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.list)}>{robotList.map(renderCard)}</div>
      </div>
    );
  },
);

export default IMRobotCardList;
