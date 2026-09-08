/**
 * 会话/消息分享 Mock(需求 5c,mock 打通全链路)。
 *
 * 后端分享接口(/api/agent/conversation/share)当前 type 仅支持文件与桌面,
 * 会话/消息分享契约定型前,前端以独立路径走本 mock 全链路验收:
 * 入口 → ConversationShareModal(POST /api/agent/conversation/share-md)
 *   → /static/file-preview.html?sk= (静态页零改动)
 *   → GET detail(形态对齐真实接口,返回 .md 相对路径 content)
 *   → GET /api/conversation-share-md/:sk/:title.md(markdown 正文)
 *
 * TODO(后端):真实接口支持会话/消息 type 后,service 切回
 * /api/agent/conversation/share 并删除本文件,弹窗与落地页链路不变。
 */

interface MockShareRecord {
  kind: 'MESSAGE' | 'CONVERSATION';
  title: string;
  markdown: string;
  allowDownload: boolean;
  expireAt: number | null;
}

const shareStore = new Map<string, MockShareRecord>();

const genShareKey = () =>
  `md${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default {
  'POST /api/agent/conversation/share-md': (
    req: { body: Record<string, unknown> },
    res: {
      json: (payload: unknown) => void;
    },
  ) => {
    const { kind, title, markdown, expireSeconds, allowDownload } =
      req.body as Partial<MockShareRecord> & { expireSeconds?: number | null };
    if (!markdown || !kind) {
      res.json({ code: '4000', message: 'invalid share params', data: null });
      return;
    }
    const shareKey = genShareKey();
    shareStore.set(shareKey, {
      kind,
      title: title || 'shared',
      markdown,
      allowDownload: Boolean(allowDownload),
      expireAt: expireSeconds ? Date.now() + expireSeconds * 1000 : null,
    });
    res.json({
      code: '0000',
      message: 'ok',
      data: { shareKey },
      success: true,
    });
  },

  // 详情:形态对齐真实接口(file-preview.js 按 data.content 相对路径 + 后缀识别类型)
  'GET /api/agent/conversation/share-md/detail/:sk': (
    req: { params: { sk: string } },
    res: { json: (payload: unknown) => void },
  ) => {
    const record = shareStore.get(req.params.sk);
    if (!record) {
      res.json({ code: '4004', message: 'share not found', data: null });
      return;
    }
    if (record.expireAt && record.expireAt < Date.now()) {
      res.json({ code: '4005', message: 'share expired', data: null });
      return;
    }
    // 标题拼进相对路径:静态页取路径末段为文件名、按 .md 后缀识别类型。
    // 标题不 encode——静态页直接取原始字符串作文件名(sanitize 已清理路径危险字符),
    // fetch 时浏览器自动编码中文/空格,本 mock 路由按 express 语义收到 decode 后参数。
    res.json({
      code: '0000',
      message: 'ok',
      data: {
        type: record.kind,
        content: `/api/conversation-share-md/${req.params.sk}/${record.title}.md`,
        expireTime: record.expireAt,
      },
      success: true,
    });
  },

  // markdown 正文(路径中文由 express 语义自动 decode)
  'GET /api/conversation-share-md/:sk/:title': (
    req: { params: { sk: string }; query: Record<string, string> },
    res: {
      set: (key: string, value: string) => void;
      send: (body: string) => void;
      status: (code: number) => { json: (payload: unknown) => void };
    },
  ) => {
    const record = shareStore.get(req.params.sk);
    if (!record) {
      res.status(404).json({ code: '4004', message: 'share not found' });
      return;
    }
    if (record.expireAt && record.expireAt < Date.now()) {
      res.status(410).json({ code: '4005', message: 'share expired' });
      return;
    }
    res.set('Content-Type', 'text/markdown; charset=utf-8');
    res.send(record.markdown);
  },
};
