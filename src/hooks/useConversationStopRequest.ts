import { useCallback, useEffect, useRef, useState } from 'react';

/** 停止只提交请求；保留流连接直到后台终态，失败允许再次停止。 */
export function useConversationStopRequest(
  conversationId: number | string | null | undefined,
  isActive: boolean,
  request: (id: string) => Promise<unknown>,
) {
  const [isStopping, setIsStopping] = useState(false);
  const ownerId = useRef(conversationId);
  ownerId.current = conversationId;
  const state = useRef({
    generation: 0,
    stopping: false,
    promise: null as Promise<unknown> | null,
  });
  useEffect(() => {
    state.current.generation += 1;
    state.current.stopping = false;
    state.current.promise = null;
    setIsStopping(false);
  }, [conversationId]);
  useEffect(() => {
    if (isActive) return;
    state.current.generation += 1;
    state.current.stopping = false;
    state.current.promise = null;
    setIsStopping(false);
  }, [isActive]);
  useEffect(
    () => () => {
      state.current.generation += 1;
    },
    [],
  );

  const stop = useCallback(
    (id: number | string) => {
      if (String(id) !== String(ownerId.current)) return Promise.resolve();
      if (state.current.stopping)
        return state.current.promise ?? Promise.resolve();
      const generation = ++state.current.generation;
      state.current.stopping = true;
      setIsStopping(true);
      const promise = Promise.resolve()
        .then(() => request(String(id)))
        .catch((error) => {
          if (state.current.generation === generation) {
            state.current.stopping = false;
            state.current.promise = null;
            setIsStopping(false);
          }
          throw error;
        });
      state.current.promise = promise;
      return promise;
    },
    [request],
  );
  return { stop, isStopping, isStopPending: () => state.current.stopping };
}
