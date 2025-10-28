import { LeftGroup, LeftMenu, ModelBoxProps } from '@/types/interfaces/common';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const ModelBox: React.FC<ModelBoxProps> = ({
  title,
  leftMenuList,
  Content,
  changeMenu,
  searchBar,
  createNode,
  width,
  onSearch,
}) => {
  // 将组件的开关放置在store中，便于父组件来开关档期那的组件
  const { open, setOpen } = useModel('model');

  //   当前被选中的左侧菜单
  const [action, setAction] = useState<string>('');
  // 确保 menuItem 是一个返回 JSX.Element 的函数
  const menuItem = (item: LeftMenu): JSX.Element => (
    <div
      className={cx(styles.item, 'cursor-pointer', {
        [styles.checked]: action === item.key,
      })}
      key={item.key}
      onClick={() => {
        setAction(item.key);
        changeMenu(item.key);
      }}
    >
      {item.icon}
      <span className={cx(styles.label)}>{item.name}</span>
    </div>
  );

  return (
    <Modal
      centered
      open={open}
      width={width}
      footer={null}
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      onCancel={() => setOpen(false)}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>{title}</h3>
            {/* 搜索栏 */}
            {searchBar && (
              <Input
                className={cx(styles.search)}
                allowClear
                placeholder="搜索"
                prefix={<SearchOutlined />}
                onPressEnter={(event) => {
                  if (onSearch && event.key === 'Enter') {
                    onSearch((event.currentTarget as HTMLInputElement).value);
                  }
                }}
              />
            )}
            {/* 创建节点的按钮或者下拉框 */}
            {createNode && (
              <div className={cx(styles.create)}>{createNode}</div>
            )}

            {/* 遍历左侧项 */}
            {leftMenuList.map((item: LeftMenu | LeftGroup, index: number) => {
              // 根据是item是分组还是单个来执行不同的渲染
              if ('children' in item) {
                return (
                  <>
                    <div key={item.key}>
                      {/* 如果有label */}
                      {item.label && <div>{item.label}</div>}
                      {/* 渲染子组件 */}
                      {item.children.map(menuItem)}
                    </div>
                    {/* 如果不是最后一项并且是分组，则添加分割线 */}
                    {index !== leftMenuList.length - 1 &&
                      'children' in item && (
                        <div className="divider" key={`divider-${index}`} />
                      )}
                  </>
                );
              } else {
                return menuItem(item as LeftMenu);
              }
            })}
          </div>
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    ></Modal>
  );
};

export default ModelBox;
