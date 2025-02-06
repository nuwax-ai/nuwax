import Constant from '@/constants/codes.constants';
import { ICON_ADJUSTMENT, ICON_SUCCESS } from '@/constants/images.constants';
import service, { IgetList } from '@/services/created';
import { PluginAndLibraryEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import {
  ClockCircleOutlined,
  MessageOutlined,
  ProductFilled,
  SearchOutlined,
  StarFilled,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Divider, Input, Menu, Modal, Radio, Rate } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';

import './index.less';
interface BottonList {
  label: string;
  key: PluginAndLibraryEnum;
}
// 顶部的标签页名称
const buttonList: BottonList[] = [
  { label: '插件', key: PluginAndLibraryEnum.Plugin },
  { label: '工作流', key: PluginAndLibraryEnum.Workflow },
  { label: '知识库', key: PluginAndLibraryEnum.KnowledgeBase },
  { label: '数据库', key: PluginAndLibraryEnum.Database },
];
type MenuItem = Required<MenuProps>['items'][number];

interface CreatedProp {
  // 选中的头部的tag
  checkTag: PluginAndLibraryEnum;
  //   点击添加后,通知父组件添加节点
  onAdded: (val: CreatedNodeItem) => void;
  // 当前的工作流id
  targetId?: number;
}
// 创建插件、工作流、知识库、数据库
const Created: React.FC<CreatedProp> = ({ checkTag, onAdded, targetId }) => {
  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');
  // 当前顶部被选中被选中的
  const [selected, SetSelected] = useState<{
    label: string;
    key: PluginAndLibraryEnum;
  }>({
    label: '插件',
    key: PluginAndLibraryEnum.Plugin,
  });
  //
  //   右侧的list
  const [list, setList] = useState<CreatedNodeItem[]>([]);

  // 左侧菜单栏
  const items: MenuItem[] = [
    {
      key: 'library',
      icon: <SearchOutlined />,
      label: `组件库${selected.label}`,
    },
    {
      key: 'collect',
      icon: <StarFilled />,
      label: '收藏',
    },
    {
      key: 'divider',
      type: 'divider', // 确保分隔线项有 key 和 type 属性
    },
    {
      key: 'group',
      label: `搜索${selected.label}`, // 如果需要动态内容，可以像这样使用模板字符串
      type: 'group', // 使用 Ant Design 支持的类型
      children: [
        {
          key: 'all', // 子项也需要唯一的 key
          label: '全部',
          icon: <ProductFilled />,
        },
      ],
    },
  ];

  //   修改顶部选项
  const changeTitle = (val: RadioChangeEvent | string) => {
    if (!val) return;
    // 获取被选中的key
    let _select;
    if (typeof val === 'string') {
      _select = val;
    } else {
      _select = val.target.value;
    }

    // 遍历找到对应的选项
    const _item = buttonList.find((item) => item.key === _select);
    if (_item) {
      SetSelected(_item);
    }
  };

  //   选中左侧菜单
  const selectMenu = (val: string) => {
    console.log(val);
  };

  //   获取右侧的list
  const getList = async (type: PluginAndLibraryEnum, params?: IgetList) => {
    const _res = await service.getList(type, params || {});
    if (_res.code === Constant.success) {
      console.log(_res.data);
      setList(_res.data);
    }
  };

  //   搜索
  const onSearch = (value: string) => {
    const _params = {
      kw: value,
    };
    getList(selected.key, _params);
  };

  //   点击添加,通知父组件,并将参数传递给父组件
  const onAddNode = (item: CreatedNodeItem) => {
    onAdded(item);
  };

  useEffect(() => {
    getList(checkTag);
    changeTitle(checkTag);
  }, [checkTag]);

  //   顶部的标题
  const title = (
    <div className="dis-left created-title">
      <Radio.Group
        value={selected.key}
        onChange={changeTitle}
        defaultValue="plugInNode"
      >
        {buttonList.map((item, index) => (
          <span key={item.key} className="radio-title-style">
            <Radio.Button
              value={item.key}
              className={`radio-button-style ${
                index === 0 ? 'first-radio-style' : ''
              }`}
              onChange={(e) => {
                getList(e.target.value);
              }}
            >
              {item.label}
            </Radio.Button>
          </span>
        ))}
      </Radio.Group>
    </div>
  );

  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={show}
      footer={null}
      centered
      title={title}
      onCancel={() => setShow(false)}
      className="created-modal-style"
      width={1096}
    >
      <div className="created-container dis-sb-start">
        {/* 左侧部分 */}
        <div className="aside-style">
          {/* 搜索框 */}
          <Input
            className="margin-bottom"
            allowClear
            placeholder="搜索"
            prefix={<SearchOutlined />}
            onPressEnter={(event) => {
              if (event.key === 'Enter') {
                onSearch((event.currentTarget as HTMLInputElement).value);
              }
            }}
          />
          {/* 创建按钮 */}
          <Button
            type="primary"
            className="margin-bottom"
            style={{ width: '100%' }}
          >{`创建${selected.label}`}</Button>

          {/* 下方的菜单 */}
          <Menu
            onClick={(val) => {
              selectMenu(val.key);
            }}
            defaultSelectedKeys={['library']}
            mode="inline"
            items={items}
          ></Menu>
        </div>
        {/* 右侧部分应该是变动的 */}
        <div className="main-style flex-1">
          {list.map((item) => (
            <div className="dis-sb list-item-style" key={item.spaceId}>
              <img src={item.icon} alt="" className="left-image-style" />
              <div className="flex-1 content-font">
                <p className="label-font-style">{item.name}</p>
                <p>{item.description}</p>
                {/* <Tag>{item.tag}</Tag> */}
                <div className="dis-sb count-div-style">
                  <div>
                    {item.publishUser.avatar}
                    <span>{item.publishUser.nickName}</span>
                    <Divider type="vertical" />
                    <span className="margin-left-6">
                      发布于{getTime(item.created)}
                    </span>
                    {item.statistics && (
                      <>
                        <Divider type="vertical" />
                        <div>
                          <Rate count={1} />
                          <span>{item.statistics.collectCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {item.statistics && (
                    <div>
                      <span>
                        <ICON_ADJUSTMENT />
                        {item.statistics.callCount}
                      </span>
                      <Divider type="vertical" />
                      <span>
                        <MessageOutlined />
                        {item.statistics.referenceCount}
                      </span>
                      <span>
                        <ClockCircleOutlined />
                        {item.statistics.failCallCount}
                      </span>
                      <span>
                        <ICON_SUCCESS />
                        {item.statistics.referenceCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => onAddNode(item)}
                disabled={item.targetId === targetId}
              >
                添加
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default Created;
