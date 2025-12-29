/**
 * File Download Manager
 * 负责在 file-preview.html 中渲染悬浮下载按钮，并处理多端（浏览器、微信小程序、微信WebView）的下载逻辑
 */
class DownloadManager {
    /**
     * @param {Object} options
     * @param {string} options.url - 文件下载链接
     * @param {string} options.fileName - 文件名
     * @param {HTMLElement} [options.container] - 容器元素，默认为 body
     */
    constructor(options) {
        this.url = options.url;
        this.fileName = options.fileName || 'file';
        this.container = options.container || document.body;
        this.button = null;
    }

    /**
     * 初始化：渲染按钮并绑定事件
     */
    init() {
        if (!this.url) {
            console.warn('[DownloadManager] URL is required');
            return;
        }
        this.renderStyles();
        this.renderButton();
    }

    /**
     * 销毁：移除按钮和样式
     */
    destroy() {
        if (this.button) {
            this.button.remove();
            this.button = null;
        }
        const style = document.getElementById('download-manager-style');
        if (style) {
            style.remove();
        }
    }

    /**
     * 渲染 CSS 样式
     */
    renderStyles() {
        if (document.getElementById('download-manager-style')) return;

        const css = `
            .download-fab {
                position: fixed;
                right: 24px;
                bottom: 80px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: #1890ff;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 1000;
                border: none;
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            .download-fab:hover {
                background-color: #40a9ff;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            }
            
            .download-fab:active {
                background-color: #096dd9;
                transform: translateY(0);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            }
            
            .download-fab svg {
                width: 24px;
                height: 24px;
                fill: #fff;
            }
            
            @media (max-width: 768px) {
                .download-fab {
                    right: 16px;
                    bottom: 60px;
                    width: 44px;
                    height: 44px;
                }
                .download-fab svg {
                    width: 20px;
                    height: 20px;
                }
            }
        `;

        const style = document.createElement('style');
        style.id = 'download-manager-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * 渲染悬浮按钮
     */
    renderButton() {
        if (this.button) return;

        const btn = document.createElement('button');
        btn.className = 'download-fab';
        btn.title = '下载文件';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;

        btn.addEventListener('click', () => this.handleDownload());
        this.container.appendChild(btn);
        this.button = btn;
    }

    /**
     * 处理下载逻辑
     */
    handleDownload() {
        console.log('[DownloadManager] Clicked download:', this.url);

        // 1. 微信小程序环境 (WebView)
        if (this.isMiniProgram()) {
            this.downloadInMiniProgram();
            return;
        }

        // 2. 微信 H5 环境 (公众号/普通聊天)
        if (this.isWeChatH5()) {
            this.downloadInWeChatH5();
            return;
        }

        // 3. 普通浏览器环境
        this.downloadInBrowser();
    }

    /**
     * 检测是否为微信小程序环境
     */
    isMiniProgram() {
        return window.__wxjs_environment === 'miniprogram' ||
            /miniprogram/i.test(navigator.userAgent);
    }

    /**
     * 检测是否为微信 H5 环境
     */
    isWeChatH5() {
        return /MicroMessenger/i.test(navigator.userAgent) && !this.isMiniProgram();
    }

    /**
     * 微信小程序下载逻辑 (JSSDK)
     * 由于小程序 WebView 无法直接下载文件，尝试使用 JSSDK 的能力
     */
    downloadInMiniProgram() {
        console.log('[DownloadManager] Downloading in MiniProgram environment');

        // 1. Image: use wx.previewImage (JSSDK)
        const fileType = this.getFileType();
        if (['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'].includes(fileType)) {
            if (typeof wx !== 'undefined' && wx.previewImage) {
                wx.previewImage({
                    current: this.url,
                    urls: [this.url]
                });
                return;
            }
        }

        // 2. Other files: Navigate to native file preview page to handle download/open
        // We need to pass url and name. 
        // Assuming /subpackages/pages/file-preview-page/file-preview-page can handle 'url' and 'name' params directly
        // or we need to modify it.
        // For now, let's assume we can navigate to it. 
        if (typeof wx !== 'undefined' && wx.miniProgram) {
            const targetUrl = `/subpackages/pages/file-preview-page/file-preview-page?url=${encodeURIComponent(this.url)}&name=${encodeURIComponent(this.fileName)}`;
            wx.miniProgram.navigateTo({
                url: targetUrl,
                success: () => console.log('Navigated to native preview'),
                fail: (err) => {
                    console.error('Navigate failed', err);
                    // Fallback if navigate fails (e.g. tab bar page or depth limit)
                    this.showToast('请复制链接在浏览器中打开');
                }
            });
        }
    }

    /**
     * 微信 H5 下载逻辑
     * 微信浏览器屏蔽了直接下载，通常需要提示在浏览器打开，或者如果链接是预览类型的(如图片)可以直接打开
     */
    downloadInWeChatH5() {
        console.log('[DownloadManager] Downloading in WeChat H5');

        // 尝试直接下载，如果不行，通常需要引导用户"在浏览器打开"
        // 这里简单实现，尝试 window.location 跳转
        window.location.href = this.url;
    }

    /**
     * 普通浏览器下载逻辑
     */
    async downloadInBrowser() {
        console.log('[DownloadManager] Downloading in Browser');

        try {
            // First try to fetch as blob to force download (solves cross-origin open-in-tab issue)
            // But only if it looks like a text/image/json type that might be opened by browser
            // Or just try for everything.
            const response = await fetch(this.url);
            if (!response.ok) throw new Error('Fetch failed');

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = this.fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

        } catch (e) {
            console.warn('[DownloadManager] Fetch download failed, fallback to direct link', e);
            // Fallback: regular anchor tag
            try {
                const link = document.createElement('a');
                link.href = this.url;
                link.download = this.fileName;
                link.target = '_blank'; // Open in new tab if download is ignored
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e2) {
                console.error('[DownloadManager] Direct link download failed', e2);
                window.open(this.url, '_blank');
            }
        }
    }

    /**
     * 获取文件后缀
     */
    getFileType() {
        try {
            return this.url.split('.').pop().split('?')[0].toLowerCase();
        } catch (e) {
            return '';
        }
    }

    /**
     * 简单的 Toast提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 2000;
            font-size: 14px;
            pointer-events: none;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    }
}

// 暴露到全局 window
window.DownloadManager = DownloadManager;
