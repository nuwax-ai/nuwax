import ButtonToggle from '@/components/ButtonToggle';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
import CustomPopover from '@/components/CustomPopover';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import {
  PAGE_DEVELOP_ALL_TYPE,
  PAGE_DEVELOP_CREATE_TYPE_LIST,
} from '@/constants/pageDev.constants';
import { CREATE_LIST } from '@/constants/space.constants';
import {
  apiCustomPageCopyProject,
  apiCustomPageQueryList,
  apiPageDeleteProject,
  apiPageGetProjectInfo,
} from '@/services/pageDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  PageDevelopCreateTypeEnum,
  PageDevelopMoreActionEnum,
  PageDevelopPublishTypeEnum,
  PageDevelopSelectTypeEnum,
  PageProjectTypeEnum,
} from '@/types/enums/pageDev';
import { ApplicationMoreActionEnum, CreateListEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import {
  CreateCustomPageInfo,
  CustomPageDto,
} from '@/types/interfaces/pageDev';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Input, message, Row, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import AuthConfigModal from './AuthConfigModal';
import styles from './index.less';
import PageCreateModal from './PageCreateModal';
import PageDevelopCardItem from './PageDevelopCardItem';
import PathParamsConfigModal from './PathParamsConfigModal';
import ReverseProxyModal from './ReverseProxyModal';

const cx = classNames.bind(styles);
type IQuery = 'type' | 'create' | 'keyword';

/**
 * 工作空间 - 页面开发
 */
const SpacePageDevelop: React.FC = () => {
  // umi 中的 useSearchParams
  const [searchParams, setSearchParams] = useSearchParams();

  // 当 select 改变时同步 URL
  const handleChange = (key: IQuery, value: string) => {
    // 更新 URL 参数
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 页面列表
  const [pageList, setPageList] = useState<CustomPageDto[]>([]);
  // 所有页面列表
  const pageAllRef = useRef<CustomPageDto[]>([]);
  // 类型
  const [type, setType] = useState<PageDevelopSelectTypeEnum>(
    searchParams.get('type') || PageDevelopSelectTypeEnum.All_Type,
  );
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>(
    searchParams.get('keyword') || '',
  );
  const [loading, setLoading] = useState<boolean>(false);
  // 打开反向代理弹窗
  const [openReverseProxyModal, setOpenReverseProxyModal] =
    useState<boolean>(false);
  // 打开路径参数配置弹窗
  const [openPathParamsConfigModal, setOpenPathParamsConfigModal] =
    useState<boolean>(false);
  // 打开页面创建弹窗
  const [openPageCreateModal, setOpenPageCreateModal] =
    useState<boolean>(false);
  // 打开认证配置弹窗
  const [openAuthConfigModal, setOpenAuthConfigModal] =
    useState<boolean>(false);
  // 打开复制到空间弹窗
  const [openCopyToSpaceModal, setOpenCopyToSpaceModal] =
    useState<boolean>(false);
  // 复制到空间加载中
  const [loadingCopyToSpace, setLoadingCopyToSpace] = useState<boolean>(false);
  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
  );
  // 缓存页面创建类型
  const pageCreateTypeRef = useRef<PageDevelopCreateTypeEnum>(
    PageDevelopCreateTypeEnum.Import_Project,
  );
  // 当前页面信息
  const [currentPageInfo, setCurrentPageInfo] = useState<CustomPageDto>();
  // 当前项目ID
  const [projectId, setProjectId] = useState<number>(0);
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤筛选智能体列表数据
  const handleFilterList = (
    filterType: PageDevelopSelectTypeEnum,
    filterCreate: CreateListEnum,
    filterKeyword: string,
    list = pageAllRef.current,
  ) => {
    let _list = list;
    if (filterType !== PageDevelopSelectTypeEnum.All_Type) {
      _list = _list.filter(
        (item) =>
          item.publishType ===
          (filterType as unknown as PageDevelopPublishTypeEnum),
      );
    }
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo.id);
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setPageList(_list);
  };
  // 监听 URL 改变（支持浏览器前进/后退）
  useEffect(() => {
    const type = searchParams.get('type') || PageDevelopSelectTypeEnum.All_Type;
    const create =
      Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const keyword = searchParams.get('keyword') || '';

    setType(type);
    setCreate(create);
    setKeyword(keyword);

    handleFilterList(type, create, keyword);
  }, [searchParams]);

  // 查询页面列表接口
  const { run: runPageList } = useRequest(apiCustomPageQueryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: CustomPageDto[]) => {
      handleFilterList(type, create, keyword, result);
      pageAllRef.current = result;
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询页面列表接口
  const { run: runPageDelete } = useRequest(apiPageDeleteProject, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('删除成功');
      const projectId = params[0];
      const _pageList = pageList.filter((item) => item.projectId !== projectId);
      setPageList(_pageList);
      pageAllRef.current = pageAllRef.current.filter(
        (item) => item.projectId !== projectId,
      );
    },
  });

  // 复制到空间接口
  const { run: runCopyToSpace } = useRequest(apiCustomPageCopyProject, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('页面复制成功');
      setLoadingCopyToSpace(false);
    },
    onError: () => {
      setLoadingCopyToSpace(false);
    },
  });

  useEffect(() => {
    setLoading(true);
    runPageList({
      spaceId,
    });
  }, [spaceId]);

  // 切换类型
  const handlerChangeType = (value: React.Key) => {
    const _value = value as PageDevelopSelectTypeEnum;
    setType(_value);
    handleFilterList(_value, create, keyword);
    handleChange('type', _value);
  };

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(type, _value, keyword);
    handleChange('create', _value.toString());
  };

  // 页面搜索
  const handleQueryPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(type, create, _keyword);
    handleChange('keyword', _keyword);
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(type, create, '');
  };

  /**
   * 点击创建页面类型
   * @param 添加项目表单字段：名称、描述、图标、路径（唯一）
   */
  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    setOpenPageCreateModal(true);
    pageCreateTypeRef.current = item.value as PageDevelopCreateTypeEnum;
  };

  /**
   * 确认创建页面
   * 导入项目、在线开发、反向代理点击后，都是打开这个表单弹窗
   * 导入项目、在线开发表单弹窗填写后，进入项目之前弹出“调试智能体绑定”框，确认后进入开发界面
   * 反向代理表单填写后，点击不进入开发界面，直接弹出“反向代理配置”框
   */
  const handleConfirmCreatePage = (result: CreateCustomPageInfo) => {
    setProjectId(result.projectId);
    // 关闭表单弹窗
    setOpenPageCreateModal(false);
    switch (pageCreateTypeRef.current) {
      // 导入项目、在线开发
      case PageDevelopCreateTypeEnum.Import_Project:
      case PageDevelopCreateTypeEnum.Online_Develop:
        // 跳转到开发页面
        history.push(`/space/${spaceId}/app-dev/${result.projectId}`);
        break;
      case PageDevelopCreateTypeEnum.Reverse_Proxy:
        setOpenReverseProxyModal(true);
        break;
    }
  };

  // 点击卡片
  const handleClickCard = (item: CustomPageDto) => {
    setProjectId(item.projectId);
    setCurrentPageInfo(item);
    // 根据页面类型（页面创建模式）导入项目、在线创建，判断是否需要打开调试智能体绑定弹窗，反向代理，打开路径参数配置弹窗
    if (item.projectType === PageProjectTypeEnum.ONLINE_DEPLOY) {
      // 跳转到开发页面
      history.push(`/space/${spaceId}/app-dev/${item.projectId}`);
    }
    // 反向代理
    else if (item.projectType === PageProjectTypeEnum.REVERSE_PROXY) {
      setOpenReverseProxyModal(true);
    }
  };

  // 查询页面信息
  const { run: runPageInfo } = useRequest(apiPageGetProjectInfo, {
    manual: true,
    onSuccess: (result: CustomPageDto) => {
      if (result.pageUrl) {
        // 打开页面预览
        const url = `${process.env.BASE_URL}${result.pageUrl}`;
        window.open(url, '_blank');
      } else {
        message.error('页面URL不存在');
      }
    },
  });

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem, info: CustomPageDto) => {
    setProjectId(info.projectId);
    setCurrentPageInfo(info);
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
      // 认证配置
      case PageDevelopMoreActionEnum.Auth_Config:
        setOpenAuthConfigModal(true);
        break;
      // 页面预览
      case PageDevelopMoreActionEnum.Page_Preview:
        runPageInfo(info.projectId);
        break;
      // 复制到空间
      case PageDevelopMoreActionEnum.Copy_To_Space:
        setOpenCopyToSpaceModal(true);
        break;
      // 删除页面项目
      case PageDevelopMoreActionEnum.Delete:
        modalConfirm('您确定要删除此页面吗?', info.name, () => {
          runPageDelete(info.projectId);
          return new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        });
        break;
    }
  };

  // 取消反向代理
  const handleCancelReverseProxy = () => {
    setOpenReverseProxyModal(false);
    // 重新查询页面列表
    runPageList({
      spaceId,
    });
  };

  // 取消路径参数配置
  const handleCancelPathParamsConfig = () => {
    setOpenPathParamsConfigModal(false);
    // 重新查询页面列表
    runPageList({
      spaceId,
    });
  };

  // 确认认证配置
  const handleConfirmAuthConfig = (projectId: number, needLogin: boolean) => {
    setOpenAuthConfigModal(false);
    const _pageList = pageList.map((item) => {
      if (item.projectId === projectId) {
        return { ...item, needLogin };
      }
      return item;
    });
    setPageList(_pageList);
    pageAllRef.current = pageAllRef.current.map((item) => {
      if (item.projectId === projectId) {
        return { ...item, needLogin };
      }
      return item;
    });
  };

  // 确认复制到空间
  const handleConfirmCopyToSpace = (targetSpaceId: number) => {
    setLoadingCopyToSpace(true);
    setOpenCopyToSpaceModal(false);
    const data = {
      projectId,
      targetSpaceId,
    };
    runCopyToSpace(data);
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
              <h3 className={cx(styles.title)}>应用页面开发</h3>
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
            <PageDevelopCardItem
              key={info.projectId}
              componentInfo={info}
              onClick={() => handleClickCard(info)}
              onClickMore={(item) => handleClickMore(item, info)}
            />
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
        projectId={projectId}
        projectType={currentPageInfo?.projectType}
        defaultProxyConfigs={currentPageInfo?.proxyConfigs || []}
        onCancel={handleCancelReverseProxy}
      />
      {/* 路径参数配置弹窗 */}
      <PathParamsConfigModal
        currentPageInfo={currentPageInfo}
        open={openPathParamsConfigModal}
        onCancel={handleCancelPathParamsConfig}
      />
      {/* 页面创建弹窗 */}
      <PageCreateModal
        spaceId={spaceId}
        type={pageCreateTypeRef.current}
        open={openPageCreateModal}
        onConfirm={handleConfirmCreatePage}
        onCancel={() => setOpenPageCreateModal(false)}
      />
      {/* 认证配置弹窗 */}
      <AuthConfigModal
        open={openAuthConfigModal}
        pageInfo={currentPageInfo}
        onCancel={() => setOpenAuthConfigModal(false)}
        onConfirm={handleConfirmAuthConfig}
      />
      {/*复制到空间弹窗*/}
      <MoveCopyComponent
        spaceId={spaceId}
        loading={loadingCopyToSpace}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={AgentComponentTypeEnum.Page}
        open={openCopyToSpaceModal}
        title={currentPageInfo?.name}
        onCancel={() => setOpenCopyToSpaceModal(false)}
        onConfirm={handleConfirmCopyToSpace}
      />
    </div>
  );
};

export default SpacePageDevelop;
