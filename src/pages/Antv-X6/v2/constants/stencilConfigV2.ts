/**
 * V2 节点模板配置
 *
 * 定义左侧节点列表的数据结构
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { NodeShapeEnumV2, NodeTypeEnumV2 } from '../types';

// ==================== 图标 URL 常量 ====================

// 使用 base64 或 URL 形式的图标
// 实际项目中可以从 constants/images.constants 导入，这里为了独立性使用占位符
export const ICONS = {
  // 大模型
  LLM: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY0NjZGMSIvPgo8cGF0aCBkPSJNNiA3SDEwTTYgMTBIMTRNNiAxM0gxMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 插件
  Plugin:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzUyQzQxQSIvPgo8cGF0aCBkPSJNMTAgNlYxNE02IDE0SDEwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
  // 工作流
  Workflow:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzUxNDdGRiIvPgo8cGF0aCBkPSJNNiA4SDEwTTYgMTJIMTQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+',
  // MCP
  MCP: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzEzQzhBOCIvPgo8cGF0aCBkPSJNNiAxMEgxNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 代码
  Code: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzNGN0RFOSIvPgo8cGF0aCBkPSJNOCA3TDUgMTBMOCAxM00xMiA3TDE1IDEwTDEyIDEzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==',
  // 条件分支
  Condition:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZBQUQxNCIvPgo8cGF0aCBkPSJNMTAgNlYxME02IDEwSDEwTTE0IDEwSDE0LjAxTTEwIDE0VjE0LjAxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
  // 意图识别
  IntentRecognition:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0VCMkY5NiIvPgo8cGF0aCBkPSJNMTAgNkMxMCA2IDYgMTAgNiAxMEM2IDEwIDEwIDE0IDEwIDE0QzEwIDE0IDE0IDEwIDE0IDEwQzE0IDEwIDEwIDYgMTAgNloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==',
  // 循环
  Loop: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzkzNTRGRiIvPgo8cGF0aCBkPSJNMTQgMTBDMTQgMTIuMjA5MSAxMi4yMDkxIDE0IDEwIDE0QzcuNzkwODYgMTQgNiAxMi4yMDkxIDYgMTBDNiA3Ljc5MDg2IDcuNzkwODYgNiAxMCA2QzEyLjIwOTEgNiAxNCA3Ljc5MDg2IDE0IDEwWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTE0IDhWNkgxMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 继续循环
  LoopContinue:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzUyQzQxQSIvPgo8cGF0aCBkPSJNNiAxMEgxNE0xMSA3TDE0IDEwTDExIDEzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==',
  // 终止循环
  LoopBreak:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZGNEQxRiIvPgo8cGF0aCBkPSJNNiA2TDE0IDE0TTYgMTRMMTQgNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 知识库
  Knowledge:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzI0OTdGRiIvPgo8cGF0aCBkPSJNNiA2VjE0SDEwTTE0IDZWMTRIMTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==',
  // 变量
  Variable:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZBODE0OSIvPgo8cGF0aCBkPSJNNyA3TDEwIDEwTDcgMTNNMTMgMTNIMTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
  // 长期记忆
  LongTermMemory:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzg4NjhGRiIvPgo8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8L3N2Zz4=',
  // 数据新增
  TableDataAdd:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzUyQzQxQSIvPgo8cGF0aCBkPSJNMTAgNlYxNE02IDEwSDE0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
  // 数据删除
  TableDataDelete:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZGNEQxRiIvPgo8cGF0aCBkPSJNNiAxMEgxNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 数据更新
  TableDataUpdate:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZBQUQ0QSIvPgo8cGF0aCBkPSJNNiAxMEgxNE0xMCA2VjE0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==',
  // 数据查询
  TableDataQuery:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzI0OTdGRiIvPgo8Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTExLjUgMTEuNUwxNCAxNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // SQL自定义
  TableSQL:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzU0NUVGRSIvPgo8cGF0aCBkPSJNNiA2SDE0TTE0IDZWMTRNMTQgMTRINk02IDE0VjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPg==',
  // 问答
  QA: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzEzQzhBOCIvPgo8cGF0aCBkPSJNMTAgMTRWMTRNMTAgNkMxMiA2IDEzIDcgMTMgOUMxMyAxMSAxMCAxMSAxMCAxMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 文本处理
  TextProcessing:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY0NjZGMSIvPgo8cGF0aCBkPSJNNiA3SDE0TTYgMTBIMTJNNiAxM0gxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 文档提取
  DocumentExtraction:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0ZBNTk1RiIvPgo8cGF0aCBkPSJNNyA2SDEzTTcgMTBIMTNNNyAxNEgxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // HTTP请求
  HTTPRequest:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzE4OTBGRiIvPgo8cGF0aCBkPSJNNiA2TDE0IDE0TTYgMTRMMTQgNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=',
  // 过程输出
  Output:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzg4NjhGRiIvPgo8cGF0aCBkPSJNNiAxMEgxNE0xMSA3TDE0IDEwTDExIDEzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==',
};

// ==================== 类型定义 ====================

export interface StencilChildNodeV2 {
  name: string;
  icon: string;
  bgIcon: string;
  type: NodeTypeEnumV2;
  shape: NodeShapeEnumV2;
  description: string;
}

export interface StencilGroupV2 {
  name: string;
  key: string;
  children: StencilChildNodeV2[];
}

// ==================== 节点模板列表 ====================

export const asideListV2: StencilGroupV2[] = [
  {
    name: '',
    key: 'group1',
    children: [
      {
        name: '大模型',
        icon: ICONS.LLM,
        bgIcon: ICONS.LLM,
        type: NodeTypeEnumV2.LLM,
        shape: NodeShapeEnumV2.General,
        description: '调用大语言模型，使用变量和提示词生成回复',
      },
      {
        name: '插件',
        icon: ICONS.Plugin,
        bgIcon: ICONS.Plugin,
        type: NodeTypeEnumV2.Plugin,
        shape: NodeShapeEnumV2.General,
        description: '调用已配置的插件功能',
      },
      {
        name: '工作流',
        icon: ICONS.Workflow,
        bgIcon: ICONS.Workflow,
        type: NodeTypeEnumV2.Workflow,
        shape: NodeShapeEnumV2.General,
        description: '调用其他工作流',
      },
      {
        name: 'MCP',
        icon: ICONS.MCP,
        bgIcon: ICONS.MCP,
        type: NodeTypeEnumV2.MCP,
        shape: NodeShapeEnumV2.General,
        description: 'MCP 组件',
      },
    ],
  },
  {
    name: '业务逻辑',
    key: 'group2',
    children: [
      {
        name: '代码',
        icon: ICONS.Code,
        bgIcon: ICONS.Code,
        type: NodeTypeEnumV2.Code,
        shape: NodeShapeEnumV2.General,
        description: '编写代码，处理输入变量来生成返回值',
      },
      {
        name: '条件分支',
        icon: ICONS.Condition,
        bgIcon: ICONS.Condition,
        type: NodeTypeEnumV2.Condition,
        shape: NodeShapeEnumV2.General,
        description: '连接多个下游分支，根据条件执行对应分支',
      },
      {
        name: '意图识别',
        icon: ICONS.IntentRecognition,
        bgIcon: ICONS.IntentRecognition,
        type: NodeTypeEnumV2.IntentRecognition,
        shape: NodeShapeEnumV2.General,
        description: '用于用户输入的意图识别，并与预设意图选项匹配',
      },
      {
        name: '循环',
        icon: ICONS.Loop,
        bgIcon: ICONS.Loop,
        type: NodeTypeEnumV2.Loop,
        shape: NodeShapeEnumV2.Loop,
        description: '通过设定循环次数和逻辑，重复执行一系列任务',
      },
      {
        name: '继续循环',
        icon: ICONS.LoopContinue,
        bgIcon: ICONS.LoopContinue,
        type: NodeTypeEnumV2.LoopContinue,
        shape: NodeShapeEnumV2.General,
        description: '跳过当前循环，继续下一次循环',
      },
      {
        name: '终止循环',
        icon: ICONS.LoopBreak,
        bgIcon: ICONS.LoopBreak,
        type: NodeTypeEnumV2.LoopBreak,
        shape: NodeShapeEnumV2.General,
        description: '终止循环，退出循环体',
      },
    ],
  },
  {
    name: '知识&数据',
    key: 'group3',
    children: [
      {
        name: '知识库',
        icon: ICONS.Knowledge,
        bgIcon: ICONS.Knowledge,
        type: NodeTypeEnumV2.Knowledge,
        shape: NodeShapeEnumV2.General,
        description: '在选定的知识中，根据输入变量召回最匹配的信息',
      },
      {
        name: '变量',
        icon: ICONS.Variable,
        bgIcon: ICONS.Variable,
        type: NodeTypeEnumV2.Variable,
        shape: NodeShapeEnumV2.General,
        description: '用于读取和写入项目中的变量',
      },
      {
        name: '长期记忆',
        icon: ICONS.LongTermMemory,
        bgIcon: ICONS.LongTermMemory,
        type: NodeTypeEnumV2.LongTermMemory,
        shape: NodeShapeEnumV2.General,
        description: '用于调用长期记忆，获取用户的个性化信息',
      },
    ],
  },
  {
    name: '数据表',
    key: 'group4',
    children: [
      {
        name: '数据新增',
        icon: ICONS.TableDataAdd,
        bgIcon: ICONS.TableDataAdd,
        type: NodeTypeEnumV2.TableDataAdd,
        shape: NodeShapeEnumV2.General,
        description: '对选定的数据表进行数据写入',
      },
      {
        name: '数据删除',
        icon: ICONS.TableDataDelete,
        bgIcon: ICONS.TableDataDelete,
        type: NodeTypeEnumV2.TableDataDelete,
        shape: NodeShapeEnumV2.General,
        description: '对选定的数据表根据指定ID进行数据删除',
      },
      {
        name: '数据更新',
        icon: ICONS.TableDataUpdate,
        bgIcon: ICONS.TableDataUpdate,
        type: NodeTypeEnumV2.TableDataUpdate,
        shape: NodeShapeEnumV2.General,
        description: '对选定的数据表根据指定条件进行数据更新',
      },
      {
        name: '数据查询',
        icon: ICONS.TableDataQuery,
        bgIcon: ICONS.TableDataQuery,
        type: NodeTypeEnumV2.TableDataQuery,
        shape: NodeShapeEnumV2.General,
        description: '对选定的数据表根据指定条件进行数据查询',
      },
      {
        name: 'SQL自定义',
        icon: ICONS.TableSQL,
        bgIcon: ICONS.TableSQL,
        type: NodeTypeEnumV2.TableSQL,
        shape: NodeShapeEnumV2.General,
        description: '使用 SQL 语句对数据表进行操作',
      },
    ],
  },
  {
    name: '组件&工具',
    key: 'group5',
    children: [
      {
        name: '问答',
        icon: ICONS.QA,
        bgIcon: ICONS.QA,
        type: NodeTypeEnumV2.QA,
        shape: NodeShapeEnumV2.General,
        description: '支持中间向用户提问问题',
      },
      {
        name: '文本处理',
        icon: ICONS.TextProcessing,
        bgIcon: ICONS.TextProcessing,
        type: NodeTypeEnumV2.TextProcessing,
        shape: NodeShapeEnumV2.General,
        description: '用于处理多个字符串类型变量的格式',
      },
      {
        name: '文档提取',
        icon: ICONS.DocumentExtraction,
        bgIcon: ICONS.DocumentExtraction,
        type: NodeTypeEnumV2.DocumentExtraction,
        shape: NodeShapeEnumV2.General,
        description: '用于提取文档内容，支持多种文件类型',
      },
      {
        name: 'HTTP请求',
        icon: ICONS.HTTPRequest,
        bgIcon: ICONS.HTTPRequest,
        type: NodeTypeEnumV2.HTTPRequest,
        shape: NodeShapeEnumV2.General,
        description: '用于配置HTTP请求调用已有的服务',
      },
    ],
  },
  {
    name: '输出',
    key: 'group6',
    children: [
      {
        name: '过程输出',
        icon: ICONS.Output,
        bgIcon: ICONS.Output,
        type: NodeTypeEnumV2.Output,
        shape: NodeShapeEnumV2.General,
        description: '支持中间过程的消息输出，支持流式和非流式两种方式',
      },
    ],
  },
];

// ==================== 循环类型选项 ====================

export const loopTypeOptionsV2 = [
  { label: '使用数组循环', value: 'ARRAY_LOOP' },
  { label: '指定次数循环', value: 'SPECIFY_TIMES_LOOP' },
  { label: '无限循环', value: 'INFINITE_LOOP' },
];

// ==================== 条件比较选项 ====================

export const conditionOptionsV2 = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '大于', value: 'GREATER_THAN', displayValue: '>' },
  { label: '大于等于', value: 'GREATER_THAN_OR_EQUAL', displayValue: '≥' },
  { label: '小于', value: 'LESS_THAN', displayValue: '<' },
  { label: '小于等于', value: 'LESS_THAN_OR_EQUAL', displayValue: '≤' },
  { label: '长度大于', value: 'LENGTH_GREATER_THAN', displayValue: '>' },
  {
    label: '长度大于等于',
    value: 'LENGTH_GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  { label: '长度小于', value: 'LENGTH_LESS_THAN', displayValue: '<' },
  {
    label: '长度小于等于',
    value: 'LENGTH_LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  { label: '包含', value: 'CONTAINS', displayValue: '⊃' },
  { label: '不包含', value: 'NOT_CONTAINS', displayValue: '⊅' },
  { label: '匹配正则表达式', value: 'MATCH_REGEX', displayValue: '~' },
  { label: '为空', value: 'IS_NULL', displayValue: '∅' },
  { label: '不为空', value: 'NOT_NULL', displayValue: '!∅' },
];

// ==================== 数据类型选项 ====================

export const dataTypesV2 = [
  { label: 'String', value: 'String' },
  { label: 'Integer', value: 'Integer' },
  { label: 'Number', value: 'Number' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Object', value: 'Object' },
  { label: 'Array<String>', value: 'Array_String' },
  { label: 'Array<Integer>', value: 'Array_Integer' },
  { label: 'Array<Number>', value: 'Array_Number' },
  { label: 'Array<Boolean>', value: 'Array_Boolean' },
  { label: 'Array<Object>', value: 'Array_Object' },
  {
    label: 'File',
    value: 'File',
    children: [
      { label: 'Default', value: 'File_Default' },
      { label: 'Doc', value: 'File_Doc' },
      { label: 'Excel', value: 'File_Excel' },
      { label: 'PPT', value: 'File_PPT' },
      { label: 'Txt', value: 'File_Txt' },
      { label: 'Image', value: 'File_Image' },
      { label: 'Audio', value: 'File_Audio' },
      { label: 'Video', value: 'File_Video' },
      { label: 'PDF', value: 'File_PDF' },
    ],
  },
  {
    label: 'Array<File>',
    value: 'Array_File',
    children: [
      { label: 'Default', value: 'Array_File_Default' },
      { label: 'Array<Image>', value: 'Array_File_Image' },
      { label: 'Array<Doc>', value: 'Array_File_Doc' },
      { label: 'Array<Excel>', value: 'Array_File_Excel' },
      { label: 'Array<Audio>', value: 'Array_File_Audio' },
      { label: 'Array<Video>', value: 'Array_File_Video' },
    ],
  },
];

// ==================== 扁平化节点模板列表 ====================

export const NODE_TEMPLATES_V2 = asideListV2.flatMap((group) =>
  group.children.map((child) => ({
    ...child,
    group: group.name,
    groupKey: group.key,
  })),
);

// ==================== 节点类型图标映射 ====================

const NODE_TYPE_ICON_MAP: Record<string, string> = {
  [NodeTypeEnumV2.LLM]: ICONS.LLM,
  [NodeTypeEnumV2.Plugin]: ICONS.Plugin,
  [NodeTypeEnumV2.Workflow]: ICONS.Workflow,
  [NodeTypeEnumV2.MCP]: ICONS.MCP,
  [NodeTypeEnumV2.Code]: ICONS.Code,
  [NodeTypeEnumV2.Condition]: ICONS.Condition,
  [NodeTypeEnumV2.IntentRecognition]: ICONS.IntentRecognition,
  [NodeTypeEnumV2.Loop]: ICONS.Loop,
  [NodeTypeEnumV2.LoopContinue]: ICONS.LoopContinue,
  [NodeTypeEnumV2.LoopBreak]: ICONS.LoopBreak,
  [NodeTypeEnumV2.Knowledge]: ICONS.Knowledge,
  [NodeTypeEnumV2.Variable]: ICONS.Variable,
  [NodeTypeEnumV2.LongTermMemory]: ICONS.LongTermMemory,
  [NodeTypeEnumV2.TableDataAdd]: ICONS.TableDataAdd,
  [NodeTypeEnumV2.TableDataDelete]: ICONS.TableDataDelete,
  [NodeTypeEnumV2.TableDataUpdate]: ICONS.TableDataUpdate,
  [NodeTypeEnumV2.TableDataQuery]: ICONS.TableDataQuery,
  [NodeTypeEnumV2.TableSQL]: ICONS.TableSQL,
  [NodeTypeEnumV2.QA]: ICONS.QA,
  [NodeTypeEnumV2.TextProcessing]: ICONS.TextProcessing,
  [NodeTypeEnumV2.DocumentExtraction]: ICONS.DocumentExtraction,
  [NodeTypeEnumV2.HTTPRequest]: ICONS.HTTPRequest,
  [NodeTypeEnumV2.Output]: ICONS.Output,
};

/**
 * 根据节点类型获取图标
 */
export const getNodeTypeIconV2 = (type: string): string => {
  return NODE_TYPE_ICON_MAP[type] || ICONS.LLM;
};

export default {
  asideListV2,
  loopTypeOptionsV2,
  conditionOptionsV2,
  dataTypesV2,
  ICONS,
  NODE_TEMPLATES_V2,
  getNodeTypeIconV2,
};
