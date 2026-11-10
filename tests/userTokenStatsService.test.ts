import {
  apiGetUserTokenRank,
  apiGetUserTokenTrend,
  apiSearchUsageUsers,
} from '@/services/systemManage';
import { parseInt64Json } from '@/utils/parseInt64Json';
import { describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('umi', () => ({ request }));

describe('用户 Token 统计服务契约', () => {
  it('排名和趋势保留精确 int64，继续走统一 request 的鉴权及错误处理', async () => {
    request.mockImplementation(async (url, options) =>
      options.transformResponse[0](
        url.endsWith('user-rank')
          ? '{"code":"0000","data":{"records":[{"rank":1,"userId":9007199254740993,"totalTokens":9223372036854775807}],"total":1,"pageNum":1,"pageSize":20}}'
          : '{"code":"0000","data":[{"dt":"20261101","totalTokens":9223372036854775807}]}',
      ),
    );
    const signal = new AbortController().signal;
    const options = { signal, skipErrorHandler: true };
    const rankParams = {
      dtStart: '20261101',
      dtEnd: '20261106',
      sortField: 'totalTokens' as const,
      pageNum: 2,
      pageSize: 20,
    };
    const rank = await apiGetUserTokenRank(rankParams, options);
    expect(request).toHaveBeenLastCalledWith(
      '/api/system/bill/resource-stat/user-rank',
      expect.objectContaining({
        method: 'GET',
        params: rankParams,
        ...options,
      }),
    );
    expect(rank.data.records[0].userId).toBe('9007199254740993');
    expect(rank.data.records[0].totalTokens).toBe('9223372036854775807');
    const trendParams = {
      userId: String(rank.data.records[0].userId),
      dtStart: '20261101',
      dtEnd: '20261106',
    };
    const trend = await apiGetUserTokenTrend(trendParams, options);
    expect(request).toHaveBeenLastCalledWith(
      '/api/system/bill/resource-stat/user-trend',
      expect.objectContaining({
        method: 'GET',
        params: trendParams,
        ...options,
      }),
    );
    expect(trend.data[0].totalTokens).toBe('9223372036854775807');
  });

  it('用户名和手机号复用用户管理的分页筛选契约，用户 ID 不丢精度', async () => {
    request.mockImplementation(async (_url, options) =>
      options.transformResponse[0](
        '{"code":"0000","data":{"records":[{"id":9007199254740993,"userName":"account","nickName":"name"}],"total":1}}',
      ),
    );
    const signal = new AbortController().signal;
    for (const kw of ['account', '13800138000']) {
      const params = { pageNo: 2, pageSize: 20, queryFilter: { userName: kw } };
      const result = await apiSearchUsageUsers(params, {
        signal,
        skipErrorHandler: true,
      });
      expect(request).toHaveBeenLastCalledWith(
        '/api/system/user/list',
        expect.objectContaining({
          method: 'POST',
          data: params,
          signal,
          skipErrorHandler: true,
        }),
      );
      expect(result.data.records[0].id).toBe('9007199254740993');
    }
  });

  it('只转换不安全整数，不改写字符串、转义引号、小数和指数', () => {
    const text =
      '{"nickName":"a\\"9007199254740993\\\\b","dt":"20261101","creditAmount":1.25,"small":9007199254740991,"negative":-9007199254740993,"exponent":1.5e3}';
    expect(parseInt64Json(text)).toEqual({
      nickName: 'a"9007199254740993\\b',
      dt: '20261101',
      creditAmount: 1.25,
      small: 9007199254740991,
      negative: '-9007199254740993',
      exponent: 1500,
    });
    expect(parseInt64Json('{"code":"4011","data":null}')).toEqual({
      code: '4011',
      data: null,
    });
    expect(() => parseInt64Json('{broken}')).toThrow();
  });
});
