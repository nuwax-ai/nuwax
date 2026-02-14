import React, { useEffect, useState } from 'react';

/**
 * 打开iframe页面
 * @description 打开iframe页面，用于打开外部链接
 */
const OpenIframePage: React.FC = () => {
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const iframeUrl = url.get('url');
    if (iframeUrl) {
      setIframeUrl(decodeURIComponent(iframeUrl));
    }
  }, []);

  return (
    <div className="h-full w-full">
      <iframe src={iframeUrl} width="100%" height="100%" />
    </div>
  );
};

export default OpenIframePage;
