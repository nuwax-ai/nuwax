/**
 * 知识图谱状态管理
 */
import { create } from 'zustand';
import type { EditModalData, GraphData, GraphNode } from '../types/graph';
import { filterGraphData } from '../utils/dataConverter';

interface GraphState {
  // 数据
  graphData: GraphData;
  filteredData: GraphData;

  // UI状态
  selectedNode: string | null;
  selectedEdge: string | null;
  searchKeyword: string;

  // 弹窗
  editModalVisible: boolean;
  editModalData: EditModalData | null;

  // 详情面板
  detailPanelVisible: boolean;
  detailPanelNode: GraphNode | null;

  // Actions
  setGraphData: (data: GraphData) => void;
  setFilteredData: (data: GraphData) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;

  // 弹窗操作
  openEditModal: (data: EditModalData) => void;
  closeEditModal: () => void;

  // 详情面板操作
  openDetailPanel: (node: GraphNode) => void;
  closeDetailPanel: () => void;

  // 数据操作
  updateNode: (id: string, label: string, fullText: string) => void;
  updateEdge: (id: string, label: string, fullText: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;

  // 搜索
  search: (keyword: string) => void;

  // 重置
  reset: () => void;
}

const initialState = {
  graphData: { nodes: [], edges: [] },
  filteredData: { nodes: [], edges: [] },
  selectedNode: null,
  selectedEdge: null,
  searchKeyword: '',
  editModalVisible: false,
  editModalData: null,
  detailPanelVisible: false,
  detailPanelNode: null,
};

export const useGraphStore = create<GraphState>((set, get) => ({
  ...initialState,

  // Actions
  setGraphData: (data) => set({ graphData: data, filteredData: data }),
  setFilteredData: (data) => set({ filteredData: data }),
  setSelectedNode: (id) => set({ selectedNode: id }),
  setSelectedEdge: (id) => set({ selectedEdge: id }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  openEditModal: (data) => set({ editModalVisible: true, editModalData: data }),
  closeEditModal: () => set({ editModalVisible: false, editModalData: null }),

  openDetailPanel: (node) =>
    set({ detailPanelVisible: true, detailPanelNode: node }),
  closeDetailPanel: () =>
    set({
      detailPanelVisible: false,
      detailPanelNode: null,
      selectedNode: null,
    }),

  updateNode: (id, label, fullText) => {
    const { graphData, searchKeyword } = get();
    const nodes = graphData.nodes.map((node) =>
      node.id === id ? { ...node, label, fullText } : node,
    );
    const newData = { ...graphData, nodes };
    set({
      graphData: newData,
      filteredData: searchKeyword
        ? filterGraphData(newData, searchKeyword)
        : newData,
    });
  },

  updateEdge: (id, label, fullText) => {
    const { graphData, searchKeyword } = get();
    const edges = graphData.edges.map((edge) =>
      edge.id === id ? { ...edge, label, fullText } : edge,
    );
    const newData = { ...graphData, edges };
    set({
      graphData: newData,
      filteredData: searchKeyword
        ? filterGraphData(newData, searchKeyword)
        : newData,
    });
  },

  deleteNode: (id) => {
    const { graphData, searchKeyword } = get();
    const nodes = graphData.nodes.filter((n) => n.id !== id);
    const edges = graphData.edges.filter(
      (e) => e.source !== id && e.target !== id,
    );
    const newData = { nodes, edges };
    set({
      graphData: newData,
      filteredData: searchKeyword
        ? filterGraphData(newData, searchKeyword)
        : newData,
    });
  },

  deleteEdge: (id) => {
    const { graphData, searchKeyword } = get();
    const edges = graphData.edges.filter((e) => e.id !== id);
    const newData = { ...graphData, edges };
    set({
      graphData: newData,
      filteredData: searchKeyword
        ? filterGraphData(newData, searchKeyword)
        : newData,
    });
  },

  search: (keyword) => {
    const { graphData } = get();
    set({
      searchKeyword: keyword,
      filteredData: keyword ? filterGraphData(graphData, keyword) : graphData,
    });
  },

  reset: () =>
    set({
      ...initialState,
      graphData: { nodes: [], edges: [] },
      filteredData: { nodes: [], edges: [] },
    }),
}));
