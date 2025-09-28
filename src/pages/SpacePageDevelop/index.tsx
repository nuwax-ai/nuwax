import ButtonToggle from '@/components/ButtonToggle';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
import CustomPopover from '@/components/CustomPopover';
import {
  PAGE_DEVELOP_ALL_TYPE,
  PAGE_DEVELOP_CREATE_TYPE_LIST,
} from '@/constants/pageDev.constants';
import { CREATE_LIST } from '@/constants/space.constants';
import { apiPageList } from '@/services/pageDev';
import {
  PageDevelopCreateTypeEnum,
  PageDevelopMoreActionEnum,
} from '@/types/enums/pageDev';
import { CreateListEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { PageInfo } from '@/types/pageDev';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Input, Row, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams, useRequest } from 'umi';
import CardItem from './CardItem';
import DebugAgentBindModel from './DebugAgentBindModal';
import styles from './index.less';
import PathParamsConfigModal from './PathParamsConfigModal';
import ReverseProxyModal from './ReverseProxyModal';

const cx = classNames.bind(styles);

/**
 * 工作空间 - 页面开发
 */
const SpacePageDevelop: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 页面列表
  const [pageList, setPageList] = useState<any[]>([]);
  // 所有页面列表
  const pageAllRef = useRef<any[]>([]);
  // 类型
  const [type, setType] = useState<PageDevelopCreateTypeEnum>(
    PageDevelopCreateTypeEnum.All_Type,
  );
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // 打开调试智能体绑定模型弹窗
  const [openDebugAgentBindModel, setOpenDebugAgentBindModel] =
    useState<boolean>(false);
  // 打开反向代理弹窗
  const [openReverseProxyModal, setOpenReverseProxyModal] =
    useState<boolean>(false);
  // 打开路径参数配置弹窗
  const [openPathParamsConfigModal, setOpenPathParamsConfigModal] =
    useState<boolean>(false);

  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterType: PageDevelopCreateTypeEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = pageAllRef.current,
  ) => {
    let _list = list;
    if (filterType !== PageDevelopCreateTypeEnum.All_Type) {
      _list = _list.filter((item) => item.type === filterType);
    }
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo.id);
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setPageList(_list);
  };

  // 查询页面列表接口
  const { run: runPageList } = useRequest(apiPageList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PageInfo[]) => {
      handleFilterList(type, create, keyword, result);
      pageAllRef.current = result;
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    // setLoading(true);
    // runPageList(spaceId);
    console.log('pageList', runPageList, spaceId);
  }, [spaceId]);

  // 切换类型
  const handlerChangeType = (value: React.Key) => {
    const _value = value as PageDevelopCreateTypeEnum;
    setType(_value);
    handleFilterList(_value, create, keyword);
  };

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(type, _value, keyword);
  };

  // 页面搜索
  const handleQueryPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(type, create, _keyword);
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(type, create, '');
  };

  /**
   * 点击创建页面类型
   * @param 添加项目表单字段：名称、描述、图标、路径（唯一）
   * 导入项目、在线创建、反向代理点击后，都是打开这个表单弹窗
   * 导入项目、在线创建表单弹窗填写后，进入项目之前弹出“调试智能体绑定”框，确认后进入开发界面
   * 反向代理表单填写后，点击不进入开发界面，直接弹出“反向代理配置”框
   */
  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    const { value: type } = item;
    switch (type) {
      case PageDevelopCreateTypeEnum.Import_Project:
        setOpenDebugAgentBindModel(true);
        console.log('导入项目');
        break;
      case PageDevelopCreateTypeEnum.Online_Create:
        setOpenDebugAgentBindModel(true);
        console.log('在线创建');
        break;
      case PageDevelopCreateTypeEnum.Reverse_Proxy:
        console.log('反向代理');
        setOpenReverseProxyModal(true);
        break;
    }
  };

  // 点击卡片
  const handleClickCard = () => {
    console.log('点击卡片');
  };

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem) => {
    const { value } = item;
    switch (value) {
      // 反向代理配置
      case PageDevelopMoreActionEnum.Reverse_Proxy_Config:
        setOpenReverseProxyModal(true);
        break;
      // 路径参数配置
      case PageDevelopMoreActionEnum.Path_Params_Config:
        setOpenPathParamsConfigModal(true);
        break;
      // 页面预览
      case PageDevelopMoreActionEnum.Page_Preview:
        // 进入开发页面
        break;
    }
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <Row>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={14}
          xxl={12}
          style={{ marginBottom: 5 }}
        >
          <div>
            <Space>
              <h3 className={cx(styles.title)}>页面开发</h3>
              <SelectList
                value={type}
                options={PAGE_DEVELOP_ALL_TYPE}
                onChange={handlerChangeType}
              />
              {/* 单选模式 */}
              <ButtonToggle
                options={CREATE_LIST}
                value={create}
                onChange={(value) => handlerChangeCreate(value as React.Key)}
              />
            </Space>
          </div>
        </Col>
        <Col
          xs={24}
          sm={24}
          md={24}
          lg={24}
          xl={10}
          xxl={12}
          style={{ marginBottom: 5 }}
        >
          <div className={cx('flex', 'gap-10', 'justify-content-end')}>
            <Input
              rootClassName={cx(styles.input)}
              placeholder="搜索页面"
              value={keyword}
              onChange={handleQueryPage}
              prefix={<SearchOutlined />}
              allowClear
              onClear={handleClearKeyword}
              style={{ width: 214 }}
            />
            {/*添加*/}
            <CustomPopover
              list={PAGE_DEVELOP_CREATE_TYPE_LIST}
              onClick={handleClickPopoverItem}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                创建
              </Button>
            </CustomPopover>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Loading />
      ) : pageList?.length > 0 ? (
        <div
          className={cx(styles['main-container'], 'flex-1', 'scroll-container')}
        >
          {pageList?.map((info) => (
            <div key={info.id}>{info.name}</div>
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="未能找到相关结果" />
        </div>
      )}
      {/* 反向代理弹窗 */}
      <ReverseProxyModal
        open={openReverseProxyModal}
        onCancel={() => setOpenReverseProxyModal(false)}
      />
      {/* 调试智能体绑定弹窗 */}
      <DebugAgentBindModel
        open={openDebugAgentBindModel}
        onCancel={() => setOpenDebugAgentBindModel(false)}
        onConfirm={() => setOpenDebugAgentBindModel(false)}
        spaceId={spaceId}
      />
      {/* 路径参数配置弹窗 */}
      <PathParamsConfigModal
        spaceId={spaceId}
        open={openPathParamsConfigModal}
        onCancel={() => setOpenPathParamsConfigModal(false)}
      />
      <CardItem
        componentInfo={{
          name: '页面开发',
          label: '页面开发',
          value: PageDevelopMoreActionEnum.Page_Preview,
        }}
        onClick={handleClickCard}
        onClickMore={handleClickMore}
      />
    </div>
  );
};

export default SpacePageDevelop;
