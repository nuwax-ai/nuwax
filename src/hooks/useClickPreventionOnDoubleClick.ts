import React from 'react';

const cancellablePromise = (promise: Promise<any>) => {
  let isCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (value) => (isCanceled ? reject({ isCanceled, value }) : resolve(value)),
      (error) => reject({ isCanceled, error }),
    );
  });

  return {
    promise: wrappedPromise,
    cancel: () => (isCanceled = true),
  };
};

const delay = (n: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, n)); // eslint-disable-line

const useCancellablePromises = () => {
  const pendingPromises = React.useRef<any[]>([]);

  const appendPendingPromise = (promise: any) =>
    (pendingPromises.current = [...pendingPromises.current, promise]);

  const removePendingPromise = (promise: any) =>
    (pendingPromises.current = pendingPromises.current.filter(
      (p) => p !== promise,
    ));

  const clearPendingPromises = () =>
    pendingPromises.current.map((p: any) => p.cancel());

  const api = {
    appendPendingPromise,
    removePendingPromise,
    clearPendingPromises,
  };

  return api;
};

export default function useClickPreventionOnDoubleClick(
  onClick: (e: React.MouseEvent) => void,
  onDoubleClick: (e: React.MouseEvent) => void,
) {
  const api = useCancellablePromises();

  const handleClick = (e: React.MouseEvent) => {
    api.clearPendingPromises();
    const waitForClick = cancellablePromise(delay(300));
    api.appendPendingPromise(waitForClick);

    return waitForClick.promise
      .then(() => {
        api.removePendingPromise(waitForClick);
        onClick(e);
      })
      .catch((errorInfo: any) => {
        api.removePendingPromise(waitForClick);
        if (!errorInfo.isCanceled) {
          throw errorInfo.error;
        }
      });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    api.clearPendingPromises();
    onDoubleClick(e);
  };

  return [handleClick, handleDoubleClick];
}
