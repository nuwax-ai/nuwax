export const MCP_ASK_MOCK_REQUEST_ID_PREFIX = 'ask_mock';

export function isMockMcpAskRequestId(requestId: string): boolean {
  return requestId.startsWith(MCP_ASK_MOCK_REQUEST_ID_PREFIX);
}
