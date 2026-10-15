import { dict } from '@/services/i18nRuntime';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ConversationBottomConsole from '../ConversationBottomConsole';
import { DEFAULT_TERMINAL_APPEARANCE } from '../ConversationBottomConsole/terminalTheme';
import styles from './index.less';
import type { ConversationTerminalWorkspaceProps } from './store';

const key = 'PC.Components.ConversationTerminalWorkspace.';

/** 每个标签保留独立控制台及 shell；标签切换只影响显隐。 */
const WorkspaceConsole: React.FC<ConversationTerminalWorkspaceProps> = (
  props,
) => {
  const [terminals, setTerminals] = useState([1]);
  const [selected, setSelected] = useState(1);
  const [terminalSignal, setTerminalSignal] = useState(0);
  const sequence = useRef(1);
  const [appearance, setAppearance] = useState(DEFAULT_TERMINAL_APPEARANCE);
  const [closing, setClosing] = useState<number | null>(null);
  useEffect(() => {
    if (props.visible === false) setClosing(null);
  }, [props.visible]);
  const addTerminal = () => {
    setClosing(null);
    const id = ++sequence.current;
    setTerminals((current) => [...current, id]);
    setSelected(id);
    setTerminalSignal((signal) => signal + 1);
  };
  const closeTerminal = (id: number) => {
    setClosing(null);
    const remaining = terminals.filter((item) => item !== id);
    setTerminals(remaining);
    if (selected === id) setSelected(remaining.at(-1) ?? 0);
  };
  const header = (
    <div
      className={styles.tabs}
      role="tablist"
      aria-label={dict(`${key}terminals`)}
    >
      {terminals.map((id) => (
        <div className={styles.tab} key={id}>
          <button
            type="button"
            role="tab"
            aria-selected={id === selected}
            onClick={() => {
              setClosing(null);
              setSelected(id);
              setTerminalSignal((signal) => signal + 1);
            }}
          >
            {dict(`${key}terminalName`, id)}
          </button>
          <Popconfirm
            open={closing === id && props.visible !== false}
            onOpenChange={(open) => setClosing(open ? id : null)}
            title={dict(`${key}closeWarning`)}
            okText={dict(`${key}confirmClose`)}
            cancelText={dict(`${key}cancelClose`)}
            onConfirm={() => closeTerminal(id)}
          >
            <button type="button" aria-label={dict(`${key}closeTerminal`, id)}>
              <CloseOutlined />
            </button>
          </Popconfirm>
        </div>
      ))}
      <Button
        type="text"
        size="small"
        icon={<PlusOutlined />}
        aria-label={dict(`${key}addTerminal`)}
        title={dict(`${key}addTerminal`)}
        onClick={addTerminal}
      />
    </div>
  );

  return (
    <>
      {terminals.map((id) => (
        <ConversationBottomConsole
          {...props}
          key={id}
          visible={props.visible !== false && id === selected}
          preserveTerminalConnections
          terminalSignal={id === selected ? terminalSignal : undefined}
          terminalHeader={id === selected ? header : null}
          terminalAppearance={appearance}
          onTerminalAppearanceChange={setAppearance}
          onLayoutModeChange={
            id === selected ? props.onLayoutModeChange : undefined
          }
          onActiveTabChange={
            id === selected ? props.onActiveTabChange : undefined
          }
        />
      ))}
      {terminals.length === 0 && props.visible !== false && (
        <div className={props.className}>{header}</div>
      )}
    </>
  );
};

export default WorkspaceConsole;
