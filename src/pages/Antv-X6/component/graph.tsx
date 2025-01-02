// graph.ts 文件
import { Graph, Shape } from '@antv/x6';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Transform } from '@antv/x6-plugin-transform';
import { GraphProp } from '../type';

const initGraph = ({ containerId, changeDrawer }: GraphProp) => {
  const graphContainer = document.getElementById(containerId);
  if (!graphContainer) throw new Error('Container not found');

  // 创建图形实例
  const graph = new Graph({
    container: graphContainer,
    grid: true,
    mousewheel: {
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 3,
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0,
        });
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet;
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
          },
        },
      },
    },
  });

  // 使用插件
  graph
    .use(new Transform({ resizing: true, rotating: true }))
    .use(new Selection({ rubberband: true, showNodeSelectionBox: true }))
    .use(new Snapline())
    .use(new Keyboard())
    .use(new Clipboard())
    .use(new History());

  // 控制连接桩显示/隐藏
  const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
    for (let i = 0, len = ports.length; i < len; i += 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden';
    }
  };

  // 监听鼠标进入和离开节点的事件
  graph.on('node:mouseenter', () => {
    const ports = graphContainer.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(ports, true);
  });

  graph.on('node:mouseleave', () => {
    const ports = graphContainer.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(ports, false);
  });

  graph.on('node:click', ({ node }) => {
    // 尝试使用 get 方法来获取 data 属性
    const data = node.getData();
    changeDrawer(data);
  });

  return graph;
};

export default initGraph;
