import { Graph } from '@antv/x6';
import { useEffect, useState } from 'react';

interface UseNodeSelectionProps {
  graph: Graph;
  nodeId: number;
}

const useNodeSelection = ({
  graph,
  nodeId,
}: UseNodeSelectionProps): boolean => {
  const [isSelected, setSelected] = useState(false);

  useEffect(() => {
    if (graph) {
      const handleNodeUnselected = ({ node }: any) => {
        if (node?.getData()?.id === nodeId) {
          setSelected(false);
        }
      };

      const handleNodeSelected = ({ node }: any) => {
        if (node?.getData()?.id === nodeId) {
          setSelected(true);
        }
      };

      graph.on('node:unselected', handleNodeUnselected);
      graph.on('node:selected', handleNodeSelected);
      const cell = graph.getCellById(nodeId.toString());
      // 初始状态检查
      setSelected(graph.isSelected(cell));

      return () => {
        graph.off('node:unselected', handleNodeUnselected);
        graph.off('node:selected', handleNodeSelected);
      };
    }
  }, [graph, nodeId]);

  return isSelected;
};

export default useNodeSelection;
