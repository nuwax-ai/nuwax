/**
 * 本地 Mock：Agent 干预响应（ACP 权限 + MCP Ask/Question）
 */
export default {
  'POST /api/agent-interventions/:interventionId/respond': (
    req: { body?: Record<string, unknown> },
    res: { json: (body: unknown) => void },
  ) => {
    const body = req.body || {};
    if (body.mcp_ask_resolve || body.source === 'mcp_ask') {
      res.json({
        code: '0000',
        message: 'ok',
        data: { mocked: true, type: 'mcp_ask' },
      });
      return;
    }
    res.json({
      code: '0000',
      message: 'ok',
      data: { mocked: true, type: 'permission' },
    });
  },
};
