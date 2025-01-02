// customNodes/index.ts

import { Graph } from '@antv/x6';

// 连接桩的样式
const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
  },
  items: [
    {
      group: 'top',
    },
    {
      group: 'right',
    },
    {
      group: 'bottom',
    },
    {
      group: 'left',
    },
  ],
};
const registerCustomNodes = () => {
  // 注册 general-Node 节点
  Graph.registerNode(
    'general-Node',
    {
      inherit: 'rect', // 继承矩形节点的基本属性
      width: 340,
      height: 83,
      markup: [
        {
          tagName: 'rect',
          selector: 'body',
        },
        {
          tagName: 'image',
          selector: 'image',
        },
        {
          tagName: 'text',
          selector: 'title',
        },
        {
          tagName: 'text',
          selector: 'content',
        },
      ],
      attrs: {
        body: {
          boxShadow: '10px 10px 5px #888888;',
          stroke: '#000',
          fill: '#fff',
          rx: 10,
          ry: 10,
        },
        image: {
          width: 20,
          height: 20,
          x: 10,
          y: 12, // 将图片稍微下移一点，使标题与之对齐
        },
        title: {
          ref: 'image', // 相对于 image 元素定位
          x: 36, // 在 image 的右侧开始
          refY: 0.5, // 垂直居中对齐
          dy: -7, // 微调垂直位置以确保文本居中（根据字体大小调整）
          fontSize: 14,
          fill: '#3D3D3D',
        },
        content: {
          ref: 'image', // 相对于 body 元素定位
          x: 20, // 从左边距开始
          y: 30, // 放置在 title 下面一行
          fontSize: 12,
          fill: '#000',
        },
        moreOptions: {
          ref: 'body', // 相对于 body 元素定位
          x: 320, // 放置在最右边
          y: 10, // 垂直居中
          dx: -10, // 向左微调以放置三个点
          width: 20, // 右侧三个点的宽度
          height: 20, // 右侧三个点的高度
          fill: '#000', // 右侧三个点的填充颜色
        },
      },
      ports: { ...ports },
    },
    true,
  );

  // 在这里你可以继续注册其他的自定义节点
  // Graph.registerNode('another-node', {...}, true);
};

export default registerCustomNodes;
