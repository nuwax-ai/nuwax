import Loading from '@/components/custom/Loading';
import { apiComponentList } from '@/services/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { Empty } from 'antd';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import ComponentItem from '../ComponentItem';
import styles from './index.less';

const cx = classNames.bind(styles);

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

  // 是否加载中
  const [loading, setLoading] = useState(false);
  // 技能列表
  const [skillList, setSkillList] = useState<ComponentInfo[]>([]);

  // 查询组件列表接口
  const { run: runComponent } = useRequest(apiComponentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ComponentInfo[]) => {
      //   handleFilterList(type, status, create, keyword, result);
      //   componentAllRef.current = result;
      console.log('result', result);
      setSkillList(result || []);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询技能列表
  useEffect(() => {
    if (spaceId) {
      //   setLoading(true);
      //   runComponent(spaceId);
    }
  }, [spaceId, runComponent]);

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
