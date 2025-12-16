import Loading from '@/components/custom/Loading';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { apiTaskList } from '@/services/library';
import { ComponentTypeEnum, CreateListEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { TaskInfo } from '@/types/interfaces/library';
import { debounce } from '@/utils/debounce';
import { Empty } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useModel, useParams, useRequest } from 'umi';
import ComponentItem from '../ComponentItem';
import styles from './index.less';
const cx = classNames.bind(styles);

// 查询参数
export type IQuery = 'type' | 'create' | 'status' | 'keyword';

// 暴露给父组件的方法
export interface MainContentRef {
  // 查询任务列表
  exposeQueryTaskList: () => void;
}

export interface MainContentProps {
  // 点击任务
  onClickItem?: (info: TaskInfo) => void;
  // 点击更多
  onClickMore?: (item: CustomPopoverItem, info: TaskInfo) => void;
}
export interface MainContentCardProps {
  // 加载中
  loading: boolean;
  // 任务列表
  taskList: TaskInfo[];
  // 点击任务
  onClickItem?: (info: TaskInfo) => void;
  // 点击更多
  onClickMore?: (item: CustomPopoverItem, info: TaskInfo) => void;
}

const MainContentCard: React.FC<MainContentCardProps> = ({
  loading,
  taskList,
  onClickItem = () => {},
  onClickMore = () => {},
}) => {
  // 加载中
  if (loading) {
    return <Loading />;
  }

  // 没有技能列表
  if (taskList?.length === 0) {
    return (
      <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
        <Empty description="未能找到相关结果" />
      </div>
    );
  }

  // 任务列表
  return (
    <div
      className={cx(
        styles['main-container'],
        'flex-1',
        'scroll-container-hide',
      )}
    >
      {taskList?.map((info) => (
        <ComponentItem
          key={info.id}
          taskInfo={info}
          onClick={() => onClickItem(info)}
          onClickMore={(item) => onClickMore(item, info)}
        />
      ))}
    </div>
  );
};

const MainContent = forwardRef<MainContentRef, MainContentProps>(
  ({ onClickItem = () => {}, onClickMore = () => {} }, ref) => {
    const params = useParams();
    const spaceId = Number(params.spaceId);
    const { searchParams } = useSearchParamsCustom<IQuery>();
    // 类型
    const [type, setType] = useState<ComponentTypeEnum>(
      searchParams.get('type') || ComponentTypeEnum.All_Type,
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
    // 任务列表
    const [taskList, setTaskList] = useState<TaskInfo[]>([]);
    // 所有任务列表
    const taskListAllRef = useRef<TaskInfo[]>([]);

    // 获取用户信息
    const { userInfo } = useModel('userInfo');

    // 过滤筛选任务列表数据
    const handleFilterTaskList = (
      filterType: ComponentTypeEnum,
      filterCreate: CreateListEnum,
      filterKeyword: string,
      list = taskListAllRef.current,
    ) => {
      if (list.length === 0) {
        return;
      }

      let _list = list;
      if (filterType !== ComponentTypeEnum.All_Type) {
        _list = _list.filter((item) => item.targetType === filterType);
      }

      if (filterCreate === CreateListEnum.Me) {
        _list = _list.filter((item) => item.creator.userId === userInfo.id);
      }

      if (filterKeyword) {
        _list = _list.filter((item) => item.taskName.includes(filterKeyword));
      }
      setTaskList(_list);
    };
    // 防抖过滤
    const debounceFilterTaskList = debounce(handleFilterTaskList, 100);

    // 查询任务列表接口
    const { run: runTaskList } = useRequest(apiTaskList, {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: TaskInfo[]) => {
        setLoading(false);
        taskListAllRef.current = result as unknown as TaskInfo[];
        debounceFilterTaskList(type, create, keyword, result);
      },
      onError: () => {
        setLoading(false);
      },
    });

    // 暴露查询任务列表接口
    const exposeQueryTaskList = () => {
      if (!spaceId) {
        return;
      }
      setLoading(true);
      runTaskList(spaceId);
    };

    // 查询技能列表
    useEffect(() => {
      exposeQueryTaskList();
    }, [spaceId]);

    // 监听 URL 改变（支持浏览器前进/后退）
    useEffect(() => {
      const _type =
        (searchParams.get('targetType') as ComponentTypeEnum) ||
        ComponentTypeEnum.All_Type;
      const _create =
        (Number(searchParams.get('create')) as CreateListEnum) ||
        CreateListEnum.All_Person;
      const _keyword = searchParams.get('keyword') || '';

      setType(_type);
      setCreate(_create);
      setKeyword(_keyword);

      // 使用最新的参数过滤，避免依赖旧的 state
      debounceFilterTaskList(_type, _create, _keyword);
    }, [searchParams]);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      exposeQueryTaskList,
    }));

    return (
      <>
        <MainContentCard
          loading={loading}
          taskList={taskList}
          onClickItem={onClickItem}
          onClickMore={onClickMore}
        />
      </>
    );
  },
);

export default MainContent;
