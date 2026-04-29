import type { EditModalData, GraphData } from './graph';

export interface GraphCanvasProps {
  data: GraphData;
  width?: number;
  height?: number;
}

export interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onClear: () => void;
}

export interface EditModalProps {
  visible: boolean;
  data: EditModalData | null;
  onClose: () => void;
  onSave: (data: EditModalData) => void;
  onDelete: (id: string, type: 'node' | 'edge') => void;
}

export interface ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onReset: () => void;
}
