/**
 * 开发环境监控脚本
 * 提供错误监控、历史记录追踪、父窗口通信功能
 */

(function () {
  'use strict';

  // ⭐ 关键：立即保存原始 console 方法，防止被其他脚本覆盖
  const _originalConsoleError = console.error;
  const _originalConsoleWarn = console.warn;

  // 配置
  const config = {
    version: '1.0.1',
    enabled: true,
    logLevel: 'error', // 只记录错误级别日志
    maxErrors: 10, // 减少存储量
    maxLogs: 20, // 减少存储量
    mutationObserverEnabled: true, // 是否启用 MutationObserver
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
    detectedErrorElements: new Set(), // 已检测到的错误元素（避免重复报告）
    recentErrors: new Map(), // 最近报告的错误（用于去重），key: 错误消息，value: 时间戳
  };

  /**
   * 检查白屏状态并获取 document 字符串
   * 参考 Preview 组件的 checkWhiteScreen 逻辑
   * @returns {{ isWhiteScreen: boolean, documentString?: string }} 白屏检查结果
   */
  function checkWhiteScreen() {
    try {
      const doc = document;

      // 获取 document 字符串的辅助函数
      function getDocumentString() {
        try {
          let docString = '';

          // 如果没有 body，获取整个 document 的 HTML
          if (!doc || !doc.body) {
            if (doc && doc.documentElement) {
              docString = doc.documentElement.outerHTML || '';
            } else if (doc) {
              docString = doc.documentElement
                ? String(doc.documentElement)
                : String(doc);
            } else {
              docString = '[Document not available]';
            }
          } else {
            // 如果有 body，获取 body 的 HTML 结构
            // 同时也获取 head 中的关键信息（如 script 标签）
            const bodyHTML = doc.body.innerHTML || '';
            const headScripts = Array.from(doc.head.querySelectorAll('script'))
              .map((script) => script.outerHTML)
              .join('\n');
            const headStyles = Array.from(doc.head.querySelectorAll('style'))
              .map((style) => style.outerHTML)
              .join('\n');

            docString = [
              '<!-- Head Scripts -->',
              headScripts,
              '<!-- Head Styles -->',
              headStyles,
              '<!-- Body -->',
              bodyHTML,
            ]
              .filter((s) => s)
              .join('\n');
          }

          // 限制长度，避免消息过大（限制为 5000 字符）
          const maxLength = 5000;
          if (docString.length > maxLength) {
            docString =
              docString.substring(0, maxLength) +
              '\n... [truncated, total length: ' +
              docString.length +
              ']';
          }

          return docString;
        } catch (e) {
          // 获取 document 字符串失败（静默处理）
          return '[Failed to get document string: ' + String(e) + ']';
        }
      }

      // 检查白屏状态
      if (!doc || !doc.body) {
        return {
          isWhiteScreen: true,
          documentString: getDocumentString(),
        };
      }

      // 检查是否空内容
      const hasContent =
        doc.body.innerText.trim().length > 0 || doc.body.children.length > 0;
      if (!hasContent) {
        return {
          isWhiteScreen: true,
          documentString: getDocumentString(),
        };
      }

      // 检查是否存在根节点（React/Vue 挂载点）
      const appRoot = doc.querySelector('#root, #app');
      if (!appRoot) {
        return {
          isWhiteScreen: true,
          documentString: getDocumentString(),
        };
      }

      // 如果存在挂载点但内部为空，说明 React/Vite 崩溃了
      if (appRoot.children.length === 0) {
        return {
          isWhiteScreen: true,
          documentString: getDocumentString(),
        };
      }

      // 不是白屏，不返回 documentString
      return {
        isWhiteScreen: false,
      };
    } catch (error) {
      // 检测失败时，保守处理，返回 false（不认为是白屏）
      return {
        isWhiteScreen: false,
        documentString: '[White screen check failed: ' + String(error) + ']',
      };
    }
  }

  /**
   * 检查错误是否应该被过滤（已知的非关键错误）
   * @param {string} message - 错误消息
   * @param {object} details - 错误详情
   * @returns {boolean} 是否应该过滤
   */
  function shouldFilterError(message, details) {
    const messageStr = typeof message === 'string' ? message : String(message);
    const detailsStr = details ? JSON.stringify(details) : '';

    // 过滤 Monaco Editor 的 CanceledError
    if (
      messageStr.includes('Canceled') &&
      (messageStr.includes('Monaco') ||
        messageStr.includes('WordHighlighter') ||
        detailsStr.includes('Canceled'))
    ) {
      return true;
    }

    // 过滤已知的 DevMonitor 自身日志
    if (
      messageStr.includes('[DevMonitor]') ||
      messageStr.includes('[Dev-Monitor') ||
      messageStr.includes('DevMonitor')
    ) {
      return true;
    }

    // 过滤业务错误（如 "Failed to fetch blog info"）
    if (
      messageStr.includes('Failed to fetch') ||
      messageStr.includes('请求的数据源不存在')
    ) {
      return true;
    }

    return false;
  }

  /**
   * 检查错误是否应该被去重（短时间内相同错误不重复报告）
   * @param {string} message - 错误消息
   * @param {number} dedupWindow - 去重时间窗口（毫秒），默认 5 秒
   * @returns {boolean} 是否应该去重（true 表示应该跳过）
   */
  function shouldDeduplicateError(message, dedupWindow = 5000) {
    const messageStr = typeof message === 'string' ? message : String(message);
    const now = Date.now();

    // 生成错误标识（使用消息的前 100 个字符）
    const errorKey = messageStr.substring(0, 100);

    // 检查是否在时间窗口内
    const lastReportTime = monitorData.recentErrors.get(errorKey);
    if (lastReportTime && now - lastReportTime < dedupWindow) {
      return true; // 应该去重
    }

    // 更新最近报告时间
    monitorData.recentErrors.set(errorKey, now);

    // 清理过期的错误记录（保留最近 50 条）
    if (monitorData.recentErrors.size > 50) {
      const entries = Array.from(monitorData.recentErrors.entries());
      entries.sort((a, b) => b[1] - a[1]); // 按时间戳降序排序
      monitorData.recentErrors.clear();
      entries.slice(0, 50).forEach(([key, time]) => {
        monitorData.recentErrors.set(key, time);
      });
    }

    return false; // 不需要去重
  }

  // 简化的日志函数 - 只记录错误
  const logger = {
    error: (message, details = null) => {
      // 检查是否应该过滤
      if (shouldFilterError(message, details)) {
        return;
      }

      // ⭐ 关键修复：使用原始 console.error，避免被拦截器捕获形成循环
      // 只在开发环境或需要调试时输出错误日志
      // _originalConsoleError.call(
      //   console,
      //   '[Dev-Monitor ERROR]',
      //   message,
      //   details || '',
      // );

      const errorData = {
        message: typeof message === 'string' ? message : message.toString(),
        details: details ? JSON.stringify(details).substring(0, 500) : null, // 限制详细信息长度
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

      // ⭐ 注释掉调试日志以减少日志量（可选：需要调试时可以取消注释）
      // console.log('[DevMonitor] 🔍 Checking parent window:', {
      //   isInIframe: isInIframe,
      //   hasParent: hasParent,
      //   parentEqualsWindow: parentEqualsWindow,
      //   parentEqualsSelf: parentEqualsSelf,
      //   parentEqualsTop: parentEqualsTop,
      //   location: window.location.href,
      //   parentLocation: window.parent
      //     ? (() => {
      //         try {
      //           return window.parent.location?.href || 'N/A (cross-origin)';
      //         } catch (e) {
      //           return 'N/A (cross-origin - access denied)';
      //         }
      //       })()
      //     : 'N/A',
      //   topLocation: window.top
      //     ? (() => {
      //         try {
      //           return window.top.location?.href || 'N/A (cross-origin)';
      //         } catch (e) {
      //           return 'N/A (cross-origin - access denied)';
      //         }
      //       })()
      //     : 'N/A',
      // });

      // ⭐ 关键修复：使用 isInIframe 作为主要判断条件
      // 如果在 iframe 中（window.self !== window.top），就尝试发送消息
      if (isInIframe && window.parent) {
        try {
          // ⭐ 检查白屏状态
          const { documentString, isWhiteScreen } = checkWhiteScreen();

          const errorMessage = {
            type: 'dev-monitor-error', // 实时错误消息类型
            error: errorData,
            errorCount: monitorData.errors.length,
            url: monitorData.basicInfo.url,
            timestamp: Date.now(),
            isWhiteScreen, // 白屏检查结果
            ...(documentString && {
              documentString,
            }), // 仅在白屏时包含 document 字符串
          };
          // ⭐ 发送错误消息到父窗口
          window.parent.postMessage(errorMessage, '*');
        } catch (e) {
          // 发送错误消息失败（静默处理，避免日志污染）
          // _originalConsoleError.call(console, '[DevMonitor] ❌ Failed to send error message:', e);
        }
      }
      // else {
      //   // 不在 iframe 中，无法发送消息（静默处理）
      // }
    },
  };

  /**
   * 从 console 参数中提取错误信息
   * @param {Array} args - console 方法的参数
   * @returns {object} 提取的错误信息
   */
  function extractErrorInfo(args) {
    let errorMessage = '';
    let errorStack = null;
    let errorDetails = null;

    // 尝试从参数中提取错误信息
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg instanceof Error) {
        errorMessage = arg.message || errorMessage;
        errorStack = arg.stack || null;
        errorDetails = {
          name: arg.name,
          message: arg.message,
          stack: arg.stack ? arg.stack.substring(0, 500) : null,
        };
      } else if (typeof arg === 'string') {
        if (!errorMessage) {
          errorMessage = arg;
        } else {
          errorMessage += ' ' + arg;
        }
      } else if (typeof arg === 'object' && arg !== null) {
        try {
          const jsonStr = JSON.stringify(arg);
          if (jsonStr.length < 200) {
            errorDetails = errorDetails || {};
            Object.assign(errorDetails, arg);
          }
        } catch (e) {
          // 忽略序列化错误
        }
      }
    }

    return {
      message: errorMessage || args.map((a) => String(a)).join(' '),
      stack: errorStack,
      details: errorDetails,
    };
  }

  /**
   * 设置 Console 拦截
   * 拦截 console.error 和 console.warn，捕获 React Router 等框架的错误
   */
  function setupConsoleInterception() {
    // 使用全局保存的原始 console 方法（在脚本开头已保存）
    const originalConsoleError = _originalConsoleError;
    const originalConsoleWarn = _originalConsoleWarn;

    // 拦截 console.error
    console.error = function (...args) {
      try {
        // 将参数转换为字符串进行检查（更全面的转换）
        const errorText = args
          .map((arg) => {
            if (arg instanceof Error) {
              return arg.name + ': ' + arg.message + ' ' + (arg.stack || '');
            }
            if (typeof arg === 'object' && arg !== null) {
              try {
                return JSON.stringify(arg);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        // 检查是否是 React Router 错误或其他框架错误（更宽松的匹配）
        const isReactRouterError =
          errorText.includes('Error handled by React Router') ||
          errorText.includes('Error handled by') ||
          errorText.includes('ErrorBoundary') ||
          errorText.includes('React Router') ||
          errorText.includes('react-router') ||
          errorText.includes('default ErrorBoundary');

        // 检查是否是其他需要捕获的错误（包括所有常见错误类型）
        const isImportantError =
          errorText.includes('Uncaught') ||
          errorText.includes('Unhandled') ||
          errorText.includes('TypeError') ||
          errorText.includes('ReferenceError') ||
          errorText.includes('SyntaxError') ||
          errorText.includes('RangeError') ||
          errorText.includes('URIError') ||
          errorText.includes('EvalError');

        // 如果匹配到任何错误，都进行捕获
        if (isReactRouterError || isImportantError) {
          const errorInfo = extractErrorInfo(args);
          const fullMessage = errorInfo.message || errorText;

          // ⭐ 去重检查：避免短时间内重复报告相同错误
          if (shouldDeduplicateError(fullMessage, 5000)) {
            // 错误在 5 秒内已报告过，跳过
            return;
          }

          // 记录到 logger（会自动发送到父窗口）
          logger.error(fullMessage, {
            source: 'console.error',
            isReactRouterError,
            isImportantError,
            stack: errorInfo.stack,
            originalArgs: args.map((a) => {
              if (a instanceof Error) {
                return {
                  type: 'Error',
                  name: a.name,
                  message: a.message,
                  stack: a.stack ? a.stack.substring(0, 500) : null,
                };
              }
              return typeof a === 'object' && a !== null
                ? '[Object]'
                : String(a);
            }),
            ...errorInfo.details,
          });
        }
      } catch (e) {
        // 拦截器本身的错误不应该影响原始功能（静默处理）
        // 使用原始 console.error 避免循环调用
        // originalConsoleError.call(console, '[DevMonitor] Console interception error:', e);
      }

      // 调用原始方法
      originalConsoleError.apply(console, args);
    };

    // 拦截 console.warn（某些框架可能使用 warn 而不是 error）
    console.warn = function (...args) {
      try {
        const errorText = args
          .map((arg) => {
            if (arg instanceof Error) {
              return arg.name + ': ' + arg.message + ' ' + (arg.stack || '');
            }
            if (typeof arg === 'object' && arg !== null) {
              try {
                return JSON.stringify(arg);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        // 检查是否是重要的警告（可能表示错误）
        const isImportantWarning =
          errorText.includes('Error handled by React Router') ||
          errorText.includes('Error handled by') ||
          errorText.includes('ErrorBoundary') ||
          errorText.includes('default ErrorBoundary') ||
          errorText.includes('Warning:') ||
          errorText.includes('Failed to') ||
          errorText.includes('ReferenceError') ||
          errorText.includes('TypeError');

        if (isImportantWarning) {
          const errorInfo = extractErrorInfo(args);
          const fullMessage = errorInfo.message || errorText;

          // ⭐ 去重检查：避免短时间内重复报告相同错误
          if (shouldDeduplicateError(fullMessage, 5000)) {
            // 错误在 5 秒内已报告过，跳过
            return;
          }

          logger.error(fullMessage, {
            source: 'console.warn',
            isImportantWarning,
            stack: errorInfo.stack,
            originalArgs: args.map((a) => {
              if (a instanceof Error) {
                return {
                  type: 'Error',
                  name: a.name,
                  message: a.message,
                  stack: a.stack ? a.stack.substring(0, 500) : null,
                };
              }
              return typeof a === 'object' && a !== null
                ? '[Object]'
                : String(a);
            }),
            ...errorInfo.details,
          });
        }
      } catch (e) {
        // 拦截器本身的错误不应该影响原始功能（静默处理）
        // 使用原始 console.warn 避免循环调用
        // originalConsoleWarn.call(console, '[DevMonitor] Console interception error:', e);
      }

      // 调用原始方法
      originalConsoleWarn.apply(console, args);
    };
  }

  /**
   * 检查 DOM 元素是否是错误 UI
   * @param {Node} node - DOM 节点
   * @returns {boolean} 是否是错误 UI
   */
  function isErrorUI(node) {
    if (!node || node.nodeType !== 1) {
      // 不是元素节点
      return false;
    }

    try {
      const element = node;
      const tagName = element.tagName?.toLowerCase() || '';
      const className = element.className || '';
      const id = element.id || '';
      const textContent = element.textContent || '';
      const innerHTML = element.innerHTML || '';

      // 检查类名、ID、文本内容中是否包含错误相关关键词
      const errorKeywords = [
        'error',
        'ErrorBoundary',
        'error-boundary',
        'react-error-boundary',
        'error-page',
        'error-page-container',
        'Something went wrong',
        '出错了',
        '错误',
      ];

      const hasErrorKeyword =
        errorKeywords.some(
          (keyword) =>
            className.includes(keyword) ||
            id.includes(keyword) ||
            textContent.includes(keyword) ||
            innerHTML.includes(keyword),
        ) ||
        // 检查常见的错误 UI 特征
        textContent.includes('Error handled by React Router') ||
        textContent.includes('Something went wrong') ||
        (tagName === 'div' &&
          (className.includes('error') || id.includes('error')));

      return hasErrorKeyword;
    } catch (e) {
      // 如果检查过程中出错，保守处理
      return false;
    }
  }

  /**
   * 设置 MutationObserver 监听 DOM 变化
   * 检测错误 UI 的出现
   */
  function setupMutationObserver() {
    if (!config.mutationObserverEnabled || !window.MutationObserver) {
      return;
    }

    try {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (isErrorUI(node)) {
              // 生成唯一标识符（基于元素的位置和内容）
              const elementId =
                node.id ||
                node.className ||
                (node.textContent ? node.textContent.substring(0, 50) : '') +
                  Date.now();

              // 避免重复报告同一个错误元素
              if (!monitorData.detectedErrorElements.has(elementId)) {
                monitorData.detectedErrorElements.add(elementId);

                // 限制已检测元素的数量
                if (monitorData.detectedErrorElements.size > 50) {
                  const firstKey = monitorData.detectedErrorElements
                    .values()
                    .next().value;
                  monitorData.detectedErrorElements.delete(firstKey);
                }

                // 提取错误信息
                const errorText =
                  node.textContent || node.innerHTML || 'Error UI detected';
                const elementHTML = node.outerHTML
                  ? node.outerHTML.substring(0, 500)
                  : '';

                // ⭐ 去重检查：避免短时间内重复报告相同错误 UI
                const errorKey = `error-ui-${elementId}`;
                if (!shouldDeduplicateError(errorKey, 5000)) {
                  logger.error('Error UI detected in DOM', {
                    source: 'mutation-observer',
                    elementId,
                    errorText: errorText.substring(0, 200),
                    elementHTML,
                    tagName: node.tagName,
                    className: node.className,
                    id: node.id,
                  });
                }
              }
            }
          });
        });
      });

      // 开始观察 DOM 变化
      observer.observe(document.body || document.documentElement, {
        childList: true, // 监听子节点的添加和删除
        subtree: true, // 监听所有后代节点
        attributes: false, // 不监听属性变化（减少性能开销）
      });

      // MutationObserver 初始化成功（静默）
    } catch (e) {
      // MutationObserver 初始化失败（静默）
    }
  }

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
            source: 'window.error',
          });
        }
        // 资源加载错误
        else if (event.target.tagName) {
          const source = event.target.src || event.target.href || 'unknown';
          // 只保存相对地址
          const relativeSource = source.replace(
            window.location.origin + window.location.pathname,
            '',
          );
          logger.error(`Resource failed: ${relativeSource}`, {
            tagName: event.target.tagName,
            source: relativeSource,
            errorSource: 'resource-load',
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
          source: 'unhandledrejection',
        };
      } else if (typeof event.reason === 'string') {
        errorMsg += event.reason;
        errorDetails = {
          message: event.reason,
          source: 'unhandledrejection',
        };
      } else {
        errorMsg += JSON.stringify(event.reason).substring(0, 200);
        errorDetails = {
          reason: event.reason,
          source: 'unhandledrejection',
        };
      }

      logger.error(errorMsg, errorDetails);
    });

    // ⭐ Console 拦截已在 init() 中优先设置，这里不需要重复调用
    // setupConsoleInterception(); // 已在 init() 中调用

    // ⭐ 新增：MutationObserver（检测错误 UI）
    if (config.mutationObserverEnabled) {
      // 延迟初始化，确保 DOM 已加载
      if (document.body) {
        setupMutationObserver();
      } else {
        window.addEventListener('DOMContentLoaded', setupMutationObserver);
      }
    }
  }

  // 移除复杂的性能监控和控制台拦截，专注于核心错误监控

  // 浏览记录变化监听
  function setupHistoryTracking() {
    // 记录当前 URL 和 hash，用于检测变化
    let currentUrl = window.location.href;
    let currentHash = window.location.hash;

    // ⭐ 维护可导航历史记录栈，用于判断前进/后退方向
    const navigableHistory = [];
    let currentIndex = -1; // 当前在历史记录栈中的索引

    // 监听 hashchange 事件（hash 变化）
    window.addEventListener('hashchange', function () {
      const newUrl = window.location.href;
      const newHash = window.location.hash;
      if (newHash !== currentHash) {
        currentUrl = newUrl;
        currentHash = newHash;
        // ⭐ hashchange 会增加历史记录
        navigableHistory.push({
          url: newUrl,
          pathname: window.location.pathname + newHash,
          timestamp: Date.now(),
        });
        currentIndex = navigableHistory.length - 1;
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

        // ⭐ 判断是前进还是后退
        // 在历史记录栈中查找目标 URL 的位置
        let targetIndex = -1;
        const newPathname = window.location.pathname + newHash;
        for (let i = navigableHistory.length - 1; i >= 0; i--) {
          if (
            navigableHistory[i].url === newUrl ||
            navigableHistory[i].pathname === newPathname
          ) {
            targetIndex = i;
            break;
          }
        }

        // 判断方向
        let direction = 'unknown'; // 默认未知
        if (targetIndex !== -1 && targetIndex !== currentIndex) {
          if (targetIndex < currentIndex) {
            direction = 'back'; // 后退
          } else if (targetIndex > currentIndex) {
            direction = 'forward'; // 前进
          }
          currentIndex = targetIndex;
        } else if (targetIndex === -1) {
          // 找不到目标 URL，可能是跳转到历史记录之外
          // 将新 URL 添加到历史记录末尾
          navigableHistory.push({
            url: newUrl,
            pathname: newPathname,
            timestamp: Date.now(),
          });
          currentIndex = navigableHistory.length - 1;
          direction = 'forward'; // 视为前进
        }

        sendHistoryChange(
          'popstate',
          newUrl,
          newPathname,
          null,
          direction, // ⭐ 传递方向信息
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
        // ⭐ pushState 会增加历史记录
        navigableHistory.push({
          url: newUrl,
          pathname: window.location.pathname + newHash,
          timestamp: Date.now(),
        });
        currentIndex = navigableHistory.length - 1;
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
        // ⭐ replaceState 替换当前位置，不改变索引
        if (navigableHistory.length === 0) {
          navigableHistory.push({
            url: newUrl,
            pathname: window.location.pathname + newHash,
            timestamp: Date.now(),
          });
          currentIndex = 0;
        } else if (
          currentIndex >= 0 &&
          currentIndex < navigableHistory.length
        ) {
          navigableHistory[currentIndex] = {
            url: newUrl,
            pathname: window.location.pathname + newHash,
            timestamp: Date.now(),
          };
        }
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
     * @param {string} direction - 方向信息（仅 popstate 时使用）: 'back' | 'forward' | 'unknown'
     */
    function sendHistoryChange(
      type,
      url,
      pathname,
      state = null,
      direction = null,
    ) {
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
        ...(direction && { direction }), // ⭐ 仅在 popstate 时包含方向信息
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
          // ⭐ 检查白屏状态
          const { documentString, isWhiteScreen } = checkWhiteScreen();

          const message = {
            type: 'dev-monitor-history-change',
            ...changeData,
            isWhiteScreen, // 白屏检查结果
            ...(documentString && {
              documentString,
            }), // 仅在白屏时包含 document 字符串
          };

          window.parent.postMessage(message, '*');
        } catch (e) {
          // 静默处理错误
        }
      }
    }

    // 初始发送当前 URL
    setTimeout(() => {
      // ⭐ 初始化历史记录栈
      navigableHistory.push({
        url: currentUrl,
        pathname: window.location.pathname + currentHash,
        timestamp: Date.now(),
      });
      currentIndex = 0;
      sendHistoryChange(
        'initial',
        currentUrl,
        window.location.pathname + currentHash,
      );
    }, 100);
  }

  /**
   * 同步登录状态
   * 当 URL 有 token 参数时，将其写入 cookie（key: ticket）
   * 用于小程序内同步登录状态
   */
  function syncLoginStatus() {
    try {
      // 获取 URL 参数中的 token
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      // 如果存在 token 参数
      if (token) {
        // 解码 token 值
        const decodedToken = decodeURIComponent(token);

        // 计算 30 天后的过期时间
        const expiresDate = new Date();
        expiresDate.setTime(expiresDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 天

        // 设置 cookie
        // key: ticket, value: 解码后的 token
        // 同域名（不设置 domain，使用当前域名）
        // 30 天有效（使用 expires）
        // path: /（根路径，确保全站可用）
        // SameSite: Lax（允许跨站请求携带 cookie）
        document.cookie = `ticket=${decodedToken}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax`;

        // 可选：如果需要调试，可以取消注释下面的日志
        // _originalConsoleError.call(console, '[DevMonitor] ✅ Login status synced: ticket cookie set');
      }
    } catch (error) {
      // 静默处理错误，避免影响页面正常功能
      // _originalConsoleError.call(console, '[DevMonitor] ❌ Failed to sync login status:', error);
    }
  }

  /**
   * 设置微信小程序相关功能
   * 包括：注入 JS-SDK、监听 DOM 变化并发送消息到小程序
   */
  function setupWeChatMiniProgram() {
    // 检查是否在微信小程序的 webview 环境中
    if (window.__wxjs_environment !== 'miniprogram') {
      return; // 不在小程序环境中，直接返回
    }

    /**
     * 检查并设置消息发送功能
     * 如果 JS-SDK 已加载，直接设置；否则注入脚本后设置
     */
    function trySetupMessage() {
      // 检查 wx.miniProgram 是否可用
      if (
        window.wx &&
        window.wx.miniProgram &&
        window.wx.miniProgram.postMessage
      ) {
        setupMiniProgramMessage();
        return true;
      }
      return false;
    }

    /**
     * 注入微信 JS-SDK
     */
    function injectWeChatSDK() {
      // 如果 JS-SDK 已加载，直接设置消息发送功能
      if (trySetupMessage()) {
        return;
      }

      // 检查是否已经注入过脚本（避免重复注入）
      if (document.querySelector('script[id="wechat-js-sdk"]')) {
        // 脚本已存在，等待加载完成
        const checkInterval = setInterval(() => {
          if (trySetupMessage()) {
            clearInterval(checkInterval);
          }
        }, 100);

        // 10 秒后停止检查
        setTimeout(() => clearInterval(checkInterval), 10000);
        return;
      }

      // 创建并注入 JS-SDK 脚本
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.id = 'wechat-js-sdk';
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.3.2.js';

      // 脚本加载成功回调
      script.onload = function () {
        // 等待 wx 对象可用
        setTimeout(() => {
          trySetupMessage();
        }, 100);
      };

      // 插入脚本到 head（确保 DOM 已准备好）
      const insertScript = () => {
        if (document.head) {
          document.head.appendChild(script);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertScript);
      } else {
        insertScript();
      }
    }

    /**
     * 设置小程序消息发送功能
     * 监听 DOM 变化并通过 wx.miniProgram.postMessage 发送页面内容
     * 参考 PagePreviewIframe 组件的实现逻辑
     */
    function setupMiniProgramMessage() {
      // 确保 document.body 存在
      if (!document.body) {
        if (document.readyState === 'loading') {
          document.addEventListener(
            'DOMContentLoaded',
            setupMiniProgramMessage,
          );
        } else {
          setTimeout(setupMiniProgramMessage, 100);
        }
        return;
      }

      let timer = null;

      // 监听 DOM 变化
      const observer = new MutationObserver(() => {
        // 每次变化后延迟 500ms 再检测，确保渲染稳定
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            // 获取 head 中的 title 内容
            const htmlTitle =
              document.querySelector('head > title')?.textContent || '页面预览';

            // 获取 body 的 HTML 内容
            const htmlDomString = document.body.innerHTML || '';

            // 通过 postMessage 发送消息到小程序（已确保 wx.miniProgram 可用）
            window.wx.miniProgram.postMessage({
              data: {
                html: htmlDomString,
                title: htmlTitle,
              },
            });
          } catch (error) {
            // 静默处理错误（避免影响页面正常功能）
          }
        }, 500);
      });

      // 开始观察 DOM 变化
      observer.observe(document.body, {
        childList: true, // 监听子节点的添加和删除
        subtree: true, // 监听所有后代节点
        characterData: true, // 监听文本内容变化
      });
    }

    // 根据 DOM 状态决定何时注入 JS-SDK
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectWeChatSDK);
    } else {
      injectWeChatSDK();
    }
  }

  // 简化的初始化
  function init() {
    // ⭐ 优先同步登录状态（在页面加载时立即执行）
    // 当 URL 有 token 参数时，将其写入 cookie（key: ticket）
    syncLoginStatus();

    // ⭐ 关键：优先设置 Console 拦截，确保在 React Router 加载之前就拦截
    // 这样可以捕获所有通过 console.error 输出的错误
    setupConsoleInterception();

    setupErrorMonitoring();
    setupHistoryTracking();

    // ⭐ 设置微信小程序相关功能（在最后执行，确保其他功能已初始化）
    setupWeChatMiniProgram();

    monitorData.ready = true;
  }

  // 立即初始化
  init();
})();
