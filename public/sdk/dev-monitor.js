/**
 * 开发环境监控脚本
 * 提供错误监控、历史记录追踪、父窗口通信功能
 */

(function () {
  'use strict';

  // 配置
  const config = {
    version: '1.0.0',
    enabled: true,
    logLevel: 'error', // 只记录错误级别日志
    maxErrors: 10, // 减少存储量
    maxLogs: 20, // 减少存储量
  };

  // 简化的监控数据存储
  const monitorData = {
    errors: [],
    basicInfo: {
      url: window.location.href,
      userAgent: navigator.userAgent.split(' ')[0], // 只保留浏览器名称
    },
    historyChanges: [], // 历史记录变化
    ready: false,
  };

  // 简化的日志函数 - 只记录错误
  const logger = {
    error: (message, details = null) => {
      console.error('[Dev-Monitor ERROR]', message, details || '');

      const errorData = {
        message: typeof message === 'string' ? message : message.toString(),
        details: details ? JSON.stringify(details).substring(0, 200) : null, // 限制详细信息长度
        timestamp: Date.now(),
      };

      monitorData.errors.push(errorData);

      // 限制错误数量
      if (monitorData.errors.length > config.maxErrors) {
        monitorData.errors.shift();
      }

      // ⭐ 立即发送错误消息到父窗口（实时通知）
      // 检查是否在 iframe 中运行（使用多种方式检测）
      const isInIframe = window.self !== window.top;
      const hasParent = !!window.parent;
      const parentEqualsWindow = window.parent === window;
      const parentEqualsSelf = window.parent === window.self;
      const parentEqualsTop = window.parent === window.top;

      console.log('[DevMonitor] 🔍 Checking parent window:', {
        isInIframe: isInIframe,
        hasParent: hasParent,
        parentEqualsWindow: parentEqualsWindow,
        parentEqualsSelf: parentEqualsSelf,
        parentEqualsTop: parentEqualsTop,
        location: window.location.href,
        parentLocation: window.parent
          ? (() => {
              try {
                return window.parent.location?.href || 'N/A (cross-origin)';
              } catch (e) {
                return 'N/A (cross-origin - access denied)';
              }
            })()
          : 'N/A',
        topLocation: window.top
          ? (() => {
              try {
                return window.top.location?.href || 'N/A (cross-origin)';
              } catch (e) {
                return 'N/A (cross-origin - access denied)';
              }
            })()
          : 'N/A',
      });

      // ⭐ 关键修复：使用 isInIframe 作为主要判断条件
      // 如果在 iframe 中（window.self !== window.top），就尝试发送消息
      if (isInIframe && window.parent) {
        try {
          const errorMessage = {
            type: 'dev-monitor-error', // 实时错误消息类型
            error: errorData,
            errorCount: monitorData.errors.length,
            url: monitorData.basicInfo.url,
            timestamp: Date.now(),
          };
          console.log(
            '[DevMonitor] 📤 Sending dev-monitor-error:',
            errorMessage,
          );
          window.parent.postMessage(errorMessage, '*');
          console.log('[DevMonitor] ✅ postMessage called successfully');
        } catch (e) {
          console.error('[DevMonitor] ❌ Failed to send error message:', e);
        }
      } else {
        console.warn(
          '[DevMonitor] ⚠️ Cannot send error message - parent check failed:',
          {
            isInIframe: isInIframe,
            hasParent: hasParent,
            parentEqualsWindow: parentEqualsWindow,
            parentEqualsSelf: parentEqualsSelf,
          },
        );
      }
    },
  };

  // 简化的错误监控
  function setupErrorMonitoring() {
    // 统一的错误处理函数 - 合并全局错误和资源加载错误监听
    window.addEventListener(
      'error',
      function (event) {
        // 全局 JavaScript 错误
        if (event.target === window || !event.target) {
          const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
          logger.error(errorMsg, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
        // 资源加载错误
        else if (event.target.tagName) {
          const source = event.target.src || event.target.href || 'unknown';
          logger.error(`Resource failed: ${source}`, {
            tagName: event.target.tagName,
            source: source,
          });
        }
      },
      true,
    ); // 使用捕获阶段同时捕获全局错误和资源错误

    // Promise 错误捕获
    window.addEventListener('unhandledrejection', function (event) {
      let errorMsg = 'Promise rejection: ';
      let errorDetails = null;

      if (event.reason instanceof Error) {
        errorMsg += event.reason.message;
        errorDetails = {
          name: event.reason.name,
          message: event.reason.message,
          stack: event.reason.stack
            ? event.reason.stack.substring(0, 200)
            : null,
        };
      } else if (typeof event.reason === 'string') {
        errorMsg += event.reason;
      } else {
        errorMsg += JSON.stringify(event.reason).substring(0, 200);
      }

      logger.error(errorMsg, errorDetails);
    });
  }

  // 移除复杂的性能监控和控制台拦截，专注于核心错误监控

  // 浏览记录变化监听
  function setupHistoryTracking() {
    // 记录当前 URL 和 hash，用于检测变化
    let currentUrl = window.location.href;
    let currentHash = window.location.hash;

    // 监听 hashchange 事件（hash 变化）
    window.addEventListener('hashchange', function () {
      const newUrl = window.location.href;
      const newHash = window.location.hash;
      if (newHash !== currentHash) {
        currentUrl = newUrl;
        currentHash = newHash;
        sendHistoryChange(
          'hashchange',
          newUrl,
          window.location.pathname + newHash,
        );
      }
    });

    // 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', function () {
      const newUrl = window.location.href;
      const newHash = window.location.hash;
      if (newUrl !== currentUrl || newHash !== currentHash) {
        currentUrl = newUrl;
        currentHash = newHash;
        sendHistoryChange(
          'popstate',
          newUrl,
          window.location.pathname + newHash,
        );
      }
    });

    // 拦截 pushState 方法
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      const newUrl = window.location.href;
      const newHash = window.location.hash;
      if (newUrl !== currentUrl || newHash !== currentHash) {
        currentUrl = newUrl;
        currentHash = newHash;
        sendHistoryChange(
          'pushState',
          newUrl,
          window.location.pathname + newHash,
          args[2],
        );
      }
    };

    // 拦截 replaceState 方法
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      const newUrl = window.location.href;
      const newHash = window.location.hash;
      if (newUrl !== currentUrl || newHash !== currentHash) {
        currentUrl = newUrl;
        currentHash = newHash;
        sendHistoryChange(
          'replaceState',
          newUrl,
          window.location.pathname + newHash,
          args[2],
        );
      }
    };

    /**
     * 发送历史变化消息到父窗口
     * @param {string} type - 历史变化类型: initial | pushState | replaceState | popstate | hashchange
     * @param {string} url - 完整的 URL
     * @param {string} pathname - 路径名（包含 hash）
     * @param {*} state - history state 对象
     */
    function sendHistoryChange(type, url, pathname, state = null) {
      // 安全序列化 state 对象，防止 postMessage 序列化错误
      let serializedState = null;
      if (state !== null && state !== undefined) {
        try {
          serializedState = JSON.parse(JSON.stringify(state));
        } catch (e) {
          // 如果序列化失败，使用 toString 或 '[Non-serializable]'
          serializedState = state.toString
            ? state.toString()
            : '[Non-serializable]';
        }
      }

      const changeData = {
        historyType: type,
        url: url,
        pathname: pathname,
        state: serializedState,
        timestamp: Date.now(),
      };

      // 记录到 monitorData（存储序列化后的数据）
      monitorData.historyChanges.push(changeData);

      // 限制历史记录数量
      if (monitorData.historyChanges.length > config.maxLogs) {
        monitorData.historyChanges.shift();
      }

      // 发送消息到父窗口
      if (window.parent && window.parent !== window) {
        try {
          const message = {
            type: 'dev-monitor-history-change',
            ...changeData,
          };

          window.parent.postMessage(message, '*');
        } catch (e) {
          // 静默处理错误
        }
      }
    }

    // 初始发送当前 URL
    setTimeout(() => {
      sendHistoryChange(
        'initial',
        currentUrl,
        window.location.pathname + currentHash,
      );
    }, 100);
  }

  // 简化的初始化
  function init() {
    // ⭐ 初始化时检查运行环境
    const isInIframe = window.self !== window.top;

    setupErrorMonitoring();
    setupHistoryTracking();
    monitorData.ready = true;

    // 简化的控制台提示
    console.log('[DevMonitor] 🚀 Initializing...', {
      version: config.version,
      isInIframe: isInIframe,
      hasParent: !!window.parent,
      parentEqualsWindow: window.parent === window,
      location: window.location.href,
      canSendMessages: window.parent && window.parent !== window,
    });
  }

  // 立即初始化
  init();
})();
