import CustomPopover from '@/components/CustomPopover';
import { KNOWLEDGE_TEXT_IMPORT_TYPE } from '@/constants/library.constants';
import { DownOutlined, EditOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface KnowledgeHeaderProps {
  onEdit: () => void;
}

/**
 * 知识库头部组件
 */
const KnowledgeHeader: React.FC<KnowledgeHeaderProps> = ({ onEdit }) => {
  const handleBack = () => {
    history.back();
  };

  const handleClickPopoverItem = () => {
    console.log('点击popover');
  };

  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={handleBack}
      />
      <img
        className={cx(styles.logo)}
        src="https://p26-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ce8728aa91f74acbb7f5ddfd7dd7e861~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1740130702&x-signature=o423VSb8q%2F%2BZonW0xW9wIXZRi8Y%3D"
        alt=""
      />
      <section
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-between',
          styles.section,
        )}
      >
        <div className={cx('flex', styles['top-box'])}>
          <h3 className={cx(styles.name)}>知识库名称</h3>
          <EditOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <span className={cx(styles.box, 'radius-6')}>http</span>
          <span className={cx(styles.box, 'radius-6')}>未发布</span>
        </div>
      </section>
      {/*添加内容*/}
      <CustomPopover
        list={KNOWLEDGE_TEXT_IMPORT_TYPE}
        onClick={handleClickPopoverItem}
      >
        <Button
          type="primary"
          icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
          iconPosition="end"
        >
          添加内容
        </Button>
      </CustomPopover>
    </header>
  );
};

export default KnowledgeHeader;
