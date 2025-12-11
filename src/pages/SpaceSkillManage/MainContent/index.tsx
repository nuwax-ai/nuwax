import Loading from '@/components/custom/Loading';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { apiComponentList } from '@/services/library';
import { PublishStatusEnum } from '@/types/enums/common';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { debounce } from '@/utils/debounce';
import { Empty } from 'antd';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { useModel, useParams, useRequest } from 'umi';
import ComponentItem from '../ComponentItem';
import styles from './index.less';
const cx = classNames.bind(styles);

type IQuery = 'type' | 'create' | 'status' | 'keyword';

interface MainContentProps {
  onClickItem?: (info: ComponentInfo) => void;
  onClickMore?: (item: CustomPopoverItem, info: ComponentInfo) => void;
}
interface MainContentCardProps {
  loading: boolean;
  skillList: ComponentInfo[];
  onClickItem?: (info: ComponentInfo) => void;
  onClickMore?: (item: CustomPopoverItem, info: ComponentInfo) => void;
}

const MainContentCard: React.FC<MainContentCardProps> = ({
  loading,
  skillList,
  onClickItem = () => {},
  onClickMore = () => {},
}) => {
  // 加载中
  if (loading) {
    return <Loading />;
  }

  // 没有技能列表
  if (skillList?.length === 0) {
    return (
      <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
        <Empty description="未能找到相关结果" />
      </div>
    );
  }

  // 技能列表
  return (
    <div
      className={cx(
        styles['main-container'],
        'flex-1',
        'scroll-container-hide',
      )}
    >
      {skillList?.map((info) => (
        <ComponentItem
          key={`${info.id}${info.type}`}
          componentInfo={info}
          onClick={() => onClickItem(info)}
          onClickMore={(item) => onClickMore(item, info)}
        />
      ))}
    </div>
  );
};

const MainContent: React.FC<MainContentProps> = ({
  onClickItem = () => {},
  onClickMore = () => {},
}) => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { searchParams } = useSearchParamsCustom<IQuery>();
  // 类型
  const [type, setType] = useState<ComponentTypeEnum>(
    searchParams.get('type') || ComponentTypeEnum.All_Type,
  );
  // 过滤状态
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
  );
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>(
    searchParams.get('keyword') || '',
  );

  // 是否加载中
  const [loading, setLoading] = useState(false);
  // 技能列表
  const [skillList, setSkillList] = useState<ComponentInfo[]>([]);
  // 所有技能列表
  const skillListAllRef = useRef<ComponentInfo[]>([]);
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterType: ComponentTypeEnum,
    filterStatus: FilterStatusEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = skillListAllRef.current,
  ) => {
    if (list.length === 0) {
      return;
    }

    let _list = list;
    if (filterType !== ComponentTypeEnum.All_Type) {
      _list = _list.filter((item) => item.type === filterType);
    }
    if (filterStatus === FilterStatusEnum.Published) {
      _list = _list.filter(
        (item) => item.publishStatus === PublishStatusEnum.Published,
      );
    }
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo?.id);
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setSkillList(_list);
  };
  // 防抖过滤
  const debounceFilterList = debounce(handleFilterList, 100);

  // 查询组件列表接口
  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      setLoading(false);
      skillListAllRef.current = result;
      debounceFilterList(type, status, create, keyword, result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询技能列表
  useEffect(() => {
    if (spaceId) {
      setLoading(true);
      runComponent(spaceId);
    }
  }, [spaceId, runComponent]);

  // 监听 URL 改变（支持浏览器前进/后退）
  useEffect(() => {
    const _type =
      (searchParams.get('type') as ComponentTypeEnum) ||
      ComponentTypeEnum.All_Type;
    const _status =
      (Number(searchParams.get('status')) as FilterStatusEnum) ||
      FilterStatusEnum.All;
    const _create =
      (Number(searchParams.get('create')) as CreateListEnum) ||
      CreateListEnum.All_Person;
    const _keyword = searchParams.get('keyword') || '';

    setType(_type);
    setStatus(_status);
    setCreate(_create);
    setKeyword(_keyword);

    // 使用最新的参数过滤，避免依赖旧的 state
    debounceFilterList(_type, _status, _create, _keyword);
  }, [searchParams]);

  return (
    <>
      <MainContentCard
        loading={loading}
        skillList={skillList}
        onClickItem={onClickItem}
        onClickMore={onClickMore}
      />
    </>
  );
};

export default MainContent;
