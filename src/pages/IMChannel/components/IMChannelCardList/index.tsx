import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import CardWrapper from '@/components/business-component/CardWrapper';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  IM_PLATFORM_ICON_MAP,
  IM_PLATFORM_LABEL_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import {
  apiDeleteIMConfigChannel,
  apiIMConfigChannelList,
} from '@/services/imChannel';
import { IMChannelInfo, IMChannelTypeEnum } from '@/types/interfaces/imChannel';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface IMChannelCardListRef {
  reload: () => void;
}

export interface IMChannelCardListProps {
  onEdit: (info: IMChannelInfo) => void;
  onDeleteSuccess?: () => void;
  platform?: string;
  spaceId?: number;
  keyword?: string;
}

const IMChannelCardList = forwardRef<
  IMChannelCardListRef,
  IMChannelCardListProps
>(
  (
    { onEdit, onDeleteSuccess, platform = 'feishu', spaceId, keyword = '' },
    ref,
  ) => {
    const [loading, setLoading] = useState(false);
    const [allRobots, setAllRobots] = useState<IMChannelInfo[]>([]);
    // const [switchingIds, setSwitchingIds] = useState<number[]>([]);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const res = await apiIMConfigChannelList({
          channel: platform || '',
          spaceId,
        });
        if (res.code === SUCCESS_CODE) {
          const list = res.data || [];
          setAllRobots(list);
        }
      } catch (error) {
        console.error('Fetch IMChannel List Failed:', error);
      } finally {
        setLoading(false);
      }
    }, [platform, spaceId]);

    const filteredRobotList = useMemo(() => {
      if (!keyword) return allRobots;
      const lowerKeyword = keyword.toLowerCase();
      return allRobots.filter(
        (item) =>
          (item.agentName || '').toLowerCase().includes(lowerKeyword) ||
          (item.name || '').toLowerCase().includes(lowerKeyword),
      );
    }, [allRobots, keyword]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    useImperativeHandle(ref, () => ({
      reload: fetchData,
    }));

    // const handleToggleStatus = async (
    //   record: IMChannelInfo,
    //   checked: boolean,
    // ) => {
    //   setSwitchingIds((prev) => [...prev, record.id]);
    //   try {
    //     const res = await apiUpdateIMConfigChannelEnabled({
    //       id: record.id,
    //       enabled: checked,
    //     });
    //     if (res.code === SUCCESS_CODE) {
    //       message.success(`${checked ? '启用' : '停用'}成功`);
    //       // 更新本地数据
    //       setAllRobots((prev) =>
    //         prev.map((item) =>
    //           item.id === record.id ? { ...item, enabled: checked } : item,
    //         ),
    //       );
    //     }
    //   } catch (error) {
    //     console.error('Toggle status failed:', error);
    //   } finally {
    //     setSwitchingIds((prev) => prev.filter((id) => id !== record.id));
    //   }
    // };

    const handleDelete = (id: number, title: string) => {
      Modal.confirm({
        title,
        icon: <ExclamationCircleOutlined />,
        content: '删除后将无法恢复，请谨慎操作。',
        okText: '确认',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            const res = await apiDeleteIMConfigChannel(id);
            if (res.code === SUCCESS_CODE) {
              message.success('删除成功');
              setAllRobots((prev) => prev.filter((item) => item.id !== id));
              onDeleteSuccess?.();
            }
          } catch (error) {
            console.error('Delete IMChannel failed:', error);
          }
        },
      });
    };

    const renderCard = (record: IMChannelInfo) => {
      const platformIcon =
        IM_PLATFORM_ICON_MAP[record.channel as IMPlatformEnum] || '';

      const platformName =
        IM_PLATFORM_LABEL_MAP[record.channel as IMPlatformEnum] || '该';
      // const isEnabled = record.enabled;
      const isBot = record.targetType === IMChannelTypeEnum.Bot;
      const typeLabel = isBot ? '智能机器人' : '企业应用';

      return (
        <CardWrapper
          key={record.id}
          className={cx(styles.card)}
          title={record.agentName || '未绑定智能体'}
          name={record.name}
          content={record.agentDescription || ''}
          icon={record.agentIcon || platformIcon}
          defaultIcon="" // Logic in CardWrapper fallback
          extra={
            <div className={cx(styles.extra)}>
              <span className={cx(styles.time)}>
                最近编辑 {dayjs(record.modified).format('MM-DD HH:mm')}
              </span>
            </div>
          }
          footer={
            <div className={cx(styles.footer)}>
              <Tag
                color={isBot ? 'blue' : 'green'}
                style={{ marginLeft: 8, marginRight: 0 }}
              >
                {isBot ? '智能机器人' : '企业应用'}
              </Tag>

              {/* <Tooltip title={isEnabled ? '禁用' : '启用'}>
                <Switch
                  size="small"
                  checked={isEnabled}
                  loading={switchingIds.includes(record.id)}
                  onChange={(checked) => handleToggleStatus(record, checked)}
                />
              </Tooltip> */}
              <div className={cx(styles.actions)}>
                <Tooltip title="编辑">
                  <Button
                    className="action-btn edit-btn"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    className="action-btn delete-btn"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(
                        record.id,
                        `确认删除${platformName}${typeLabel}？`,
                      );
                    }}
                  />
                </Tooltip>
              </div>
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

    if (filteredRobotList.length === 0) {
      const isSearchEmpty = keyword && allRobots.length > 0;
      return (
        <div className={cx(styles.emptyWrapper)}>
          <AppDevEmptyState
            type="no-data"
            title={isSearchEmpty ? '未能找到匹配的结果' : '未能找到相关结果'}
            description={
              isSearchEmpty
                ? `未找到包含 “${keyword}” 的机器人或配置`
                : '当前平台下暂无机器人，请点击上方“新增机器人”按钮开始创建'
            }
          />
        </div>
      );
    }

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.list)}>
          {filteredRobotList.map(renderCard)}
        </div>
      </div>
    );
  },
);

export default IMChannelCardList;
