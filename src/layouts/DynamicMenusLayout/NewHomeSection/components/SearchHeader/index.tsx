import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SearchHeaderProps {
  keyword: string;
  placeholder: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onNewChat: () => void;
  showNewChatButton?: boolean;
  /** 外部聚焦搜索框用（侧栏顶部「搜索」入口/⌘K） */
  inputRef?: React.Ref<InputRef>;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  keyword,
  placeholder,
  onSearchChange,
  onSearchSubmit,
  onNewChat,
  showNewChatButton = true,
  inputRef,
}) => {
  return (
    <div className={cx(styles['header-search-row'])}>
      <div className={cx(styles['search-input-wrapper'])}>
        <Input
          ref={inputRef}
          prefix={
            <SearchOutlined className={cx(styles['search-icon-inner'])} />
          }
          placeholder={placeholder}
          value={keyword}
          onChange={onSearchChange}
          onPressEnter={onSearchSubmit}
          allowClear
          className={cx(styles['search-input'])}
        />
      </div>
      {showNewChatButton && (
        <Tooltip
          title={dict('PC.Constants.Menus.newChat')}
          placement="right"
          color="white"
          styles={{ body: { color: 'rgba(0, 0, 0, 0.88)' } }}
        >
          <div className={cx(styles['new-chat-btn'])} onClick={onNewChat}>
            <SvgIcon
              name="icons-nav-new_chat"
              className={cx(styles['new-chat-svg'])}
            />
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default SearchHeader;
