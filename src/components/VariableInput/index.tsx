import { Tree } from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import type { CSSProperties } from 'react';
import React, { useEffect, useRef, useState } from 'react';

interface VariableInputProps {
  style?: CSSProperties;
  treeData?: DataNode[];
  onChange?: (val: string) => void;
}

// 将forceCaretNotInBlock函数移到组件前面避免"use before define"错误
function forceCaretNotInBlock() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const node = sel.anchorNode;
  if (
    node &&
    node.parentNode &&
    (node.parentNode as HTMLElement).classList.contains('var-block')
  ) {
    const offset = sel.anchorOffset;
    const textLen = node.textContent?.length ?? 0;
    const block = node.parentNode as HTMLElement;
    const range = document.createRange();
    if (offset <= textLen / 2) {
      range.setStartBefore(block);
      range.setEndBefore(block);
    } else {
      range.setStartAfter(block);
      range.setEndAfter(block);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

const TREE_DATA: DataNode[] = [
  {
    title: '用户信息',
    key: 'userinfo',
    children: [
      { title: '姓名', key: 'name' },
      { title: '邮箱', key: 'email' },
      { title: '手机号', key: 'phone' },
    ],
  },
  {
    title: '订单信息',
    key: 'orderinfo',
    children: [
      { title: '订单号', key: 'orderId' },
      { title: '金额', key: 'amount' },
      { title: '日期', key: 'date' },
    ],
  },
  {
    title: '地址',
    key: 'address',
    children: [
      { title: '城市', key: 'city' },
      { title: '区县', key: 'district' },
    ],
  },
];

const blockStyle: CSSProperties = {
  display: 'inline-block',
  background: '#ffe58f',
  borderRadius: '3px',
  padding: '0 6px',
  margin: '0 2px',
  color: '#333',
  userSelect: 'none',
};

const containerStyle: CSSProperties = {
  position: 'relative',
  width: 520,
};

function getCaretRect(): { top: number; left: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { top: 30, left: 10 };
  const range = sel.getRangeAt(0).cloneRange();
  range.collapse(true);
  const dummy = document.createElement('span');
  dummy.textContent = '|';
  range.insertNode(dummy);
  const rect = dummy.getBoundingClientRect();
  dummy.parentNode?.removeChild(dummy);
  return {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
  };
}

function getCaretCharOffset(element: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || !sel.focusNode) return 0;
  let offset = sel.focusOffset;
  let node = sel.focusNode;
  if (node.nodeType !== 3) {
    offset = 0;
    node = element;
  }
  let run: Node | null = node;
  let count = offset;
  while (run && run !== element) {
    if (run.previousSibling) {
      run = run.previousSibling;
      if (run.nodeType === 3) count += (run as Text).textContent?.length ?? 0;
      else if ((run as HTMLElement).innerText)
        count += (run as HTMLElement).innerText.length;
    } else {
      run = run.parentNode;
    }
  }
  return count;
}

function filterTree(tree: DataNode[], keyword: string): DataNode[] {
  if (!keyword.trim()) return tree;
  function deepFilter(nodes: DataNode[]): DataNode[] {
    return nodes
      .map((node) => {
        const selfMatch = node.title
          ?.toString()
          .toLowerCase()
          .includes(keyword.toLowerCase());
        if (!node.children && selfMatch) return node;
        if (node.children) {
          const children = deepFilter(node.children);
          if (children.length || selfMatch) {
            return {
              ...node,
              children,
            };
          }
        }
        return selfMatch ? { ...node, children: [] } : null;
      })
      .filter(Boolean) as DataNode[];
  }
  return deepFilter(tree);
}

// 获取所有可选节点（父级和叶子）
function getSelectableNodes(
  tree: DataNode[],
): Array<{ key: React.Key; title: string }> {
  const res: Array<{ key: React.Key; title: string }> = [];
  function travel(nodes: DataNode[]) {
    for (let node of nodes) {
      res.push({ key: node.key, title: node.title as string });
      if (node.children) travel(node.children);
    }
  }
  travel(tree);
  return res;
}

const VariableInput: React.FC<VariableInputProps> = ({
  style,
  treeData = TREE_DATA,
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(220);

  // 键盘导航可选节点和高亮下标
  const [allNodes, setAllNodes] = useState<
    Array<{ key: React.Key; title: string }>
  >([]);
  const [highlightIdx, setHighlightIdx] = useState<number>(0);

  // 内容变化事件
  function handleInput() {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const text = editor.innerText;
    const beforeTxt = text.slice(0, getCaretCharOffset(editor));
    const match = beforeTxt.match(/\{(\w*)$/);

    if (match) {
      setShowDropdown(true);
      setFilter(match[1]);
      setTimeout(() => {
        const rect = getCaretRect();
        const bound = editor.getBoundingClientRect();
        setDropdownPos({
          top: rect.top - bound.top + editor.scrollTop + 22,
          left: Math.max(rect.left - bound.left, 0),
        });
        setDropdownWidth(240);
      });
    } else {
      setShowDropdown(false);
      setFilter('');
    }
    if (onChange) onChange(editor.innerText);
    setTimeout(forceCaretNotInBlock);
  }

  // 过滤树并获取所有节点
  useEffect(() => {
    if (showDropdown) {
      const data = filterTree(treeData, filter);
      const nodes = getSelectableNodes(data);
      setAllNodes(nodes);
      setHighlightIdx(0);
    }
  }, [showDropdown, filter, treeData]);

  // 插入变量区块
  function insertVariable(variable: string) {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    range.setStart(sel.anchorNode!, sel.anchorOffset - filter.length - 1);
    range.deleteContents();
    const node = document.createElement('span');
    node.className = 'var-block';
    node.setAttribute('contenteditable', 'false');
    Object.assign(node.style, blockStyle);
    node.innerText = `{{${variable}}}`;
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    setShowDropdown(false);
    setTimeout(forceCaretNotInBlock);
    editorRef.current.focus();
    if (onChange) onChange(editorRef.current.innerText);
  }

  // 整块删除
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const sel = window.getSelection();
    if (!sel) return;
    if (showDropdown && allNodes.length) {
      // ↑↓操作
      if (e.key === 'ArrowDown' || e.key === 'Down') {
        setHighlightIdx((idx) => Math.min(idx + 1, allNodes.length - 1));
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'Up') {
        setHighlightIdx((idx) => Math.max(idx - 1, 0));
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        insertVariable(allNodes[highlightIdx]?.key as string);
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
        e.preventDefault();
        return;
      }
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      let block: HTMLElement | null = null;
      if (node === editorRef.current) {
        const childNodes = editorRef.current!.childNodes;
        const offset = sel.anchorOffset;
        if (
          offset > 0 &&
          childNodes[offset - 1] instanceof HTMLElement &&
          (childNodes[offset - 1] as HTMLElement).classList.contains(
            'var-block',
          )
        ) {
          block = childNodes[offset - 1] as HTMLElement;
        }
      } else if (
        node &&
        node.parentNode &&
        (node.parentNode as HTMLElement).classList.contains('var-block')
      ) {
        block = node.parentNode as HTMLElement;
      } else if (
        node &&
        node.previousSibling &&
        node.previousSibling instanceof HTMLElement &&
        node.previousSibling.classList.contains('var-block')
      ) {
        block = node.previousSibling as HTMLElement;
      }
      if (block) {
        block.remove();
        e.preventDefault();
        setTimeout(forceCaretNotInBlock);
        if (onChange && editorRef.current)
          onChange(editorRef.current.innerText);
        return;
      }
    }
  }

  function handleTreeSelect(keys: React.Key[], info: { node: EventDataNode }) {
    insertVariable(info.node.key as string);
  }

  // 节点渲染 高亮(父级和叶子都支持)
  const renderTree = (nodes: DataNode[]): DataNode[] => {
    return nodes.map((n) => {
      const idx = allNodes.findIndex((item) => item.key === n.key);
      return {
        ...n,
        title: (
          <div
            style={{
              background: idx === highlightIdx ? '#e6f4ff' : undefined,
              padding: '0 2px',
              borderRadius: 3,
              fontWeight: n.children ? 500 : undefined,
            }}
            onMouseDown={(ev) => {
              ev.preventDefault();
              insertVariable(n.key as string);
            }}
          >
            {n.title}
          </div>
        ),
        children: n.children ? renderTree(n.children) : undefined,
      };
    });
  };

  return (
    <div style={{ ...containerStyle, ...style }}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          minHeight: 96,
          border: '1px solid #ddd',
          padding: 10,
          borderRadius: 4,
          fontSize: 16,
          lineHeight: '1.6',
        }}
        spellCheck={false}
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 998,
            minWidth: dropdownWidth,
            background: '#fff',
            boxShadow: '0 2px 8px #dadada',
            borderRadius: 4,
            border: '1px solid #eee',
            fontSize: 16,
            maxHeight: 300,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          <Tree
            treeData={renderTree(filterTree(treeData, filter))}
            selectable
            defaultExpandAll
            showLine
            height={220}
            onSelect={handleTreeSelect}
          />
        </div>
      )}
      <style>{`
        .var-block {
          background: #ffe58f !important;
          border-radius: 3px;
          padding: 0 6px;
          margin: 0 2px;
          color: #333;
          user-select: none;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default VariableInput;
